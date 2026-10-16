import { useCallback, useEffect, useRef, useState } from 'react';

const EMPTY = { vcd: '', netlistUrl: null, netlistTree: null, loading: false };
// Submodules are drawn by the worker when first opened: poll until the schematic is there
const MODULE_POLL_MS = 800;
const MODULE_TIMEOUT_MS = 90 * 1000;

/**
 * Loads waveform (VCD text), netlist (SVG of the top module as object URL) and the module
 * hierarchy of a finished simulation. `loadNetlistModule(key)` fetches the schematic of any
 * module of the hierarchy ({ url, hotspots }), waiting while the worker draws it.
 * The endpoints need the auth token, so they can't be used as plain links/img sources.
 */
export default function useSimArtifacts(apiCall, simulationId, { hasWaveform, hasNetlist }) {
  const [artifacts, setArtifacts] = useState(EMPTY);
  // key -> { url, hotspots } of the current simulation; object URLs are revoked on change
  const moduleCache = useRef(new Map());

  useEffect(() => {
    const cache = new Map();
    moduleCache.current = cache;
    const revokeModules = () => cache.forEach(entry => URL.revokeObjectURL(entry.url));

    if (!simulationId || (!hasWaveform && !hasNetlist)) {
      setArtifacts(EMPTY);
      return revokeModules;
    }

    let cancelled = false;
    let objectUrl = null;
    setArtifacts({ ...EMPTY, loading: true });

    const loadWaveform = async () => {
      if (!hasWaveform) return '';
      const res = await apiCall(`/simulations/${simulationId}/waveform`);
      return res.ok ? res.text() : '';
    };
    const loadNetlist = async () => {
      if (!hasNetlist) return null;
      const res = await apiCall(`/simulations/${simulationId}/netlist`);
      if (!res.ok) return null;
      // Shown via <img>, where the SVG can't run scripts or load external resources.
      return URL.createObjectURL(new Blob([await res.text()], { type: 'image/svg+xml' }));
    };
    // Missing for simulations from before the hierarchy view: the viewer then shows the top only
    const loadTree = async () => {
      if (!hasNetlist) return null;
      const res = await apiCall(`/simulations/${simulationId}/netlist/tree`);
      return res.ok ? res.json() : null;
    };

    Promise.allSettled([loadWaveform(), loadNetlist(), loadTree()]).then(([wave, netlist, tree]) => {
      objectUrl = netlist.status === 'fulfilled' ? netlist.value : null;
      if (cancelled) {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        return;
      }
      setArtifacts({
        vcd: wave.status === 'fulfilled' ? wave.value : '',
        netlistUrl: objectUrl,
        netlistTree: tree.status === 'fulfilled' ? tree.value : null,
        loading: false,
      });
    });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      revokeModules();
    };
  }, [apiCall, simulationId, hasWaveform, hasNetlist]);

  const loadNetlistModule = useCallback(async (key, signal) => {
    const cache = moduleCache.current;
    if (cache.has(key)) return cache.get(key);
    const deadline = Date.now() + MODULE_TIMEOUT_MS;
    while (Date.now() < deadline) {
      if (signal?.aborted || cache !== moduleCache.current) throw new DOMException('aborted', 'AbortError');
      const res = await apiCall(`/simulations/${simulationId}/netlist/modules/${key}`);
      if (res.status === 202) {
        await new Promise(r => setTimeout(r, MODULE_POLL_MS));
        continue;
      }
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body.status !== 'done') throw new Error(body.error || `HTTP ${res.status}`);
      if (cache !== moduleCache.current) throw new DOMException('aborted', 'AbortError');
      const entry = { url: URL.createObjectURL(new Blob([body.svg], { type: 'image/svg+xml' })), hotspots: body.hotspots || [] };
      cache.set(key, entry);
      return entry;
    }
    throw new Error('timeout');
  }, [apiCall, simulationId]);

  return { ...artifacts, loadNetlistModule };
}

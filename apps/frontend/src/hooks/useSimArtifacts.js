import { useEffect, useState } from 'react';

const EMPTY = { vcd: '', netlistUrl: null, loading: false };

/**
 * Loads waveform (VCD text) and netlist (SVG as object URL) of a finished simulation.
 * Both endpoints need the auth token, so they can't be used as plain links/img sources.
 */
export default function useSimArtifacts(apiCall, simulationId, { hasWaveform, hasNetlist }) {
  const [artifacts, setArtifacts] = useState(EMPTY);

  useEffect(() => {
    if (!simulationId || (!hasWaveform && !hasNetlist)) {
      setArtifacts(EMPTY);
      return undefined;
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

    Promise.allSettled([loadWaveform(), loadNetlist()]).then(([wave, netlist]) => {
      objectUrl = netlist.status === 'fulfilled' ? netlist.value : null;
      if (cancelled) {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        return;
      }
      setArtifacts({
        vcd: wave.status === 'fulfilled' ? wave.value : '',
        netlistUrl: objectUrl,
        loading: false,
      });
    });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [apiCall, simulationId, hasWaveform, hasNetlist]);

  return artifacts;
}

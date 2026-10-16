import { useEffect, useMemo, useRef, useState } from 'react';
import './Workbench.css';
import './WaveformViewer.css';

const TRANSLATIONS = {
  de: {
    zoomIn: 'Hineinzoomen',
    zoomOut: 'Herauszoomen',
    fit: 'Einpassen',
    fitLabel: 'Fit',
    download: 'SVG herunterladen',
    alt: 'Schaltplan des Moduls',
    hint: 'Mausrad: Zoom · Ziehen: Verschieben · Klick auf ein Untermodul: öffnen',
    up: 'Übergeordnetes Modul',
    jump: 'Modul der Hierarchie öffnen',
    open: (inst, name) => `${inst} : ${name} öffnen`,
    drawing: name => `Schaltplan von ${name} wird erzeugt …`,
    failed: (name, error) => `Schaltplan von ${name} nicht verfügbar: ${error}`,
    truncated: '(Hierarchie gekürzt)',
  },
  en: {
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    fit: 'Fit to view',
    fitLabel: 'Fit',
    download: 'Download SVG',
    alt: 'Schematic of the module',
    hint: 'Wheel: zoom · Drag: pan · Click a submodule: open it',
    up: 'Parent module',
    jump: 'Open a module of the hierarchy',
    open: (inst, name) => `Open ${inst} : ${name}`,
    drawing: name => `Drawing the schematic of ${name} …`,
    failed: (name, error) => `Schematic of ${name} not available: ${error}`,
    truncated: '(hierarchy truncated)',
  },
};

const MIN_SCALE = 0.1;
const MAX_SCALE = 8;
const MAX_FIT_SCALE = 2.5;
const FIT_MARGIN = 24;
// Entries of the module list; large generate loops produce thousands of instances
const MAX_JUMP_ENTRIES = 500;
// Pointer movement (px) up to which a press on a submodule counts as a click, not a pan
const CLICK_SLOP = 4;

/** Instance tree flattened for the module list: [{ path: [indices], label }] */
function flattenTree(tree) {
  const out = [];
  const walk = (node, path, depth) => {
    if (out.length >= MAX_JUMP_ENTRIES) return;
    out.push({ path, label: `${'  '.repeat(depth)}${depth ? `${node.inst} : ` : ''}${node.name}` });
    node.children.forEach((child, i) => walk(child, [...path, i], depth + 1));
  };
  walk(tree, [], 0);
  return out;
}

const nodesAt = (tree, indices) => indices.reduce((nodes, i) => [...nodes, nodes[nodes.length - 1].children[i]], [tree]);

/**
 * Pan/zoom view of the design's schematic. `svgUrl` is an object URL of the top module's
 * SVG rendered from the Yosys netlist; it is shown via <img>, so nothing inside the SVG
 * can execute.
 * With `hierarchy` ({ topKey, tree, truncated }, see GET .../netlist/tree) and `loadModule`
 * (key -> Promise<{ url, hotspots }>) submodules can be opened: by the path bar, the module
 * list or a click on a submodule box (hotspots are laid over the image).
 */
export default function NetlistViewer({ svgUrl, hierarchy = null, loadModule = null, uiLanguage = 'de', emptyMessage }) {
  const t = TRANSLATIONS[uiLanguage] || TRANSLATIONS.de;
  const boxRef = useRef(null);
  const [natural, setNatural] = useState(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  // Until the user pans or zooms, the schematic keeps fitting itself to the panel size.
  const autoFitRef = useRef(true);
  const draggedRef = useRef(false);

  const tree = loadModule ? hierarchy?.tree ?? null : null;
  // Opened module as child indices from the top; instance names survive a new simulation
  const [pathIdx, setPathIdx] = useState([]);
  const instPathRef = useRef([]);
  const path = useMemo(() => {
    if (!tree) return [];
    try {
      return nodesAt(tree, pathIdx);
    } catch {
      return [tree];
    }
  }, [tree, pathIdx]);
  const current = path[path.length - 1] ?? null;
  const jumpList = useMemo(() => (tree ? flattenTree(tree) : []), [tree]);

  // New simulation: stay in the same instance if it still exists
  useEffect(() => {
    if (!tree) return;
    const indices = [];
    let node = tree;
    for (const inst of instPathRef.current) {
      const i = node.children.findIndex(c => c.inst === inst);
      if (i < 0) break;
      indices.push(i);
      node = node.children[i];
    }
    setPathIdx(indices);
  }, [tree]);

  const openPath = indices => {
    setPathIdx(indices);
    if (tree) instPathRef.current = nodesAt(tree, indices).slice(1).map(n => n.inst);
  };

  // Schematic of the opened module: { key, url, hotspots, error }
  const [view, setView] = useState(null);
  useEffect(() => {
    if (!current || !loadModule) {
      setView(null);
      return undefined;
    }
    const controller = new AbortController();
    setView({ key: current.key, url: null, hotspots: [], error: null });
    loadModule(current.key, controller.signal).then(
      ({ url, hotspots }) => !controller.signal.aborted && setView({ key: current.key, url, hotspots, error: null }),
      err => !controller.signal.aborted && err?.name !== 'AbortError'
        && setView({ key: current.key, url: null, hotspots: [], error: err?.message || String(err) })
    );
    return () => controller.abort();
  }, [current, loadModule]);

  // The top module is already loaded; without hierarchy it's all there is
  const imageUrl = tree ? view?.url ?? (path.length === 1 ? svgUrl : null) : svgUrl;
  const hotspots = tree && view?.url ? view.hotspots : [];

  const fit = () => {
    const box = boxRef.current;
    if (!box || !natural || box.clientWidth === 0 || box.clientHeight === 0) return;
    const scale = Math.max(MIN_SCALE, Math.min(
      (box.clientWidth - 2 * FIT_MARGIN) / natural.width,
      (box.clientHeight - 2 * FIT_MARGIN) / natural.height,
      MAX_FIT_SCALE
    ));
    setTransform({
      scale,
      x: (box.clientWidth - natural.width * scale) / 2,
      y: (box.clientHeight - natural.height * scale) / 2,
    });
  };
  const fitRef = useRef(fit);
  fitRef.current = fit;

  useEffect(() => {
    setNatural(null);
    autoFitRef.current = true;
  }, [imageUrl]);

  useEffect(() => {
    fitRef.current();
  }, [natural]);

  // `anchor` (px inside the box) stays put while zooming, e.g. the pointer position.
  const zoomBy = (factor, anchor) => {
    autoFitRef.current = false;
    setTransform(prev => {
      const box = boxRef.current;
      const ax = anchor ? anchor.x : (box?.clientWidth || 0) / 2;
      const ay = anchor ? anchor.y : (box?.clientHeight || 0) / 2;
      const scale = Math.min(Math.max(prev.scale * factor, MIN_SCALE), MAX_SCALE);
      const ratio = scale / prev.scale;
      return { scale, x: ax - (ax - prev.x) * ratio, y: ay - (ay - prev.y) * ratio };
    });
  };
  const zoomRef = useRef(zoomBy);
  zoomRef.current = zoomBy;

  const hasImage = !!svgUrl || !!tree;
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return undefined;
    // React registers wheel listeners as passive, but zooming must prevent page scrolling.
    const onWheel = e => {
      e.preventDefault();
      const rect = box.getBoundingClientRect();
      zoomRef.current(e.deltaY > 0 ? 0.87 : 1.15, { x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    box.addEventListener('wheel', onWheel, { passive: false });
    const observer = new ResizeObserver(() => {
      if (autoFitRef.current) fitRef.current();
    });
    observer.observe(box);
    return () => {
      box.removeEventListener('wheel', onWheel);
      observer.disconnect();
    };
  }, [hasImage]);

  if (!hasImage) {
    return <div className="wb-empty">{emptyMessage}</div>;
  }

  const startPan = e => {
    if (e.button !== 0) return;
    e.preventDefault();
    draggedRef.current = false;
    const start = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y };
    const onMove = ev => {
      if (!draggedRef.current && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) <= CLICK_SLOP) return;
      draggedRef.current = true;
      autoFitRef.current = false;
      setTransform(prev => ({ ...prev, x: start.tx + ev.clientX - start.x, y: start.ty + ev.clientY - start.y }));
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const openChild = cell => {
    if (draggedRef.current) return;
    const i = current?.children.findIndex(c => c.inst === cell) ?? -1;
    if (i >= 0) openPath([...pathIdx, i]);
  };

  const imageStyle = natural ? {
    width: natural.width * transform.scale,
    height: natural.height * transform.scale,
    transform: `translate(${transform.x}px, ${transform.y}px)`,
  } : null;

  return (
    <div className="netlist-viewer">
      <div className="wave-toolbar">
        {tree && (
          <>
            <button
              type="button"
              className="wb-btn wb-tool-btn"
              onClick={() => openPath(pathIdx.slice(0, -1))}
              disabled={path.length <= 1}
              title={t.up}
              aria-label={t.up}
            >
              ↑
            </button>
            <nav className="netlist-path" aria-label={t.jump}>
              {path.map((node, depth) => {
                const label = depth === 0 ? node.name : node.inst;
                const last = depth === path.length - 1;
                return (
                  <span key={depth} className="netlist-path-item">
                    {depth > 0 && <span className="netlist-path-sep">›</span>}
                    {last
                      ? <strong title={`${node.inst} : ${node.name}`}>{label}</strong>
                      : <button type="button" className="netlist-path-link" onClick={() => openPath(pathIdx.slice(0, depth))} title={`${node.inst} : ${node.name}`}>{label}</button>}
                  </span>
                );
              })}
              {current && path.length > 1 && <span className="wave-info">: {current.name}</span>}
            </nav>
            {jumpList.length > 1 && (
              <select
                className="netlist-jump"
                value={pathIdx.join('/')}
                onChange={e => openPath(e.target.value ? e.target.value.split('/').map(Number) : [])}
                title={t.jump}
                aria-label={t.jump}
              >
                {jumpList.map(entry => (
                  <option key={entry.path.join('/')} value={entry.path.join('/')}>{entry.label}</option>
                ))}
              </select>
            )}
            {hierarchy?.truncated && <span className="wave-info">{t.truncated}</span>}
          </>
        )}
        <span className="wave-info">{Math.round(transform.scale * 100)} %</span>
        <span className="wave-toolbar-spacer" />
        <span className="wave-info wave-hint" title={t.hint} aria-label={t.hint}>ⓘ</span>
        {imageUrl && (
          <a className="wb-tool-btn" href={imageUrl} download={`${current?.name || 'netlist'}.svg`} title={t.download}>SVG</a>
        )}
        <button type="button" className="wb-btn wb-tool-btn" onClick={() => zoomBy(1.25)} title={t.zoomIn} aria-label={t.zoomIn}>+</button>
        <button type="button" className="wb-btn wb-tool-btn" onClick={() => zoomBy(0.8)} title={t.zoomOut} aria-label={t.zoomOut}>−</button>
        <button
          type="button"
          className="wb-btn wb-tool-btn"
          onClick={() => {
            autoFitRef.current = true;
            fit();
          }}
          title={t.fit}
        >
          {t.fitLabel}
        </button>
      </div>
      <div className="netlist-canvas" ref={boxRef} onPointerDown={startPan}>
        {imageUrl && (
          <img
            key={imageUrl}
            className="netlist-img"
            src={imageUrl}
            alt={t.alt}
            draggable={false}
            onLoad={e => setNatural({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })}
            style={{
              // Sized through width/height (not a CSS scale), so the SVG is re-rendered sharply at every zoom level.
              ...imageStyle,
              visibility: natural ? 'visible' : 'hidden',
            }}
          />
        )}
        {imageUrl && natural && hotspots.length > 0 && (
          <div className="netlist-hotspots" style={imageStyle}>
            {hotspots.map(h => {
              const child = current?.children.find(c => c.inst === h.cell);
              if (!child) return null;
              return (
                <button
                  key={h.cell}
                  type="button"
                  className="netlist-hotspot"
                  style={{
                    left: h.x * transform.scale,
                    top: h.y * transform.scale,
                    width: h.w * transform.scale,
                    height: h.h * transform.scale,
                  }}
                  title={t.open(child.inst, child.name)}
                  aria-label={t.open(child.inst, child.name)}
                  onClick={() => openChild(h.cell)}
                />
              );
            })}
          </div>
        )}
        {!imageUrl && current && (
          <div className="wb-empty">{view?.error ? t.failed(current.name, view.error) : t.drawing(current.name)}</div>
        )}
      </div>
    </div>
  );
}

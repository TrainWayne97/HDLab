import { useEffect, useRef, useState } from 'react';
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
    hint: 'Mausrad: Zoom · Ziehen: Verschieben',
  },
  en: {
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    fit: 'Fit to view',
    fitLabel: 'Fit',
    download: 'Download SVG',
    alt: 'Schematic of the module',
    hint: 'Wheel: zoom · Drag: pan',
  },
};

const MIN_SCALE = 0.1;
const MAX_SCALE = 8;
const MAX_FIT_SCALE = 2.5;
const FIT_MARGIN = 24;

/**
 * Pan/zoom view of the design's schematic. `svgUrl` is an object URL of the SVG rendered
 * from the Yosys netlist; it is shown via <img>, so nothing inside the SVG can execute.
 */
export default function NetlistViewer({ svgUrl, uiLanguage = 'de', emptyMessage }) {
  const t = TRANSLATIONS[uiLanguage] || TRANSLATIONS.de;
  const boxRef = useRef(null);
  const [natural, setNatural] = useState(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  // Until the user pans or zooms, the schematic keeps fitting itself to the panel size.
  const autoFitRef = useRef(true);

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
  }, [svgUrl]);

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
  }, [svgUrl]);

  if (!svgUrl) {
    return <div className="wb-empty">{emptyMessage}</div>;
  }

  const startPan = e => {
    if (e.button !== 0) return;
    e.preventDefault();
    autoFitRef.current = false;
    const start = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y };
    const onMove = ev => setTransform(prev => ({ ...prev, x: start.tx + ev.clientX - start.x, y: start.ty + ev.clientY - start.y }));
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div className="netlist-viewer">
      <div className="wave-toolbar">
        <span className="wave-info">{Math.round(transform.scale * 100)} %</span>
        <span className="wave-toolbar-spacer" />
        <span className="wave-info wave-hint" title={t.hint} aria-label={t.hint}>ⓘ</span>
        <a className="wb-tool-btn" href={svgUrl} download="netlist.svg" title={t.download}>SVG</a>
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
        <img
          className="netlist-img"
          src={svgUrl}
          alt={t.alt}
          draggable={false}
          onLoad={e => setNatural({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })}
          style={{
            // Sized through width/height (not a CSS scale), so the SVG is re-rendered sharply at every zoom level.
            width: natural ? natural.width * transform.scale : undefined,
            height: natural ? natural.height * transform.scale : undefined,
            transform: `translate(${transform.x}px, ${transform.y}px)`,
            visibility: natural ? 'visible' : 'hidden',
          }}
        />
      </div>
    </div>
  );
}

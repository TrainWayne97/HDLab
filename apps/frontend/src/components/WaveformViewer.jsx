import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { parseVcd, findEventIndex, formatWaveValue, pickTimeUnit, formatTime } from '../utils/vcd';
import './Workbench.css';
import './WaveformViewer.css';

const TRANSLATIONS = {
  de: {
    filter: 'Signale filtern…',
    signals: 'Signale',
    signalList: 'Signale ein- und ausblenden',
    showAll: 'Alle einblenden',
    hideAll: 'Alle ausblenden',
    hide: 'Signal ausblenden',
    allHidden: 'Alle Signale sind ausgeblendet.',
    goTo: 'Gehe zu Zeit',
    end: 'Ende',
    download: 'VCD herunterladen',
    panLeft: 'Nach links',
    panRight: 'Nach rechts',
    zoomIn: 'Hineinzoomen',
    zoomOut: 'Herauszoomen',
    fit: 'Alles zeigen',
    fitLabel: 'Fit',
    radix: 'Zahlendarstellung umschalten',
    noSignals: 'Keine auswertbaren Signalspuren in der VCD gefunden.',
    noMatch: 'Kein Signal passt zum Filter.',
    hint: 'Strg + Mausrad: Zoom · Umschalt + Mausrad: Verschieben · Klick: Cursor setzen',
  },
  en: {
    filter: 'Filter signals…',
    signals: 'signals',
    signalList: 'Show and hide signals',
    showAll: 'Show all',
    hideAll: 'Hide all',
    hide: 'Hide signal',
    allHidden: 'All signals are hidden.',
    goTo: 'Go to time',
    end: 'End',
    download: 'Download VCD',
    panLeft: 'Pan left',
    panRight: 'Pan right',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    fit: 'Show everything',
    fitLabel: 'Fit',
    radix: 'Switch number format',
    noSignals: 'No parsable signal traces found in VCD.',
    noMatch: 'No signal matches the filter.',
    hint: 'Ctrl + wheel: zoom · Shift + wheel: pan · Click: set cursor',
  },
};

const ROW_HEIGHT = 26;
const Y_HIGH = 6;
const Y_LOW = 20;
const Y_MID = (Y_HIGH + Y_LOW) / 2;
// Above this many value changes inside the visible window single edges can't be told
// apart anyway, so the row is drawn as a solid band instead of a huge path.
const MAX_VISIBLE_CHANGES = 4000;
const RADIXES = ['hex', 'dec', 'bin'];
const LABEL_CHAR_WIDTH = 6.4;

const round = v => Math.round(v * 10) / 10;

function niceStep(raw) {
  const pow = 10 ** Math.floor(Math.log10(raw));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

/** Geometry of a 1-bit signal: one thin line for 0/1, bands for x/z. */
function buildBitTrack(events, t0, t1, toX) {
  const start = Math.max(0, findEventIndex(events, t0));
  let path = '';
  const unknown = [];
  let prevLevel = null;

  for (let i = start; i < events.length && events[i].time < t1; i++) {
    if (i - start > MAX_VISIBLE_CHANGES) return { dense: true };
    const ev = events[i];
    const nextTime = i + 1 < events.length ? events[i + 1].time : t1;
    const x1 = round(toX(Math.max(ev.time, t0)));
    const x2 = round(toX(Math.min(nextTime, t1)));
    const level = ev.value === '1' ? Y_HIGH : ev.value === '0' ? Y_LOW : null;

    if (level === null) {
      unknown.push({ x: x1, width: Math.max(x2 - x1, 1) });
    } else if (prevLevel !== null && i > start) {
      path += `M${x1} ${prevLevel}V${level}H${x2}`;
    } else {
      path += `M${x1} ${level}H${x2}`;
    }
    prevLevel = level;
  }
  return { path, unknown };
}

/** Geometry of a bus: one outlined box per value, labelled when the box is wide enough. */
function buildBusTrack(events, t0, t1, toX, trackWidth, signalWidth, radix) {
  const start = Math.max(0, findEventIndex(events, t0));
  let path = '';
  let unknownPath = '';
  const labels = [];

  for (let i = start; i < events.length && events[i].time < t1; i++) {
    if (i - start > MAX_VISIBLE_CHANGES) return { dense: true };
    const ev = events[i];
    const hasNext = i + 1 < events.length;
    // Boxes cut off by the window edge are drawn past it, so no fake transition appears there.
    const xa = round(Math.max(toX(ev.time), -8));
    const xb = round(hasNext ? Math.min(toX(events[i + 1].time), trackWidth + 8) : trackWidth + 8);
    if (xb - xa < 0.5) continue;

    const slant = Math.min(3, (xb - xa) / 2);
    const box = `M${xa + slant} ${Y_HIGH}H${xb - slant}L${xb} ${Y_MID}L${xb - slant} ${Y_LOW}H${xa + slant}L${xa} ${Y_MID}Z`;
    const isUnknown = !/^[01]+$/.test(ev.value);
    if (isUnknown) unknownPath += box;
    else path += box;

    const visibleFrom = Math.max(xa, 0);
    const visibleTo = Math.min(xb, trackWidth);
    const text = formatWaveValue(ev.value, signalWidth, radix);
    if (visibleTo - visibleFrom >= text.length * LABEL_CHAR_WIDTH + 10) {
      labels.push({ x: round((visibleFrom + visibleTo) / 2), text, isUnknown });
    }
  }
  return { path, unknownPath, labels };
}

const WaveTrack = memo(function WaveTrack({ signal, t0, t1, trackWidth, radix, tickXs }) {
  const toX = time => ((time - t0) / (t1 - t0)) * trackWidth;
  const isBus = signal.width > 1;
  const track = trackWidth > 0
    ? (isBus
      ? buildBusTrack(signal.events, t0, t1, toX, trackWidth, signal.width, radix)
      : buildBitTrack(signal.events, t0, t1, toX))
    : {};

  return (
    <svg className="wave-track" width="100%" height={ROW_HEIGHT} aria-hidden="true">
      {tickXs.map(x => (
        <line key={x} className="wave-grid" x1={x} x2={x} y1={0} y2={ROW_HEIGHT} />
      ))}
      {track.dense && (
        <rect className={`wave-dense ${isBus ? 'bus' : 'bit'}`} x={0} y={Y_HIGH} width={trackWidth} height={Y_LOW - Y_HIGH} />
      )}
      {track.unknown?.map(seg => (
        <rect key={seg.x} className="wave-unknown-band" x={seg.x} y={Y_HIGH} width={seg.width} height={Y_LOW - Y_HIGH} />
      ))}
      {track.path && <path className={`wave-line ${isBus ? 'bus' : 'bit'}`} d={track.path} />}
      {track.unknownPath && <path className="wave-line unknown" d={track.unknownPath} />}
      {track.labels?.map(label => (
        <text
          key={label.x}
          className={`wave-bus-label ${label.isUnknown ? 'unknown' : ''}`}
          x={label.x}
          y={Y_MID}
          textAnchor="middle"
          dominantBaseline="central"
        >
          {label.text}
        </text>
      ))}
    </svg>
  );
});

/** Strips the scope prefix all signals share (e.g. "TOP.tb."), so names stay short. */
function commonScopeDepth(signals) {
  if (signals.length === 0) return 0;
  const scopes = signals.map(sig => (sig.scope ? sig.scope.split('.') : []));
  let depth = 0;
  while (scopes.every(parts => parts.length > depth && parts[depth] === scopes[0][depth])) depth++;
  return depth;
}

/**
 * Waveform viewer: thin-line traces for single bits, value boxes for buses, a time ruler
 * and a cursor whose signal values are shown next to the names.
 * `vcdText` is the raw VCD; without it `emptyMessage` is shown.
 */
export default function WaveformViewer({ vcdText, uiLanguage = 'de', emptyMessage }) {
  const t = TRANSLATIONS[uiLanguage] || TRANSLATIONS.de;
  const parsed = useMemo(() => (vcdText ? parseVcd(vcdText) : null), [vcdText]);
  const maxTime = parsed?.maxTime ?? 1;

  const [view, setView] = useState({ t0: 0, t1: maxTime });
  const [filter, setFilter] = useState('');
  const [hoverTime, setHoverTime] = useState(null);
  const [pinnedTime, setPinnedTime] = useState(null);
  const [radixById, setRadixById] = useState({});
  // Keyed by signal name, so the selection survives the next run of the same design.
  const [hiddenKeys, setHiddenKeys] = useState(() => new Set());
  const [signalListOpen, setSignalListOpen] = useState(false);
  const [goToValue, setGoToValue] = useState('');
  const [trackWidth, setTrackWidth] = useState(0);
  const rulerRef = useRef(null);
  const scrollRef = useRef(null);

  // New simulation result: show the whole run again.
  useEffect(() => {
    setView({ t0: 0, t1: maxTime });
    setHoverTime(null);
    setPinnedTime(null);
  }, [parsed, maxTime]);

  const hasSignals = !!parsed && parsed.signals.length > 0;

  useEffect(() => {
    const el = rulerRef.current;
    if (!el) return undefined;
    // Width is 0 while the dock tab is hidden - keep the last real width then.
    const update = () => {
      if (el.clientWidth > 0) setTrackWidth(el.clientWidth);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasSignals]);

  const minSpan = maxTime / 2000;
  const clampView = (t0, t1) => {
    const span = Math.min(Math.max(t1 - t0, minSpan), maxTime);
    const from = Math.max(0, Math.min(t0, maxTime - span));
    return { t0: from, t1: from + span };
  };
  // `anchor` is the position (0..1) inside the window that stays put while zooming.
  const zoomBy = (factor, anchor = 0.5) =>
    setView(v => {
      const span = (v.t1 - v.t0) * factor;
      const anchorTime = v.t0 + anchor * (v.t1 - v.t0);
      return clampView(anchorTime - anchor * span, anchorTime + (1 - anchor) * span);
    });
  const panBy = fraction =>
    setView(v => {
      const delta = (v.t1 - v.t0) * fraction;
      return clampView(v.t0 + delta, v.t1 + delta);
    });
  const fitAll = () => setView({ t0: 0, t1: maxTime });

  // React registers wheel listeners as passive, but zoom/pan must prevent page scrolling.
  const wheelRef = useRef(null);
  wheelRef.current = e => {
    const ruler = rulerRef.current;
    if (!ruler) return;
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const rect = ruler.getBoundingClientRect();
      const anchor = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
      zoomBy(e.deltaY > 0 ? 1.25 : 0.8, anchor);
    } else if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
      panBy((e.deltaX || e.deltaY) > 0 ? 0.1 : -0.1);
    }
  };
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const onWheel = e => wheelRef.current(e);
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [hasSignals]);

  const tickXs = useMemo(() => {
    if (trackWidth <= 0) return [];
    const span = view.t1 - view.t0;
    const step = niceStep(span / Math.max(trackWidth / 110, 1));
    const ticks = [];
    for (let k = Math.ceil(view.t0 / step); k * step <= view.t1; k++) {
      ticks.push({ time: k * step, x: round(((k * step - view.t0) / span) * trackWidth) });
    }
    return ticks;
  }, [view, trackWidth]);
  const gridXs = useMemo(() => tickXs.map(tick => tick.x), [tickXs]);

  if (!vcdText) {
    return <div className="wb-empty">{emptyMessage}</div>;
  }
  if (!hasSignals) {
    return <div className="wb-empty">{t.noSignals}</div>;
  }

  const timeUnit = pickTimeUnit(parsed.timescale, maxTime);
  const scopeDepth = commonScopeDepth(parsed.signals);
  const displayName = sig => [...sig.scope.split('.').slice(scopeDepth).filter(Boolean), sig.shortName].join('.');
  const query = filter.trim().toLowerCase();
  const shownSignals = parsed.signals.filter(sig => !hiddenKeys.has(sig.key));
  const visibleSignals = query
    ? shownSignals.filter(sig => sig.name.toLowerCase().includes(query))
    : shownSignals;

  const setSignalHidden = (key, hidden) =>
    setHiddenKeys(prev => {
      const next = new Set(prev);
      if (hidden) next.add(key);
      else next.delete(key);
      return next;
    });

  const timeAtPointer = e => {
    const rect = rulerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < 0 || x > rect.width || rect.width === 0) return null;
    return view.t0 + (x / rect.width) * (view.t1 - view.t0);
  };

  const cursorTime = hoverTime ?? pinnedTime;
  const cursorX = time => ((time - view.t0) / (view.t1 - view.t0)) * trackWidth;
  const cursorVisible = time => time !== null && time >= view.t0 && time <= view.t1;

  const handleGoTo = e => {
    e.preventDefault();
    const value = Number(goToValue.replace(',', '.'));
    if (goToValue.trim() === '' || Number.isNaN(value)) return;
    const time = Math.min(Math.max(value / timeUnit.factor, 0), maxTime);
    const span = view.t1 - view.t0;
    setPinnedTime(time);
    setView(clampView(time - span / 2, time + span / 2));
  };

  const handleDownload = () => {
    const url = URL.createObjectURL(new Blob([vcdText], { type: 'text/plain' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'waveform.vcd';
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Revoke after the click has been handled, otherwise some browsers cancel the download.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const cycleRadix = key =>
    setRadixById(prev => {
      const current = prev[key] || 'hex';
      return { ...prev, [key]: RADIXES[(RADIXES.indexOf(current) + 1) % RADIXES.length] };
    });

  return (
    <div className="wave-viewer">
      <div className="wave-toolbar">
        <input
          className="wave-input"
          type="search"
          placeholder={t.filter}
          value={filter}
          onChange={e => setFilter(e.target.value)}
          aria-label={t.filter}
        />
        <button
          type="button"
          className={`wb-btn wb-tool-btn ${signalListOpen ? 'active' : ''}`}
          onClick={() => setSignalListOpen(open => !open)}
          title={t.signalList}
          aria-expanded={signalListOpen}
        >
          {shownSignals.length}/{parsed.signals.length} {t.signals} ▾
        </button>
        <form onSubmit={handleGoTo}>
          <input
            className="wave-input wave-goto"
            type="text"
            inputMode="decimal"
            placeholder={`${t.goTo} (${timeUnit.unit})`}
            value={goToValue}
            onChange={e => setGoToValue(e.target.value)}
            aria-label={`${t.goTo} (${timeUnit.unit})`}
          />
        </form>
        <span className="wave-info">{t.end}: {formatTime(maxTime, timeUnit)}</span>
        {cursorTime !== null && <span className="wave-info wave-cursor-time">t = {formatTime(cursorTime, timeUnit)}</span>}
        <span className="wave-toolbar-spacer" />
        <span className="wave-info wave-hint" title={t.hint} aria-label={t.hint}>ⓘ</span>
        <button type="button" className="wb-btn wb-tool-btn" onClick={handleDownload} title={t.download}>VCD</button>
        <button type="button" className="wb-btn wb-tool-btn" onClick={() => panBy(-0.25)} title={t.panLeft} aria-label={t.panLeft}>←</button>
        <button type="button" className="wb-btn wb-tool-btn" onClick={() => panBy(0.25)} title={t.panRight} aria-label={t.panRight}>→</button>
        <button type="button" className="wb-btn wb-tool-btn" onClick={() => zoomBy(0.5)} title={t.zoomIn} aria-label={t.zoomIn}>+</button>
        <button type="button" className="wb-btn wb-tool-btn" onClick={() => zoomBy(2)} title={t.zoomOut} aria-label={t.zoomOut}>−</button>
        <button type="button" className="wb-btn wb-tool-btn" onClick={fitAll} title={t.fit}>{t.fitLabel}</button>
      </div>

      {signalListOpen && (
        <>
          <div className="wave-popover-backdrop" onClick={() => setSignalListOpen(false)} aria-hidden="true" />
          <div className="wave-popover" role="dialog" aria-label={t.signalList}>
            <div className="wave-popover-actions">
              <button type="button" className="wb-btn wb-tool-btn" onClick={() => setHiddenKeys(new Set())}>{t.showAll}</button>
              <button type="button" className="wb-btn wb-tool-btn" onClick={() => setHiddenKeys(new Set(parsed.signals.map(sig => sig.key)))}>{t.hideAll}</button>
            </div>
            <div className="wave-popover-list">
              {parsed.signals.map(sig => (
                <label key={sig.key} className="wave-popover-item" title={sig.name}>
                  <input
                    type="checkbox"
                    checked={!hiddenKeys.has(sig.key)}
                    onChange={e => setSignalHidden(sig.key, !e.target.checked)}
                  />
                  <span>{displayName(sig)}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      <div
        className="wave-scroll"
        ref={scrollRef}
        onMouseMove={e => setHoverTime(timeAtPointer(e))}
        onMouseLeave={() => setHoverTime(null)}
        onClick={e => {
          const time = timeAtPointer(e);
          if (time !== null) setPinnedTime(time);
        }}
      >
        <div className="wave-inner">
          <div className="wave-row wave-ruler-row">
            <div className="wave-labels" />
            <svg className="wave-ruler" ref={rulerRef} width="100%" height={22} aria-hidden="true">
              {tickXs.map(tick => (
                <g key={tick.time}>
                  <line className="wave-tick" x1={tick.x} x2={tick.x} y1={15} y2={22} />
                  <text className="wave-tick-label" x={tick.x + 3} y={11}>{formatTime(tick.time, timeUnit)}</text>
                </g>
              ))}
            </svg>
          </div>

          {visibleSignals.map(sig => {
            const radix = radixById[sig.key] || 'hex';
            const index = cursorTime !== null ? findEventIndex(sig.events, cursorTime) : -1;
            return (
              <div className="wave-row" key={sig.key}>
                <div className="wave-labels">
                  <button
                    type="button"
                    className="wb-btn wave-hide"
                    onClick={e => { e.stopPropagation(); setSignalHidden(sig.key, true); }}
                    title={t.hide}
                    aria-label={`${t.hide}: ${displayName(sig)}`}
                  >
                    ×
                  </button>
                  <span className="wave-name" title={sig.name}>{displayName(sig)}</span>
                  {sig.width > 1 && (
                    <button type="button" className="wb-btn wave-radix" onClick={e => { e.stopPropagation(); cycleRadix(sig.key); }} title={t.radix}>
                      {radix}
                    </button>
                  )}
                  <span className="wave-value">
                    {index >= 0 ? formatWaveValue(sig.events[index].value, sig.width, radix) : ''}
                  </span>
                </div>
                <WaveTrack signal={sig} t0={view.t0} t1={view.t1} trackWidth={trackWidth} radix={radix} tickXs={gridXs} />
              </div>
            );
          })}

          {visibleSignals.length === 0 && (
            <div className="wb-empty">{shownSignals.length === 0 ? t.allHidden : t.noMatch}</div>
          )}

          {cursorVisible(pinnedTime) && (
            <div className="wave-cursor pinned" style={{ left: `calc(var(--wave-label-width) + ${cursorX(pinnedTime)}px)` }} />
          )}
          {cursorVisible(hoverTime) && (
            <div className="wave-cursor" style={{ left: `calc(var(--wave-label-width) + ${cursorX(hoverTime)}px)` }} />
          )}
        </div>
      </div>
    </div>
  );
}

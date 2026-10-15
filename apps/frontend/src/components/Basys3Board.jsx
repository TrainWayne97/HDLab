import { useCallback, useEffect, useRef, useState } from 'react';
import { BASYS3_CLOCK_HZ, NUM_LEDS, NUM_SWITCHES } from '../utils/boardSim/basys3';
import './Workbench.css';
import './Basys3Board.css';

const TRANSLATIONS = {
  de: {
    synthesize: 'Synthetisieren & starten',
    resynthesize: 'Neu synthetisieren',
    synthesizing: 'Synthese läuft…',
    play: 'Start',
    pause: 'Pause',
    step: '+1 Takt',
    stepTitle: 'Einen Takt weiter (nur pausiert)',
    reset: 'Neustart',
    resetTitle: 'Alle Register auf ihre Startwerte setzen (wie nach dem Laden des Bitstreams)',
    clock: 'Takt',
    max: 'Max',
    stale: 'Code geändert – neu synthetisieren',
    intro: 'Simuliert das Top-Modul auf einem virtuellen Basys3-Board. Nur die Synthese läuft auf dem Server, die Simulation im Browser. Ports wie im Basys3-Master-XDC: clk, sw[15:0], led[15:0], seg[6:0], dp, an[3:0], btnC/btnU/btnL/btnR/btnD.',
    rate: (hz, ratio) => `≈ ${hz} (${ratio} langsamer als 100 MHz)`,
    rateFast: hz => `≈ ${hz}`,
    simTime: (t, cycles) => `t = ${t} (${cycles} Takte)`,
    paused: 'pausiert',
    mapped: 'Zugeordnet',
    unmapped: 'Nicht zugeordnet (vom Board nicht verbunden)',
    noClock: 'Kein Takteingang „clk“ gefunden – nur kombinatorische Logik und Taster/Schalter als Takt.',
    stats: s => `${s.cells} Zellen · ${s.flipflops} Flip-Flops${s.memories ? ` · ${s.memories} Speicher` : ''}`,
    switchLabel: i => `Schalter SW${i}`,
    buttonHint: 'Klick: drücken, solange gehalten · Umschalt+Klick: Taster einrasten',
    errorTitle: 'Board-Simulation nicht möglich',
  },
  en: {
    synthesize: 'Synthesize & run',
    resynthesize: 'Synthesize again',
    synthesizing: 'Synthesizing…',
    play: 'Run',
    pause: 'Pause',
    step: '+1 cycle',
    stepTitle: 'Advance one clock cycle (paused only)',
    reset: 'Restart',
    resetTitle: 'Set all registers to their initial values (like after loading the bitstream)',
    clock: 'Clock',
    max: 'Max',
    stale: 'Code changed – synthesize again',
    intro: 'Simulates the top module on a virtual Basys3 board. Only the synthesis runs on the server, the simulation runs in the browser. Ports as in the Basys3 master XDC: clk, sw[15:0], led[15:0], seg[6:0], dp, an[3:0], btnC/btnU/btnL/btnR/btnD.',
    rate: (hz, ratio) => `≈ ${hz} (${ratio} slower than 100 MHz)`,
    rateFast: hz => `≈ ${hz}`,
    simTime: (t, cycles) => `t = ${t} (${cycles} cycles)`,
    paused: 'paused',
    mapped: 'Mapped',
    unmapped: 'Not mapped (not connected on the board)',
    noClock: 'No clock input "clk" found – only combinational logic, switches/buttons as clocks.',
    stats: s => `${s.cells} cells · ${s.flipflops} flip-flops${s.memories ? ` · ${s.memories} memories` : ''}`,
    switchLabel: i => `Switch SW${i}`,
    buttonHint: 'Click: pressed while held · Shift+click: latch button',
    errorTitle: 'Board simulation not possible',
  },
};

// Simulated clock: 0 = as fast as the browser can
const SPEEDS = [0, 10_000_000, 1_000_000, 100_000, 10_000, 1_000, 100, 10, 1];

// Buttons as on the board (cross), with position in the SVG
const BUTTON_LAYOUT = [
  { role: 'btnU', label: 'BTNU', dx: 0, dy: -1 },
  { role: 'btnL', label: 'BTNL', dx: -1, dy: 0 },
  { role: 'btnC', label: 'BTNC', dx: 0, dy: 0 },
  { role: 'btnR', label: 'BTNR', dx: 1, dy: 0 },
  { role: 'btnD', label: 'BTND', dx: 0, dy: 1 },
];

// 7-segment geometry of one digit (a..g, local coordinates)
const SEG_T = 8;
const hSeg = (cx, cy, len) => {
  const l = len / 2;
  const t = SEG_T / 2;
  return `${cx - l},${cy} ${cx - l + t},${cy - t} ${cx + l - t},${cy - t} ${cx + l},${cy} ${cx + l - t},${cy + t} ${cx - l + t},${cy + t}`;
};
const vSeg = (cx, cy, len) => {
  const l = len / 2;
  const t = SEG_T / 2;
  return `${cx},${cy - l} ${cx + t},${cy - l + t} ${cx + t},${cy + l - t} ${cx},${cy + l} ${cx - t},${cy + l - t} ${cx - t},${cy - l + t}`;
};
const SEGMENTS = [
  hSeg(26, 6, 36), // a
  vSeg(46, 26, 36), // b
  vSeg(46, 66, 36), // c
  hSeg(26, 86, 36), // d
  vSeg(6, 66, 36), // e
  vSeg(6, 26, 36), // f
  hSeg(26, 46, 36), // g
];

const level = b => 0.08 + 0.92 * Math.min(1, Math.max(0, b || 0));

function useNumberFormat(lang) {
  const loc = lang === 'en' ? 'en-US' : 'de-DE';
  const nf1 = new Intl.NumberFormat(loc, { maximumFractionDigits: 1 });
  const nf0 = new Intl.NumberFormat(loc, { maximumFractionDigits: 0 });
  const nf3 = new Intl.NumberFormat(loc, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  const hz = v => {
    if (v >= 1e6) return `${nf1.format(v / 1e6)} MHz`;
    if (v >= 1e3) return `${nf1.format(v / 1e3)} kHz`;
    return `${nf1.format(v)} Hz`;
  };
  const time = cycles => `${nf3.format(cycles / BASYS3_CLOCK_HZ)} s`;
  return { hz, time, nf0, nf1 };
}

/**
 * Virtual Basys3 board. The design is synthesized on the server once (`onSynthesize`
 * returns the flattened Yosys netlist), then simulated in a web worker in the browser.
 * `designKey` changes with the code, so the board can tell when it shows an old design.
 * While `active` is false (tab hidden) or the page is hidden, the simulation pauses.
 */
export default function Basys3Board({ onSynthesize, designKey, active, uiLanguage = 'de' }) {
  const t = TRANSLATIONS[uiLanguage] || TRANSLATIONS.de;
  const fmt = useNumberFormat(uiLanguage);
  const workerRef = useRef(null);
  const [synthesizing, setSynthesizing] = useState(false);
  // Synthesis errors (log) and errors of the running simulation (e.g. oscillation)
  const [error, setError] = useState('');
  const [simError, setSimError] = useState('');
  const [loadedKey, setLoadedKey] = useState(null);
  const [info, setInfo] = useState(null);
  const [frame, setFrame] = useState(null);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [switches, setSwitches] = useState(0);
  // role -> { held, latched }
  const [buttons, setButtons] = useState({});
  const buttonsRef = useRef(buttons);
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  // Whether the user wants it to run; `running` is what the worker currently does
  const wantRunRef = useRef(false);
  const mountedRef = useRef(true);

  const post = useCallback(msg => workerRef.current?.postMessage(msg), []);

  useEffect(() => {
    mountedRef.current = true;
    const onVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      mountedRef.current = false;
      document.removeEventListener('visibilitychange', onVisibility);
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  // Runs only while visible: a hidden board doesn't need CPU time
  const visible = active && pageVisible;
  useEffect(() => {
    if (!info) return;
    post({ type: visible && wantRunRef.current ? 'play' : 'pause' });
  }, [visible, info, post]);

  const ensureWorker = () => {
    if (workerRef.current) return workerRef.current;
    const worker = new Worker(new URL('../utils/boardSim/boardSim.worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => {
      if (!mountedRef.current) return;
      if (data.type === 'loaded') {
        setInfo({ stats: data.stats, mapping: data.mapping });
      } else if (data.type === 'frame') {
        setFrame(data);
        setRunning(data.running);
      } else if (data.type === 'error') {
        setSimError(data.message);
        setRunning(false);
        wantRunRef.current = false;
      }
    };
    workerRef.current = worker;
    return worker;
  };

  const buttonValue = b => (b?.held || b?.latched ? 1 : 0);

  const synthesize = async () => {
    setSynthesizing(true);
    setError('');
    setSimError('');
    const key = designKey;
    try {
      const netlist = await onSynthesize();
      if (!mountedRef.current) return;
      const worker = ensureWorker();
      const inputs = { sw: switches };
      BUTTON_LAYOUT.forEach(({ role }) => { inputs[role] = buttonValue(buttonsRef.current[role]); });
      setInfo(null);
      setFrame(null);
      worker.postMessage({ type: 'speed', hz: speed });
      worker.postMessage({ type: 'load', netlist, inputs });
      setLoadedKey(key);
      wantRunRef.current = true;
      // The effect above starts it once 'loaded' arrived and the board is visible
    } catch (err) {
      if (mountedRef.current) setError(err?.message || String(err));
    } finally {
      if (mountedRef.current) setSynthesizing(false);
    }
  };

  const togglePlay = () => {
    wantRunRef.current = !running;
    post({ type: running ? 'pause' : 'play' });
  };

  const changeSpeed = hz => {
    setSpeed(hz);
    post({ type: 'speed', hz });
  };

  const toggleSwitch = i => {
    const next = switches ^ (1 << i);
    setSwitches(next);
    post({ type: 'input', role: 'sw', value: next });
  };

  const updateButton = (role, patch) => {
    const before = buttonsRef.current[role] || {};
    const after = { ...before, ...patch };
    buttonsRef.current = { ...buttonsRef.current, [role]: after };
    setButtons(buttonsRef.current);
    if (buttonValue(before) !== buttonValue(after)) post({ type: 'input', role, value: buttonValue(after) });
  };

  const loaded = !!info;
  const stale = loadedKey !== null && loadedKey !== designKey;
  const mapping = info?.mapping;
  const leds = frame?.leds || new Array(NUM_LEDS).fill(0);
  const digits = frame?.digits || [[], [], [], []];

  let status = '';
  if (frame && loaded) {
    const rate = frame.rate || 0;
    const parts = [];
    if (running && rate > 0) {
      parts.push(rate < BASYS3_CLOCK_HZ
        ? t.rate(fmt.hz(rate), `${fmt.nf1.format(BASYS3_CLOCK_HZ / rate)}×`)
        : t.rateFast(fmt.hz(rate)));
    } else if (!running) {
      parts.push(t.paused);
    }
    parts.push(t.simTime(fmt.time(frame.cycles), fmt.nf0.format(frame.cycles)));
    status = parts.join(' · ');
  }

  return (
    <div className="b3">
      <div className="b3-toolbar">
        <button type="button" className="wb-btn dock-run-btn b3-synth" onClick={synthesize} disabled={synthesizing}>
          {synthesizing ? t.synthesizing : loadedKey === null ? `⚙ ${t.synthesize}` : `⚙ ${t.resynthesize}`}
        </button>
        <button type="button" className="wb-btn b3-tool" onClick={togglePlay} disabled={!loaded || !!simError}>
          {running ? `⏸ ${t.pause}` : `▶ ${t.play}`}
        </button>
        <button type="button" className="wb-btn b3-tool" onClick={() => post({ type: 'step', cycles: 1 })} disabled={!loaded || running || !!simError} title={t.stepTitle}>
          {t.step}
        </button>
        <button
          type="button"
          className="wb-btn b3-tool"
          onClick={() => {
            setSimError('');
            post({ type: 'reset' });
          }}
          disabled={!loaded}
          title={t.resetTitle}
        >
          ⟲ {t.reset}
        </button>
        <label className="b3-speed">
          {t.clock}
          <select value={speed} onChange={e => changeSpeed(Number(e.target.value))}>
            {SPEEDS.map(hz => (
              <option key={hz} value={hz}>{hz === 0 ? t.max : fmt.hz(hz)}</option>
            ))}
          </select>
        </label>
        {stale && <span className="b3-stale">{t.stale}</span>}
        <span className="b3-status" aria-live="off">{status}</span>
      </div>

      {(error || simError) && (
        <div className="b3-error" role="alert">
          <strong>{t.errorTitle}</strong>
          <pre>{error || simError}</pre>
        </div>
      )}

      <div className={`b3-stage ${loaded ? '' : 'b3-idle'}`}>
        <svg className="b3-svg" viewBox="0 0 900 350" role="group" aria-label="Basys3">
          <defs>
            <filter id="b3-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>
          <rect x="1" y="1" width="898" height="348" rx="18" className="b3-pcb" />
          {[[22, 22], [878, 22], [22, 328], [878, 328]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="8" className="b3-hole" />
          ))}
          <text x="44" y="56" className="b3-silk b3-title">BASYS3</text>
          <text x="44" y="76" className="b3-silk">100 MHz · {mapping?.clock || 'clk'}</text>

          {/* 7-segment display: digit 3 on the left, digit 0 on the right */}
          <rect x="290" y="34" width="300" height="134" rx="6" className="b3-display" />
          {[3, 2, 1, 0].map((d, pos) => (
            <g key={d} transform={`translate(${312 + pos * 70} 56) skewX(-6)`}>
              {SEGMENTS.map((points, s) => (
                <polygon key={s} points={points} className="b3-seg" style={{ fillOpacity: level(digits[d][s]) }} />
              ))}
              <circle cx="58" cy="88" r="4.5" className="b3-seg" style={{ fillOpacity: level(digits[d][7]) }} />
            </g>
          ))}
          <text x="440" y="186" className="b3-silk b3-small" textAnchor="middle">AN3 · AN2 · AN1 · AN0</text>

          {/* Buttons */}
          <g>
            {BUTTON_LAYOUT.map(({ role, label, dx, dy }) => {
              const cx = 760 + dx * 58;
              const cy = 100 + dy * 52;
              const state = buttons[role] || {};
              const pressed = buttonValue(state) === 1;
              const connected = !!mapping?.inputs?.[role];
              return (
                <g
                  key={role}
                  className={`b3-button ${pressed ? 'pressed' : ''} ${state.latched ? 'latched' : ''} ${loaded && !connected ? 'unconnected' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-pressed={pressed}
                  aria-label={label}
                  onPointerDown={e => {
                    e.preventDefault();
                    if (e.shiftKey) {
                      updateButton(role, { latched: !state.latched, held: false });
                      return;
                    }
                    e.currentTarget.setPointerCapture?.(e.pointerId);
                    updateButton(role, { held: true });
                  }}
                  onPointerUp={() => updateButton(role, { held: false })}
                  onPointerCancel={() => updateButton(role, { held: false })}
                  onKeyDown={e => {
                    if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
                      e.preventDefault();
                      updateButton(role, { held: true });
                    }
                  }}
                  onKeyUp={e => {
                    if (e.key === ' ' || e.key === 'Enter') updateButton(role, { held: false });
                  }}
                >
                  <title>{`${label} – ${t.buttonHint}`}</title>
                  <rect x={cx - 20} y={cy - 20} width="40" height="40" rx="6" className="b3-button-base" />
                  <circle cx={cx} cy={cy + (pressed ? 1.5 : 0)} r="13" className="b3-button-cap" />
                  <text x={cx} y={cy + (pressed ? 5.5 : 4)} className="b3-silk b3-button-letter" textAnchor="middle">{label.slice(3)}</text>
                </g>
              );
            })}
          </g>

          {/* LEDs and switches: LD15/SW15 on the left, LD0/SW0 on the right */}
          {Array.from({ length: NUM_SWITCHES }, (_, k) => {
            const i = NUM_SWITCHES - 1 - k;
            const x = 70 + k * 51;
            const on = (switches >> i) & 1;
            const b = Math.min(1, Math.max(0, leds[i] || 0));
            const ledConnected = !!mapping?.outputs?.led;
            const swConnected = !!mapping?.inputs?.sw;
            return (
              <g key={i}>
                <text x={x} y="214" className="b3-silk b3-small" textAnchor="middle">LD{i}</text>
                {b > 0.02 && <rect x={x - 11} y="219" width="22" height="13" rx="3" className="b3-led-glow" style={{ opacity: b * 0.9 }} filter="url(#b3-glow)" />}
                <rect x={x - 8} y="221" width="16" height="9" rx="2" className={`b3-led ${loaded && !ledConnected ? 'unconnected' : ''}`} />
                <rect x={x - 8} y="221" width="16" height="9" rx="2" className="b3-led-on" style={{ opacity: b }} />
                <g
                  className={`b3-switch ${on ? 'on' : ''} ${loaded && !swConnected ? 'unconnected' : ''}`}
                  role="switch"
                  tabIndex={0}
                  aria-checked={!!on}
                  aria-label={t.switchLabel(i)}
                  onClick={() => toggleSwitch(i)}
                  onKeyDown={e => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      toggleSwitch(i);
                    }
                  }}
                >
                  <rect x={x - 13} y="248" width="26" height="56" rx="3" className="b3-switch-body" />
                  <rect x={x - 6} y="254" width="12" height="44" rx="2" className="b3-switch-slot" />
                  <rect x={x - 9} y={on ? 254 : 278} width="18" height="20" rx="2" className="b3-switch-knob" />
                </g>
                <text x={x} y="320" className="b3-silk b3-small" textAnchor="middle">SW{i}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="b3-info">
        {!loaded && !error && <span>{t.intro}</span>}
        {mapping && (
          <>
            <span>
              {t.mapped}: {[mapping.clock, ...Object.values(mapping.inputs), ...Object.values(mapping.outputs)].filter(Boolean).join(', ') || '–'}
              {' · '}
              {t.stats(info.stats)}
            </span>
            {!mapping.clock && <span className="b3-warn">{t.noClock}</span>}
            {mapping.unmapped.length > 0 && <span className="b3-warn">{t.unmapped}: {mapping.unmapped.join(', ')}</span>}
          </>
        )}
      </div>
    </div>
  );
}

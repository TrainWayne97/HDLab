// Web worker running the Basys3 board simulation, so the editor stays responsive.
//
// Messages in:  load { netlist, inputs }, input { role, value }, play, pause,
//               step { cycles }, reset, speed { hz } (0 = as fast as possible, down to mHz)
// Messages out: loaded { stats, mapping },
//               frame { leds, digits, held, clock, cycles, rate, running }, error { message }
//               (held: button levels the design currently sees; clock: { level, phase, blink }
//               for the clock LED and scope, null without clock input)

import { compileNetlist, instantiate, netlistPorts, NetlistError } from './compile';
import { BASYS3_CLOCK_HZ, BUTTONS, mapBasys3Ports } from './basys3';
import { DisplayAverager } from './display';

// Simulation time per slice; the rest of the time the worker sleeps (no busy loop)
const BUDGET_MS = 12;
const FRAME_MS = 16;
// Minimum interval between frames posted to the UI
const POST_MS = 33;
// Without "max" speed, at most this much simulated backlog is caught up after a stall
const MAX_CATCHUP_MS = 250;
// A click in the browser is often shorter than a debouncer in the design needs in simulated
// time (the simulation runs slower than 100 MHz). While running, each button level (pressed
// and released) therefore lasts at least this much board time; faster clicks are queued.
const MIN_BUTTON_LEVEL_CYCLES = 0.025 * BASYS3_CLOCK_HZ;
// ... but at most this much real time, so a slow simulation doesn't hold a button forever -
// as long as the design had a few clock edges to see it (synchronizer + edge detection)
const MAX_BUTTON_LEVEL_MS = 1000;
const MIN_BUTTON_LEVEL_EDGES = 4;
const MAX_BUTTON_QUEUE = 8;
// Up to this clock the board shows the clock toggling (LED, scope); above it the clock LED
// glows at half brightness, like a real LED on a fast clock
const CLOCK_VISIBLE_HZ = 12;

let sim = null;
let compiled = null;
let mapping = null;
const inputValues = {};
// role -> { level, cycle, ms (when the level was applied), queue: pending levels }
let buttons = {};
const hist = new Map();
const averager = new DisplayAverager();
let running = false;
let timer = null;
let targetHz = 0;
let carry = 0;
let lastTick = 0;
let lastPost = 0;
let chunk = 1000;
let rate = 0;
// The simulation runs in half periods: true between clockHigh() and clockLow()
let clockHigh = false;

const record = (key, cycles) => {
  if (cycles > 0) hist.set(key, (hist.get(key) || 0) + cycles);
};

function fail(err) {
  running = false;
  clearTimeout(timer);
  timer = null;
  const message = err?.message === 'OSCILLATION'
    ? 'Das Design kommt nicht zur Ruhe: Takt- oder Reset-Signale hängen über Logik von sich selbst ab (Oszillation).'
    : err instanceof NetlistError ? err.message : `Simulationsfehler: ${err?.message || err}`;
  postMessage({ type: 'error', message });
}

function applyInputs() {
  for (const [role, port] of Object.entries(mapping.inputs)) {
    sim.setInput(compiled.inputs[port].index, inputValues[role] ?? 0);
  }
}

function applyInput(role, value) {
  inputValues[role] = value;
  const port = mapping?.inputs[role];
  if (sim && port) sim.setInput(compiled.inputs[port].index, value);
}

function initButtons() {
  buttons = {};
  for (const role of BUTTONS) {
    buttons[role] = { level: inputValues[role] ?? 0, cycle: -Infinity, ms: -Infinity, queue: [] };
  }
}

/**
 * Applies queued button levels whose predecessor lasted long enough (or all of them
 * with `force`). Returns true if a level changed.
 */
function processButtons(force = false) {
  const now = performance.now();
  let changed = false;
  for (const [role, st] of Object.entries(buttons)) {
    while (st.queue.length > 0) {
      const since = sim.cycles() - st.cycle;
      const due = force || since >= MIN_BUTTON_LEVEL_CYCLES
        || (now - st.ms >= MAX_BUTTON_LEVEL_MS && since >= MIN_BUTTON_LEVEL_EDGES);
      if (!due) break;
      st.level = st.queue.shift();
      st.cycle = sim.cycles();
      st.ms = now;
      applyInput(role, st.level);
      changed = true;
      if (!force) break; // the next level has to last the minimum time as well
    }
  }
  return changed;
}

const buttonsPending = () => Object.values(buttons).some(st => st.queue.length > 0);

function setButton(role, value) {
  const st = buttons[role];
  const last = st.queue.length ? st.queue[st.queue.length - 1] : st.level;
  if (value === last) return;
  st.queue.push(value);
  // Clicking much faster than the simulation can follow: drop the oldest press/release pair
  if (st.queue.length > MAX_BUTTON_QUEUE) st.queue.splice(0, 2);
  // Paused: the user controls time step by step, levels apply immediately
  processButtons(!running);
}

/** Ends the current frame: hands the output histogram to the averager. */
function endFrame(ms) {
  record(sim.key(), sim.flush());
  averager.addFrame(hist, sim.cycles(), ms);
  hist.clear();
}

function post(force = false) {
  const now = performance.now();
  if (!force && now - lastPost < POST_MS) return;
  lastPost = now;
  const { leds, digits } = averager.compute(sim.cycles(), sim.key());
  const held = Object.fromEntries(Object.entries(buttons).map(([role, st]) => [role, st.level]));
  // phase: progress through the current half period (0..1), for a smoothly moving scope
  const clock = mapping?.clock ? {
    level: clockHigh ? 1 : 0,
    phase: running && targetHz ? Math.min(1, carry) : 0,
    blink: !running || (targetHz > 0 && targetHz <= CLOCK_VISIBLE_HZ),
  } : null;
  postMessage({ type: 'frame', leds, digits, held, clock, cycles: sim.cycles(), rate, running });
}

/** Shows the outputs as they are right now (after a change while paused). */
function showInstant() {
  record(sim.key(), sim.flush());
  hist.clear();
  averager.clearFrames();
  post(true);
}

function tick() {
  timer = null;
  if (!running || !sim) return;
  const start = performance.now();
  const elapsed = Math.min(start - lastTick, MAX_CATCHUP_MS);
  lastTick = start;
  // Counted in half periods: at slow clocks the high phase really lasts half a period and
  // outputs change at the rising edge. Whole cycles go through run() (fast path).
  let todo = targetHz ? carry + (2 * targetHz * elapsed) / 1000 : Infinity;
  const deadline = start + BUDGET_MS;
  const cyclesBefore = sim.cycles();
  try {
    while (todo >= 1 && performance.now() < deadline) {
      if (clockHigh) {
        sim.clockLow();
        clockHigh = false;
        todo -= 1;
      } else if (todo >= 2) {
        const n = Math.min(chunk, Math.floor(todo / 2));
        const t0 = performance.now();
        sim.run(n);
        const dt = performance.now() - t0;
        todo -= 2 * n;
        // Chunks of about 1 ms: fine-grained enough for the deadline, cheap enough per call
        if (n === chunk) {
          if (dt < 0.5 && chunk < 1 << 22) chunk *= 2;
          else if (dt > 2 && chunk > 1) chunk = Math.max(1, chunk >> 1);
        }
      } else {
        sim.clockHigh();
        clockHigh = true;
        todo -= 1;
      }
      if (buttonsPending()) processButtons();
    }
  } catch (err) {
    fail(err);
    return;
  }
  const ran = sim.cycles() - cyclesBefore;
  // A fixed clock keeps its fraction of a half period (at 1 mHz it takes 500 s to make one);
  // a backlog because the computer is too slow is only caught up to MAX_CATCHUP_MS
  const keptUp = todo < 1;
  carry = !targetHz ? 0 : keptUp ? todo : Math.min(todo, (2 * targetHz * MAX_CATCHUP_MS) / 1000);
  if (targetHz && keptUp) {
    rate = targetHz;
  } else {
    const instRate = elapsed > 0 ? (ran * 1000) / elapsed : 0;
    rate = rate ? rate * 0.8 + instRate * 0.2 : instRate;
  }
  endFrame(elapsed);
  post();
  timer = setTimeout(tick, targetHz ? FRAME_MS : 0);
}

function start() {
  if (running || !sim) return;
  running = true;
  lastTick = performance.now();
  carry = 0;
  rate = 0;
  timer = setTimeout(tick, 0);
}

function stop() {
  running = false;
  clearTimeout(timer);
  timer = null;
  if (sim) post(true);
}

self.onmessage = ({ data }) => {
  try {
    switch (data.type) {
      case 'load': {
        stop();
        sim = null;
        const ports = netlistPorts(data.netlist);
        mapping = mapBasys3Ports(ports);
        compiled = compileNetlist(data.netlist, { clock: mapping.clock, observe: mapping.observe });
        sim = instantiate(compiled, record);
        Object.assign(inputValues, data.inputs || {});
        clockHigh = false;
        initButtons();
        applyInputs();
        averager.reset();
        hist.clear();
        postMessage({ type: 'loaded', stats: compiled.stats, mapping: { clock: mapping.clock, inputs: mapping.inputs, outputs: mapping.outputs, unmapped: mapping.unmapped } });
        showInstant();
        break;
      }
      case 'input': {
        if (sim && buttons[data.role]) setButton(data.role, data.value);
        else applyInput(data.role, data.value);
        if (sim && !running) showInstant();
        break;
      }
      case 'play':
        start();
        break;
      case 'pause':
        stop();
        break;
      case 'step': {
        if (!sim || running) break;
        let n = Math.max(1, Math.floor(data.cycles || 1));
        // Paused in the high phase: the step completes that cycle
        if (clockHigh) {
          sim.clockLow();
          clockHigh = false;
          n--;
        }
        if (n > 0) sim.run(n);
        processButtons(true);
        showInstant();
        break;
      }
      case 'reset':
        if (!sim) break;
        processButtons(true);
        sim.reset();
        clockHigh = false;
        Object.values(buttons).forEach(st => { st.cycle = -Infinity; });
        applyInputs();
        sim.flush();
        hist.clear();
        averager.reset();
        rate = 0;
        post(true);
        break;
      case 'speed':
        targetHz = Math.max(0, Number(data.hz) || 0);
        carry = 0;
        break;
      default:
        break;
    }
  } catch (err) {
    fail(err);
  }
};

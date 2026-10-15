// Web worker running the Basys3 board simulation, so the editor stays responsive.
//
// Messages in:  load { netlist, inputs }, input { role, value }, play, pause,
//               step { cycles }, reset, speed { hz } (0 = as fast as possible)
// Messages out: loaded { stats, mapping }, frame { leds, digits, cycles, rate, running },
//               error { message }

import { compileNetlist, instantiate, netlistPorts, NetlistError } from './compile';
import { mapBasys3Ports } from './basys3';
import { DisplayAverager } from './display';

// Simulation time per slice; the rest of the time the worker sleeps (no busy loop)
const BUDGET_MS = 12;
const FRAME_MS = 16;
// Minimum interval between frames posted to the UI
const POST_MS = 33;
// Without "max" speed, at most this much simulated backlog is caught up after a stall
const MAX_CATCHUP_MS = 250;

let sim = null;
let compiled = null;
let mapping = null;
const inputValues = {};
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
  postMessage({ type: 'frame', leds, digits, cycles: sim.cycles(), rate, running });
}

/** Shows the outputs as they are right now (after a change while paused). */
function showInstant() {
  record(sim.key(), sim.flush());
  hist.clear();
  averager.reset();
  post(true);
}

function tick() {
  timer = null;
  if (!running || !sim) return;
  const start = performance.now();
  const elapsed = Math.min(start - lastTick, MAX_CATCHUP_MS);
  lastTick = start;
  let todo = targetHz ? carry + (targetHz * elapsed) / 1000 : Infinity;
  const deadline = start + BUDGET_MS;
  let ran = 0;
  try {
    while (todo >= 1 && performance.now() < deadline) {
      const n = Math.min(chunk, Math.floor(todo));
      const t0 = performance.now();
      sim.run(n);
      const dt = performance.now() - t0;
      ran += n;
      todo -= n;
      // Chunks of about 1 ms: fine-grained enough for the deadline, cheap enough per call
      if (n === chunk) {
        if (dt < 0.5 && chunk < 1 << 22) chunk *= 2;
        else if (dt > 2 && chunk > 1) chunk = Math.max(1, chunk >> 1);
      }
    }
  } catch (err) {
    fail(err);
    return;
  }
  carry = targetHz ? Math.min(todo, (targetHz * MAX_CATCHUP_MS) / 1000) : 0;
  const instRate = elapsed > 0 ? (ran * 1000) / elapsed : 0;
  rate = rate ? rate * 0.8 + instRate * 0.2 : instRate;
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
        applyInputs();
        averager.reset();
        hist.clear();
        postMessage({ type: 'loaded', stats: compiled.stats, mapping: { clock: mapping.clock, inputs: mapping.inputs, outputs: mapping.outputs, unmapped: mapping.unmapped } });
        showInstant();
        break;
      }
      case 'input': {
        inputValues[data.role] = data.value;
        const port = mapping?.inputs[data.role];
        if (!sim || !port) break;
        sim.setInput(compiled.inputs[port].index, data.value);
        if (!running) showInstant();
        break;
      }
      case 'play':
        start();
        break;
      case 'pause':
        stop();
        break;
      case 'step':
        if (!sim || running) break;
        sim.run(Math.max(1, Math.floor(data.cycles || 1)));
        showInstant();
        break;
      case 'reset':
        if (!sim) break;
        sim.reset();
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

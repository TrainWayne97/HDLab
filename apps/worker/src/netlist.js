import { promises as fs } from 'fs';
import { createRequire } from 'module';
import { Worker } from 'worker_threads';

const require = createRequire(import.meta.url);
const SKIN_PATH = require.resolve('netlistsvg/lib/default.svg');

// Guards against designs that would produce a schematic nobody can read anyway.
// The file holds all modules (e.g. caches with large memories can make it several MB),
// but only the top module is drawn: the limit for the drawn part stays small.
const MAX_NETLIST_FILE_BYTES = 32 * 1024 * 1024;
const MAX_NETLIST_JSON_BYTES = 1024 * 1024;
const MAX_NETLIST_SVG_BYTES = 4 * 1024 * 1024;
const RENDER_TIMEOUT_MS = 20000;
// netlistsvg recurses deeply on wide buses and large designs: the default stack of ~1 MB
// overflows. In tests a 32-bit ALU needed 4 MB, a pipelined RV32 CPU (171 top-level cells)
// 128 MB. The stack is only committed as far as it is used.
const RENDER_STACK_MB = 256;

/**
 * netlistsvg sizes the drawing from the cell layout only, so port labels that are wider
 * than their symbol get cut off at the edges. Adds a margin sized for the longest port name.
 */
function addMargin(svg, netlist) {
  const portNames = Object.values(netlist.modules || {}).flatMap(mod => Object.keys(mod.ports || {}));
  const longest = portNames.reduce((max, name) => Math.max(max, name.length), 0);
  const marginX = Math.min(240, Math.ceil(12 + longest * 3.2));
  const marginY = 16;
  return svg.replace(/^(<svg\b[^>]*?)\swidth="([\d.]+)"\sheight="([\d.]+)"/, (match, head, w, h) => {
    const width = Number(w) + 2 * marginX;
    const height = Number(h) + 2 * marginY;
    return `${head} width="${width}" height="${height}" viewBox="${-marginX} ${-marginY} ${width} ${height}"`;
  });
}

// Cells the skin already labels itself (ports, submodules, constants) or that aren't gates.
const UNLABELLED_SKIN_TYPES = new Set(['generic', 'inputExt', 'outputExt', 'split', 'join', 'constant', 'vcc', 'gnd']);

/** "$and" / "$logic_and" / "$_AND_" -> "AND", "$reduce_or" -> "OR", "$_DFF_P_" -> "DFF", ... */
function gateName(cellType) {
  const name = cellType
    .replace(/^\$_?/, '')
    .replace(/_$/, '')
    .replace(/^(logic|reduce)_/, '')
    .toUpperCase();
  if (/^(A|S|AL)?DFF/.test(name)) return 'DFF';
  if (name === 'BOOL') return 'OR';
  if (name === 'PMUX') return 'MUX';
  return name;
}

/**
 * Writes the gate's name (AND, OR, MUX, ...) below each gate symbol, so the schematic can
 * be read without knowing the symbol shapes. Below, because port names sit above their symbols.
 */
function addGateLabels(svg, netlist) {
  const modules = Object.values(netlist.modules || {});
  const top = modules.find(mod => Number(mod.attributes?.top) === 1) || modules[0];
  const cells = top?.cells || {};

  const labelled = svg.replace(
    /<g s:type="([^"]+)" transform="[^"]*" s:width="([\d.]+)" s:height="([\d.]+)" id="cell_([^"]*)">/g,
    (tag, skinType, width, height, cellName) => {
      const cellType = cells[cellName]?.type;
      if (UNLABELLED_SKIN_TYPES.has(skinType) || !cellType?.startsWith('$')) return tag;
      return `${tag}<text class="gateLabel" x="${Number(width) / 2}" y="${Number(height) + 10}">${gateName(cellType)}</text>`;
    }
  );
  return labelled.replace('</style>', '  .gateLabel {\n    text-anchor: middle;\n    font-size: 9px;\n  }</style>');
}

/**
 * yosys-slang names the module of every submodule instance after the instance
 * ("mux2$top.u_mux"); netlistsvg prints that type on the box. Shows "mux2" instead.
 */
function simplifySubmoduleTypes(netlist) {
  for (const mod of Object.values(netlist.modules || {})) {
    for (const cell of Object.values(mod.cells || {})) {
      const sep = cell.type?.indexOf('$') ?? -1;
      if (sep > 0) cell.type = cell.type.slice(0, sep);
    }
  }
  return netlist;
}

/**
 * netlistsvg only draws the top module (submodules are boxes), so everything else is
 * dropped before rendering. Keeps the rendered data small and the size limit meaningful.
 */
function keepTopModule(netlist) {
  const entries = Object.entries(netlist.modules || {});
  const top = entries.find(([, mod]) => Number(mod.attributes?.top) === 1) || entries[0];
  return top ? { ...netlist, modules: { [top[0]]: top[1] } } : netlist;
}

let skinPromise = null;
const loadSkin = () => (skinPromise ??= fs.readFile(SKIN_PATH, 'utf8'));

/**
 * Renders in a separate thread with a larger stack. Unlike a timeout around a call on
 * the main thread, terminating the thread really stops a layout that takes too long.
 */
function renderInThread(skin, netlist) {
  return new Promise((resolve, reject) => {
    const thread = new Worker(new URL('./netlistRenderThread.js', import.meta.url), {
      workerData: { skin, netlist },
      // Don't inherit the main process' node flags; the thread only needs its stack size
      execArgv: [],
      resourceLimits: { stackSizeMb: RENDER_STACK_MB },
    });
    const finish = (fn, value) => {
      clearTimeout(timer);
      thread.removeAllListeners();
      thread.terminate();
      fn(value);
    };
    const timer = setTimeout(() => finish(reject, new Error('netlist rendering timed out')), RENDER_TIMEOUT_MS);
    thread.on('message', msg => (msg.error ? finish(reject, new Error(msg.error)) : finish(resolve, msg.svg)));
    thread.on('error', err => finish(reject, err));
    thread.on('exit', code => finish(reject, new Error(`render thread exited with code ${code}`)));
  });
}

/**
 * Renders the Yosys JSON netlist written by the sim container into a schematic SVG.
 * Returns null if there is no netlist or it can't be rendered - the netlist is an
 * extra and must never turn a successful simulation into a failed one.
 * @param {string} netlistPath - Path to the netlist.json produced by Yosys
 * @returns {Promise<string|null>}
 */
export async function renderNetlistSvg(netlistPath) {
  try {
    const { size } = await fs.stat(netlistPath);
    if (size > MAX_NETLIST_FILE_BYTES) {
      console.warn(`[netlist] netlist.json too large (${size} bytes), skipping`);
      return null;
    }
    const netlist = simplifySubmoduleTypes(keepTopModule(JSON.parse(await fs.readFile(netlistPath, 'utf8'))));
    const topSize = JSON.stringify(netlist).length;
    if (topSize > MAX_NETLIST_JSON_BYTES) {
      console.warn(`[netlist] top module too large to draw (${topSize} bytes), skipping`);
      return null;
    }
    const svg = await renderInThread(await loadSkin(), netlist);
    if (typeof svg !== 'string' || svg.length > MAX_NETLIST_SVG_BYTES) return null;
    return addMargin(addGateLabels(svg, netlist), netlist);
  } catch (err) {
    if (err?.code !== 'ENOENT') console.warn('[netlist] Could not render netlist:', err?.message || err);
    return null;
  }
}

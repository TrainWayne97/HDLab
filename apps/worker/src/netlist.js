import { promises as fs } from 'fs';
import { createHash } from 'crypto';
import { createRequire } from 'module';
import { Worker } from 'worker_threads';

const require = createRequire(import.meta.url);
const SKIN_PATH = require.resolve('netlistsvg/lib/default.svg');

// Guards against designs that would produce a schematic nobody can read anyway.
// The file holds all modules (e.g. caches with large memories can make it several MB),
// but only one module is drawn at a time: the limit for the drawn part stays small.
export const MAX_NETLIST_FILE_BYTES = 32 * 1024 * 1024;
const MAX_NETLIST_JSON_BYTES = 1024 * 1024;
const MAX_NETLIST_SVG_BYTES = 4 * 1024 * 1024;
const RENDER_TIMEOUT_MS = 20000;
// netlistsvg recurses deeply on wide buses and large designs: the default stack of ~1 MB
// overflows. In tests a 32-bit ALU needed 4 MB, a pipelined RV32 CPU (171 top-level cells)
// 128 MB. The stack is only committed as far as it is used.
const RENDER_STACK_MB = 256;
// Hierarchy for the viewer: yosys-slang creates one module per instance, so a generate loop
// can produce thousands. Beyond these limits the tree is cut off.
const MAX_TREE_NODES = 3000;
const MAX_TREE_DEPTH = 24;
const MAX_DISTINCT_MODULES = 500;
// Room above a submodule box for its label, part of the clickable area
const LABEL_HEIGHT = 14;

/** "alu$top.u_alu" -> "alu": yosys-slang names each instance's module after the instance. */
const baseName = type => {
  const sep = type.indexOf('$');
  return sep > 0 ? type.slice(0, sep) : type;
};

/**
 * netlistsvg sizes the drawing from the cell layout only, so port labels and submodule
 * labels that are wider than their symbol get cut off at the edges. Adds a margin sized for
 * the longest of them. Returns the margins, which shift all coordinates of the drawing.
 */
function addMargin(svg, netlist) {
  const mods = Object.values(netlist.modules || {});
  const labels = [
    ...mods.flatMap(mod => Object.keys(mod.ports || {})),
    ...mods.flatMap(mod => Object.values(mod.cells || {}).map(cell => (cell.type?.startsWith('$') ? '' : cell.type || ''))),
  ];
  const longest = labels.reduce((max, name) => Math.max(max, name.length), 0);
  const marginX = Math.min(240, Math.ceil(12 + longest * 3.2));
  const marginY = 16;
  const out = svg.replace(/^(<svg\b[^>]*?)\swidth="([\d.]+)"\sheight="([\d.]+)"/, (match, head, w, h) => {
    const width = Number(w) + 2 * marginX;
    const height = Number(h) + 2 * marginY;
    return `${head} width="${width}" height="${height}" viewBox="${-marginX} ${-marginY} ${width} ${height}"`;
  });
  return { svg: out, marginX, marginY };
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

const CELL_TAG = /<g s:type="([^"]+)" transform="translate\(([-\d.]+),([-\d.]+)\)" s:width="([\d.]+)" s:height="([\d.]+)" id="cell_([^"]*)">/g;

const unescapeXml = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
// Cell types come from the user's design (escaped identifiers may contain any character)
const escapeXml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/**
 * Writes the gate's name (AND, OR, MUX, ...) below each gate symbol, so the schematic can
 * be read without knowing the symbol shapes. Below, because port names sit above their symbols.
 */
function addGateLabels(svg, cells) {
  const labelled = svg.replace(CELL_TAG, (tag, skinType, x, y, width, height, cellName) => {
    const cellType = cells[unescapeXml(cellName)]?.type;
    if (UNLABELLED_SKIN_TYPES.has(skinType) || !cellType?.startsWith('$')) return tag;
    return `${tag}<text class="gateLabel" x="${Number(width) / 2}" y="${Number(height) + 10}">${escapeXml(gateName(cellType))}</text>`;
  });
  return labelled.replace('</style>', '  .gateLabel {\n    text-anchor: middle;\n    font-size: 9px;\n  }</style>');
}

/**
 * Clickable areas of the submodule boxes, in pixels of the final SVG (after the margin):
 * [{ cell, x, y, w, h }]. The viewer lays them over the image to open a submodule.
 */
function findHotspots(svg, submoduleCells, marginX, marginY) {
  const hotspots = [];
  for (const m of svg.matchAll(CELL_TAG)) {
    const [, , x, y, width, height, rawName] = m;
    const cell = unescapeXml(rawName);
    if (!submoduleCells.has(cell)) continue;
    // The generic box grows with its ports; its real size is on the body rect
    const body = svg.slice(m.index, m.index + 2000).match(/<rect width="([\d.]+)" height="([\d.]+)" s:generic="body"/);
    const w = Number(body?.[1] ?? width);
    const h = Number(body?.[2] ?? height);
    hotspots.push({ cell, x: Number(x) + marginX, y: Number(y) + marginY - LABEL_HEIGHT, w, h: h + LABEL_HEIGHT });
  }
  return hotspots;
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
 * Draws one module (a netlist with just that module, see analyzeHierarchy).
 * Submodules are boxes labelled "instance : module".
 * @returns {Promise<{svg: string, hotspots: Array} | {error: string}>}
 */
export async function renderModule(netlist) {
  try {
    const size = JSON.stringify(netlist).length;
    if (size > MAX_NETLIST_JSON_BYTES) return { error: `Modul zu groß zum Zeichnen (${Math.round(size / 1024)} KB Netlist)` };
    const mod = Object.values(netlist.modules)[0];
    const svg = await renderInThread(await loadSkin(), netlist);
    if (typeof svg !== 'string' || svg.length > MAX_NETLIST_SVG_BYTES) return { error: 'Schaltplan zu groß' };
    const { svg: withMargin, marginX, marginY } = addMargin(addGateLabels(svg, mod.cells || {}), netlist);
    const submoduleCells = new Set(Object.entries(mod.cells || {}).filter(([, c]) => !c.type.startsWith('$')).map(([name]) => name));
    return { svg: withMargin, hotspots: findHotspots(withMargin, submoduleCells, marginX, marginY) };
  } catch (err) {
    console.warn('[netlist] Could not render module:', err?.message || err);
    return { error: /timed out/.test(err?.message) ? 'Zeitüberschreitung beim Zeichnen (Modul zu groß)' : 'Schaltplan konnte nicht erzeugt werden' };
  }
}

/**
 * Splits the hierarchical Yosys netlist into modules to draw one at a time.
 * yosys-slang creates a module per instance; instances whose modules have the same
 * structure (same module, parameters and children) share one drawing (`key`).
 * @returns {{ topKey: string, tree: object, modules: Map<string, {name: string, cells: number, netlist: object}> }}
 */
export function analyzeHierarchy(netlist) {
  const all = netlist.modules || {};
  const names = Object.keys(all);
  const topName = names.find(n => Number(all[n].attributes?.top) === 1) || names[0];
  if (!topName) return null;
  const isSubmodule = type => !type.startsWith('$') && !!all[type];

  const keys = new Map(); // module name -> key
  const modules = new Map(); // key -> drawing data
  const keyOf = (name, stack) => {
    if (keys.has(name)) return keys.get(name);
    const mod = all[name];
    const cells = Object.keys(mod.cells || {}).sort().map(cellName => {
      const cell = mod.cells[cellName];
      // A module instantiating itself can't be resolved; it stays a box
      const child = isSubmodule(cell.type) && !stack.includes(cell.type) ? keyOf(cell.type, [...stack, name]) : null;
      return [cellName, child ? `module:${child}` : cell.type, cell.parameters, cell.connections];
    });
    const signature = JSON.stringify([baseName(name), mod.ports, cells]);
    const key = `m${createHash('sha1').update(signature).digest('hex').slice(0, 12)}`;
    keys.set(name, key);
    if (!modules.has(key) && modules.size < MAX_DISTINCT_MODULES) {
      // Only what netlistsvg needs; submodules show "instance : module" on their box
      const drawCells = {};
      for (const [cellName, cell] of Object.entries(mod.cells || {})) {
        const { src, hdlname, ...attributes } = cell.attributes || {};
        drawCells[cellName] = {
          type: isSubmodule(cell.type) ? `${cellName} : ${baseName(cell.type)}` : cell.type,
          port_directions: cell.port_directions,
          connections: cell.connections,
          attributes,
        };
      }
      modules.set(key, {
        name: baseName(name),
        cells: Object.keys(mod.cells || {}).length,
        netlist: { modules: { [baseName(name)]: { attributes: { top: 1 }, ports: mod.ports || {}, cells: drawCells } } },
      });
    }
    return key;
  };
  const topKey = keyOf(topName, []);

  // Instance tree: { inst, name, key, children }
  let count = 0;
  let truncated = false;
  const build = (name, inst, depth, stack) => {
    count++;
    const node = { inst, name: baseName(name), key: keys.get(name), children: [] };
    if (depth >= MAX_TREE_DEPTH || stack.includes(name)) return node;
    const mod = all[name];
    for (const cellName of Object.keys(mod.cells || {}).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))) {
      const type = mod.cells[cellName].type;
      if (!isSubmodule(type)) continue;
      if (count >= MAX_TREE_NODES) {
        truncated = true;
        break;
      }
      node.children.push(build(type, cellName, depth + 1, [...stack, name]));
    }
    return node;
  };
  const tree = build(topName, baseName(topName), 0, []);
  return { topKey, tree, truncated, modules };
}

/**
 * Takes the netlist.json written by the sim container (read by the caller, at most
 * MAX_NETLIST_FILE_BYTES): draws the top module right away and prepares all other modules,
 * which are drawn on request (see the "netlist-render" queue).
 * Returns null if the netlist is unusable - the netlist is an extra and must never turn a
 * successful simulation into a failed one.
 * @param {string} netlistJson
 * @returns {Promise<null | {svg: string|null, hotspots: Array, topKey: string, tree: object,
 *   truncated: boolean, modules: Array<{key, name, cells, netlist}>}>}
 */
export async function prepareNetlist(netlistJson) {
  try {
    const hierarchy = analyzeHierarchy(JSON.parse(netlistJson));
    if (!hierarchy) return null;
    const top = await renderModule(hierarchy.modules.get(hierarchy.topKey).netlist);
    if (top.error) console.warn(`[netlist] top module: ${top.error}`);
    return {
      svg: top.svg ?? null,
      hotspots: top.hotspots ?? [],
      topKey: hierarchy.topKey,
      tree: hierarchy.tree,
      truncated: hierarchy.truncated,
      modules: [...hierarchy.modules].map(([key, m]) => ({ key, ...m })),
    };
  } catch (err) {
    console.warn('[netlist] Could not prepare netlist:', err?.message || err);
    return null;
  }
}

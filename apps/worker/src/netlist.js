import { promises as fs } from 'fs';
import { createRequire } from 'module';
import netlistsvg from 'netlistsvg';

const require = createRequire(import.meta.url);
const SKIN_PATH = require.resolve('netlistsvg/lib/default.svg');

// Guards against designs that would produce a schematic nobody can read anyway.
const MAX_NETLIST_JSON_BYTES = 1024 * 1024;
const MAX_NETLIST_SVG_BYTES = 4 * 1024 * 1024;
const RENDER_TIMEOUT_MS = 20000;

/**
 * netlistsvg sizes the drawing from the cell layout only, so port labels that are wider
 * than their symbol get cut off at the edges. Adds a margin sized for the longest port name.
 */
function addMargin(svg, netlist) {
  const portNames = Object.values(netlist.modules || {}).flatMap(mod => Object.keys(mod.ports || {}));
  const longest = portNames.reduce((max, name) => Math.max(max, name.length), 0);
  const marginX = Math.min(240, Math.ceil(12 + longest * 3.2));
  const marginY = 12;
  return svg.replace(/^(<svg\b[^>]*?)\swidth="([\d.]+)"\sheight="([\d.]+)"/, (match, head, w, h) => {
    const width = Number(w) + 2 * marginX;
    const height = Number(h) + 2 * marginY;
    return `${head} width="${width}" height="${height}" viewBox="${-marginX} ${-marginY} ${width} ${height}"`;
  });
}

let skinPromise = null;
const loadSkin = () => (skinPromise ??= fs.readFile(SKIN_PATH, 'utf8'));

/**
 * Renders the Yosys JSON netlist written by the sim container into a schematic SVG.
 * Returns null if there is no netlist or it can't be rendered - the netlist is an
 * extra and must never turn a successful simulation into a failed one.
 * @param {string} netlistPath - Path to the netlist.json produced by Yosys
 * @returns {Promise<string|null>}
 */
export async function renderNetlistSvg(netlistPath) {
  let timer;
  try {
    const raw = await fs.readFile(netlistPath, 'utf8');
    if (raw.length > MAX_NETLIST_JSON_BYTES) {
      console.warn(`[netlist] netlist.json too large (${raw.length} bytes), skipping`);
      return null;
    }
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('netlist rendering timed out')), RENDER_TIMEOUT_MS);
    });
    const netlist = JSON.parse(raw);
    const svg = await Promise.race([netlistsvg.render(await loadSkin(), netlist), timeout]);
    if (typeof svg !== 'string' || svg.length > MAX_NETLIST_SVG_BYTES) return null;
    return addMargin(svg, netlist);
  } catch (err) {
    if (err?.code !== 'ENOENT') console.warn('[netlist] Could not render netlist:', err?.message || err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

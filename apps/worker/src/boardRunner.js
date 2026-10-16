import { promises as fs } from 'fs';
import path from 'path';
import { orderSvSources } from './svSources.js';
import { createJobDir, isVerilogIdentifier, readJobFile, readJobFileOr, removeJobDir, runSandbox } from './sandbox.js';

// MongoDB documents are limited to 16 MB
const MAX_BOARD_JSON_BYTES = 12 * 1024 * 1024;
// board.json as Yosys writes it (source locations, net names): compacted before storing
const MAX_RAW_BOARD_JSON_BYTES = 128 * 1024 * 1024;
const MAX_LOG_BYTES = 1024 * 1024;
const CONTAINER_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Keeps only what the board simulation in the browser needs from the Yosys netlist:
 * ports, cells (type, parameters, connections, directions) and initial values.
 * Drops source locations and internal net names, which make up most of the file.
 */
export function compactNetlist(netlist) {
  const modules = {};
  for (const [name, mod] of Object.entries(netlist.modules || {})) {
    const cells = {};
    for (const [cellName, cell] of Object.entries(mod.cells || {})) {
      cells[cellName] = {
        type: cell.type,
        parameters: cell.parameters,
        port_directions: cell.port_directions,
        connections: cell.connections,
      };
    }
    const netnames = {};
    for (const [netName, net] of Object.entries(mod.netnames || {})) {
      if (net.attributes?.init !== undefined) netnames[netName] = { bits: net.bits, attributes: { init: net.attributes.init } };
    }
    modules[name] = {
      attributes: mod.attributes?.top !== undefined ? { top: mod.attributes.top } : {},
      ports: mod.ports,
      cells,
      netnames,
    };
  }
  return { modules };
}

/**
 * Synthesizes the design for the board simulation (Yosys only, no Verilator run).
 * @param {Object} opts
 * @param {Array<{filename: string, content: string}>} opts.files - design sources (.sv/.v) and headers (.svh/.vh)
 * @param {string} opts.topModule - top module of the design
 * @param {string} [opts.topFile] - file holding the top module (compile order)
 * @returns {Promise<{log: string, boardJson?: string, failed?: boolean}>}
 */
export async function runBoardSynthesis({ files, topModule, topFile }) {
  // The top module ends up in the Yosys script
  if (!isVerilogIdentifier(topModule)) {
    return { log: `Ungültiger Name für das Top-Modul: ${String(topModule).slice(0, 128)}`, failed: true };
  }
  const tmpDir = await createJobDir('hdl-board-');
  try {
    const { sources } = orderSvSources(files, topFile);
    for (const file of files) {
      await fs.writeFile(path.join(tmpDir, file.filename), file.content, 'utf8');
    }
    const { code, timedOut } = await runSandbox(tmpDir, {
      MODE: 'board',
      TOPMODULE: topModule,
      SV_SOURCES: sources.join(' '),
    }, CONTAINER_TIMEOUT_MS);
    const log = await readJobFileOr(tmpDir, 'sim.log', { maxBytes: MAX_LOG_BYTES, truncate: true, encoding: 'utf8' }, '');
    if (timedOut) {
      return { log: `${log}\n\n[Board-Synthese nach ${CONTAINER_TIMEOUT_MS / 60000} min abgebrochen: Zeitlimit überschritten]`, failed: true };
    }
    if (code !== 0) return { log: log || `Board-Synthese fehlgeschlagen (Exit-Code ${code})`, failed: true };

    const raw = await readJobFile(tmpDir, 'board.json', { maxBytes: MAX_RAW_BOARD_JSON_BYTES, encoding: 'utf8' });
    const boardJson = JSON.stringify(compactNetlist(JSON.parse(raw)));
    if (boardJson.length > MAX_BOARD_JSON_BYTES) {
      return { log: `${log}\nDas Design ist zu groß für die Board-Simulation.`, failed: true };
    }
    return { log, boardJson };
  } catch (err) {
    return { log: err?.code === 'ETOOBIG' ? 'Das Design ist zu groß für die Board-Simulation.' : `Board-Synthese fehlgeschlagen: ${err?.message || err}`, failed: true };
  } finally {
    removeJobDir(tmpDir);
  }
}

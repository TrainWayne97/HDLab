import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { orderSvSources } from './svSources.js';

// MongoDB documents are limited to 16 MB
const MAX_BOARD_JSON_BYTES = 12 * 1024 * 1024;
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
  const baseTmp = '/simtmp';
  await fs.mkdir(baseTmp, { recursive: true });
  const tmpDir = await fs.mkdtemp(path.join(baseTmp, 'hdl-board-'));
  try {
    await fs.chmod(tmpDir, 0o777);
    const { sources } = orderSvSources(files, topFile);
    for (const file of files) {
      await fs.writeFile(path.join(tmpDir, file.filename), file.content, 'utf8');
    }
    const hostSimtmp = process.env.SIMTMP_HOST_PATH || '/simtmp';
    const code = await new Promise((resolve, reject) => {
      const docker = spawn('docker', [
        'run', '--rm',
        '-v', `${hostSimtmp}:/simtmp`,
        '-w', tmpDir,
        '-e', 'MODE=board',
        '-e', `TOPMODULE=${topModule}`,
        '-e', `SV_SOURCES=${sources.join(' ')}`,
        'hdl-sim-verilator',
      ]);
      const timer = setTimeout(() => docker.kill('SIGKILL'), CONTAINER_TIMEOUT_MS);
      docker.stdout.on('data', d => process.stdout.write(d));
      docker.stderr.on('data', d => process.stderr.write(d));
      docker.on('error', err => {
        clearTimeout(timer);
        reject(err);
      });
      docker.on('close', exitCode => {
        clearTimeout(timer);
        resolve(exitCode);
      });
    });
    const log = await fs.readFile(path.join(tmpDir, 'sim.log'), 'utf8').catch(() => '');
    if (code !== 0) return { log: log || `Board-Synthese fehlgeschlagen (Exit-Code ${code})`, failed: true };

    const raw = await fs.readFile(path.join(tmpDir, 'board.json'), 'utf8');
    const boardJson = JSON.stringify(compactNetlist(JSON.parse(raw)));
    if (boardJson.length > MAX_BOARD_JSON_BYTES) {
      return { log: `${log}\nDas Design ist zu groß für die Board-Simulation.`, failed: true };
    }
    return { log, boardJson };
  } catch (err) {
    return { log: `Board-Synthese fehlgeschlagen: ${err?.message || err}`, failed: true };
  } finally {
    fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

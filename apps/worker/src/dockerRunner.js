import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';

/**
 * Runs a Verilator simulation inside a Docker container.
 * Handles all file preparation, sim_main.cpp generation, and result collection.
 * @param {Object} opts
 * @param {Array<{filename: string, content: string}>} opts.files - Source files for simulation
 * @param {string} [opts.topModule] - Name of the top-level module (default: 'main')
 * @returns {Promise<{log: string, waveform?: Buffer}>}
 */
export async function runVerilatorSimulation({ files, topModule = 'main' }) {
  // Create a temporary directory in the project folder (simtmp)
  // Always work in the mounted /simtmp volume so host and container are in sync
  const baseTmp = '/simtmp';
  await fs.mkdir(baseTmp, { recursive: true });
  const tmpDir = await fs.mkdtemp(path.join(baseTmp, 'hdl-sim-'));
  // Determine host path (if running in container): /app/simtmp/... -> /home/aitor/git_repos/HDLab/simtmp/...
  // Fallback: If process.env.HOST_SIMTMP_DIR is set, use it as prefix
  let hostTmpDir = tmpDir;
  if (process.env.HOST_SIMTMP_DIR) {
    // tmpDir: /app/simtmp/hdl-sim-xyz
    // HOST_SIMTMP_DIR: /home/aitor/git_repos/HDLab/simtmp
    const subdir = path.relative(baseTmp, tmpDir);
    hostTmpDir = path.join(process.env.HOST_SIMTMP_DIR, subdir);
  }
  let log = '';
  let waveform = undefined;
  try {
    // Ensure directory is writable for Docker
    await fs.chmod(tmpDir, 0o777);
    // Write all provided files to the temp directory
    for (const file of files) {
      try {
        await fs.writeFile(path.join(tmpDir, file.filename), file.content, 'utf8');
      } catch (e) {
        console.error('[dockerRunner] Error writing file:', file.filename, e);
      }
    }
    const simMainPath = path.join(tmpDir, 'sim_main.cpp');
    try {
      await fs.access(simMainPath);
    } catch {
      // Dynamically generate sim_main.cpp for the desired top-level module
      const hasTestbench = files.some(f => f.filename === 'tb.sv');
      let simMainCpp = '';
      if (hasTestbench) {
        // If a testbench is present, use Vtb as the top module
        simMainCpp = `#include "Vtb.h"
      #include "verilated.h"
      int main(int argc, char **argv) {
        Verilated::commandArgs(argc, argv);
        Vtb* top = new Vtb;
        vluint64_t main_time = 0;
        while (!Verilated::gotFinish() && main_time < 1000) {
          top->eval();
          Verilated::timeInc(1);
          main_time++;
        }
        delete top;
        return 0;
      }
      `;
      } else {
        simMainCpp = `#include "V${topModule}.h"
      #include "verilated.h"
      int main(int argc, char **argv) {
        Verilated::commandArgs(argc, argv);
        V${topModule}* top = new V${topModule};
        vluint64_t main_time = 0;
        while (!Verilated::gotFinish() && main_time < 1000) {
          top->eval();
          Verilated::timeInc(1);
          main_time++;
        }
        delete top;
        return 0;
      }
      `;
      }
      await fs.writeFile(simMainPath, simMainCpp);
    }
    try {
      const filesInTmp = await fs.readdir(tmpDir);
      console.log('[dockerRunner] Dateien im tmpDir:', filesInTmp);
    } catch (e) {
      console.error('[dockerRunner] Fehler beim Lesen des tmpDir:', e);
    }
    await new Promise((resolve, reject) => {
      const docker = spawn('docker', [
        'run', '--rm',
        '-v', `${hostTmpDir}:/simtmp`,
        '-w', '/simtmp',
        'hdl-sim-verilator-test'
      ]);
      docker.stdout.on('data', d => process.stdout.write(d));
      docker.stderr.on('data', d => process.stderr.write(d));
      docker.on('close', async code => {
        // Immer sim.log lesen, egal ob Erfolg oder Fehler
        try {
          log = await fs.readFile(path.join(tmpDir, 'sim.log'), 'utf8');
        } catch {}
        if (code === 0) {
          resolve();
        } else {
          console.error('[dockerRunner] sim.log after failure:', log);
          reject({ code, log });
        }
      });
    });
    try {
      waveform = await fs.readFile(path.join(tmpDir, 'waveform.vcd'));
    } catch {}
    return { log, waveform };
  } catch (err) {
    // Wenn der Fehler ein Objekt mit log ist, gib das Log mit zurück
    if (err && typeof err === 'object' && 'log' in err) {
      return { log: err.log };
    }
    return { log };
  } finally {
    fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

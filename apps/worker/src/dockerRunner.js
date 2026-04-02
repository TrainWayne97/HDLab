import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';

/**
 * Führt eine Verilator-Simulation im Docker-Container aus.
 * @param {Object} opts
 * @param {Array<{filename: string, content: string}>} opts.files
 * @returns {Promise<{log: string, waveform?: Buffer}>}
 */
export async function runVerilatorSimulation({ files }) {
  // Temp-Verzeichnis im Projektordner (simtmp) anlegen
  // Immer im gemounteten Volume /simtmp arbeiten, damit Host und Container synchron sind
  const baseTmp = '/simtmp';
  await fs.mkdir(baseTmp, { recursive: true });
  const tmpDir = await fs.mkdtemp(path.join(baseTmp, 'hdl-sim-'));
  // Host-Pfad ermitteln (falls im Container): /app/simtmp/... -> /home/aitor/git_repos/HDLab/simtmp/...
  // Fallback: Wenn process.env.HOST_SIMTMP_DIR gesetzt ist, nutze diesen als Prefix
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
    await fs.chmod(tmpDir, 0o777);
    for (const file of files) {
      try {
        await fs.writeFile(path.join(tmpDir, file.filename), file.content, 'utf8');
      } catch (e) {
        console.error('[dockerRunner] Fehler beim Schreiben:', file.filename, e);
      }
    }
    const simMainPath = path.join(tmpDir, 'sim_main.cpp');
    try {
      await fs.access(simMainPath);
    } catch {
      await fs.writeFile(simMainPath, `#include "Vmain.h"\n#include "verilated.h"\nint main(int argc, char **argv) { Verilated::commandArgs(argc, argv); Vmain* top = new Vmain; while (!Verilated::gotFinish()) { top->eval(); } delete top; return 0; }\n`);
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
        'hdl-sim-verilator'
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

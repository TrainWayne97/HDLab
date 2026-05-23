import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

/**
 * Runs a Verilator simulation inside a Docker container.
 * Handles all file preparation, sim_main.cpp generation, and result collection.
 * @param {Object} opts
 * @param {Array<{filename: string, content: string}>} opts.files - Source files for simulation
 * @param {string} [opts.topModule] - Name of the top-level module (default: 'main')
 * @param {boolean} [opts.generateWave] - Whether waveform generation should be enabled
 * @returns {Promise<{log: string, waveform?: Buffer, failed?: boolean}>}
 */
export async function runVerilatorSimulation({ files, topModule = 'main', generateWave = false }) {
  // Create a temporary directory in the mounted /simtmp volume (host and container are in sync)
  const baseTmp = '/simtmp';
  await fs.mkdir(baseTmp, { recursive: true });
  const tmpDir = await fs.mkdtemp(path.join(baseTmp, 'hdl-sim-'));
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
      const simMainCpp = `#include "V${topModule}.h"
      #include "verilated.h"
      #if VM_TRACE
      #include "verilated_vcd_c.h"
      #endif
      #include <cstdlib>
      #include <string>
      #include <cstdio>
      int main(int argc, char **argv) {
        // Umleitung aller Ausgaben in sim.log
        FILE* logFile = freopen("sim.log", "w", stdout);
        freopen("sim.log", "w", stderr);
        
        // Sichere, dass die Log-Datei geschrieben wird
        if (logFile) fprintf(logFile, "");
        
        Verilated::commandArgs(argc, argv);
        V${topModule}* top = new V${topModule};
        
        // Ausgabe für Debugging
        printf("=== Starting Simulation of ${topModule} ===\\n");
        printf("Module initialized successfully\\n");
        fflush(stdout);
        
        const bool enableWave = (std::getenv("GENERATE_WAVE") && std::string(std::getenv("GENERATE_WAVE")) == "1");
        #if VM_TRACE
        VerilatedVcdC* tfp = nullptr;
        if (enableWave) {
          Verilated::traceEverOn(true);
          tfp = new VerilatedVcdC;
          top->trace(tfp, 99);
          tfp->open("waveform.vcd");
          printf("Waveform tracing enabled\\n");
        }
        #endif
        
        vluint64_t main_time = 0;
        int cycle_count = 0;
        
        // Simuliere mehrere Zyklen
        while (!Verilated::gotFinish() && main_time < 100) {
          top->eval();
          
          // Gebe Output periodisch aus
          if (main_time % 25 == 0) {
            printf("Cycle %lu: Evaluation successful\\n", main_time);
            fflush(stdout);
          }
          
          #if VM_TRACE
          if (tfp) tfp->dump(main_time);
          #endif
          Verilated::timeInc(1);
          main_time++;
          cycle_count++;
        }
        
        printf("=== Simulation Complete ===\\n");
        printf("Total cycles simulated: %d\\n", cycle_count);
        printf("Status: SUCCESS\\n");
        fflush(stdout);
        
        #if VM_TRACE
        if (tfp) {
          tfp->close();
          delete tfp;
        }
        #endif
        delete top;
        fflush(stdout);
        #ifdef VL_PRINTF
        Verilated::flushCall();
        #endif
        return 0;
      }
      `;
      await fs.writeFile(simMainPath, simMainCpp);
    }
    // Sicherstellen, dass alle Dateien sichtbar sind, bevor der Container startet
    try {
      const absTmpDir = path.resolve(tmpDir);
      const exists = await fs.access(absTmpDir).then(() => true).catch(() => false);
      let filesInTmp = [];
      if (exists) {
        filesInTmp = await fs.readdir(absTmpDir);
      }
      // Host-Simtmp-Pfad aus ENV
      const hostSimtmp = process.env.SIMTMP_HOST_PATH || '/simtmp';
      console.log('[dockerRunner] ABSOLUTE tmpDir:', absTmpDir);
      console.log('[dockerRunner] tmpDir exists:', exists);
      console.log('[dockerRunner] Dateien im tmpDir:', filesInTmp);
      console.log('[dockerRunner] process.cwd():', process.cwd());
      console.log('[dockerRunner] hostSimtmp (from ENV):', hostSimtmp);
    } catch (e) {
      console.error('[dockerRunner] Fehler beim Lesen des tmpDir:', e);
    }
    // Kurzes Delay, damit das Filesystem synchronisiert ist
    await new Promise(r => setTimeout(r, 100));
    await new Promise((resolve, reject) => {
      console.log('[dockerRunner] Starte Docker mit Arbeitsverzeichnis:', tmpDir);
      // Host-Simtmp-Pfad aus ENV
      const hostSimtmp = process.env.SIMTMP_HOST_PATH || '/simtmp';
      const cocotbTestModule = files.find(f => f.filename.endsWith('.py'))
        ? path.basename(files.find(f => f.filename.endsWith('.py')).filename, '.py')
        : 'tb';
      if (!hostSimtmp) {
        throw new Error('SIMTMP_HOST_PATH environment variable is not set!');
      }
      const docker = spawn('docker', [
        'run', '--rm',
        '-v', `${hostSimtmp}:/simtmp`,
        '-w', tmpDir,
        '-e', `TOPMODULE=${topModule}`,
        '-e', `COCOTB_TEST_MODULES=${cocotbTestModule}`,
        '-e', `GENERATE_WAVE=${generateWave ? '1' : '0'}`,
        'hdl-sim-verilator'
      ], {
        env: process.env,
      });
      docker.stdout.on('data', d => process.stdout.write(d));
      docker.stderr.on('data', d => process.stderr.write(d));
      docker.on('close', async code => {
        // Immer sim.log lesen, egal ob Erfolg oder Fehler
        try {
          log = await fs.readFile(path.join(tmpDir, 'sim.log'), 'utf8');
          if (log && log.trim().length > 0) {
            console.log('[dockerRunner] Inhalt von sim.log:', log);
          } else {
            console.warn('[dockerRunner] sim.log ist leer oder nicht vorhanden.');
          }
        } catch (e) {
          console.warn('[dockerRunner] Fehler beim Lesen von sim.log:', e);
        }
        if (code === 0) {
          resolve();
        } else {
          console.error('[dockerRunner] sim.log after failure:', log);
          reject({ code, log });
        }
      });
    });
    const waveformCandidates = [
      path.join(tmpDir, 'waveform.vcd'),
      path.join(tmpDir, 'dump.vcd'),
      path.join(tmpDir, 'sim_build', 'waveform.vcd'),
      path.join(tmpDir, 'sim_build', 'dump.vcd'),
      path.join(tmpDir, 'obj_dir', 'waveform.vcd'),
      path.join(tmpDir, 'obj_dir', 'dump.vcd'),
    ];

    for (const candidate of waveformCandidates) {
      try {
        waveform = await fs.readFile(candidate);
        break;
      } catch {}
    }
    return { log, waveform };
  } catch (err) {
    // Return log plus failure marker so caller can set simulation status accordingly.
    if (err && typeof err === 'object' && 'log' in err) {
      return { log: err.log, failed: true };
    }
    return { log, failed: true };
  } finally {
    fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

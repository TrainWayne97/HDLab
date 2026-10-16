import { promises as fs } from 'fs';
import path from 'path';
import { MAX_NETLIST_FILE_BYTES, prepareNetlist } from './netlist.js';
import { orderSvSources } from './svSources.js';
import { createJobDir, isVerilogIdentifier, readJobFile, readJobFileOr, removeJobDir, runSandbox } from './sandbox.js';

// Compile + run; the container is killed afterwards (endless loops in the design or testbench)
const SIM_TIMEOUT_MS = Number(process.env.VERILATOR_TIMEOUT) || 3 * 60 * 1000;
// Stored in MongoDB (documents are limited to 16 MB)
const MAX_LOG_BYTES = 1024 * 1024;
const MAX_WAVEFORM_BYTES = 15 * 1024 * 1024;

/**
 * Runs a Verilator simulation inside a Docker container.
 * Handles all file preparation, sim_main.cpp generation, and result collection.
 * @param {Object} opts
 * @param {Array<{filename: string, content: string}>} opts.files - Source files for simulation
 * @param {string} [opts.topModule] - Name of the top-level module (default: 'main')
 * @param {string} [opts.topFile] - File holding the design's top module (default: 'main.sv')
 * @param {boolean} [opts.generateWave] - Whether waveform generation should be enabled
 * @param {boolean} [opts.generateNetlist] - Whether a schematic of the design (main.sv) should be generated
 * @returns {Promise<{log: string, waveform?: Buffer, netlist?: object|null, failed?: boolean}>}
 *   netlist: top module drawn plus the hierarchy, see prepareNetlist in netlist.js
 */
export async function runVerilatorSimulation({ files, topModule = 'main', topFile = 'main.sv', generateWave = false, generateNetlist = false }) {
  // The top module ends up in generated C++ and in the container's build scripts
  if (!isVerilogIdentifier(topModule)) {
    return { log: `Ungültiger Name für das Top-Modul: ${String(topModule).slice(0, 128)}`, failed: true };
  }
  // Job directory in the mounted /simtmp volume (host and container are in sync)
  const tmpDir = await createJobDir('hdl-sim-');
  let log = '';
  let waveform = undefined;
  try {
    // Compile order: packages before the files that import them.
    // The netlist reads the design without testbench; additional files that only contain
    // modules are read as library (blackbox) so they can't be picked as schematic top.
    const { sources, packageFiles } = orderSvSources(files, topFile);
    const designSources = sources.filter(f => f !== 'tb.sv');
    const netlistSources = designSources.filter(f => f === topFile || packageFiles.has(f));
    const netlistLibs = designSources.filter(f => !netlistSources.includes(f));
    console.log('[dockerRunner] SV compile order:', sources);
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
    console.log('[dockerRunner] Starte Simulation in', tmpDir);
    const pyFile = files.find(f => f.filename.endsWith('.py'));
    const cocotbTestModule = pyFile ? path.basename(pyFile.filename, '.py') : 'tb';
    const { code, timedOut } = await runSandbox(tmpDir, {
      TOPMODULE: topModule,
      COCOTB_TEST_MODULES: cocotbTestModule,
      GENERATE_WAVE: generateWave ? '1' : '0',
      GENERATE_NETLIST: generateNetlist ? '1' : '0',
      SV_SOURCES: sources.join(' '),
      NETLIST_SOURCES: netlistSources.join(' '),
      NETLIST_LIBS: netlistLibs.join(' '),
    }, SIM_TIMEOUT_MS);

    // Always read sim.log, whether the run succeeded or not
    log = await readJobFileOr(tmpDir, 'sim.log', { maxBytes: MAX_LOG_BYTES, truncate: true, encoding: 'utf8' }, '');
    console.log(`[dockerRunner] Container beendet (Exit-Code ${code}), sim.log: ${log.length} Zeichen`);
    if (timedOut) {
      return { log: `${log}\n\n[Simulation nach ${Math.round(SIM_TIMEOUT_MS / 1000)} s abgebrochen: Zeitlimit überschritten (Endlosschleife oder fehlendes $finish?)]`, failed: true };
    }
    if (code !== 0) return { log, failed: true };

    const waveformCandidates = [
      'waveform.vcd',
      'dump.vcd',
      'sim_build/waveform.vcd',
      'sim_build/dump.vcd',
      'obj_dir/waveform.vcd',
      'obj_dir/dump.vcd',
    ];
    for (const candidate of waveformCandidates) {
      try {
        waveform = await readJobFile(tmpDir, candidate, { maxBytes: MAX_WAVEFORM_BYTES });
        break;
      } catch (err) {
        if (err?.code === 'ETOOBIG') {
          log += `\n\n[Waveform zu groß (max. ${MAX_WAVEFORM_BYTES / 1024 / 1024} MB) und wird nicht angezeigt - weniger Signale oder kürzere Simulation verwenden]`;
          break;
        }
        if (err?.code !== 'ENOENT') console.warn(`[dockerRunner] Not reading ${candidate}:`, err?.message || err);
      }
    }
    const netlistJson = generateNetlist
      ? await readJobFileOr(tmpDir, 'netlist.json', { maxBytes: MAX_NETLIST_FILE_BYTES, encoding: 'utf8' }, null)
      : null;
    const netlist = netlistJson ? await prepareNetlist(netlistJson) : null;
    return { log, waveform, netlist };
  } catch (err) {
    console.error('[dockerRunner] Simulation failed:', err);
    return { log, failed: true };
  } finally {
    removeJobDir(tmpDir);
  }
}


import amqp from 'amqplib';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
// Models
import Simulation from './models/Simulation.js';
import Project from './models/Project.js';
import Waveform from './models/Waveform.js';
import Netlist from './models/Netlist.js';
import { runVerilatorSimulation } from './dockerRunner.js';
import { firstModuleName, isHdlSource, isSafeFilename } from './svSources.js';
dotenv.config();

const MONGO_URL = process.env.MONGO_URL;
const RABBITMQ_URL = process.env.RABBITMQ_URL;
const SIMTMP_HOST_PATH = process.env.SIMTMP_HOST_PATH;
// Max. number of simulations this worker runs in parallel (each one is a Verilator container).
const WORKER_CONCURRENCY = Number(process.env.MAX_WORKERS) || 4;

['MONGO_URL', 'RABBITMQ_URL', 'SIMTMP_HOST_PATH'].forEach((key) => {
  if (!process.env[key]) {
    console.error(`[Worker] Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

function detectTestbenchTopModule(files) {
  const tbFile = files.find(f => f.filename === 'tb.sv');
  return tbFile ? firstModuleName(tbFile.content) : null;
}

/**
 * Processes a simulation job:
 * - Loads simulation and project from DB
 * - Prepares files and determines top module
 * - Runs Verilator simulation
 * - Stores log and waveform info in DB
 * @param {string} simulationId
 */
async function processSimulation(simulationId) {
  console.log(`[Worker] Processing simulation ${simulationId}`);
  const sim = await Simulation.findById(simulationId);
  if (!sim) return;
  await Simulation.findByIdAndUpdate(simulationId, { status: 'running', startedAt: new Date() });
  // Load project
  const project = await Project.findById(sim.projectId);
  if (!project) {
    await Simulation.findByIdAndUpdate(simulationId, { status: 'error', finishedAt: new Date() });
    return;
  }
  // Debug: Log all filenames in the project
  if (project.files && project.files.length > 0) {
    console.log('[Worker] Files in project:', project.files.map(f => f.filename));
  } else {
    console.warn('[Worker] No files found in project!');
  }
  // Only HDL sources (.sv/.v: design, packages, submodules), Cocotb testbenches and sim_main.cpp.
  // File names are written into the temp dir, so anything that isn't a plain name is dropped.
  const files = (project.files || []).filter(f => {
    if (!isSafeFilename(f.filename)) {
      console.warn('[Worker] Skipping file with invalid name:', f.filename);
      return false;
    }
    return isHdlSource(f.filename) || f.filename.endsWith('.py') || f.filename === 'sim_main.cpp';
  });
  // File holding the design's top module: chosen in the editor, main.sv for older clients/tutorial
  const designFiles = files.filter(f => isHdlSource(f.filename) && f.filename !== 'tb.sv');
  const requestedTop = sim.settings?.topFile;
  const topFile = designFiles.find(f => f.filename === requestedTop)
    ?? designFiles.find(f => f.filename === 'main.sv')
    ?? designFiles[0];
  // Determine top-level module
  let topModule = firstModuleName(topFile?.content) || 'main';
  if (sim.settings && sim.settings.topModule) {
    topModule = sim.settings.topModule;
  } else if (sim.testbenchType && sim.testbenchType === 'systemverilog') {
    const detectedTopModule = detectTestbenchTopModule(files);
    if (detectedTopModule) {
      topModule = detectedTopModule;
      console.log(`[Worker] Auto-detected SV testbench top module: ${topModule}`);
    } else if (files.some(f => f.filename === 'tb.sv')) {
      // Backward-compatible fallback if parsing fails.
      topModule = 'tb';
      console.warn('[Worker] Could not parse module name from tb.sv, falling back to top module "tb"');
    }
  }
  try {
    const generateWave = !!sim?.settings?.generateWave;
    const generateNetlist = !!sim?.settings?.generateNetlist;
    const result = await runVerilatorSimulation({ files, topModule, topFile: topFile?.filename, generateWave, generateNetlist });

    if (result.failed) {
      await Waveform.deleteOne({ simulationId });
      await Netlist.deleteOne({ simulationId });
      await Simulation.findByIdAndUpdate(
        simulationId,
        {
          status: 'error',
          finishedAt: new Date(),
          resultRefs: {
            log: result.log || '',
            hasWaveform: false
          }
        }
      );
      console.warn(`[Worker] Simulation ${simulationId} finished with errors`);
      return;
    }

    if (result.waveform) {
      await Waveform.findOneAndUpdate(
        { simulationId },
        { simulationId, vcdData: result.waveform, createdAt: new Date() },
        { upsert: true, new: true }
      );
    } else {
      await Waveform.deleteOne({ simulationId });
    }

    if (result.netlistSvg) {
      await Netlist.findOneAndUpdate(
        { simulationId },
        { simulationId, svg: result.netlistSvg, createdAt: new Date() },
        { upsert: true, new: true }
      );
    } else {
      await Netlist.deleteOne({ simulationId });
    }

    // Store result (log, optional waveform) using findByIdAndUpdate for persistence
    await Simulation.findByIdAndUpdate(
      simulationId,
      {
        status: 'finished',
        finishedAt: new Date(),
        resultRefs: {
          log: result.log && result.log.trim().length > 0 ? result.log : 'Simulation abgeschlossen, aber kein Output (keine Testbench?)',
          hasWaveform: !!result.waveform,
          hasNetlist: !!result.netlistSvg
        }
      }
    );
    // Waveform could be stored in GridFS/Mongo later
    console.log(`[Worker] Finished simulation ${simulationId}`);
  } catch (err) {
    await Simulation.findByIdAndUpdate(
      simulationId,
      {
        status: 'error',
        finishedAt: new Date(),
        resultRefs: { log: err?.message || '' }
      }
    );
    console.error(`[Worker] Simulation error:`, err);
  }
}


async function connectRabbitMQWithRetry(url, retries = 10, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await amqp.connect(url);
    } catch (err) {
      console.warn(`[Worker] RabbitMQ not ready, retrying in ${delay / 1000}s... (${i + 1}/${retries})`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('RabbitMQ connection failed after retries');
}

async function main() {
  await mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('[Worker] MongoDB connected');

  const conn = await connectRabbitMQWithRetry(RABBITMQ_URL);
  const channel = await conn.createChannel();
  await channel.assertQueue('simulations', { durable: true });
  await channel.prefetch(WORKER_CONCURRENCY);
  console.log(`[Worker] Waiting for simulation jobs (concurrency: ${WORKER_CONCURRENCY})...`);

  channel.consume('simulations', async (msg) => {
    console.log('[Worker] Received message from queue:', msg ? msg.content.toString() : 'null');
    if (msg !== null) {
      try {
        const { simulationId } = JSON.parse(msg.content.toString());
        console.log('[Worker] Parsed simulationId:', simulationId);
        await processSimulation(simulationId);
        channel.ack(msg);
      } catch (err) {
        console.error('[Worker] Error processing job:', err);
        channel.nack(msg, false, false); // Verwerfe fehlerhafte Nachricht
      }
    } else {
      console.warn('[Worker] Received null message');
    }
  });
}

main().catch(err => {
  console.error('[Worker] Startup error:', err);
  process.exit(1);
});

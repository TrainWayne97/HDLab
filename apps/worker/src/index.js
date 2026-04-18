
import amqp from 'amqplib';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
// Models
import Simulation from './models/Simulation.js';
import Project from './models/Project.js';
import { runVerilatorSimulation } from './dockerRunner.js';
dotenv.config();

const MONGO_URL = process.env.MONGO_URL;
const RABBITMQ_URL = process.env.RABBITMQ_URL;
const SIMTMP_HOST_PATH = process.env.SIMTMP_HOST_PATH;

['MONGO_URL', 'RABBITMQ_URL', 'SIMTMP_HOST_PATH'].forEach((key) => {
  if (!process.env[key]) {
    console.error(`[Worker] Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

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
  // Only HDL sources, Cocotb testbenches and sim_main.cpp
  const files = (project.files || []).filter(f =>
    f.filename.endsWith('.sv') ||
    f.filename.endsWith('.py') ||
    f.filename === 'sim_main.cpp'
  );
  // Determine top-level module
  let topModule = 'main';
  if (sim.settings && sim.settings.topModule) {
    topModule = sim.settings.topModule;
  } else if (sim.testbenchType && sim.testbenchType === 'systemverilog') {
    // If tb.sv exists, use tb as top-level
    if (files.some(f => f.filename === 'tb.sv')) topModule = 'tb';
  }
  try {
    const result = await runVerilatorSimulation({ files, topModule });
    // Store result (log, optional waveform) using findByIdAndUpdate for persistence
    await Simulation.findByIdAndUpdate(
      simulationId,
      {
        status: 'finished',
        finishedAt: new Date(),
        resultRefs: { log: result.log, hasWaveform: !!result.waveform }
      }
    );
    // Waveform could be stored in GridFS/Mongo later
    console.log(`[Worker] Finished simulation ${simulationId}`);
  } catch (err) {
    // Try to read and store the log from sim.log even on error
    let log = '';
    try {
      // Determine simtmp path as in runVerilatorSimulation
      const baseTmp = '/simtmp';
      const tmpDirs = await import('fs').then(fs => fs.promises.readdir(baseTmp));
      // Suche das zuletzt geänderte hdl-sim- Verzeichnis
      let latestDir = null;
      let latestMtime = 0;
      for (const d of tmpDirs) {
        if (d.startsWith('hdl-sim-')) {
          const stat = await import('fs').then(fs => fs.promises.stat(`${baseTmp}/${d}`));
          if (stat.mtimeMs > latestMtime) {
            latestMtime = stat.mtimeMs;
            latestDir = d;
          }
        }
      }
      if (latestDir) {
        log = await import('fs').then(fs => fs.promises.readFile(`${baseTmp}/${latestDir}/sim.log`, 'utf8')).catch(() => '');
      }
    } catch {}
    await Simulation.findByIdAndUpdate(
      simulationId,
      {
        status: 'error',
        finishedAt: new Date(),
        resultRefs: { log }
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
  console.log('[Worker] Waiting for simulation jobs...');

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

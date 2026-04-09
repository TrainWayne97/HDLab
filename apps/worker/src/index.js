import amqp from 'amqplib';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Models

import Simulation from './models/Simulation.js';
import Project from './models/Project.js';
import { runVerilatorSimulation } from './dockerRunner.js';

dotenv.config();

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/hdl';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://user:password@localhost:5672';

async function processSimulation(simulationId) {
  console.log(`[Worker] Processing simulation ${simulationId}`);
  const sim = await Simulation.findById(simulationId);
  if (!sim) return;
  await Simulation.findByIdAndUpdate(simulationId, { status: 'running', startedAt: new Date() });
  // Projekt laden
  const project = await Project.findById(sim.projectId);
  if (!project) {
    await Simulation.findByIdAndUpdate(simulationId, { status: 'error', finishedAt: new Date() });
    return;
  }
  // Debug: Alle Dateinamen im Projekt loggen
  if (project.files && project.files.length > 0) {
    console.log('[Worker] Dateien im Projekt:', project.files.map(f => f.filename));
  } else {
    console.warn('[Worker] Keine Dateien im Projekt gefunden!');
  }
  // Alle .sv-Dateien und sim_main.cpp
  const files = project.files.filter(f => f.filename.endsWith('.sv') || f.filename === 'sim_main.cpp');
  // Top-Level-Modul bestimmen
  let topModule = 'main';
  if (sim.settings && sim.settings.topModule) {
    topModule = sim.settings.topModule;
  } else if (sim.testbenchType && sim.testbenchType === 'systemverilog') {
    // Wenn eine Datei tb.sv existiert, nimm tb als Top-Level
    if (files.some(f => f.filename === 'tb.sv')) topModule = 'tb';
  }
  try {
    const result = await runVerilatorSimulation({ files, topModule });
    // Ergebnis speichern (Log, Waveform optional) per findByIdAndUpdate, damit resultRefs sicher persistiert wird
    await Simulation.findByIdAndUpdate(
      simulationId,
      {
        status: 'finished',
        finishedAt: new Date(),
        resultRefs: { log: result.log, hasWaveform: !!result.waveform }
      }
    );
    // Waveform könnte in GridFS/Mongo gespeichert werden (später)
    console.log(`[Worker] Finished simulation ${simulationId}`);
  } catch (err) {
    // Versuche, das Log aus sim.log trotzdem zu lesen und zu speichern
    let log = '';
    try {
      // simtmp-Pfad wie in runVerilatorSimulation ermitteln
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




// -----------------------------
// HDLab Backend – API Routes
// -----------------------------
// Provides REST API for simulations, projects, health check.

import { Router } from 'express';
import Simulation from './models/Simulation.js';
import Project from './models/Project.js';
import fs from 'fs';
import path from 'path';

const router = Router();

/**
 * GET /simulations/:id/results
 * Retrieves the simulation result (log, optional waveform link) for a simulation.
 * - log: Console output of the simulation
 * - hasWaveform: true/false, whether a VCD file was generated
 * - waveformUrl: Download link (optional)
 */
router.get('/simulations/:id/results', async (req, res) => {
  try {
    const sim = await Simulation.findById(req.params.id);
    if (!sim) return res.status(404).json({ error: 'Simulation not found' });
    // Debug: print resultRefs
    console.log('[Backend] sim.resultRefs:', sim.resultRefs);
    // Log and waveform from resultRefs
    const log = sim.resultRefs?.log || null;
    const hasWaveform = sim.resultRefs?.hasWaveform || false;
    // Optional: waveform as download link
    let waveformUrl = null;
    if (hasWaveform) {
      waveformUrl = `/api/simulations/${sim._id}/waveform`;
    }
    res.json({ log, hasWaveform, waveformUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /simulations/:id/waveform
 * Download the VCD waveform file (currently not implemented)
 */
router.get('/simulations/:id/waveform', async (req, res) => {
  // Placeholder: waveform is not yet persistently stored
  res.status(404).send('Waveform download not implemented');
});

/**
 * GET /health
 * Health check for monitoring/load balancer
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

/**
 * POST /projects
 * Creates a new project (contains source code files)
 * Body: { name, files: [{filename, content, language}] }
 */
router.post('/projects', async (req, res) => {
  try {
    const project = new Project(req.body);
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /projects/:id
 * Retrieves a project (including files) by ID
 */
router.get('/projects/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Not found' });
    res.json(project);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// Simulationen
router.post('/simulations', async (req, res) => {
  try {
    // Simulation anlegen
    const simulation = new Simulation(req.body);
    await simulation.save();
    // Simulationsauftrag an RabbitMQ senden (später implementiert)
    if (req.amqpChannel) {
      const msg = JSON.stringify({ simulationId: simulation._id });
      try {
        await req.amqpChannel.sendToQueue('simulations', Buffer.from(msg));
        console.log('[Backend] Sent to RabbitMQ:', msg);
      } catch (err) {
        console.error('[Backend] Error sending to RabbitMQ:', err);
      }
    } else {
      console.warn('[Backend] No amqpChannel available, not sending to RabbitMQ');
    }
    res.status(201).json(simulation);
  } catch (err) {
    console.error('[Backend] Error in /simulations:', err);
    res.status(400).json({ error: err.message });
  }
});

router.get('/simulations/:id', async (req, res) => {
  try {
    const simulation = await Simulation.findById(req.params.id);
    if (!simulation) return res.status(404).json({ error: 'Not found' });
    res.json(simulation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


/**
 * GET /api/svfile?path=...
 * Lädt den Inhalt einer SV-Datei (SystemVerilog) aus dem Dateisystem.
 * Query: path (relativer Pfad ab Projektwurzel, z.B. "simtmp/testfile.txt" oder "simtmp/hdl-sim-XYZ/main.sv")
 */
router.get('/svfile', async (req, res) => {
  const relPath = req.query.path;
  if (!relPath || typeof relPath !== 'string') {
    return res.status(400).json({ error: 'Pfad (path) muss angegeben werden' });
  }
  // Nur .sv oder .txt erlauben
  if (!relPath.endsWith('.sv') && !relPath.endsWith('.txt')) {
    return res.status(400).json({ error: 'Nur .sv oder .txt Dateien erlaubt' });
  }
  // Pfad absichern (kein Zugriff außerhalb des Projekts)
  const absPath = path.resolve(process.cwd(), relPath);
  if (!absPath.startsWith(process.cwd())) {
    return res.status(403).json({ error: 'Pfad nicht erlaubt' });
  }
  try {
    const content = await fs.promises.readFile(absPath, 'utf8');
    res.json({ content });
  } catch (err) {
    res.status(404).json({ error: 'Datei nicht gefunden' });
  }
});

/**
 * POST /api/svfile
 * Speichert den Inhalt einer SV-Datei (SystemVerilog) im Dateisystem.
 * Body: { path: relativer Pfad, content: Dateiinhalt }
 */
router.post('/svfile', async (req, res) => {
  const { path: relPath, content } = req.body;
  if (!relPath || typeof relPath !== 'string') {
    return res.status(400).json({ error: 'Pfad (path) muss angegeben werden' });
  }
  if (!relPath.endsWith('.sv') && !relPath.endsWith('.txt')) {
    return res.status(400).json({ error: 'Nur .sv oder .txt Dateien erlaubt' });
  }
  const absPath = path.resolve(process.cwd(), relPath);
  if (!absPath.startsWith(process.cwd())) {
    return res.status(403).json({ error: 'Pfad nicht erlaubt' });
  }
  try {
    await fs.promises.writeFile(absPath, content, 'utf8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Fehler beim Speichern der Datei' });
  }
});

export default router;

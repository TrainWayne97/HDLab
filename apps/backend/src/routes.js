


// -----------------------------
// HDLab Backend – API Routes
// -----------------------------
// Provides REST API for simulations, projects, health check.
// Everything except /health and /auth requires a valid JWT; projects and
// simulations are only visible to the user who created them.

import { Router } from 'express';
import Simulation from './models/Simulation.js';
import Project from './models/Project.js';
import Waveform from './models/Waveform.js';
import TutorialProgress from './models/TutorialProgress.js';
import ModuleLibrary from './models/ModuleLibrary.js';
import fs from 'fs';
import path from 'path';
import authRoutes from './routes/auth.js';
import tutorialRoutes from './routes/tutorial.js';
import authenticateToken, { requireRole } from './middleware/auth.js';
import { createProject, createSimulation, isOwnedBy } from './services/simulations.js';

const router = Router();

/**
 * GET /simulations/:id/results
 * Retrieves the simulation result (log, optional waveform link) for a simulation.
 * - status: pending | running | finished | error
 * - log: Console output of the simulation
 * - hasWaveform: true/false, whether a VCD file was generated
 * - waveformUrl: Download link (optional)
 */
router.get('/simulations/:id/results', authenticateToken, async (req, res) => {
  try {
    const sim = await Simulation.findById(req.params.id);
    if (!sim || !isOwnedBy(sim.userId, req.userId)) return res.status(404).json({ error: 'Simulation not found' });
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
    res.json({ status: sim.status, log, hasWaveform, waveformUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /simulations/:id/waveform
 * Download the VCD waveform file (currently not implemented)
 */
router.get('/simulations/:id/waveform', authenticateToken, async (req, res) => {
  try {
    const sim = await Simulation.findById(req.params.id);
    if (!sim || !isOwnedBy(sim.userId, req.userId)) return res.status(404).json({ error: 'Simulation not found' });

    const waveform = await Waveform.findOne({ simulationId: sim._id });
    if (!waveform || !waveform.vcdData || waveform.vcdData.length === 0) {
      return res.status(404).send('Waveform not found');
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="waveform-${sim._id}.vcd"`);
    return res.send(waveform.vcdData);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
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
router.post('/projects', authenticateToken, async (req, res) => {
  try {
    const project = await createProject({ ownerId: req.userId, name: req.body.name, files: req.body.files });
    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /projects/:id
 * Retrieves a project (including files) by ID
 */
router.get('/projects/:id', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project || !isOwnedBy(project.ownerId, req.userId)) return res.status(404).json({ error: 'Not found' });
    res.json(project);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// Simulationen
router.post('/simulations', authenticateToken, async (req, res) => {
  try {
    // Nur eigene Projekte simulieren
    const project = await Project.findById(req.body.projectId);
    if (!project || !isOwnedBy(project.ownerId, req.userId)) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const { language, testbenchType, topModule, settings } = req.body;
    const simulation = await createSimulation({
      userId: req.userId,
      amqpChannel: req.amqpChannel,
      projectId: project._id,
      language,
      testbenchType,
      topModule,
      settings,
    });
    res.status(201).json(simulation);
  } catch (err) {
    console.error('[Backend] Error in /simulations:', err);
    res.status(400).json({ error: err.message });
  }
});

router.get('/simulations/:id', authenticateToken, async (req, res) => {
  try {
    const simulation = await Simulation.findById(req.params.id);
    if (!simulation || !isOwnedBy(simulation.userId, req.userId)) return res.status(404).json({ error: 'Not found' });
    res.json(simulation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


/**
 * GET /api/svfile?path=...
 * Lädt den Inhalt einer SV-Datei (SystemVerilog) aus dem Dateisystem. Nur für admin/developer.
 * Query: path (relativer Pfad ab Projektwurzel, z.B. "simtmp/testfile.txt" oder "simtmp/hdl-sim-XYZ/main.sv")
 */
router.get('/svfile', authenticateToken, requireRole('admin', 'developer'), async (req, res) => {
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
  if (!absPath.startsWith(process.cwd() + path.sep)) {
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
 * Speichert den Inhalt einer SV-Datei (SystemVerilog) im Dateisystem. Nur für admin/developer.
 * Body: { path: relativer Pfad, content: Dateiinhalt }
 */
router.post('/svfile', authenticateToken, requireRole('admin', 'developer'), async (req, res) => {
  const { path: relPath, content } = req.body;
  if (!relPath || typeof relPath !== 'string') {
    return res.status(400).json({ error: 'Pfad (path) muss angegeben werden' });
  }
  if (!relPath.endsWith('.sv') && !relPath.endsWith('.txt')) {
    return res.status(400).json({ error: 'Nur .sv oder .txt Dateien erlaubt' });
  }
  const absPath = path.resolve(process.cwd(), relPath);
  if (!absPath.startsWith(process.cwd() + path.sep)) {
    return res.status(403).json({ error: 'Pfad nicht erlaubt' });
  }
  try {
    await fs.promises.writeFile(absPath, content, 'utf8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Fehler beim Speichern der Datei' });
  }
});

// Legacy /tutorials/content and /tutorials/validate (plural, unauthenticated) were
// removed here: they duplicated the newer, authenticated /tutorial/validate (singular)
// in ./routes/tutorial.js, were no longer called by the frontend, and — unlike the new
// endpoint — accepted arbitrary code/testbench and triggered real DB writes and worker
// simulations without requiring authenticateToken. See apps/backend/README.md §8.5.

// ============ REGISTER NEW ROUTE MODULES ============
// Auth routes: /auth/register, /auth/login, /auth/me
router.use('/auth', authRoutes);

// Tutorial routes: /tutorial/progress, /modules
router.use('/', tutorialRoutes);

export default router;


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
import Netlist from './models/Netlist.js';
import NetlistModule from './models/NetlistModule.js';
import BoardNetlist from './models/BoardNetlist.js';
import authRoutes from './routes/auth.js';
import tutorialRoutes from './routes/tutorial.js';
import authenticateToken from './middleware/auth.js';
import { createLimiter, rateLimit, sendTooMany } from './middleware/rateLimit.js';
import { createProject, createSimulation, isOwnedBy } from './services/simulations.js';

const router = Router();

// Jede Simulation lädt vorher ein Projekt hoch: beide Limits gleich, pro Nutzer
const SIM_WINDOW_MS = 10 * 60 * 1000;
const SIM_MAX_PER_WINDOW = 120;
// Schaltpläne von Untermodulen, die zum Zeichnen eingereiht werden (pro Nutzer)
const netlistRenderRequests = createLimiter({ windowMs: 10 * 60 * 1000, max: 200 });

/**
 * GET /simulations/:id/results
 * Retrieves the simulation result (log, optional waveform link) for a simulation.
 * - status: pending | running | finished | error
 * - log: Console output of the simulation
 * - hasWaveform: true/false, whether a VCD file was generated
 * - waveformUrl: Download link (optional)
 * - hasNetlist: true/false, whether a schematic of the design was generated
 * - hasBoard: true/false, whether a netlist for the board simulation was generated
 */
router.get('/simulations/:id/results', authenticateToken, async (req, res) => {
  try {
    const sim = await Simulation.findById(req.params.id);
    if (!sim || !isOwnedBy(sim.userId, req.userId)) return res.status(404).json({ error: 'Simulation not found' });
    // Log and waveform from resultRefs
    const log = sim.resultRefs?.log || null;
    const hasWaveform = sim.resultRefs?.hasWaveform || false;
    // Optional: waveform as download link
    let waveformUrl = null;
    if (hasWaveform) {
      waveformUrl = `/api/simulations/${sim._id}/waveform`;
    }
    const hasNetlist = sim.resultRefs?.hasNetlist || false;
    const hasBoard = sim.resultRefs?.hasBoard || false;
    res.json({ status: sim.status, log, hasWaveform, waveformUrl, hasNetlist, hasBoard });
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
 * GET /simulations/:id/netlist
 * Schematic (SVG) of the simulated design, rendered by the worker from the Yosys netlist
 */
router.get('/simulations/:id/netlist', authenticateToken, async (req, res) => {
  try {
    const sim = await Simulation.findById(req.params.id);
    if (!sim || !isOwnedBy(sim.userId, req.userId)) return res.status(404).json({ error: 'Simulation not found' });

    const netlist = await Netlist.findOne({ simulationId: sim._id });
    if (!netlist?.svg) {
      return res.status(404).send('Netlist not found');
    }

    // The SVG is derived from user code: serve it as a download and never let it run as a document.
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="netlist-${sim._id}.svg"`);
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.send(netlist.svg);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// A module requested more than this long ago without result is requested again
// (e.g. the worker was restarted while drawing)
const NETLIST_RENDER_RETRY_MS = 60 * 1000;

/**
 * GET /simulations/:id/netlist/tree
 * Module hierarchy of the design for the netlist viewer: { topKey, tree, truncated, modules }
 * tree: { inst, name, key, children }, modules: key -> { name, cells, status }
 */
router.get('/simulations/:id/netlist/tree', authenticateToken, async (req, res) => {
  try {
    const sim = await Simulation.findById(req.params.id);
    if (!sim || !isOwnedBy(sim.userId, req.userId)) return res.status(404).json({ error: 'Simulation not found' });

    const netlist = await Netlist.findOne({ simulationId: sim._id }, { tree: 1, topKey: 1, treeTruncated: 1 });
    if (!netlist?.tree) return res.status(404).json({ error: 'Netlist hierarchy not found' });
    const docs = await NetlistModule.find({ simulationId: sim._id }, { key: 1, name: 1, cells: 1, status: 1 });
    const modules = Object.fromEntries(docs.map(d => [d.key, { name: d.name, cells: d.cells, status: d.status }]));
    return res.json({ topKey: netlist.topKey, tree: netlist.tree, truncated: !!netlist.treeTruncated, modules });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /simulations/:id/netlist/modules/:key
 * Schematic of one module: { status: 'done', svg, hotspots } | { status: 'error', error }.
 * Modules are drawn on first request; until then 202 { status: 'pending' } (poll again).
 * The SVG comes as JSON text and is only ever shown as an image in the frontend.
 */
router.get('/simulations/:id/netlist/modules/:key', authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    if (!/^m[0-9a-f]{12}$/.test(key)) return res.status(400).json({ error: 'Invalid module key' });
    const sim = await Simulation.findById(req.params.id);
    if (!sim || !isOwnedBy(sim.userId, req.userId)) return res.status(404).json({ error: 'Simulation not found' });

    const doc = await NetlistModule.findOne({ simulationId: sim._id, key }, { json: 0 });
    if (!doc) return res.status(404).json({ error: 'Module not found' });
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (doc.status === 'done') return res.json({ status: 'done', svg: doc.svg, hotspots: doc.hotspots || [] });
    if (doc.status === 'error') return res.json({ status: 'error', error: doc.error });

    const stale = doc.status === 'pending' && Date.now() - (doc.requestedAt?.getTime() || 0) > NETLIST_RENDER_RETRY_MS;
    if (doc.status === 'idle' || stale) {
      const { limited, retryAfter } = netlistRenderRequests.hit(String(req.userId));
      if (limited) return sendTooMany(res, retryAfter);
      // Only the request that flips the status queues the job
      const claimed = await NetlistModule.findOneAndUpdate(
        { _id: doc._id, status: doc.status, requestedAt: doc.requestedAt ?? null },
        { status: 'pending', requestedAt: new Date() }
      );
      if (claimed && req.amqpChannel) {
        req.amqpChannel.sendToQueue('netlist-render', Buffer.from(JSON.stringify({ simulationId: sim._id, key })), { persistent: true });
      }
    }
    return res.status(202).json({ status: 'pending' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /simulations/:id/board
 * Flattened Yosys netlist (JSON) of a board synthesis; it is simulated in the browser
 */
router.get('/simulations/:id/board', authenticateToken, async (req, res) => {
  try {
    const sim = await Simulation.findById(req.params.id);
    if (!sim || !isOwnedBy(sim.userId, req.userId)) return res.status(404).json({ error: 'Simulation not found' });

    const board = await BoardNetlist.findOne({ simulationId: sim._id });
    if (!board?.json) return res.status(404).json({ error: 'Board netlist not found' });

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.send(board.json);
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
router.post('/projects', authenticateToken, rateLimit({ windowMs: SIM_WINDOW_MS, max: SIM_MAX_PER_WINDOW, byUser: true }), async (req, res) => {
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
router.post('/simulations', authenticateToken, rateLimit({ windowMs: SIM_WINDOW_MS, max: SIM_MAX_PER_WINDOW, byUser: true }), async (req, res) => {
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
    console.error('[Backend] Error in /simulations:', err.message);
    res.status(err.status || 400).json({ error: err.message });
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


// /svfile (Lesen/Schreiben von .sv/.txt-Dateien im Arbeitsverzeichnis des Backends, nur
// admin/developer) wurde im Oktober 2026 entfernt: vom Frontend nicht genutzt, aber ein
// Schreibzugriff auf das Dateisystem des Backend-Containers.

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

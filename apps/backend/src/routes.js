


// -----------------------------
// HDLab Backend – API Routes
// -----------------------------
// Provides REST API for simulations, projects, health check.

import { Router } from 'express';
import Simulation from './models/Simulation.js';
import Project from './models/Project.js';
import Waveform from './models/Waveform.js';
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
  try {
    const sim = await Simulation.findById(req.params.id);
    if (!sim) return res.status(404).json({ error: 'Simulation not found' });

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
    // Falls topModule im Request enthalten ist, in settings ablegen
    const body = { ...req.body };
    if (body.topModule) {
      if (!body.settings) body.settings = {};
      body.settings.topModule = body.topModule;
      delete body.topModule;
    }
    // Simulation anlegen
    const simulation = new Simulation(body);
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

/**
 * GET /tutorials/content
 * Fetches the tutorial markdown content
 */
router.get('/tutorials/content', async (req, res) => {
  try {
    // Read tutorial markdown file
    const tutorialPath = path.join(process.cwd(), 'Tutorial', 'VerilogTutorial.md');
    const content = await fs.promises.readFile(tutorialPath, 'utf8');
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.send(content);
  } catch (err) {
    console.error('[Backend] Error reading tutorial:', err);
    res.status(404).json({ error: 'Tutorial not found' });
  }
});

/**
 * POST /tutorials/validate
 * Validates user's code submission for a tutorial lesson
 * Body: { lessonId, moduleCode, moduleName, testbench }
 * Returns: { success: boolean, errors?: string }
 */
router.post('/tutorials/validate', async (req, res) => {
  try {
    const { lessonId, moduleCode, moduleName, testbench } = req.body;

    // Input validation
    if (!lessonId || !moduleCode || !moduleName) {
      return res.status(400).json({ 
        success: false, 
        errors: 'Erforderliche Parameter fehlen: lessonId, moduleCode, moduleName' 
      });
    }

    // Create temporary simulation for validation
    try {
      // Create temporary project
      const tempProject = new Project({
        name: `tutorial-validate-${lessonId}`,
        files: [
          {
            filename: 'main.sv',
            content: moduleCode,
            language: 'systemverilog'
          }
        ]
      });
      await tempProject.save();

      // Create temporary simulation
      const tempSimulation = new Simulation({
        projectId: tempProject._id,
        settings: {
          hdlLanguage: 'systemverilog',
          testbenchLanguage: 'systemverilog',
          topModule: moduleName
        },
        code: moduleCode,
        testbench: testbench || '// Auto-generated testbench for ' + moduleName,
        testbenchLanguage: 'systemverilog'
      });
      await tempSimulation.save();

      // Send to simulation queue
      if (req.amqpChannel) {
        const msg = JSON.stringify({ 
          simulationId: tempSimulation._id,
          isValidation: true,
          lessonId: lessonId
        });
        
        try {
          await req.amqpChannel.sendToQueue('simulations', Buffer.from(msg));
          console.log('[Backend] Tutorial validation sent to queue:', msg);

          // Wait for simulation to complete (with timeout)
          const maxWaitTime = 30000; // 30 seconds
          const startTime = Date.now();
          
          const waitForCompletion = async () => {
            while (Date.now() - startTime < maxWaitTime) {
              const result = await Simulation.findById(tempSimulation._id);
              
              if (result.status === 'completed') {
                // Check if simulation passed
                const log = result.resultRefs?.log || '';
                const passed = checkValidationLog(log);
                
                if (passed) {
                  return res.json({ success: true });
                } else {
                  return res.json({ 
                    success: false, 
                    errors: extractValidationErrors(log) 
                  });
                }
              } else if (result.status === 'failed') {
                return res.json({ 
                  success: false, 
                  errors: 'Simulation failed: ' + (result.resultRefs?.log || 'Unknown error') 
                });
              }
              
              // Wait 500ms before checking again
              await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Timeout
            return res.json({ 
              success: false, 
              errors: 'Validation timeout - simulation took too long' 
            });
          };

          await waitForCompletion();
        } catch (err) {
          console.error('[Backend] Error sending to RabbitMQ:', err);
          return res.status(500).json({ 
            success: false, 
            errors: 'Simulation service error: ' + err.message 
          });
        }
      } else {
        // No RabbitMQ available, return immediate success (for development)
        console.warn('[Backend] No amqpChannel for validation, returning success');
        return res.json({ success: true });
      }
    } catch (dbError) {
      console.error('[Backend] Database error in validation:', dbError);
      return res.status(500).json({ 
        success: false, 
        errors: 'Database error: ' + dbError.message 
      });
    }
  } catch (err) {
    console.error('[Backend] Error in /tutorials/validate:', err);
    res.status(500).json({ 
      success: false, 
      errors: 'Server error: ' + err.message 
    });
  }
});

/**
 * Helper: Check if validation log indicates success
 */
function checkValidationLog(log) {
  if (!log) return false;
  
  const successPatterns = [
    /passed/i,
    /test.*pass/i,
    /success/i,
    /ok/i,
    /all tests pass/i,
    /✓/
  ];
  
  const failPatterns = [
    /failed/i,
    /fail/i,
    /error/i,
    /✗/,
    /assert/i,
    /exception/i
  ];
  
  // Check for explicit pass patterns
  for (const pattern of successPatterns) {
    if (pattern.test(log)) return true;
  }
  
  // Check for explicit fail patterns
  for (const pattern of failPatterns) {
    if (pattern.test(log)) return false;
  }
  
  // Default to false if no clear indication
  return false;
}

/**
 * Helper: Extract relevant error messages from simulation log
 */
function extractValidationErrors(log) {
  if (!log) return 'No output from simulation';
  
  const lines = log.split('\n');
  const relevantLines = lines.filter(line =>
    /error|fail|assert|exception|undefined|syntax/i.test(line)
  );
  
  if (relevantLines.length > 0) {
    return relevantLines.slice(0, 5).join('\n');
  }
  
  // Return first few lines if no specific errors found
  return lines.filter(l => l.trim()).slice(0, 3).join('\n');
}

export default router;

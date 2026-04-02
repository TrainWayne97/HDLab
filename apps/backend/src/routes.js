
import { Router } from 'express';
import mongoose from 'mongoose';
import Simulation from './models/Simulation.js';
import Project from './models/Project.js';
import fs from 'fs';
import path from 'path';

const router = Router();

// Ergebnis-Log und Waveform abrufen
router.get('/simulations/:id/results', async (req, res) => {
  try {
    const sim = await Simulation.findById(req.params.id);
    if (!sim) return res.status(404).json({ error: 'Simulation not found' });
    // Debug: resultRefs ausgeben
    console.log('[Backend] sim.resultRefs:', sim.resultRefs);
    // Log und Waveform aus resultRefs
    const log = sim.resultRefs?.log || null;
    const hasWaveform = sim.resultRefs?.hasWaveform || false;
    // Optional: Waveform als Download-Link
    let waveformUrl = null;
    if (hasWaveform) {
      waveformUrl = `/api/simulations/${sim._id}/waveform`;
    }
    res.json({ log, hasWaveform, waveformUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Waveform (VCD) als Download
router.get('/simulations/:id/waveform', async (req, res) => {
  // Hier: Dummy/Platzhalter, da Waveform aktuell nicht persistent gespeichert wird
  res.status(404).send('Waveform download not implemented');
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Projekte
router.post('/projects', async (req, res) => {
  try {
    const project = new Project(req.body);
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

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

export default router;

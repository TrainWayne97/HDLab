// -----------------------------
// HDLab Backend – Simulation service
// -----------------------------
// Shared by the REST routes and the tutorial validation, so the backend no longer
// has to call its own HTTP API to create projects and queue simulations.

import Simulation from '../models/Simulation.js';
import Project from '../models/Project.js';

// Besides main.sv and the testbench a project may contain additional files (packages,
// modules from the library). The worker writes them into a temp dir under these names.
const SAFE_FILENAME = /^[A-Za-z0-9_][A-Za-z0-9_.-]*$/;
const MAX_PROJECT_FILES = 32;

function validateFiles(files) {
  if (files === undefined) return;
  if (!Array.isArray(files)) throw new Error('files must be an array');
  if (files.length > MAX_PROJECT_FILES) throw new Error(`At most ${MAX_PROJECT_FILES} files per project`);
  const seen = new Set();
  for (const file of files) {
    const filename = file?.filename;
    if (typeof filename !== 'string' || filename.length > 128 || !SAFE_FILENAME.test(filename)) {
      throw new Error(`Invalid filename: ${String(filename).slice(0, 128)}`);
    }
    if (seen.has(filename)) throw new Error(`Duplicate filename: ${filename}`);
    seen.add(filename);
  }
}

/**
 * Creates a project owned by `ownerId`.
 * Only name and files are taken from the input - ownerId can't be overridden by the client.
 */
export async function createProject({ ownerId, name, files }) {
  validateFiles(files);
  const project = new Project({ ownerId, name, files });
  await project.save();
  return project;
}

/**
 * Creates a simulation for a project and queues it for the worker.
 * `topModule` (if given) is stored in settings, where the worker expects it.
 */
export async function createSimulation({ userId, amqpChannel, projectId, language, testbenchType, topModule, settings }) {
  const simulation = new Simulation({
    userId,
    projectId,
    language,
    testbenchType,
    settings: topModule ? { ...settings, topModule } : settings,
  });
  await simulation.save();

  if (amqpChannel) {
    const msg = JSON.stringify({ simulationId: simulation._id });
    try {
      await amqpChannel.sendToQueue('simulations', Buffer.from(msg));
      console.log('[Backend] Sent to RabbitMQ:', msg);
    } catch (err) {
      console.error('[Backend] Error sending to RabbitMQ:', err);
    }
  } else {
    console.warn('[Backend] No amqpChannel available, not sending to RabbitMQ');
  }
  return simulation;
}

/** True if the document owner is `userId` (documents without an owner belong to nobody). */
export function isOwnedBy(ownerId, userId) {
  return !!ownerId && String(ownerId) === String(userId);
}

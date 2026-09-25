// -----------------------------
// HDLab Backend – Simulation service
// -----------------------------
// Shared by the REST routes and the tutorial validation, so the backend no longer
// has to call its own HTTP API to create projects and queue simulations.

import Simulation from '../models/Simulation.js';
import Project from '../models/Project.js';

/**
 * Creates a project owned by `ownerId`.
 * Only name and files are taken from the input - ownerId can't be overridden by the client.
 */
export async function createProject({ ownerId, name, files }) {
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

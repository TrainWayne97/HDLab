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
const MAX_PROJECT_NAME_LENGTH = 128;
// Plain Verilog identifier; the worker puts it into generated C++ and build scripts
const TOP_MODULE = /^[A-Za-z_][A-Za-z0-9_$]{0,127}$/;
// Simulations of one user that may wait in the queue or run at the same time. Older ones
// don't count, so a simulation stuck after a worker crash doesn't block the user forever.
const MAX_ACTIVE_SIMULATIONS = 6;
const ACTIVE_WINDOW_MS = 15 * 60 * 1000;

/** Error with an HTTP status for the route handlers. */
export class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

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
    if (typeof file.content !== 'string') throw new Error(`Invalid content: ${filename}`);
    if (file.language !== undefined && (typeof file.language !== 'string' || file.language.length > 32)) {
      throw new Error(`Invalid language: ${filename}`);
    }
  }
}

/**
 * Creates a project owned by `ownerId`.
 * Only name and files are taken from the input - ownerId can't be overridden by the client.
 */
export async function createProject({ ownerId, name, files }) {
  validateFiles(files);
  if (name !== undefined && (typeof name !== 'string' || name.length > MAX_PROJECT_NAME_LENGTH)) {
    throw new Error('Invalid project name');
  }
  const project = new Project({
    ownerId,
    name,
    files: files?.map(({ filename, content, language }) => ({ filename, content, language })),
  });
  await project.save();
  return project;
}

/**
 * Only the settings the worker knows; anything else from the client is dropped.
 * `topModule` (if given) is stored in settings, where the worker expects it.
 */
function sanitizeSettings(settings, topModule) {
  const input = settings && typeof settings === 'object' ? settings : {};
  const clean = {};
  if (input.generateWave) clean.generateWave = true;
  if (input.generateNetlist) clean.generateNetlist = true;
  if (input.mode === 'board') clean.mode = 'board';
  if (input.topFile !== undefined && input.topFile !== null) {
    if (typeof input.topFile !== 'string' || input.topFile.length > 128 || !SAFE_FILENAME.test(input.topFile)) {
      throw new RequestError(400, 'Invalid topFile');
    }
    clean.topFile = input.topFile;
  }
  if (topModule !== undefined && topModule !== null && topModule !== '') {
    if (typeof topModule !== 'string' || !TOP_MODULE.test(topModule)) {
      throw new RequestError(400, 'Invalid top module name');
    }
    clean.topModule = topModule;
  }
  return clean;
}

/**
 * Creates a simulation for a project and queues it for the worker.
 * Throws RequestError(429) if the user already has too many simulations waiting or running.
 */
export async function createSimulation({ userId, amqpChannel, projectId, language, testbenchType, topModule, settings }) {
  const cleanSettings = sanitizeSettings(settings, topModule);
  if (language !== undefined && language !== null && (typeof language !== 'string' || language.length > 32)) {
    throw new RequestError(400, 'Invalid language');
  }
  const active = await Simulation.countDocuments({
    userId,
    status: { $in: ['pending', 'running'] },
    createdAt: { $gt: new Date(Date.now() - ACTIVE_WINDOW_MS) },
  });
  if (active >= MAX_ACTIVE_SIMULATIONS) {
    throw new RequestError(429, `Too many simulations in progress (max. ${MAX_ACTIVE_SIMULATIONS}), please wait for them to finish`);
  }

  const simulation = new Simulation({
    userId,
    projectId,
    language: language ?? undefined,
    testbenchType,
    settings: cleanSettings,
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

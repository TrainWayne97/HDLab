import { Router } from 'express';
import mongoose from 'mongoose';
import Note from '../models/Note.js';
import authenticateToken from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = Router();

// Obergrenzen pro Nutzer, damit ein einzelnes Konto die Datenbank nicht füllen kann
const MAX_NOTES_PER_USER = 200;
const MAX_CONTENT_LENGTH = 256 * 1024;
const MAX_TITLE_LENGTH = 200;

// Die Liste enthält keine Inhalte: 200 Notizen à 256 KB wären sonst bis zu 50 MB
const LIST_FIELDS = { title: 1, createdAt: 1, updatedAt: 1 };

const isText = (value, max) => typeof value === 'string' && value.length <= max;

/** Eigene Notiz per :id; fremde oder ungültige IDs werden wie nicht existierende behandelt. */
function ownNoteFilter(req) {
  return mongoose.isValidObjectId(req.params.id) ? { _id: req.params.id, userId: req.userId } : null;
}

/**
 * GET /notes
 * Alle Notizen des Nutzers ohne Inhalt, neueste zuerst
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const notes = await Note.find({ userId: req.userId }, LIST_FIELDS).sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /notes/:id
 * Eine Notiz mit Inhalt
 */
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const filter = ownNoteFilter(req);
    const note = filter && await Note.findOne(filter);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /notes
 * Legt eine Notiz an. Body: { content?, title? }
 */
router.post('/', authenticateToken, rateLimit({ windowMs: 10 * 60 * 1000, max: 60, byUser: true }), async (req, res, next) => {
  try {
    const { content = '', title = '' } = req.body;
    if (!isText(content, MAX_CONTENT_LENGTH) || !isText(title, MAX_TITLE_LENGTH)) {
      return res.status(400).json({ error: 'Invalid note' });
    }
    if ((await Note.countDocuments({ userId: req.userId })) >= MAX_NOTES_PER_USER) {
      return res.status(400).json({ error: 'Too many notes' });
    }

    const note = await Note.create({ userId: req.userId, content, title });
    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /notes/:id
 * Speichert den Inhalt (Autosave des Frontends). Body: { content, title }
 * Antwortet ohne Inhalt, nur mit den Listenfeldern.
 */
router.put('/:id', authenticateToken, rateLimit({ windowMs: 10 * 60 * 1000, max: 600, byUser: true }), async (req, res, next) => {
  try {
    const { content, title = '' } = req.body;
    if (!isText(content, MAX_CONTENT_LENGTH) || !isText(title, MAX_TITLE_LENGTH)) {
      return res.status(400).json({ error: 'Invalid note' });
    }

    const filter = ownNoteFilter(req);
    const note = filter && await Note.findOneAndUpdate(filter, { content, title }, { new: true, projection: LIST_FIELDS });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /notes/:id
 */
router.delete('/:id', authenticateToken, rateLimit({ windowMs: 10 * 60 * 1000, max: 120, byUser: true }), async (req, res, next) => {
  try {
    const filter = ownNoteFilter(req);
    const result = filter && await Note.deleteOne(filter);
    if (!result?.deletedCount) return res.status(404).json({ error: 'Note not found' });
    res.json({ message: 'Note deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;

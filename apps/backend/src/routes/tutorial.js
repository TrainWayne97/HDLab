import { Router } from 'express';
import TutorialProgress from '../models/TutorialProgress.js';
import ModuleLibrary from '../models/ModuleLibrary.js';
import authenticateToken from '../middleware/auth.js';

const router = Router();

// ============ TUTORIAL PROGRESS ENDPOINTS ============

/**
 * GET /tutorial/progress/:lessonId
 * Lädt den Fortschritt eines Benutzers für eine bestimmte Lektion
 */
router.get('/tutorial/progress/:lessonId', authenticateToken, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const progress = await TutorialProgress.findOne({
      userId: req.userId,
      lessonId: parseInt(lessonId),
    });

    if (!progress) {
      // Noch kein Fortschritt, gebe leeres Objekt zurück
      return res.json({
        lessonId,
        userCode: '',
        solution: '',
        isCompleted: false,
        validationStatus: 'not-started',
      });
    }

    res.json(progress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /tutorial/progress/:lessonId
 * Speichert den Fortschritt für eine Lektion
 * Body: { userCode, solution, isCompleted, validationStatus }
 */
router.post('/tutorial/progress/:lessonId', authenticateToken, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { userCode, solution, isCompleted, validationStatus } = req.body;

    const progress = await TutorialProgress.findOneAndUpdate(
      { userId: req.userId, lessonId: parseInt(lessonId) },
      {
        userCode,
        solution,
        isCompleted,
        validationStatus,
        submissionDate: isCompleted ? new Date() : null,
        lastModified: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({
      message: 'Progress saved',
      progress,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /tutorial/progress
 * Lädt den gesamten Fortschritt eines Benutzers
 */
router.get('/tutorial/progress', authenticateToken, async (req, res) => {
  try {
    const allProgress = await TutorialProgress.find({ userId: req.userId });
    res.json(allProgress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ MODULE LIBRARY ENDPOINTS ============

/**
 * GET /modules
 * Lädt alle Module eines Benutzers
 */
router.get('/modules', authenticateToken, async (req, res) => {
  try {
    const modules = await ModuleLibrary.find({ userId: req.userId });
    res.json(modules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /modules/:moduleName
 * Lädt ein spezifisches Modul
 */
router.get('/modules/:moduleName', authenticateToken, async (req, res) => {
  try {
    const { moduleName } = req.params;
    const module = await ModuleLibrary.findOne({
      userId: req.userId,
      moduleName,
    }).sort({ version: -1 }); // Neueste Version

    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    res.json(module);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /modules
 * Speichert ein neues Modul oder aktualisiert es
 * Body: { moduleName, code, description, sourceLesson, tags }
 */
router.post('/modules', authenticateToken, async (req, res) => {
  try {
    const { moduleName, code, description, sourceLesson, tags } = req.body;

    if (!moduleName || !code) {
      return res.status(400).json({ error: 'Module name and code are required' });
    }

    // Finde letzte Version
    const lastVersion = await ModuleLibrary.findOne({ userId: req.userId, moduleName })
      .sort({ version: -1 });
    const nextVersion = lastVersion ? lastVersion.version + 1 : 1;

    const newModule = new ModuleLibrary({
      userId: req.userId,
      moduleName,
      code,
      description: description || '',
      sourceLesson: sourceLesson || null,
      version: nextVersion,
      tags: tags || [],
    });

    await newModule.save();
    res.status(201).json({ message: 'Module saved', module: newModule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /modules/:moduleName
 * Aktualisiert ein existierendes Modul
 */
router.patch('/modules/:moduleName', authenticateToken, async (req, res) => {
  try {
    const { moduleName } = req.params;
    const { code, description, tags, usedInLessons } = req.body;

    // Aktuelle Version holen
    const current = await ModuleLibrary.findOne({ userId: req.userId, moduleName })
      .sort({ version: -1 });

    if (!current) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Neue Version erstellen (Versionierung)
    const updated = new ModuleLibrary({
      userId: req.userId,
      moduleName,
      code: code !== undefined ? code : current.code,
      description: description !== undefined ? description : current.description,
      sourceLesson: current.sourceLesson,
      usedInLessons: usedInLessons || current.usedInLessons,
      version: current.version + 1,
      tags: tags || current.tags,
    });

    await updated.save();
    res.json({ message: 'Module updated', module: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /modules/:moduleName
 * Löscht ein Modul
 */
router.delete('/modules/:moduleName', authenticateToken, async (req, res) => {
  try {
    const { moduleName } = req.params;
    await ModuleLibrary.deleteOne({ userId: req.userId, moduleName });
    res.json({ message: 'Module deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

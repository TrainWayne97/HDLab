import { Router } from 'express';
import TutorialProgress from '../models/TutorialProgress.js';
import ModuleLibrary from '../models/ModuleLibrary.js';
import Simulation from '../models/Simulation.js';
import authenticateToken from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { createProject, createSimulation } from '../services/simulations.js';

const router = Router();

// Obergrenzen pro Nutzer, damit ein einzelnes Konto die Datenbank nicht füllen kann
const MAX_CODE_LENGTH = 256 * 1024;
const MAX_PROGRESS_DOCS_PER_USER = 2000;
const MAX_MODULE_DOCS_PER_USER = 1000;
const MAX_MODULE_VERSIONS = 20;
const MAX_MODULE_NAME_LENGTH = 128;
const MAX_DESCRIPTION_LENGTH = 4096;
const VALIDATION_STATUSES = ['not-started', 'passed', 'failed'];

const isLessonId = (value) => /^\d{1,5}$/.test(String(value));
const isOptionalText = (value, max) => value === undefined || value === null || (typeof value === 'string' && value.length <= max);
const isTags = (value) => value === undefined || (Array.isArray(value) && value.length <= 20 && value.every((t) => typeof t === 'string' && t.length <= 64));
const isLessonList = (value) => value === undefined || (Array.isArray(value) && value.length <= 200 && value.every((n) => Number.isInteger(n)));

/** Löscht alte Versionen eines Moduls, sodass höchstens MAX_MODULE_VERSIONS übrig bleiben. */
async function pruneModuleVersions(userId, moduleName) {
  const old = await ModuleLibrary.find({ userId, moduleName }, { _id: 1 })
    .sort({ version: -1 })
    .skip(MAX_MODULE_VERSIONS);
  if (old.length) await ModuleLibrary.deleteMany({ _id: { $in: old.map((d) => d._id) } });
}

// ============ TUTORIAL PROGRESS ENDPOINTS ============

/**
 * Kurs aus ?course= lesen. Ohne Parameter = allgemeines Verilog-Tutorial,
 * damit bestehende Clients/Fortschritte unverändert funktionieren.
 */
function getCourseId(req) {
  const course = req.query.course;
  if (typeof course !== 'string' || course === '') return 'verilog';
  return /^[a-z0-9_-]{1,32}$/i.test(course) ? course.toLowerCase() : null;
}

/**
 * GET /tutorial/progress/:lessonId
 * Lädt den Fortschritt eines Benutzers für eine bestimmte Lektion
 */
router.get('/tutorial/progress/:lessonId', authenticateToken, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const courseId = getCourseId(req);
    if (!courseId) return res.status(400).json({ error: 'Invalid course' });
    if (!isLessonId(lessonId)) return res.status(400).json({ error: 'Invalid lesson' });

    const progress = await TutorialProgress.findOne({
      userId: req.userId,
      courseId,
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
router.post('/tutorial/progress/:lessonId', authenticateToken, rateLimit({ windowMs: 10 * 60 * 1000, max: 600, byUser: true }), async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { userCode, solution, isCompleted, validationStatus } = req.body;
    const courseId = getCourseId(req);
    if (!courseId) return res.status(400).json({ error: 'Invalid course' });
    if (!isLessonId(lessonId)) return res.status(400).json({ error: 'Invalid lesson' });
    if (!isOptionalText(userCode, MAX_CODE_LENGTH) || !isOptionalText(solution, MAX_CODE_LENGTH)) {
      return res.status(400).json({ error: 'Code is too large' });
    }
    if (validationStatus !== undefined && !VALIDATION_STATUSES.includes(validationStatus)) {
      return res.status(400).json({ error: 'Invalid validation status' });
    }

    const filter = { userId: req.userId, courseId, lessonId: parseInt(lessonId, 10) };
    if (!(await TutorialProgress.exists(filter))
        && (await TutorialProgress.countDocuments({ userId: req.userId })) >= MAX_PROGRESS_DOCS_PER_USER) {
      return res.status(400).json({ error: 'Too many saved lessons' });
    }

    const progress = await TutorialProgress.findOneAndUpdate(
      filter,
      {
        userCode,
        solution,
        isCompleted: !!isCompleted,
        validationStatus,
        submissionDate: isCompleted ? new Date() : null,
        lastModified: new Date(),
      },
      { upsert: true, new: true, runValidators: true }
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
    const courseId = getCourseId(req);
    if (!courseId) return res.status(400).json({ error: 'Invalid course' });

    const allProgress = await TutorialProgress.find({ userId: req.userId, courseId });
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
router.post('/modules', authenticateToken, rateLimit({ windowMs: 10 * 60 * 1000, max: 120, byUser: true }), async (req, res) => {
  try {
    const { moduleName, code, description, sourceLesson, tags } = req.body;

    if (typeof moduleName !== 'string' || !moduleName || typeof code !== 'string' || !code) {
      return res.status(400).json({ error: 'Module name and code are required' });
    }
    if (moduleName.length > MAX_MODULE_NAME_LENGTH || code.length > MAX_CODE_LENGTH
        || !isOptionalText(description, MAX_DESCRIPTION_LENGTH) || !isTags(tags)
        || (sourceLesson !== undefined && sourceLesson !== null && !Number.isInteger(sourceLesson))) {
      return res.status(400).json({ error: 'Invalid module' });
    }
    if ((await ModuleLibrary.countDocuments({ userId: req.userId })) >= MAX_MODULE_DOCS_PER_USER) {
      return res.status(400).json({ error: 'Module library is full' });
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
    await pruneModuleVersions(req.userId, moduleName);
    res.status(201).json({ message: 'Module saved', module: newModule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /modules/:moduleName
 * Aktualisiert ein existierendes Modul
 */
router.patch('/modules/:moduleName', authenticateToken, rateLimit({ windowMs: 10 * 60 * 1000, max: 120, byUser: true }), async (req, res) => {
  try {
    const { moduleName } = req.params;
    const { code, description, tags, usedInLessons } = req.body;
    if (!isOptionalText(code, MAX_CODE_LENGTH) || !isOptionalText(description, MAX_DESCRIPTION_LENGTH)
        || !isTags(tags) || !isLessonList(usedInLessons)) {
      return res.status(400).json({ error: 'Invalid module' });
    }

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
    await pruneModuleVersions(req.userId, moduleName);
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

// ============ TUTORIAL VALIDATION ENDPOINT ============

/**
 * POST /tutorial/validate
 * Validiert den Code eines Benutzers gegen die Lektion-Testbench.
 * Nutzt den bestehenden Simulations-Flow (Project → Simulation → Worker), aber direkt
 * über den Service statt über die eigene HTTP-API - Projekt und Simulation gehören dem Nutzer.
 * Body: { lessonId, moduleCode, testbench }
 */
router.post('/tutorial/validate', authenticateToken, rateLimit({ windowMs: 10 * 60 * 1000, max: 60, byUser: true }), async (req, res) => {
  const { lessonId, moduleCode, testbench } = req.body;

  if (typeof moduleCode !== 'string' || !moduleCode || typeof testbench !== 'string' || !testbench) {
    return res.status(400).json({ success: false, errors: 'moduleCode und testbench sind erforderlich' });
  }
  if (moduleCode.length > MAX_CODE_LENGTH || testbench.length > MAX_CODE_LENGTH) {
    return res.status(400).json({ success: false, errors: 'Code ist zu groß' });
  }

  try {
    // Inject $display for test_solved before $finish so the log is parseable.
    // The testbenches use output port test_solved instead of $display, so we add it.
    const instrumentedTestbench = injectTestSolvedDisplay(testbench);

    // 1. Projekt erstellen mit Modul + Testbench
    const project = await createProject({
      ownerId: req.userId,
      name: `tutorial_validation_lesson_${isLessonId(lessonId) ? lessonId : 'unknown'}`,
      files: [
        { filename: 'main.sv', content: moduleCode, language: 'systemverilog' },
        { filename: 'tb.sv', content: instrumentedTestbench, language: 'systemverilog' },
      ],
    });

    // 2. Simulation starten
    const sim = await createSimulation({
      userId: req.userId,
      amqpChannel: req.amqpChannel,
      projectId: project._id,
      language: 'systemverilog',
      testbenchType: 'systemverilog',
      // Waveform und Netlist werden im Tutorial unten im Dock angezeigt
      settings: { generateWave: true, generateNetlist: true },
    });

    // 3. Auf Ergebnis warten (max. 30 Sekunden)
    let result = null;
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const current = await Simulation.findById(sim._id);
      result = current?.resultRefs;
      if (result?.log) break;
    }

    if (!result?.log) {
      return res.status(504).json({ success: false, errors: 'Simulation Timeout: Kein Ergebnis nach 30 Sekunden' });
    }

    // 4. Log auswerten
    const log = result.log;
    const passed = checkValidationLog(log);
    // Volles Log immer mitschicken (gekappt), damit das Frontend bei Bedarf
    // die ausführliche Ausgabe anzeigen kann - die Kurzfassung unten filtert
    // teils relevante Zeilen (z.B. Warnings) heraus oder schneidet mitten im Kontext ab.
    const fullLog = log.slice(0, 20000);
    // Damit das Frontend Waveform/Netlist dieser Simulation nachladen kann
    const artifacts = {
      simulationId: sim._id,
      hasWaveform: !!result.hasWaveform,
      hasNetlist: !!result.hasNetlist,
    };

    if (passed) {
      return res.json({ success: true, fullLog, ...artifacts });
    } else {
      // Relevante Fehlerzeilen für die Kurzanzeige extrahieren (inkl. Warnings,
      // damit z.B. Verilator-/iverilog-Warnings nicht verschwinden)
      const errorLines = log
        .split('\n')
        .filter(l => /error|warning|fail|assert|mismatch/i.test(l))
        .slice(0, 20)
        .join('\n');
      return res.json({ success: false, errors: errorLines || log.slice(0, 500), fullLog, ...artifacts });
    }
  } catch (err) {
    if (err.status === 429) return res.status(429).json({ success: false, errors: err.message });
    console.error('[Tutorial Validate] Fehler:', err);
    res.status(500).json({ success: false, errors: 'Validierung fehlgeschlagen' });
  }
});

/**
 * Fügt vor jedem $finish eine Auswertung von test_solved ein, damit der
 * Simulations-Log eine Zeile "TEST_SOLVED=<bits>" enthält.
 * Funktioniert nur wenn der Testbench-Port test_solved heißt (Konvention).
 *
 * test_solved ist ein unpacked Array (ein Bit pro Testvektor, z.B.
 * `output logic test_solved [TEST_LENGTH]`), kein einzelner Bit-Vektor -
 * daher über die Elemente iterieren statt direkt mit %b zu formatieren.
 */
function injectTestSolvedDisplay(testbench) {
  // Bereits instrumentiert? Nicht doppelt einfügen.
  if (testbench.includes('TEST_SOLVED=')) return testbench;

  const dumpBlock = `begin : __test_solved_dump
      string __test_solved_bits;
      __test_solved_bits = "";
      for (int __i = 0; __i < $size(test_solved); __i++) begin
        __test_solved_bits = {__test_solved_bits, test_solved[__i] ? "1" : "0"};
      end
      $display("TEST_SOLVED=%s", __test_solved_bits);
    end
    `;

  // Vor jedem $finish den Dump-Block einfügen
  return testbench.replace(/(\$finish\s*;)/g, `${dumpBlock}$1`);
}

/**
 * Wertet den Simulations-Log aus.
 * Erwartet eine Zeile der Form:  TEST_SOLVED=1111
 * Alle Bits müssen 1 sein damit die Lektion als bestanden gilt.
 * Fällt auf allgemeine Pass/Fail-Keywords zurück wenn keine TEST_SOLVED-Zeile gefunden wird.
 */
function checkValidationLog(log) {
  // Compile-/Laufzeitfehler → sofort false
  if (/%Error|compilation error|syntax error/i.test(log)) return false;

  // TEST_SOLVED-Zeilen auswerten (injiziert von injectTestSolvedDisplay)
  const solvedMatches = [...log.matchAll(/TEST_SOLVED=([01x]+)/gi)];
  if (solvedMatches.length > 0) {
    return solvedMatches.every(m => /^1+$/.test(m[1]));
  }

  // Fallback: allgemeine Pass/Fail-Schlüsselwörter
  const hasFail = /\bfail(ed)?\b|\bassert\b.*failed/i.test(log);
  const hasPass = /\bpass(ed)?\b|\bsuccess\b/i.test(log);
  if (hasFail) return false;
  if (hasPass) return true;

  return false;
}

export default router;
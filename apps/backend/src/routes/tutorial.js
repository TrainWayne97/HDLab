import { Router } from 'express';
import TutorialProgress from '../models/TutorialProgress.js';
import ModuleLibrary from '../models/ModuleLibrary.js';
import authenticateToken from '../middleware/auth.js';

const BACKEND_BASE = process.env.BACKEND_URL ;

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

// ============ TUTORIAL VALIDATION ENDPOINT ============

/**
 * POST /tutorial/validate
 * Validiert den Code eines Benutzers gegen die Lektion-Testbench.
 * Nutzt den bestehenden Simulations-Flow (Projects → Simulations → Results).
 * Body: { lessonId, moduleCode, testbench }
 */
router.post('/tutorial/validate', authenticateToken, async (req, res) => {
  const { lessonId, moduleCode, testbench } = req.body;

  if (!moduleCode || !testbench) {
    return res.status(400).json({ success: false, errors: 'moduleCode und testbench sind erforderlich' });
  }

  try {
    // Inject $display for test_solved before $finish so the log is parseable.
    // The testbenches use output port test_solved instead of $display, so we add it.
    const instrumentedTestbench = injectTestSolvedDisplay(testbench);

    // 1. Projekt erstellen mit Modul + Testbench
    const projectRes = await fetch(`${BACKEND_BASE}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `tutorial_validation_lesson_${lessonId}`,
        files: [
          { filename: 'main.sv', content: moduleCode, language: 'systemverilog' },
          { filename: 'tb.sv', content: instrumentedTestbench, language: 'systemverilog' },
        ],
      }),
    });

    if (!projectRes.ok) {
      throw new Error(`Projekt-Erstellung fehlgeschlagen: ${projectRes.status}`);
    }
    const project = await projectRes.json();

    // 2. Simulation starten
    const simRes = await fetch(`${BACKEND_BASE}/api/simulations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: project._id,
        language: 'systemverilog',
        testbenchType: 'systemverilog',
        settings: { generateWave: false },
      }),
    });

    if (!simRes.ok) {
      throw new Error(`Simulations-Start fehlgeschlagen: ${simRes.status}`);
    }
    const sim = await simRes.json();

    // 3. Auf Ergebnis warten (max. 30 Sekunden)
    let result = null;
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const pollRes = await fetch(`${BACKEND_BASE}/api/simulations/${sim._id}/results`);
      if (pollRes.ok) {
        result = await pollRes.json();
        if (result.log) break;
      }
    }

    if (!result?.log) {
      return res.status(504).json({ success: false, errors: 'Simulation Timeout: Kein Ergebnis nach 30 Sekunden' });
    }

    // 4. Log auswerten
    const log = result.log;
    const passed = checkValidationLog(log);

    if (passed) {
      return res.json({ success: true });
    } else {
      // Relevante Fehlerzeilen extrahieren
      const errorLines = log
        .split('\n')
        .filter(l => /error|fail|assert|mismatch/i.test(l))
        .slice(0, 20)
        .join('\n');
      return res.json({ success: false, errors: errorLines || log.slice(0, 500) });
    }
  } catch (err) {
    console.error('[Tutorial Validate] Fehler:', err);
    res.status(500).json({ success: false, errors: err.message });
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
/**
 * Tutorial System - Markdown Parser
 * Parst VerilogTutorialFormatted.md und konvertiert es in strukturierte Lektionen
 */

/**
 * Extrahiert YAML Frontmatter aus einem Textblock
 * @param {string} text - Der YAML-Text (ohne --- Markern)
 * @returns {object} - Geparste Metadaten
 */
function parseFrontmatter(text) {
  const lines = text.split('\n');
  const metadata = {};

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.includes(':')) return;

    const [key, ...valueParts] = trimmed.split(':');
    const value = valueParts.join(':').trim();
    
    // Entferne Anführungszeichen
    let cleanValue = value.replace(/^["']|["']$/g, '');
    
    // Konvertiere zu korrektem Typ
    if (cleanValue === 'true') cleanValue = true;
    if (cleanValue === 'false') cleanValue = false;
    if (!isNaN(cleanValue) && cleanValue !== '') cleanValue = parseInt(cleanValue);
    
    metadata[key.trim()] = cleanValue;
  });

  return metadata;
}

/**
 * Extrahiert Inhalte zwischen Markern
 * @param {string} text - Der zu durchsuchende Text
 * @param {string} startMarker - Start-Marker
 * @param {string} endMarker - End-Marker
 * @returns {string|null} - Der extrahierte Inhalt oder null
 */
function extractBetween(text, startMarker, endMarker) {
  const startIdx = text.indexOf(`**${startMarker}**`);
  if (startIdx === -1) return null;

  const contentStart = text.indexOf('\n', startIdx) + 1;
  const endIdx = text.indexOf(`**${endMarker}**`, contentStart);
  
  if (endIdx === -1) return null;

  return text.substring(contentStart, endIdx).trim();
}

/**
 * Bereinigt Code-Text von Markdown-Codeblock-Markern
 * @param {string} code - Der Code-Text mit möglichen ```verilog Markern
 * @returns {string} - Der bereinigte Code
 */
function cleanCodeBlock(code) {
  if (!code) return code;
  
  // Entferne ```verilog und ``` Marker
  let cleaned = code.replace(/```verilog\n?/g, '').replace(/```\n?/g, '');
  
  // Entferne führende/nachfolgende Leerzeichen
  return cleaned.trim();
}

/**
 * Leitet die Sektion aus der lesson_id ab (IDs >= 100 sind Übungen)
 * @param {object} metadata - Die geparsten Metadaten
 * @returns {string} - Die Sektion
 */
function deriveSectionFromId(metadata) {
  if (metadata.section) return metadata.section;
  const id = parseInt(metadata.lesson_id);
  if (id >= 100) return 'Praktische Übungen';
  return 'Theorie';
}

/**
 * Parst eine einzelne Lektion aus Frontmatter und Inhalt
 * @param {string} yamlText - Der YAML Text (ohne <!-- --> Markern)
 * @param {string} contentText - Der Inhalts-Text nach dem Frontmatter
 * @param {number} sourceOrder - Reihenfolge der Lektion im Markdown-Dokument
 * @returns {object} - Geparste Lektion
 */
function parseLesson(yamlText, contentText, sourceOrder = 0) {
  const metadata = parseFrontmatter(yamlText);

  // Extrahiere Übung, Lösung und Testbench
  let exercise = extractBetween(contentText, 'EXERCISE_START', 'EXERCISE_END');
  let solution = extractBetween(contentText, 'SOLUTION_START', 'SOLUTION_END');
  let testbench = extractBetween(contentText, 'TESTBENCH_START', 'TESTBENCH_END');

  // Bereinige Code-Blöcke von Markdown-Markern
  exercise = exercise ? cleanCodeBlock(exercise) : null;
  solution = solution ? cleanCodeBlock(solution) : null;
  testbench = testbench ? cleanCodeBlock(testbench) : null;

  // Entferne die Marker aus dem Hauptinhalt
  let explanation = contentText
    .replace(/\*\*EXERCISE_START\*\*[\s\S]*?\*\*EXERCISE_END\*\*/g, '')
    .replace(/\*\*SOLUTION_START\*\*[\s\S]*?\*\*SOLUTION_END\*\*/g, '')
    .replace(/\*\*TESTBENCH_START\*\*[\s\S]*?\*\*TESTBENCH_END\*\*/g, '')
    .trim();

  // Erste 200 Zeichen als Beschreibung
  const description = explanation
    .substring(0, 200)
    .replace(/\n/g, ' ')
    .replace(/[#*`]/g, '')
    .trim();

  return {
    id: metadata.lesson_id !== undefined ? metadata.lesson_id : `lesson-unknown`,
    title: metadata.lesson_title || 'Untitled',
    difficulty: metadata.difficulty || 'beginner',
    duration_min: metadata.duration_min || 10,
    section: deriveSectionFromId(metadata),
    type: metadata.type || 'theory',
    description,
    explanation,
    hasExercise: !!exercise,
    exerciseTemplate: exercise || null,
    solution: solution || null,
    testbench: testbench || null,
    sourceOrder,
  };
}


/**
 * Parst eine komplette Markdown-Datei und gibt strukturierte Lektionen zurück
 * @param {string} markdownContent - Der komplette Inhalt der VerilogTutorialFormatted.md
 * @returns {object} - Strukturierte Tutorial-Daten
 */
export function parseTutorialFromMarkdown(markdownContent) {
  const lessons = {};
  const lessonIds = [];
  const lessonsBySection = {};
  const parsedLessons = [];

  console.log('[Tutorial] Parsing Markdown tutorial...');

  // Splittet den Content in Zeilen
  const lines = markdownContent.split('\n');
  const lessonBlocks = [];

  let i = 0;
  while (i < lines.length) {
    // Suche nach <!-- (Start eines HTML-Kommentar-Frontmatters)
    if (lines[i].trim() === '<!--') {
      // Finde das schließende --> (Ende des YAML)
      const yamlStart = i + 1;
      let yamlEnd = yamlStart;

      while (yamlEnd < lines.length && lines[yamlEnd].trim() !== '-->') {
        yamlEnd++;
      }

      if (yamlEnd >= lines.length) {
        i++;
        continue; // Kein schließendes --> gefunden
      }

      // Inhalt läuft bis zum nächsten --- Trenner oder nächsten <!--
      const contentStart = yamlEnd + 1;
      let contentEnd = contentStart;

      while (contentEnd < lines.length) {
        const trimmed = lines[contentEnd].trim();
        // Stoppe bei Trennlinie --- oder beim Start des nächsten Frontmatters
        if (trimmed === '---' || trimmed === '<!--') {
          break;
        }
        contentEnd++;
      }

      // Extrahiere YAML und Content
      const yamlText = lines.slice(yamlStart, yamlEnd).join('\n').trim();
      const contentText = lines.slice(contentStart, contentEnd).join('\n').trim();

      // Nur hinzufügen wenn YAML vorhanden
      if (yamlText.includes('lesson_id:')) {
        lessonBlocks.push({ yaml: yamlText, content: contentText });
      }

      // Setze i auf die Zeile NACH contentEnd, um Duplikate zu vermeiden
      i = contentEnd + 1;
    } else {
      i++;
    }
  }

  console.log(`[Tutorial] Gefundene Lektionsblöcke: ${lessonBlocks.length}`);

  // Parste jede Lektion
  lessonBlocks.forEach((block, index) => {
    try {
      const lesson = parseLesson(block.yaml, block.content, index);

      if (lesson.id !== undefined && lesson.id !== null && lesson.id !== 'lesson-unknown') {
        lessons[lesson.id] = lesson;
        lessonIds.push(lesson.id);
        parsedLessons.push(lesson);

        // Gruppiere nach Sektion
        if (!lessonsBySection[lesson.section]) {
          lessonsBySection[lesson.section] = [];
        }
        lessonsBySection[lesson.section].push(lesson.id);

        console.log(`[Tutorial] ✓ Lektion ${lesson.id}: "${lesson.title}" (${lesson.type})`);
      }
    } catch (error) {
      console.error(`[Tutorial] ✗ Fehler beim Parsen von Lektion ${index}:`, error);
    }
  });

  console.log(`[Tutorial] Erfolgreich ${lessonIds.length} Lektionen geladen`);

  const orderedLessons = parsedLessons
    .slice()
    .sort((a, b) => a.sourceOrder - b.sourceOrder);

  return {
    lessons,
    lessonIds,
    byDifficulty: groupByDifficulty(orderedLessons),
    bySection: lessonsBySection,
    byType: groupByType(orderedLessons),
  };
}

/**
 * Alternative: Parst die Datei direkt als Fetch (wenn URL gegeben)
 * @param {string} tutorialPath - Pfad zur VerilogTutorialFormatted.md
 * @returns {Promise<object>} - Strukturierte Tutorial-Daten
 */
export async function parseTutorialFromFile(tutorialPath) {
  try {
    const response = await fetch(tutorialPath);
    if (!response.ok) {
      throw new Error(`Failed to fetch tutorial: ${response.status}`);
    }
    const markdownContent = await response.text();
    return parseTutorialFromMarkdown(markdownContent);
  } catch (error) {
    console.error('[Tutorial] Error loading tutorial:', error);
    return {
      lessons: {},
      lessonIds: [],
      byDifficulty: { beginner: [], intermediate: [], advanced: [] },
      bySection: {},
      byType: {},
    };
  }
}

/**
 * Gruppiert Lektionen nach Schwierigkeitsgrad
 */
function groupByDifficulty(lessons) {
  const grouped = {
    intro: [],
    beginner: [],
    intermediate: [],
    advanced: [],
  };

  lessons.forEach((lesson) => {
    const diff = lesson.difficulty || 'beginner';
    if (grouped[diff]) {
      grouped[diff].push(lesson.id);
    }
  });

  return grouped;
}

/**
 * Gruppiert Lektionen nach Typ (theory, exercise, project)
 */
function groupByType(lessons) {
  const grouped = {
    theory: [],
    exercise: [],
    project: [],
  };

  lessons.forEach((lesson) => {
    const type = lesson.type || 'theory';
    if (grouped[type]) {
      grouped[type].push(lesson.id);
    }
  });

  return grouped;
}

/**
 * Get lesson by ID
 */
export function getLesson(lessons, lessonId) {
  return lessons[lessonId] || null;
}

/**
 * Gibt die nächste Lektion basierend auf lessonIds zurück
 */
export function getNextLesson(lessonIds, currentLessonId) {
  const currentIndex = lessonIds.indexOf(currentLessonId);
  if (currentIndex === -1 || currentIndex >= lessonIds.length - 1) {
    return null;
  }
  return lessonIds[currentIndex + 1];
}

/**
 * Gibt die vorherige Lektion basierend auf lessonIds zurück
 */
export function getPreviousLesson(lessonIds, currentLessonId) {
  const currentIndex = lessonIds.indexOf(currentLessonId);
  if (currentIndex <= 0) {
    return null;
  }
  return lessonIds[currentIndex - 1];
}

// ============================================
// HOWTO - TUTORIAL BEARBEITEN
// ============================================
/*

Das Tutorial wird aus VerilogTutorialFormatted.md geparst!

ÄNDERUNGEN VORNEHMEN:

1. Öffne: Tutorial/VerilogTutorialFormatted.md

2. Der Aufbau einer Lektion:

   <!--
   lesson_id: 10
   lesson_title: "Titel"
   difficulty: "intro|beginner|intermediate|advanced"
   duration_min: 10
   type: "theory|exercise|project"
   -->

   ## Titel

   Dein Text und Erklärungen hier...

   ---

3. FÜR ÜBUNGEN (type: "exercise"):

   **EXERCISE_START**
   \`\`\`verilog
   // Starter-Code für den Schüler
   \`\`\`
   **EXERCISE_END**

   **SOLUTION_START**
   \`\`\`verilog
   // Lösungs-Code
   \`\`\`
   **SOLUTION_END**

   **TESTBENCH_START**
   \`\`\`verilog
   // Testbench-Code
   \`\`\`
   **TESTBENCH_END**

4. Speichern und die App wird automatisch neu geladen!

WICHTIG:
- lesson_id: Muss eindeutig und numerisch sein
  - Theorie-Lektionen: 0, 1, 2, 3, ... (Nächste freie ID steht als Kommentar am Anfang der Datei)
  - Praktische Übungen: 100, 101, 102, ... (IDs >= 100 werden automatisch der Sektion "Praktische Übungen" zugewiesen)
- difficulty: intro, beginner, intermediate oder advanced
- type: theory (nur Erklärung), exercise (mit Aufgabe), project (großes Projekt)
- duration_min: Geschätzte Lernzeit in Minuten
- section: Kein Pflichtfeld mehr – wird automatisch aus der lesson_id abgeleitet.
           Kann aber manuell gesetzt werden, um eine eigene Gruppe zu erzwingen.

STRUKTUR:
- Markdown wird in den Komponenten mit MarkdownRenderer geparsed
- Code-Blöcke werden automatisch syntaxgefärbt
- Übungen und Testbenches werden vom Parser automatisch erkannt

BEISPIEL NEUE THEORIE-LEKTION:

   <!--
   lesson_id: 59
   lesson_title: "Neues Thema"
   difficulty: "intermediate"
   duration_min: 15
   type: "theory"
   -->

   ### Neues Thema

   Hier kommt deine Erklärung...

   ---

BEISPIEL NEUE ÜBUNGS-LEKTION:

   <!--
   lesson_id: 117
   lesson_title: "Neue Übung"
   difficulty: "intermediate"
   duration_min: 15
   type: "exercise"
   -->

   ### Neue Übung

   Aufgabenstellung hier...

   **EXERCISE_START**
   \`\`\`verilog
   module neues_modul();
     // TODO
   endmodule
   \`\`\`
   **EXERCISE_END**

   **SOLUTION_START**
   \`\`\`verilog
   module neues_modul();
     // Lösung
   endmodule
   \`\`\`
   **SOLUTION_END**

   **TESTBENCH_START**
   \`\`\`verilog
   module tb_neues_modul();
     // Testbench
   endmodule
   \`\`\`
   **TESTBENCH_END**

   ---

*/

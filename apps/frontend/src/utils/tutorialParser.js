/**
 * Tutorial System - Markdown Parser
 * Parst VerilogTutorialFormatted.md und konvertiert es in strukturierte Lektionen
 */

/**
 * Extrahiert YAML Frontmatter aus einem Textblock
 * @param {string} text - Der Textblock mit YAML Header
 * @returns {object} - Geparste Metadaten
 */
function parseFrontmatter(text) {
  const lines = text.split('\n');
  const metadata = {};
  let i = 0;

  // Überspringe erste ---
  if (lines[0] === '---') i = 1;

  // Parse YAML Zeilen
  while (i < lines.length && lines[i] !== '' && !lines[i].startsWith('---')) {
    const line = lines[i];
    if (line.includes(':')) {
      const [key, value] = line.split(':').map(s => s.trim());
      // Entferne Anführungszeichen und konvertiere zu korrektem Typ
      let cleanValue = value.replace(/^["']|["']$/g, '');
      if (cleanValue === 'true') cleanValue = true;
      if (cleanValue === 'false') cleanValue = false;
      if (!isNaN(cleanValue) && cleanValue !== '') cleanValue = parseInt(cleanValue);
      metadata[key] = cleanValue;
    }
    i++;
  }

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
 * Parst eine einzelne Lektion
 * @param {string} lessonBlock - Ein Lektionsblock aus dem Markdown
 * @returns {object} - Geparste Lektion
 */
function parseLesson(lessonBlock) {
  const metadata = parseFrontmatter(lessonBlock);
  
  // Finde wo der Inhalt beginnt (nach dem YAML Frontmatter)
  const frontmatterEnd = lessonBlock.indexOf('\n---\n') + 4;
  const contentStart = lessonBlock.indexOf('\n', frontmatterEnd) + 1;
  const fullContent = lessonBlock.substring(contentStart);

  // Extrahiere Übung und Lösung
  const exercise = extractBetween(fullContent, 'EXERCISE_START', 'EXERCISE_END');
  const solution = extractBetween(fullContent, 'SOLUTION_START', 'SOLUTION_END');

  // Entferne die Marker aus dem Hauptinhalt
  let content = fullContent
    .replace(/\*\*EXERCISE_START\*\*[\s\S]*?\*\*EXERCISE_END\*\*/g, '')
    .replace(/\*\*SOLUTION_START\*\*[\s\S]*?\*\*SOLUTION_END\*\*/g, '')
    .trim();

  // Erste 150 Zeichen als Beschreibung
  const description = content
    .substring(0, 200)
    .replace(/\n/g, ' ')
    .replace(/[#*`]/g, '')
    .trim();

  return {
    id: metadata.lesson_id || `lesson-${metadata.lesson_id}`,
    title: metadata.lesson_title || 'Untitled',
    difficulty: metadata.difficulty || 'beginner',
    duration_min: metadata.duration_min || 10,
    section: metadata.section || 'General',
    type: metadata.type || 'theory',
    description,
    explanation: content,
    hasExercise: !!exercise,
    exerciseTemplate: exercise || null,
    solution: solution || null,
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

  console.log('[Tutorial] Parsing Markdown tutorial...');

  // Teile nach Lektionen (---) auf
  const lessonBlocks = markdownContent.split('\n---\n').filter(block => block.trim());

  lessonBlocks.forEach((block, index) => {
    try {
      const lesson = parseLesson(block);
      
      if (lesson.id) {
        lessons[lesson.id] = lesson;
        lessonIds.push(lesson.id);

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

  return {
    lessons,
    lessonIds,
    byDifficulty: groupByDifficulty(Object.values(lessons)),
    bySection: lessonsBySection,
    byType: groupByType(Object.values(lessons)),
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

Das Tutorial wird jetzt aus VerilogTutorialFormatted.md geparst!

ÄNDERUNGEN VORNEHMEN:

1. Öffne: Tutorial/VerilogTutorialFormatted.md

2. Der Aufbau einer Lektion:

   ---
   lesson_id: 1
   lesson_title: "Titel"
   difficulty: "intro|beginner|intermediate|advanced"
   duration_min: 10
   section: "Syntax"
   type: "theory|exercise|project"
   ---

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

4. Speichern und die App wird automatisch neu geladen!

WICHTIG:
- lesson_id: Muss eindeutig und numerisch sein (1, 2, 3, ...)
- difficulty: intro, beginner, intermediate oder advanced
- type: theory (nur Erklärung), exercise (mit Aufgabe), project (großes Projekt)
- duration_min: Geschätzte Lernzeit in Minuten
- section: Gruppiere Lektionen (z.B. "Syntax", "Die Anfänge", "SystemVerilog")

STRUKTUR:
- Markdown wird in den Komponenten mit MarkdownRenderer geparsed
- Code-Blöcke werden automatisch syntaxgefärbt
- Übungen können vom Parser automatisch erkannt werden

BEISPIEL NEUE LEKTION:

   ---
   lesson_id: 24
   lesson_title: "Neues Thema"
   difficulty: "intermediate"
   duration_min: 15
   section: "Neuer Bereich"
   type: "exercise"
   ---

   ### Neues Thema

   Hier kommt deine Erklärung...

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

   ---

*/

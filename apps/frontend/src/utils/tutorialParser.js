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
 * Parst eine einzelne Lektion aus Frontmatter und Inhalt
 * @param {string} yamlText - Der YAML Text (ohne --- Markern)
 * @param {string} contentText - Der Inhalts-Text nach dem Frontmatter
 * @returns {object} - Geparste Lektion
 */
function parseLesson(yamlText, contentText) {
  const metadata = parseFrontmatter(yamlText);

  // Extrahiere Übung und Lösung
  let exercise = extractBetween(contentText, 'EXERCISE_START', 'EXERCISE_END');
  let solution = extractBetween(contentText, 'SOLUTION_START', 'SOLUTION_END');
  
  // Bereinige Code-Blöcke von Markdown-Markern
  exercise = exercise ? cleanCodeBlock(exercise) : null;
  solution = solution ? cleanCodeBlock(solution) : null;

  // Entferne die Marker aus dem Hauptinhalt
  let explanation = contentText
    .replace(/\*\*EXERCISE_START\*\*[\s\S]*?\*\*EXERCISE_END\*\*/g, '')
    .replace(/\*\*SOLUTION_START\*\*[\s\S]*?\*\*SOLUTION_END\*\*/g, '')
    .trim();

  // Erste 200 Zeichen als Beschreibung
  const description = explanation
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
    explanation,
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

  // Splittet den Content in Zeilen
  const lines = markdownContent.split('\n');
  const lessonBlocks = [];
  
  let i = 0;
  while (i < lines.length) {
    // Suche nach --- (Start einer Lektion)
    if (lines[i].trim() === '---') {
      // Finde das nächste --- (Ende des YAML)
      const yamlStart = i + 1;
      let yamlEnd = yamlStart;
      
      while (yamlEnd < lines.length && lines[yamlEnd].trim() !== '---') {
        yamlEnd++;
      }
      
      if (yamlEnd >= lines.length) {
        i++;
        continue; // Keine schließende --- gefunden
      }
      
      // Finde das Ende des Inhalts (nächstes ---)
      const contentStart = yamlEnd + 1;
      let contentEnd = contentStart;
      
      while (contentEnd < lines.length && lines[contentEnd].trim() !== '---') {
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
      const lesson = parseLesson(block.yaml, block.content);

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

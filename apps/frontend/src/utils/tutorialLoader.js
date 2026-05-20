/**
 * Tutorial Loader - Integrationsbeispiel
 * Zeigt wie der neue Markdown Parser in den Frontend-Komponenten genutzt wird
 * 
 * Verwendungsbeispiel für: apps/frontend/src/components/TutorialOverview.jsx
 */

import { parseTutorialFromFile, getLesson, getNextLesson, getPreviousLesson } from '../utils/tutorialParser';

/**
 * OPTION 1: Markdown-Datei vom Server laden (empfohlen)
 */
export async function loadTutorialFromServer(tutorialPath = '/Tutorial/VerilogTutorialFormatted.md') {
  try {
    const tutorialData = await parseTutorialFromFile(tutorialPath);
    console.log('Tutorial geladen:', tutorialData);
    return tutorialData;
  } catch (error) {
    console.error('Fehler beim Laden des Tutorials:', error);
    return null;
  }
}

/**
 * OPTION 2: Beispiel für React Hook (im Component verwenden)
 */
export const useTutorial = (tutorialPath) => {
  const [tutorial, setTutorial] = React.useState(null);
  const [currentLessonId, setCurrentLessonId] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadTutorialFromServer(tutorialPath)
      .then((data) => {
        setTutorial(data);
        if (data && data.lessonIds.length > 0) {
          setCurrentLessonId(data.lessonIds[0]); // Erste Lektion
        }
        setLoading(false);
      });
  }, [tutorialPath]);

  const currentLesson = tutorial && currentLessonId ? getLesson(tutorial.lessons, currentLessonId) : null;
  const nextLessonId = tutorial ? getNextLesson(tutorial.lessonIds, currentLessonId) : null;
  const prevLessonId = tutorial ? getPreviousLesson(tutorial.lessonIds, currentLessonId) : null;

  return {
    tutorial,
    currentLesson,
    currentLessonId,
    nextLessonId,
    prevLessonId,
    loading,
    goToLesson: setCurrentLessonId,
  };
};

/**
 * OPTION 3: Direkt mit Markdown-String (wenn Datei bereits geladen)
 */
import { parseTutorialFromMarkdown } from '../utils/tutorialParser';

export function loadTutorialFromString(markdownContent) {
  return parseTutorialFromMarkdown(markdownContent);
}

// ============================================
// BEISPIEL: Wie man es im Component nutzt
// ============================================

// In TutorialOverview.jsx:
/*

function TutorialOverview() {
  const {
    tutorial,
    currentLesson,
    currentLessonId,
    nextLessonId,
    prevLessonId,
    loading,
    goToLesson,
  } = useTutorial('/Tutorial/VerilogTutorialFormatted.md');

  if (loading) return <div>Lädt Tutorial...</div>;
  if (!tutorial) return <div>Fehler beim Laden</div>;

  return (
    <div className="tutorial">
      {/* Navigations-Sidebar */}
      <aside className="tutorial-sidebar">
        <h2>Lektionen</h2>
        {tutorial.lessonIds.map((lessonId) => {
          const lesson = tutorial.lessons[lessonId];
          const isActive = lessonId === currentLessonId;
          
          return (
            <button
              key={lessonId}
              onClick={() => goToLesson(lessonId)}
              className={isActive ? 'active' : ''}
            >
              <span className="lesson-num">{lesson.id}</span>
              <span>{lesson.title}</span>
              <span className="difficulty">{lesson.difficulty}</span>
            </button>
          );
        })}
      </aside>

      {/* Haupt-Inhaltsbereich */}
      <main className="tutorial-main">
        {currentLesson && (
          <>
            <h1>{currentLesson.title}</h1>
            <p className="meta">
              Schwierigkeit: {currentLesson.difficulty} | 
              Zeit: {currentLesson.duration_min} min | 
              Typ: {currentLesson.type}
            </p>

            <div className="lesson-content">
              {/* Markdown-Inhalt rendern */}
              <MarkdownRenderer content={currentLesson.explanation} />
            </div>

            {/* Übung anzeigen, wenn vorhanden */}
            {currentLesson.hasExercise && (
              <div className="lesson-exercise">
                <h3>Aufgabe</h3>
                <CodeEditor
                  initialCode={currentLesson.exerciseTemplate}
                  solution={currentLesson.solution}
                />
              </div>
            )}

            {/* Navigation */}
            <div className="lesson-navigation">
              {prevLessonId && (
                <button onClick={() => goToLesson(prevLessonId)}>
                  ← Vorherige Lektion
                </button>
              )}
              {nextLessonId && (
                <button onClick={() => goToLesson(nextLessonId)}>
                  Nächste Lektion →
                </button>
              )}
            </div>
          </>
        )}
      </main>

      {/* Optional: Seiten-Filter */}
      <aside className="tutorial-filters">
        <h3>Nach Schwierigkeit</h3>
        {Object.entries(tutorial.byDifficulty).map(([difficulty, lessonIds]) => (
          <div key={difficulty}>
            <label>
              <input type="checkbox" />
              {difficulty} ({lessonIds.length})
            </label>
          </div>
        ))}

        <h3>Nach Bereich</h3>
        {Object.entries(tutorial.bySection).map(([section, lessonIds]) => (
          <div key={section}>
            <label>
              <input type="checkbox" />
              {section} ({lessonIds.length})
            </label>
          </div>
        ))}
      </aside>
    </div>
  );
}

*/

// ============================================
// STRUKTUR DES TUTORIAL OBJEKTS
// ============================================

/*

Die parseTutorialFromFile() Funktion gibt ein Objekt mit dieser Struktur zurück:

{
  lessons: {
    '1': {
      id: 1,
      title: 'Vorwort',
      difficulty: 'intro',
      duration_min: 5,
      section: 'Einführung',
      type: 'theory',
      description: 'Zum Start ein kurzer Hintergrund...',
      explanation: 'Kompletter Markdown-Inhalt',
      hasExercise: false,
      exerciseTemplate: null,
      solution: null,
    },
    '10': {
      id: 10,
      title: 'Grundoperation: NAND',
      difficulty: 'intermediate',
      duration_min: 20,
      section: 'Syntax',
      type: 'exercise',
      description: 'Jetzt sollen Sie einmal selbst...',
      explanation: 'Kompletter Markdown-Inhalt (ohne Marker)',
      hasExercise: true,
      exerciseTemplate: 'module modul_nand(...)',  // Der Anfangscode
      solution: 'module modul_nand(...)',          // Die Lösung
    },
    // ... weitere Lektionen
  },

  lessonIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, ...],  // Sortiert nach lesson_id

  byDifficulty: {
    intro: [1],
    beginner: [2, 3, 4, 5, 6, 7, 8, 9],
    intermediate: [10, 11, 12, 13, 14, 15, 16, 17],
    advanced: [18, 19, 20, 21, 22, 23],
  },

  bySection: {
    'Einführung': [1],
    'Syntax': [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    'Die Anfänge': [21],
    'SystemVerilog Erweiterung': [22, 23],
  },

  byType: {
    theory: [2, 3, 4, 5, 6, 7, 8, 9, 13, 14, 15, 16, 17, 22],
    exercise: [1, 10, 11, 12, 23],
    project: [21],
  },
}

*/

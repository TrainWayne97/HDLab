import React, { useState, useEffect } from 'react';
import { parseTutorialFromFile, getNextLesson, getPreviousLesson } from '../utils/tutorialParser';
import TutorialOverview from './TutorialOverview';
import TutorialLesson from './TutorialLesson';
import './Tutorial.css';

/**
 * Tutorial Container Component
 * Orchestriert das Laden der Markdown-Datei und die Navigation zwischen Lektionen
 */
export default function TutorialContainer({ 
  tutorialPath = '/Tutorial/VerilogTutorialFormatted.md',
  uiLanguage = 'de',
  editorTheme = 'vs-light'
}) {
  const [tutorial, setTutorial] = useState(null);
  const [currentLessonId, setCurrentLessonId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('overview'); // 'overview' or 'lesson'

  // Load tutorial on mount
  useEffect(() => {
    const loadTutorial = async () => {
      try {
        console.log('[TutorialContainer] Loading tutorial from:', tutorialPath);
        const data = await parseTutorialFromFile(tutorialPath);
        
        if (!data || Object.keys(data.lessons).length === 0) {
          setError('Keine Lektionen gefunden');
          setLoading(false);
          return;
        }

        setTutorial(data);
        // Set first lesson as default
        if (data.lessonIds.length > 0) {
          setCurrentLessonId(data.lessonIds[0]);
        }
        setError(null);
        console.log('[TutorialContainer] Tutorial loaded successfully:', data);
      } catch (err) {
        console.error('[TutorialContainer] Error loading tutorial:', err);
        setError(`Fehler beim Laden des Tutorials: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadTutorial();
  }, [tutorialPath]);

  // Handlers
  const handleStartLesson = (lessonId) => {
    setCurrentLessonId(lessonId);
    setViewMode('lesson');
    window.scrollTo(0, 0);
  };

  const handleBackToOverview = () => {
    setViewMode('overview');
    window.scrollTo(0, 0);
  };

  const handleNextLesson = () => {
    if (!tutorial) return;
    const nextId = getNextLesson(tutorial.lessonIds, currentLessonId);
    if (nextId) {
      handleStartLesson(nextId);
    }
  };

  const handlePreviousLesson = () => {
    if (!tutorial) return;
    const prevId = getPreviousLesson(tutorial.lessonIds, currentLessonId);
    if (prevId) {
      handleStartLesson(prevId);
    }
  };

  // Render states
  if (loading) {
    return (
      <div className="tutorial-container loading">
        <div className="spinner">
          <p>Lade Tutorial...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tutorial-container error">
        <div className="error-message">
          <h2>⚠️ Fehler</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Seite neu laden</button>
        </div>
      </div>
    );
  }

  if (!tutorial) {
    return (
      <div className="tutorial-container error">
        <div className="error-message">
          <h2>Keine Daten</h2>
          <p>Tutorial konnte nicht geladen werden</p>
        </div>
      </div>
    );
  }

  // Get current lesson
  const currentLesson = tutorial.lessons[currentLessonId];

  // Render
  return (
    <div className="tutorial-container">
      {viewMode === 'overview' ? (
        <TutorialOverview
          lessons={tutorial.lessons}
          byDifficulty={tutorial.byDifficulty}
          bySection={tutorial.bySection}
          byType={tutorial.byType}
          lessonIds={tutorial.lessonIds}
          onStartLesson={handleStartLesson}
          uiLanguage={uiLanguage}
        />
      ) : (
        currentLesson && (
          <TutorialLesson
            lesson={currentLesson}
            lessonId={currentLessonId}
            allLessonIds={tutorial.lessonIds}
            onBack={handleBackToOverview}
            onNextLesson={handleNextLesson}
            onPreviousLesson={handlePreviousLesson}
            uiLanguage={uiLanguage}
            editorTheme={editorTheme}
          />
        )
      )}
    </div>
  );
}

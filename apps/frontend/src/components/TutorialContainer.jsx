import React, { useState, useEffect, useRef } from 'react';
import { parseTutorialFromFile, getNextLesson, getPreviousLesson } from '../utils/tutorialParser';
import { useAuth } from '../contexts/AuthContext';
import TutorialOverview from './TutorialOverview';
import TutorialLesson from './TutorialLesson';
import LessonNav from './LessonNav';
import './Tutorial.css';
import './Workbench.css';

const DEFAULT_TITLE = 'Verilog Tutorial';

/**
 * Tutorial Container Component
 * Orchestriert das Laden der Markdown-Datei und die Navigation zwischen Lektionen
 */
export default function TutorialContainer({ 
  tutorialPath = '/Tutorial/VerilogTutorialFormatted.md',
  courseId = null, // null = allgemeines Verilog-Tutorial, sonst Kurs-ID aus config/courses.js
  title,
  subtitle,
  uiLanguage = 'de',
  editorTheme = 'vs-light',
  onModuleSaved,
  onRegisterInsert,
  navOpen = false,
  onCloseNav,
}) {
  const { apiCall } = useAuth();
  const [tutorial, setTutorial] = useState(null);
  const [currentLessonId, setCurrentLessonId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('lesson'); // 'overview' or 'lesson'
  const [completedIds, setCompletedIds] = useState(() => new Set());
  const contentRef = useRef(null);
  // Zwischenüberschrift, zu der nach dem Öffnen einer Lektion gescrollt wird (Link im Inhaltsverzeichnis)
  const [scrollAnchor, setScrollAnchor] = useState(null);
  // Zuletzt geöffnete Lektion pro Kurs merken, damit man dort weitermacht
  const lastLessonKey = `hdlab-tutorial-last-lesson-${courseId || 'verilog'}`;

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
        // Resume at the last opened lesson, otherwise start with the first one
        if (data.lessonIds.length > 0) {
          const last = data.lessonIds.find(id => String(id) === localStorage.getItem(lastLessonKey));
          setCurrentLessonId(last !== undefined ? last : data.lessonIds[0]);
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
  }, [tutorialPath, lastLessonKey]);

  // Gelöste Übungen für die Häkchen in der Navigation laden
  useEffect(() => {
    let cancelled = false;
    apiCall(`/tutorial/progress${courseId ? `?course=${encodeURIComponent(courseId)}` : ''}`)
      .then(res => (res.ok ? res.json() : []))
      .then(list => {
        if (cancelled || !Array.isArray(list)) return;
        setCompletedIds(new Set(list.filter(p => p.isCompleted).map(p => p.lessonId)));
      })
      .catch(err => console.error('[TutorialContainer] Error loading progress:', err));
    return () => {
      cancelled = true;
    };
  }, [apiCall, courseId]);

  // Handlers
  const handleStartLesson = (lessonId, anchor = null) => {
    setCurrentLessonId(lessonId);
    setViewMode('lesson');
    setScrollAnchor(anchor);
    localStorage.setItem(lastLessonKey, String(lessonId));
    contentRef.current?.scrollTo(0, 0);
  };

  const handleShowOverview = () => {
    setViewMode('overview');
    onCloseNav?.();
    contentRef.current?.scrollTo(0, 0);
  };

  const handleLessonCompleted = (lessonId) => {
    setCompletedIds(prev => (prev.has(lessonId) ? prev : new Set(prev).add(lessonId)));
  };

  const handleNextLesson = () => {
    if (!tutorial) return;
    const nextId = getNextLesson(tutorial.lessonIds, currentLessonId);
    if (nextId !== null) {
      handleStartLesson(nextId);
    }
  };

  const handlePreviousLesson = () => {
    if (!tutorial) return;
    const prevId = getPreviousLesson(tutorial.lessonIds, currentLessonId);
    // Nicht auf Wahrheitswert prüfen: die erste Lektion kann die lesson_id 0 haben
    if (prevId !== null) {
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
      <LessonNav
        title={title || DEFAULT_TITLE}
        lessons={tutorial.lessons}
        byChapter={tutorial.byChapter}
        currentLessonId={currentLessonId}
        completedIds={completedIds}
        overviewActive={viewMode === 'overview'}
        onSelectLesson={handleStartLesson}
        onShowOverview={handleShowOverview}
        uiLanguage={uiLanguage}
        isOpen={navOpen}
        onClose={onCloseNav}
      />
      {viewMode === 'overview' ? (
        <div className="workbench">
          <div className="wb-pane wb-pane-scroll" ref={contentRef}>
            <TutorialOverview
              lessons={tutorial.lessons}
              byDifficulty={tutorial.byDifficulty}
              bySection={tutorial.bySection}
              byType={tutorial.byType}
              byChapter={tutorial.byChapter}
              lessonIds={tutorial.lessonIds}
              onStartLesson={handleStartLesson}
              uiLanguage={uiLanguage}
              title={title}
              subtitle={subtitle}
            />
          </div>
        </div>
      ) : (
        currentLesson && (
          <TutorialLesson
            lesson={currentLesson}
            lessonId={currentLessonId}
            courseId={courseId}
            allLessonIds={tutorial.lessonIds}
            anchorMap={tutorial.anchorMap}
            scrollRef={contentRef}
            onNextLesson={handleNextLesson}
            onPreviousLesson={handlePreviousLesson}
            onNavigateToLesson={handleStartLesson}
            scrollAnchor={scrollAnchor}
            onLessonCompleted={handleLessonCompleted}
            uiLanguage={uiLanguage}
            editorTheme={editorTheme}
            onModuleSaved={onModuleSaved}
            onRegisterInsert={onRegisterInsert}
          />
        )
      )}
    </div>
  );
}

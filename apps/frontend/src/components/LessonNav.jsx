import { useEffect, useRef, useState } from 'react';
import './Sidebar.css';
import './Workbench.css';

const TRANSLATIONS = {
  de: {
    intro: 'Einführung',
    chapter: 'Kapitel',
    chapterOverview: 'Überblick',
    overview: 'Übersicht',
    theory: 'Theorie',
    exercise: 'Übung',
    done: 'Abgeschlossen',
    exercisesDone: 'Übungen gelöst',
    theoryBadge: 'T',
    exerciseBadge: 'Ü',
    nav: 'Lektionen',
  },
  en: {
    intro: 'Introduction',
    chapter: 'Chapter',
    chapterOverview: 'Overview',
    overview: 'Overview',
    theory: 'Theory',
    exercise: 'Exercise',
    done: 'Completed',
    exercisesDone: 'exercises solved',
    theoryBadge: 'T',
    exerciseBadge: 'E',
    nav: 'Lessons',
  },
};

// Chapter root lessons are titled "3. Erweiterte Signale" (number, dot, space).
const isChapterRoot = title => /^\d+\.\s/.test(title || '');
const isExerciseType = type => type === 'exercise' || type === 'project';

/**
 * Scrollable lesson tree: collapsible chapters, lessons colour-coded as theory/exercise,
 * solved exercises ticked off. Uses the app's green sidebar frame (and its mobile drawer).
 */
export default function LessonNav({
  title,
  lessons,
  byChapter,
  currentLessonId,
  completedIds,
  overviewActive,
  onSelectLesson,
  onShowOverview,
  uiLanguage = 'de',
  isOpen = false,
  onClose,
}) {
  const t = TRANSLATIONS[uiLanguage] || TRANSLATIONS.de;
  const currentChapterKey = byChapter.find(ch => ch.lessonIds.includes(currentLessonId))?.key ?? null;
  const [expanded, setExpanded] = useState(() => new Set(currentChapterKey !== null ? [currentChapterKey] : []));
  const activeRef = useRef(null);

  // Navigating (next/previous, links in the text) opens the chapter of the new lesson.
  useEffect(() => {
    if (currentChapterKey === null) return;
    setExpanded(prev => (prev.has(currentChapterKey) ? prev : new Set(prev).add(currentChapterKey)));
  }, [currentChapterKey]);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [currentLessonId]);

  const toggleChapter = key =>
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const allExerciseIds = Object.values(lessons).filter(l => isExerciseType(l.type)).map(l => l.id);
  const solvedCount = allExerciseIds.filter(id => completedIds.has(id)).length;

  return (
    <>
      <div className={`sidebar-backdrop ${isOpen ? 'open' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`sidebar lesson-nav ${isOpen ? 'open' : ''}`} aria-label={t.nav}>
        <div className="lesson-nav-header">
          <div className="lesson-nav-title-row">
            <span className="lesson-nav-title">{title}</span>
            <button
              type="button"
              className={`wb-btn lesson-nav-overview ${overviewActive ? 'active' : ''}`}
              onClick={onShowOverview}
            >
              {t.overview}
            </button>
          </div>
          {allExerciseIds.length > 0 && (
            <div
              className="lesson-nav-progress"
              title={`${solvedCount}/${allExerciseIds.length} ${t.exercisesDone}`}
            >
              <div className="lesson-nav-progress-bar" style={{ width: `${(solvedCount / allExerciseIds.length) * 100}%` }} />
            </div>
          )}
          <div className="lesson-nav-legend">
            <span><span className="nav-type-badge type-theory">{t.theoryBadge}</span>{t.theory}</span>
            <span><span className="nav-type-badge type-exercise">{t.exerciseBadge}</span>{t.exercise}</span>
            {allExerciseIds.length > 0 && (
              <span>{solvedCount}/{allExerciseIds.length} {t.exercisesDone}</span>
            )}
          </div>
        </div>

        <nav className="lesson-nav-list">
          {byChapter.map(({ key, lessonIds }) => {
            const chapterLessons = lessonIds.map(id => lessons[id]).filter(Boolean);
            const root = chapterLessons.find(l => isChapterRoot(l.title));
            const chapterTitle = root ? root.title : key === 'intro' ? t.intro : `${t.chapter} ${key}`;
            const exerciseIds = chapterLessons.filter(l => isExerciseType(l.type)).map(l => l.id);
            const isExpanded = expanded.has(key);

            return (
              <div key={key} className="nav-chapter-group">
                <button
                  type="button"
                  className="wb-btn nav-chapter"
                  onClick={() => toggleChapter(key)}
                  aria-expanded={isExpanded}
                  title={chapterTitle}
                >
                  <span className="nav-chevron">{isExpanded ? '▼' : '▶'}</span>
                  <span className="nav-chapter-title">{chapterTitle}</span>
                  <span className="nav-count">
                    {exerciseIds.length > 0
                      ? `${exerciseIds.filter(id => completedIds.has(id)).length}/${exerciseIds.length}`
                      : chapterLessons.length}
                  </span>
                </button>

                {isExpanded && chapterLessons.map(lesson => {
                  const isActive = !overviewActive && lesson.id === currentLessonId;
                  const isExercise = isExerciseType(lesson.type);
                  const typeClass = `type-${isExercise ? 'exercise' : 'theory'}`;
                  // The chapter's own lesson would just repeat the chapter title above it.
                  const label = lesson === root ? t.chapterOverview : lesson.title;
                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      ref={isActive ? activeRef : null}
                      className={`wb-btn nav-lesson ${typeClass} ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        onSelectLesson(lesson.id);
                        onClose?.();
                      }}
                      aria-current={isActive ? 'page' : undefined}
                      title={`${lesson.title} (${isExercise ? t.exercise : t.theory})`}
                    >
                      <span className={`nav-type-badge ${typeClass}`}>{isExercise ? t.exerciseBadge : t.theoryBadge}</span>
                      <span className="nav-lesson-title">{label}</span>
                      {completedIds.has(lesson.id) && <span className="nav-done" title={t.done}>✓</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

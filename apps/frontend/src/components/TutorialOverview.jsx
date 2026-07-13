import React, { useState } from 'react';
import './Tutorial.css';

const TRANSLATIONS = {
  de: {
    title: 'Verilog Tutorial',
    subtitle: 'Lerne Verilog Schritt für Schritt',
    startFromBeginning: 'Von vorne beginnen',
    selectLesson: 'Wähle ein Modul aus',
    byChapter: 'Nach Kapitel',
    byDifficulty: 'Nach Schwierigkeit',
    byType: 'Nach Aufgabentyp',
    intro: 'Einführung',
    beginner: 'Anfänger',
    intermediate: 'Könner',
    advanced: 'Experte',
    start: 'Starten',
    lessons: 'Lektionen',
    chapterLabel: 'Kapitel',
    showMore: 'Mehr anzeigen',
    showLess: 'Weniger anzeigen',
  },
  en: {
    title: 'Verilog Tutorial',
    subtitle: 'Learn Verilog Step by Step',
    startFromBeginning: 'Start from beginning',
    selectLesson: 'Choose a module',
    byChapter: 'By chapter',
    byDifficulty: 'By difficulty',
    byType: 'By task type',
    intro: 'Introduction',
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    start: 'Start',
    lessons: 'Lessons',
    chapterLabel: 'Chapter',
    showMore: 'Show more',
    showLess: 'Show less',
  },
};

const MAX_VISIBLE_SUBCHAPTERS = 7;

function getChapterBadge(lesson) {
  const match = lesson?.title?.match(/^(\d+(?:\.\d+)*)\b/);
  return match ? match[1] : null;
}

export default function TutorialOverview({
  lessons,
  byDifficulty,
  bySection = {},
  byType = {},
  byChapter = [],
  lessonIds = [],
  onStartLesson,
  uiLanguage = 'de'
}) {
  const t = TRANSLATIONS[uiLanguage] || TRANSLATIONS.de;
  const [expandedDifficulty, setExpandedDifficulty] = useState('beginner');
  const [expandedChapter, setExpandedChapter] = useState(byChapter[0]?.key ?? null);
  const [expandedSubchapters, setExpandedSubchapters] = useState({});
  const [viewMode, setViewMode] = useState('chapter'); // 'chapter' | 'difficulty' | 'type'

  const getChapterLabel = (key) => (key === 'intro' ? t.intro : `${t.chapterLabel} ${key}`);

  return (
    <div className="tutorial-overview">
      <div className="tutorial-header">
        <h1>{t.title}</h1>
        <p className="tutorial-subtitle">{t.subtitle}</p>
      </div>

      <div className="tutorial-start-section">
        <button 
          className="btn-start-beginner"
          onClick={() => {
            const firstLessonId = lessonIds[0];
            if (firstLessonId) onStartLesson(firstLessonId);
          }}
        >
          ▶️ {t.startFromBeginning}
        </button>
      </div>

      {/* View Mode Selector */}
      <div className="view-mode-selector">
        <button
          className={`mode-btn ${viewMode === 'chapter' ? 'active' : ''}`}
          onClick={() => setViewMode('chapter')}
        >
          {t.byChapter}
        </button>
        <button
          className={`mode-btn ${viewMode === 'difficulty' ? 'active' : ''}`}
          onClick={() => setViewMode('difficulty')}
        >
          {t.byDifficulty}
        </button>
        <button
          className={`mode-btn ${viewMode === 'type' ? 'active' : ''}`}
          onClick={() => setViewMode('type')}
        >
          {t.byType}
        </button>
      </div>

      <div className="tutorial-lessons-section">
        {/* Chapter View */}
        {viewMode === 'chapter' && (
          <>
            <h2>{t.selectLesson}</h2>
            {byChapter.map(({ key, lessonIds: chapterLessonIds }) => {
              const isExpanded = expandedChapter === key;
              const showAll = !!expandedSubchapters[key];
              const visibleIds = showAll
                ? chapterLessonIds
                : chapterLessonIds.slice(0, MAX_VISIBLE_SUBCHAPTERS);
              const hiddenCount = chapterLessonIds.length - visibleIds.length;

              return (
                <div key={key} className="difficulty-group">
                  <button
                    className={`difficulty-header ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => setExpandedChapter(isExpanded ? null : key)}
                  >
                    <span className="difficulty-icon">
                      {isExpanded ? '▼' : '▶'}
                    </span>
                    <span className="difficulty-label">{getChapterLabel(key)}</span>
                    <span className="lesson-count">({chapterLessonIds.length})</span>
                  </button>

                  {isExpanded && (
                    <div className="lesson-list">
                      {visibleIds.map(lessonId => {
                        const lesson = lessons[lessonId];
                        if (!lesson) return null;

                        const chapterBadge = getChapterBadge(lesson);

                        return (
                          <button
                            key={lessonId}
                            className="lesson-item chapter-item"
                            onClick={() => onStartLesson(lessonId)}
                          >
                            <div className="lesson-content">
                              <div className="lesson-title-row">
                                {chapterBadge && (
                                  <span className="lesson-chapter-badge">
                                    {chapterBadge}
                                  </span>
                                )}
                                <h3 className="lesson-title">{lesson.title}</h3>
                              </div>
                              {lesson.description && (
                                <p className="lesson-description">
                                  {lesson.description.substring(0, 100)}
                                  {lesson.description.length > 100 ? '...' : ''}
                                </p>
                              )}
                            </div>
                            <span className="lesson-arrow">→</span>
                          </button>
                        );
                      })}

                      {chapterLessonIds.length > MAX_VISIBLE_SUBCHAPTERS && (
                        <button
                          className="btn-show-more"
                          onClick={() =>
                            setExpandedSubchapters(prev => ({ ...prev, [key]: !showAll }))
                          }
                        >
                          {showAll ? t.showLess : `${t.showMore} (+${hiddenCount})`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* Difficulty View */}
        {viewMode === 'difficulty' && (
          <>
            <h2>{t.selectLesson}</h2>
            {['intro', 'beginner', 'intermediate', 'advanced']
              .map(difficulty => ({
                difficulty,
                label: {
                  intro: t.intro,
                  beginner: t.beginner,
                  intermediate: t.intermediate,
                  advanced: t.advanced,
                }[difficulty],
              }))
              .map(({ difficulty, label }) => {
                const lessonIdsForDiff = byDifficulty[difficulty] || [];
                const isExpanded = expandedDifficulty === difficulty;

                return (
                  <div key={difficulty} className="difficulty-group">
                    <button 
                      className={`difficulty-header ${isExpanded ? 'expanded' : ''}`}
                      onClick={() => setExpandedDifficulty(isExpanded ? null : difficulty)}
                    >
                      <span className="difficulty-icon">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                      <span className="difficulty-label">{label}</span>
                      <span className="lesson-count">({lessonIdsForDiff.length})</span>
                    </button>

                    {isExpanded && (
                      <div className="lesson-list">
                        {lessonIdsForDiff.map(lessonId => {
                          const lesson = lessons[lessonId];
                          if (!lesson) return null;

                          return (
                            <button
                              key={lessonId}
                              className="lesson-item"
                              onClick={() => onStartLesson(lessonId)}
                            >
                              <div className="lesson-content">
                                <h3 className="lesson-title">{lesson.title}</h3>
                                {lesson.description && (
                                  <p className="lesson-description">
                                    {lesson.description.substring(0, 100)}
                                    {lesson.description.length > 100 ? '...' : ''}
                                  </p>
                                )}
                              </div>
                              <span className="lesson-arrow">→</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
          </>
        )}

        {/* Type View */}
        {viewMode === 'type' && (
          <>
            <h2>Lektionen nach Typ</h2>
            {Object.entries(byType).map(([type, typeLessonIds]) => {
              const typeLabel = {
                theory: '📖 Theorie',
                exercise: '✏️ Übung',
                project: '🚀 Projekt',
              }[type] || type;

              return (
                <div key={type} className="type-group">
                  <h3 className="type-header">{typeLabel}</h3>
                  <div className="lesson-list">
                    {typeLessonIds.map(lessonId => {
                      const lesson = lessons[lessonId];
                      if (!lesson) return null;

                      return (
                        <button
                          key={lessonId}
                          className="lesson-item"
                          onClick={() => onStartLesson(lessonId)}
                        >
                          <div className="lesson-content">
                            <h3 className="lesson-title">{lesson.title}</h3>
                            {lesson.description && (
                              <p className="lesson-description">
                                {lesson.description.substring(0, 100)}
                                {lesson.description.length > 100 ? '...' : ''}
                              </p>
                            )}
                          </div>
                          <span className="lesson-arrow">→</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

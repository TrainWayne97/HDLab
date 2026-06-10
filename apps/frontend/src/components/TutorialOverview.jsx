import React, { useState } from 'react';
import './Tutorial.css';

const TRANSLATIONS = {
  de: {
    title: 'Verilog Tutorial',
    subtitle: 'Lerne Verilog Schritt für Schritt',
    startFromBeginning: 'Von vorne beginnen (Anfänger)',
    selectLesson: 'Wähle ein Modul aus',
    intro: 'Einführung',
    beginner: 'Anfänger',
    intermediate: 'Könner',
    advanced: 'Experte',
    start: 'Starten',
    lessons: 'Lektionen',
  },
  en: {
    title: 'Verilog Tutorial',
    subtitle: 'Learn Verilog Step by Step',
    startFromBeginning: 'Start from beginning (Beginner)',
    selectLesson: 'Choose a module',
    intro: 'Introduction',
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    start: 'Start',
    lessons: 'Lessons',
  },
};

export default function TutorialOverview({ 
  lessons, 
  byDifficulty,
  bySection = {},
  byType = {},
  lessonIds = [],
  onStartLesson, 
  uiLanguage = 'de' 
}) {
  const t = TRANSLATIONS[uiLanguage] || TRANSLATIONS.de;
  const [expandedDifficulty, setExpandedDifficulty] = useState('beginner');
  const [viewMode, setViewMode] = useState('difficulty'); // 'difficulty' or 'type'

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
          className={`mode-btn ${viewMode === 'difficulty' ? 'active' : ''}`}
          onClick={() => setViewMode('difficulty')}
        >
          Nach Schwierigkeit
        </button>
        <button
          className={`mode-btn ${viewMode === 'type' ? 'active' : ''}`}
          onClick={() => setViewMode('type')}
        >
          Nach Typ
        </button>
      </div>

      <div className="tutorial-lessons-section">
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
                              <div className="lesson-meta">
                                <span className="lesson-type">{lesson.type || 'theory'}</span>
                                <span className="lesson-duration">{lesson.duration_min || 10}m</span>
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
                          <div className="lesson-meta">
                            <span className="lesson-difficulty">{lesson.difficulty}</span>
                            <span className="lesson-duration">{lesson.duration_min || 10}m</span>
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

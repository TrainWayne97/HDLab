import React from 'react';

const STATUS_ICONS = {
  running: <span className="editor-tab-spinner" />,
  finished: '✓',
  error: '✗',
};

const TRANSLATIONS = {
  de: {
    newProject: 'Neues Projekt',
    running: 'Simulation läuft',
    finished: 'Simulation abgeschlossen',
    error: 'Simulation fehlgeschlagen',
  },
  en: {
    newProject: 'New Project',
    running: 'Simulation running',
    finished: 'Simulation finished',
    error: 'Simulation failed',
  }
};

export default function EditorTabs({
  projects,
  activeProjectId,
  simStatuses = {},
  onSelectProject,
  onCloseProject,
  onNewProject,
  uiLanguage
}) {
  const t = TRANSLATIONS[uiLanguage] || TRANSLATIONS.de;

  return (
    <div className="editor-tabs">
      {projects.map(project => (
        <button
          key={project.id}
          className={`editor-tab ${project.id === activeProjectId ? 'active' : ''}`}
          onClick={() => onSelectProject(project.id)}
        >
          {STATUS_ICONS[simStatuses[project.id]] && (
            <span
              className={`editor-tab-status ${simStatuses[project.id]}`}
              title={t[simStatuses[project.id]]}
            >
              {STATUS_ICONS[simStatuses[project.id]]}
            </span>
          )}
          <span>{project.name}</span>
          <span
            className="editor-tab-close"
            onClick={(e) => {
              e.stopPropagation();
              onCloseProject(project.id);
            }}
            title="Close"
          >
            ✕
          </span>
        </button>
      ))}
      <button
        className="editor-tab-add"
        onClick={onNewProject}
        title={t.newProject}
      >
        +
      </button>
    </div>
  );
}

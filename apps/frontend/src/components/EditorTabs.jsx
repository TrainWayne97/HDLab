import React from 'react';

const TRANSLATIONS = {
  de: {
    newProject: 'Neues Projekt',
  },
  en: {
    newProject: 'New Project',
  }
};

export default function EditorTabs({
  projects,
  activeProjectId,
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

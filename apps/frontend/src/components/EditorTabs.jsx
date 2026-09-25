import { useRef, useState } from 'react';

const STATUS_ICONS = {
  running: <span className="editor-tab-spinner" />,
  finished: '✓',
  error: '✗',
};

const TRANSLATIONS = {
  de: {
    newProject: 'Neues Projekt',
    rename: 'Umbenennen',
    close: 'Projekt schließen',
    running: 'Simulation läuft',
    finished: 'Simulation abgeschlossen',
    error: 'Simulation fehlgeschlagen',
  },
  en: {
    newProject: 'New Project',
    rename: 'Rename',
    close: 'Close project',
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
  onRenameProject,
  onNewProject,
  uiLanguage
}) {
  const t = TRANSLATIONS[uiLanguage] || TRANSLATIONS.de;
  // Inline rename: id of the tab being edited and its draft name
  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState('');
  // Set on Escape so the blur fired while the input unmounts doesn't save the draft.
  const cancelledRef = useRef(false);

  const startRename = project => {
    cancelledRef.current = false;
    setEditingId(project.id);
    setDraftName(project.name);
  };
  const commitRename = () => {
    if (editingId && !cancelledRef.current) onRenameProject(editingId, draftName);
    setEditingId(null);
  };
  const cancelRename = () => {
    cancelledRef.current = true;
    setEditingId(null);
  };

  return (
    <div className="editor-tabs">
      {projects.map(project => (
        <div
          key={project.id}
          role="tab"
          tabIndex={0}
          aria-selected={project.id === activeProjectId}
          className={`editor-tab ${project.id === activeProjectId ? 'active' : ''}`}
          onClick={() => onSelectProject(project.id)}
          onKeyDown={e => {
            if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onSelectProject(project.id);
            }
          }}
        >
          {STATUS_ICONS[simStatuses[project.id]] && (
            <span
              className={`editor-tab-status ${simStatuses[project.id]}`}
              title={t[simStatuses[project.id]]}
            >
              {STATUS_ICONS[simStatuses[project.id]]}
            </span>
          )}
          {editingId !== project.id && (
            <span
              className="editor-tab-rename-btn"
              role="button"
              tabIndex={0}
              title={t.rename}
              aria-label={t.rename}
              onClick={e => {
                e.stopPropagation();
                startRename(project);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  startRename(project);
                }
              }}
            >
              ✎
            </span>
          )}
          {editingId === project.id ? (
            <input
              className="editor-tab-rename"
              value={draftName}
              autoFocus
              size={Math.max(draftName.length, 6)}
              onChange={e => setDraftName(e.target.value)}
              onClick={e => e.stopPropagation()}
              onFocus={e => e.target.select()}
              onBlur={commitRename}
              onKeyDown={e => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') cancelRename();
              }}
            />
          ) : (
            <span onDoubleClick={() => startRename(project)}>{project.name}</span>
          )}
          <span
            className="editor-tab-close"
            onClick={(e) => {
              e.stopPropagation();
              onCloseProject(project.id);
            }}
            title={t.close}
          >
            ✕
          </span>
        </div>
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

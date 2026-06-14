import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './ModuleLibrary.css';

const TRANSLATIONS = {
  de: {
    title: 'Meine Module',
    noModules: 'Keine Module gespeichert',
    saveCurrent: '💾 Aktuelles Modul speichern',
    moduleName: 'Modulname',
    description: 'Beschreibung (optional)',
    tags: 'Tags (kommagetrennt)',
    save: 'Speichern',
    cancel: 'Abbrechen',
    loading: 'Wird geladen...',
    error: 'Fehler beim Laden der Module',
    saved: '✓ Modul gespeichert!',
    insertModule: 'Einfügen',
    deleteModule: '🗑️',
    version: 'Version',
  },
  en: {
    title: 'My Modules',
    noModules: 'No modules saved',
    saveCurrent: '💾 Save current module',
    moduleName: 'Module name',
    description: 'Description (optional)',
    tags: 'Tags (comma-separated)',
    save: 'Save',
    cancel: 'Cancel',
    loading: 'Loading...',
    error: 'Error loading modules',
    saved: '✓ Module saved!',
    insertModule: 'Insert',
    deleteModule: '🗑️',
    version: 'Version',
  },
};

export default function ModuleLibrary({
  currentCode = '',
  onInsertModule = null,
  uiLanguage = 'de',
}) {
  const t = TRANSLATIONS[uiLanguage] || TRANSLATIONS.de;
  const { apiCall } = useAuth();

  const [modules, setModules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [moduleName, setModuleName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Load modules from backend
  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    setIsLoading(true);
    try {
      const res = await apiCall('/modules');
      if (res.ok) {
        const data = await res.json();
        setModules(data);
      } else {
        console.error('Failed to load modules');
      }
    } catch (err) {
      console.error('Error loading modules:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract module name from code
  const extractModuleName = (code) => {
    const match = code.match(/module\s+(\w+)/);
    return match ? match[1] : '';
  };

  // Auto-save module nach Inaktivität
  const handleAutoSaveModule = async () => {
    if (!moduleName.trim() || !currentCode.trim()) return;
    if (isSaving) return; // Verhindere gleichzeitige Speicherungen

    setIsSaving(true);
    try {
      const res = await apiCall('/modules', {
        method: 'POST',
        body: JSON.stringify({
          moduleName: moduleName.trim(),
          code: currentCode,
          description: description.trim(),
          tags: tags.split(',').map(t => t.trim()).filter(t => t),
        }),
      });

      if (res.ok) {
        setMessage(t.saved);
        await loadModules();
        setTimeout(() => setMessage(''), 2000);
      }
    } catch (err) {
      console.error('Error auto-saving module:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Manual save (mit Form Submit)
  const handleSaveModule = async (e) => {
    e.preventDefault();
    if (!moduleName.trim() || !currentCode.trim()) {
      setMessage('Modulname und Code erforderlich');
      return;
    }
    
    await handleAutoSaveModule();
  };

  // Delete module
  const handleDeleteModule = async (name) => {
    if (!confirm(`Modul "${name}" wirklich löschen?`)) return;

    try {
      const res = await apiCall(`/modules/${name}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await loadModules();
      }
    } catch (err) {
      console.error('Error deleting module:', err);
    }
  };

  // Insert module into editor
  const handleInsertModule = (module) => {
    if (onInsertModule) {
      onInsertModule(module.code);
    }
  };

  // Auto-fill form with current code
  const handleAutoFillForm = () => {
    const name = extractModuleName(currentCode);
    setModuleName(name || 'my_module');
    setShowSaveForm(true);
  };

  return (
    <div className="module-library">
      <div className="library-header">
        <h3>{t.title}</h3>
        <button
          className="btn-save-module"
          onClick={handleAutoFillForm}
          disabled={!currentCode.trim()}
        >
          {t.saveCurrent}
        </button>
      </div>

      {message && <div className="library-message">{message}</div>}

      {showSaveForm && (
        <form onSubmit={handleSaveModule} className="save-module-form">
          <div className="form-group">
            <label>{t.moduleName}</label>
            <input
              type="text"
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
              placeholder="z.B. modul_addierer"
              required
            />
          </div>

          <div className="form-group">
            <label>{t.description}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Was macht dieses Modul?"
              rows="2"
            />
          </div>

          <div className="form-group">
            <label>{t.tags}</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="z.B. addierer, grundoperation"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={isSaving}>
              {isSaving ? 'Speichert...' : t.save}
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={() => setShowSaveForm(false)}
            >
              {t.cancel}
            </button>
          </div>
        </form>
      )}

      <div className="modules-list">
        {isLoading ? (
          <div className="loading">{t.loading}</div>
        ) : modules.length > 0 ? (
          modules.map((mod) => (
            <div key={`${mod._id}`} className="module-item">
              <div className="module-info">
                <div className="module-name">{mod.moduleName}</div>
                {mod.description && (
                  <div className="module-description">{mod.description}</div>
                )}
                {mod.tags && mod.tags.length > 0 && (
                  <div className="module-tags">
                    {mod.tags.map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="module-meta">
                  {t.version}: {mod.version}
                </div>
              </div>
              <div className="module-actions">
                {onInsertModule && (
                  <button
                    className="btn-insert"
                    onClick={() => handleInsertModule(mod)}
                    title={t.insertModule}
                  >
                    ➕
                  </button>
                )}
                <button
                  className="btn-delete"
                  onClick={() => handleDeleteModule(mod.moduleName)}
                  title={t.deleteModule}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">{t.noModules}</div>
        )}
      </div>
    </div>
  );
}

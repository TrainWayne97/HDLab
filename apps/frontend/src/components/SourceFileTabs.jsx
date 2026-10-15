const TRANSLATIONS = {
  de: {
    addPackage: '+ Package',
    addPackageTitle: 'Neue SystemVerilog-Package-Datei anlegen',
    remove: 'Datei entfernen',
  },
  en: {
    addPackage: '+ Package',
    addPackageTitle: 'Create a new SystemVerilog package file',
    remove: 'Remove file',
  },
};

/**
 * File tabs above the design editor: main.sv plus the project's additional files
 * (packages, modules from the library). main.sv can't be removed.
 */
export default function SourceFileTabs({ filenames, activeFile, onSelect, onRemove, onAddPackage, uiLanguage }) {
  const t = TRANSLATIONS[uiLanguage] || TRANSLATIONS.de;
  return (
    <div className="source-file-tabs" role="tablist">
      {filenames.map(filename => (
        <div
          key={filename}
          role="tab"
          tabIndex={0}
          aria-selected={filename === activeFile}
          className={`source-file-tab ${filename === activeFile ? 'active' : ''}`}
          onClick={() => onSelect(filename)}
          onKeyDown={e => {
            if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onSelect(filename);
            }
          }}
        >
          <span>{filename}</span>
          {filename !== 'main.sv' && (
            <button
              type="button"
              className="source-file-tab-close"
              title={t.remove}
              aria-label={`${t.remove}: ${filename}`}
              onClick={e => {
                e.stopPropagation();
                onRemove(filename);
              }}
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <button type="button" className="source-file-tab-add" onClick={onAddPackage} title={t.addPackageTitle}>
        {t.addPackage}
      </button>
    </div>
  );
}

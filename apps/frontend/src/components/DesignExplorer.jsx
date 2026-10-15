import { useRef, useState } from 'react';
import { basename, buildTree } from '../utils/designFiles';
import './DesignExplorer.css';

const TRANSLATIONS = {
  de: {
    viewFiles: 'Dateien',
    viewHierarchy: 'Hierarchie',
    newModule: '+ Modul',
    newModuleTitle: 'Neues Modul im ausgewählten Ordner anlegen',
    newPackage: '+ Package',
    newPackageTitle: 'Neues SystemVerilog-Package im ausgewählten Ordner anlegen',
    newFolder: '+ Ordner',
    newFolderTitle: 'Neuen Ordner im ausgewählten Ordner anlegen',
    import: 'Import',
    importTitle: '.sv/.v-Dateien in den ausgewählten Ordner importieren (oder hierher ziehen)',
    setTop: 'Als Top-Datei festlegen',
    isTop: 'Top-Datei: enthält das Top-Modul des Designs',
    rename: 'Umbenennen',
    remove: 'Löschen',
    design: 'Design',
    packages: 'Packages',
    unused: 'Nicht verwendet',
    noTop: 'Die Top-Datei enthält kein Modul.',
    recursive: '(rekursiv)',
    root: 'Projekt',
  },
  en: {
    viewFiles: 'Files',
    viewHierarchy: 'Hierarchy',
    newModule: '+ Module',
    newModuleTitle: 'Create a new module in the selected folder',
    newPackage: '+ Package',
    newPackageTitle: 'Create a new SystemVerilog package in the selected folder',
    newFolder: '+ Folder',
    newFolderTitle: 'Create a new folder in the selected folder',
    import: 'Import',
    importTitle: 'Import .sv/.v files into the selected folder (or drop them here)',
    setTop: 'Set as top file',
    isTop: 'Top file: contains the design\'s top module',
    rename: 'Rename',
    remove: 'Delete',
    design: 'Design',
    packages: 'Packages',
    unused: 'Unused',
    noTop: 'The top file contains no module.',
    recursive: '(recursive)',
    root: 'Project',
  },
};

const DRAG_TYPE = 'application/x-hdlab-item';
const INDENT_PX = 12;

/**
 * Explorer of the design files: a folder view (create, import, rename, move by drag & drop)
 * and a hierarchy view derived from the code (top module -> instantiated submodules, packages).
 * All changes go through the callbacks; App owns the project state.
 */
export default function DesignExplorer({
  files,
  folders,
  topFile,
  activeFile,
  analysis,
  selectedFolder,
  onSelectFolder,
  onOpenFile,
  onNewModule,
  onNewPackage,
  onNewFolder,
  onImport,
  onSetTop,
  onRenameFile,
  onDeleteFile,
  onRenameFolder,
  onDeleteFolder,
  onMove,
  uiLanguage,
}) {
  const t = TRANSLATIONS[uiLanguage] || TRANSLATIONS.de;
  const [view, setView] = useState('files');
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [dropTarget, setDropTarget] = useState(null);
  const importRef = useRef(null);

  const toggleFolder = path =>
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });

  // ---- Drag & drop: own items are moved, files from the desktop are imported
  const dropHandlers = folderPath => ({
    onDragOver: e => {
      if (![...e.dataTransfer.types].some(type => type === DRAG_TYPE || type === 'Files')) return;
      e.preventDefault();
      e.stopPropagation();
      setDropTarget(folderPath);
    },
    onDragLeave: e => {
      if (!e.currentTarget.contains(e.relatedTarget)) setDropTarget(null);
    },
    onDrop: e => {
      e.preventDefault();
      e.stopPropagation();
      setDropTarget(null);
      if (e.dataTransfer.files.length > 0) {
        onImport(e.dataTransfer.files, folderPath);
        return;
      }
      const raw = e.dataTransfer.getData(DRAG_TYPE);
      if (raw) onMove(JSON.parse(raw), folderPath);
    },
  });
  const dragSource = item => ({
    draggable: true,
    onDragStart: e => {
      e.dataTransfer.setData(DRAG_TYPE, JSON.stringify(item));
      e.dataTransfer.effectAllowed = 'move';
    },
  });

  const activate = handler => ({
    onClick: handler,
    onKeyDown: e => {
      if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        handler();
      }
    },
  });

  const action = (label, symbol, handler) => (
    <button
      type="button"
      className="explorer-action"
      title={label}
      aria-label={label}
      onClick={e => {
        e.stopPropagation();
        handler();
      }}
    >
      {symbol}
    </button>
  );

  const fileIcon = path => {
    const info = analysis.fileInfo.get(path);
    return info && info.packages.length > 0 && info.modules.length === 0 ? '📦' : '📄';
  };

  // ---- Files view
  const renderFile = (file, depth) => {
    const isTop = file.path === topFile;
    return (
      <div
        key={file.path}
        role="treeitem"
        tabIndex={0}
        aria-selected={file.path === activeFile}
        className={`explorer-row ${file.path === activeFile ? 'active' : ''}`}
        style={{ paddingLeft: 6 + depth * INDENT_PX }}
        title={file.path}
        {...dragSource({ type: 'file', path: file.path })}
        {...activate(() => onOpenFile(file.path))}
      >
        {/* Placeholder for the folder caret, so icons of the same level line up */}
        <span className="explorer-caret" />
        <span className="explorer-icon">{fileIcon(file.path)}</span>
        <span className="explorer-name">{basename(file.path)}</span>
        {isTop && <span className="explorer-top" title={t.isTop}>★</span>}
        <span className="explorer-actions">
          {!isTop && action(t.setTop, '☆', () => onSetTop(file.path))}
          {action(t.rename, '✎', () => onRenameFile(file.path))}
          {!isTop && action(t.remove, '✕', () => onDeleteFile(file.path))}
        </span>
      </div>
    );
  };

  const renderFolder = (node, depth) => {
    const open = !collapsed.has(node.path);
    return (
      <div key={node.path} role="group" {...dropHandlers(node.path)}>
        <div
          role="treeitem"
          tabIndex={0}
          aria-expanded={open}
          aria-selected={selectedFolder === node.path}
          className={`explorer-row folder ${selectedFolder === node.path ? 'selected' : ''} ${dropTarget === node.path ? 'drop' : ''}`}
          style={{ paddingLeft: 6 + depth * INDENT_PX }}
          title={node.path}
          {...dragSource({ type: 'folder', path: node.path })}
          {...activate(() => {
            onSelectFolder(node.path);
            toggleFolder(node.path);
          })}
        >
          <span className="explorer-caret">{open ? '▾' : '▸'}</span>
          <span className="explorer-icon">📁</span>
          <span className="explorer-name">{node.name}</span>
          <span className="explorer-actions">
            {action(t.rename, '✎', () => onRenameFolder(node.path))}
            {action(t.remove, '✕', () => onDeleteFolder(node.path))}
          </span>
        </div>
        {open && (
          <>
            {node.folders.map(child => renderFolder(child, depth + 1))}
            {node.files.map(file => renderFile(file, depth + 1))}
          </>
        )}
      </div>
    );
  };

  const tree = buildTree(files, folders);
  const filesView = (
    <div
      className={`explorer-tree ${dropTarget === '' ? 'drop' : ''}`}
      role="tree"
      {...dropHandlers('')}
      onClick={e => {
        if (e.target === e.currentTarget) onSelectFolder('');
      }}
    >
      <div
        className={`explorer-row root ${selectedFolder === '' ? 'selected' : ''}`}
        {...activate(() => onSelectFolder(''))}
        role="treeitem"
        tabIndex={0}
        aria-selected={selectedFolder === ''}
      >
        <span className="explorer-icon">🗂</span>
        <span className="explorer-name">{t.root}</span>
      </div>
      {tree.folders.map(node => renderFolder(node, 1))}
      {tree.files.map(file => renderFile(file, 1))}
    </div>
  );

  // ---- Hierarchy view
  const reachable = new Set();
  const renderInstance = (moduleName, instanceName, depth, stack) => {
    const mod = analysis.modules.get(moduleName);
    reachable.add(moduleName);
    const recursive = stack.includes(moduleName);
    return (
      <div key={`${stack.join('/')}/${instanceName}`}>
        <div
          role="treeitem"
          tabIndex={0}
          className={`explorer-row ${mod?.path === activeFile ? 'active' : ''}`}
          style={{ paddingLeft: 6 + depth * INDENT_PX }}
          title={mod?.path}
          {...activate(() => mod && onOpenFile(mod.path))}
        >
          <span className="explorer-icon">{depth === 1 ? '★' : '◇'}</span>
          <span className="explorer-name keep">
            {instanceName ? <>{instanceName} : <strong>{moduleName}</strong></> : <strong>{moduleName}</strong>}
          </span>
          <span className="explorer-file">{mod ? basename(mod.path) : ''}</span>
          {recursive && <span className="explorer-file">{t.recursive}</span>}
        </div>
        {!recursive && depth < 32 && mod?.instances.map(inst =>
          renderInstance(inst.type, inst.name, depth + 1, [...stack, moduleName])
        )}
      </div>
    );
  };

  const hierarchyView = (
    <div className="explorer-tree" role="tree">
      <div className="explorer-group">{t.design}</div>
      {analysis.topModule ? renderInstance(analysis.topModule, null, 1, []) : <div className="explorer-hint">{t.noTop}</div>}
      {analysis.packages.length > 0 && <div className="explorer-group">{t.packages}</div>}
      {analysis.packages.map(pkg => (
        <div
          key={`${pkg.path}:${pkg.name}`}
          role="treeitem"
          tabIndex={0}
          className={`explorer-row ${pkg.path === activeFile ? 'active' : ''}`}
          style={{ paddingLeft: 6 + INDENT_PX }}
          title={pkg.path}
          {...activate(() => onOpenFile(pkg.path))}
        >
          <span className="explorer-icon">📦</span>
          <span className="explorer-name">{pkg.name}</span>
          <span className="explorer-file">{basename(pkg.path)}</span>
        </div>
      ))}
    </div>
  );
  // Rendered after the design tree, so `reachable` is complete
  const unused = view === 'hierarchy' ? [...analysis.modules.entries()].filter(([name]) => !reachable.has(name)) : [];

  return (
    <div className="design-explorer">
      <div className="explorer-view-switch" role="tablist">
        {['files', 'hierarchy'].map(id => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            className={view === id ? 'active' : ''}
            onClick={() => setView(id)}
          >
            {id === 'files' ? t.viewFiles : t.viewHierarchy}
          </button>
        ))}
      </div>
      {view === 'files' && (
        <div className="explorer-toolbar">
          <button type="button" onClick={onNewModule} title={t.newModuleTitle}>{t.newModule}</button>
          <button type="button" onClick={onNewPackage} title={t.newPackageTitle}>{t.newPackage}</button>
          <button type="button" onClick={onNewFolder} title={t.newFolderTitle}>{t.newFolder}</button>
          <button type="button" onClick={() => importRef.current?.click()} title={t.importTitle}>{t.import}</button>
          <input
            ref={importRef}
            type="file"
            accept=".sv,.v"
            multiple
            hidden
            onChange={e => {
              if (e.target.files.length > 0) onImport(e.target.files, selectedFolder);
              e.target.value = '';
            }}
          />
        </div>
      )}
      {view === 'files' ? filesView : hierarchyView}
      {unused.length > 0 && (
        <div className="explorer-tree explorer-unused" role="tree">
          <div className="explorer-group">{t.unused}</div>
          {unused.map(([name, mod]) => (
            <div
              key={name}
              role="treeitem"
              tabIndex={0}
              className={`explorer-row ${mod.path === activeFile ? 'active' : ''}`}
              style={{ paddingLeft: 6 + INDENT_PX }}
              title={mod.path}
              {...activate(() => onOpenFile(mod.path))}
            >
              <span className="explorer-icon">◇</span>
              <span className="explorer-name">{name}</span>
              <span className="explorer-file">{basename(mod.path)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// Design files of a project: paths with folders ("alu/alu.sv"), explicit (possibly empty)
// folders and the file holding the top module. Folders only exist in the UI - the
// simulation gets all files flat, so file names have to be unique across the project.
// All operations are pure and return the changed part of the project.

// Names the simulation reserves for the testbench and the C++ wrapper
export const RESERVED_FILENAMES = ['tb.sv', 'tb.py', 'sim_main.cpp'];
export const SOURCE_EXTENSIONS = ['.sv', '.v'];
// Headers are only pulled in with `include: never compiled on their own, never the top file
export const HEADER_EXTENSIONS = ['.svh', '.vh'];
export const SV_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
// Same rule as backend/worker: plain names only, they end up in the simulation's temp dir
const SAFE_NAME = /^[A-Za-z0-9_][A-Za-z0-9_.-]*$/;

export const basename = path => path.slice(path.lastIndexOf('/') + 1);
export const dirname = path => (path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '');
export const joinPath = (folder, name) => (folder ? `${folder}/${name}` : name);
export const isInside = (path, folder) => path === folder || path.startsWith(`${folder}/`);
export const isHeaderFile = path => HEADER_EXTENSIONS.some(ext => path.endsWith(ext));
/** Any file the design explorer accepts: sources and headers. */
export const hasDesignExtension = name => [...SOURCE_EXTENSIONS, ...HEADER_EXTENSIONS].some(ext => name.endsWith(ext));

export const moduleTemplate = name =>
  `module ${name} (\n  input  logic a,\n  output logic y\n);\n  assign y = a;\nendmodule\n`;
export const headerTemplate = name => {
  const guard = `${name.toUpperCase()}_SVH`;
  return `\`ifndef ${guard}\n\`define ${guard}\n\n// Gemeinsame Definitionen, einbinden mit: \`include "${name}.svh"\n\`define DATA_WIDTH 8\n\n\`endif // ${guard}\n`;
};
export const packageTemplate = name =>
  `package ${name};\n  // Typen, Parameter und Funktionen, nutzbar mit: import ${name}::*;\n  localparam int WIDTH = 8;\n  typedef logic [WIDTH-1:0] word_t;\nendpackage\n`;

/**
 * Brings a stored project to the current format. Older projects kept the design in
 * `code` (main.sv) plus `extraFiles` (flat packages/library files).
 */
export function normalizeProject(project) {
  if (Array.isArray(project.files)) return project;
  const { code = '', extraFiles = [], ...rest } = project;
  const files = [
    { path: 'main.sv', content: code },
    ...extraFiles.map(f => ({ path: f.filename, content: f.content })),
  ];
  return {
    ...rest,
    files,
    folders: [],
    topFile: 'main.sv',
    activeFile: files.some(f => f.path === project.activeFile) ? project.activeFile : 'main.sv',
  };
}

/**
 * Checks a file name (with extension) for a file in the project.
 * @returns {string|null} error key ('invalidName' | 'extension' | 'reservedName' | 'nameTaken') or null
 */
export function validateFilename(name, files, ignorePath = null) {
  if (!SAFE_NAME.test(name) || name.length > 128) return 'invalidName';
  if (!hasDesignExtension(name)) return 'extension';
  if (RESERVED_FILENAMES.includes(name)) return 'reservedName';
  if (files.some(f => basename(f.path) === name && f.path !== ignorePath)) return 'nameTaken';
  return null;
}

export function validateFolderName(name, folders, parent, ignorePath = null) {
  if (!SAFE_NAME.test(name) || name.length > 64) return 'invalidName';
  const path = joinPath(parent, name);
  if (path !== ignorePath && folders.includes(path)) return 'folderTaken';
  return null;
}

/** File name for an imported file: invalid characters become "_". */
export function sanitizeFilename(name) {
  const cleaned = name.replace(/[^A-Za-z0-9_.-]/g, '_').replace(/^[.-]+/, '');
  return cleaned || 'datei.sv';
}

/** All folder paths, including parents of files and nested folders. */
export function allFolders(files, folders) {
  const result = new Set();
  const add = path => {
    for (let p = path; p; p = dirname(p)) result.add(p);
  };
  folders.forEach(add);
  files.forEach(f => add(dirname(f.path)));
  return [...result].sort();
}

/**
 * Nested tree for the explorer: { name, path, folders: [...], files: [...] },
 * folders first, both sorted by name.
 */
export function buildTree(files, folders) {
  const nodes = new Map([['', { name: '', path: '', folders: [], files: [] }]]);
  for (const path of allFolders(files, folders)) {
    const node = { name: basename(path), path, folders: [], files: [] };
    nodes.set(path, node);
  }
  for (const [path, node] of nodes) {
    if (path) nodes.get(dirname(path)).folders.push(node);
  }
  files.forEach(f => nodes.get(dirname(f.path)).files.push(f));
  for (const node of nodes.values()) {
    node.folders.sort((a, b) => a.name.localeCompare(b.name));
    node.files.sort((a, b) => basename(a.path).localeCompare(basename(b.path)));
  }
  return nodes.get('');
}

// ---- Operations: take { files, folders, topFile, activeFile } and return the changed fields

/** Adds a file or, if one with the same path exists, replaces its content. */
export function upsertFile(state, path, content) {
  const exists = state.files.some(f => f.path === path);
  return {
    files: exists
      ? state.files.map(f => (f.path === path ? { ...f, content } : f))
      : [...state.files, { path, content }],
    activeFile: path,
  };
}

export function updateContent(state, path, content) {
  return { files: state.files.map(f => (f.path === path ? { ...f, content } : f)) };
}

/** Moves/renames a file; keeps the top file and the open file pointing at it. */
export function moveFile(state, path, newPath) {
  const follow = p => (p === path ? newPath : p);
  return {
    files: state.files.map(f => (f.path === path ? { ...f, path: newPath } : f)),
    topFile: follow(state.topFile),
    activeFile: follow(state.activeFile),
  };
}

export function removeFile(state, path) {
  return {
    files: state.files.filter(f => f.path !== path),
    activeFile: state.activeFile === path ? state.topFile : state.activeFile,
  };
}

export function addFolder(state, path) {
  return { folders: allFolders([], [...state.folders, path]) };
}

/** Moves/renames a folder with everything inside. */
export function moveFolder(state, path, newPath) {
  const follow = p => (isInside(p, path) ? newPath + p.slice(path.length) : p);
  return {
    files: state.files.map(f => ({ ...f, path: follow(f.path) })),
    folders: allFolders([], state.folders.map(follow)),
    topFile: follow(state.topFile),
    activeFile: follow(state.activeFile),
  };
}

export function removeFolder(state, path) {
  const files = state.files.filter(f => !isInside(f.path, path));
  return {
    files,
    folders: state.folders.filter(p => !isInside(p, path)),
    activeFile: files.some(f => f.path === state.activeFile) ? state.activeFile : state.topFile,
  };
}

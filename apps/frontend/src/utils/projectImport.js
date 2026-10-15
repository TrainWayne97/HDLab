// Import of a whole project from the entries of a ZIP archive (see "Öffnen" in App.jsx).
// Archives exported by HDLab contain a manifest (hdlab.json) with top file and testbench;
// for other archives (e.g. a zipped Vivado source folder) both are guessed from the code.

import { analyzeDesign } from './svHierarchy.js';
import { RESERVED_FILENAMES, allFolders, basename, dirname, joinPath, sanitizeFilename } from './designFiles.js';

export const MANIFEST_NAME = 'hdlab.json';
// The backend accepts 32 files per simulation, one of them is the testbench
export const MAX_DESIGN_FILES = 31;

const isDesignSource = path => /\.s?v$/i.test(path);
const isTestbenchSource = path => /\.(sv|py)$/i.test(path);
// Typical testbench names besides tb.sv / tb.py
const TESTBENCH_NAME = /^(tb_|testbench)|(_tb|_test|_testbench)\.(sv|py)$/i;

/** Manifest written into exported ZIPs, so an import restores the same project. */
export function buildManifest(project) {
  const hasTestbench = project.testbenchEnabled && project.testbench.trim().length > 0;
  return {
    format: 'hdlab-project',
    version: 1,
    topFile: project.topFile,
    testbench: hasTestbench ? (project.testbenchLang === 'python' ? 'tb.py' : 'tb.sv') : null,
    wave: !!project.wave,
  };
}

/** Removes a folder all entries share (a zipped folder instead of its contents). */
function stripCommonRoot(entries) {
  const first = entries[0]?.path.split('/')[0];
  if (!first || entries.some(e => !e.path.startsWith(`${first}/`))) return entries;
  return entries.map(e => ({ ...e, path: e.path.slice(first.length + 1) }));
}

const sanitizePath = path => {
  const parts = path.split('/').filter(Boolean);
  const name = sanitizeFilename(parts.pop());
  return joinPath(parts.map(sanitizeFilename).join('/'), name);
};

function parseManifest(entry) {
  if (!entry) return null;
  try {
    const manifest = JSON.parse(entry.content);
    return manifest?.format === 'hdlab-project' ? manifest : null;
  } catch {
    return null;
  }
}

function pickTestbench(entries, manifest) {
  if (manifest) return manifest.testbench ? entries.find(e => e.path === manifest.testbench) ?? null : null;
  const byName = name => entries.filter(e => basename(e.path).toLowerCase() === name);
  const shallowestFirst = list => [...list].sort((a, b) => a.path.split('/').length - b.path.split('/').length);
  const exact = shallowestFirst([...byName('tb.sv'), ...byName('tb.py')]);
  if (exact.length > 0) return exact[0];
  const python = entries.filter(e => /\.py$/i.test(e.path));
  if (python.length === 1) return python[0];
  const named = entries.filter(e => isTestbenchSource(e.path) && TESTBENCH_NAME.test(basename(e.path)));
  return named.length === 1 ? named[0] : null;
}

/**
 * The file with the design's top module: main.sv if present, otherwise the file of the
 * module that nobody instantiates and that has the largest hierarchy below it.
 */
function guessTopFile(files) {
  if (files.some(f => f.path === 'main.sv')) return 'main.sv';
  const { modules } = analyzeDesign(files, null);
  const instantiated = new Set([...modules.values()].flatMap(mod => mod.instances.map(inst => inst.type)));
  const subtreeSize = (name, seen = new Set()) => {
    if (seen.has(name) || !modules.has(name)) return 0;
    seen.add(name);
    return 1 + modules.get(name).instances.reduce((sum, inst) => sum + subtreeSize(inst.type, seen), 0);
  };
  const roots = [...modules.keys()].filter(name => !instantiated.has(name));
  const best = roots.sort((a, b) => subtreeSize(b) - subtreeSize(a))[0];
  return best ? modules.get(best).path : files[0].path;
}

/**
 * @param {Array<{path: string, content: string}>} rawEntries - text files of the archive
 * @returns {{
 *   project: {files, folders, topFile, activeFile, testbench, testbenchLang, testbenchEnabled, wave?},
 *   report: { ignored: string[], renamed: Array<[string, string]>, topFromManifest: boolean, testbenchPath: string|null },
 * }}
 * @throws {Error} with message 'noDesignFiles' or 'tooManyFiles'
 */
export function importProject(rawEntries) {
  const entries = stripCommonRoot(
    rawEntries.filter(e => !e.path.startsWith('__MACOSX/') && !e.path.split('/').some(part => part.startsWith('.')))
  );
  const manifest = parseManifest(entries.find(e => e.path === MANIFEST_NAME));
  const testbenchEntry = pickTestbench(entries, manifest);

  const ignored = [];
  const renamed = [];
  const taken = new Set(RESERVED_FILENAMES);
  const pathMap = new Map(); // original path -> imported path
  const files = [];
  for (const entry of entries) {
    if (entry === testbenchEntry || entry.path === MANIFEST_NAME) continue;
    if (!isDesignSource(entry.path)) {
      ignored.push(entry.path);
      continue;
    }
    // File names must be unique across folders (the simulation gets all files flat)
    let path = sanitizePath(entry.path);
    const dot = basename(path).lastIndexOf('.');
    const stem = basename(path).slice(0, dot);
    const ext = basename(path).slice(dot).toLowerCase();
    let name = `${stem}${ext}`;
    for (let n = 2; taken.has(name); n++) name = `${stem}_${n}${ext}`;
    taken.add(name);
    path = joinPath(dirname(path), name);
    if (path !== entry.path) renamed.push([entry.path, path]);
    pathMap.set(entry.path, path);
    files.push({ path, content: entry.content });
  }

  if (files.length === 0) throw new Error('noDesignFiles');
  if (files.length > MAX_DESIGN_FILES) throw new Error('tooManyFiles');

  const manifestTop = manifest && pathMap.get(manifest.topFile);
  const topFile = manifestTop ?? guessTopFile(files);
  const isPython = !!testbenchEntry && /\.py$/i.test(testbenchEntry.path);

  return {
    project: {
      files,
      folders: allFolders(files, []),
      topFile,
      activeFile: topFile,
      testbench: testbenchEntry?.content ?? '',
      testbenchLang: isPython ? 'python' : 'systemverilog',
      testbenchEnabled: !!testbenchEntry,
      ...(manifest ? { wave: !!manifest.wave } : {}),
    },
    report: { ignored, renamed, topFromManifest: !!manifestTop, testbenchPath: testbenchEntry?.path ?? null },
  };
}

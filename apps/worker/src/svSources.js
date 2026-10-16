// Determines the order in which SystemVerilog sources are handed to Verilator/Yosys.
// A package has to be compiled before every file that uses it (`import pkg::*;` or
// `pkg::NAME`), so files are sorted by their package dependencies.
// Header files (.svh/.vh) are never compiled on their own; they are pulled in with
// `include, so their code counts as part of every file that includes them.

// Plain file names only: they end up in the temp dir and in space-separated env variables.
const SAFE_FILENAME = /^[A-Za-z0-9_][A-Za-z0-9_.-]*$/;

/** Verilog/SystemVerilog source (.sv or .v). */
export const isHdlSource = filename => filename.endsWith('.sv') || filename.endsWith('.v');

/** Verilog/SystemVerilog header (.svh or .vh), only used via `include. */
export const isHdlHeader = filename => filename.endsWith('.svh') || filename.endsWith('.vh');

const INCLUDE_RE = /(`include\s*")([^"\n]+)(")/g;
const pathBasename = path => path.slice(Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\')) + 1);

/**
 * Folders only exist in the editor: the simulation gets all files flat in one directory.
 * Rewrites `include "inc/defs.svh"` (or "../rtl/defs.svh") to `include "defs.svh"` if the
 * project has a file with that name, so includes written for the folder structure (or for
 * Vivado) still find their header. Line numbers don't change.
 * @param {Array<{filename: string, content: string}>} files
 * @returns {Array<{filename: string, content: string}>} new plain objects
 */
export function flattenIncludes(files) {
  const names = new Set(files.map(f => f.filename));
  return files.map(({ filename, content }) => {
    if (typeof content !== 'string' || !content.includes('`include')) return { filename, content };
    const flattened = content.replace(INCLUDE_RE, (match, open, target, close) => {
      const name = pathBasename(target);
      return name !== target && names.has(name) ? `${open}${name}${close}` : match;
    });
    return { filename, content: flattened };
  });
}

export function isSafeFilename(filename) {
  return typeof filename === 'string' && filename.length <= 128 && SAFE_FILENAME.test(filename);
}

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/.*$/gm, ' ');
}

/** Name of the first module declared in `src`, or null. */
export function firstModuleName(src) {
  if (typeof src !== 'string') return null;
  const match = stripComments(src).match(/\bmodule\s+([A-Za-z_][A-Za-z0-9_$]*)\b/);
  return match ? match[1] : null;
}

// Additional files first (alphabetical), then the top file of the design, then the testbench.
function baseRank(filename, topFile) {
  if (filename === 'tb.sv') return 2;
  if (filename === topFile) return 1;
  return 0;
}

/**
 * Sorts the .sv/.v files so that every package comes before the files that reference it.
 * Without dependencies the order is: additional files, top file, tb.sv.
 * Cyclic references can't be resolved; those files keep their base order.
 * @param {Array<{filename: string, content: string}>} files
 * @param {string} [topFile] - file holding the design's top module
 * @returns {{ sources: string[], packageFiles: Set<string> }} ordered file names and
 *   the files that declare at least one package
 */
export function orderSvSources(files, topFile = 'main.sv') {
  const byRank = (a, b) => baseRank(a, topFile) - baseRank(b, topFile) || a.localeCompare(b);
  const svFiles = files
    .filter(f => isHdlSource(f.filename))
    .sort((a, b) => byRank(a.filename, b.filename));
  // Code of each source with its included headers (recursively) inserted
  const headers = new Map(files.filter(f => isHdlHeader(f.filename)).map(f => [f.filename, stripComments(f.content || '')]));
  const withHeaders = (src, seen) => src.replace(INCLUDE_RE, (match, open, target) => {
    const name = pathBasename(target);
    if (!headers.has(name) || seen.has(name)) return ' ';
    seen.add(name);
    return ` ${withHeaders(headers.get(name), seen)} `;
  });
  const code = new Map(svFiles.map(f => [f.filename, withHeaders(stripComments(f.content || ''), new Set())]));

  // package name -> file declaring it (first declaration wins)
  const declaredIn = new Map();
  for (const { filename } of svFiles) {
    for (const m of code.get(filename).matchAll(/\bpackage\s+(?:(?:automatic|static)\s+)?([A-Za-z_][A-Za-z0-9_$]*)\s*;/g)) {
      if (!declaredIn.has(m[1])) declaredIn.set(m[1], filename);
    }
  }

  const deps = new Map();
  for (const { filename } of svFiles) {
    const used = new Set();
    for (const m of code.get(filename).matchAll(/\b([A-Za-z_][A-Za-z0-9_$]*)\s*::/g)) {
      const dep = declaredIn.get(m[1]);
      if (dep && dep !== filename) used.add(dep);
    }
    deps.set(filename, [...used].sort(byRank));
  }

  const sources = [];
  const visited = new Set();
  const visit = filename => {
    if (visited.has(filename)) return;
    visited.add(filename);
    deps.get(filename).forEach(visit);
    sources.push(filename);
  };
  svFiles.forEach(f => visit(f.filename));

  return { sources, packageFiles: new Set(declaredIn.values()) };
}

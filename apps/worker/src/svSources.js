// Determines the order in which SystemVerilog sources are handed to Verilator/Yosys.
// A package has to be compiled before every file that uses it (`import pkg::*;` or
// `pkg::NAME`), so files are sorted by their package dependencies.

// Plain file names only: they end up in the temp dir and in space-separated env variables.
const SAFE_FILENAME = /^[A-Za-z0-9_][A-Za-z0-9_.-]*$/;

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

// Additional files first (alphabetical), then the design, then the testbench.
function baseRank(filename) {
  if (filename === 'tb.sv') return 2;
  if (filename === 'main.sv') return 1;
  return 0;
}

/**
 * Sorts the .sv files so that every package comes before the files that reference it.
 * Without dependencies the order is: additional files, main.sv, tb.sv.
 * Cyclic references can't be resolved; those files keep their base order.
 * @param {Array<{filename: string, content: string}>} files
 * @returns {{ sources: string[], packageFiles: Set<string> }} ordered file names and
 *   the files that declare at least one package
 */
export function orderSvSources(files) {
  const svFiles = files
    .filter(f => f.filename.endsWith('.sv'))
    .sort((a, b) => baseRank(a.filename) - baseRank(b.filename) || a.filename.localeCompare(b.filename));
  const code = new Map(svFiles.map(f => [f.filename, stripComments(f.content || '')]));

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
    deps.set(filename, [...used].sort((a, b) => baseRank(a) - baseRank(b) || a.localeCompare(b)));
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

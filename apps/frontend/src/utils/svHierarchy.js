// Lightweight SystemVerilog scan for the design explorer: which modules and packages
// a file declares and which known modules each module instantiates. Heuristic (no real
// parser), but instantiations are only matched against module names declared in the
// project, which keeps false positives out.

const IDENT = '[A-Za-z_][A-Za-z0-9_$]*';

/** Removes comments and string literals, keeping the length of the text. */
function stripSv(src) {
  return src.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\\n])*"/g, m => m.replace(/[^\n]/g, ' '));
}

/**
 * @param {string} src
 * @returns {{ modules: Array<{name: string, body: string}>, packages: string[] }}
 */
export function parseSvFile(src) {
  const code = stripSv(src || '');
  const modules = [];
  const moduleRe = new RegExp(`\\b(?:module|macromodule)\\s+(?:(?:static|automatic)\\s+)?(${IDENT})`, 'g');
  let m;
  while ((m = moduleRe.exec(code))) {
    const start = m.index + m[0].length;
    const end = code.indexOf('endmodule', start);
    modules.push({ name: m[1], body: code.slice(start, end === -1 ? code.length : end) });
    if (end !== -1) moduleRe.lastIndex = end;
  }
  const packages = [...code.matchAll(new RegExp(`\\bpackage\\s+(?:(?:static|automatic)\\s+)?(${IDENT})\\s*;`, 'g'))]
    .map(p => p[1]);
  return { modules, packages };
}

function skipSpace(code, i) {
  while (i < code.length && /\s/.test(code[i])) i++;
  return i;
}

/** Index after the bracket group starting at code[i] (which must be `open`), or -1. */
function skipGroup(code, i, open, close) {
  let depth = 0;
  for (; i < code.length; i++) {
    if (code[i] === open) depth++;
    else if (code[i] === close && --depth === 0) return i + 1;
  }
  return -1;
}

/**
 * Instantiations of known modules in a module body:
 * `type [#(...)] instance_name [array] (` - e.g. `alu #(.W(8)) u_alu (...)`.
 */
export function findInstances(body, knownModules) {
  const instances = [];
  const tokenRe = new RegExp(`\\b(${IDENT})\\b`, 'g');
  const nameRe = new RegExp(`^${IDENT}`);
  let m;
  while ((m = tokenRe.exec(body))) {
    if (!knownModules.has(m[1])) continue;
    let i = skipSpace(body, m.index + m[0].length);
    if (body[i] === '#') {
      i = skipSpace(body, i + 1);
      if (body[i] !== '(') continue;
      i = skipGroup(body, i, '(', ')');
      if (i === -1) continue;
      i = skipSpace(body, i);
    }
    const name = body.slice(i).match(nameRe);
    if (!name) continue;
    i = skipSpace(body, i + name[0].length);
    while (body[i] === '[') {
      i = skipGroup(body, i, '[', ']');
      if (i === -1) break;
      i = skipSpace(body, i);
    }
    if (body[i] !== '(') continue;
    instances.push({ type: m[1], name: name[0] });
    tokenRe.lastIndex = i;
  }
  return instances;
}

/**
 * Analyzes all design files.
 * @param {Array<{path: string, content: string}>} files
 * @param {string} topFile - path of the file holding the top module
 * @returns {{
 *   fileInfo: Map<string, {modules: string[], packages: string[]}>,
 *   modules: Map<string, {path: string, instances: Array<{type: string, name: string}>}>,
 *   packages: Array<{name: string, path: string}>,
 *   topModule: string | null,
 * }}
 */
export function analyzeDesign(files, topFile) {
  const parsed = files.map(f => ({ path: f.path, ...parseSvFile(f.content) }));
  const known = new Set(parsed.flatMap(p => p.modules.map(mod => mod.name)));

  const fileInfo = new Map();
  const modules = new Map();
  const packages = [];
  for (const p of parsed) {
    fileInfo.set(p.path, { modules: p.modules.map(mod => mod.name), packages: p.packages });
    p.packages.forEach(name => packages.push({ name, path: p.path }));
    for (const mod of p.modules) {
      // First declaration wins; a duplicate is a compile error the simulation reports anyway
      if (!modules.has(mod.name)) modules.set(mod.name, { path: p.path, instances: findInstances(mod.body, known) });
    }
  }

  // Top: the first module of the top file that no other module instantiates
  const instantiated = new Set([...modules.values()].flatMap(mod => mod.instances.map(inst => inst.type)));
  const topCandidates = fileInfo.get(topFile)?.modules ?? [];
  const topModule = topCandidates.find(name => !instantiated.has(name)) ?? topCandidates[0] ?? null;

  return { fileInfo, modules, packages, topModule };
}

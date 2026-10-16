#!/usr/bin/env node
// Lasttest: N virtuelle Studierende starten eine Board-Synthese (Basys3) oder eine normale
// Simulation über die echte API - so wie der Editor: Projekt anlegen, Auftrag starten,
// jede Sekunde den Status abfragen, bei "board" die Netlist laden.
// Gemessen wird pro Studierendem die Wartezeit vom Klick bis zum Ergebnis; aus den
// Zeitstempeln des Servers kommen Wartezeit in der Queue und Verarbeitung im Worker.
// Die Board-Simulation selbst läuft danach im Browser und erzeugt keine Serverlast.
//
// Aufruf (Node 18+):
//   node apps/backend/scripts/loadtest.mjs --url http://localhost:8080 --user NAME --password PW \
//     --students 30 --mode board --design main.sv,weitere.sv,defs.svh [--top modul] [--spread 10]
//
//   --mode     board (Default) oder sim (normale Simulation mit Verilator, ohne Testbench)
//   --design   Design-Dateien, kommagetrennt; die erste ist die Top-Datei
//   --top      Top-Modul (Default: erstes Modul der Top-Datei)
//   --spread   Starts zufällig über so viele Sekunden verteilen (Default 0: alle gleichzeitig)
//   Statt --user/--password geht auch die Umgebungsvariable HDLAB_TOKEN (JWT).
//
// Alle Aufträge laufen unter einem Konto und legen je ein Projekt "HDLab-Lasttest" an.

import { readFileSync } from 'fs';
import { basename } from 'path';

const POLL_MS = 1000; // like the editor
const TIMEOUT_MS = 5 * 60 * 1000;
const PROJECT_NAME = 'HDLab-Lasttest';

function parseArgs(argv) {
  const args = { students: 10, mode: 'board', spread: 0 };
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, '');
    if (argv[i + 1] === undefined) throw new Error(`Wert für --${key} fehlt`);
    args[key] = argv[i + 1];
  }
  for (const key of ['url', 'design']) if (!args[key]) throw new Error(`--${key} fehlt`);
  if (!['board', 'sim'].includes(args.mode)) throw new Error('--mode muss board oder sim sein');
  args.students = Number(args.students);
  args.spread = Number(args.spread);
  args.url = args.url.replace(/\/$/, '');
  return args;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const firstModule = src => src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/.*$/gm, ' ')
  .match(/\bmodule\s+([A-Za-z_][A-Za-z0-9_$]*)/)?.[1];

function stats(values) {
  const v = [...values].sort((a, b) => a - b);
  if (v.length === 0) return null;
  const at = q => v[Math.min(v.length - 1, Math.floor(q * v.length))];
  return { min: v[0], median: at(0.5), p95: at(0.95), max: v[v.length - 1] };
}
const s = ms => `${(ms / 1000).toFixed(1)} s`;
const line = st => (st ? `min ${s(st.min)} · Median ${s(st.median)} · 95 % ${s(st.p95)} · max ${s(st.max)}` : '–');

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const api = `${args.url}/api`;

  let token = process.env.HDLAB_TOKEN;
  if (!token) {
    if (!args.user || !args.password) throw new Error('--user und --password oder HDLAB_TOKEN angeben');
    const res = await fetch(`${api}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: args.user, password: args.password }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.token) throw new Error(`Login fehlgeschlagen: ${body.error || res.status}`);
    token = body.token;
  }

  const paths = args.design.split(',').map(p => p.trim()).filter(Boolean);
  const files = paths.map(p => ({ filename: basename(p), content: readFileSync(p, 'utf8'), language: 'systemverilog' }));
  const topFile = files[0].filename;
  const topModule = args.top || firstModule(files[0].content) || 'main';

  let requests = 0;
  let downloaded = 0;
  const call = async (path, options = {}) => {
    requests++;
    return fetch(`${api}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
  };
  const json = async res => {
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return body;
  };

  async function student() {
    await sleep(Math.random() * args.spread * 1000);
    const t0 = performance.now();
    const project = await json(await call('/projects', {
      method: 'POST',
      body: JSON.stringify({ name: PROJECT_NAME, files }),
    }));
    const settings = args.mode === 'board'
      ? { mode: 'board', topFile }
      : { generateWave: false, generateNetlist: true, topFile };
    const sim = await json(await call('/simulations', {
      method: 'POST',
      body: JSON.stringify({ projectId: project._id, language: 'systemverilog', testbenchType: null, topModule, settings }),
    }));
    let result = null;
    while (performance.now() - t0 < TIMEOUT_MS) {
      await sleep(POLL_MS);
      const res = await call(`/simulations/${sim._id}/results`);
      if (!res.ok) continue;
      result = await res.json();
      if (result.status === 'finished' || result.status === 'error') break;
    }
    if (result?.status !== 'finished') {
      throw new Error(result ? `Status ${result.status}: ${String(result.log || '').split('\n')[0]}` : 'Zeitüberschreitung');
    }
    if (args.mode === 'board') {
      const res = await call(`/simulations/${sim._id}/board`);
      if (!res.ok) throw new Error(`Netlist: HTTP ${res.status}`);
      downloaded += (await res.text()).length;
    }
    const waitMs = performance.now() - t0;
    // Server-side timestamps (not part of what the editor does)
    const doc = await (await fetch(`${api}/simulations/${sim._id}`, { headers: { Authorization: `Bearer ${token}` } })).json();
    const created = Date.parse(doc.createdAt);
    const started = Date.parse(doc.startedAt);
    const finished = Date.parse(doc.finishedAt);
    return { waitMs, queueMs: started - created, workMs: finished - started };
  }

  console.log(`${args.students} Studierende, Modus ${args.mode}, Top ${topModule} (${topFile}), `
    + `${args.spread ? `Starts über ${args.spread} s verteilt` : 'alle gleichzeitig'}, Ziel ${args.url}`);
  const t0 = performance.now();
  const results = await Promise.allSettled(Array.from({ length: args.students }, () => student()));
  const totalMs = performance.now() - t0;

  const ok = results.filter(r => r.status === 'fulfilled').map(r => r.value);
  const failed = results.filter(r => r.status === 'rejected');
  console.log(`\nErfolgreich: ${ok.length}/${results.length}`);
  const errors = new Map();
  failed.forEach(r => errors.set(r.reason?.message, (errors.get(r.reason?.message) || 0) + 1));
  for (const [message, n] of errors) console.log(`  Fehler (${n}×): ${message}`);
  console.log(`Wartezeit bis Ergebnis:   ${line(stats(ok.map(r => r.waitMs)))}`);
  console.log(`  davon in der Queue:     ${line(stats(ok.map(r => r.queueMs)))}`);
  console.log(`  Verarbeitung (Worker):  ${line(stats(ok.map(r => r.workMs)))}`);
  console.log(`  (Der Editor fragt jede Sekunde nach, daher mindestens ~1 s Wartezeit.)`);
  console.log(`Gesamtdauer ${s(totalMs)}, Durchsatz ${(ok.length / (totalMs / 1000)).toFixed(1)} Aufträge/s, `
    + `${requests} HTTP-Anfragen${args.mode === 'board' ? `, Netlists ${(downloaded / 1024).toFixed(0)} KB` : ''}`);
  console.log(`
Aufräumen (löscht alle Lasttest-Projekte samt Simulationen und Ergebnissen):
  docker compose exec mongo mongo hdlab --quiet --eval '
    const ids = db.projects.find({ name: "${PROJECT_NAME}" }).map(p => p._id);
    const sims = db.simulations.find({ projectId: { $in: ids } }).map(x => x._id);
    ["boardnetlists", "netlists", "waveforms"].forEach(c => db.getCollection(c).deleteMany({ simulationId: { $in: sims } }));
    db.simulations.deleteMany({ _id: { $in: sims } });
    print(db.projects.deleteMany({ _id: { $in: ids } }).deletedCount + " Projekte gelöscht");'`);
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});

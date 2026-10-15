<!-- DEUTSCH / GERMAN -->
# Integrations-Guide: Tutorial-System

> Wie das Tutorial-System (Markdown-Parser + Komponenten) in die App eingebunden ist. Stand: Oktober 2026.

## Wo es eingebunden ist

`TutorialContainer` wird direkt aus `App.jsx` gerendert - einmal für das Verilog-Tutorial und einmal für den aktiven Kurs aus dem Lehre-Menü. Welche Seite angezeigt wird, kommt aus der URL: `src/hooks/useRoute.js` liest `window.location.pathname` und liefert `{ page, courseId, lesson }` (ohne Router-Bibliothek, über `history.pushState`/`replaceState` und `popstate`).

`TutorialContainer` braucht einen umgebenden `AuthProvider`, da `TutorialContainer`, `TutorialLesson` und `ModuleLibrary` intern `useAuth()` (JWT-Token, `apiCall()`, `hasRole()`) nutzen - der `AuthProvider` wrapt in der echten App `<App />` in `main.jsx`:

```jsx
// main.jsx (tatsächliche Einbindung)
import { AuthProvider } from './contexts/AuthContext.jsx';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider apiBase={API_BASE}>
    <App />
  </AuthProvider>
);

// App.jsx (vereinfacht)
import TutorialContainer from './components/TutorialContainer';
import useRoute, { TUTORIAL_PATH, coursePath } from './hooks/useRoute';
import { getCourse } from './config/courses';

function App() {
  const [{ page: currentPage, courseId: activeCourseId, lesson: routeLesson }, navigate] = useRoute();

  // Lektion in die URL schreiben (replace: ohne zusätzlichen Verlaufseintrag)
  const handleLessonNavigate = (lesson, options) => {
    const base = currentPage === 'course' ? coursePath(activeCourseId) : TUTORIAL_PATH;
    navigate(`${base}/${lesson}`, options);
  };

  return (
    <>
      {currentPage === 'tutorial' && (
        <TutorialContainer
          tutorialPath="/Tutorial/VerilogTutorialFormatted.md"
          routeLesson={routeLesson}
          onNavigate={handleLessonNavigate}
          uiLanguage={uiLanguage}
          editorTheme={editorTheme}
          onModuleSaved={handleModuleLibraryRefresh}
          onRegisterInsert={(fn) => { tutorialInsertRef.current = fn; }}
          navOpen={sidebarOpen}
          onCloseNav={() => setSidebarOpen(false)}
        />
      )}

      {/* key erzwingt Neuladen beim Kurswechsel */}
      {currentPage === 'course' && getCourse(activeCourseId) && (
        <TutorialContainer
          key={activeCourseId}
          courseId={activeCourseId}
          tutorialPath={getCourse(activeCourseId).tutorialPath}
          title={getCourse(activeCourseId).title[uiLanguage]}
          subtitle={getCourse(activeCourseId).subtitle[uiLanguage]}
          routeLesson={routeLesson}
          onNavigate={handleLessonNavigate}
          /* ... restliche Props wie oben ... */
        />
      )}
    </>
  );
}
```

### URLs

| URL | `route` |
|---|---|
| `/Editor` | `{ page: 'home' }` |
| `/Tutorial`, `/Tutorial/<lesson_id>`, `/Tutorial/Uebersicht` | `{ page: 'tutorial', lesson }` |
| `/Lehre/<id>`, `/Lehre/<id>/<lesson_id>`, `/Lehre/<id>/Uebersicht` | `{ page: 'course', courseId, lesson }` |

`lesson` ist die `lesson_id` als String, `'Uebersicht'` (`OVERVIEW`) oder `null`. Groß-/Kleinschreibung ist egal; `/`, unbekannte Pfade und unbekannte Kurs-IDs werden ohne Verlaufseintrag auf `/Editor` umgeschrieben. Ist `lesson` `null` oder keine gültige Lektion, ruft `TutorialContainer` `onNavigate(<zuletzt besuchte oder erste Lektion>, { replace: true })` auf.

## Voraussetzung: Datei-Ablageort

Der Parser lädt die Markdown-Datei per `fetch()` - das funktioniert **nur** für Dateien im `public/`-Ordner von Vite:

```
apps/frontend/public/Tutorial/VerilogTutorialFormatted.md
apps/frontend/public/Kurse/<Ordner>/<Datei>.md
```

Bilder liegen daneben in `images/` und werden im Markdown absolut referenziert (`/Tutorial/images/...`, `/Kurse/ES1/images/...`); die Sync-Workflows schreiben relative `./images/`-Pfade entsprechend um. Ein `vite build` kopiert `public/` nach `dist/` - Änderungen gehören nach `public/` bzw. ins Quell-Repo des Inhalts (siehe `TUTORIAL_DEVELOPER_GUIDE.md`).

## Neuen Kurs einbinden

1. Markdown + `images/` unter `apps/frontend/public/Kurse/<Ordner>/` ablegen
2. Eintrag in `apps/frontend/src/config/courses.js` ergänzen:

```js
{
  id: 'es2',                 // URL /Lehre/es2 und courseId im Backend - später nicht mehr ändern
  shortTitle: 'ES2',
  title: { de: 'ES2 – ...', en: 'ES2 – ...' },
  subtitle: { de: 'Kursmaterial zur Lehrveranstaltung', en: 'Course material for the lecture' },
  tutorialPath: '/Kurse/ES2/ES2Tutorial.md',
},
```

Der Kurs erscheint danach automatisch im Lehre-Menü, ist unter `/Lehre/<id>` erreichbar und speichert seinen Fortschritt getrennt (`?course=<id>`). Die `id` muss `^[a-z0-9_-]{1,32}$` erfüllen, sonst lehnt das Backend den Fortschritt ab.

## Relevante Dateien im Überblick

```
TutorialContainer.jsx    - Lädt Markdown, leitet Ansicht/Lektion aus der URL ab, Lektionsbaum + Overview/Lesson,
                           merkt die letzte Lektion (localStorage hdlab-tutorial-last-lesson-<courseId|verilog>)
LessonNav.jsx            - Lektionsbaum links (Kapitel, Haken, Fortschrittszähler, Link zur Übersicht)
TutorialOverview.jsx     - 3 Ansichten: Kapitel (Standard) / Schwierigkeit / Typ
TutorialLesson.jsx       - Erklärung, Tipps, Editor, Testbench, Validierung, Reset, Passwort-Lösung, Dock
BottomDock.jsx           - Dock mit Ausgabe / Waveform / Netlist
WaveformViewer.jsx, NetlistViewer.jsx, hooks/useSimArtifacts.js - Waveform und Schaltplan der Validierung
Tutorial.css, Workbench.css - Styling
tutorialParser.js        - parseFrontmatter(), extractBetween()/extractAllBetween(), parseLesson(),
                           slugify(), buildAnchorMap(), groupByChapter()/getChapterKey(),
                           groupByDifficulty(), groupByType(), parseTutorialFromMarkdown(), parseTutorialFromFile()
tutorialLoader.js        - Hook-Beispiel useTutorial() (Referenzimplementierung, wird von
                           TutorialContainer.jsx nicht direkt verwendet)
hooks/useRoute.js        - URL <-> Seite/Kurs/Lektion
config/courses.js        - Kursliste für das Lehre-Menü
```

## Backend-Abhängigkeiten

- **Validierung:** `TutorialLesson.jsx` sendet `{ lessonId, moduleCode, testbench }` an **`POST /api/tutorial/validate`** (authentifiziert). Antwort: `{ success, errors?, fullLog, simulationId, hasWaveform, hasNetlist }`. Über `simulationId` lädt `useSimArtifacts` danach `GET /api/simulations/:id/waveform` und `/netlist` für das Dock. Implementierung siehe `apps/backend/src/routes/tutorial.js` bzw. Backend-README Abschnitt 8.5
- **Fortschritt:** `GET/POST /api/tutorial/progress/:lessonId` und `GET /api/tutorial/progress` (für die Haken im Lektionsbaum), in Kursen jeweils mit `?course=<courseId>`
- **Modul-Bibliothek:** `POST /api/modules` speichert gelöste Übungen automatisch

## Konfigurierbare Props

```jsx
<TutorialContainer
  tutorialPath="/Tutorial/VerilogTutorialFormatted.md"  // Pfad relativ zu public/
  courseId={null}                                        // null = Verilog-Tutorial, sonst id aus config/courses.js
  title="..." subtitle="..."                             // optional, Kopf der Übersicht (Default "Verilog Tutorial")
  routeLesson="7"                                        // aus useRoute: lesson_id als String, 'Uebersicht' oder null
  onNavigate={(lesson, { replace }) => {}}               // schreibt die Lektion in die URL
  uiLanguage="de"                                        // 'de' oder 'en'
  editorTheme="vs-light"                                 // Monaco-Theme, 'vs-light' | 'vs-dark'
  onModuleSaved={fn}                                     // Callback nach Auto-Save eines Moduls
  onRegisterInsert={fn}                                  // Registriert Insert-Handler für die Modul-Bibliothek
  navOpen={false} onCloseNav={fn}                        // Lektionsbaum als Drawer auf schmalen Bildschirmen
/>
```

## Debugging & Logging

Der Parser gibt Console-Logs aus:

```
[TutorialContainer] Loading tutorial from: /Tutorial/VerilogTutorialFormatted.md
[Tutorial] Parsing Markdown tutorial...
[Tutorial] Gefundene Lektionsblöcke: 88
[Tutorial] ✓ Lektion 1: "Vorwort" (theory)
...
[Tutorial] Erfolgreich 88 Lektionen geladen
```

Bei Fehlern: Browser DevTools (F12) → Konsole → nach `[Tutorial]`-Zeilen suchen.

## Häufige Probleme & Lösungen

**"Fehler beim Laden des Tutorials" / `Failed to fetch`**
- Liegt die Datei unter `apps/frontend/public/...` und ist sie direkt im Browser erreichbar (z.B. `/Kurse/ES1/ES1Tutorial.md`)?
- `tutorialPath` in `config/courses.js` bzw. in `App.jsx` korrekt?
- Nach Inhalts-Syncs auf dem Server: das Frontend-Image muss neu gebaut sein (macht der Deploy-Job der Sync-Workflows)

**Kurs-URL landet im Editor**
- Die `id` in der URL passt zu keinem Eintrag in `config/courses.js`

**"Keine Lektionen gefunden" / 0 Lektionsblöcke**
- Jede Lektion braucht einen `<!-- ... -->`-Block, der die Zeile `lesson_id:` enthält - ohne diese Zeile wird der Block ignoriert
- Der Inhalt einer Lektion endet beim nächsten `---`-Trenner **oder** dem nächsten `<!--` - fehlt beides, werden mehrere Lektionen fälschlich zusammengefasst

**"Lesson undefined" in der Konsole**
- `lesson_id` ist nicht numerisch oder nicht eindeutig
- Format des Frontmatter-Blocks abweichend (z.B. fehlende Anführungszeichen bei `lesson_title`)

**Editor zeigt keinen Code**
- `type: "exercise"` fehlt im Frontmatter
- `**EXERCISE_START**`/`**EXERCISE_END**`-Marker fehlerhaft oder Code-Block nutzt nicht ```` ```verilog ````

**Tipps erscheinen im Lektionstext statt hinter dem Button**
- Marker müssen exakt `**HINT_START**` und `**HINT_END**` lauten (fett, Großbuchstaben)

**Lösung wird nicht angezeigt**
- `**SOLUTION_START**`/`**SOLUTION_END**`-Marker fehlerhaft
- Falsches Passwort im Dialog (siehe `VITE_TUTORIAL_SOLUTION_PASSWORD`)

**Testbench-Validierung schlägt immer fehl**
- `test_solved` in der Testbench muss ein **unpacked Array** sein (`output logic test_solved [TEST_LENGTH]`), kein einzelner Vektor - siehe `TUTORIAL_DEVELOPER_GUIDE.md`

**Netlist-Reiter bleibt leer**
- Yosys konnte `main.sv` nicht verarbeiten (die Simulation läuft trotzdem). Die Yosys-Meldung steht nicht im Simulationslog, sondern im Worker-Log (`docker compose logs worker`, Zeile `[Entrypoint] Netlist konnte nicht erzeugt werden`)

---

# English Documentation

> How the tutorial system (markdown parser + components) is wired into the app. As of October 2026.

## Where it's wired up

`TutorialContainer` is rendered directly from `App.jsx` - once for the Verilog tutorial and once for the active course from the "Lehre" menu. Which page is shown comes from the URL: `src/hooks/useRoute.js` reads `window.location.pathname` and returns `{ page, courseId, lesson }` (no router library, via `history.pushState`/`replaceState` and `popstate`).

`TutorialContainer` needs a surrounding `AuthProvider`, since `TutorialContainer`, `TutorialLesson` and `ModuleLibrary` use `useAuth()` internally (JWT token, `apiCall()`, `hasRole()`) - in the real app, `AuthProvider` wraps `<App />` in `main.jsx`:

```jsx
// main.jsx (actual wiring)
import { AuthProvider } from './contexts/AuthContext.jsx';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider apiBase={API_BASE}>
    <App />
  </AuthProvider>
);

// App.jsx (simplified)
import TutorialContainer from './components/TutorialContainer';
import useRoute, { TUTORIAL_PATH, coursePath } from './hooks/useRoute';
import { getCourse } from './config/courses';

function App() {
  const [{ page: currentPage, courseId: activeCourseId, lesson: routeLesson }, navigate] = useRoute();

  // Write the lesson into the URL (replace: no extra history entry)
  const handleLessonNavigate = (lesson, options) => {
    const base = currentPage === 'course' ? coursePath(activeCourseId) : TUTORIAL_PATH;
    navigate(`${base}/${lesson}`, options);
  };

  return (
    <>
      {currentPage === 'tutorial' && (
        <TutorialContainer
          tutorialPath="/Tutorial/VerilogTutorialFormatted.md"
          routeLesson={routeLesson}
          onNavigate={handleLessonNavigate}
          uiLanguage={uiLanguage}
          editorTheme={editorTheme}
          onModuleSaved={handleModuleLibraryRefresh}
          onRegisterInsert={(fn) => { tutorialInsertRef.current = fn; }}
          navOpen={sidebarOpen}
          onCloseNav={() => setSidebarOpen(false)}
        />
      )}

      {/* key forces a reload when switching courses */}
      {currentPage === 'course' && getCourse(activeCourseId) && (
        <TutorialContainer
          key={activeCourseId}
          courseId={activeCourseId}
          tutorialPath={getCourse(activeCourseId).tutorialPath}
          title={getCourse(activeCourseId).title[uiLanguage]}
          subtitle={getCourse(activeCourseId).subtitle[uiLanguage]}
          routeLesson={routeLesson}
          onNavigate={handleLessonNavigate}
          /* ... remaining props as above ... */
        />
      )}
    </>
  );
}
```

### URLs

| URL | `route` |
|---|---|
| `/Editor` | `{ page: 'home' }` |
| `/Tutorial`, `/Tutorial/<lesson_id>`, `/Tutorial/Uebersicht` | `{ page: 'tutorial', lesson }` |
| `/Lehre/<id>`, `/Lehre/<id>/<lesson_id>`, `/Lehre/<id>/Uebersicht` | `{ page: 'course', courseId, lesson }` |

`lesson` is the `lesson_id` as a string, `'Uebersicht'` (`OVERVIEW`) or `null`. Case doesn't matter; `/`, unknown paths and unknown course ids are rewritten to `/Editor` without a history entry. If `lesson` is `null` or not a valid lesson, `TutorialContainer` calls `onNavigate(<last visited or first lesson>, { replace: true })`.

## Prerequisite: File Location

The parser loads the markdown file via `fetch()` - this only works for files inside Vite's `public/` folder:

```
apps/frontend/public/Tutorial/VerilogTutorialFormatted.md
apps/frontend/public/Kurse/<folder>/<file>.md
```

Images live next to it in `images/` and are referenced with absolute paths in the markdown (`/Tutorial/images/...`, `/Kurse/ES1/images/...`); the sync workflows rewrite relative `./images/` paths accordingly. `vite build` copies `public/` to `dist/` - changes belong in `public/` or in the content's source repo (see `TUTORIAL_DEVELOPER_GUIDE.md`).

## Adding a New Course

1. Put the markdown + `images/` under `apps/frontend/public/Kurse/<folder>/`
2. Add an entry to `apps/frontend/src/config/courses.js`:

```js
{
  id: 'es2',                 // URL /Lehre/es2 and courseId in the backend - don't change it later
  shortTitle: 'ES2',
  title: { de: 'ES2 – ...', en: 'ES2 – ...' },
  subtitle: { de: 'Kursmaterial zur Lehrveranstaltung', en: 'Course material for the lecture' },
  tutorialPath: '/Kurse/ES2/ES2Tutorial.md',
},
```

The course then shows up in the "Lehre" menu automatically, is reachable at `/Lehre/<id>` and stores its progress separately (`?course=<id>`). The `id` must match `^[a-z0-9_-]{1,32}$`, otherwise the backend rejects the progress.

## Relevant Files at a Glance

```
TutorialContainer.jsx    - Loads markdown, derives view/lesson from the URL, lesson tree + overview/lesson,
                           remembers the last lesson (localStorage hdlab-tutorial-last-lesson-<courseId|verilog>)
LessonNav.jsx            - Lesson tree on the left (chapters, check marks, progress counter, link to overview)
TutorialOverview.jsx     - 3 views: chapter (default) / difficulty / type
TutorialLesson.jsx       - Explanation, hints, editor, testbench, validation, reset, password-gated solution, dock
BottomDock.jsx           - Dock with output / waveform / netlist
WaveformViewer.jsx, NetlistViewer.jsx, hooks/useSimArtifacts.js - waveform and schematic of the validation run
Tutorial.css, Workbench.css - Styling
tutorialParser.js        - parseFrontmatter(), extractBetween()/extractAllBetween(), parseLesson(),
                           slugify(), buildAnchorMap(), groupByChapter()/getChapterKey(),
                           groupByDifficulty(), groupByType(), parseTutorialFromMarkdown(), parseTutorialFromFile()
tutorialLoader.js        - Example hook useTutorial() (reference implementation, not directly
                           used by TutorialContainer.jsx)
hooks/useRoute.js        - URL <-> page/course/lesson
config/courses.js        - Course list for the "Lehre" menu
```

## Backend Dependencies

- **Validation:** `TutorialLesson.jsx` sends `{ lessonId, moduleCode, testbench }` to **`POST /api/tutorial/validate`** (authenticated). Response: `{ success, errors?, fullLog, simulationId, hasWaveform, hasNetlist }`. Using `simulationId`, `useSimArtifacts` then loads `GET /api/simulations/:id/waveform` and `/netlist` for the dock. See `apps/backend/src/routes/tutorial.js` / backend README section 8.5
- **Progress:** `GET/POST /api/tutorial/progress/:lessonId` and `GET /api/tutorial/progress` (for the check marks in the lesson tree), with `?course=<courseId>` in courses
- **Module library:** `POST /api/modules` saves solved exercises automatically

## Configurable Props

```jsx
<TutorialContainer
  tutorialPath="/Tutorial/VerilogTutorialFormatted.md"  // path relative to public/
  courseId={null}                                        // null = Verilog tutorial, otherwise id from config/courses.js
  title="..." subtitle="..."                             // optional, overview header (default "Verilog Tutorial")
  routeLesson="7"                                        // from useRoute: lesson_id as string, 'Uebersicht' or null
  onNavigate={(lesson, { replace }) => {}}               // writes the lesson into the URL
  uiLanguage="de"                                        // 'de' or 'en'
  editorTheme="vs-light"                                 // Monaco theme, 'vs-light' | 'vs-dark'
  onModuleSaved={fn}                                     // callback after auto-saving a module
  onRegisterInsert={fn}                                  // registers an insert handler for the module library
  navOpen={false} onCloseNav={fn}                        // lesson tree as a drawer on narrow screens
/>
```

## Debugging & Logging

The parser logs to the console:

```
[TutorialContainer] Loading tutorial from: /Tutorial/VerilogTutorialFormatted.md
[Tutorial] Parsing Markdown tutorial...
[Tutorial] Gefundene Lektionsblöcke: 88
[Tutorial] ✓ Lektion 1: "Vorwort" (theory)
...
[Tutorial] Erfolgreich 88 Lektionen geladen
```

On errors: browser DevTools (F12) → console → search for `[Tutorial]` lines.

## Common Issues & Solutions

**"Error loading tutorial" / `Failed to fetch`**
- Is the file under `apps/frontend/public/...` and reachable directly in the browser (e.g. `/Kurse/ES1/ES1Tutorial.md`)?
- Is `tutorialPath` correct in `config/courses.js` or `App.jsx`?
- After content syncs on the server: the frontend image must be rebuilt (done by the deploy job of the sync workflows)

**Course URL ends up in the editor**
- The `id` in the URL doesn't match any entry in `config/courses.js`

**"No lessons found" / 0 lesson blocks**
- Every lesson needs a `<!-- ... -->` block containing the line `lesson_id:` - without that line the block is ignored
- A lesson's content ends at the next `---` separator **or** the next `<!--` - if neither is present, multiple lessons get merged incorrectly

**"Lesson undefined" in the console**
- `lesson_id` is not numeric or not unique
- Frontmatter block format differs (e.g. missing quotes around `lesson_title`)

**Editor shows no code**
- `type: "exercise"` is missing from the frontmatter
- `**EXERCISE_START**`/`**EXERCISE_END**` markers are malformed, or the code block doesn't use ```` ```verilog ````

**Hints show up in the lesson text instead of behind the button**
- The markers must be exactly `**HINT_START**` and `**HINT_END**` (bold, uppercase)

**Solution is not shown**
- `**SOLUTION_START**`/`**SOLUTION_END**` markers are malformed
- Wrong password in the dialog (see `VITE_TUTORIAL_SOLUTION_PASSWORD`)

**Testbench validation always fails**
- `test_solved` in the testbench must be an **unpacked array** (`output logic test_solved [TEST_LENGTH]`), not a single vector - see `TUTORIAL_DEVELOPER_GUIDE.md`

**Netlist tab stays empty**
- Yosys couldn't process `main.sv` (the simulation still runs). The Yosys message is not in the simulation log but in the worker log (`docker compose logs worker`, line `[Entrypoint] Netlist konnte nicht erzeugt werden`)

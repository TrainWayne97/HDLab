<!-- DEUTSCH / GERMAN -->
# Integrations-Guide: Tutorial-System

> Wie das Tutorial-System (Markdown-Parser + Komponenten) in die bestehende App eingebunden ist bzw. eingebunden werden kann. Stand: Juli 2026.

## Wo es bereits eingebunden ist

`TutorialContainer` wird aktuell direkt aus `App.jsx` gerendert (kein React Router im Projekt, Umschaltung über einen einfachen `currentPage`-State). Es braucht zwingend einen umgebenden `AuthProvider`, da `TutorialLesson` und `ModuleLibrary` intern `useAuth()` (JWT-Token, `apiCall()`, `hasRole()`) nutzen - der `AuthProvider` wrapt in der echten App bereits `<App />` selbst in `main.jsx`, nicht `App.jsx` intern:

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

function App() {
  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'tutorial'

  return (
    <>
      {currentPage === 'tutorial' && (
        <TutorialContainer
          tutorialPath="/Tutorial/VerilogTutorialFormatted.md"
          uiLanguage={uiLanguage}
          editorTheme={editorTheme}
          onModuleSaved={handleModuleLibraryRefresh}
          onRegisterInsert={(fn) => { tutorialInsertRef.current = fn; }}
        />
      )}
    </>
  );
}
```

### Falls stattdessen React Router genutzt werden soll

```jsx
import { Routes, Route } from 'react-router-dom';
import TutorialContainer from './components/TutorialContainer';

<Routes>
  <Route path="/tutorial" element={
    <TutorialContainer
      tutorialPath="/Tutorial/VerilogTutorialFormatted.md"
      uiLanguage="de"
      editorTheme="vs-light"
    />
  } />
</Routes>
```

## Voraussetzung: Datei-Ablageort

Der Parser lädt die Markdown-Datei per `fetch()` - das funktioniert **nur** für Dateien im `public/`-Ordner von Vite:

```
apps/frontend/public/Tutorial/VerilogTutorialFormatted.md
```

Eine Kopie liegt zusätzlich unter `apps/frontend/dist/Tutorial/` (Build-Output, wird beim `vite build` automatisch aus `public/` generiert - dort **nicht** manuell bearbeiten, Änderungen gehören nach `public/`).

## Relevante Dateien im Überblick

```
TutorialContainer.jsx    - Lädt Markdown, hält currentLessonId-State, wechselt Overview/Lesson
TutorialOverview.jsx     - 3 Ansichten: Kapitel (Standard) / Schwierigkeit / Typ
TutorialLesson.jsx       - Erklärung, Editor, Testbench, Validierung, Reset, Passwort-Lösung
Tutorial.css             - Styling für alle drei Komponenten
tutorialParser.js        - parseFrontmatter(), extractBetween(), parseLesson(),
                           parseTutorialFromMarkdown(), parseTutorialFromFile(),
                           groupByChapter()/getChapterKey(), groupByDifficulty(), groupByType()
tutorialLoader.js        - Hook-Beispiel useTutorial() (Referenzimplementierung, wird von
                           TutorialContainer.jsx nicht direkt verwendet)
```

## Backend-Abhängigkeit: Code-Validierung

`TutorialLesson.jsx` sendet Validierungsanfragen an **`POST /api/tutorial/validate`** (Singular, authentifiziert - nicht das ältere, unbenutzte `/api/tutorials/validate` in `routes.js`). Body: `{ lessonId, moduleCode, testbench }`, Antwort: `{ success: boolean, errors?: string }`. Implementierung siehe `apps/backend/src/routes/tutorial.js` bzw. Backend-README Abschnitt 8.5.

Falls ein Backend diesen Endpoint (noch) nicht unterstützt:
1. Den "Lösung einreichen"-Button im UI ausblenden/deaktivieren (`lesson.type === 'exercise'`-Bedingung in `TutorialLesson.jsx` anpassen), oder
2. Den Endpoint serverseitig implementieren (echte Simulation wie im aktuellen Backend, oder vereinfacht nur `{success: true}` zurückgeben für reine UI-Demos)

## Konfigurierbare Props

```jsx
<TutorialContainer
  tutorialPath="/Tutorial/VerilogTutorialFormatted.md"  // Pfad relativ zu public/
  uiLanguage="de"                                        // 'de' oder 'en'
  editorTheme="vs-light"                                 // Monaco-Theme, z.B. 'vs-light' | 'vs-dark'
  onModuleSaved={fn}                                     // Callback nach Auto-Save eines Moduls
  onRegisterInsert={fn}                                  // Registriert Insert-Handler für die Modul-Bibliothek
/>
```

## Debugging & Logging

Der Parser gibt Console-Logs aus:

```
[Tutorial] Parsing Markdown tutorial...
[Tutorial] Gefundene Lektionsblöcke: 88
[Tutorial] ✓ Lektion 1: "Vorwort" (theory)
[Tutorial] ✓ Lektion 3: "0. Grundlagen für das Hardware Verständnis" (theory)
...
[Tutorial] Erfolgreich 88 Lektionen geladen

[TutorialLesson] Lesson loaded: { id: 202, title: '2.2 Übung: Assign', type: 'exercise', ... }
```

Bei Fehlern: Browser DevTools (F12) → Konsole → nach `[Tutorial]`-Zeilen suchen.

## Häufige Probleme & Lösungen

**"Fehler beim Laden des Tutorials" / `Failed to fetch`**
- Liegt die Datei unter `apps/frontend/public/Tutorial/VerilogTutorialFormatted.md`?
- `tutorialPath`-Prop korrekt gesetzt?

**"Keine Lektionen gefunden" / 0 Lektionsblöcke**
- Jede Lektion braucht einen `<!-- ... -->`-Block, der die Zeile `lesson_id:` enthält - ohne diese Zeile wird der Block ignoriert
- Der Inhalt einer Lektion endet beim nächsten `---`-Trenner **oder** dem nächsten `<!--` - fehlt beides, werden mehrere Lektionen fälschlich zusammengefasst

**"Lesson undefined" in der Konsole**
- `lesson_id` ist nicht numerisch oder nicht eindeutig
- Format des Frontmatter-Blocks abweichend (z.B. fehlende Anführungszeichen bei `lesson_title`)

**Editor zeigt keinen Code**
- `type: "exercise"` fehlt im Frontmatter
- `**EXERCISE_START**`/`**EXERCISE_END**`-Marker fehlerhaft oder Code-Block nutzt nicht ```` ```verilog ````

**Lösung wird nicht angezeigt**
- `**SOLUTION_START**`/`**SOLUTION_END**`-Marker fehlerhaft
- Passwortabfrage abgebrochen oder falsches Passwort eingegeben (siehe `VITE_TUTORIAL_SOLUTION_PASSWORD`)

**Testbench-Validierung schlägt immer fehl**
- `test_solved` in der Testbench muss ein **unpacked Array** sein (`output logic test_solved [TEST_LENGTH]`), kein einzelner Vektor - siehe `TUTORIAL_DEVELOPER_GUIDE.md`

---

# English Documentation

## Where it's already wired up

`TutorialContainer` is currently rendered directly from `App.jsx` (no React Router in this project, switching is done via a simple `currentPage` state). It requires a surrounding `AuthProvider`, since `TutorialLesson` and `ModuleLibrary` internally use `useAuth()` (JWT token, `apiCall()`, `hasRole()`) - in the real app, `AuthProvider` already wraps `<App />` itself in `main.jsx`, not inside `App.jsx`:

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

function App() {
  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'tutorial'

  return (
    <>
      {currentPage === 'tutorial' && (
        <TutorialContainer
          tutorialPath="/Tutorial/VerilogTutorialFormatted.md"
          uiLanguage={uiLanguage}
          editorTheme={editorTheme}
          onModuleSaved={handleModuleLibraryRefresh}
          onRegisterInsert={(fn) => { tutorialInsertRef.current = fn; }}
        />
      )}
    </>
  );
}
```

### If React Router is used instead

```jsx
import { Routes, Route } from 'react-router-dom';
import TutorialContainer from './components/TutorialContainer';

<Routes>
  <Route path="/tutorial" element={
    <TutorialContainer
      tutorialPath="/Tutorial/VerilogTutorialFormatted.md"
      uiLanguage="de"
      editorTheme="vs-light"
    />
  } />
</Routes>
```

## Prerequisite: File Location

The parser loads the markdown file via `fetch()` - this only works for files inside Vite's `public/` folder:

```
apps/frontend/public/Tutorial/VerilogTutorialFormatted.md
```

A copy also exists under `apps/frontend/dist/Tutorial/` (build output, generated automatically from `public/` by `vite build`) - do **not** edit it manually there, changes belong in `public/`.

## Relevant Files at a Glance

```
TutorialContainer.jsx    - Loads markdown, holds currentLessonId state, switches overview/lesson
TutorialOverview.jsx     - 3 views: chapter (default) / difficulty / type
TutorialLesson.jsx       - Explanation, editor, testbench, validation, reset, password-gated solution
Tutorial.css             - Styling for all three components
tutorialParser.js        - parseFrontmatter(), extractBetween(), parseLesson(),
                           parseTutorialFromMarkdown(), parseTutorialFromFile(),
                           groupByChapter()/getChapterKey(), groupByDifficulty(), groupByType()
tutorialLoader.js        - Example hook useTutorial() (reference implementation, not directly
                           used by TutorialContainer.jsx)
```

## Backend Dependency: Code Validation

`TutorialLesson.jsx` sends validation requests to **`POST /api/tutorial/validate`** (singular, authenticated - not the older, unused `/api/tutorials/validate` in `routes.js`). Body: `{ lessonId, moduleCode, testbench }`, response: `{ success: boolean, errors?: string }`. See `apps/backend/src/routes/tutorial.js` / backend README section 8.5 for the implementation.

If a backend doesn't (yet) support this endpoint:
1. Hide/disable the "Submit solution" button in the UI (adjust the `lesson.type === 'exercise'` condition in `TutorialLesson.jsx`), or
2. Implement the endpoint server-side (a real simulation like the current backend, or a simplified stub that just returns `{success: true}` for UI-only demos)

## Configurable Props

```jsx
<TutorialContainer
  tutorialPath="/Tutorial/VerilogTutorialFormatted.md"  // path relative to public/
  uiLanguage="de"                                        // 'de' or 'en'
  editorTheme="vs-light"                                 // Monaco theme, e.g. 'vs-light' | 'vs-dark'
  onModuleSaved={fn}                                     // callback after auto-saving a module
  onRegisterInsert={fn}                                  // registers an insert handler for the module library
/>
```

## Debugging & Logging

The parser logs to the console:

```
[Tutorial] Parsing Markdown tutorial...
[Tutorial] Gefundene Lektionsblöcke: 88
[Tutorial] ✓ Lektion 1: "Vorwort" (theory)
[Tutorial] ✓ Lektion 3: "0. Grundlagen für das Hardware Verständnis" (theory)
...
[Tutorial] Erfolgreich 88 Lektionen geladen

[TutorialLesson] Lesson loaded: { id: 202, title: '2.2 Übung: Assign', type: 'exercise', ... }
```

On errors: browser DevTools (F12) → console → search for `[Tutorial]` lines.

## Common Issues & Solutions

**"Error loading tutorial" / `Failed to fetch`**
- Is the file at `apps/frontend/public/Tutorial/VerilogTutorialFormatted.md`?
- Is the `tutorialPath` prop set correctly?

**"No lessons found" / 0 lesson blocks**
- Every lesson needs a `<!-- ... -->` block containing the line `lesson_id:` - without that line the block is ignored
- A lesson's content ends at the next `---` separator **or** the next `<!--` - if neither is present, multiple lessons get merged incorrectly

**"Lesson undefined" in the console**
- `lesson_id` is not numeric or not unique
- Frontmatter block format differs (e.g. missing quotes around `lesson_title`)

**Editor shows no code**
- `type: "exercise"` is missing from the frontmatter
- `**EXERCISE_START**`/`**EXERCISE_END**` markers are malformed, or the code block doesn't use ```` ```verilog ````

**Solution is not shown**
- `**SOLUTION_START**`/`**SOLUTION_END**` markers are malformed
- Password prompt was cancelled or the wrong password was entered (see `VITE_TUTORIAL_SOLUTION_PASSWORD`)

**Testbench validation always fails**
- `test_solved` in the testbench must be an **unpacked array** (`output logic test_solved [TEST_LENGTH]`), not a single vector - see `TUTORIAL_DEVELOPER_GUIDE.md`

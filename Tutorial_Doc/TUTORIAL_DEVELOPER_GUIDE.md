<!-- DEUTSCH / GERMAN -->
# Tutorial-Modus - Entwicklerhandbuch

> Aktualisiert auf den Stand Juli 2026. Ergänzt `TUTORIAL_IMPLEMENTATION.md` (Feature-Übersicht) und die READMEs in `apps/frontend`/`apps/backend`.

## Architektur-Überblick

```
┌─────────────────────────────────────────────────────────────┐
│                      HDLab Frontend                          │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────┐      ┌──────────────────┐                │
│  │    Topbar      │      │  Tutorial Button │                │
│  └────────────────┘      └──────────────────┘                │
│         │                                  │                  │
│         └──────────────┬───────────────────┘                  │
│                        │ onClick                              │
│              ┌─────────▼────────────┐                         │
│              │ App.jsx Router       │                         │
│              │ (currentPage state)  │                         │
│              └─────────┬─────────┬──┘                         │
│                        │         │                            │
│         ┌──────────────┘         └──────────────┐             │
│         │                                       │             │
│    ┌────▼──────────────┐            ┌──────────▼────┐         │
│    │ TutorialContainer │            │               │         │
│    │  ┌──────────────┐ │            │               │         │
│    │  │TutorialOverview│─────────── │ TutorialLesson │         │
│    │  │- Kapitel/     │ selectLesson│ - Erklärung    │         │
│    │  │  Schwierigkeit│             │ - Editor       │         │
│    │  │  /Typ-Ansicht │             │ - Testbench    │         │
│    │  │- Typ-Badges   │             │ - Reset-Button │         │
│    │  └──────────────┘ │            │ - Passwort-    │         │
│    │                    │            │   Lösung       │         │
│    └────────────────────┘            │ - Status-Marker│         │
│                                       └────────────────┘         │
└─────────────────────────────┬───────────────────────────────┘
                              │ API Calls (JWT via AuthContext)
                    ┌─────────▼────────────┐
                    │  HDLab Backend       │
                    ├──────────────────────┤
                    │ /api/tutorial/*      │
                    │ /api/modules         │
                    │ /api/auth/*          │
                    └─────────┬────────────┘
                              │
                ┌─────────────┴──────────────┐
                │                           │
         ┌──────▼──────────┐         ┌─────▼────────────┐
         │ VerilogTutorial  │         │ Simulation Queue  │
         │ Formatted.md     │         │ (RabbitMQ)        │
         │ (statisch vom    │         │ → Worker →        │
         │  Frontend        │         │  Verilator        │
         │  ausgeliefert)   │         │                    │
         └──────────────────┘         └────────────────────┘
```

Wichtig: Das Tutorial-Markdown wird **nicht** vom Backend ausgeliefert - `TutorialContainer.jsx` lädt es per `fetch()` direkt als statische Datei aus `apps/frontend/public/Tutorial/VerilogTutorialFormatted.md`.

## Dateistruktur

```
/apps/frontend/src/
├── App.jsx                              # Haupt-App mit Routing
├── contexts/
│   └── AuthContext.jsx                  # JWT-Auth, hasRole()
├── components/
│   ├── Topbar.jsx                       # Tutorial-Button, Profil-Dropdown
│   ├── TutorialContainer.jsx            # Lädt Markdown, State-Umschaltung
│   ├── TutorialOverview.jsx             # Kapitel-/Schwierigkeits-/Typ-Ansicht
│   ├── TutorialLesson.jsx               # Lektionsseite
│   └── Tutorial.css                     # Styling
└── utils/
    ├── tutorialParser.js                # Markdown-Parsing-Logik
    └── tutorialLoader.js                # Lade-Utility

/apps/backend/src/
├── routes.js                            # Projekte, Simulationen, svfile, health
├── routes/
│   ├── auth.js                          # Registrierung/Login/roles
│   └── tutorial.js                      # /tutorial/validate, /tutorial/progress, /modules
├── middleware/auth.js                   # authenticateToken, requireRole
└── models/
    ├── User.js, TutorialProgress.js, ModuleLibrary.js

/apps/frontend/public/Tutorial/
└── VerilogTutorialFormatted.md          # Tutorial-Inhalt (Quelle der Wahrheit)
```

## Neue Lektionen hinzufügen

### Schritt 1: `VerilogTutorialFormatted.md` bearbeiten

Es gibt **keine** separate Metadaten-Datei - Metadaten stehen direkt als HTML-Kommentar-Frontmatter vor jeder Lektion:

```markdown
<!--
lesson_id: 59
lesson_title: "Neues Thema"
difficulty: "intermediate"
duration_min: 15
type: "theory"
-->

### Neues Thema

Hier kommt die Erklärung...

---
```

Für Übungen (`type: "exercise"`) zusätzlich:

````markdown
**EXERCISE_START**
```verilog
module neues_modul();
  // TODO
endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module neues_modul();
  // Lösung
endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_neues_modul #(
    parameter integer TEST_LENGTH = 4
) (
    output logic test_solved [TEST_LENGTH]
);
  // ... Testvektoren, befüllt test_solved[i] per === Vergleich ...
  $finish;
endmodule
```
**TESTBENCH_END**
````

**Wichtige Konventionen:**
- `lesson_id`: eindeutig, numerisch. Theorie-Lektionen eines Kapitels: `<Kapitel>00`-`<Kapitel>99` als lockere Konvention (z.B. Kapitel 3 → 300-399), siehe bestehende Lektionen als Vorbild
- `difficulty`: `intro` | `beginner` | `intermediate` | `advanced`
- `type`: `theory` | `exercise` | `project`
- **Kapitelzuordnung** erfolgt automatisch aus dem Lektionstitel: ein Titel wie `"3. Erweiterte Signale"` (Zahl + Punkt + Leerzeichen) markiert die Kapitel-Wurzel, `"3.1 Breite von Signalen"` (Zahl.Zahl) ein Unterkapitel von Kapitel 3. Titel ohne führende Nummer (z.B. "Vorwort") landen in der Gruppe "Einführung". Diese Zuordnung passiert in `groupByChapter()`/`getChapterKey()` in `tutorialParser.js` - **keine** manuelle Konfiguration nötig
- `test_solved` in der Testbench **muss** ein unpacked Array sein (`output logic test_solved [TEST_LENGTH]`), kein einzelner Bit-Vektor - siehe Abschnitt "Validierungslogik" unten

### Schritt 2: Der Parser übernimmt automatisch

`tutorialParser.js` parst die Datei bei jedem Frontend-Start neu (kein Build-Schritt, kein Cache) und:
- extrahiert Erklärung, Exercise-Template, Lösung, Testbench
- ordnet die Lektion in `byDifficulty`, `byType` und `byChapter` ein
- Anpassungen an der `.md`-Datei sind nach einem Browser-Reload sofort sichtbar

## Validierungslogik

### Wie die Testbench-Validierung funktioniert

1. **Nutzer klickt "Lösung einreichen"** → Frontend sendet `{ lessonId, moduleCode, testbench }` an `POST /api/tutorial/validate` (authentifiziert)
2. **Backend instrumentiert die Testbench** (`injectTestSolvedDisplay()` in `apps/backend/src/routes/tutorial.js`): fügt vor jedem `$finish;` einen Block ein, der über das Array `test_solved` iteriert und es als `TEST_SOLVED=<bits>`-Zeile ausgibt
3. **Backend legt intern Projekt + Simulation an** (ruft die eigene REST-API auf: `POST /api/projects`, `POST /api/simulations`)
4. **Worker führt die Simulation aus** (siehe Worker-README) - weiß nichts von "Tutorial" oder "Validierung", führt einfach `main.sv` + `tb.sv` aus
5. **Backend pollt** bis zu 30 Sekunden auf ein Ergebnis
6. **Log-Auswertung** (`checkValidationLog()`):
   - Compile-/Laufzeitfehler (`%Error`, `compilation error`, `syntax error`) → sofort `false`
   - `TEST_SOLVED=<bits>`-Zeile gefunden → bestanden nur wenn **alle** Bits `1` sind
   - Fallback (keine `TEST_SOLVED=`-Zeile, z.B. bei nicht konventionsgerechten/alten Testbenches): generische `pass`/`fail`-Schlüsselwörter im Log
7. Ergebnis `{ success: boolean, errors?: string }` geht zurück ans Frontend

### Beispiel-Antworten

**Erfolg:**
```json
{ "success": true }
```

**Fehlschlag:**
```json
{
  "success": false,
  "errors": "... relevante Fehlerzeilen (max. 20) ..."
}
```

## Zustandsverwaltung (State Management)

### Tutorial-bezogener State in `App.jsx`

```javascript
const [currentPage, setCurrentPage] = useState('home');
// 'home', 'tutorial-overview', oder 'tutorial-lesson'
```

### Tutorial-Daten in `TutorialContainer.jsx`

```javascript
// Rückgabe von parseTutorialFromFile() / parseTutorialFromMarkdown():
{
  lessons: { lessonId: LessonObject, ... },
  lessonIds: [lessonId, ...],           // Dokumentreihenfolge
  byDifficulty: { intro: [...], beginner: [...], intermediate: [...], advanced: [...] },
  byType: { theory: [...], exercise: [...], project: [...] },
  byChapter: [{ key: 'intro', lessonIds: [...] }, { key: '0', lessonIds: [...] }, ...],
}
```

### Navigations-Handler
- `handleTutorialOpen()` - Übersicht anzeigen
- `handleTutorialStart(lessonId)` / `onStartLesson` - Lektion starten
- `onNextLesson` / `onPreviousLesson` - Navigation (nicht mehr gesperrt bei nicht bestandener Übung)
- `onBack` - zurück zur Übersicht

## Anpassungspunkte

### 1. Kapitel-/Schwierigkeits-Farbschema ändern
`apps/frontend/src/components/Tutorial.css`:
```css
.difficulty-header {
  background: #f3f4f6; /* Diese Farbe ändern */
}
```

### 2. Validierungsregeln anpassen
`checkValidationLog()` in `apps/backend/src/routes/tutorial.js`:
```javascript
function checkValidationLog(log) {
  // Eigene Pattern-Matching-Logik hier
}
```

### 3. Editor-Theme ändern
`editorTheme`-Prop an `<TutorialLesson>` durchreichen (`'vs-light'` oder `'vs-dark'`).

### 4. Weitere Sprachen hinzufügen
`TRANSLATIONS`-Objekt in den jeweiligen Tutorial-Komponenten erweitern:
```javascript
const TRANSLATIONS = {
  de: { /* Deutsch */ },
  en: { /* Englisch */ },
  es: { /* Spanisch - hier ergänzen */ },
};
```

### 5. Musterlösungs-Passwort ändern
`VITE_TUTORIAL_SOLUTION_PASSWORD` in `.env.runtime` (siehe `setup.sh`) - Nutzer mit Rolle `admin`/`developer` umgehen die Abfrage ohnehin (siehe Backend-README Abschnitt 14.1).

## Tutorial testen

### Manuelle Testschritte

1. **App starten** - `http://localhost:5173` öffnen
2. **"Tutorial"-Button** in der Topbar klicken
3. **TutorialOverview prüfen:**
   - ✓ Kapitel-Dropdowns sichtbar, max. 7 Unterkapitel + "Mehr anzeigen" bei Bedarf
   - ✓ Typ-Badges (📖/✏️/🚀) pro Lerneinheit
   - ✓ "Von vorne beginnen" funktioniert
4. **Übungs-Lektion auswählen:**
   - ✓ Erklärung wird gerendert (inkl. Tabellen und ggf. HTML-Blöcke)
   - ✓ Code-Editor erscheint
   - ✓ Testbench nur anzeigbar, nicht editierbar
   - ✓ Reset-Button setzt Editor zurück (mit Bestätigung)
   - ✓ Lösung nur nach korrektem Passwort sichtbar (außer bei `admin`/`developer`-Rolle)
5. **Validierung testen:**
   - ✓ Falscher Code → "✗ Nicht korrekt" + Fehlerzeilen
   - ✓ Korrekter Code → "✓ Richtig gelöst!" + Status-Marker "✓ Abgeschlossen"
   - ✓ "Nächste Lektion" ist in beiden Fällen klickbar
6. **Navigation testen:**
   - ✓ Vorherige/Nächste funktionieren
   - ✓ Zurück-Button führt zur Übersicht
   - ✓ Zwischen Lektionen wechseln funktioniert

## Bekannte Probleme & Lösungen

### Problem: Tutorial-Inhalt lädt nicht
**Lösung:** Prüfen, ob `apps/frontend/public/Tutorial/VerilogTutorialFormatted.md` existiert und per Browser direkt erreichbar ist (`/Tutorial/VerilogTutorialFormatted.md`).

### Problem: Validierung schlägt immer fehl
**Lösung:** Prüfen, ob die Testbench `test_solved` als **unpacked Array** deklariert (`output logic test_solved [N]`), nicht als einzelnen Vektor. Simulations-Log über `GET /api/simulations/:id/results` direkt prüfen (enthält es eine `TEST_SOLVED=`-Zeile?). RabbitMQ/Worker-Logs prüfen.

### Problem: Editor-Theme wird nicht angewendet
**Lösung:** Sicherstellen, dass `editorTheme` einem gültigen Monaco-Theme-Namen entspricht.

### Problem: Lektion erscheint nicht in der Übersicht
**Lösung:** `lesson_id` auf Eindeutigkeit prüfen, Titel-Format für die Kapitelzuordnung prüfen (siehe "Neue Lektionen hinzufügen" oben).

## Mögliche Erweiterungen

1. Backend-seitige Rollen-Gates (`requireRole`-Middleware existiert bereits, wird aber noch auf keiner Route genutzt)
2. Admin-UI für Rollenvergabe (aktuell nur CLI-Skript)
3. Hinweise/Hints-System für Übungen
4. Zeit-Tracking pro Lektion
5. Peer-Code-Review

---

# English Documentation

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      HDLab Frontend                          │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────┐      ┌──────────────────┐                │
│  │    Topbar      │      │  Tutorial Button │                │
│  └────────────────┘      └──────────────────┘                │
│         │                                  │                  │
│         └──────────────┬───────────────────┘                  │
│                        │ onClick                              │
│              ┌─────────▼────────────┐                         │
│              │ App.jsx Router       │                         │
│              │ (currentPage state)  │                         │
│              └─────────┬─────────┬──┘                         │
│                        │         │                            │
│         ┌──────────────┘         └──────────────┐             │
│         │                                       │             │
│    ┌────▼──────────────┐            ┌──────────▼────┐         │
│    │ TutorialContainer │            │               │         │
│    │  ┌──────────────┐ │            │               │         │
│    │  │TutorialOverview│─────────── │ TutorialLesson │         │
│    │  │- chapter/     │ selectLesson│ - explanation  │         │
│    │  │  difficulty/  │             │ - editor       │         │
│    │  │  type view    │             │ - testbench    │         │
│    │  │- type badges  │             │ - reset button │         │
│    │  └──────────────┘ │            │ - password-    │         │
│    │                    │            │   gated soln   │         │
│    └────────────────────┘            │ - status marker│         │
│                                       └────────────────┘         │
└─────────────────────────────┬───────────────────────────────┘
                              │ API calls (JWT via AuthContext)
                    ┌─────────▼────────────┐
                    │  HDLab Backend       │
                    ├──────────────────────┤
                    │ /api/tutorial/*      │
                    │ /api/modules         │
                    │ /api/auth/*          │
                    └─────────┬────────────┘
                              │
                ┌─────────────┴──────────────┐
                │                           │
         ┌──────▼──────────┐         ┌─────▼────────────┐
         │ VerilogTutorial  │         │ Simulation Queue  │
         │ Formatted.md     │         │ (RabbitMQ)        │
         │ (served          │         │ → Worker →        │
         │  statically by   │         │  Verilator        │
         │  the frontend)   │         │                    │
         └──────────────────┘         └────────────────────┘
```

Important: the tutorial markdown is **not** served by the backend - `TutorialContainer.jsx` fetches it directly as a static file from `apps/frontend/public/Tutorial/VerilogTutorialFormatted.md`.

## File Structure

```
/apps/frontend/src/
├── App.jsx                              # Main app with routing
├── contexts/
│   └── AuthContext.jsx                  # JWT auth, hasRole()
├── components/
│   ├── Topbar.jsx                       # Tutorial button, profile dropdown
│   ├── TutorialContainer.jsx            # Loads markdown, state switching
│   ├── TutorialOverview.jsx             # Chapter/difficulty/type view
│   ├── TutorialLesson.jsx               # Lesson page
│   └── Tutorial.css                     # Styling
└── utils/
    ├── tutorialParser.js                # Markdown parsing logic
    └── tutorialLoader.js                # Loading utility

/apps/backend/src/
├── routes.js                            # Projects, simulations, svfile, health
├── routes/
│   ├── auth.js                          # Register/login/roles
│   └── tutorial.js                      # /tutorial/validate, /tutorial/progress, /modules
├── middleware/auth.js                   # authenticateToken, requireRole
└── models/
    ├── User.js, TutorialProgress.js, ModuleLibrary.js

/apps/frontend/public/Tutorial/
└── VerilogTutorialFormatted.md          # Tutorial content (source of truth)
```

## Adding New Lessons

### Step 1: Edit `VerilogTutorialFormatted.md`

There is **no** separate metadata file - metadata sits directly as HTML comment frontmatter before each lesson:

```markdown
<!--
lesson_id: 59
lesson_title: "New Topic"
difficulty: "intermediate"
duration_min: 15
type: "theory"
-->

### New Topic

Explanation goes here...

---
```

For exercises (`type: "exercise"`), additionally:

````markdown
**EXERCISE_START**
```verilog
module new_module();
  // TODO
endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module new_module();
  // Solution
endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_new_module #(
    parameter integer TEST_LENGTH = 4
) (
    output logic test_solved [TEST_LENGTH]
);
  // ... test vectors, populate test_solved[i] via === comparison ...
  $finish;
endmodule
```
**TESTBENCH_END**
````

**Important conventions:**
- `lesson_id`: unique, numeric. Loose convention: theory lessons of a chapter use `<chapter>00`-`<chapter>99` (e.g. chapter 3 → 300-399) - follow existing lessons as a template
- `difficulty`: `intro` | `beginner` | `intermediate` | `advanced`
- `type`: `theory` | `exercise` | `project`
- **Chapter assignment** happens automatically from the lesson title: a title like `"3. Extended Signals"` (number + dot + space) marks the chapter root, `"3.1 Signal Width"` (number.number) a sub-chapter of chapter 3. Titles without a leading number (e.g. "Foreword") land in the "Introduction" group. This is done in `groupByChapter()`/`getChapterKey()` in `tutorialParser.js` - **no** manual configuration needed
- `test_solved` in the testbench **must** be an unpacked array (`output logic test_solved [TEST_LENGTH]`), not a single bit vector - see "Validation Logic" below

### Step 2: The parser handles the rest automatically

`tutorialParser.js` re-parses the file on every frontend load (no build step, no cache) and:
- extracts explanation, exercise template, solution, testbench
- assigns the lesson to `byDifficulty`, `byType`, and `byChapter`
- edits to the `.md` file are visible immediately after a browser reload

## Validation Logic

### How Testbench Validation Works

1. **User clicks "Submit solution"** → frontend sends `{ lessonId, moduleCode, testbench }` to `POST /api/tutorial/validate` (authenticated)
2. **Backend instruments the testbench** (`injectTestSolvedDisplay()` in `apps/backend/src/routes/tutorial.js`): inserts a block before every `$finish;` that iterates over the `test_solved` array and prints it as a `TEST_SOLVED=<bits>` line
3. **Backend internally creates a project + simulation** (calls its own REST API: `POST /api/projects`, `POST /api/simulations`)
4. **Worker runs the simulation** (see worker README) - knows nothing about "tutorial" or "validation", simply runs `main.sv` + `tb.sv`
5. **Backend polls** for up to 30 seconds for a result
6. **Log evaluation** (`checkValidationLog()`):
   - Compile/runtime errors (`%Error`, `compilation error`, `syntax error`) → immediately `false`
   - `TEST_SOLVED=<bits>` line found → passes only if **all** bits are `1`
   - Fallback (no `TEST_SOLVED=` line, e.g. for non-conforming/older testbenches): generic `pass`/`fail` keywords in the log
7. Result `{ success: boolean, errors?: string }` goes back to the frontend

### Example Responses

**Success:**
```json
{ "success": true }
```

**Failure:**
```json
{
  "success": false,
  "errors": "... relevant error lines (max 20) ..."
}
```

## State Management

### Tutorial-related state in `App.jsx`

```javascript
const [currentPage, setCurrentPage] = useState('home');
// 'home', 'tutorial-overview', or 'tutorial-lesson'
```

### Tutorial data in `TutorialContainer.jsx`

```javascript
// Return value of parseTutorialFromFile() / parseTutorialFromMarkdown():
{
  lessons: { lessonId: LessonObject, ... },
  lessonIds: [lessonId, ...],           // document order
  byDifficulty: { intro: [...], beginner: [...], intermediate: [...], advanced: [...] },
  byType: { theory: [...], exercise: [...], project: [...] },
  byChapter: [{ key: 'intro', lessonIds: [...] }, { key: '0', lessonIds: [...] }, ...],
}
```

### Navigation Handlers
- `handleTutorialOpen()` - show overview
- `handleTutorialStart(lessonId)` / `onStartLesson` - start a lesson
- `onNextLesson` / `onPreviousLesson` - navigation (no longer locked on a failed exercise)
- `onBack` - return to overview

## Customization Points

### 1. Change Chapter/Difficulty Color Scheme
`apps/frontend/src/components/Tutorial.css`:
```css
.difficulty-header {
  background: #f3f4f6; /* Change this color */
}
```

### 2. Modify Validation Rules
`checkValidationLog()` in `apps/backend/src/routes/tutorial.js`:
```javascript
function checkValidationLog(log) {
  // Add custom pattern matching logic here
}
```

### 3. Change Editor Theme
Pass `editorTheme` prop to `<TutorialLesson>` (`'vs-light'` or `'vs-dark'`).

### 4. Add More Languages
Extend the `TRANSLATIONS` object in the respective tutorial components:
```javascript
const TRANSLATIONS = {
  de: { /* German */ },
  en: { /* English */ },
  es: { /* Spanish - add here */ },
};
```

### 5. Change the Sample-Solution Password
`VITE_TUTORIAL_SOLUTION_PASSWORD` in `.env.runtime` (see `setup.sh`) - users with role `admin`/`developer` bypass the prompt regardless (see backend README section 14.1).

## Testing the Tutorial

### Manual Testing Steps

1. **Start the app** - open `http://localhost:5173`
2. **Click the "Tutorial" button** in the topbar
3. **Verify TutorialOverview:**
   - ✓ Chapter dropdowns visible, max 7 sub-chapters + "Show more" when needed
   - ✓ Type badges (📖/✏️/🚀) per lesson
   - ✓ "Start from beginning" works
4. **Select an exercise lesson:**
   - ✓ Explanation renders (including tables and any HTML blocks)
   - ✓ Code editor appears
   - ✓ Testbench can only be shown, not edited
   - ✓ Reset button restores the editor (with confirmation)
   - ✓ Solution only visible after the correct password (unless role is `admin`/`developer`)
5. **Test validation:**
   - ✓ Incorrect code → "✗ Incorrect" + error lines
   - ✓ Correct code → "✓ Correct!" + status marker "✓ Completed"
   - ✓ "Next lesson" is clickable either way
6. **Test navigation:**
   - ✓ Previous/next work
   - ✓ Back button returns to overview
   - ✓ Switching between lessons works

## Common Issues & Solutions

### Issue: Tutorial content not loading
**Solution:** Check that `apps/frontend/public/Tutorial/VerilogTutorialFormatted.md` exists and is reachable directly via the browser (`/Tutorial/VerilogTutorialFormatted.md`).

### Issue: Validation always fails
**Solution:** Check that the testbench declares `test_solved` as an **unpacked array** (`output logic test_solved [N]`), not a single vector. Inspect the simulation log directly via `GET /api/simulations/:id/results` (does it contain a `TEST_SOLVED=` line?). Check RabbitMQ/worker logs.

### Issue: Editor theme not applying
**Solution:** Ensure `editorTheme` matches a valid Monaco theme name.

### Issue: Lesson not appearing in the overview
**Solution:** Check `lesson_id` uniqueness and the title format used for chapter assignment (see "Adding New Lessons" above).

## Possible Enhancements

1. Backend-side role gates (`requireRole` middleware already exists but isn't applied to any route yet)
2. Admin UI for role assignment (currently CLI script only)
3. Hints system for stuck students
4. Time tracking per lesson
5. Peer code review

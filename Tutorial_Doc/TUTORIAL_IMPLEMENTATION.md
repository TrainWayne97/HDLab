<!-- DEUTSCH / GERMAN -->
# HDLab Tutorial-Modus - Implementierungsübersicht

> Diese Datei fasst den **aktuellen** Stand des Tutorial-Systems zusammen (Stand: Oktober 2026). Für Details siehe `TUTORIAL_DEVELOPER_GUIDE.md` (Architektur/Erweiterung), `TUTORIAL_INTEGRATION_GUIDE.md` (Einbindung) und die READMEs in `apps/frontend` (Abschnitt 5.1) sowie `apps/backend` (Abschnitte 8.5 und 15).

## Überblick

Das Tutorial-System besteht aus statischen Markdown-Dateien, einem Frontend-Parser, den Komponenten für Lektionsbaum, Übersicht und Lektion sowie Backend-Endpunkten für Validierung und Fortschritt. Es gibt zwei Arten von Inhalten im selben Format:

| Inhalt | Datei im Repo | Quelle (per GitHub Action synchronisiert) | URL |
|---|---|---|---|
| Verilog-Tutorial (knapp 90 Lektionen, Einführung + 11 Kapitel) | `apps/frontend/public/Tutorial/VerilogTutorialFormatted.md` | `Chaos-097/VerilogTutorial` (`VerilogTutorial_V0.4.md`), `sync-Tutorial.yml` | `/Tutorial` |
| Kurs ES1 – Embedded Systems 1 (Lehre-Menü) | `apps/frontend/public/Kurse/ES1/ES1Tutorial.md` | `joernhoffmann/VerilogTutorial-ES1` (`ES1Tutorial.md`), `sync-ES1.yml` | `/Lehre/es1` |

Die Dateien im Repo werden beim Sync überschrieben - Inhaltsänderungen gehören in das jeweilige Quell-Repo.

### 1. **Tutorial-Parser** (`apps/frontend/src/utils/tutorialParser.js`)
- Frontmatter pro Lektion steckt in `<!-- lesson_id: ...\nlesson_title: ...\ndifficulty: ...\nduration_min: ...\ntype: ... -->`-HTML-Kommentaren
- Gruppiert Lektionen nach Schwierigkeit (`byDifficulty`), Typ (`byType`: theory/exercise/project) und **Kapitel** (`byChapter`, abgeleitet aus der Nummerierung im Lektionstitel)
- Entfernt die führende Markdown-Überschrift aus dem Erklärungstext, extrahiert Exercise-Template/Lösung/Testbench aus `**EXERCISE_START**`/`**SOLUTION_START**`/`**TESTBENCH_START**`-Markern
- Extrahiert **Tipps** aus `**HINT_START**`/`**HINT_END**` (beliebig viele pro Lektion, bleiben Markdown) nach `lesson.hints`
- Baut `anchorMap` (Anchor-Slug → `lesson_id`) aus Kapitel- **und** Zwischenüberschriften, damit Links im Inhaltsverzeichnis zur Lektion bzw. zum Abschnitt springen

### 2. **Lektionsbaum** (`LessonNav.jsx`)
- Scrollbare Navigation links mit ausklappbaren Kapiteln, Theorie/Übung farblich unterschieden, Haken für gelöste Übungen, Fortschrittszähler pro Kapitel, Link zur Übersicht
- Auf schmalen Bildschirmen als ausklappbarer Drawer

### 3. **Tutorial-Übersicht** (`TutorialOverview.jsx`)
- Drei umschaltbare Ansichten: **Nach Kapitel** (Standard), Nach Schwierigkeit, Nach Aufgabentyp
- Kapitel-Ansicht: aufklappbare Dropdowns pro Kapitel, max. 7 sichtbare Unterkapitel + "Mehr anzeigen"-Button, Typ-Badge (📖/✏️/🚀) pro Lerneinheit
- "Von vorne beginnen"-Button; erreichbar über den Lektionsbaum bzw. `/Tutorial/Uebersicht`

### 4. **Tutorial-Lektion** (`TutorialLesson.jsx`)
- Dreispaltiges Workbench-Layout: Lektion in der Mitte, Editor rechts (Breite per Ziehen), darunter ein Dock mit Ausgabe/Waveform/Netlist. Theorie-Lektionen ohne Übung zeigen weder Editor noch Dock
- Lektionskopf mit Titel, Typ und Vor/Zurück-Pfeilen, auf dem Desktop beim Scrollen angepinnt
- Erklärungsbereich mit Markdown-Rendering (`react-markdown` + `remark-gfm` + `rehype-raw`), Syntax-Highlighting für Verilog-Codebeispiele, Bilder, Vollbild für Codeblöcke
- **Tipps**: "💡 Tipp anzeigen" deckt die Tipps einzeln nacheinander auf
- Monaco-Editor für Übungscode, **Reset-Button** (mit Bestätigung), Auto-Save nach 2 s
- Fußzeile unter dem Editor: "▶ Lösung einreichen", "Testbench anzeigen" (schreibgeschützt), "Lösung anzeigen" (Passwort-Dialog, Bypass für `admin`/`developer`)
- Dock startet für Studierende zugeklappt, öffnet sich bei fehlgeschlagener Einreichung; die Validierung liefert Waveform und Netlist mit
- Status-Marker "✓ Abgeschlossen" / "○ Nicht abgeschlossen", die nächste Lektion ist **nie gesperrt**

### 5. **Styling** (`Tutorial.css`, `Workbench.css`)
- Light- und Dark-Mode, Workbench-Layout, Dock, Waveform-/Netlist-Viewer, Tipp-Karten, Passwort-Dialog

### 6. **Backend** (`apps/backend/src/routes/tutorial.js`)
- **`POST /api/tutorial/validate`** (authentifiziert) - validiert Benutzercode:
  - Instrumentiert die Testbench (`test_solved`-Array wird als `TEST_SOLVED=<bits>` ausgegeben)
  - Legt Projekt + Simulation für den Nutzer direkt über `src/services/simulations.js` an (mit `generateWave` und `generateNetlist`)
  - Pollt bis zu 30 Sekunden auf ein Ergebnis
  - Alle Bits von `TEST_SOLVED=` müssen `1` sein, damit die Übung als bestanden gilt
  - Antwort: `{ success, errors?, fullLog, simulationId, hasWaveform, hasNetlist }`
- **`GET/POST /api/tutorial/progress/:lessonId`**, **`GET /api/tutorial/progress`** - Fortschritt pro Lektion, mit `?course=<id>` pro Kurs getrennt (ohne Parameter: `courseId: 'verilog'`)
- **`GET/POST/PATCH/DELETE /api/modules`** - Modul-Bibliothek (gelöste Übungen werden automatisch gespeichert)

### 7. **Frontend-Integration**
- Topbar-Button "Tutorial" und Menü "Lehre" (Kurse aus `src/config/courses.js`)
- Die Seite kommt aus der URL (`src/hooks/useRoute.js`): `/Tutorial[/<lesson_id>|/Uebersicht]`, `/Lehre/<id>[/<lesson_id>|/Uebersicht]`
- `TutorialContainer.jsx` lädt die Markdown-Datei des Tutorials bzw. Kurses, leitet ohne Lektion in der URL zur zuletzt besuchten weiter und rendert Lektionsbaum + Übersicht/Lektion

### 8. **Authentifizierung & Rollen**
- JWT-basierte Anmeldung, Login per Passwort oder HTWK-GitLab (siehe Backend-README Abschnitt 14)
- Jeder Nutzer hat `roles` (Standard `['user']`), Rollen `developer`/`admin` schalten die Musterlösung ohne Passwort frei und öffnen das Dock standardmäßig
- Rollenvergabe nur über CLI-Skript (`apps/backend/scripts/setRole.js`), keine Admin-Oberfläche

## Relevante Dateien

**Frontend:**
- `src/utils/tutorialParser.js`, `tutorialLoader.js`
- `src/components/TutorialContainer.jsx`, `LessonNav.jsx`, `TutorialOverview.jsx`, `TutorialLesson.jsx`, `Tutorial.css`, `Workbench.css`
- `src/components/BottomDock.jsx`, `WaveformViewer.jsx`, `NetlistViewer.jsx`, `src/hooks/useSimArtifacts.js`
- `src/hooks/useRoute.js`, `src/config/courses.js`
- `src/contexts/AuthContext.jsx` (Rollenprüfung `hasRole()`)

**Backend:**
- `src/routes/tutorial.js` (Validierung, Fortschritt, Modul-Bibliothek)
- `src/services/simulations.js` (Projekt/Simulation anlegen)
- `src/routes/auth.js`, `src/routes/oauth.js`, `src/middleware/auth.js`, `src/config/jwt.js` (Login, Rollen im JWT, `requireRole`)
- `src/models/TutorialProgress.js`, `ModuleLibrary.js`, `User.js`
- `scripts/setRole.js`

**Inhalte & Sync:**
- `apps/frontend/public/Tutorial/`, `apps/frontend/public/Kurse/<Kurs>/`
- `.github/workflows/sync-Tutorial.yml`, `.github/workflows/sync-ES1.yml`

## Bekannte Einschränkungen

- Polling ist statisch (max. 30 s, 1 s Intervall), kein WebSocket
- Die Musterlösungs-Passwortabfrage ist reiner UX-Schutz, kein echter Zugriffsschutz (Lösung und Passwort stecken im ausgelieferten Frontend)
- Die Netlist entsteht nur aus `main.sv`; SystemVerilog-Konstrukte, die Yosys nicht kennt, liefern keinen Schaltplan
- Kein Admin-UI für Rollenvergabe

---

# English Documentation

> This file summarizes the **current** state of the tutorial system (as of October 2026). See `TUTORIAL_DEVELOPER_GUIDE.md` for architecture/extension details, `TUTORIAL_INTEGRATION_GUIDE.md` for wiring, and the READMEs in `apps/frontend` (section 5.1) and `apps/backend` (sections 8.5 and 15).

## Overview

The tutorial system consists of static markdown files, a frontend parser, components for lesson tree, overview and lesson, and backend endpoints for validation and progress. There are two kinds of content in the same format:

| Content | File in this repo | Source (synced via GitHub Action) | URL |
|---|---|---|---|
| Verilog tutorial (just under 90 lessons, introduction + 11 chapters) | `apps/frontend/public/Tutorial/VerilogTutorialFormatted.md` | `Chaos-097/VerilogTutorial` (`VerilogTutorial_V0.4.md`), `sync-Tutorial.yml` | `/Tutorial` |
| Course ES1 – Embedded Systems 1 ("Lehre" menu) | `apps/frontend/public/Kurse/ES1/ES1Tutorial.md` | `joernhoffmann/VerilogTutorial-ES1` (`ES1Tutorial.md`), `sync-ES1.yml` | `/Lehre/es1` |

The files in this repo are overwritten by the sync - content changes belong in the respective source repo.

### 1. **Tutorial Parser** (`apps/frontend/src/utils/tutorialParser.js`)
- Per-lesson frontmatter lives in `<!-- lesson_id: ...\nlesson_title: ...\ndifficulty: ...\nduration_min: ...\ntype: ... -->` HTML comments
- Groups lessons by difficulty (`byDifficulty`), type (`byType`: theory/exercise/project) and **chapter** (`byChapter`, derived from the numbering in the lesson title)
- Strips the leading markdown heading from the explanation text, extracts exercise template/solution/testbench from `**EXERCISE_START**`/`**SOLUTION_START**`/`**TESTBENCH_START**` markers
- Extracts **hints** from `**HINT_START**`/`**HINT_END**` (any number per lesson, kept as markdown) into `lesson.hints`
- Builds `anchorMap` (anchor slug → `lesson_id`) from chapter **and** sub-headings, so table-of-contents links jump to the lesson or section

### 2. **Lesson Tree** (`LessonNav.jsx`)
- Scrollable navigation on the left with collapsible chapters, theory/exercise color-coded, check marks for solved exercises, progress counter per chapter, link to the overview
- Collapsible drawer on narrow screens

### 3. **Tutorial Overview** (`TutorialOverview.jsx`)
- Three switchable views: **By chapter** (default), by difficulty, by task type
- Chapter view: collapsible dropdowns per chapter, max 7 visible sub-chapters + "Show more" button, type badge (📖/✏️/🚀) per lesson
- "Start from beginning" button; reachable via the lesson tree or `/Tutorial/Uebersicht`

### 4. **Tutorial Lesson** (`TutorialLesson.jsx`)
- Three-column workbench layout: lesson in the middle, editor on the right (resizable), dock with output/waveform/netlist below. Theory lessons without an exercise show neither editor nor dock
- Lesson header with title, type and previous/next arrows, pinned while scrolling on desktop
- Explanation area with markdown rendering (`react-markdown` + `remark-gfm` + `rehype-raw`), syntax highlighting for Verilog examples, images, fullscreen for code blocks
- **Hints**: "💡 Show hint" reveals the hints one at a time
- Monaco editor for exercise code, **reset button** (with confirmation), auto-save after 2 s
- Footer below the editor: "▶ Submit solution", "Show testbench" (read-only), "Show solution" (password dialog, bypassed for `admin`/`developer`)
- The dock starts collapsed for students and opens on a failed submission; validation also returns waveform and netlist
- Status marker "✓ Completed" / "○ Not completed", the next lesson is **never locked**

### 5. **Styling** (`Tutorial.css`, `Workbench.css`)
- Light and dark mode, workbench layout, dock, waveform/netlist viewers, hint cards, password dialog

### 6. **Backend** (`apps/backend/src/routes/tutorial.js`)
- **`POST /api/tutorial/validate`** (authenticated) - validates user code:
  - Instruments the testbench (dumps the `test_solved` array as `TEST_SOLVED=<bits>`)
  - Creates project + simulation for the user directly via `src/services/simulations.js` (with `generateWave` and `generateNetlist`)
  - Polls for a result for up to 30 seconds
  - All bits of `TEST_SOLVED=` must be `1` for the exercise to pass
  - Response: `{ success, errors?, fullLog, simulationId, hasWaveform, hasNetlist }`
- **`GET/POST /api/tutorial/progress/:lessonId`**, **`GET /api/tutorial/progress`** - per-lesson progress, kept separate per course via `?course=<id>` (no parameter: `courseId: 'verilog'`)
- **`GET/POST/PATCH/DELETE /api/modules`** - module library (solved exercises are saved automatically)

### 7. **Frontend Integration**
- "Tutorial" topbar button and "Lehre" menu (courses from `src/config/courses.js`)
- The page comes from the URL (`src/hooks/useRoute.js`): `/Tutorial[/<lesson_id>|/Uebersicht]`, `/Lehre/<id>[/<lesson_id>|/Uebersicht]`
- `TutorialContainer.jsx` loads the markdown file of the tutorial or course, redirects to the last visited lesson when the URL has none, and renders lesson tree + overview/lesson

### 8. **Authentication & Roles**
- JWT-based login, via password or HTWK GitLab (see backend README section 14)
- Every user has `roles` (default `['user']`); roles `developer`/`admin` unlock the sample solution without a password and open the dock by default
- Roles are assigned only via a CLI script (`apps/backend/scripts/setRole.js`), no admin UI

## Relevant Files

**Frontend:**
- `src/utils/tutorialParser.js`, `tutorialLoader.js`
- `src/components/TutorialContainer.jsx`, `LessonNav.jsx`, `TutorialOverview.jsx`, `TutorialLesson.jsx`, `Tutorial.css`, `Workbench.css`
- `src/components/BottomDock.jsx`, `WaveformViewer.jsx`, `NetlistViewer.jsx`, `src/hooks/useSimArtifacts.js`
- `src/hooks/useRoute.js`, `src/config/courses.js`
- `src/contexts/AuthContext.jsx` (role check `hasRole()`)

**Backend:**
- `src/routes/tutorial.js` (validation, progress, module library)
- `src/services/simulations.js` (create project/simulation)
- `src/routes/auth.js`, `src/routes/oauth.js`, `src/middleware/auth.js`, `src/config/jwt.js` (login, roles in JWT, `requireRole`)
- `src/models/TutorialProgress.js`, `ModuleLibrary.js`, `User.js`
- `scripts/setRole.js`

**Content & sync:**
- `apps/frontend/public/Tutorial/`, `apps/frontend/public/Kurse/<course>/`
- `.github/workflows/sync-Tutorial.yml`, `.github/workflows/sync-ES1.yml`

## Known Limitations

- Polling is static (max 30 s, 1 s interval), no WebSocket
- The sample-solution password prompt is a UX convenience only, not real access control (solution and password are shipped in the frontend)
- The netlist is generated from `main.sv` only; SystemVerilog constructs Yosys doesn't know produce no schematic
- No admin UI for role assignment

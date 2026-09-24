<!-- DEUTSCH / GERMAN -->
# HDLab Tutorial-Modus - Implementierungsübersicht

> Diese Datei fasst den **aktuellen** Stand des Tutorial-Systems zusammen (Stand: Juli 2026). Für Details siehe `TUTORIAL_DEVELOPER_GUIDE.md` (Architektur/Erweiterung) und die READMEs in `apps/frontend` (Abschnitt 5.1) sowie `apps/backend` (Abschnitt 8.5).

## Überblick

Das Tutorial-System besteht aus einer statischen Markdown-Datei (`apps/frontend/public/Tutorial/VerilogTutorialFormatted.md`, aktuell knapp 90 Lektionen in einer Einführung + 11 Kapiteln), einem Frontend-Parser, zwei React-Komponenten (Übersicht + Lektion) und einem Backend-Validierungsendpunkt.

### 1. **Tutorial-Parser** (`apps/frontend/src/utils/tutorialParser.js`)
- Parst `VerilogTutorialFormatted.md` (nicht `VerilogTutorial.md` - alter Dateiname, existiert nicht mehr)
- Frontmatter pro Lektion steckt in `<!-- lesson_id: ...\nlesson_title: ...\ndifficulty: ...\nduration_min: ...\ntype: ... -->`-HTML-Kommentaren
- Gruppiert Lektionen nach Schwierigkeit (`byDifficulty`), Typ (`byType`: theory/exercise/project) und **Kapitel** (`byChapter`: Einführung + Kapitel 0-10, abgeleitet aus der Nummerierung im Lektionstitel)
- Entfernt die führende Markdown-Überschrift aus dem Erklärungstext, extrahiert Exercise-Template/Lösung/Testbench aus `**EXERCISE_START**`/`**SOLUTION_START**`/`**TESTBENCH_START**`-Markern

### 2. **Tutorial-Übersicht** (`TutorialOverview.jsx`)
- Landing Page mit drei umschaltbaren Ansichten: **Nach Kapitel** (Standard), Nach Schwierigkeit, Nach Aufgabentyp
- Kapitel-Ansicht: aufklappbare Dropdowns pro Kapitel, max. 7 sichtbare Unterkapitel + "Mehr anzeigen"-Button, Typ-Badge (📖/✏️/🚀) pro Lerneinheit
- "Von vorne beginnen"-Button

### 3. **Tutorial-Lektion** (`TutorialLesson.jsx`)
- Erklärungsbereich mit Markdown-Rendering (`react-markdown` + `remark-gfm` für Tabellen + `rehype-raw` für rohes HTML)
- Monaco-Editor für Übungscode
- Testbench: nur ein-/ausblendbar, **schreibgeschützt**
- **Reset-Button**: setzt Code + Testbench zurück auf Ausgangszustand (mit Bestätigungsabfrage)
- Musterlösung: nur nach Passwortabfrage sichtbar (`VITE_TUTORIAL_SOLUTION_PASSWORD`, Bypass für Rolle `admin`/`developer`), Lösungs-Code read-only
- Code-Validierung mit Pass/Fail-Feedback
- Navigation Vorherige/Nächste Lektion - **kein Sperren mehr** bei nicht bestandener Übung, stattdessen Status-Marker ("✓ Abgeschlossen" / "○ Nicht abgeschlossen") zwischen den beiden Buttons

### 4. **Tutorial-Styling** (`Tutorial.css`)
- Helles Farbschema durchgängig, auch für Code-Blöcke (`pre`/`code` im Markdown)
- Responsives Layout, Status-Marker, Chapter-Dropdowns, Typ-Badges

### 5. **Backend-Validierungs-API** (`apps/backend/src/routes/tutorial.js`)
- **`POST /api/tutorial/validate`** (Singular, authentifiziert) - validiert Benutzercode:
  - Instrumentiert die Testbench (`test_solved`-Array wird als `TEST_SOLVED=<bits>` ausgegeben)
  - Legt intern Projekt + Simulation über die eigene REST-API an
  - Pollt bis zu 30 Sekunden auf ein Ergebnis
  - Alle Bits von `TEST_SOLVED=` müssen `1` sein, damit die Übung als bestanden gilt
- **`GET/POST /api/tutorial/progress/:lessonId`**, **`GET /api/tutorial/progress`** - Fortschritt pro Lektion
- **`GET/POST/PATCH/DELETE /api/modules`** - Modul-Bibliothek

### 6. **Frontend-Integration**
- Topbar-Button "Tutorial" öffnet das System
- `currentPage`-State in `App.jsx` steuert Ansicht
- `TutorialContainer.jsx` lädt die Markdown-Datei und hält den Lektions-State

### 7. **Authentifizierung & Rollen**
- JWT-basierte Anmeldung (siehe Backend-README Abschnitt 14)
- Jeder Nutzer hat `roles` (Standard `['user']`), Rollen `developer`/`admin` schalten die Musterlösung ohne Passwort frei
- Rollenvergabe nur über CLI-Skript (`apps/backend/scripts/setRole.js`), keine Admin-Oberfläche

## Relevante Dateien

**Frontend:**
- `src/utils/tutorialParser.js`, `tutorialLoader.js`
- `src/components/TutorialContainer.jsx`, `TutorialOverview.jsx`, `TutorialLesson.jsx`, `Tutorial.css`
- `src/contexts/AuthContext.jsx` (Rollenprüfung `hasRole()`)

**Backend:**
- `src/routes/tutorial.js` (Validierung, Fortschritt, Modul-Bibliothek)
- `src/routes/auth.js`, `src/middleware/auth.js` (Rollen im JWT, `requireRole`)
- `src/models/TutorialProgress.js`, `ModuleLibrary.js`, `User.js`
- `scripts/setRole.js`

## Bekannte Einschränkungen

- Polling ist statisch (max. 30s, 1s Intervall), kein WebSocket
- Die Musterlösungs-Passwortabfrage ist reiner UX-Schutz, kein echter Zugriffsschutz (Lösung steckt im ausgelieferten Lesson-JSON)
- Kein Admin-UI für Rollenvergabe

---

# English Documentation

> This file summarizes the **current** state of the tutorial system (as of July 2026). See `TUTORIAL_DEVELOPER_GUIDE.md` for architecture/extension details, and the READMEs in `apps/frontend` (section 5.1) and `apps/backend` (section 8.5).

## Overview

The tutorial system consists of a static markdown file (`apps/frontend/public/Tutorial/VerilogTutorialFormatted.md`, currently just under 90 lessons across an introduction + 11 chapters), a frontend parser, two React components (overview + lesson), and a backend validation endpoint.

### 1. **Tutorial Parser** (`apps/frontend/src/utils/tutorialParser.js`)
- Parses `VerilogTutorialFormatted.md` (not `VerilogTutorial.md` - old filename, no longer exists)
- Per-lesson frontmatter lives in `<!-- lesson_id: ...\nlesson_title: ...\ndifficulty: ...\nduration_min: ...\ntype: ... -->` HTML comments
- Groups lessons by difficulty (`byDifficulty`), type (`byType`: theory/exercise/project), and **chapter** (`byChapter`: introduction + chapters 0-10, derived from the numbering in the lesson title)
- Strips the leading markdown heading from the explanation text, extracts exercise template/solution/testbench from `**EXERCISE_START**`/`**SOLUTION_START**`/`**TESTBENCH_START**` markers

### 2. **Tutorial Overview** (`TutorialOverview.jsx`)
- Landing page with three switchable views: **By chapter** (default), by difficulty, by task type
- Chapter view: collapsible dropdowns per chapter, max 7 visible sub-chapters + "Show more" button, type badge (📖/✏️/🚀) per lesson
- "Start from beginning" button

### 3. **Tutorial Lesson** (`TutorialLesson.jsx`)
- Explanation area with markdown rendering (`react-markdown` + `remark-gfm` for tables + `rehype-raw` for raw HTML)
- Monaco editor for exercise code
- Testbench: can only be shown/hidden, **read-only**
- **Reset button**: restores code + testbench to the exercise's original state (with a confirmation prompt)
- Sample solution: only visible after a password prompt (`VITE_TUTORIAL_SOLUTION_PASSWORD`, bypassed for role `admin`/`developer`), solution code is read-only
- Code validation with pass/fail feedback
- Previous/next lesson navigation - **no longer locked** on a failed exercise; instead a status marker ("✓ Completed" / "○ Not completed") sits between the two buttons

### 4. **Tutorial Styling** (`Tutorial.css`)
- Consistent light color scheme, including code blocks (`pre`/`code` in markdown)
- Responsive layout, status marker, chapter dropdowns, type badges

### 5. **Backend Validation API** (`apps/backend/src/routes/tutorial.js`)
- **`POST /api/tutorial/validate`** (singular, authenticated) - validates user code:
  - Instruments the testbench (dumps the `test_solved` array as `TEST_SOLVED=<bits>`)
  - Internally creates a project + simulation via the backend's own REST API
  - Polls for a result for up to 30 seconds
  - All bits of `TEST_SOLVED=` must be `1` for the exercise to pass
- **`GET/POST /api/tutorial/progress/:lessonId`**, **`GET /api/tutorial/progress`** - per-lesson progress
- **`GET/POST/PATCH/DELETE /api/modules`** - module library

### 6. **Frontend Integration**
- Topbar "Tutorial" button opens the system
- `currentPage` state in `App.jsx` drives the view
- `TutorialContainer.jsx` loads the markdown file and holds the lesson state

### 7. **Authentication & Roles**
- JWT-based login (see backend README section 14)
- Every user has `roles` (default `['user']`); roles `developer`/`admin` unlock the sample solution without a password
- Roles are assigned only via a CLI script (`apps/backend/scripts/setRole.js`), no admin UI

## Relevant Files

**Frontend:**
- `src/utils/tutorialParser.js`, `tutorialLoader.js`
- `src/components/TutorialContainer.jsx`, `TutorialOverview.jsx`, `TutorialLesson.jsx`, `Tutorial.css`
- `src/contexts/AuthContext.jsx` (role check `hasRole()`)

**Backend:**
- `src/routes/tutorial.js` (validation, progress, module library)
- `src/routes/auth.js`, `src/middleware/auth.js` (roles in JWT, `requireRole`)
- `src/models/TutorialProgress.js`, `ModuleLibrary.js`, `User.js`
- `scripts/setRole.js`

## Known Limitations

- Polling is static (max 30s, 1s interval), no WebSocket
- The sample-solution password prompt is a UX convenience only, not real access control (the solution is part of the lesson JSON shipped to the client)
- No admin UI for role assignment

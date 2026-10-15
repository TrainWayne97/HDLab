<!-- DEUTSCH / GERMAN -->
# Tutorial-Modus - Entwicklerhandbuch

> Aktualisiert auf den Stand Oktober 2026. Ergänzt `TUTORIAL_IMPLEMENTATION.md` (Feature-Übersicht), `TUTORIAL_INTEGRATION_GUIDE.md` (Einbindung) und die READMEs in `apps/frontend`/`apps/backend`.

## Architektur-Überblick

```
┌──────────────────────────────────────────────────────────────────────┐
│                           HDLab Frontend                             │
├──────────────────────────────────────────────────────────────────────┤
│  Topbar: Editor | Tutorial | Lehre ▾ (config/courses.js) | Module    │
│        │ navigate('/Tutorial') bzw. navigate('/Lehre/<id>')          │
│  ┌─────▼───────────────────────────────┐                             │
│  │ App.jsx + hooks/useRoute.js         │  URL -> { page, courseId,   │
│  │ (Seite kommt aus der URL)           │          lesson }           │
│  └─────┬───────────────────────────────┘                             │
│  ┌─────▼──────────────────────────────────────────────────────────┐  │
│  │ TutorialContainer (tutorialPath, courseId, routeLesson)        │  │
│  │ ┌───────────┐ ┌──────────────────────────┬──────────────────┐  │  │
│  │ │ LessonNav │ │ TutorialOverview         │                  │  │  │
│  │ │ Kapitel,  │ │   oder                   │                  │  │  │
│  │ │ Haken,    │ │ TutorialLesson:          │ Editor (Monaco)  │  │  │
│  │ │ Zähler    │ │  Erklärung, Tipps,       │ Reset, Fußzeile: │  │  │
│  │ │           │ │  Pfeile, Status-Marker   │ Einreichen,      │  │  │
│  │ │           │ │                          │ Testbench, Lösung│  │  │
│  │ │           │ ├──────────────────────────┴──────────────────┤  │  │
│  │ │           │ │ BottomDock: Ausgabe | Waveform | Netlist    │  │  │
│  │ └───────────┘ └─────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬─────────────────────────────────────────┘
                             │ API Calls (JWT via AuthContext.apiCall)
                   ┌─────────▼──────────────────────┐
                   │  HDLab Backend                 │
                   │ /api/tutorial/validate         │
                   │ /api/tutorial/progress?course= │
                   │ /api/modules, /api/auth/*      │
                   │ /api/simulations/:id/          │
                   │        waveform | netlist      │
                   └─────────┬──────────────────────┘
                             │ services/simulations.js
                   ┌─────────▼──────────────────────┐
                   │ RabbitMQ → Worker → Sim-       │
                   │ Container (Verilator + Yosys)   │
                   └────────────────────────────────┘

 Inhalte (statisch vom Frontend ausgeliefert, per GitHub Action synchronisiert):
   public/Tutorial/VerilogTutorialFormatted.md  <- Chaos-097/VerilogTutorial
   public/Kurse/ES1/ES1Tutorial.md              <- joernhoffmann/VerilogTutorial-ES1
```

Wichtig: Das Tutorial-Markdown wird **nicht** vom Backend ausgeliefert - `TutorialContainer.jsx` lädt es per `fetch()` als statische Datei aus `apps/frontend/public/`.

## Dateistruktur

```
/apps/frontend/src/
├── App.jsx                              # Haupt-App, rendert Editor/Tutorial/Kurs je nach URL
├── hooks/
│   ├── useRoute.js                      # URL <-> { page, courseId, lesson }
│   ├── useSimArtifacts.js               # lädt Waveform/Netlist einer Simulation
│   └── useDragSize.js                   # Editorbreite/Dockhöhe per Ziehen
├── config/
│   └── courses.js                       # Kursliste für das Lehre-Menü
├── contexts/
│   └── AuthContext.jsx                  # JWT-Auth, hasRole(), GitLab-Login
├── components/
│   ├── Topbar.jsx                       # Editor, Tutorial, Lehre-Menü, Module, Profil
│   ├── TutorialContainer.jsx            # Lädt Markdown, URL -> Ansicht/Lektion, letzte Lektion
│   ├── LessonNav.jsx                    # Lektionsbaum links
│   ├── TutorialOverview.jsx             # Kapitel-/Schwierigkeits-/Typ-Ansicht
│   ├── TutorialLesson.jsx               # Lektionsseite (Erklärung, Tipps, Editor, Validierung)
│   ├── BottomDock.jsx                   # Dock: Ausgabe / Waveform / Netlist
│   ├── WaveformViewer.jsx, NetlistViewer.jsx
│   └── Tutorial.css, Workbench.css      # Styling
└── utils/
    ├── tutorialParser.js                # Markdown-Parsing-Logik
    └── tutorialLoader.js                # Lade-Utility (Referenz, nicht im Einsatz)

/apps/backend/src/
├── config/jwt.js                        # JWT_SECRET (Pflicht, ohne Fallback)
├── routes.js                            # Projekte, Simulationen (inkl. waveform/netlist), svfile, health
├── routes/
│   ├── auth.js, oauth.js                # Registrierung/Login/Passwort-Reset/GitLab, Rollen
│   └── tutorial.js                      # /tutorial/validate, /tutorial/progress, /modules
├── services/simulations.js              # Projekt/Simulation anlegen + Job einreihen
├── middleware/auth.js                   # authenticateToken, requireRole
└── models/
    ├── User.js, TutorialProgress.js, ModuleLibrary.js

/apps/frontend/public/
├── Tutorial/VerilogTutorialFormatted.md + images/    # Verilog-Tutorial (Sync-Ziel)
└── Kurse/ES1/ES1Tutorial.md + images/                # Kurs ES1 (Sync-Ziel)
```

## Woher die Inhalte kommen

Die Markdown-Dateien in `apps/frontend/public/` sind **Sync-Ziele** - sie werden von GitHub Actions aus externen Repos überschrieben. Lektionen werden daher im jeweiligen Quell-Repo bearbeitet, nicht hier:

| Inhalt | Quell-Repo / Datei | Workflow | Auslöser |
|---|---|---|---|
| Verilog-Tutorial | `Chaos-097/VerilogTutorial`, `VerilogTutorial_V0.4.md` + `images/` | `sync-Tutorial.yml` | täglich 06:00 UTC, manuell |
| Kurs ES1 | `joernhoffmann/VerilogTutorial-ES1`, `ES1Tutorial.md` + `images/` | `sync-ES1.yml` | `repository_dispatch` bei jedem Push im Kurs-Repo, täglich 06:15 UTC, manuell |

Beide Workflows schreiben relative Bildpfade (`./images/...`) auf absolute um (`/Tutorial/images/...` bzw. `/Kurse/ES1/images/...`), committen nur bei Änderungen und bauen danach das Frontend auf dem Server neu (self-hosted Runner, nur über HTWK-VPN erreichbar). Lokal kann man die Datei in `public/` zum Ausprobieren direkt ändern - beim nächsten Sync ist die Änderung aber wieder weg.

## Neue Lektionen hinzufügen

### Schritt 1: Markdown im Quell-Repo bearbeiten

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

Optional **Tipps** (beliebig viele, in jeder Lektionsart möglich). Sie werden aus dem Lektionstext entfernt und erscheinen hinter dem Button "💡 Tipp anzeigen" einzeln nacheinander - vom allgemeinen zum konkreten Tipp sortieren:

````markdown
**HINT_START**
Eine Zahlenkonstante hat die Form `Bitbreite'BasisWert`.
**HINT_END**

**HINT_START**
Die erste Zuweisung lautet:

```verilog
assign a = 4'b1010;
```
**HINT_END**
````

Tipps bleiben normales Markdown (Text, `Code`, Listen, Codeblöcke). Beispiel mit drei Tipps: Übung 1.2 im ES1-Kurs.

**Wichtige Konventionen:**
- `lesson_id`: eindeutig, numerisch. Lockere Konvention: `<Kapitel>00`-`<Kapitel>99` (z.B. Kapitel 3 → 300-399), siehe bestehende Lektionen als Vorbild. Die `lesson_id` steht in der URL (`/Tutorial/<lesson_id>`) und ist der Schlüssel für den gespeicherten Fortschritt - bestehende IDs daher nicht umnummerieren
- `difficulty`: `intro` | `beginner` | `intermediate` | `advanced`
- `type`: `theory` | `exercise` | `project`
- **Kapitelzuordnung** erfolgt automatisch aus dem Lektionstitel: ein Titel wie `"3. Erweiterte Signale"` (Zahl + Punkt + Leerzeichen) markiert die Kapitel-Wurzel, `"3.1 Breite von Signalen"` (Zahl.Zahl) ein Unterkapitel von Kapitel 3. Titel ohne führende Nummer (z.B. "Vorwort") landen in der Gruppe "Einführung". Diese Zuordnung passiert in `groupByChapter()`/`getChapterKey()` in `tutorialParser.js` - **keine** manuelle Konfiguration nötig
- **Inhaltsverzeichnis-Links** (`[0.1 Ziel](#01-ziel)`) funktionieren über `anchorMap`: Slugs werden wie bei GitHub aus Kapitel- **und** Zwischenüberschriften berechnet (Duplikate bekommen `-1`, `-2`, ...). Das Inhaltsverzeichnis selbst wird nicht generiert, neue Einträge müssen von Hand ergänzt werden
- `test_solved` in der Testbench **muss** ein unpacked Array sein (`output logic test_solved [TEST_LENGTH]`), kein einzelner Bit-Vektor - siehe Abschnitt "Validierungslogik" unten
- Die Netlist-Ansicht zeigt den Schaltplan von `main.sv` (dem Nutzercode); Yosys versteht weniger SystemVerilog als Verilator, bei manchen Übungen bleibt der Reiter daher leer

### Schritt 2: Der Parser übernimmt automatisch

`tutorialParser.js` parst die Datei bei jedem Laden der Tutorial-Seite neu (kein Build-Schritt, kein Cache) und:
- extrahiert Erklärung, Exercise-Template, Lösung, Testbench und Tipps
- ordnet die Lektion in `byDifficulty`, `byType` und `byChapter` ein und baut `anchorMap`
- Anpassungen an der `.md`-Datei sind lokal nach einem Browser-Reload sichtbar; auf dem Server nach Sync + Frontend-Rebuild

## Neuen Kurs anlegen

1. Kurs-Repo mit Markdown im selben Format + `images/` anlegen
2. Ordner `apps/frontend/public/Kurse/<Ordner>/` anlegen (initial befüllen oder per Sync)
3. Eintrag in `apps/frontend/src/config/courses.js` (`id`, `shortTitle`, `title`, `subtitle`, `tutorialPath`) - die `id` ist URL-Bestandteil (`/Lehre/<id>`) und `courseId` für den Fortschritt im Backend, nachträglich nicht ändern; erlaubt ist `^[a-z0-9_-]{1,32}$`
4. Sync-Workflow nach dem Vorbild von `.github/workflows/sync-ES1.yml` anlegen (`EXTERNAL_REPO`, `EXTERNAL_MD`, `TARGET_DIR`, Bildpfad-Umschreibung, `concurrency: tutorial-sync`); für Sofort-Sync im Kurs-Repo einen Workflow, der `repository_dispatch` auslöst

Der Fortschritt ist pro Kurs getrennt (`TutorialProgress.courseId`), gleiche `lesson_id`s in verschiedenen Kursen kollidieren nicht.

## Validierungslogik

### Wie die Testbench-Validierung funktioniert

1. **Nutzer klickt "▶ Lösung einreichen"** → Frontend sendet `{ lessonId, moduleCode, testbench }` an `POST /api/tutorial/validate` (authentifiziert)
2. **Backend instrumentiert die Testbench** (`injectTestSolvedDisplay()` in `apps/backend/src/routes/tutorial.js`): fügt vor jedem `$finish;` einen Block ein, der über das Array `test_solved` iteriert und es als `TEST_SOLVED=<bits>`-Zeile ausgibt
3. **Backend legt Projekt + Simulation für den Nutzer an** - direkt über `src/services/simulations.js` (`createProject()`, `createSimulation()`), nicht über die eigene REST-API; mit `settings: { generateWave: true, generateNetlist: true }`
4. **Worker führt die Simulation aus** (siehe Worker-README) - weiß nichts von "Tutorial" oder "Validierung", führt einfach `main.sv` + `tb.sv` aus und speichert Log, VCD und Schaltplan
5. **Backend pollt** bis zu 30 Sekunden direkt in MongoDB auf ein Ergebnis
6. **Log-Auswertung** (`checkValidationLog()`):
   - Compile-/Laufzeitfehler (`%Error`, `compilation error`, `syntax error`) → sofort `false`
   - `TEST_SOLVED=<bits>`-Zeile gefunden → bestanden nur wenn **alle** Bits `1` sind
   - Fallback (keine `TEST_SOLVED=`-Zeile, z.B. bei nicht konventionsgerechten/alten Testbenches): generische `pass`/`fail`-Schlüsselwörter im Log
7. Ergebnis geht zurück ans Frontend; das Dock zeigt Ausgabe, Waveform und Netlist (bei Fehlschlag klappt es auf), bei Erfolg wird der Code als Modul gespeichert und der Fortschritt als gelöst markiert

### Beispiel-Antworten

**Erfolg:**
```json
{ "success": true, "fullLog": "...", "simulationId": "<id>", "hasWaveform": true, "hasNetlist": true }
```

**Fehlschlag:**
```json
{
  "success": false,
  "errors": "... relevante Fehler-/Warnungszeilen (max. 20) ...",
  "fullLog": "... vollständiges Log (max. 20.000 Zeichen) ...",
  "simulationId": "<id>",
  "hasWaveform": true,
  "hasNetlist": false
}
```

## Zustandsverwaltung (State Management)

### Seite und Lektion kommen aus der URL

```javascript
// App.jsx
const [{ page, courseId, lesson }, navigate] = useRoute();
// page: 'home' | 'tutorial' | 'course'
// lesson: lesson_id als String, 'Uebersicht' oder null
```

Es gibt keinen `currentPage`- oder `currentLessonId`-State mehr. `TutorialContainer` leitet Ansicht (Übersicht/Lektion) und aktuelle Lektion aus `routeLesson` ab und ändert sie nur über `onNavigate(lesson, { replace })`. Dadurch funktionieren Browser-Pfeile, Reload und Links auf einzelne Lektionen. Die zuletzt geöffnete Lektion steht in `localStorage` unter `hdlab-tutorial-last-lesson-<courseId|verilog>`.

### Tutorial-Daten in `TutorialContainer.jsx`

```javascript
// Rückgabe von parseTutorialFromFile() / parseTutorialFromMarkdown():
{
  lessons: { lessonId: LessonObject, ... },  // LessonObject u.a. mit hints[], headingAnchors[]
  lessonIds: [lessonId, ...],                // Dokumentreihenfolge
  byDifficulty: { intro: [...], beginner: [...], intermediate: [...], advanced: [...] },
  byType: { theory: [...], exercise: [...], project: [...] },
  byChapter: [{ key: 'intro', lessonIds: [...] }, { key: '0', lessonIds: [...] }, ...],
  anchorMap: { '01-ziel': 1, 'schnittstelle-1': 204, ... },
}
```

Zusätzlich hält `TutorialContainer` `completedIds` (aus `GET /api/tutorial/progress[?course=]`, für die Haken im Lektionsbaum).

### Navigations-Handler (`TutorialContainer.jsx`)
- `handleStartLesson(lessonId, anchor?)` - Lektion öffnen (optional zu einer Zwischenüberschrift scrollen); genutzt von `LessonNav`, `TutorialOverview` und Inhaltsverzeichnis-Links
- `handleShowOverview()` - Übersicht (`/.../Uebersicht`)
- `handleNextLesson()` / `handlePreviousLesson()` - Pfeile am Titel und Buttons am Ende (nie gesperrt)
- `handleLessonCompleted(lessonId)` - setzt den Haken im Lektionsbaum nach erfolgreicher Validierung

## Anpassungspunkte

### 1. Farben und Layout ändern
`apps/frontend/src/components/Tutorial.css` (Markdown, Übersicht, Kapitel-Dropdowns) und `Workbench.css` (Lektionsbaum, Workbench, Dock, Tipps, Passwort-Dialog), jeweils mit Light- und Dark-Mode-Regeln.

### 2. Validierungsregeln anpassen
`checkValidationLog()` in `apps/backend/src/routes/tutorial.js`:
```javascript
function checkValidationLog(log) {
  // Eigene Pattern-Matching-Logik hier
}
```

### 3. Editor-Theme ändern
`editorTheme`-Prop an `<TutorialContainer>` durchreichen (`'vs-light'` oder `'vs-dark'`, folgt dem Theme in den Einstellungen).

### 4. Weitere Sprachen hinzufügen
`TRANSLATIONS`-Objekt in den jeweiligen Tutorial-Komponenten (`TutorialLesson.jsx`, `LessonNav.jsx`, `TutorialOverview.jsx`, `BottomDock.jsx`, `WaveformViewer.jsx`, ...) erweitern:
```javascript
const TRANSLATIONS = {
  de: { /* Deutsch */ },
  en: { /* Englisch */ },
  es: { /* Spanisch - hier ergänzen */ },
};
```

### 5. Musterlösungs-Passwort ändern
`VITE_TUTORIAL_SOLUTION_PASSWORD` in `.env.runtime` (gesetzt von `setup.sh`), danach Frontend neu starten. Nutzer mit Rolle `admin`/`developer` umgehen die Abfrage (siehe Backend-README Abschnitt 14.1). Das Passwort steckt im ausgelieferten Frontend - kein echter Schutz.

## Tutorial testen

### Manuelle Testschritte

1. **App starten** - `./start.sh local`, dann `http://localhost:8080` (Gateway) oder `http://localhost:5173` öffnen und einloggen
2. **"Tutorial"** in der Topbar klicken → URL wird `/Tutorial/<lesson_id>` (zuletzt besuchte bzw. erste Lektion)
3. **Lektionsbaum prüfen:**
   - ✓ Kapitel aufklappbar, Theorie/Übung unterscheidbar, Haken bei gelösten Übungen, Zähler pro Kapitel
   - ✓ "Übersicht" führt zu `/Tutorial/Uebersicht` mit Kapitel-Dropdowns und Typ-Badges
4. **Übungs-Lektion auswählen:**
   - ✓ Erklärung wird gerendert (inkl. Tabellen, HTML-Blöcke, Bilder, Verilog-Highlighting)
   - ✓ Tipps lassen sich einzeln aufdecken und wieder verbergen
   - ✓ Editor rechts, Breite per Ziehen änderbar; Reset-Button setzt zurück (mit Bestätigung)
   - ✓ "Testbench anzeigen" nur lesbar; "Lösung anzeigen" nur nach korrektem Passwort im Dialog (außer `admin`/`developer`)
5. **Validierung testen:**
   - ✓ Falscher Code → "✗ Nicht korrekt" + Fehlerzeilen, Dock klappt auf
   - ✓ Korrekter Code → "✓ Richtig gelöst!", Status-Marker "✓ Abgeschlossen", Haken im Lektionsbaum
   - ✓ Waveform- und Netlist-Reiter zeigen die Validierungs-Simulation
6. **Navigation testen:**
   - ✓ Pfeile am Titel und Buttons am Ende wechseln die Lektion, die URL ändert sich mit
   - ✓ Browser-Zurück springt zur vorherigen Lektion, Reload bleibt auf der Lektion
   - ✓ Links im Inhaltsverzeichnis springen zur Lektion bzw. zum Abschnitt
7. **Kurs testen:** "Lehre" → "ES1" → `/Lehre/es1/<lesson_id>`, Fortschritt ist vom Verilog-Tutorial getrennt

## Bekannte Probleme & Lösungen

### Problem: Tutorial-Inhalt lädt nicht
**Lösung:** Prüfen, ob die Datei unter `apps/frontend/public/` existiert und per Browser direkt erreichbar ist (`/Tutorial/VerilogTutorialFormatted.md`, `/Kurse/ES1/ES1Tutorial.md`). Auf dem Server: wurde das Frontend nach dem Sync neu gebaut?

### Problem: Änderung an der Lektion ist nach einiger Zeit wieder weg
**Lösung:** Die Datei in `public/` wurde vom Sync überschrieben - Änderungen im Quell-Repo machen (siehe "Woher die Inhalte kommen").

### Problem: Validierung schlägt immer fehl
**Lösung:** Prüfen, ob die Testbench `test_solved` als **unpacked Array** deklariert (`output logic test_solved [N]`), nicht als einzelnen Vektor. Im Panel "Vollständige Ausgabe anzeigen" nachsehen, ob es eine `TEST_SOLVED=`-Zeile gibt. RabbitMQ/Worker-Logs prüfen.

### Problem: Editor-Theme wird nicht angewendet
**Lösung:** Sicherstellen, dass `editorTheme` einem gültigen Monaco-Theme-Namen entspricht.

### Problem: Lektion erscheint nicht in der Übersicht / im Lektionsbaum
**Lösung:** `lesson_id` auf Eindeutigkeit prüfen, Titel-Format für die Kapitelzuordnung prüfen (siehe "Neue Lektionen hinzufügen" oben).

### Problem: Netlist-Reiter bleibt leer
**Lösung:** Yosys konnte `main.sv` nicht verarbeiten. Die Meldung `[Entrypoint] Netlist konnte nicht erzeugt werden` steht im Worker-Log (`docker compose logs worker`), nicht im Simulationslog.

## Mögliche Erweiterungen

1. Musterlösungen serverseitig ausliefern und per `requireRole` schützen (aktuell steckt die Lösung im Markdown, `requireRole` schützt bisher nur `/api/svfile`)
2. Admin-UI für Rollenvergabe (aktuell nur CLI-Skript)
3. Automatisch generiertes Inhaltsverzeichnis
4. Zeit-Tracking pro Lektion
5. Peer-Code-Review

---

# English Documentation

> Updated to the state of October 2026. Complements `TUTORIAL_IMPLEMENTATION.md` (feature overview), `TUTORIAL_INTEGRATION_GUIDE.md` (wiring) and the READMEs in `apps/frontend`/`apps/backend`.

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                           HDLab Frontend                             │
├──────────────────────────────────────────────────────────────────────┤
│  Topbar: Editor | Tutorial | Lehre ▾ (config/courses.js) | Module    │
│        │ navigate('/Tutorial') or navigate('/Lehre/<id>')            │
│  ┌─────▼───────────────────────────────┐                             │
│  │ App.jsx + hooks/useRoute.js         │  URL -> { page, courseId,   │
│  │ (page comes from the URL)           │          lesson }           │
│  └─────┬───────────────────────────────┘                             │
│  ┌─────▼──────────────────────────────────────────────────────────┐  │
│  │ TutorialContainer (tutorialPath, courseId, routeLesson)        │  │
│  │ ┌───────────┐ ┌──────────────────────────┬──────────────────┐  │  │
│  │ │ LessonNav │ │ TutorialOverview         │                  │  │  │
│  │ │ chapters, │ │   or                     │                  │  │  │
│  │ │ checks,   │ │ TutorialLesson:          │ Editor (Monaco)  │  │  │
│  │ │ counters  │ │  explanation, hints,     │ Reset, footer:   │  │  │
│  │ │           │ │  arrows, status marker   │ submit,          │  │  │
│  │ │           │ │                          │ testbench, sol.  │  │  │
│  │ │           │ ├──────────────────────────┴──────────────────┤  │  │
│  │ │           │ │ BottomDock: Output | Waveform | Netlist     │  │  │
│  │ └───────────┘ └─────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬─────────────────────────────────────────┘
                             │ API calls (JWT via AuthContext.apiCall)
                   ┌─────────▼──────────────────────┐
                   │  HDLab Backend                 │
                   │ /api/tutorial/validate         │
                   │ /api/tutorial/progress?course= │
                   │ /api/modules, /api/auth/*      │
                   │ /api/simulations/:id/          │
                   │        waveform | netlist      │
                   └─────────┬──────────────────────┘
                             │ services/simulations.js
                   ┌─────────▼──────────────────────┐
                   │ RabbitMQ → worker → sim        │
                   │ container (Verilator + Yosys)  │
                   └────────────────────────────────┘

 Content (served statically by the frontend, synced via GitHub Action):
   public/Tutorial/VerilogTutorialFormatted.md  <- Chaos-097/VerilogTutorial
   public/Kurse/ES1/ES1Tutorial.md              <- joernhoffmann/VerilogTutorial-ES1
```

Important: the tutorial markdown is **not** served by the backend - `TutorialContainer.jsx` fetches it via `fetch()` as a static file from `apps/frontend/public/`.

## File Structure

```
/apps/frontend/src/
├── App.jsx                              # main app, renders editor/tutorial/course based on the URL
├── hooks/
│   ├── useRoute.js                      # URL <-> { page, courseId, lesson }
│   ├── useSimArtifacts.js               # loads waveform/netlist of a simulation
│   └── useDragSize.js                   # editor width/dock height by dragging
├── config/
│   └── courses.js                       # course list for the "Lehre" menu
├── contexts/
│   └── AuthContext.jsx                  # JWT auth, hasRole(), GitLab login
├── components/
│   ├── Topbar.jsx                       # Editor, Tutorial, "Lehre" menu, modules, profile
│   ├── TutorialContainer.jsx            # loads markdown, URL -> view/lesson, last lesson
│   ├── LessonNav.jsx                    # lesson tree on the left
│   ├── TutorialOverview.jsx             # chapter/difficulty/type view
│   ├── TutorialLesson.jsx               # lesson page (explanation, hints, editor, validation)
│   ├── BottomDock.jsx                   # dock: output / waveform / netlist
│   ├── WaveformViewer.jsx, NetlistViewer.jsx
│   └── Tutorial.css, Workbench.css      # styling
└── utils/
    ├── tutorialParser.js                # markdown parsing logic
    └── tutorialLoader.js                # loading utility (reference, not in use)

/apps/backend/src/
├── config/jwt.js                        # JWT_SECRET (required, no fallback)
├── routes.js                            # projects, simulations (incl. waveform/netlist), svfile, health
├── routes/
│   ├── auth.js, oauth.js                # registration/login/password reset/GitLab, roles
│   └── tutorial.js                      # /tutorial/validate, /tutorial/progress, /modules
├── services/simulations.js              # create project/simulation + enqueue job
├── middleware/auth.js                   # authenticateToken, requireRole
└── models/
    ├── User.js, TutorialProgress.js, ModuleLibrary.js

/apps/frontend/public/
├── Tutorial/VerilogTutorialFormatted.md + images/    # Verilog tutorial (sync target)
└── Kurse/ES1/ES1Tutorial.md + images/                # course ES1 (sync target)
```

## Where the Content Comes From

The markdown files in `apps/frontend/public/` are **sync targets** - GitHub Actions overwrite them from external repos. Lessons are therefore edited in the respective source repo, not here:

| Content | Source repo / file | Workflow | Triggers |
|---|---|---|---|
| Verilog tutorial | `Chaos-097/VerilogTutorial`, `VerilogTutorial_V0.4.md` + `images/` | `sync-Tutorial.yml` | daily 06:00 UTC, manual |
| Course ES1 | `joernhoffmann/VerilogTutorial-ES1`, `ES1Tutorial.md` + `images/` | `sync-ES1.yml` | `repository_dispatch` on every push in the course repo, daily 06:15 UTC, manual |

Both workflows rewrite relative image paths (`./images/...`) to absolute ones (`/Tutorial/images/...` or `/Kurse/ES1/images/...`), commit only if something changed and then rebuild the frontend on the server (self-hosted runner, reachable only via the HTWK VPN). Locally you can edit the file in `public/` directly to try things out - but the change is gone after the next sync.

## Adding New Lessons

### Step 1: Edit the markdown in the source repo

There is **no** separate metadata file - metadata lives directly as HTML-comment frontmatter before each lesson:

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

For exercises (`type: "exercise"`) additionally:

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
  // solution
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
  // ... test vectors, fill test_solved[i] via === comparison ...
  $finish;
endmodule
```
**TESTBENCH_END**
````

Optional **hints** (any number, possible in every lesson type). They are removed from the lesson text and revealed one at a time behind the "💡 Show hint" button - order them from general to specific:

````markdown
**HINT_START**
A number literal has the form `width'baseValue`.
**HINT_END**

**HINT_START**
The first assignment is:

```verilog
assign a = 4'b1010;
```
**HINT_END**
````

Hints are plain markdown (text, `code`, lists, code blocks). Example with three hints: exercise 1.2 in the ES1 course.

**Key conventions:**
- `lesson_id`: unique, numeric. Loose convention: `<chapter>00`-`<chapter>99` (e.g. chapter 3 → 300-399), use existing lessons as a reference. The `lesson_id` is part of the URL (`/Tutorial/<lesson_id>`) and the key for stored progress - don't renumber existing ids
- `difficulty`: `intro` | `beginner` | `intermediate` | `advanced`
- `type`: `theory` | `exercise` | `project`
- **Chapter assignment** happens automatically from the lesson title: a title like `"3. Erweiterte Signale"` (number + dot + space) marks the chapter root, `"3.1 Breite von Signalen"` (number.number) a sub-chapter of chapter 3. Titles without a leading number (e.g. "Vorwort") go into the "Introduction" group. This is done in `groupByChapter()`/`getChapterKey()` in `tutorialParser.js` - **no** manual configuration needed
- **Table-of-contents links** (`[0.1 Ziel](#01-ziel)`) work via `anchorMap`: slugs are computed like GitHub's from chapter **and** sub-headings (duplicates get `-1`, `-2`, ...). The table of contents itself isn't generated, new entries must be added by hand
- `test_solved` in the testbench **must** be an unpacked array (`output logic test_solved [TEST_LENGTH]`), not a single bit vector - see "Validation Logic" below
- The netlist view shows the schematic of `main.sv` (the user's code); Yosys understands less SystemVerilog than Verilator, so the tab stays empty for some exercises

### Step 2: The parser handles the rest automatically

`tutorialParser.js` re-parses the file every time the tutorial page loads (no build step, no cache) and:
- extracts explanation, exercise template, solution, testbench and hints
- sorts the lesson into `byDifficulty`, `byType` and `byChapter` and builds `anchorMap`
- changes to the `.md` file are visible locally after a browser reload; on the server after sync + frontend rebuild

## Adding a New Course

1. Create a course repo with markdown in the same format + `images/`
2. Create the folder `apps/frontend/public/Kurse/<folder>/` (fill it initially or via sync)
3. Add an entry to `apps/frontend/src/config/courses.js` (`id`, `shortTitle`, `title`, `subtitle`, `tutorialPath`) - the `id` is part of the URL (`/Lehre/<id>`) and the `courseId` for progress in the backend, don't change it later; allowed is `^[a-z0-9_-]{1,32}$`
4. Add a sync workflow modeled on `.github/workflows/sync-ES1.yml` (`EXTERNAL_REPO`, `EXTERNAL_MD`, `TARGET_DIR`, image path rewrite, `concurrency: tutorial-sync`); for instant syncs, add a workflow in the course repo that sends a `repository_dispatch`

Progress is separate per course (`TutorialProgress.courseId`), identical `lesson_id`s in different courses don't collide.

## Validation Logic

### How Testbench Validation Works

1. **User clicks "▶ Submit solution"** → frontend sends `{ lessonId, moduleCode, testbench }` to `POST /api/tutorial/validate` (authenticated)
2. **Backend instruments the testbench** (`injectTestSolvedDisplay()` in `apps/backend/src/routes/tutorial.js`): inserts a block before every `$finish;` that iterates over the `test_solved` array and prints it as a `TEST_SOLVED=<bits>` line
3. **Backend creates project + simulation for the user** - directly via `src/services/simulations.js` (`createProject()`, `createSimulation()`), not via its own REST API; with `settings: { generateWave: true, generateNetlist: true }`
4. **Worker runs the simulation** (see worker README) - knows nothing about "tutorial" or "validation", simply runs `main.sv` + `tb.sv` and stores log, VCD and schematic
5. **Backend polls** MongoDB directly for a result for up to 30 seconds
6. **Log evaluation** (`checkValidationLog()`):
   - Compile/runtime errors (`%Error`, `compilation error`, `syntax error`) → immediately `false`
   - `TEST_SOLVED=<bits>` line found → passes only if **all** bits are `1`
   - Fallback (no `TEST_SOLVED=` line, e.g. non-conforming/legacy testbenches): generic `pass`/`fail` keywords in the log
7. The result goes back to the frontend; the dock shows output, waveform and netlist (it expands on failure), on success the code is saved as a module and the progress is marked as solved

### Example Responses

**Success:**
```json
{ "success": true, "fullLog": "...", "simulationId": "<id>", "hasWaveform": true, "hasNetlist": true }
```

**Failure:**
```json
{
  "success": false,
  "errors": "... relevant error/warning lines (max 20) ...",
  "fullLog": "... full log (max 20,000 chars) ...",
  "simulationId": "<id>",
  "hasWaveform": true,
  "hasNetlist": false
}
```

## State Management

### Page and lesson come from the URL

```javascript
// App.jsx
const [{ page, courseId, lesson }, navigate] = useRoute();
// page: 'home' | 'tutorial' | 'course'
// lesson: lesson_id as a string, 'Uebersicht' or null
```

There is no `currentPage` or `currentLessonId` state anymore. `TutorialContainer` derives the view (overview/lesson) and the current lesson from `routeLesson` and only changes them via `onNavigate(lesson, { replace })`. That's what makes browser back/forward, reload and links to individual lessons work. The last opened lesson is stored in `localStorage` as `hdlab-tutorial-last-lesson-<courseId|verilog>`.

### Tutorial data in `TutorialContainer.jsx`

```javascript
// Return value of parseTutorialFromFile() / parseTutorialFromMarkdown():
{
  lessons: { lessonId: LessonObject, ... },  // LessonObject incl. hints[], headingAnchors[]
  lessonIds: [lessonId, ...],                // document order
  byDifficulty: { intro: [...], beginner: [...], intermediate: [...], advanced: [...] },
  byType: { theory: [...], exercise: [...], project: [...] },
  byChapter: [{ key: 'intro', lessonIds: [...] }, { key: '0', lessonIds: [...] }, ...],
  anchorMap: { '01-ziel': 1, 'schnittstelle-1': 204, ... },
}
```

`TutorialContainer` also holds `completedIds` (from `GET /api/tutorial/progress[?course=]`, for the check marks in the lesson tree).

### Navigation Handlers (`TutorialContainer.jsx`)
- `handleStartLesson(lessonId, anchor?)` - open a lesson (optionally scroll to a sub-heading); used by `LessonNav`, `TutorialOverview` and table-of-contents links
- `handleShowOverview()` - overview (`/.../Uebersicht`)
- `handleNextLesson()` / `handlePreviousLesson()` - arrows at the title and buttons at the end (never locked)
- `handleLessonCompleted(lessonId)` - sets the check mark in the lesson tree after a successful validation

## Customization Points

### 1. Change colors and layout
`apps/frontend/src/components/Tutorial.css` (markdown, overview, chapter dropdowns) and `Workbench.css` (lesson tree, workbench, dock, hints, password dialog), each with light and dark mode rules.

### 2. Modify Validation Rules
`checkValidationLog()` in `apps/backend/src/routes/tutorial.js`:
```javascript
function checkValidationLog(log) {
  // custom pattern matching logic here
}
```

### 3. Change Editor Theme
Pass the `editorTheme` prop to `<TutorialContainer>` (`'vs-light'` or `'vs-dark'`, follows the theme in the settings).

### 4. Add More Languages
Extend the `TRANSLATIONS` object in the respective tutorial components (`TutorialLesson.jsx`, `LessonNav.jsx`, `TutorialOverview.jsx`, `BottomDock.jsx`, `WaveformViewer.jsx`, ...):
```javascript
const TRANSLATIONS = {
  de: { /* German */ },
  en: { /* English */ },
  es: { /* Spanish - add here */ },
};
```

### 5. Change the Sample-Solution Password
`VITE_TUTORIAL_SOLUTION_PASSWORD` in `.env.runtime` (set by `setup.sh`), then restart the frontend. Users with role `admin`/`developer` bypass the prompt (see backend README section 14.1). The password is shipped in the frontend - not real protection.

## Testing the Tutorial

### Manual Testing Steps

1. **Start the app** - `./start.sh local`, then open `http://localhost:8080` (gateway) or `http://localhost:5173` and log in
2. **Click "Tutorial"** in the topbar → URL becomes `/Tutorial/<lesson_id>` (last visited or first lesson)
3. **Check the lesson tree:**
   - ✓ Chapters collapsible, theory/exercise distinguishable, check marks for solved exercises, counter per chapter
   - ✓ "Overview" leads to `/Tutorial/Uebersicht` with chapter dropdowns and type badges
4. **Select an exercise lesson:**
   - ✓ Explanation renders (incl. tables, HTML blocks, images, Verilog highlighting)
   - ✓ Hints can be revealed one by one and hidden again
   - ✓ Editor on the right, width resizable; reset button resets (with confirmation)
   - ✓ "Show testbench" read-only; "Show solution" only after the correct password in the dialog (except `admin`/`developer`)
5. **Test validation:**
   - ✓ Wrong code → "✗ Incorrect" + error lines, dock expands
   - ✓ Correct code → "✓ Correct!", status marker "✓ Completed", check mark in the lesson tree
   - ✓ Waveform and netlist tabs show the validation simulation
6. **Test navigation:**
   - ✓ Arrows at the title and buttons at the end switch lessons, the URL follows
   - ✓ Browser back goes to the previous lesson, reload stays on the lesson
   - ✓ Table-of-contents links jump to the lesson or section
7. **Test a course:** "Lehre" → "ES1" → `/Lehre/es1/<lesson_id>`, progress is separate from the Verilog tutorial

## Common Issues & Solutions

### Issue: Tutorial content not loading
**Solution:** Check that the file exists under `apps/frontend/public/` and is reachable directly in the browser (`/Tutorial/VerilogTutorialFormatted.md`, `/Kurse/ES1/ES1Tutorial.md`). On the server: was the frontend rebuilt after the sync?

### Issue: A change to a lesson disappears after a while
**Solution:** The file in `public/` was overwritten by the sync - make the change in the source repo (see "Where the Content Comes From").

### Issue: Validation always fails
**Solution:** Check that the testbench declares `test_solved` as an **unpacked array** (`output logic test_solved [N]`), not a single vector. Check in the "Vollständige Ausgabe anzeigen" panel whether there is a `TEST_SOLVED=` line. Check RabbitMQ/worker logs.

### Issue: Editor theme not applying
**Solution:** Make sure `editorTheme` matches a valid Monaco theme name.

### Issue: Lesson not appearing in the overview / lesson tree
**Solution:** Check `lesson_id` uniqueness and the title format for chapter assignment (see "Adding New Lessons" above).

### Issue: Netlist tab stays empty
**Solution:** Yosys couldn't process `main.sv`. The message `[Entrypoint] Netlist konnte nicht erzeugt werden` is in the worker log (`docker compose logs worker`), not in the simulation log.

## Possible Enhancements

1. Serve sample solutions from the backend and protect them with `requireRole` (currently the solution is part of the markdown; `requireRole` only guards `/api/svfile` so far)
2. Admin UI for role assignment (currently CLI script only)
3. Auto-generated table of contents
4. Time tracking per lesson
5. Peer code review

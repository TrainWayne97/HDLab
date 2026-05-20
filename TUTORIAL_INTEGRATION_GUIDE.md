/**
 * INTEGRATIONS-GUIDE: Neuer Tutorial Parser
 * 
 * Wie man den neuen Tutorial System mit Markdown-Parser in die bestehende App integriert
 */

// ============================================================
// OPTION 1: In App.jsx oder Index-Route verwenden
// ============================================================

import TutorialContainer from './components/TutorialContainer';

function App() {
  return (
    <div className="app">
      {/* ... andere Routes ... */}
      
      <TutorialContainer 
        tutorialPath="/Tutorial/VerilogTutorialFormatted.md"
        uiLanguage="de"
        editorTheme="vs-light"
      />
    </div>
  );
}

// ============================================================
// OPTION 2: Als separatte Route in React Router
// ============================================================

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TutorialContainer from './components/TutorialContainer';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ... andere Routes ... */}
        <Route path="/tutorial" element={
          <TutorialContainer 
            tutorialPath="/Tutorial/VerilogTutorialFormatted.md"
            uiLanguage="de"
            editorTheme="vs-light"
          />
        } />
      </Routes>
    </BrowserRouter>
  );
}

// ============================================================
// OPTION 3: Mit URL-Parametern für flexible Tutorialzahl
// ============================================================

import { useParams } from 'react-router-dom';

function TutorialRoute() {
  const { tutorialName = 'VerilogTutorialFormatted' } = useParams();
  
  return (
    <TutorialContainer 
      tutorialPath={`/Tutorial/${tutorialName}.md`}
      uiLanguage="de"
      editorTheme="vs-light"
    />
  );
}

// ============================================================
// WICHTIG: Datei-Struktur & Voraussetzungen
// ============================================================

/*

Deine Projekt-Struktur sollte so aussehen:

/home/aitor/git_repos/HDLab/
├── apps/
│   ├── frontend/
│   │   ├── public/
│   │   │   └── Tutorial/
│   │   │       └── VerilogTutorialFormatted.md  ← Die Markdown-Datei HIER
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── TutorialContainer.jsx       ← Neu erstellt
│   │   │   │   ├── TutorialOverview.jsx        ← Aktualisiert
│   │   │   │   ├── TutorialLesson.jsx          ← Aktualisiert
│   │   │   │   └── Tutorial.css
│   │   │   └── utils/
│   │   │       ├── tutorialParser.js           ← Aktualisiert (Main)
│   │   │       └── tutorialLoader.js           ← Neu erstellt (optional)
│   │   └── package.json
│   └── backend/
│       └── src/
│           └── routes/
│               └── tutorials.js                 ← Für Validierung (optional)
└── Tutorial/
    └── VerilogTutorialFormatted.md             ← Original (zur Referenz)

*/

// ============================================================
// DATEI-SETUP: Die Markdown-Datei muss im public/ Ordner sein!
// ============================================================

/*

WICHTIG: Die VerilogTutorialFormatted.md muss sich befinden in:
  apps/frontend/public/Tutorial/VerilogTutorialFormatted.md

Falls es dort noch nicht ist, kopieren Sie die Datei:
  1. Von: /home/aitor/git_repos/HDLab/Tutorial/VerilogTutorialFormatted.md
  2. Nach: /home/aitor/git_repos/HDLab/apps/frontend/public/Tutorial/VerilogTutorialFormatted.md

Der Parser lädt die Datei mit fetch(), das only aus dem public/ Ordner möglich ist!

*/

// ============================================================
// OPTIONAL: Backend-Integration für Code-Validierung
// ============================================================

/*

Der aktuelle TutorialLesson.jsx sendet Validierungsanfragen an:
  POST /api/tutorials/validate

Falls ihr Backend das nicht unterstützt, können Sie:

1. Den Validierungs-Button deaktivieren (TutorialLesson.jsx)
   - handleValidate() würde nicht aufgerufen

2. Den Validierungs-Endpoint implementieren (Backend):
   
   app.post('/api/tutorials/validate', async (req, res) => {
     const { lessonId, moduleCode, moduleName, testbench } = req.body;
     
     // Führe Verilog-Synthese oder Simulation durch
     // Validiere den Code
     // Gebe Ergebnis zurück
     
     res.json({
       success: true/false,
       errors: 'Error details if failed'
     });
   });

3. Oder einfach localStorage verwenden für Tracking:
   - Lösung wird im Browser gespeichert
   - Keine Backend-Validierung nötig

*/

// ============================================================
// KONFIGURIERBARE PARAMETER
// ============================================================

/*

<TutorialContainer 
  // Pfad zur Markdown-Datei (relativ zu public/)
  tutorialPath="/Tutorial/VerilogTutorialFormatted.md"
  
  // UI-Sprache ('de' oder 'en')
  uiLanguage="de"
  
  // Monaco-Editor Theme
  editorTheme="vs-light" | "vs-dark" | "hc-black"
/>

*/

// ============================================================
// DEBUGGING & LOGGING
// ============================================================

/*

Der Parser gibt viele Console-Logs aus für Debugging:

[Tutorial] Parsing Markdown tutorial...
[Tutorial] ✓ Lektion 1: "Vorwort" (theory)
[Tutorial] ✓ Lektion 2: "Exkurs: Die Highs and Lows des Computers" (theory)
...
[Tutorial] Erfolgreich 23 Lektionen geladen

[TutorialContainer] Loading tutorial from: /Tutorial/VerilogTutorialFormatted.md
[TutorialContainer] Tutorial loaded successfully: {...}

[TutorialLesson] Lesson loaded: {
  id: 10,
  title: 'Grundoperation: NAND',
  type: 'exercise',
  ...
}

Wenn Sie Fehler sehen:
  1. Öffnen Sie Browser DevTools (F12)
  2. Gehen Sie zum Console-Tab
  3. Suchen Sie nach "[Tutorial]" Logs
  4. Überprüfen Sie den Fehler

*/

// ============================================================
// NEUE KOMPONENTEN ÜBERSICHT
// ============================================================

/*

TutorialContainer.jsx (NEU)
├─ Lädt die Markdown-Datei
├─ Managed den Parser
├─ Koordiniert Zustandsverwaltung
└─ Wechselt zwischen Übersicht und Lektion

TutorialOverview.jsx (AKTUALISIERT)
├─ Zeigt Lektionsliste
├─ 3 View-Modi: Schwierigkeit, Bereich, Typ
├─ Neue Metainfos anzeigen
└─ Navigation zur Lektion

TutorialLesson.jsx (AKTUALISIERT)
├─ Zeigt Lektionsinhalte
├─ Editor für Übungen
├─ Lösung versteckt/sichtbar
├─ Validierung integriert
└─ Vor/Zurück Navigation

tutorialParser.js (AKTUALISIERT - MAIN)
├─ parseFrontmatter() - YAML Parser
├─ extractBetween() - Marker-Extraktor
├─ parseLesson() - Lektions-Parser
├─ parseTutorialFromMarkdown() - String-Parser
├─ parseTutorialFromFile() - Datei-Loader
└─ Helper-Funktionen

tutorialLoader.js (NEU - OPTIONAL)
├─ React Hook: useTutorial()
├─ Integration-Examples
└─ Struktur-Dokumentation

*/

// ============================================================
// TESTING
// ============================================================

/*

Um sicherzustellen, dass alles funktioniert:

1. Frontend starten:
   cd apps/frontend
   npm start

2. Browser öffnen: http://localhost:3000

3. Zu Tutorial navigieren (Route oder direct)

4. Überprüfen:
   ✓ Markdown wird geladen
   ✓ 23 Lektionen sichtbar
   ✓ Lektionen haben Metadaten (Dauer, Schwierigkeit, Typ)
   ✓ Editor lädt Starter-Code für Übungen
   ✓ Lösung kann angezeigt werden
   ✓ Navigation funktioniert
   ✓ View-Modi wechseln (Schwierigkeit/Bereich/Typ)

5. Console auf Fehler prüfen (F12)

*/

// ============================================================
// HÄUFIGE PROBLEME & LÖSUNGEN
// ============================================================

/*

PROBLEM: "Fehler beim Laden des Tutorials: Failed to fetch"
LÖSUNG: 
  1. Überprüfen Sie den Dateipfad
  2. VerilogTutorialFormatted.md muss in apps/frontend/public/Tutorial/ sein
  3. CORS-Policies beachten

PROBLEM: "Keine Lektionen gefunden"
LÖSUNG:
  1. Markdown-Datei ist beschädigt
  2. Format entspricht nicht der Spezifikation
  3. Überprüfen Sie: Lektionen beginnen mit "---" Trennzeichen

PROBLEM: "Lesson undefined" in Console
LÖSUNG:
  1. lesson_id im Frontmatter ist nicht numerisch
  2. Lektionen-IDs sind nicht eindeutig
  3. Überprüfen Sie das Format der Markdown-Datei

PROBLEM: Editor zeigt Code nicht
LÖSUNG:
  1. type: "exercise" ist nicht gesetzt
  2. EXERCISE_START/END Marker sind falsch
  3. Code-Blöcke verwenden nicht ```verilog

PROBLEM: Lösung wird nicht angezeigt
LÖSUNG:
  1. SOLUTION_START/END Marker sind falsch
  2. Solution ist leer oder null
  3. Überprüfen Sie die Markdown-Struktur

*/

export default function IntegrationGuide() {
  // Dieser Code ist nur zur Dokumentation
  return null;
}

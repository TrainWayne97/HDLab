// UI translations for simulation button and log heading
const TRANSLATIONS = {
  de: {
    run: 'Simulation starten',
    running: 'Simulation läuft...',
    log: 'Simulation Ergebnis',
    logDetails: 'Details anzeigen',
    compactView: 'Kompakt',
    fullView: 'Vollständig',
    downloadWave: 'Waveform herunterladen',
    viewWave: 'Waveform anzeigen',
    hideWave: 'Waveform ausblenden',
    loadingWave: 'Waveform wird geladen...',
    waveSignalView: 'Signalansicht',
    waveRawView: 'Rohdaten',
    waveZoom: 'Zoom',
    waveSignals: 'Signale',
    waveHidden: 'ausgeblendet',
    noSignalData: 'Keine auswertbaren Signalspuren in der VCD gefunden.',
    noSignalSelected: 'Keine Signale ausgewählt.',
    helpTitle: 'Hilfe und Legende',
    helpClose: 'Schließen',
    helpSectionFeatures: 'Aktuelle Funktionen',
    helpFeature1: 'HDL-Code und Testbench (SystemVerilog oder Cocotb/Python) direkt im Browser editieren.',
    helpFeature2: 'Simulation starten und Ergebnis in kompakter oder vollständiger Log-Ansicht prüfen.',
    helpFeature3: 'Waveform als VCD herunterladen oder direkt im Tool als Signalansicht anzeigen.',
    helpFeature4: 'Signale pro Spur ein-/ausblenden und Zeitachse per Zoom-Regler anpassen.',
    helpFeature5: 'Bus-Signale zeigen bei genügend Breite Hex-Wertlabels im Verlauf.',
    helpSectionSignalColors: 'Signal-Farbcodes',
    helpColorHigh: 'HIGH (1):',
    helpColorLow: 'LOW (0):',
    helpColorUnknown: 'Unbekannt (x/z):',
    helpColorRise: 'Steigende Flanke (0 -> 1):',
    helpColorFall: 'Fallende Flanke (1 -> 0):',
    helpColorOther: 'Sonstige Übergänge:',
    settingsTitle: 'Einstellungen',
    settingsClose: 'Schließen',
    settingsThemeTitle: 'Darstellung',
    settingsThemeDescription: 'Wähle hellen oder dunklen Modus für die Oberfläche.',
    settingsThemeLight: 'Hell',
    settingsThemeDark: 'Dunkel',
    code: 'HDL Code',
    testbench: 'Testbench',
    noResult: 'Kein Ergebnis erhalten.',
    error: 'Fehler: '
  },
  en: {
    run: 'Start Simulation',
    running: 'Simulation running...',
    log: 'Simulation Result',
    logDetails: 'Show details',
    compactView: 'Compact',
    fullView: 'Full',
    downloadWave: 'Download waveform',
    viewWave: 'View waveform',
    hideWave: 'Hide waveform',
    loadingWave: 'Loading waveform...',
    waveSignalView: 'Signal view',
    waveRawView: 'Raw data',
    waveZoom: 'Zoom',
    waveSignals: 'Signals',
    waveHidden: 'hidden',
    noSignalData: 'No parsable signal traces found in VCD.',
    noSignalSelected: 'No signals selected.',
    helpTitle: 'Help and Legend',
    helpClose: 'Close',
    helpSectionFeatures: 'Current functionality',
    helpFeature1: 'Edit HDL code and testbench (SystemVerilog or Cocotb/Python) directly in the browser.',
    helpFeature2: 'Run simulations and inspect results in compact or full log mode.',
    helpFeature3: 'Download waveform VCD or view it directly as signal tracks in the app.',
    helpFeature4: 'Show/hide signals per row and adjust timeline scale with the zoom slider.',
    helpFeature5: 'Bus signals show inline hex value labels when there is enough width.',
    helpSectionSignalColors: 'Signal color code',
    helpColorHigh: 'HIGH (1):',
    helpColorLow: 'LOW (0):',
    helpColorUnknown: 'Unknown (x/z):',
    helpColorRise: 'Rising edge (0 -> 1):',
    helpColorFall: 'Falling edge (1 -> 0):',
    helpColorOther: 'Other transitions:',
    settingsTitle: 'Settings',
    settingsClose: 'Close',
    settingsThemeTitle: 'Appearance',
    settingsThemeDescription: 'Choose light or dark mode for the interface.',
    settingsThemeLight: 'Light',
    settingsThemeDark: 'Dark',
    code: 'HDL Code',
    testbench: 'Testbench',
    noResult: 'No result received.',
    error: 'Error: '
  }
};
import { useState, useRef, useEffect } from 'react'
import JSZip from 'jszip';
import Editor from '@monaco-editor/react';
import './App.css';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import SimulationPanel from './components/SimulationPanel';
import { EMPTY_SIM } from './utils/simState';
import EditorTabs from './components/EditorTabs';
import TutorialContainer from './components/TutorialContainer';
import { useAuth } from './contexts/AuthContext';
import { LoginPage, RegisterPage } from './components/Auth';

function summarizeSimulationLog(rawLog, noResultMessage) {
  if (!rawLog || !rawLog.trim()) {
    return {
      summary: noResultMessage,
      details: ''
    };
  }

  const lines = rawLog
    .split(/\r?\n/)
    .map(line => line.trimEnd())
    .filter(line => line.length > 0);

  const relevant = [];
  const addUnique = line => {
    if (line && !relevant.includes(line)) {
      relevant.push(line);
    }
  };

  const passLine = lines.find(line => /\bpassed\b/i.test(line)) || null;
  const testsLine = lines.find(line => /TESTS=\d+ PASS=\d+ FAIL=\d+ SKIP=\d+/.test(line)) || null;
  const errorLines = lines.filter(line => /%Error|^ERROR\b|ERROR:|\bFAIL\b|Traceback|AssertionError|Exception/i.test(line));
  const verboseInfoLines = lines.filter(line =>
    /INFO\s+cocotb/i.test(line) &&
    !/Running on Verilator|Seeding Python|Initialized cocotb|Running tests|running\s+tb\.|regression\s+.*\bpassed\b/i.test(line)
  );

  verboseInfoLines.slice(0, 4).forEach(addUnique);
  if (passLine) addUnique(passLine);
  if (testsLine) addUnique(testsLine);
  errorLines.slice(0, 8).forEach(addUnique);

  if (relevant.length === 0) {
    const filtered = lines.filter(line =>
      !/^(rm -f results\.xml|"make"|make\[\d+\]|mkdir -p|Entering directory|Leaving directory|COCOTB_|-\s+V e r i l a t i o n|Verilator:|g\+\+|python3 |echo \"\" >|make -C |\/usr\/local\/bin\/verilator)/.test(line)
    );

    const fallback = filtered.slice(0, 6).join('\n') || lines.slice(-6).join('\n');
    return {
      summary: fallback || noResultMessage,
      details: lines.slice(0, 40).join('\n')
    };
  }

  return {
    summary: relevant.slice(0, 4).join('\n'),
    details: errorLines.length > 0 ? errorLines.slice(0, 20).join('\n') : lines.slice(0, 40).join('\n')
  };
}

function extractRelevantCocotbLog(rawLog, noResultMessage) {
  if (!rawLog || !rawLog.trim()) {
    return noResultMessage;
  }

  const lines = rawLog.split(/\r?\n/);
  const picked = lines.filter(line =>
    /^\s*\d+\.\d+ns\s+INFO\s+cocotb\.regression\s+running\s+/i.test(line) ||
    /^\s*\d+\.\d+ns\s+INFO\s+test\s+/i.test(line) ||
    /^\s*\d+\.\d+ns\s+INFO\s+cocotb\.regression\s+tb\..*\b(passed|failed)\b/i.test(line) ||
    /^\s*\d+\.\d+ns\s+INFO\s+cocotb\.regression\s+\*{10,}/i.test(line) ||
    /^\s*\*\*\s+TEST/i.test(line) ||
    /^\s*\*\*\s+tb\./i.test(line) ||
    /^\s*\*\*\s+TESTS=/i.test(line) ||
    /^\s*\*{20,}\s*$/i.test(line) ||
    /^-\s*:0:\s+Verilog\s+\$finish/i.test(line) ||
    /%Error|^ERROR\b|ERROR:|Traceback|AssertionError|Exception/i.test(line)
  );

  const cleaned = picked
    .map(line => line.trimEnd())
    .filter((line, index, arr) => line.length > 0 && (index === 0 || line !== arr[index - 1]));

  return cleaned.length > 0 ? cleaned.join('\n') : noResultMessage;
}

const INITIAL_CODE = 'module main;\n  initial begin\n    $display("Hello, Verilator!");\n    $finish;\n  end\nendmodule\n';


function App() {
  const { isAuthenticated, user, logout, apiCall } = useAuth();
  const [authPage, setAuthPage] = useState('login'); // 'login' or 'register'

  const authScreen = (
    <div>
      {authPage === 'login' ? (
        <LoginPage
          onLoginSuccess={() => {
            // App wird neu gerendert mit authenticated user
          }}
          onSwitchToRegister={() => setAuthPage('register')}
        />
      ) : (
        <RegisterPage
          onRegisterSuccess={() => {
            // App rendert automatisch neu, wenn token gespeichert wurde
            // Der conditional render wird sehen dass isAuthenticated true ist
          }}
          onSwitchToLogin={() => setAuthPage('login')}
        />
      )}
      <div style={{ position: 'fixed', bottom: 20, left: 20, fontSize: 12, color: '#999' }}>
        {authPage === 'login' ? (
          <>
            Noch kein Konto? <button onClick={() => setAuthPage('register')} style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', textDecoration: 'underline' }}>Registrieren</button>
          </>
        ) : (
          <>
            Hast ein Konto? <button onClick={() => setAuthPage('login')} style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', textDecoration: 'underline' }}>Anmelden</button>
          </>
        )}
      </div>
    </div>
  );

  // Rest der App (nur für authentifizierte User)
  const [code, setCode] = useState(INITIAL_CODE);
  const [testbench, setTestbench] = useState('');
  // Per-project simulation runtime state (status, console, waveform viewer), keyed by project id.
  // Kept out of `projects` so it isn't persisted to localStorage.
  const [simStates, setSimStates] = useState({});
  // patch: object or (prevSim) => object; a function returning null leaves the state untouched.
  const updateSim = (projectId, patch) =>
    setSimStates(prev => {
      const current = prev[projectId] ?? EMPTY_SIM;
      const changes = typeof patch === 'function' ? patch(current) : patch;
      if (!changes) return prev;
      return { ...prev, [projectId]: { ...current, ...changes } };
    });
  const [language, setLanguage] = useState('systemverilog');
  const [testbenchLang, setTestbenchLang] = useState('systemverilog');
  const [wave, setWave] = useState(false);
  const [testbenchEnabled, setTestbenchEnabled] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('hdlab-theme') || 'light');
  // UI language: 'de' (German) or 'en' (English)
  const [uiLanguage, setUiLanguage] = useState('de');

  // Multi-Project support
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('hdlab-projects');
    if (saved) return JSON.parse(saved);
    return [{
      id: 'project-1',
      name: 'Project 1',
      code: INITIAL_CODE,
      testbench: '',
      language: 'systemverilog',
      testbenchLang: 'systemverilog',
      testbenchEnabled: true,
      wave: false
    }];
  });
  const [activeProjectId, setActiveProjectId] = useState('project-1');
  const activeSim = simStates[activeProjectId] ?? EMPTY_SIM;

  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Module Library Drawer state
  const [moduleLibraryOpen, setModuleLibraryOpen] = useState(false);
  const [moduleLibraryRefreshKey, setModuleLibraryRefreshKey] = useState(0);
  // Ref to hold the active insert-module handler (set by TutorialLesson when mounted)
  const tutorialInsertRef = useRef(null);

  // Tutorial state
  const [currentPage, setCurrentPage] = useState('home'); // 'home' or 'tutorial'
  
  // Module Library state
  const [moduleRefreshKey, setModuleRefreshKey] = useState(0);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [moduleFormData, setModuleFormData] = useState({ name: '', description: '', tags: '' });
  useEffect(() => {
    localStorage.setItem('hdlab-projects', JSON.stringify(projects));
  }, [projects]);

  // Persist theme preference
  useEffect(() => {
    localStorage.setItem('hdlab-theme', themeMode);
    document.documentElement.setAttribute('data-theme', themeMode);
  }, [themeMode]);

    const handleSettings = () => setSettingsOpen(true);
    const handleHelp = () => setHelpOpen(true);

    // Module Library handlers
    const handleToggleModuleLibrary = () => setModuleLibraryOpen(prev => !prev);
    const handleModuleLibraryRefresh = () => setModuleLibraryRefreshKey(prev => prev + 1);
    const handleInsertModuleFromLibrary = (moduleCode) => {
      // If tutorial is active and has a registered insert handler, use that
      if (currentPage === 'tutorial' && tutorialInsertRef.current) {
        tutorialInsertRef.current(moduleCode);
      } else {
        setCode(prev => prev.includes(moduleCode) ? prev : prev + '\n\n' + moduleCode);
      }
    };
    
    // Tutorial handler
    const handleTutorialOpen = () => {
      setCurrentPage('tutorial');
    };

    const handleTutorialClose = () => {
      setCurrentPage('home');
    };

    const mainContentRef = useRef(null);

    const handleHome = () => {
      const hasUnsavedInput =
        code !== INITIAL_CODE ||
        testbench.trim().length > 0 ||
        language !== 'systemverilog' ||
        testbenchLang !== 'systemverilog' ||
        !testbenchEnabled ||
        wave;

      if (hasUnsavedInput) {
        const confirmMessage = uiLanguage === 'de'
          ? 'Ungespeicherte Änderungen verwerfen und zum Startzustand zurückkehren?'
          : 'Discard unsaved changes and return to the initial state?';

        if (!window.confirm(confirmMessage)) {
          return;
        }
      }

      setCurrentPage('home');
      setCode(INITIAL_CODE);
      setTestbench('');
      // Resetting runId also discards the result of a simulation still running for this project.
      updateSim(activeProjectId, EMPTY_SIM);
      setLanguage('systemverilog');
      setTestbenchLang('systemverilog');
      setWave(false);
      setTestbenchEnabled(true);
      setUiLanguage('de');
      setThemeMode(localStorage.getItem('hdlab-theme') || 'light');
      setHelpOpen(false);
      setSettingsOpen(false);

      if (designInputRef.current) designInputRef.current.value = '';
      if (tbInputRef.current) tbInputRef.current.value = '';

      if (mainContentRef.current) {
        mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };


    // Download als .sv oder ZIP
    async function handleSave() {
      try {
        if (testbenchEnabled && testbench.trim().length > 0) {
          // ZIP mit main.sv und tb.sv oder tb.py
          const zip = new JSZip();
          zip.file('main.sv', code);
          zip.file(testbenchLang === 'python' ? 'tb.py' : 'tb.sv', testbench);
          const blob = await zip.generateAsync({ type: 'blob' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'hdl_project.zip';
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 100);
          alert(uiLanguage === 'de' ? 'Design und Testbench wurden als ZIP heruntergeladen.' : 'Design and testbench have been downloaded as ZIP.');
        } else {
          // Nur main.sv als Download
          const blob = new Blob([code], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'main.sv';
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 100);
          alert(uiLanguage === 'de' ? 'Design wurde als main.sv heruntergeladen.' : 'Design has been downloaded as main.sv.');
        }
      } catch (err) {
        alert((uiLanguage === 'de' ? 'Fehler beim Download: ' : 'Download error: ') + err.message);
      }
    }


    // File input Refs
    const designInputRef = useRef();
    const tbInputRef = useRef();

    // Öffnet Datei-Dialoge für Design und optional Testbench
    async function handleOpen() {
      // Hinweis anzeigen, bevor Datei-Dialog erscheint
      const msg = uiLanguage === 'de'
        ? 'Bitte wählen Sie nun Ihr Hardware Design (Dateiendung: .sv oder .txt) aus und bestätigen Sie mit "Öffnen".'
        : 'Please select your hardware design file (.sv or .txt) and confirm with "Open".';
      if (window.confirm(msg)) {
        designInputRef.current.value = '';
        designInputRef.current.click();
      }
    }

    // Handler für Design-Datei
    function onDesignFileChange(e) {
      const file = e.target.files[0];
      if (!file) return;
      // Nur .sv oder .txt erlauben
      if (!file.name.endsWith('.sv') && !file.name.endsWith('.txt')) {
        alert(uiLanguage === 'de'
          ? 'Nur Dateien mit der Endung .sv oder .txt sind als Hardware Design erlaubt!'
          : 'Only files ending with .sv or .txt are allowed as hardware design!');
        return;
      }
      const reader = new FileReader();
      reader.onload = evt => {
        setCode(evt.target.result);
        // Nach Design: Frage nach Testbench
        const msg = uiLanguage === 'de'
          ? 'Möchten Sie auch eine Testbench laden? (Dateiendung: .sv, .py oder .txt)'
          : 'Would you like to load a testbench as well? (File extension: .sv, .py or .txt)';
        if (window.confirm(msg)) {
          tbInputRef.current.value = '';
          tbInputRef.current.click();
        } else {
          setTestbench('');
          setTestbenchEnabled(false);
        }
      };
      reader.readAsText(file);
    }

    // Handler für Testbench-Datei
    function onTbFileChange(e) {
      const file = e.target.files[0];
      if (!file) return;
      // Nur .sv, .py oder .txt erlauben
      if (!file.name.endsWith('.sv') && !file.name.endsWith('.py') && !file.name.endsWith('.txt')) {
        alert(uiLanguage === 'de'
          ? 'Nur Dateien mit der Endung .sv, .py oder .txt sind als Testbench erlaubt!'
          : 'Only files ending with .sv, .py or .txt are allowed as testbench!');
        return;
      }
      const reader = new FileReader();
      reader.onload = evt => {
        setTestbench(evt.target.result);
        setTestbenchEnabled(true);
        setTestbenchLang(file.name.endsWith('.py') ? 'python' : 'systemverilog');
      };
      reader.readAsText(file);
    }

    /**
     * Callback for code example selection from Sidebar
     * Loads code and (if present) testbench into the editors, sets testbench state accordingly
     */
    function handleExample(example) {
      const confirmMessage = uiLanguage === 'de'
        ? 'Möchten Sie dieses Code-Beispiel wirklich laden? Die bereits geschriebenen Module im Editor werden dadurch gelöscht.'
        : 'Do you really want to load this code example? The modules already written in the editor will be deleted.';

      if (!window.confirm(confirmMessage)) {
        return;
      }

      setCode(example.code);
      if (example.testbench) {
        setTestbench(example.testbench);
        if (!testbenchEnabled) setTestbenchEnabled(true);
        setTestbenchLang(example.testbenchLang || 'systemverilog');
      } else {
        setTestbench('');
        setTestbenchEnabled(false);
      }
    }

    // Multi-project handlers
    function handleNewProject() {
      const newId = `project-${Date.now()}`;
      const newProject = {
        id: newId,
        name: `Project ${projects.length + 1}`,
        code: INITIAL_CODE,
        testbench: '',
        language: 'systemverilog',
        testbenchLang: 'systemverilog',
        testbenchEnabled: true,
        wave: false
      };
      setProjects([...projects, newProject]);
      setActiveProjectId(newId);
      setSidebarOpen(false); // Close mobile menu after creating project
    }

    function handleSelectProject(projectId) {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;
      
      setActiveProjectId(projectId);
      setCode(project.code);
      setTestbench(project.testbench);
      setLanguage(project.language);
      setTestbenchLang(project.testbenchLang);
      setTestbenchEnabled(project.testbenchEnabled);
      setWave(project.wave);
      setSidebarOpen(false); // Close mobile menu after switching project
    }

    function handleCloseProject(projectId) {
      if (projects.length <= 1) {
        alert(uiLanguage === 'de' ? 'Das letzte Projekt kann nicht geschlossen werden.' : 'Cannot close the last project.');
        return;
      }
      const newProjects = projects.filter(p => p.id !== projectId);
      setProjects(newProjects);
      setSimStates(prev => {
        const rest = { ...prev };
        delete rest[projectId];
        return rest;
      });
      
      if (activeProjectId === projectId) {
        const nextProject = newProjects[0];
        setActiveProjectId(nextProject.id);
        setCode(nextProject.code);
        setTestbench(nextProject.testbench);
        setLanguage(nextProject.language);
        setTestbenchLang(nextProject.testbenchLang);
        setTestbenchEnabled(nextProject.testbenchEnabled);
        setWave(nextProject.wave);
      }
    }

    // Save current project state
    function saveCurrentProject() {
      setProjects(prevProjects => 
        prevProjects.map(p => 
          p.id === activeProjectId 
            ? { ...p, code, testbench, language, testbenchLang, testbenchEnabled, wave }
            : p
        )
      );
    }

    // Update project state on code/testbench changes
    useEffect(() => {
      saveCurrentProject();
    }, [code, testbench, language, testbenchLang, testbenchEnabled, wave]);


  /**
   * Starts a simulation:
   * - Creates a project with current code and (if enabled) testbench
   * - Starts a simulation job for the project
   * - Polls for the simulation result and displays the log output
   */

  // Extrahiere den Namen des Top-Moduls aus HDL- oder Testbench-Code
  function extractTopModuleName({ code, testbench, testbenchEnabled, testbenchLang }) {
    // Helper: suche erstes Modul in gegebenem Code
    function findModuleName(src) {
      if (!src) return null;
      // Kommentare entfernen
      const noBlock = src.replace(/\/\*[\s\S]*?\*\//g, ' ');
      const noLine = noBlock.replace(/\/\/.*$/gm, ' ');
      const match = noLine.match(/module\s+([a-zA-Z_][a-zA-Z0-9_$]*)/);
      return match ? match[1] : null;
    }
    // Bei Cocotb: immer Design-Modul als Top verwenden
    if (testbenchEnabled && testbenchLang === 'python') {
      return findModuleName(code) || 'main';
    }
    // Bei SV-Testbench: Testbench-Modul als Top verwenden
    if (testbenchEnabled && testbench && testbench.trim().length > 0) {
      return findModuleName(testbench) || 'tb';
    }
    // Sonst Design-Modulname
    return findModuleName(code) || 'main';
  }

  // Poll interval and upper bound while waiting for a queued/running simulation.
  const SIM_POLL_INTERVAL_MS = 1000;
  const SIM_POLL_TIMEOUT_MS = 5 * 60 * 1000;

  async function runSimulation() {
    // Bind this run to the project it was started from, so results land there
    // even if the user switches projects (or starts other runs) meanwhile.
    const projectId = activeProjectId;
    const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const updateRun = patch => updateSim(projectId, prev => (prev.runId === runId ? patch : null));
    updateSim(projectId, { ...EMPTY_SIM, status: 'running', runId });
    try {
      // 1. Create project
      // Add files depending on testbench state
      const files = [
        { filename: 'main.sv', content: code, language: language }
      ];
      // Only add testbench if enabled and not empty
      if (testbenchEnabled && testbench.trim().length > 0) {
        files.push({ filename: testbenchLang === 'python' ? 'tb.py' : 'tb.sv', content: testbench, language: testbenchLang });
      }
      // Top-Modulnamen automatisch erkennen
      const topModule = extractTopModuleName({ code, testbench, testbenchEnabled, testbenchLang });
      const projectRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Playground',
          files
        })
      });
      const project = await projectRes.json();
      // 2. Create simulation
      const simRes = await fetch('/api/simulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project._id,
          language,
          testbenchType: testbenchEnabled ? testbenchLang : null,
          topModule, // <--- Top-Modulname übergeben
          settings: {
            generateWave: !!wave
          }
        })
      });
      const sim = await simRes.json();
      updateRun({ simulationId: sim._id });
      // 3. Poll until the worker has finished (jobs may wait in the queue behind others)
      let result = null;
      const deadline = Date.now() + SIM_POLL_TIMEOUT_MS;
      while (Date.now() < deadline) {
        await new Promise(r => setTimeout(r, SIM_POLL_INTERVAL_MS));
        const res = await fetch(`/api/simulations/${sim._id}/results`);
        if (res.ok) {
          result = await res.json();
          if (result.status === 'finished' || result.status === 'error') break;
        }
      }
      const rawLog = result?.log || '';
      const summarized = summarizeSimulationLog(rawLog, t.noResult);
      updateRun({
        status: result?.status === 'finished' ? 'finished' : 'error',
        logSummary: summarized.summary,
        logDetails: summarized.details,
        logRaw: extractRelevantCocotbLog(rawLog, t.noResult),
        waveformUrl: result?.hasWaveform ? result?.waveformUrl || null : null,
      });
    } catch (err) {
      updateRun({ ...EMPTY_SIM, runId, status: 'error', logSummary: t.error + err.message });
    }
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
    localStorage.setItem('hdlab-theme', themeMode);
  }, [themeMode]);

  const t = TRANSLATIONS[uiLanguage] || TRANSLATIONS.de;
  const editorTheme = themeMode === 'dark' ? 'vs-dark' : 'light';
  return !isAuthenticated ? authScreen : (
    <div className="fullscreen-app">
      <Topbar
        onSettings={handleSettings}
        onHelp={handleHelp}
        onHome={handleHome}
        onTutorial={handleTutorialOpen}
        uiLanguage={uiLanguage}
        setUiLanguage={setUiLanguage}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        moduleLibraryOpen={moduleLibraryOpen}
        onToggleModuleLibrary={handleToggleModuleLibrary}
        moduleLibraryCode={code}
        onInsertModule={handleInsertModuleFromLibrary}
        moduleRefreshKey={moduleLibraryRefreshKey}
      />
      {helpOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            zIndex: 220,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
          onClick={() => setHelpOpen(false)}
        >
          <div
            style={{
              width: 'min(780px, 96vw)',
              maxHeight: '85vh',
              overflowY: 'auto',
              background: '#ffffff',
              color: '#111827',
              borderRadius: 10,
              border: '1px solid #d1d5db',
              boxShadow: '0 18px 38px rgba(0, 0, 0, 0.18)',
              padding: '18px 20px'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h3 style={{ margin: 0, color: '#0f172a' }}>{t.helpTitle}</h3>
              <button type="button" onClick={() => setHelpOpen(false)}>{t.helpClose}</button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{t.helpSectionFeatures}</div>
              <ul style={{ marginTop: 0, marginBottom: 0, paddingLeft: 20 }}>
                <li>{t.helpFeature1}</li>
                <li>{t.helpFeature2}</li>
                <li>{t.helpFeature3}</li>
                <li>{t.helpFeature4}</li>
                <li>{t.helpFeature5}</li>
              </ul>
            </div>

            <div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{t.helpSectionSignalColors}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', rowGap: 8, columnGap: 10, alignItems: 'center' }}>
                <span style={{ width: 18, height: 10, background: '#5dd39e', border: '1px solid #000', display: 'inline-block' }} />
                <span><strong>{t.helpColorHigh}</strong> #5dd39e</span>

                <span style={{ width: 18, height: 10, background: '#6cb6ff', border: '1px solid #000', display: 'inline-block' }} />
                <span><strong>{t.helpColorLow}</strong> #6cb6ff</span>

                <span style={{ width: 18, height: 10, background: '#f2cc60', border: '1px solid #000', display: 'inline-block' }} />
                <span><strong>{t.helpColorUnknown}</strong> #f2cc60</span>

                <span style={{ width: 4, height: 16, background: '#22c55e', display: 'inline-block' }} />
                <span><strong>{t.helpColorRise}</strong> #22c55e</span>

                <span style={{ width: 4, height: 16, background: '#ef4444', display: 'inline-block' }} />
                <span><strong>{t.helpColorFall}</strong> #ef4444</span>

                <span style={{ width: 4, height: 16, background: '#d1d5db', display: 'inline-block' }} />
                <span><strong>{t.helpColorOther}</strong> #d1d5db</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {settingsOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            zIndex: 220,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
          onClick={() => setSettingsOpen(false)}
        >
          <div
            style={{
              width: 'min(560px, 95vw)',
              maxHeight: '80vh',
              overflowY: 'auto',
              background: themeMode === 'dark' ? '#111827' : '#ffffff',
              color: themeMode === 'dark' ? '#e5e7eb' : '#111827',
              borderRadius: 10,
              border: themeMode === 'dark' ? '1px solid #374151' : '1px solid #d1d5db',
              boxShadow: '0 18px 38px rgba(0, 0, 0, 0.18)',
              padding: '18px 20px'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0 }}>{t.settingsTitle}</h3>
              <button type="button" onClick={() => setSettingsOpen(false)}>{t.settingsClose}</button>
            </div>

            <div style={{ marginBottom: 8, fontWeight: 700 }}>{t.settingsThemeTitle}</div>
            <div style={{ marginBottom: 12, color: themeMode === 'dark' ? '#cbd5e1' : '#475569' }}>{t.settingsThemeDescription}</div>

            <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="radio"
                  name="theme-mode"
                  value="light"
                  checked={themeMode === 'light'}
                  onChange={() => setThemeMode('light')}
                />
                {t.settingsThemeLight}
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="radio"
                  name="theme-mode"
                  value="dark"
                  checked={themeMode === 'dark'}
                  onChange={() => setThemeMode('dark')}
                />
                {t.settingsThemeDark}
              </label>
            </div>
          </div>
        </div>
      )}
      <div className="main-layout">
        <Sidebar
          language={language}
          setLanguage={setLanguage}
          testbenchLang={testbenchLang}
          setTestbenchLang={setTestbenchLang}
          onSave={handleSave}
          onOpen={handleOpen}
          wave={wave}
          setWave={setWave}
          testbenchEnabled={testbenchEnabled}
          setTestbenchEnabled={setTestbenchEnabled}
          onExample={handleExample}
          uiLanguage={uiLanguage}
          className={sidebarOpen ? 'open' : ''}
          onClose={() => setSidebarOpen(false)}
        />
        {/* Unsichtbare File-Inputs für Datei-Upload */}
        <input type="file" accept=".sv,.txt" style={{ display: 'none' }} ref={designInputRef} onChange={onDesignFileChange} />
        <input type="file" accept=".sv,.py,.txt" style={{ display: 'none' }} ref={tbInputRef} onChange={onTbFileChange} />
        
        {/* Tutorial Container */}
        {currentPage === 'tutorial' && (
          <TutorialContainer 
            tutorialPath="/Tutorial/VerilogTutorialFormatted.md"
            uiLanguage={uiLanguage}
            editorTheme={editorTheme}
        onModuleSaved={handleModuleLibraryRefresh}
        onRegisterInsert={(fn) => { tutorialInsertRef.current = fn; }}
      />
        )}

        {/* Normal Editor View */}
        {currentPage === 'home' && (
        <main className="main-content-full" ref={mainContentRef}>
          <EditorTabs
            projects={projects}
            activeProjectId={activeProjectId}
            simStatuses={Object.fromEntries(Object.entries(simStates).map(([id, sim]) => [id, sim.status]))}
            onSelectProject={handleSelectProject}
            onCloseProject={handleCloseProject}
            onNewProject={handleNewProject}
            uiLanguage={uiLanguage}
          />
          
          {/* Editor with Module Library Sidebar */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
            <div className="editor-section" style={{ flex: 1 }}>
              <div className="editor-block">
                <label className="editor-label">{t.code}</label>
                <Editor
                  height="420px"
                  defaultLanguage={language}
                  value={code}
                  onChange={v => setCode(v)}
                  theme={editorTheme}
                  options={{ fontSize: 16 }}
                />
              </div>
              {testbenchEnabled && (
                <div className="editor-block">
                  <label className="editor-label">{t.testbench} ({testbenchLang})</label>
                  <Editor
                    height="420px"
                    defaultLanguage={testbenchLang}
                    value={testbench}
                    onChange={v => setTestbench(v)}
                    theme={editorTheme}
                    options={{ fontSize: 16 }}
                  />
                </div>
              )}
                            
              {showModuleForm && (
                <div style={{ marginTop: 12, padding: 12, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6 }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#166534' }}>Modul speichern</h4>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#374151' }}>Modulname</label>
                    <input
                      type="text"
                      value={moduleFormData.name}
                      onChange={(e) => setModuleFormData({...moduleFormData, name: e.target.value})}
                      placeholder="z.B. modul_add"
                      style={{ width: '100%', padding: 6, border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#374151' }}>Beschreibung (optional)</label>
                    <textarea
                      value={moduleFormData.description}
                      onChange={(e) => setModuleFormData({...moduleFormData, description: e.target.value})}
                      placeholder="Was macht dieses Modul?"
                      rows="2"
                      style={{ width: '100%', padding: 6, border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12, boxSizing: 'border-box', fontFamily: 'inherit' }}
                    />
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#374151' }}>Tags (kommagetrennt, optional)</label>
                    <input
                      type="text"
                      value={moduleFormData.tags}
                      onChange={(e) => setModuleFormData({...moduleFormData, tags: e.target.value})}
                      placeholder="z.B. addierer, kombinatorial"
                      style={{ width: '100%', padding: 6, border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12, boxSizing: 'border-box' }}
                    />
                  </div>
                  <button
                    onClick={async () => {
                      if (!moduleFormData.name.trim() || !code.trim()) {
                        alert('Modulname und Code erforderlich');
                        return;
                      }
                      try {
                        const res = await apiCall('/modules', {
                          method: 'POST',
                          body: JSON.stringify({
                            moduleName: moduleFormData.name.trim(),
                            code,
                            description: moduleFormData.description.trim(),
                            tags: moduleFormData.tags.split(',').map(t => t.trim()).filter(t => t),
                          }),
                        });
                        if (res.ok) {
                          setShowModuleForm(false);
                          setModuleFormData({ name: '', description: '', tags: '' });
                          setModuleRefreshKey(prev => prev + 1);
                          alert('✓ Modul gespeichert!');
                        }
                      } catch (err) {
                        console.error('Error saving module:', err);
                        alert('Fehler beim Speichern des Moduls');
                      }
                    }}
                    style={{ width: '100%', padding: 8, background: '#10b981', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
                  >
                    💾 Speichern
                  </button>
                </div>
              )}
            </div>

          </div>
          <SimulationPanel
            key={activeProjectId}
            sim={activeSim}
            onChange={patch => updateSim(activeProjectId, patch)}
            onRun={runSimulation}
            t={t}
            uiLanguage={uiLanguage}
          />
        </main>
        )}
      </div>
    </div>
  );

  // ...existing code...
}

export default App

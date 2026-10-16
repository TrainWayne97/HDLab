// UI translations for simulation button and log heading
const TRANSLATIONS = {
  de: {
    run: 'Simulation starten',
    running: 'Simulation läuft...',
    log: 'Ausgabe',
    logDetails: 'Details anzeigen',
    loadingWave: 'Waveform und Netlist werden geladen...',
    tabWaveform: 'Waveform',
    tabNetlist: 'Netlist',
    tabBoard: 'Basys3',
    outputEmpty: 'Noch keine Simulation gestartet.',
    waveformEmpty: 'Keine Waveform vorhanden. Aktiviere „Wave-Datei erzeugen?“ in der Seitenleiste und starte die Simulation.',
    netlistEmpty: 'Keine Netlist vorhanden. Sie wird bei jeder erfolgreichen Simulation erzeugt, sofern Yosys das Design synthetisieren kann.',
    helpTitle: 'Hilfe und Legende',
    helpClose: 'Schließen',
    helpSectionFeatures: 'Aktuelle Funktionen',
    helpFeature1: 'HDL-Code und Testbench (SystemVerilog oder Cocotb/Python) direkt im Browser editieren.',
    helpFeature2: 'Simulation starten, Ergebnis prüfen und bei Bedarf Details aufklappen.',
    helpFeature3: 'Waveform unten im Dock ansehen (Strg + Mausrad: Zoom, Umschalt + Mausrad: Verschieben, Klick: Cursor) oder als VCD herunterladen.',
    helpFeature4: 'Signale über das Filterfeld eingrenzen; die Werte am Cursor stehen neben den Signalnamen.',
    helpFeature5: 'Bus-Signale zeigen ihre Werte im Verlauf; ein Klick auf HEX wechselt zwischen Hex, Dezimal und Binär.',
    helpFeature6: 'Der Reiter „Netlist“ zeigt den von Yosys erzeugten Schaltplan des Designs.',
    helpFeature7: 'Im Explorer links im HDL-Code Module, Packages und Ordner anlegen, .sv/.v-Dateien importieren und per Drag & Drop verschieben; ★ markiert die Top-Datei. Die Ansicht „Hierarchie“ zeigt, welche Module wo instanziiert werden. Packages werden automatisch vor den Dateien kompiliert, die sie importieren. Header-Dateien (.svh/.vh, „+ Header“) bindest du mit `include "name.svh"` ein; Ordnerpfade im include sind erlaubt.',
    helpFeature8: 'Der Reiter „Basys3“ simuliert das Design auf einem virtuellen Basys3-Board: Schalter und Taster bedienen, LEDs und 7-Segment-Anzeige beobachten. Die Ports heißen wie im Basys3-Master-XDC (clk, sw, led, seg, dp, an, btnC/U/L/R/D).',
    helpSectionSignalColors: 'Signal-Farbcodes',
    helpColorBit: 'Einzelnes Bit (0/1):',
    helpColorBus: 'Bus (mehrere Bits):',
    helpColorUnknown: 'Unbekannt (x/z):',
    settingsTitle: 'Einstellungen',
    settingsClose: 'Schließen',
    settingsThemeTitle: 'Darstellung',
    settingsThemeDescription: 'Wähle hellen oder dunklen Modus für die Oberfläche.',
    settingsThemeLight: 'Hell',
    settingsThemeDark: 'Dunkel',
    code: 'HDL Code',
    testbench: 'Testbench',
    packageNamePrompt: 'Name des neuen Packages (z.B. alu_pkg):',
    moduleNamePrompt: 'Name des neuen Moduls (z.B. alu):',
    headerNamePrompt: 'Name der neuen Header-Datei ohne Endung (z.B. defs, wird zu defs.svh):',
    folderNamePrompt: 'Name des neuen Ordners:',
    renamePrompt: 'Neuer Name:',
    invalidIdentifier: 'Ungültiger Name. Erlaubt sind Buchstaben, Ziffern und _, beginnend mit Buchstabe oder _.',
    fileErrors: {
      invalidName: name => `„${name}“ ist kein gültiger Name. Erlaubt sind Buchstaben, Ziffern, _, . und -.`,
      extension: name => `„${name}“: Nur Dateien mit der Endung .sv, .v oder Header mit .svh, .vh sind erlaubt.`,
      reservedName: name => `Der Name ${name} ist für die Testbench reserviert.`,
      nameTaken: name => `Eine Datei ${name} gibt es im Projekt schon (Dateinamen müssen auch in verschiedenen Ordnern eindeutig sein).`,
      folderTaken: name => `Den Ordner ${name} gibt es hier schon.`,
    },
    removeFileConfirm: name => `Datei ${name} wirklich aus dem Projekt entfernen?`,
    removeFolderConfirm: (name, count) => `Ordner ${name} mit ${count} Datei(en) wirklich löschen?`,
    folderHasTop: 'Der Ordner enthält die Top-Datei. Markiere zuerst eine andere Datei als Top (★).',
    topIsHeader: 'Die Top-Datei kann keine Header-Datei (.svh/.vh) sein. Markiere zuerst eine andere Datei als Top (★).',
    overwriteFileConfirm: name => `Die Datei ${name} existiert bereits. Mit der Version aus der Bibliothek überschreiben?`,
    overwriteImportConfirm: name => `Die Datei ${name} existiert bereits. Mit der importierten Datei überschreiben?`,
    resizeExplorer: 'Breite des Explorers anpassen (Doppelklick: Standard)',
    resizeEditors: 'Aufteilung zwischen HDL-Code und Testbench anpassen (Doppelklick: halbe-halbe)',
    showExplorer: 'Explorer einblenden',
    hideExplorer: 'Explorer ausblenden',
    openPrompt: 'Wähle ein Projekt als ZIP (wird als neues Projekt geöffnet, z.B. eine mit „Speichern“ exportierte Datei) oder ein einzelnes Hardware Design (.sv, .v oder .txt) und bestätige mit „Öffnen“.',
    importSummary: ({ name, count, topFile, guessed, testbench }) =>
      `Projekt „${name}“ importiert: ${count} Design-Datei(en), Top-Datei ${topFile}${guessed ? ' (automatisch erkannt, mit ☆ im Explorer änderbar)' : ''}, Testbench: ${testbench ?? 'keine'}.`,
    importRenamed: list => `Umbenannt (Dateinamen müssen eindeutig sein):\n${list}`,
    importIgnored: list => `Übersprungen (keine .sv/.v-Dateien):\n${list}`,
    importNoDesign: 'Die ZIP-Datei enthält keine .sv- oder .v-Dateien.',
    importTooMany: max => `Die ZIP-Datei enthält mehr als ${max} Design-Dateien. So große Projekte kann HDLab nicht simulieren.`,
    importTooLarge: 'Die ZIP-Datei ist zu groß (Inhalt höchstens 10 MB).',
    importFailed: 'Die ZIP-Datei konnte nicht gelesen werden: ',
    projectTooLarge: 'Das Projekt ist zu groß für den Server (Dateien zusammen höchstens etwa 10 MB).',
    warningsHint: count => `⚠ ${count} Verilator-Warnung${count === 1 ? '' : 'en'}, siehe „${TRANSLATIONS.de.logDetails}“`,
    noResult: 'Kein Ergebnis erhalten.',
    error: 'Fehler: '
  },
  en: {
    run: 'Start Simulation',
    running: 'Simulation running...',
    log: 'Output',
    logDetails: 'Show details',
    loadingWave: 'Loading waveform and netlist...',
    tabWaveform: 'Waveform',
    tabNetlist: 'Netlist',
    tabBoard: 'Basys3',
    outputEmpty: 'No simulation started yet.',
    waveformEmpty: 'No waveform available. Enable "Generate wave file?" in the sidebar and run the simulation.',
    netlistEmpty: 'No netlist available. It is generated with every successful simulation, provided Yosys can synthesize the design.',
    helpTitle: 'Help and Legend',
    helpClose: 'Close',
    helpSectionFeatures: 'Current functionality',
    helpFeature1: 'Edit HDL code and testbench (SystemVerilog or Cocotb/Python) directly in the browser.',
    helpFeature2: 'Run simulations, inspect results and expand details when needed.',
    helpFeature3: 'Inspect the waveform in the dock at the bottom (Ctrl + wheel: zoom, Shift + wheel: pan, click: cursor) or download it as VCD.',
    helpFeature4: 'Narrow down signals with the filter field; the values at the cursor are shown next to the signal names.',
    helpFeature5: 'Bus signals show their values inline; clicking HEX switches between hex, decimal and binary.',
    helpFeature6: 'The "Netlist" tab shows the schematic of the design generated by Yosys.',
    helpFeature7: 'In the explorer on the left of the HDL code, create modules, packages and folders, import .sv/.v files and move them by drag & drop; ★ marks the top file. The "Hierarchy" view shows which modules are instantiated where. Packages are compiled automatically before the files that import them. Header files (.svh/.vh, "+ Header") are pulled in with `include "name.svh"`; folder paths in the include are fine.',
    helpFeature8: 'The "Basys3" tab simulates the design on a virtual Basys3 board: flip switches, press buttons and watch the LEDs and 7-segment display. Ports are named as in the Basys3 master XDC (clk, sw, led, seg, dp, an, btnC/U/L/R/D).',
    helpSectionSignalColors: 'Signal color code',
    helpColorBit: 'Single bit (0/1):',
    helpColorBus: 'Bus (multiple bits):',
    helpColorUnknown: 'Unknown (x/z):',
    settingsTitle: 'Settings',
    settingsClose: 'Close',
    settingsThemeTitle: 'Appearance',
    settingsThemeDescription: 'Choose light or dark mode for the interface.',
    settingsThemeLight: 'Light',
    settingsThemeDark: 'Dark',
    code: 'HDL Code',
    testbench: 'Testbench',
    packageNamePrompt: 'Name of the new package (e.g. alu_pkg):',
    moduleNamePrompt: 'Name of the new module (e.g. alu):',
    headerNamePrompt: 'Name of the new header file without extension (e.g. defs, becomes defs.svh):',
    folderNamePrompt: 'Name of the new folder:',
    renamePrompt: 'New name:',
    invalidIdentifier: 'Invalid name. Use letters, digits and _, starting with a letter or _.',
    fileErrors: {
      invalidName: name => `"${name}" is not a valid name. Use letters, digits, _, . and -.`,
      extension: name => `"${name}": only files ending with .sv, .v or headers ending with .svh, .vh are allowed.`,
      reservedName: name => `The name ${name} is reserved for the testbench.`,
      nameTaken: name => `The project already has a file ${name} (file names must be unique across folders).`,
      folderTaken: name => `A folder ${name} already exists here.`,
    },
    removeFileConfirm: name => `Really remove ${name} from the project?`,
    removeFolderConfirm: (name, count) => `Really delete folder ${name} with ${count} file(s)?`,
    folderHasTop: 'The folder contains the top file. Mark another file as top (★) first.',
    topIsHeader: 'The top file can\'t be a header file (.svh/.vh). Mark another file as top (★) first.',
    overwriteFileConfirm: name => `The file ${name} already exists. Overwrite it with the version from the library?`,
    overwriteImportConfirm: name => `The file ${name} already exists. Overwrite it with the imported file?`,
    resizeExplorer: 'Resize the explorer (double click: default)',
    resizeEditors: 'Resize HDL code and testbench (double click: half and half)',
    showExplorer: 'Show explorer',
    hideExplorer: 'Hide explorer',
    openPrompt: 'Select a project as ZIP (opened as a new project, e.g. a file exported with "Save") or a single hardware design (.sv, .v or .txt) and confirm with "Open".',
    importSummary: ({ name, count, topFile, guessed, testbench }) =>
      `Project "${name}" imported: ${count} design file(s), top file ${topFile}${guessed ? ' (detected automatically, change it with ☆ in the explorer)' : ''}, testbench: ${testbench ?? 'none'}.`,
    importRenamed: list => `Renamed (file names must be unique):\n${list}`,
    importIgnored: list => `Skipped (not .sv/.v files):\n${list}`,
    importNoDesign: 'The ZIP file contains no .sv or .v files.',
    importTooMany: max => `The ZIP file contains more than ${max} design files. HDLab can't simulate projects that large.`,
    importTooLarge: 'The ZIP file is too large (at most 10 MB of content).',
    importFailed: 'The ZIP file could not be read: ',
    projectTooLarge: 'The project is too large for the server (files together at most about 10 MB).',
    warningsHint: count => `⚠ ${count} Verilator warning${count === 1 ? '' : 's'}, see "${TRANSLATIONS.en.logDetails}"`,
    noResult: 'No result received.',
    error: 'Error: '
  }
};
import { useState, useRef, useEffect, useMemo } from 'react'
import JSZip from 'jszip';
import Editor from '@monaco-editor/react';
import './App.css';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import SimulationPanel from './components/SimulationPanel';
import { EMPTY_SIM } from './utils/simState';
import { summarizeSimulationLog } from './utils/simLog';
import EditorTabs from './components/EditorTabs';
import DesignExplorer from './components/DesignExplorer';
import {
  RESERVED_FILENAMES, SV_IDENTIFIER, addFolder, allFolders, basename, dirname, hasDesignExtension, headerTemplate,
  isHeaderFile, isInside, joinPath, moduleTemplate, moveFile, moveFolder, normalizeProject, packageTemplate,
  removeFile, removeFolder,
  sanitizeFilename, updateContent, upsertFile, validateFilename, validateFolderName,
} from './utils/designFiles';
import { analyzeDesign } from './utils/svHierarchy';
import { MANIFEST_NAME, MAX_DESIGN_FILES, buildManifest, importProject } from './utils/projectImport';
import FullscreenPanel from './components/FullscreenPanel';
import TutorialContainer from './components/TutorialContainer';
import { getCourse } from './config/courses';
import useRoute, { EDITOR_PATH, TUTORIAL_PATH, coursePath } from './hooks/useRoute';
import useDragSize from './hooks/useDragSize';
import useSplitRatio from './hooks/useSplitRatio';
import { useAuth } from './contexts/AuthContext';
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from './components/Auth';

const INITIAL_CODE = 'module main;\n  initial begin\n    $display("Hello, Verilator!");\n    $finish;\n  end\nendmodule\n';

// Design files of a new project (see utils/designFiles.js)
// Upper bound for the unpacked content of an imported project ZIP
const MAX_IMPORT_BYTES = 10 * 1024 * 1024;

const newDesign = () => ({
  files: [{ path: 'main.sv', content: INITIAL_CODE }],
  folders: [],
  topFile: 'main.sv',
  activeFile: 'main.sv',
});


function App() {
  const { isAuthenticated, user, logout, apiCall } = useAuth();
  // Link aus der Reset-Mail: /#resetToken=...
  const [resetToken] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('resetToken'));
  const [authPage, setAuthPage] = useState(resetToken ? 'reset' : 'login'); // 'login', 'register', 'forgot' or 'reset'
  useEffect(() => {
    // Token nicht in der Adresszeile (und damit im Verlauf) stehen lassen
    if (resetToken) window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }, [resetToken]);

  const authScreen = (
    <div>
      {authPage === 'login' ? (
        <LoginPage
          onLoginSuccess={() => {
            // App wird neu gerendert mit authenticated user
          }}
          onSwitchToRegister={() => setAuthPage('register')}
          onForgotPassword={() => setAuthPage('forgot')}
        />
      ) : authPage === 'forgot' ? (
        <ForgotPasswordPage onSwitchToLogin={() => setAuthPage('login')} />
      ) : authPage === 'reset' ? (
        <ResetPasswordPage token={resetToken} onSwitchToLogin={() => setAuthPage('login')} />
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
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('hdlab-theme') || 'light');
  // UI language: 'de' (German) or 'en' (English)
  const [uiLanguage, setUiLanguage] = useState('de');

  // Multi-Project support
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('hdlab-projects');
    if (saved) return JSON.parse(saved).map(normalizeProject);
    return [{
      id: 'project-1',
      name: 'Project 1',
      ...newDesign(),
      testbench: '',
      language: 'systemverilog',
      testbenchLang: 'systemverilog',
      testbenchEnabled: true,
      wave: false
    }];
  });
  const [activeProjectId, setActiveProjectId] = useState(() => {
    const saved = localStorage.getItem('hdlab-active-project');
    return projects.some(p => p.id === saved) ? saved : projects[0].id;
  });
  const activeProject = projects.find(p => p.id === activeProjectId) ?? projects[0];
  const activeSim = simStates[activeProjectId] ?? EMPTY_SIM;

  // The active project is the single source of truth for the editor contents.
  const { testbench, language, testbenchLang, testbenchEnabled, wave } = activeProject;
  // Design files with folders; the top file holds the design's top module
  const { files: designFiles, folders: designFolders, topFile } = activeProject;
  const activeFile = designFiles.some(f => f.path === activeProject.activeFile) ? activeProject.activeFile : topFile;
  const activeFileContent = designFiles.find(f => f.path === activeFile)?.content ?? '';
  const topFileContent = designFiles.find(f => f.path === topFile)?.content ?? '';
  const allFolderPaths = allFolders(designFiles, designFolders);
  // Modules, packages and instantiations for the hierarchy view and the top module
  const designAnalysis = useMemo(() => analyzeDesign(designFiles, topFile), [designFiles, topFile]);
  // Changes whenever the synthesized design would change (board tab: "code changed" hint)
  const boardDesignKey = useMemo(
    () => JSON.stringify([topFile, designFiles.map(f => [basename(f.path), f.content])]),
    [designFiles, topFile]
  );
  const updateProject = (projectId, patch) =>
    setProjects(prev => prev.map(p => (p.id === projectId ? { ...p, ...patch(p) } : p)));
  // Setter for one field of the active project; accepts a value or an updater function like useState.
  const projectFieldSetter = field => value =>
    updateProject(activeProject.id, p => ({ [field]: typeof value === 'function' ? value(p[field]) : value }));
  const setTestbench = projectFieldSetter('testbench');
  const setLanguage = projectFieldSetter('language');
  const setTestbenchLang = projectFieldSetter('testbenchLang');
  const setTestbenchEnabled = projectFieldSetter('testbenchEnabled');
  const setWave = projectFieldSetter('wave');
  // Applies a design-file operation (utils/designFiles.js) to the active project.
  // Folders of files are kept explicitly, so a folder stays when its last file moves out.
  const changeDesign = op =>
    updateProject(activeProject.id, p => {
      const next = { ...p, ...op(p) };
      return { ...next, folders: allFolders(next.files, next.folders) };
    });
  const setActiveFile = path => changeDesign(() => ({ activeFile: path }));
  const setActiveFileContent = value => changeDesign(p => updateContent(p, activeFile, value));
  const setTopFileContent = value => changeDesign(p => updateContent(p, p.topFile, value));

  // Explorer UI state: visibility and the folder new files go into
  const [explorerOpen, setExplorerOpen] = useState(true);
  // Widths in the editor: explorer (px) and share of the HDL code next to the testbench
  const editorSectionRef = useRef(null);
  const workspaceRef = useRef(null);
  const [explorerWidth, startExplorerResize, resetExplorerWidth] = useDragSize({
    storageKey: 'hdlab-explorer-width',
    initial: 210,
    min: 140,
    // The code editor next to it keeps at least 240 px
    max: () => (workspaceRef.current?.clientWidth || window.innerWidth) - 240,
    axis: 'x',
  });
  const [codeShare, startEditorSplit, resetEditorSplit] = useSplitRatio({
    storageKey: 'hdlab-code-share',
    containerRef: editorSectionRef,
    // Explorer (at least 140 px) and code editor (240 px) both have to fit
    minStart: explorerOpen ? 400 : 260,
    minEnd: 260,
  });
  const [selectedFolder, setSelectedFolder] = useState('');
  const targetFolder = allFolderPaths.includes(selectedFolder) ? selectedFolder : '';

  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Module Library Drawer state
  const [moduleLibraryOpen, setModuleLibraryOpen] = useState(false);
  const [moduleLibraryRefreshKey, setModuleLibraryRefreshKey] = useState(0);
  // Ref to hold the active insert-module handler (set by TutorialLesson when mounted)
  const tutorialInsertRef = useRef(null);

  // Tutorial state
  // Seite ('home', 'tutorial' oder 'course') und Kurs aus dem Lehre-Menü folgen der URL
  const [{ page: currentPage, courseId: activeCourseId, lesson: routeLesson }, navigate] = useRoute(isAuthenticated);
  
  // Module Library state
  const [moduleRefreshKey, setModuleRefreshKey] = useState(0);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [moduleFormData, setModuleFormData] = useState({ name: '', description: '', tags: '' });
  useEffect(() => {
    localStorage.setItem('hdlab-projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('hdlab-active-project', activeProjectId);
  }, [activeProjectId]);

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
      if ((currentPage === 'tutorial' || currentPage === 'course') && tutorialInsertRef.current) {
        tutorialInsertRef.current(moduleCode);
      } else {
        // Appended to the file open in the editor
        changeDesign(p => {
          const current = p.files.find(f => f.path === activeFile)?.content ?? '';
          return current.includes(moduleCode) ? {} : updateContent(p, activeFile, `${current}\n\n${moduleCode}`);
        });
      }
    };
    
    // Tutorial handler
    const handleTutorialOpen = () => {
      if (currentPage !== 'tutorial') navigate(TUTORIAL_PATH);
    };

    const handleCourseOpen = (courseId) => {
      if (currentPage !== 'course' || activeCourseId !== courseId) navigate(coursePath(courseId));
    };

    // Lektion (oder Übersicht) innerhalb des geöffneten Tutorials/Kurses
    const handleLessonNavigate = (lesson, options) => {
      const base = currentPage === 'course' ? coursePath(activeCourseId) : TUTORIAL_PATH;
      navigate(`${base}/${lesson}`, options);
    };

    const handleTutorialClose = () => {
      navigate(EDITOR_PATH);
    };

    const mainContentRef = useRef(null);

    // Back to the editor view; projects and their contents are kept as they are.
    const handleHome = () => {
      navigate(EDITOR_PATH);
      setHelpOpen(false);
      setSettingsOpen(false);
      if (mainContentRef.current) {
        mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };


    // Download als .sv oder ZIP
    async function handleSave() {
      try {
        const hasTestbench = testbenchEnabled && testbench.trim().length > 0;
        if (hasTestbench || designFiles.length > 1) {
          // ZIP mit allen Design-Dateien in ihren Ordnern und tb.sv oder tb.py
          const zip = new JSZip();
          designFiles.forEach(f => zip.file(f.path, f.content));
          // Top file and testbench for "Öffnen", so the import restores the same project
          zip.file(MANIFEST_NAME, JSON.stringify(buildManifest(activeProject), null, 2));
          if (hasTestbench) zip.file(testbenchLang === 'python' ? 'tb.py' : 'tb.sv', testbench);
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
          // Nur die Top-Datei als Download
          const blob = new Blob([topFileContent], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = basename(topFile);
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 100);
          alert(uiLanguage === 'de' ? `Design wurde als ${basename(topFile)} heruntergeladen.` : `Design has been downloaded as ${basename(topFile)}.`);
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
      if (window.confirm(t.openPrompt)) {
        designInputRef.current.value = '';
        designInputRef.current.click();
      }
    }

    // Handler für Design-Datei
    function onDesignFileChange(e) {
      const file = e.target.files[0];
      if (!file) return;
      if (/\.zip$/i.test(file.name)) {
        importProjectZip(file);
        return;
      }
      // Sonst nur .sv, .v oder .txt erlauben
      if (!/\.(sv|v|txt)$/i.test(file.name)) {
        alert(uiLanguage === 'de'
          ? 'Nur Dateien mit der Endung .zip, .sv, .v oder .txt sind erlaubt!'
          : 'Only files ending with .zip, .sv, .v or .txt are allowed!');
        return;
      }
      const reader = new FileReader();
      reader.onload = evt => {
        setTopFileContent(evt.target.result);
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

    // Projekt-ZIP als neues Projekt öffnen (Ordnerstruktur, Top-Datei und Testbench, siehe utils/projectImport.js)
    async function importProjectZip(file) {
      try {
        const zip = await JSZip.loadAsync(file);
        const entries = [];
        let total = 0;
        for (const entry of Object.values(zip.files)) {
          if (entry.dir) continue;
          // Only files that can become part of the project are unpacked; others are just reported
          if (!/\.(sv|v|py|json)$/i.test(entry.name)) {
            entries.push({ path: entry.name, content: '' });
            continue;
          }
          const content = await entry.async('string');
          total += content.length;
          if (total > MAX_IMPORT_BYTES) {
            alert(t.importTooLarge);
            return;
          }
          entries.push({ path: entry.name, content });
        }
        const { project, report } = importProject(entries);

        const names = new Set(projects.map(p => p.name));
        const base = file.name.replace(/\.zip$/i, '') || 'Import';
        let name = base;
        for (let n = 2; names.has(name); n++) name = `${base} (${n})`;
        const id = `project-${Date.now()}`;
        setProjects(prev => [...prev, { id, name, language: 'systemverilog', wave: false, ...project }]);
        setActiveProjectId(id);
        setSelectedFolder('');

        const messages = [t.importSummary({
          name,
          count: project.files.length,
          topFile: project.topFile,
          guessed: !report.topFromManifest,
          testbench: report.testbenchPath,
        })];
        if (report.renamed.length > 0) messages.push(t.importRenamed(report.renamed.map(([from, to]) => `${from} → ${to}`).join('\n')));
        if (report.ignored.length > 0) messages.push(t.importIgnored(report.ignored.slice(0, 15).join('\n') + (report.ignored.length > 15 ? '\n…' : '')));
        alert(messages.join('\n\n'));
      } catch (err) {
        if (err.message === 'noDesignFiles') alert(t.importNoDesign);
        else if (err.message === 'tooManyFiles') alert(t.importTooMany(MAX_DESIGN_FILES));
        else alert(t.importFailed + err.message);
      }
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

      setTopFileContent(example.code);
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
      const names = new Set(projects.map(p => p.name));
      let n = projects.length + 1;
      while (names.has(`Project ${n}`)) n++;
      const newProject = {
        id: newId,
        name: `Project ${n}`,
        ...newDesign(),
        testbench: '',
        language: 'systemverilog',
        testbenchLang: 'systemverilog',
        testbenchEnabled: true,
        wave: false
      };
      setProjects(prev => [...prev, newProject]);
      setActiveProjectId(newId);
      setSidebarOpen(false); // Close mobile menu after creating project
    }

    function handleSelectProject(projectId) {
      if (!projects.some(p => p.id === projectId)) return;
      setActiveProjectId(projectId);
      setSidebarOpen(false); // Close mobile menu after switching project
    }

    function handleRenameProject(projectId, name) {
      const trimmed = name.trim();
      if (!trimmed) return;
      updateProject(projectId, () => ({ name: trimmed }));
    }

    function handleCloseProject(projectId) {
      if (projects.length <= 1) {
        alert(uiLanguage === 'de' ? 'Das letzte Projekt kann nicht geschlossen werden.' : 'Cannot close the last project.');
        return;
      }
      const project = projects.find(p => p.id === projectId);
      const confirmMessage = uiLanguage === 'de'
        ? `Projekt "${project?.name}" wirklich schließen? Der Inhalt geht dabei verloren.`
        : `Really close project "${project?.name}"? Its contents will be lost.`;
      if (!window.confirm(confirmMessage)) return;

      const newProjects = projects.filter(p => p.id !== projectId);
      setProjects(newProjects);
      setSimStates(prev => {
        const rest = { ...prev };
        delete rest[projectId];
        return rest;
      });

      if (activeProjectId === projectId) {
        setActiveProjectId(newProjects[0].id);
      }
    }

    // ---- Design explorer: files, folders, top file
    const promptName = (message, initial) => {
      const value = window.prompt(message, initial);
      return value === null ? null : value.trim();
    };
    // Alerts and returns true if the file name can't be used
    const rejectFilename = (name, ignorePath = null) => {
      const error = validateFilename(name, designFiles, ignorePath);
      if (error) alert(t.fileErrors[error](name));
      return !!error;
    };

    function handleOpenFile(path) {
      setActiveFile(path);
      setSelectedFolder(dirname(path));
    }

    // kind: 'module' | 'package' | 'header' - created from a template in the selected folder
    const NEW_SOURCE = {
      module: { prompt: () => t.moduleNamePrompt, initial: 'my_module', ext: '.sv', template: moduleTemplate },
      package: { prompt: () => t.packageNamePrompt, initial: 'my_pkg', ext: '.sv', template: packageTemplate },
      header: { prompt: () => t.headerNamePrompt, initial: 'defs', ext: '.svh', template: headerTemplate },
    };
    function handleNewSource(kind) {
      const { prompt, initial, ext, template } = NEW_SOURCE[kind];
      const name = promptName(prompt(), initial);
      if (!name) return;
      if (!SV_IDENTIFIER.test(name)) {
        alert(t.invalidIdentifier);
        return;
      }
      if (rejectFilename(`${name}${ext}`)) return;
      changeDesign(p => upsertFile(p, joinPath(targetFolder, `${name}${ext}`), template(name)));
    }

    function handleNewFolder() {
      const name = promptName(t.folderNamePrompt, 'ordner');
      if (!name) return;
      const error = validateFolderName(name, allFolderPaths, targetFolder);
      if (error) {
        alert(t.fileErrors[error](name));
        return;
      }
      const path = joinPath(targetFolder, name);
      changeDesign(p => addFolder(p, path));
      setSelectedFolder(path);
    }

    async function handleImportFiles(fileList, folder) {
      const destination = allFolderPaths.includes(folder) ? folder : '';
      const imported = [];
      for (const file of [...fileList]) {
        const name = sanitizeFilename(file.name);
        const error = validateFilename(name, designFiles);
        if (error === 'nameTaken') {
          if (!window.confirm(t.overwriteImportConfirm(name))) continue;
        } else if (error) {
          alert(t.fileErrors[error](name));
          continue;
        }
        imported.push({ name, content: await file.text() });
      }
      if (imported.length === 0) return;
      // An existing file with the same name is overwritten where it is
      changeDesign(p => imported.reduce((state, { name, content }) => {
        const existing = state.files.find(f => basename(f.path) === name);
        return { ...state, ...upsertFile(state, existing ? existing.path : joinPath(destination, name), content) };
      }, p));
    }

    function handleRenameFile(path) {
      const current = basename(path);
      let name = promptName(t.renamePrompt, current);
      if (!name || name === current) return;
      if (!hasDesignExtension(name)) name += isHeaderFile(path) ? '.svh' : '.sv';
      if (path === topFile && isHeaderFile(name)) {
        alert(t.topIsHeader);
        return;
      }
      if (rejectFilename(name, path)) return;
      changeDesign(p => moveFile(p, path, joinPath(dirname(path), name)));
    }

    function handleDeleteFile(path) {
      if (path === topFile || !window.confirm(t.removeFileConfirm(basename(path)))) return;
      changeDesign(p => removeFile(p, path));
    }

    // Keeps the selected folder pointing at a folder that was moved or renamed
    const followFolder = (path, newPath) => {
      if (isInside(selectedFolder, path)) setSelectedFolder(newPath + selectedFolder.slice(path.length));
    };

    function handleRenameFolder(path) {
      const name = promptName(t.renamePrompt, basename(path));
      if (!name || name === basename(path)) return;
      const error = validateFolderName(name, allFolderPaths, dirname(path));
      if (error) {
        alert(t.fileErrors[error](name));
        return;
      }
      const newPath = joinPath(dirname(path), name);
      changeDesign(p => moveFolder(p, path, newPath));
      followFolder(path, newPath);
    }

    function handleDeleteFolder(path) {
      if (isInside(topFile, path)) {
        alert(t.folderHasTop);
        return;
      }
      const count = designFiles.filter(f => isInside(f.path, path)).length;
      if (!window.confirm(t.removeFolderConfirm(basename(path), count))) return;
      changeDesign(p => removeFolder(p, path));
      if (isInside(selectedFolder, path)) setSelectedFolder(dirname(path));
    }

    // Drag & drop in the explorer: item = { type: 'file' | 'folder', path }
    function handleMove(item, destination) {
      const newPath = joinPath(destination, basename(item.path));
      if (newPath === item.path) return;
      if (item.type === 'file') {
        changeDesign(p => moveFile(p, item.path, newPath));
        return;
      }
      if (isInside(destination, item.path)) return; // into itself
      if (allFolderPaths.includes(newPath)) {
        alert(t.fileErrors.folderTaken(basename(item.path)));
        return;
      }
      changeDesign(p => moveFolder(p, item.path, newPath));
      followFolder(item.path, newPath);
    }

    // Adds a library entry as its own file (in the selected folder) instead of pasting it into the editor
    function handleAddLibraryFile(module) {
      let base = module.moduleName.replace(/[^A-Za-z0-9_]/g, '_') || 'module';
      if (RESERVED_FILENAMES.includes(`${base}.sv`)) base += '_lib';
      const filename = `${base}.sv`;
      const existing = designFiles.find(f => basename(f.path) === filename);
      if (existing && existing.content !== module.code && !window.confirm(t.overwriteFileConfirm(filename))) return;
      changeDesign(p => upsertFile(p, existing ? existing.path : joinPath(targetFolder, filename), module.code));
    }


  /**
   * Starts a simulation:
   * - Creates a project with current code and (if enabled) testbench
   * - Starts a simulation job for the project
   * - Polls for the simulation result and displays the log output
   */

  // Top-Modul der Simulation: Testbench-Modul bei SV-Testbench, sonst das Top-Modul des Designs
  // (erstes nicht instanziiertes Modul der Top-Datei, siehe utils/svHierarchy.js)
  function extractTopModuleName({ testbench, testbenchEnabled, testbenchLang }) {
    // Helper: suche erstes Modul in gegebenem Code
    function findModuleName(src) {
      if (!src) return null;
      // Kommentare entfernen
      const noBlock = src.replace(/\/\*[\s\S]*?\*\//g, ' ');
      const noLine = noBlock.replace(/\/\/.*$/gm, ' ');
      const match = noLine.match(/module\s+([a-zA-Z_][a-zA-Z0-9_$]*)/);
      return match ? match[1] : null;
    }
    const designTop = designAnalysis.topModule || 'main';
    // Bei Cocotb: immer Design-Modul als Top verwenden
    if (testbenchEnabled && testbenchLang === 'python') {
      return designTop;
    }
    // Bei SV-Testbench: Testbench-Modul als Top verwenden
    if (testbenchEnabled && testbench && testbench.trim().length > 0) {
      return findModuleName(testbench) || 'tb';
    }
    // Sonst Design-Modulname
    return designTop;
  }

  // Poll interval and upper bound while waiting for a queued/running simulation.
  const SIM_POLL_INTERVAL_MS = 1000;
  const SIM_POLL_TIMEOUT_MS = 5 * 60 * 1000;

  /** Polls until the worker has finished (jobs may wait in the queue behind others). */
  async function waitForSimulation(simulationId) {
    const deadline = Date.now() + SIM_POLL_TIMEOUT_MS;
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, SIM_POLL_INTERVAL_MS));
      const res = await apiCall(`/simulations/${simulationId}/results`);
      if (res.ok) {
        const result = await res.json();
        if (result.status === 'finished' || result.status === 'error') return result;
      }
    }
    return null;
  }

  /** Uploads the design files as a project; returns the project id. */
  async function uploadProject(files) {
    const projectRes = await apiCall('/projects', {
      method: 'POST',
      body: JSON.stringify({ name: 'Playground', files }),
    });
    if (projectRes.status === 413) throw new Error(t.projectTooLarge);
    const project = await projectRes.json();
    if (!projectRes.ok) throw new Error(project.error || `HTTP ${projectRes.status}`);
    return project._id;
  }

  /**
   * Synthesizes the design (without testbench) for the Basys3 board simulation.
   * Only this step runs on the server; the simulation itself runs in the browser.
   * @returns {Promise<object>} flattened Yosys netlist
   * @throws {Error} with the synthesis log as message
   */
  async function synthesizeBoard() {
    const files = designFiles.map(f => ({ filename: basename(f.path), content: f.content, language }));
    const projectId = await uploadProject(files);
    const simRes = await apiCall('/simulations', {
      method: 'POST',
      body: JSON.stringify({
        projectId,
        language,
        testbenchType: null,
        topModule: designAnalysis.topModule || 'main',
        settings: { mode: 'board', topFile: basename(topFile) },
      }),
    });
    const sim = await simRes.json();
    if (!simRes.ok) throw new Error(sim.error || `HTTP ${simRes.status}`);
    const result = await waitForSimulation(sim._id);
    if (!result) throw new Error(t.noResult);
    if (result.status !== 'finished' || !result.hasBoard) throw new Error(result.log || t.noResult);
    const boardRes = await apiCall(`/simulations/${sim._id}/board`);
    if (!boardRes.ok) throw new Error(`HTTP ${boardRes.status}`);
    return boardRes.json();
  }

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
      // Folders only exist in the UI: the simulation gets the files flat (names are unique).
      // The worker compiles packages before the files importing them.
      const files = designFiles.map(f => ({ filename: basename(f.path), content: f.content, language }));
      // Only add testbench if enabled and not empty
      if (testbenchEnabled && testbench.trim().length > 0) {
        files.push({ filename: testbenchLang === 'python' ? 'tb.py' : 'tb.sv', content: testbench, language: testbenchLang });
      }
      // Top-Modulnamen automatisch erkennen
      const topModule = extractTopModuleName({ testbench, testbenchEnabled, testbenchLang });
      const projectId = await uploadProject(files);
      // 2. Create simulation
      const simRes = await apiCall('/simulations', {
        method: 'POST',
        body: JSON.stringify({
          projectId,
          language,
          testbenchType: testbenchEnabled ? testbenchLang : null,
          topModule, // <--- Top-Modulname übergeben
          settings: {
            generateWave: !!wave,
            generateNetlist: true,
            // File holding the design's top module (for the netlist and the compile order)
            topFile: basename(topFile)
          }
        })
      });
      const sim = await simRes.json();
      if (!simRes.ok) throw new Error(sim.error || `HTTP ${simRes.status}`);
      updateRun({ simulationId: sim._id });
      // 3. Poll until the worker has finished
      const result = await waitForSimulation(sim._id);
      const rawLog = result?.log || '';
      const summarized = summarizeSimulationLog(rawLog, t.noResult, t.warningsHint);
      updateRun({
        status: result?.status === 'finished' ? 'finished' : 'error',
        logSummary: summarized.summary,
        logDetails: summarized.details,
        hasWaveform: !!result?.hasWaveform,
        hasNetlist: !!result?.hasNetlist,
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
        homeActive={currentPage === 'home'}
        onTutorial={handleTutorialOpen}
        onOpenCourse={handleCourseOpen}
        activeCourseId={currentPage === 'course' ? activeCourseId : null}
        uiLanguage={uiLanguage}
        setUiLanguage={setUiLanguage}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        moduleLibraryOpen={moduleLibraryOpen}
        onToggleModuleLibrary={handleToggleModuleLibrary}
        moduleLibraryCode={currentPage === 'home' ? activeFileContent : topFileContent}
        onInsertModule={handleInsertModuleFromLibrary}
        onAddLibraryFile={currentPage === 'home' ? handleAddLibraryFile : null}
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
                <li>{t.helpFeature6}</li>
                <li>{t.helpFeature7}</li>
                <li>{t.helpFeature8}</li>
              </ul>
            </div>

            <div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{t.helpSectionSignalColors}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', rowGap: 8, columnGap: 10, alignItems: 'center' }}>
                <span style={{ width: 18, height: 2, background: 'var(--wave-bit)', display: 'inline-block' }} />
                <span><strong>{t.helpColorBit}</strong></span>

                <span style={{ width: 18, height: 8, border: '2px solid var(--wave-bus)', boxSizing: 'border-box', display: 'inline-block' }} />
                <span><strong>{t.helpColorBus}</strong></span>

                <span style={{ width: 18, height: 8, background: 'var(--wave-unknown)', opacity: 0.6, display: 'inline-block' }} />
                <span><strong>{t.helpColorUnknown}</strong></span>
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
        {currentPage === 'home' && (
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
        )}
        {/* Unsichtbare File-Inputs für Datei-Upload */}
        <input type="file" accept=".zip,.sv,.v,.txt" style={{ display: 'none' }} ref={designInputRef} onChange={onDesignFileChange} />
        <input type="file" accept=".sv,.py,.txt" style={{ display: 'none' }} ref={tbInputRef} onChange={onTbFileChange} />
        
        {/* Tutorial Container */}
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

        {/* Lehre: Kurs-Tutorial (key erzwingt Neuladen beim Kurswechsel) */}
        {currentPage === 'course' && getCourse(activeCourseId) && (
          <TutorialContainer
            key={activeCourseId}
            courseId={activeCourseId}
            routeLesson={routeLesson}
            onNavigate={handleLessonNavigate}
            tutorialPath={getCourse(activeCourseId).tutorialPath}
            title={getCourse(activeCourseId).title[uiLanguage] || getCourse(activeCourseId).title.de}
            subtitle={getCourse(activeCourseId).subtitle[uiLanguage] || getCourse(activeCourseId).subtitle.de}
            uiLanguage={uiLanguage}
            editorTheme={editorTheme}
            onModuleSaved={handleModuleLibraryRefresh}
            onRegisterInsert={(fn) => { tutorialInsertRef.current = fn; }}
            navOpen={sidebarOpen}
            onCloseNav={() => setSidebarOpen(false)}
          />
        )}

        {/* Normal Editor View */}
        {currentPage === 'home' && (
        <main className="workbench">
          <div className="home-main" ref={mainContentRef}>
          <EditorTabs
            projects={projects}
            activeProjectId={activeProjectId}
            simStatuses={Object.fromEntries(Object.entries(simStates).map(([id, sim]) => [id, sim.status]))}
            onSelectProject={handleSelectProject}
            onCloseProject={handleCloseProject}
            onRenameProject={handleRenameProject}
            onNewProject={handleNewProject}
            uiLanguage={uiLanguage}
          />
          
          {/* Design and testbench editor side by side, filling the space above the dock */}
            <div
              className={`editor-section ${testbenchEnabled ? 'has-split' : ''}`}
              ref={editorSectionRef}
              style={{ '--code-grow': codeShare, '--testbench-grow': 1 - codeShare }}
            >
              <div className="editor-block code-block">
                <FullscreenPanel
                  label={`${t.code} · ${activeFile}`}
                  uiLanguage={uiLanguage}
                  actions={(
                    <button
                      type="button"
                      className="fullscreen-toggle"
                      onClick={() => setExplorerOpen(open => !open)}
                      title={explorerOpen ? t.hideExplorer : t.showExplorer}
                      aria-label={explorerOpen ? t.hideExplorer : t.showExplorer}
                      aria-pressed={explorerOpen}
                    >
                      ☰
                    </button>
                  )}
                >
                  <div className="design-workspace" ref={workspaceRef} style={{ '--explorer-width': `${explorerWidth}px` }}>
                    {explorerOpen && (
                      <div className="design-workspace-explorer">
                        <DesignExplorer
                          files={designFiles}
                          folders={designFolders}
                          topFile={topFile}
                          activeFile={activeFile}
                          analysis={designAnalysis}
                          selectedFolder={targetFolder}
                          onSelectFolder={setSelectedFolder}
                          onOpenFile={handleOpenFile}
                          onNewModule={() => handleNewSource('module')}
                          onNewPackage={() => handleNewSource('package')}
                          onNewHeader={() => handleNewSource('header')}
                          onNewFolder={handleNewFolder}
                          onImport={handleImportFiles}
                          onSetTop={path => changeDesign(() => ({ topFile: path }))}
                          onRenameFile={handleRenameFile}
                          onDeleteFile={handleDeleteFile}
                          onRenameFolder={handleRenameFolder}
                          onDeleteFolder={handleDeleteFolder}
                          onMove={handleMove}
                          uiLanguage={uiLanguage}
                        />
                      </div>
                    )}
                    {explorerOpen && (
                      <div
                        className="design-workspace-splitter"
                        role="separator"
                        aria-orientation="vertical"
                        aria-label={t.resizeExplorer}
                        title={t.resizeExplorer}
                        onPointerDown={startExplorerResize}
                        onDoubleClick={resetExplorerWidth}
                      />
                    )}
                    <div className="design-workspace-editor">
                      {/* Remounted per file so undo history doesn't mix files */}
                      <Editor
                        key={`${activeProject.id}:${activeFile}`}
                        height="100%"
                        defaultLanguage={language}
                        value={activeFileContent}
                        onChange={v => setActiveFileContent(v ?? '')}
                        theme={editorTheme}
                        options={{ fontSize: 16 }}
                      />
                    </div>
                  </div>
                </FullscreenPanel>
              </div>
              {testbenchEnabled && (
                <div
                  className="editor-splitter"
                  role="separator"
                  aria-orientation="vertical"
                  aria-label={t.resizeEditors}
                  title={t.resizeEditors}
                  onPointerDown={startEditorSplit}
                  onDoubleClick={resetEditorSplit}
                />
              )}
              {testbenchEnabled && (
                <div className="editor-block testbench-block">
                  <FullscreenPanel label={`${t.testbench} (${testbenchLang})`} uiLanguage={uiLanguage}>
                    <Editor
                      height="100%"
                      defaultLanguage={testbenchLang}
                      value={testbench}
                      onChange={v => setTestbench(v)}
                      theme={editorTheme}
                      options={{ fontSize: 16 }}
                    />
                  </FullscreenPanel>
                </div>
              )}
            </div>
                            
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
                      if (!moduleFormData.name.trim() || !activeFileContent.trim()) {
                        alert('Modulname und Code erforderlich');
                        return;
                      }
                      try {
                        const res = await apiCall('/modules', {
                          method: 'POST',
                          body: JSON.stringify({
                            moduleName: moduleFormData.name.trim(),
                            code: activeFileContent,
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
          <SimulationPanel
            key={activeProjectId}
            sim={activeSim}
            onRun={runSimulation}
            onSynthesizeBoard={synthesizeBoard}
            designKey={boardDesignKey}
            apiCall={apiCall}
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

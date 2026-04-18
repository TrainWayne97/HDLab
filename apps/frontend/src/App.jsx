// UI translations for simulation button and log heading
const TRANSLATIONS = {
  de: {
    run: 'Simulation starten',
    running: 'Simulation läuft...',
    log: 'Simulation Ergebnis',
    logDetails: 'Details anzeigen',
    compactView: 'Kompakt',
    fullView: 'Vollständig',
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
    code: 'HDL Code',
    testbench: 'Testbench',
    noResult: 'No result received.',
    error: 'Error: '
  }
};
import { useState, useRef } from 'react'
import JSZip from 'jszip';
import Editor from '@monaco-editor/react';
import './App.css';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

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


function App() {
  const [code, setCode] = useState('module main;\n  initial begin\n    $display("Hello, Verilator!");\n    $finish;\n  end\nendmodule\n');
  const [testbench, setTestbench] = useState('');
  const [logSummary, setLogSummary] = useState('');
  const [logDetails, setLogDetails] = useState('');
  const [logRaw, setLogRaw] = useState('');
  const [logViewMode, setLogViewMode] = useState('compact');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('systemverilog');
  const [testbenchLang, setTestbenchLang] = useState('systemverilog');
  const [wave, setWave] = useState(false);
  const [testbenchEnabled, setTestbenchEnabled] = useState(true);
  // UI language: 'de' (German) or 'en' (English)
  const [uiLanguage, setUiLanguage] = useState('de');


    // Dummy callbacks for menu actions
    const handleLogin = () => alert('Login coming soon!');
    const handleSettings = () => alert('Settings coming soon!');
    const handleHelp = () => alert('Help coming soon!');


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


  /**
   * Starts a simulation:
   * - Creates a project with current code and (if enabled) testbench
   * - Starts a simulation job for the project
   * - Polls for the simulation result and displays the log output
   */
  async function runSimulation() {
    setLoading(true);
    setLogSummary('');
    setLogDetails('');
    setLogRaw('');
    setLogViewMode('compact');
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
          testbenchType: testbenchEnabled ? testbenchLang : null
        })
      });
      const sim = await simRes.json();
      // 3. Poll for result
      let result = null;
      for (let i = 0; i < 30; ++i) {
        await new Promise(r => setTimeout(r, 1000));
        const res = await fetch(`/api/simulations/${sim._id}/results`);
        if (res.ok) {
          result = await res.json();
          if (result.log) break;
        }
      }
      const rawLog = result?.log || '';
      const summarized = summarizeSimulationLog(rawLog, t.noResult);
      setLogSummary(summarized.summary);
      setLogDetails(summarized.details);
      setLogRaw(extractRelevantCocotbLog(rawLog, t.noResult));
    } catch (err) {
      setLogSummary(t.error + err.message);
      setLogDetails('');
      setLogRaw('');
    }
    setLoading(false);
  }

  const t = TRANSLATIONS[uiLanguage] || TRANSLATIONS.de;
  return (
    <div className="fullscreen-app">
      <Topbar
        onLogin={handleLogin}
        onSettings={handleSettings}
        onHelp={handleHelp}
        uiLanguage={uiLanguage}
        setUiLanguage={setUiLanguage}
      />
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
        />
        {/* Unsichtbare File-Inputs für Datei-Upload */}
        <input type="file" accept=".sv,.txt" style={{ display: 'none' }} ref={designInputRef} onChange={onDesignFileChange} />
        <input type="file" accept=".sv,.py,.txt" style={{ display: 'none' }} ref={tbInputRef} onChange={onTbFileChange} />
        <main className="main-content-full">
          <div className="editor-section">
            <div className="editor-block">
              <label className="editor-label">{t.code}</label>
              <Editor
                height="220px"
                defaultLanguage={language}
                value={code}
                onChange={v => setCode(v)}
                theme="vs-dark"
                options={{ fontSize: 16 }}
              />
            </div>
            {testbenchEnabled && (
              <div className="editor-block">
                <label className="editor-label">{t.testbench} ({testbenchLang})</label>
                <Editor
                  height="220px"
                  defaultLanguage={testbenchLang}
                  value={testbench}
                  onChange={v => setTestbench(v)}
                  theme="vs-dark"
                  options={{ fontSize: 16 }}
                />
              </div>
            )}
          </div>
          <button className="run-btn" onClick={runSimulation} disabled={loading}>
            {loading ? t.running : t.run}
          </button>
          <h3>{t.log}</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button
              type="button"
              onClick={() => setLogViewMode('compact')}
              style={{ fontWeight: logViewMode === 'compact' ? 'bold' : 'normal' }}
            >
              {t.compactView}
            </button>
            <button
              type="button"
              onClick={() => setLogViewMode('full')}
              style={{ fontWeight: logViewMode === 'full' ? 'bold' : 'normal' }}
            >
              {t.fullView}
            </button>
          </div>

          {logViewMode === 'compact' ? (
            <>
              <pre className="log-output" style={{ maxHeight: 180, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>{logSummary}</pre>
              {logDetails && (
                <details style={{ marginTop: 12 }}>
                  <summary>{t.logDetails}</summary>
                  <pre className="log-output" style={{ maxHeight: 240, overflowY: 'auto', whiteSpace: 'pre-wrap', marginTop: 8 }}>{logDetails}</pre>
                </details>
              )}
            </>
          ) : (
            <pre className="log-output" style={{ maxHeight: 320, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>{logRaw || logSummary}</pre>
          )}
        </main>
      </div>
    </div>
  );

  // ...existing code...
}

export default App

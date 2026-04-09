// UI translations for simulation button and log heading
const TRANSLATIONS = {
  de: {
    run: 'Simulation starten',
    running: 'Simulation läuft...',
    log: 'Simulation Log',
    code: 'HDL Code',
    testbench: 'Testbench',
    noResult: 'Kein Ergebnis erhalten.',
    error: 'Fehler: '
  },
  en: {
    run: 'Start Simulation',
    running: 'Simulation running...',
    log: 'Simulation Log',
    code: 'HDL Code',
    testbench: 'Testbench',
    noResult: 'No result received.',
    error: 'Error: '
  }
};
import { useState } from 'react'
import Editor from '@monaco-editor/react';
import './App.css';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';


function App() {
  const [code, setCode] = useState('module main;\n  initial begin\n    $display("Hello, Verilator!");\n    $finish;\n  end\nendmodule\n');
  const [testbench, setTestbench] = useState('');
  const [log, setLog] = useState('');
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
    const handleSave = () => alert('Save coming soon!');
    const handleOpen = () => alert('Open coming soon!');

    /**
     * Callback for code example selection from Sidebar
     * Loads code and (if present) testbench into the editors, sets testbench state accordingly
     */
    function handleExample(example) {
      setCode(example.code);
      if (example.testbench) {
        setTestbench(example.testbench);
        if (!testbenchEnabled) setTestbenchEnabled(true);
        setTestbenchLang('systemverilog');
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
    setLog('');
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
      setLog(result?.log || t.noResult);
    } catch (err) {
      setLog(t.error + err.message);
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
          <pre className="log-output" style={{ maxHeight: 320, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>{log}</pre>
        </main>
      </div>
    </div>
  );

  // ...existing code...
}

export default App

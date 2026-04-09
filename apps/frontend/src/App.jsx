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

  // Dummy callbacks für Menü
  const handleLogin = () => alert('Login kommt bald!');
  const handleSettings = () => alert('Einstellungen kommen bald!');
  const handleHelp = () => alert('Hilfe kommt bald!');
  const handleSave = () => alert('Speichern kommt bald!');
  const handleOpen = () => alert('Öffnen kommt bald!');

  // Callback für Code-Beispiel-Auswahl
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

  async function runSimulation() {
    setLoading(true);
    setLog('');
    try {
      // 1. Projekt anlegen
      // Dateien je nach Testbench-Status
      const files = [
        { filename: 'main.sv', content: code, language: language }
      ];
      // Testbench nur anhängen, wenn aktiviert und nicht leer
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
      // 2. Simulation anlegen
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
      // 3. Polling auf Ergebnis
      let result = null;
      for (let i = 0; i < 30; ++i) {
        await new Promise(r => setTimeout(r, 1000));
        const res = await fetch(`/api/simulations/${sim._id}/results`);
        if (res.ok) {
          result = await res.json();
          if (result.log) break;
        }
      }
      setLog(result?.log || 'Kein Ergebnis erhalten.');
    } catch (err) {
      setLog('Fehler: ' + err.message);
    }
    setLoading(false);
  }

  return (
    <div className="fullscreen-app">
      <Topbar onLogin={handleLogin} onSettings={handleSettings} onHelp={handleHelp} />
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
        />
        <main className="main-content-full">
          <h2>SystemVerilog Playground</h2>
          <div className="editor-section">
            <div className="editor-block">
              <label className="editor-label">HDL Code</label>
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
                <label className="editor-label">Testbench ({testbenchLang})</label>
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
            {loading ? 'Simulation läuft...' : 'Simulation starten'}
          </button>
          <h3>Simulation Log</h3>
          <pre className="log-output" style={{ maxHeight: 320, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>{log}</pre>
        </main>
      </div>
    </div>
  );

  // ...existing code...
}

export default App

import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import Editor from '@monaco-editor/react';
import './App.css'

function App() {
  const [code, setCode] = useState('module main;\n  initial begin\n    $display("Hello, Verilator!");\n    $finish;\n  end\nendmodule\n');
  const [log, setLog] = useState('');
  const [loading, setLoading] = useState(false);

  async function runSimulation() {
    setLoading(true);
    setLog('');
    try {
      // 1. Projekt anlegen
      const projectRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Playground',
          files: [
            { filename: 'main.sv', content: code, language: 'systemverilog' }
          ]
        })
      });
      const project = await projectRes.json();
      // 2. Simulation anlegen
      const simRes = await fetch('/api/simulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project._id })
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
    <div style={{ maxWidth: 900, margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h1>HDLab</h1>
      <Editor
        height="300px"
        defaultLanguage="verilog"
        value={code}
        onChange={v => setCode(v)}
        theme="vs-dark"
        options={{ fontSize: 16 }}
      />
      <button onClick={runSimulation} disabled={loading} style={{ margin: '1rem 0', padding: '0.5rem 1.5rem', fontSize: 18 }}>
        {loading ? 'Simulation läuft...' : 'Simulation starten'}
      </button>
      <h2>Simulation Log</h2>
      <pre style={{ background: '#222', color: '#eee', padding: 16, minHeight: 120 }}>{log}</pre>
    </div>
  );

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App

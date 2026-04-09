import React from 'react';
import './Sidebar.css';

export default function Sidebar({ language, setLanguage, testbenchLang, setTestbenchLang, onSave, onOpen, wave, setWave, testbenchEnabled, setTestbenchEnabled }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <label>HDL Sprache</label>
        <select value={language} onChange={e => setLanguage(e.target.value)}>
          <option value="systemverilog">SystemVerilog</option>
        </select>
      </div>
      <div className="sidebar-section">
        <label>
          <input type="checkbox" checked={testbenchEnabled} onChange={e => setTestbenchEnabled(e.target.checked)} style={{ marginRight: 8 }} />
          Testbench aktivieren
        </label>
      </div>
      {testbenchEnabled && (
        <div className="sidebar-section">
          <label>Testbench Sprache</label>
          <select value={testbenchLang} onChange={e => setTestbenchLang(e.target.value)}>
            <option value="systemverilog">SystemVerilog</option>
            <option value="python">Python</option>
          </select>
        </div>
      )}
      <div className="sidebar-section">
        <label>Wave-Datei erzeugen?</label>
        <input type="checkbox" checked={wave} onChange={e => setWave(e.target.checked)} />
      </div>
      <div className="sidebar-section">
        <button onClick={onSave}>Speichern</button>
        <button onClick={onOpen}>Öffnen</button>
      </div>
    </aside>
  );
}

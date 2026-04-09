import React, { useState } from 'react';
import './Sidebar.css';

// Example data for code examples menu
const EXAMPLES = {
  design: [
    {
      name: { de: 'Hello World', en: 'Hello World' },
      code: 'module main;\n  initial begin\n    $display("Hello, Verilator!");\n    $finish;\n  end\nendmodule\n',
    },
    {
      name: { de: 'AND-Gatter', en: 'AND gate' },
      code: 'module main(input logic a, b, output logic y);\n  assign y = a & b;\nendmodule\n',
    },
    {
      name: { de: 'OR-Gatter', en: 'OR gate' },
      code: 'module main(input logic a, b, output logic y);\n  assign y = a | b;\nendmodule\n',
    },
    {
      name: { de: 'NOT-Gatter', en: 'NOT gate' },
      code: 'module main(input logic a, output logic y);\n  assign y = ~a;\nendmodule\n',
    },
    {
      name: { de: 'XOR-Gatter', en: 'XOR gate' },
      code: 'module main(input logic a, b, output logic y);\n  assign y = a ^ b;\nendmodule\n',
    },
    {
      name: { de: '1-Bit Volladdierer', en: '1-bit Full Adder' },
      code: 'module main(input logic a, b, cin, output logic sum, cout);\n  assign {cout, sum} = a + b + cin;\nendmodule\n',
    },
    {
      name: { de: '2-Bit Zähler', en: '2-bit Counter' },
      code: 'module main(output logic [1:0] q);\n  initial begin\n    q = 0;\n    repeat (4) begin\n      #1 q = q + 1;\n    end\n  end\nendmodule\n',
    },
    {
      name: { de: 'Latch', en: 'Latch' },
      code: 'module main(input logic d, en, output logic q);\n  always_latch if (en) q = d;\nendmodule\n',
    },
    {
      name: { de: 'Multiplexer 2:1', en: '2:1 Multiplexer' },
      code: 'module main(input logic a, b, sel, output logic y);\n  assign y = sel ? b : a;\nendmodule\n',
    },
    {
      name: { de: 'D-Flipflop', en: 'D Flip-Flop' },
      code: 'module main(input logic clk, d, output logic q);\n  always_ff @(posedge clk) q <= d;\nendmodule\n',
    },
  ],
  testbench: [
    {
      name: { de: 'AND-Gatter mit Testbench', en: 'AND gate with testbench' },
      code: 'module main(input logic a, b, output logic y);\n  assign y = a & b;\nendmodule\n',
      testbench: 'module tb;\n  logic a, b, y;\n  main uut(.a(a), .b(b), .y(y));\n  initial begin\n    $display("a b | y");\n    a = 0; b = 0; #1 $display("%0d %0d | %0d", a, b, y);\n    a = 0; b = 1; #1 $display("%0d %0d | %0d", a, b, y);\n    a = 1; b = 0; #1 $display("%0d %0d | %0d", a, b, y);\n    a = 1; b = 1; #1 $display("%0d %0d | %0d", a, b, y);\n    $finish;\n  end\nendmodule\n',
    },
    {
      name: { de: 'OR-Gatter mit Testbench', en: 'OR gate with testbench' },
      code: 'module main(input logic a, b, output logic y);\n  assign y = a | b;\nendmodule\n',
      testbench: 'module tb;\n  logic a, b, y;\n  main uut(.a(a), .b(b), .y(y));\n  initial begin\n    $display("a b | y");\n    for (int i = 0; i < 4; i++) begin\n      {a, b} = i[1:0];\n      #1 $display("%0d %0d | %0d", a, b, y);\n    end\n    $finish;\n  end\nendmodule\n',
    },
    {
      name: { de: 'NOT-Gatter mit Testbench', en: 'NOT gate with testbench' },
      code: 'module main(input logic a, output logic y);\n  assign y = ~a;\nendmodule\n',
      testbench: 'module tb;\n  logic a, y;\n  main uut(.a(a), .y(y));\n  initial begin\n    $display("a | y");\n    a = 0; #1 $display("%0d | %0d", a, y);\n    a = 1; #1 $display("%0d | %0d", a, y);\n    $finish;\n  end\nendmodule\n',
    },
    {
      name: { de: 'XOR-Gatter mit Testbench', en: 'XOR gate with testbench' },
      code: 'module main(input logic a, b, output logic y);\n  assign y = a ^ b;\nendmodule\n',
      testbench: 'module tb;\n  logic a, b, y;\n  main uut(.a(a), .b(b), .y(y));\n  initial begin\n    $display("a b | y");\n    for (int i = 0; i < 4; i++) begin\n      {a, b} = i[1:0];\n      #1 $display("%0d %0d | %0d", a, b, y);\n    end\n    $finish;\n  end\nendmodule\n',
    },
    {
      name: { de: '1-Bit Volladdierer mit Testbench', en: '1-bit Full Adder with testbench' },
      code: 'module main(input logic a, b, cin, output logic sum, cout);\n  assign {cout, sum} = a + b + cin;\nendmodule\n',
      testbench: 'module tb;\n  logic a, b, cin, sum, cout;\n  main uut(.a(a), .b(b), .cin(cin), .sum(sum), .cout(cout));\n  initial begin\n    $display("a b cin | sum cout");\n    for (int i = 0; i < 8; i++) begin\n      {a, b, cin} = i[2:0];\n      #1 $display("%0d %0d  %0d  |  %0d   %0d", a, b, cin, sum, cout);\n    end\n    $finish;\n  end\nendmodule\n',
    },
    {
      name: { de: '2-Bit Zähler mit Testbench', en: '2-bit Counter with testbench' },
      code: 'module main(output logic [1:0] q);\n  initial begin\n    q = 0;\n    repeat (4) begin\n      #1 q = q + 1;\n    end\n  end\nendmodule\n',
      testbench: 'module tb;\n  logic [1:0] q;\n  main uut(.q(q));\n  initial begin\n    $display("q");\n    #1 $display("%0d", q);\n    #1 $display("%0d", q);\n    #1 $display("%0d", q);\n    #1 $display("%0d", q);\n    $finish;\n  end\nendmodule\n',
    },
    {
      name: { de: 'Latch mit Testbench', en: 'Latch with testbench' },
      code: 'module main(input logic d, en, output logic q);\n  always_latch if (en) q = d;\nendmodule\n',
      testbench: 'module tb;\n  logic d, en, q;\n  main uut(.d(d), .en(en), .q(q));\n  initial begin\n    $display("d en | q");\n    d = 0; en = 1; #1 $display("%0d %0d | %0d", d, en, q);\n    d = 1; en = 1; #1 $display("%0d %0d | %0d", d, en, q);\n    d = 1; en = 0; #1 $display("%0d %0d | %0d", d, en, q);\n    $finish;\n  end\nendmodule\n',
    },
    {
      name: { de: 'Multiplexer 2:1 mit Testbench', en: '2:1 Multiplexer with testbench' },
      code: 'module main(input logic a, b, sel, output logic y);\n  assign y = sel ? b : a;\nendmodule\n',
      testbench: 'module tb;\n  logic a, b, sel, y;\n  main uut(.a(a), .b(b), .sel(sel), .y(y));\n  initial begin\n    $display("a b sel | y");\n    for (int i = 0; i < 8; i++) begin\n      {a, b, sel} = i[2:0];\n      #1 $display("%0d %0d %0d | %0d", a, b, sel, y);\n    end\n    $finish;\n  end\nendmodule\n',
    },
    {
      name: { de: 'D-Flipflop mit Testbench', en: 'D Flip-Flop with testbench' },
      code: 'module main(input logic clk, d, output logic q);\n  always_ff @(posedge clk) q <= d;\nendmodule\n',
      testbench: 'module tb;\n  logic clk, d, q;\n  main uut(.clk(clk), .d(d), .q(q));\n  initial begin\n    clk = 0; d = 0;\n    repeat (4) begin\n      #1 clk = ~clk; d = ~d;\n      #1 $display("clk=%0d d=%0d q=%0d", clk, d, q);\n    end\n    $finish;\n  end\nendmodule\n',
    },
    {
      name: { de: '4-Bit Inkrementierer mit Testbench', en: '4-bit Incrementer with testbench' },
      code: 'module main(input logic [3:0] in, output logic [3:0] out);\n  assign out = in + 1;\nendmodule\n',
      testbench: 'module tb;\n  logic [3:0] in, out;\n  main uut(.in(in), .out(out));\n  initial begin\n    $display("in | out");\n    for (int i = 0; i < 16; i++) begin\n      in = i[3:0]; #1 $display("%0d | %0d", in, out);\n    end\n    $finish;\n  end\nendmodule\n',
    },
  ]
};

/**
 * Sidebar component for settings and code examples
 * - Language selection
 * - Testbench toggle and language
 * - Waveform option
 * - Save/Open buttons
 * - Code examples menu (Design only / Design + Testbench)
 */
const TRANSLATIONS = {
  de: {
    hdlLanguage: 'HDL Sprache',
    enableTestbench: 'Testbench aktivieren',
    testbenchLanguage: 'Testbench Sprache',
    generateWave: 'Wave-Datei erzeugen?',
    save: 'Speichern',
    open: 'Öffnen',
    codeExamples: 'Code-Beispiele',
    designOnly: 'Nur Design',
    designTestbench: 'Design + Testbench',
  },
  en: {
    hdlLanguage: 'HDL Language',
    enableTestbench: 'Enable testbench',
    testbenchLanguage: 'Testbench language',
    generateWave: 'Generate wave file?',
    save: 'Save',
    open: 'Open',
    codeExamples: 'Code examples',
    designOnly: 'Design only',
    designTestbench: 'Design + Testbench',
  }
};

export default function Sidebar({ language, setLanguage, testbenchLang, setTestbenchLang, onSave, onOpen, wave, setWave, testbenchEnabled, setTestbenchEnabled, onExample, uiLanguage }) {
  const [tab, setTab] = useState('design');
  const t = TRANSLATIONS[uiLanguage] || TRANSLATIONS.de;
  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <label>{t.hdlLanguage}</label>
        <select value={language} onChange={e => setLanguage(e.target.value)}>
          <option value="systemverilog">SystemVerilog</option>
        </select>
      </div>
      <div className="sidebar-section">
        <label>
          <input type="checkbox" checked={testbenchEnabled} onChange={e => setTestbenchEnabled(e.target.checked)} style={{ marginRight: 8 }} />
          {t.enableTestbench}
        </label>
      </div>
      {testbenchEnabled && (
        <div className="sidebar-section">
          <label>{t.testbenchLanguage}</label>
          <select value={testbenchLang} onChange={e => setTestbenchLang(e.target.value)}>
            <option value="systemverilog">SystemVerilog</option>
            <option value="python">Python</option>
          </select>
        </div>
      )}
      <div className="sidebar-section">
        <label>{t.generateWave}</label>
        <input type="checkbox" checked={wave} onChange={e => setWave(e.target.checked)} />
      </div>
      <div className="sidebar-section">
        <button onClick={onSave}>{t.save}</button>
        <button onClick={onOpen}>{t.open}</button>
      </div>
      <div className="sidebar-section">
        <label>{t.codeExamples}</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button style={{ fontWeight: tab === 'design' ? 'bold' : 'normal' }} onClick={() => setTab('design')}>{t.designOnly}</button>
          <button style={{ fontWeight: tab === 'testbench' ? 'bold' : 'normal' }} onClick={() => setTab('testbench')}>{t.designTestbench}</button>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 180, overflowY: 'auto' }}>
          {EXAMPLES[tab].map((ex, i) => (
            <li key={i} style={{ marginBottom: 4 }}>
              <button style={{ width: '100%', textAlign: 'left', fontSize: '0.95em' }} onClick={() => onExample(ex)}>{typeof ex.name === 'string' ? ex.name : ex.name[uiLanguage] || ex.name.de}</button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

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
    {
      name: { de: '4-Bit Addierer mit Cocotb-Testbench', en: '4-bit Adder with Cocotb testbench' },
      code: 'module main(input logic [3:0] a, b, input logic cin, output logic [4:0] sum);\n  assign sum = {1\'b0, a} + {1\'b0, b} + {4\'b0, cin};\nendmodule\n',
      testbenchLang: 'python',
      testbench: 'import cocotb\nfrom cocotb.triggers import Timer\n\n@cocotb.test()\nasync def run_addition_test(dut):\n    vectors = [\n        (0, 0, 0, 0),\n        (1, 2, 0, 3),\n        (7, 8, 0, 15),\n        (15, 0, 1, 16),\n        (9, 6, 1, 16),\n    ]\n\n    for a, b, cin, expected in vectors:\n        dut.a.value = a\n        dut.b.value = b\n        dut.cin.value = cin\n        await Timer(1, unit="ns")\n        actual = dut.sum.value.to_unsigned()\n        assert actual == expected, f"Expected {expected}, got {actual}"\n',
    },
    {
      name: { de: 'ALU mit Cocotb (ausführliches Logging)', en: 'ALU with Cocotb (verbose logging)' },
      code: 'module main(input logic [7:0] a, b, input logic [1:0] op, output logic [7:0] y);\n  always_comb begin\n    case (op)\n      2\'b00: y = a + b;\n      2\'b01: y = a - b;\n      2\'b10: y = a & b;\n      default: y = a | b;\n    endcase\n  end\nendmodule\n',
      testbenchLang: 'python',
      testbench: 'import cocotb\nfrom cocotb.triggers import Timer\n\n@cocotb.test()\nasync def run_alu_test(dut):\n    vectors = [\n        (12, 5, 0),\n        (12, 5, 1),\n        (0b11001100, 0b10101010, 2),\n        (0b11001100, 0b10101010, 3),\n        (255, 1, 0),\n        (0, 1, 1),\n    ]\n\n    for idx, (a, b, op) in enumerate(vectors):\n        dut.a.value = a\n        dut.b.value = b\n        dut.op.value = op\n        await Timer(1, unit="ns")\n\n        if op == 0:\n            expected = (a + b) & 0xFF\n            opname = "ADD"\n        elif op == 1:\n            expected = (a - b) & 0xFF\n            opname = "SUB"\n        elif op == 2:\n            expected = a & b\n            opname = "AND"\n        else:\n            expected = a | b\n            opname = "OR"\n\n        actual = dut.y.value.to_unsigned()\n        cocotb.log.info(f"[{idx}] {opname}: a={a} b={b} -> y={actual} (exp={expected})")\n        assert actual == expected, f"{opname} failed: expected {expected}, got {actual}"\n\n    cocotb.log.info("ALU test completed successfully")\n',
    },
    {
      name: { de: 'Komparator mit Cocotb (viele Vektoren)', en: 'Comparator with Cocotb (many vectors)' },
      code: 'module main(input logic [3:0] a, b, output logic gt, eq, lt);\n  assign gt = (a > b);\n  assign eq = (a == b);\n  assign lt = (a < b);\nendmodule\n',
      testbenchLang: 'python',
      testbench: 'import cocotb\nfrom cocotb.triggers import Timer\n\n@cocotb.test()\nasync def run_comparator_test(dut):\n    count = 0\n    for a in range(0, 8):\n        for b in range(0, 8):\n            dut.a.value = a\n            dut.b.value = b\n            await Timer(1, unit="ns")\n\n            gt = int(dut.gt.value)\n            eq = int(dut.eq.value)\n            lt = int(dut.lt.value)\n\n            exp_gt = int(a > b)\n            exp_eq = int(a == b)\n            exp_lt = int(a < b)\n\n            cocotb.log.info(\n                f"vec={count:02d} a={a} b={b} | gt/eq/lt={gt}{eq}{lt} (exp {exp_gt}{exp_eq}{exp_lt})"\n            )\n\n            assert gt == exp_gt, f"gt mismatch for a={a}, b={b}"\n            assert eq == exp_eq, f"eq mismatch for a={a}, b={b}"\n            assert lt == exp_lt, f"lt mismatch for a={a}, b={b}"\n            count += 1\n\n    cocotb.log.info(f"Comparator test passed with {count} vectors")\n',
    },
    {
      name: { de: 'Synchroner Zähler mit Cocotb (Takt-Log)', en: 'Synchronous counter with Cocotb (clock log)' },
      code: 'module main(input logic clk, rst_n, output logic [3:0] count);\n  always_ff @(posedge clk or negedge rst_n) begin\n    if (!rst_n)\n      count <= 4\'d0;\n    else\n      count <= count + 1\'b1;\n  end\nendmodule\n',
      testbenchLang: 'python',
      testbench: 'import cocotb\nfrom cocotb.clock import Clock\nfrom cocotb.triggers import RisingEdge\n\n@cocotb.test()\nasync def run_counter_test(dut):\n    cocotb.start_soon(Clock(dut.clk, 1, unit="ns").start())\n\n    dut.rst_n.value = 0\n    await RisingEdge(dut.clk)\n    await RisingEdge(dut.clk)\n    dut.rst_n.value = 1\n\n    cocotb.log.info("Reset released, starting count check")\n\n    for cycle in range(1, 9):\n        await RisingEdge(dut.clk)\n        expected = (cycle - 1) & 0xF\n        actual = dut.count.value.to_unsigned()\n        cocotb.log.info(f"cycle={cycle} count={actual} expected={expected}")\n        assert actual == expected, f"cycle {cycle}: expected {expected}, got {actual}"\n\n    cocotb.log.info("Counter test completed")\n',
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
            <option value="python">Python/Cocotb</option>
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

# HDLab (System)Verilog Guide <!-- omit in toc -->

<!--
lesson_id: 000
lesson_title: "0. Vorwort"
difficulty: "intro"
duration_min: 5
type: "theory"
-->

## 0. Vorwort

Dieses Tutorial begleitet den Kurs *Eingebettete Systeme I* an der HTWK, Fakultät für Ingenieurwissenschaften. Es vermittelt die Grundlagen von *SystemVerilog* zur Beschreibung digitaler Hardware.

### Inhaltsverzeichnis <!-- omit in toc -->

- [0. Vorwort](#0-vorwort)
  - [0.1 Ziel](#01-ziel)
  - [0.2 Was ist Verilog / SystemVerilog?](#02-was-ist-verilog--systemverilog)
  - [0.3 FPGA](#03-fpga)
  - [0.4 Synthese](#04-synthese)
- [1. Digitale Grundlagen](#1-digitale-grundlagen)
  - [1.1 Binär und Hexadezimal](#11-binär-und-hexadezimal)
  - [1.1.a. Übung: Zahlen darstellen](#11a-übung-zahlen-darstellen)
  - [1.3 Logische Gatter und Wahrheitstabelle](#13-logische-gatter-und-wahrheitstabelle)
  - [1.3.a. Übung: NAND](#13a-übung-nand)
  - [1.5 Zweierkomplement und vorzeichenbehaftete Zahlen](#15-zweierkomplement-und-vorzeichenbehaftete-zahlen)
  - [1.5.a. Übung: Vorzeichen](#15a-übung-vorzeichen)
- [2. Entities und Module](#2-entities-und-module)
  - [2.1 Aufbau einer Komponente](#21-aufbau-einer-komponente)
  - [2.1.a. Übung: Assign](#21a-übung-assign)
  - [2.3 Ein Interface, mehrere Implementierungen](#23-ein-interface-mehrere-implementierungen)
  - [2.3.a. Übung: Alternative Implementierung](#23a-übung-alternative-implementierung)
  - [2.5 Port-Richtungen](#25-port-richtungen)
  - [2.5.a. Übung: Port-Richtungen](#25a-übung-port-richtungen)
- [3. Signale und Datentypen](#3-signale-und-datentypen)
  - [3.1 Signale und logische Typen](#31-signale-und-logische-typen)
  - [3.1.a. Übung: Internes Signal](#31a-übung-internes-signal)
  - [3.3 Vektoren und Bit-Indizierung](#33-vektoren-und-bit-indizierung)
  - [3.3.a. Übung: Bitselektion](#33a-übung-bitselektion)
  - [3.5 Numerische Typen und Konstanten](#35-numerische-typen-und-konstanten)
  - [3.5.a. Übung: Numerische Konstanten](#35a-übung-numerische-konstanten)
- [4. Operatoren und Ausdrücke](#4-operatoren-und-ausdrücke)
  - [4.1 Bitweise und logische Operatoren](#41-bitweise-und-logische-operatoren)
  - [4.1.a. Übung: Bitweise und logisch](#41a-übung-bitweise-und-logisch)
  - [4.3 Konkatenation und Replikation](#43-konkatenation-und-replikation)
  - [4.3.a. Übung: Zusammensetzen und wiederholen](#43a-übung-zusammensetzen-und-wiederholen)
  - [4.5 Arithmetische und relationale Operatoren](#45-arithmetische-und-relationale-operatoren)
  - [4.5.a. Übung: Summe und Vergleich](#45a-übung-summe-und-vergleich)
- [5. Kontinuierliche und bedingte Zuweisungen](#5-kontinuierliche-und-bedingte-zuweisungen)
  - [5.1 Kontinuierliche Zuweisung (assign)](#51-kontinuierliche-zuweisung-assign)
  - [5.1.a. Übung: Paritätsgenerator](#51a-übung-paritätsgenerator)
  - [5.3 Bedingte Zuweisungen](#53-bedingte-zuweisungen)
  - [5.3.a. Übung: Lüfterstufe auswählen](#53a-übung-lüfterstufe-auswählen)
- [6. Prozedurale Blöcke](#6-prozedurale-blöcke)
  - [6.1 Aufbau eines prozeduralen Blocks](#61-aufbau-eines-prozeduralen-blocks)
  - [6.1.a. Übung: Prozedural invertieren](#61a-übung-prozedural-invertieren)
  - [6.2 Ablauf innerhalb eines Blocks](#62-ablauf-innerhalb-eines-blocks)
  - [6.2.a. Übung: Berechnung in zwei Schritten](#62a-übung-berechnung-in-zwei-schritten)
  - [6.3 Der Takt (Clock)](#63-der-takt-clock)
  - [6.4 Sensitivitätsliste und Blocktypen](#64-sensitivitätsliste-und-blocktypen)
  - [6.4.a. Übung: Ein Bit speichern](#64a-übung-ein-bit-speichern)

---

<!--
lesson_id: 001
lesson_title: "0.1 Ziel"
difficulty: "intro"
duration_min: 5
type: "theory"
-->

### 0.1 Ziel

Auf dem **Basys3-Board** entsteht im Kurs ein **RISC-V-Prozessorsystem** als **System-on-Chip (SoC)**. Es verbindet Prozessor, Speicher und weitere Hardwaremodule zu einem **Gaming-System**. Im Verlauf des Kurses kommen schrittweise Module hinzu, die in SystemVerilog beschrieben werden.

Dieses Tutorial vermittelt die dafür nötigen Sprachgrundlagen. Beispiele und Übungen in HDLab ermöglichen es, die beschriebenen Schaltungen zu testen.

![Basys3-FPGA-Board von Digilent](/Kurse/ES1/images/basys3.png)

Bildquelle: [Digilent – Basys 3 FPGA Trainer Board](https://digilent.com/shop/basys-3-amd-artix-7-fpga-trainer-board-recommended-for-introductory-users/).

---

<!--
lesson_id: 002
lesson_title: "0.2 Was ist Verilog / SystemVerilog?"
difficulty: "intro"
duration_min: 5
type: "theory"
-->

### 0.2 Was ist Verilog / SystemVerilog?

Verilog ist eine **Hardwarebeschreibungssprache (HDL)**. Sie beschreibt die Verbindungen, logischen Funktionen und Speicher einer digitalen Schaltung. Die Teile dieser Schaltung können gleichzeitig arbeiten.

**SystemVerilog** erweitert Verilog und wird für die Beispiele und Übungen dieses Tutorials verwendet.

**Beispiel:** Ein AND-Gatter liefert nur dann 1, wenn beide Eingänge 1 sind. Der Aufbau des Moduls wird in Kapitel 2 erläutert.

```verilog
module module_intro_and(
    input logic a,
    input logic b,
    output logic y
);

assign y = a & b;

endmodule
```

---

<!--
lesson_id: 003
lesson_title: "0.3 FPGA"
difficulty: "intro"
duration_min: 5
type: "theory"
-->

### 0.3 FPGA

Ein **FPGA (Field Programmable Gate Array)** ist ein Chip mit konfigurierbaren Logikbausteinen und Verbindungen. Seine Konfiguration bestimmt, welche digitale Schaltung entsteht.

**Aufbau des Chips**

- **CLBs (Configurable Logic Blocks)** bilden die programmierbare Logik.
- **IOBs (I/O-Blöcke)** verbinden die Schaltung mit den Anschlusspins.
- Das **Routing** verbindet die Blöcke untereinander.

![Vereinfachte FPGA-Chipstruktur mit CLBs, I/O-Blöcken und Routing](/Kurse/ES1/images/generated/fpga-overview.png)

*Vereinfachte Übersicht; zusätzliche Speicher- und Rechenbausteine sind nicht dargestellt.*

**Ein CLB im Detail**

Ein CLB enthält mehrere kleine Logikeinheiten, die **Slices**. Der dargestellte Signalpfad zeigt drei wichtige Bausteine:

- Die **LUT (Look-up Table)** bildet eine logische Funktion ab.
- Das **Flip-Flop** speichert ein Bit an einer Taktflanke.
- Der **Multiplexer (MUX)** wählt zwischen dem direkten und dem gespeicherten Ergebnis.

![CLB mit zwei Slices und vereinfachtem Signalpfad](/Kurse/ES1/images/generated/clb-detail.png)

*Vereinfachte Darstellung eines Artix-7-CLBs mit zwei Slices.*

**Beispiel:** Eine LUT kann ein AND-Gatter bilden. Für die Eingänge 1 und 1 liefert sie 1, sonst 0.

Eigene Darstellungen. Fachliche Grundlage: [AMD – CLB Overview (UG474)](https://docs.amd.com/r/en-US/ug474_7Series_CLB/CLB-Overview). Weitere Abbildung: [Wikipedia – Configurable Logic Block](https://de.wikipedia.org/wiki/Configurable_Logic_Block#/media/Datei:FPGA_cell_example.png).

---

<!--
lesson_id: 004
lesson_title: "0.4 Synthese"
difficulty: "intro"
duration_min: 5
type: "theory"
-->

### 0.4 Synthese

Die **Simulation** prüft das Verhalten einer Hardwarebeschreibung. Dazu legt eine **Testbench** Eingangswerte an und vergleicht die Ausgänge mit den erwarteten Werten. Die Übungen in HDLab verwenden dieses Verfahren.

Die **Synthese** übersetzt die Hardwarebeschreibung in Logik und Speicher. Weitere Werkzeuge ordnen diese Bausteine auf dem FPGA an und verbinden sie. Daraus entsteht die Konfiguration für das Board.

**Beispiel:** Die folgende Beschreibung wird als AND-Funktion umgesetzt. Für `a = 1` und `b = 0` liefert sie `y = 0`.

```verilog
module module_synthesis_and(
    input logic a,
    input logic b,
    output logic y
);

assign y = a & b;

endmodule
```

---

<!--
lesson_id: 100
lesson_title: "1. Digitale Grundlagen"
difficulty: "intro"
duration_min: 1
type: "theory"
-->

## 1. Digitale Grundlagen

Dieses Kapitel behandelt die Darstellung von Zahlen durch Bits und ihre Verknüpfung durch logische Gatter. Auf jede Lektion folgt eine einfache Übung. Die Modulrahmen sind zunächst vorgegeben.

**Beispiel:** Das Bitmuster `1010` stellt als vorzeichenlose Binärzahl den Wert 10 dar.

---

<!--
lesson_id: 101
lesson_title: "1.1 Binär und Hexadezimal"
difficulty: "intro"
duration_min: 10
type: "theory"
-->

### 1.1 Binär und Hexadezimal

Digitale Schaltungen verarbeiten **Bits** mit den Werten 0 und 1. Mehrere Bits bilden ein Bitmuster. Diese Lektion behandelt seine Interpretation als **vorzeichenlose ganze Zahl**.

#### Stellenwerte verstehen

Im Dezimalsystem haben die Stellen von rechts nach links die Gewichte 1, 10, 100 und so weiter. Beispielsweise bedeutet 205: **2 × 100 + 0 × 10 + 5 × 1**.

Im **Binärsystem** gibt es nur die Ziffern 0 und 1. Die Stellengewichte verdoppeln sich jeweils nach links: **1, 2, 4, 8, 16, …**.

**Beispiel: Das Bitmuster `1101`**

| Bitposition | 3 | 2 | 1 | 0 |
|-------------|---|---|---|---|
| Stellengewicht | 8 | 4 | 2 | 1 |
| Bitwert | 1 | 1 | 0 | 1 |
| Beitrag | 8 | 4 | 0 | 1 |

Der Zahlenwert ist **8 + 4 + 1 = 13**. Die Bitpositionen werden von rechts ab 0 gezählt. Das rechte Bit heißt **LSB** (kleinstes Stellengewicht), das linke **MSB** (größtes Stellengewicht).

#### Eine Dezimalzahl binär darstellen

Die Zahl wird in passende Zweierpotenzen zerlegt. Für 13 mit vier Bits:

1. 8 abziehen: Rest 5 → Bit 3 ist 1.
2. 4 abziehen: Rest 1 → Bit 2 ist 1.
3. 2 passt nicht in den Rest → Bit 1 ist 0.
4. 1 abziehen: Rest 0 → Bit 0 ist 1.

Das Ergebnis ist `1101`. Führende Nullen ändern den Zahlenwert nicht: `0000_1101` stellt ebenfalls 13 dar.

#### Bitbreite und Wertebereich

Mit n Bits gibt es 2ⁿ verschiedene Bitmuster. Als vorzeichenlose Zahlen reicht ihr Wertebereich von **0 bis 2ⁿ − 1**.

| Bitbreite | Wertebereich |
|-----------|--------------|
| 1 Bit | 0 bis 1 |
| 4 Bit | 0 bis 15 |
| 8 Bit | 0 bis 255 |

**Beispiel:** 16 benötigt mindestens fünf Bits (`10000`) und passt nicht in vier Bits.

#### Hexadezimale Schreibweise

Das **Hexadezimalsystem** verwendet 16 Ziffern: 0 bis 9 und A bis F. Jede Ziffer entspricht genau vier Bits.

| Hexadezimal | Dezimal | Vier Bits |
|-------------|---------|-----------|
| 0 bis 9 | 0 bis 9 | `0000` bis `1001` |
| A | 10 | `1010` |
| B | 11 | `1011` |
| C | 12 | `1100` |
| D | 13 | `1101` |
| E | 14 | `1110` |
| F | 15 | `1111` |

Zur Umwandlung wird eine Binärzahl von rechts in Vierergruppen aufgeteilt. Fehlende Stellen links werden mit Nullen ergänzt.

**Beispiel:** `10_1101` wird zu `0010_1101`. Die Gruppen entsprechen 2 und D, also hexadezimal **2D**. Dezimal ergibt das **2 × 16 + 13 = 45**.

#### Zahlenkonstanten in SystemVerilog

Eine Zahlenkonstante wird hier als **`Bitbreite'BasisWert`** geschrieben. Die Basis ist `b` für binär, `h` für hexadezimal oder `d` für dezimal.

| Konstante | Zahlenwert | Bitmuster |
|-----------|------------|-----------|
| `8'b0010_1101` | 45 | `0010_1101` |
| `8'h2D` | 45 | `0010_1101` |
| `8'd45` | 45 | `0010_1101` |

Alle drei Konstanten beschreiben dieselben acht Bits. Die Zahl vor dem Apostroph gibt die **Bitbreite** an; Unterstriche dienen nur der Lesbarkeit. Die Zahlenbasis verändert weder den Wert noch die Hardware.

Ein 8-Bit-Signal hat bei der hier verwendeten Schreibweise den Indexbereich `[7:0]`: acht Bits mit den Positionen 7 bis 0.

---

<!--
lesson_id: 102
lesson_title: "1.1.a. Übung: Zahlen darstellen"
difficulty: "intro"
duration_min: 10
type: "exercise"
-->

### 1.1.a. Übung: Zahlen darstellen

Das Modul stellt dieselbe Zahl in drei Schreibweisen bereit.

#### Schnittstelle

| Port | Richtung | Typ | Beschreibung |
|------|----------|-----|--------------|
| `binary_out` | `output` | `logic [3:0]` | Konstanter 4-Bit-Wert; im Quelltext binär angegeben |
| `hex_out` | `output` | `logic [3:0]` | Konstanter 4-Bit-Wert; im Quelltext hexadezimal angegeben |
| `decimal_out` | `output` | `logic [3:0]` | Konstanter 4-Bit-Wert; im Quelltext dezimal angegeben |

#### Verhalten

- Alle drei Ausgänge liefern dauerhaft die Zahl 10 (Bitmuster `1010`).

#### Realisierung

- Verwenden Sie kontinuierliche Zuweisungen (`assign`), keine `always`-Blöcke.
- Schreiben Sie den Wert für `binary_out` binär, für `hex_out` hexadezimal und für `decimal_out` dezimal.
- Geben Sie bei jeder Konstante die Breite von 4 Bit an.

**HINT_START**
Eine Zahlenkonstante hat die Form `Bitbreite'BasisWert`. Die Basis ist `b` für binär, `h` für hexadezimal und `d` für dezimal. Ein Beispiel aus Lektion 1.1 ist `8'h2D`.
**HINT_END**

**HINT_START**
Die Zahl 10 lautet binär `1010` und hexadezimal `A`. Alle drei Konstanten sind 4 Bit breit, beginnen also mit `4'`.
**HINT_END**

**HINT_START**
Die erste Zuweisung lautet:

```verilog
assign binary_out = 4'b1010;
```

Die beiden anderen Ausgänge folgen demselben Muster mit den Basen `h` und `d`.
**HINT_END**

**EXERCISE_START**
```verilog
module module_numbers(
    output logic [3:0] binary_out,
    output logic [3:0] hex_out,
    output logic [3:0] decimal_out
);

// Hier Code hinzufügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_numbers(
    output logic [3:0] binary_out,
    output logic [3:0] hex_out,
    output logic [3:0] decimal_out
);

assign binary_out = 4'b1010;
assign hex_out = 4'hA;
assign decimal_out = 4'd10;

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_numbers;

localparam integer VALUE_WIDTH = 4;
localparam time WATCHDOG_TIME = 90;

// BEGIN TEST HELPERS
// Wird für HDLab direkt in jede Testbench eingebettet (keine Includes nötig).
// VALUE_WIDTH und WATCHDOG_TIME werden in der jeweiligen Testbench festgelegt.
integer tests_run = 0;
integer tests_passed = 0;
bit all_passed = 1'b1;

function automatic string bit_string(
    input logic [VALUE_WIDTH-1:0] value,
    input integer width
);
    string result;
    result = "";
    for (integer i = width - 1; i >= 0; i = i - 1)
        result = {result, $sformatf("%b", value[i])};
    return result;
endfunction

function automatic bit report_check(
    input bit passed,
    input string description,
    input string details
);
    tests_run = tests_run + 1;
    if (passed) begin
        tests_passed = tests_passed + 1;
        $display("✅ PASS %0d: %s", tests_run, description);
    end
    else begin
        $display("❌ FAIL %0d: %s", tests_run, description);
        $display("   %s", details);
    end
    return passed;
endfunction

function automatic bit assert_equal(
    input logic [VALUE_WIDTH-1:0] actual,
    input logic [VALUE_WIDTH-1:0] expected,
    input string description,
    input integer width = VALUE_WIDTH
);
    return report_check(actual === expected, description,
        $sformatf("Erwartet: %s (unsigned %0d); erhalten: %s (unsigned %0d)",
                  bit_string(expected, width), expected,
                  bit_string(actual, width), actual));
endfunction

function automatic bit assert_equal_signed(
    input logic signed [VALUE_WIDTH-1:0] actual,
    input logic signed [VALUE_WIDTH-1:0] expected,
    input string description
);
    return report_check(actual === expected, description,
        $sformatf("Erwartet: %0d (Bits %b); erhalten: %0d (Bits %b)",
                  expected, expected, actual, actual));
endfunction

function automatic bit assert_true(
    input logic condition,
    input string description
);
    return report_check(condition === 1'b1, description,
        $sformatf("Erwartet: wahr (1); erhalten: %b", condition));
endfunction

task automatic finish_tests;
    // Ohne ausgeführte Prüfungen darf eine Testbench nicht bestehen.
    all_passed = all_passed & (tests_run > 0) & (tests_run == tests_passed);
    $display("\nErgebnis: %0d von %0d Prüfungen bestanden.", tests_passed, tests_run);
    if (all_passed)
        $display("✅ PASS Gesamtergebnis");
    else
        $display("❌ FAIL Gesamtergebnis");
    // Maschinenlesbares Gesamtergebnis für die bestehende HDLab-Auswertung.
    $display("TEST_SOLVED=%b", all_passed);
    $finish;
endtask

initial begin : watchdog
    #WATCHDOG_TIME;
    $display("❌ FAIL Timeout: Testbench nach %0t nicht beendet.", $time);
    all_passed = 1'b0;
    finish_tests();
end
// END TEST HELPERS

//------------------------------------------------------------------------ //

logic [3:0] binary_out, hex_out, decimal_out;

module_numbers dut (
    .binary_out(binary_out),
    .hex_out(hex_out),
    .decimal_out(decimal_out)
);

initial begin
    #1;
    all_passed &= assert_equal(binary_out, 4'd10, "binary_out: Binärkonstante stellt 10 dar");
    all_passed &= assert_equal(hex_out, 4'd10, "hex_out: Hexadezimalkonstante stellt 10 dar");
    all_passed &= assert_equal(decimal_out, 4'd10, "decimal_out: Dezimalkonstante stellt 10 dar");
    finish_tests();
end
endmodule
```
**TESTBENCH_END**

---

<!--
lesson_id: 103
lesson_title: "1.3 Logische Gatter und Wahrheitstabelle"
difficulty: "intro"
duration_min: 10
type: "theory"
-->

### 1.3 Logische Gatter und Wahrheitstabelle

Ein einzelnes Bit kann `0` (Low) oder `1` (High) darstellen. **Logische Gatter** verknüpfen diese Werte. Eine **Wahrheitstabelle** listet zu jeder Eingangskombination die Ausgänge auf.

| A | B | AND | OR | XOR | NAND |
|---|---|-----|----|-----|------|
| 0 | 0 | 0 | 0 | 0 | 1 |
| 0 | 1 | 0 | 1 | 1 | 1 |
| 1 | 0 | 0 | 1 | 1 | 1 |
| 1 | 1 | 1 | 1 | 0 | 0 |

- **AND** (`&`): 1, wenn beide Eingänge 1 sind.
- **OR** (`|`): 1, wenn mindestens ein Eingang 1 ist.
- **XOR** (`^`): 1, wenn die Eingänge verschieden sind.
- **NOT** (`~`): invertiert jedes Bit; aus 0 wird 1 und umgekehrt.
- **NAND** (`~(a & b)`): invertiertes AND.

Mit `assign` beschreiben wir eine kontinuierliche Zuweisung, beispielsweise `assign y = a & b;`. Sie speichert keinen Wert. Wenn sich die Eingänge ändern, folgt der Ausgang der beschriebenen Funktion.

![AND, OR, XOR, NOT, NAND und NOR als rechteckige IEC-Gattersymbole](/Kurse/ES1/images/generated/gates.png)

`&` kennzeichnet AND, `≥1` OR und `=1` bei zwei Eingängen XOR. Der Kreis am Ausgang kennzeichnet die Invertierung.

Die folgende Übersicht zeigt dieselben Funktionen mit den in den USA gebräuchlichen ANSI-Symbolen. Die Gatter unterscheiden sich durch ihre Kontur; ein Kreis am Ausgang kennzeichnet auch hier die Invertierung.

![AND, OR, XOR, NOT, NAND und NOR als US-/ANSI-Gattersymbole](/Kurse/ES1/images/generated/gates-ansi.png)


**Beispiel:** Für `a = 1` und `b = 0` liefert `assign y = a & b;` den Wert 0. Mit `assign y = ~(a & b);` liefert derselbe Eingang ein NAND-Ergebnis von 1.

---

<!--
lesson_id: 104
lesson_title: "1.3.a. Übung: NAND"
difficulty: "intro"
duration_min: 10
type: "exercise"
-->

### 1.3.a. Übung: NAND

Ein NAND-Gatter verknüpft zwei Eingangssignale und invertiert das AND-Ergebnis.

#### Schnittstelle

| Port | Richtung | Typ | Beschreibung |
|------|----------|-----|--------------|
| `signal_a_in` | `input` | `logic` | Erster Eingang des Gatters |
| `signal_b_in` | `input` | `logic` | Zweiter Eingang des Gatters |
| `signal_a_nand_b_out` | `output` | `logic` | Ergebnis der NAND-Verknüpfung |

#### Verhalten

- Der Ausgang ist nur dann 0, wenn beide Eingänge 1 sind.
- Für alle anderen 0/1-Eingangskombinationen ist der Ausgang 1.

#### Realisierung

- Verwenden Sie `assign` mit bitweisem AND (`&`) und NOT (`~`).
- Verwenden Sie keine `always`-Blöcke.
- Klammern müssen sicherstellen, dass das AND-Ergebnis invertiert wird.

**EXERCISE_START**
```verilog
module module_nand(
    input logic signal_a_in,
    input logic signal_b_in,
    output logic signal_a_nand_b_out
);

// Hier Code hinzufügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_nand(
    input logic signal_a_in,
    input logic signal_b_in,
    output logic signal_a_nand_b_out
);

assign signal_a_nand_b_out = ~(signal_a_in & signal_b_in);

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_nand;

localparam integer VALUE_WIDTH = 1;
localparam time WATCHDOG_TIME = 90;

// BEGIN TEST HELPERS
// Wird für HDLab direkt in jede Testbench eingebettet (keine Includes nötig).
// VALUE_WIDTH und WATCHDOG_TIME werden in der jeweiligen Testbench festgelegt.
integer tests_run = 0;
integer tests_passed = 0;
bit all_passed = 1'b1;

function automatic string bit_string(
    input logic [VALUE_WIDTH-1:0] value,
    input integer width
);
    string result;
    result = "";
    for (integer i = width - 1; i >= 0; i = i - 1)
        result = {result, $sformatf("%b", value[i])};
    return result;
endfunction

function automatic bit report_check(
    input bit passed,
    input string description,
    input string details
);
    tests_run = tests_run + 1;
    if (passed) begin
        tests_passed = tests_passed + 1;
        $display("✅ PASS %0d: %s", tests_run, description);
    end
    else begin
        $display("❌ FAIL %0d: %s", tests_run, description);
        $display("   %s", details);
    end
    return passed;
endfunction

function automatic bit assert_equal(
    input logic [VALUE_WIDTH-1:0] actual,
    input logic [VALUE_WIDTH-1:0] expected,
    input string description,
    input integer width = VALUE_WIDTH
);
    return report_check(actual === expected, description,
        $sformatf("Erwartet: %s (unsigned %0d); erhalten: %s (unsigned %0d)",
                  bit_string(expected, width), expected,
                  bit_string(actual, width), actual));
endfunction

function automatic bit assert_equal_signed(
    input logic signed [VALUE_WIDTH-1:0] actual,
    input logic signed [VALUE_WIDTH-1:0] expected,
    input string description
);
    return report_check(actual === expected, description,
        $sformatf("Erwartet: %0d (Bits %b); erhalten: %0d (Bits %b)",
                  expected, expected, actual, actual));
endfunction

function automatic bit assert_true(
    input logic condition,
    input string description
);
    return report_check(condition === 1'b1, description,
        $sformatf("Erwartet: wahr (1); erhalten: %b", condition));
endfunction

task automatic finish_tests;
    // Ohne ausgeführte Prüfungen darf eine Testbench nicht bestehen.
    all_passed = all_passed & (tests_run > 0) & (tests_run == tests_passed);
    $display("\nErgebnis: %0d von %0d Prüfungen bestanden.", tests_passed, tests_run);
    if (all_passed)
        $display("✅ PASS Gesamtergebnis");
    else
        $display("❌ FAIL Gesamtergebnis");
    // Maschinenlesbares Gesamtergebnis für die bestehende HDLab-Auswertung.
    $display("TEST_SOLVED=%b", all_passed);
    $finish;
endtask

initial begin : watchdog
    #WATCHDOG_TIME;
    $display("❌ FAIL Timeout: Testbench nach %0t nicht beendet.", $time);
    all_passed = 1'b0;
    finish_tests();
end
// END TEST HELPERS

//------------------------------------------------------------------------ //

logic signal_a, signal_b, signal_out;

module_nand dut (
    .signal_a_in(signal_a),
    .signal_b_in(signal_b),
    .signal_a_nand_b_out(signal_out)
);

task automatic check_case(input logic a_in, b_in, expected_out, input string name);
    signal_a = a_in;
    signal_b = b_in;
    #1;
    all_passed &= assert_equal(signal_out, expected_out, name);
endtask

initial begin
    check_case(0, 0, 1, "NAND: a=0, b=0 -> y=1");
    check_case(0, 1, 1, "NAND: a=0, b=1 -> y=1");
    check_case(1, 0, 1, "NAND: a=1, b=0 -> y=1");
    check_case(1, 1, 0, "NAND: a=1, b=1 -> y=0");
    check_case(0, 0, 1, "NAND: Rückkehr von 11 zu 00 -> y=1");
    finish_tests();
end
endmodule
```
**TESTBENCH_END**

---

<!--
lesson_id: 105
lesson_title: "1.5 Zweierkomplement und vorzeichenbehaftete Zahlen"
difficulty: "intro"
duration_min: 10
type: "theory"
-->

### 1.5 Zweierkomplement und vorzeichenbehaftete Zahlen

Für negative ganze Zahlen verwendet SystemVerilog das **Zweierkomplement**. **Unsigned** bedeutet vorzeichenlos, **signed** bedeutet vorzeichenbehaftet. Das gleiche Bitmuster kann je nach Interpretation unterschiedliche Zahlenwerte besitzen.

#### Bitmuster und Vorzeichen

Bei einer vorzeichenlosen 4-Bit-Zahl sind die Stellengewichte **8, 4, 2, 1**. Im Zweierkomplement hat das höchste Bit ein negatives Gewicht: **−8, 4, 2, 1**.

**Beispiel: `1101`**

- Unsigned: **8 + 4 + 1 = 13**.
- Signed: **−8 + 4 + 1 = −3**.

Das höchste Bit kennzeichnet das Vorzeichen: 0 für nichtnegative und 1 für negative Zahlen. Es ist kein separat angehängtes Minuszeichen.

| Bitmuster | Unsigned | Signed |
|-----------|----------|--------|
| `0000` | 0 | 0 |
| `0011` | 3 | 3 |
| `0111` | 7 | 7 |
| `1000` | 8 | −8 |
| `1101` | 13 | −3 |
| `1111` | 15 | −1 |

#### Eine negative Zahl bilden

Zuerst wird die positive Zahl mit der gewünschten Bitbreite dargestellt. Anschließend werden alle Bits invertiert und 1 addiert.

**Beispiel: −3 mit vier Bits**

| Schritt | Bitmuster |
|---------|-----------|
| +3 darstellen | `0011` |
| Bits invertieren | `1100` |
| 1 addieren | `1101` |

Die Stellenwertrechnung bestätigt: **−8 + 4 + 1 = −3**.

#### Den Wertebereich beachten

| Bitbreite | Unsigned | Signed |
|-----------|----------|--------|
| 4 Bit | 0 bis 15 | −8 bis +7 |
| 8 Bit | 0 bis 255 | −128 bis +127 |

**Beispiel:** 9 passt in vier unsigned Bits, aber nicht in vier signed Bits. −3 passt in beide hier gezeigten signed-Breiten. Die Bitbreite muss zum gewünschten Wertebereich passen.

#### Signed in SystemVerilog

`signed` kennzeichnet ein vorzeichenbehaftetes Signal. Bei Konstanten steht dafür ein `s` vor der Zahlenbasis. Für −3 mit vier Bits lautet die Konstante **`-4'sd3`**: Das Minus steht vor der vollständigen Konstante.

**Beispiel:** Das Modul gibt einen unsigned-Wert und einen signed-Wert aus.

```verilog
module module_signed_formats(
    output logic [3:0] unsigned_out,
    output logic signed [3:0] negative_out
);

assign unsigned_out = 4'd9;
assign negative_out = -4'sd3;

endmodule
```

`unsigned_out` liefert `1001` (9), `negative_out` liefert `1101` (−3). `signed` ändert die Interpretation, nicht die Anzahl der Bits.

---

<!--
lesson_id: 106
lesson_title: "1.5.a. Übung: Vorzeichen"
difficulty: "intro"
duration_min: 10
type: "exercise"
-->

### 1.5.a. Übung: Vorzeichen

Das Modul zeigt, wie positive und negative Zahlen mit gleicher Bitbreite dargestellt werden.

#### Schnittstelle

| Port | Richtung | Typ | Beschreibung |
|------|----------|-----|--------------|
| `a1` | `output` | `logic [3:0]` | Vorzeichenloser Wert |
| `a2` | `output` | `logic signed [3:0]` | Vorzeichenbehafteter Wert im Zweierkomplement |

#### Verhalten

- `a1` liefert dauerhaft 9.
- `a2` liefert dauerhaft −3 (Bitmuster `1101`).

#### Realisierung

- Ergänzen Sie die Ausgangsports im Codegerüst gemäß der Schnittstelle.
- Verwenden Sie 4-Bit-Konstanten und `assign`, keine `always`-Blöcke.
- Deklarieren Sie `a2` als `signed` und verwenden Sie eine passende signed-Konstante.

**EXERCISE_START**
```verilog
module module_assign(
    // Ihr 1. Output
    // Ihr 2. Output
);

// Hier Code hinzufügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_assign(
    output logic [3:0] a1,
    output logic signed [3:0] a2
);

assign a1 = 4'd9;
assign a2 = -4'sd3;

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_assign;

localparam integer VALUE_WIDTH = 4;
localparam time WATCHDOG_TIME = 90;

// BEGIN TEST HELPERS
// Wird für HDLab direkt in jede Testbench eingebettet (keine Includes nötig).
// VALUE_WIDTH und WATCHDOG_TIME werden in der jeweiligen Testbench festgelegt.
integer tests_run = 0;
integer tests_passed = 0;
bit all_passed = 1'b1;

function automatic string bit_string(
    input logic [VALUE_WIDTH-1:0] value,
    input integer width
);
    string result;
    result = "";
    for (integer i = width - 1; i >= 0; i = i - 1)
        result = {result, $sformatf("%b", value[i])};
    return result;
endfunction

function automatic bit report_check(
    input bit passed,
    input string description,
    input string details
);
    tests_run = tests_run + 1;
    if (passed) begin
        tests_passed = tests_passed + 1;
        $display("✅ PASS %0d: %s", tests_run, description);
    end
    else begin
        $display("❌ FAIL %0d: %s", tests_run, description);
        $display("   %s", details);
    end
    return passed;
endfunction

function automatic bit assert_equal(
    input logic [VALUE_WIDTH-1:0] actual,
    input logic [VALUE_WIDTH-1:0] expected,
    input string description,
    input integer width = VALUE_WIDTH
);
    return report_check(actual === expected, description,
        $sformatf("Erwartet: %s (unsigned %0d); erhalten: %s (unsigned %0d)",
                  bit_string(expected, width), expected,
                  bit_string(actual, width), actual));
endfunction

function automatic bit assert_equal_signed(
    input logic signed [VALUE_WIDTH-1:0] actual,
    input logic signed [VALUE_WIDTH-1:0] expected,
    input string description
);
    return report_check(actual === expected, description,
        $sformatf("Erwartet: %0d (Bits %b); erhalten: %0d (Bits %b)",
                  expected, expected, actual, actual));
endfunction

function automatic bit assert_true(
    input logic condition,
    input string description
);
    return report_check(condition === 1'b1, description,
        $sformatf("Erwartet: wahr (1); erhalten: %b", condition));
endfunction

task automatic finish_tests;
    // Ohne ausgeführte Prüfungen darf eine Testbench nicht bestehen.
    all_passed = all_passed & (tests_run > 0) & (tests_run == tests_passed);
    $display("\nErgebnis: %0d von %0d Prüfungen bestanden.", tests_passed, tests_run);
    if (all_passed)
        $display("✅ PASS Gesamtergebnis");
    else
        $display("❌ FAIL Gesamtergebnis");
    // Maschinenlesbares Gesamtergebnis für die bestehende HDLab-Auswertung.
    $display("TEST_SOLVED=%b", all_passed);
    $finish;
endtask

initial begin : watchdog
    #WATCHDOG_TIME;
    $display("❌ FAIL Timeout: Testbench nach %0t nicht beendet.", $time);
    all_passed = 1'b0;
    finish_tests();
end
// END TEST HELPERS

//------------------------------------------------------------------------ //

logic [3:0] signal_out1;
logic signed [3:0] signal_out2;

module_assign dut (
    .a1(signal_out1),
    .a2(signal_out2)
);

initial begin
    #1;
    all_passed &= assert_equal(signal_out1, 4'd9, "a1: vorzeichenloser Wert 9");
    all_passed &= assert_equal_signed(signal_out2, -4'sd3, "a2: vorzeichenbehafteter Wert -3");
    finish_tests();
end
endmodule
```
**TESTBENCH_END**

---

<!--
lesson_id: 200
lesson_title: "2. Entities und Module"
difficulty: "intro"
duration_min: 1
type: "theory"
-->

## 2. Entities und Module

Eine Komponente besitzt eine Schnittstelle und eine Implementierung. Dieses Kapitel beschreibt beide Teile anhand von SystemVerilog-Modulen.

**Beispiel:** Ein Schaltermodul hat den Eingang `switch_in` und den Ausgang `led_out`. Seine Implementierung verbindet beide Signale.

---

<!--
lesson_id: 201
lesson_title: "2.1 Aufbau einer Komponente"
difficulty: "intro"
duration_min: 10
type: "theory"
-->

### 2.1 Aufbau einer Komponente

Eine **Komponente** fasst einen Teil einer Schaltung zusammen. In SystemVerilog wird sie als **Modul** beschrieben.

**Beispiel:** Dieses Modul leitet einen Eingang auf einen Ausgang weiter.

```verilog
module module_copy(
    input logic signal_in,
    output logic signal_out
);

assign signal_out = signal_in;

endmodule
```

- `module` beginnt die Beschreibung; danach steht der Modulname.
- Die **Portliste** enthält die Anschlüsse. Einträge sind durch Kommas getrennt; der letzte Eintrag hat kein Komma.
- Nach `);` folgt die **Implementierung**. `assign` verbindet hier Eingang und Ausgang.
- `endmodule` beendet das Modul.

`input` bezeichnet einen Eingang, `output` einen Ausgang. `logic` ist der in den Beispielen verwendete Signaltyp. `//` beginnt einen Kommentar bis zum Zeilenende.

![Aufbau eines SystemVerilog-Moduls](/Kurse/ES1/images/generated/module.png)

---

<!--
lesson_id: 202
lesson_title: "2.1.a. Übung: Assign"
difficulty: "intro"
duration_min: 10
type: "exercise"
-->

### 2.1.a. Übung: Assign

Das Modul leitet einen Eingang weiter und stellt zusätzlich einen festen High-Pegel bereit.

#### Schnittstelle

| Port | Richtung | Typ | Beschreibung |
|------|----------|-----|--------------|
| `e1` | `input` | `wire` | Weiterzuleitendes Eingangssignal |
| `a1` | `output` | `wire` | Kopie des Eingangssignals |
| `a2` | `output` | `wire` | Konstanter High-Pegel |

#### Verhalten

- `a1` folgt unverändert `e1`.
- `a2` ist dauerhaft 1.

#### Realisierung

- Ergänzen Sie die Portliste gemäß der Schnittstelle.
- Die Ports sind in dieser vorhandenen Aufgabe implizite 1-Bit-Netze (`wire`).
- Verwenden Sie zwei kontinuierliche Zuweisungen (`assign`), keine `always`-Blöcke.

**EXERCISE_START**
```verilog
module module_assign (
    // Ihr 1. Input
    // Ihr 1. Output
    // Ihr 2. Output
);

// Hier Code hinzufügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_assign (
    input e1,
    output a1,
    output a2
);

assign a1 = e1;
assign a2 = 1'b1;

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_assign;

localparam integer VALUE_WIDTH = 1;
localparam time WATCHDOG_TIME = 90;

// BEGIN TEST HELPERS
// Wird für HDLab direkt in jede Testbench eingebettet (keine Includes nötig).
// VALUE_WIDTH und WATCHDOG_TIME werden in der jeweiligen Testbench festgelegt.
integer tests_run = 0;
integer tests_passed = 0;
bit all_passed = 1'b1;

function automatic string bit_string(
    input logic [VALUE_WIDTH-1:0] value,
    input integer width
);
    string result;
    result = "";
    for (integer i = width - 1; i >= 0; i = i - 1)
        result = {result, $sformatf("%b", value[i])};
    return result;
endfunction

function automatic bit report_check(
    input bit passed,
    input string description,
    input string details
);
    tests_run = tests_run + 1;
    if (passed) begin
        tests_passed = tests_passed + 1;
        $display("✅ PASS %0d: %s", tests_run, description);
    end
    else begin
        $display("❌ FAIL %0d: %s", tests_run, description);
        $display("   %s", details);
    end
    return passed;
endfunction

function automatic bit assert_equal(
    input logic [VALUE_WIDTH-1:0] actual,
    input logic [VALUE_WIDTH-1:0] expected,
    input string description,
    input integer width = VALUE_WIDTH
);
    return report_check(actual === expected, description,
        $sformatf("Erwartet: %s (unsigned %0d); erhalten: %s (unsigned %0d)",
                  bit_string(expected, width), expected,
                  bit_string(actual, width), actual));
endfunction

function automatic bit assert_equal_signed(
    input logic signed [VALUE_WIDTH-1:0] actual,
    input logic signed [VALUE_WIDTH-1:0] expected,
    input string description
);
    return report_check(actual === expected, description,
        $sformatf("Erwartet: %0d (Bits %b); erhalten: %0d (Bits %b)",
                  expected, expected, actual, actual));
endfunction

function automatic bit assert_true(
    input logic condition,
    input string description
);
    return report_check(condition === 1'b1, description,
        $sformatf("Erwartet: wahr (1); erhalten: %b", condition));
endfunction

task automatic finish_tests;
    // Ohne ausgeführte Prüfungen darf eine Testbench nicht bestehen.
    all_passed = all_passed & (tests_run > 0) & (tests_run == tests_passed);
    $display("\nErgebnis: %0d von %0d Prüfungen bestanden.", tests_passed, tests_run);
    if (all_passed)
        $display("✅ PASS Gesamtergebnis");
    else
        $display("❌ FAIL Gesamtergebnis");
    // Maschinenlesbares Gesamtergebnis für die bestehende HDLab-Auswertung.
    $display("TEST_SOLVED=%b", all_passed);
    $finish;
endtask

initial begin : watchdog
    #WATCHDOG_TIME;
    $display("❌ FAIL Timeout: Testbench nach %0t nicht beendet.", $time);
    all_passed = 1'b0;
    finish_tests();
end
// END TEST HELPERS

//------------------------------------------------------------------------ //

logic signal_in1, signal_out1, signal_out2;

module_assign dut (
    .e1(signal_in1),
    .a1(signal_out1),
    .a2(signal_out2)
);

task automatic check_case(input logic value, input string name);
    signal_in1 = value;
    #1;
    all_passed &= assert_equal(signal_out1, value, {name, ": a1 folgt e1"});
    all_passed &= assert_equal(signal_out2, 1'b1, {name, ": a2 bleibt High"});
endtask

initial begin
    check_case(0, "Eingang Low");
    check_case(1, "Eingang High");
    check_case(0, "Rückkehr zu Low");
    finish_tests();
end
endmodule
```
**TESTBENCH_END**

---

<!--
lesson_id: 203
lesson_title: "2.3 Ein Interface, mehrere Implementierungen"
difficulty: "intro"
duration_min: 10
type: "theory"
-->

### 2.3 Ein Interface, mehrere Implementierungen

Die **Schnittstelle (Interface)** eines Moduls besteht aus den Namen, Richtungen und Typen seiner Ports. Die Implementierung beschreibt das Verhalten hinter dieser Schnittstelle.

**Beispiel:** Zwei unterschiedliche Beschreibungen erzeugen dieselbe NAND-Funktion.

```verilog
module module_nand_direct(
    input logic a,
    input logic b,
    output logic y
);

assign y = ~(a & b);

endmodule

module module_nand_demorgan(
    input logic a,
    input logic b,
    output logic y
);

assign y = (~a) | (~b);

endmodule
```

Beide Module besitzen die Ports `a`, `b` und `y` und liefern dieselbe Wahrheitstabelle. Eine gleiche Schnittstelle allein garantiert noch kein gleiches Verhalten; dieses wird durch die Implementierung und Tests überprüft.

---

<!--
lesson_id: 204
lesson_title: "2.3.a. Übung: Alternative Implementierung"
difficulty: "intro"
duration_min: 10
type: "exercise"
-->

### 2.3.a. Übung: Alternative Implementierung

Eine alternative NAND-Implementierung soll bei gleicher Schnittstelle dasselbe Verhalten liefern.

#### Schnittstelle

| Port | Richtung | Typ | Beschreibung |
|------|----------|-----|--------------|
| `a` | `input` | `logic` | Erster Eingang des Gatters |
| `b` | `input` | `logic` | Zweiter Eingang des Gatters |
| `y` | `output` | `logic` | Ergebnis der NAND-Verknüpfung |

#### Verhalten

- `y` ist für `a = 1` und `b = 1` gleich 0.
- Für die übrigen 0/1-Eingangskombinationen ist `y` gleich 1.

#### Realisierung

- Verwenden Sie bitweises OR (`|`) und NOT (`~`), keinen AND-Operator (`&`).
- Verwenden Sie `assign`, keine `always`-Blöcke.
- Behalten Sie Namen, Richtungen und Typen der Ports bei.

**EXERCISE_START**
```verilog
module module_nand_alternative(
    input logic a,
    input logic b,
    output logic y
);

// Hier Code hinzufügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_nand_alternative(
    input logic a,
    input logic b,
    output logic y
);

assign y = (~a) | (~b);

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_nand_alternative;

localparam integer VALUE_WIDTH = 1;
localparam time WATCHDOG_TIME = 90;

// BEGIN TEST HELPERS
// Wird für HDLab direkt in jede Testbench eingebettet (keine Includes nötig).
// VALUE_WIDTH und WATCHDOG_TIME werden in der jeweiligen Testbench festgelegt.
integer tests_run = 0;
integer tests_passed = 0;
bit all_passed = 1'b1;

function automatic string bit_string(
    input logic [VALUE_WIDTH-1:0] value,
    input integer width
);
    string result;
    result = "";
    for (integer i = width - 1; i >= 0; i = i - 1)
        result = {result, $sformatf("%b", value[i])};
    return result;
endfunction

function automatic bit report_check(
    input bit passed,
    input string description,
    input string details
);
    tests_run = tests_run + 1;
    if (passed) begin
        tests_passed = tests_passed + 1;
        $display("✅ PASS %0d: %s", tests_run, description);
    end
    else begin
        $display("❌ FAIL %0d: %s", tests_run, description);
        $display("   %s", details);
    end
    return passed;
endfunction

function automatic bit assert_equal(
    input logic [VALUE_WIDTH-1:0] actual,
    input logic [VALUE_WIDTH-1:0] expected,
    input string description,
    input integer width = VALUE_WIDTH
);
    return report_check(actual === expected, description,
        $sformatf("Erwartet: %s (unsigned %0d); erhalten: %s (unsigned %0d)",
                  bit_string(expected, width), expected,
                  bit_string(actual, width), actual));
endfunction

function automatic bit assert_equal_signed(
    input logic signed [VALUE_WIDTH-1:0] actual,
    input logic signed [VALUE_WIDTH-1:0] expected,
    input string description
);
    return report_check(actual === expected, description,
        $sformatf("Erwartet: %0d (Bits %b); erhalten: %0d (Bits %b)",
                  expected, expected, actual, actual));
endfunction

function automatic bit assert_true(
    input logic condition,
    input string description
);
    return report_check(condition === 1'b1, description,
        $sformatf("Erwartet: wahr (1); erhalten: %b", condition));
endfunction

task automatic finish_tests;
    // Ohne ausgeführte Prüfungen darf eine Testbench nicht bestehen.
    all_passed = all_passed & (tests_run > 0) & (tests_run == tests_passed);
    $display("\nErgebnis: %0d von %0d Prüfungen bestanden.", tests_passed, tests_run);
    if (all_passed)
        $display("✅ PASS Gesamtergebnis");
    else
        $display("❌ FAIL Gesamtergebnis");
    // Maschinenlesbares Gesamtergebnis für die bestehende HDLab-Auswertung.
    $display("TEST_SOLVED=%b", all_passed);
    $finish;
endtask

initial begin : watchdog
    #WATCHDOG_TIME;
    $display("❌ FAIL Timeout: Testbench nach %0t nicht beendet.", $time);
    all_passed = 1'b0;
    finish_tests();
end
// END TEST HELPERS

//------------------------------------------------------------------------ //

logic a, b, y;

module_nand_alternative dut (
    .a(a),
    .b(b),
    .y(y)
);

task automatic check_case(input logic a_in, b_in, expected_out, input string name);
    a = a_in;
    b = b_in;
    #1;
    all_passed &= assert_equal(y, expected_out, name);
endtask

initial begin
    check_case(0, 0, 1, "Alternative: a=0, b=0 -> y=1");
    check_case(0, 1, 1, "Alternative: a=0, b=1 -> y=1");
    check_case(1, 0, 1, "Alternative: a=1, b=0 -> y=1");
    check_case(1, 1, 0, "Alternative: a=1, b=1 -> y=0");
    check_case(0, 1, 1, "Alternative: Rückkehr von 11 zu 01 -> y=1");
    finish_tests();
end
endmodule
```
**TESTBENCH_END**

---

<!--
lesson_id: 205
lesson_title: "2.5 Port-Richtungen"
difficulty: "intro"
duration_min: 5
type: "theory"
-->

### 2.5 Port-Richtungen

Die Richtung eines Ports gilt aus Sicht des Moduls:

| Richtung | Bedeutung |
|----------|-----------|
| `input` | Eingang; wird innerhalb des Moduls gelesen. |
| `output` | Ausgang; wird vom Modul erzeugt. |

**Beispiel:** `signal_in` kommt von außen; `signal_out` gibt den weitergeleiteten Wert aus.

```verilog
module module_ports(
    input logic signal_in,
    output logic signal_out
);

assign signal_out = signal_in;

endmodule
```

![Eingangs- und Ausgangsports eines Moduls](/Kurse/ES1/images/generated/ports.png)

---

<!--
lesson_id: 206
lesson_title: "2.5.a. Übung: Port-Richtungen"
difficulty: "intro"
duration_min: 10
type: "exercise"
-->

### 2.5.a. Übung: Port-Richtungen

Das Modul verbindet einen Schalter mit einer LED.

#### Schnittstelle

| Port | Richtung | Typ | Beschreibung |
|------|----------|-----|--------------|
| `switch_in` | `input` | `logic` | Schalterzustand |
| `led_out` | `output` | `logic` | Ansteuerung der LED |

#### Verhalten

- `led_out` folgt unverändert dem Schalterzustand `switch_in`.

#### Realisierung

- Ergänzen Sie die fehlenden Portdeklarationen gemäß der Schnittstelle.
- Verwenden Sie eine kontinuierliche Zuweisung (`assign`), keine `always`-Blöcke.

**EXERCISE_START**
```verilog
module module_switch(
    // Eingang switch_in ergänzen
    // Ausgang led_out ergänzen
);

// Hier Code hinzufügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_switch(
    input logic switch_in,
    output logic led_out
);

assign led_out = switch_in;

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_switch;

localparam integer VALUE_WIDTH = 1;
localparam time WATCHDOG_TIME = 90;

// BEGIN TEST HELPERS
// Wird für HDLab direkt in jede Testbench eingebettet (keine Includes nötig).
// VALUE_WIDTH und WATCHDOG_TIME werden in der jeweiligen Testbench festgelegt.
integer tests_run = 0;
integer tests_passed = 0;
bit all_passed = 1'b1;

function automatic string bit_string(
    input logic [VALUE_WIDTH-1:0] value,
    input integer width
);
    string result;
    result = "";
    for (integer i = width - 1; i >= 0; i = i - 1)
        result = {result, $sformatf("%b", value[i])};
    return result;
endfunction

function automatic bit report_check(
    input bit passed,
    input string description,
    input string details
);
    tests_run = tests_run + 1;
    if (passed) begin
        tests_passed = tests_passed + 1;
        $display("✅ PASS %0d: %s", tests_run, description);
    end
    else begin
        $display("❌ FAIL %0d: %s", tests_run, description);
        $display("   %s", details);
    end
    return passed;
endfunction

function automatic bit assert_equal(
    input logic [VALUE_WIDTH-1:0] actual,
    input logic [VALUE_WIDTH-1:0] expected,
    input string description,
    input integer width = VALUE_WIDTH
);
    return report_check(actual === expected, description,
        $sformatf("Erwartet: %s (unsigned %0d); erhalten: %s (unsigned %0d)",
                  bit_string(expected, width), expected,
                  bit_string(actual, width), actual));
endfunction

function automatic bit assert_equal_signed(
    input logic signed [VALUE_WIDTH-1:0] actual,
    input logic signed [VALUE_WIDTH-1:0] expected,
    input string description
);
    return report_check(actual === expected, description,
        $sformatf("Erwartet: %0d (Bits %b); erhalten: %0d (Bits %b)",
                  expected, expected, actual, actual));
endfunction

function automatic bit assert_true(
    input logic condition,
    input string description
);
    return report_check(condition === 1'b1, description,
        $sformatf("Erwartet: wahr (1); erhalten: %b", condition));
endfunction

task automatic finish_tests;
    // Ohne ausgeführte Prüfungen darf eine Testbench nicht bestehen.
    all_passed = all_passed & (tests_run > 0) & (tests_run == tests_passed);
    $display("\nErgebnis: %0d von %0d Prüfungen bestanden.", tests_passed, tests_run);
    if (all_passed)
        $display("✅ PASS Gesamtergebnis");
    else
        $display("❌ FAIL Gesamtergebnis");
    // Maschinenlesbares Gesamtergebnis für die bestehende HDLab-Auswertung.
    $display("TEST_SOLVED=%b", all_passed);
    $finish;
endtask

initial begin : watchdog
    #WATCHDOG_TIME;
    $display("❌ FAIL Timeout: Testbench nach %0t nicht beendet.", $time);
    all_passed = 1'b0;
    finish_tests();
end
// END TEST HELPERS

//------------------------------------------------------------------------ //

logic switch_in, led_out;

module_switch dut (
    .switch_in(switch_in),
    .led_out(led_out)
);

task automatic check_case(input logic value, input string name);
    switch_in = value;
    #1;
    all_passed &= assert_equal(led_out, value, name);
endtask

initial begin
    check_case(0, "Schalter aus -> LED aus");
    check_case(1, "Schalter ein -> LED ein");
    check_case(0, "Schalter wieder aus -> LED aus");
    finish_tests();
end
endmodule
```
**TESTBENCH_END**

---

<!--
lesson_id: 300
lesson_title: "3. Signale und Datentypen"
difficulty: "intro"
duration_min: 1
type: "theory"
-->

## 3. Signale und Datentypen

Signale verbinden die Teile einer Schaltung. Dieses Kapitel behandelt ihren Datentyp, ihre Bitbreite und die Darstellung von Konstanten.

**Beispiel:** `logic [7:0] data;` deklariert ein Signal mit acht Bits.

---

<!--
lesson_id: 301
lesson_title: "3.1 Signale und logische Typen"
difficulty: "intro"
duration_min: 10
type: "theory"
-->

### 3.1 Signale und logische Typen

Ein **Signal** überträgt einen Wert zwischen Teilen einer Schaltung. In den Übungen werden die logischen Werte **0 (Low)** und **1 (High)** verwendet.

Der Datentyp **`logic`** beschreibt ohne weitere Breitenangabe ein einzelnes Bit. Mit `logic signal_internal;` wird beispielsweise ein internes Signal deklariert.

**Beispiel:** Zwei Zuweisungen verbinden den Eingang über ein internes Signal mit dem Ausgang.

```verilog
module module_signal(
    input logic signal_in,
    output logic signal_out
);

logic signal_internal;

assign signal_internal = signal_in;
assign signal_out = signal_internal;

endmodule
```

Das interne Signal speichert hier keinen Wert. Es bildet eine Verbindung; Änderungen am Eingang werden weitergeleitet. Jedes Signal wird in diesen Beispielen nur an einer Stelle angesteuert.

![Weiterleitung über ein internes Signal ohne Speicher](/Kurse/ES1/images/generated/internal-signal.png)

---

<!--
lesson_id: 302
lesson_title: "3.1.a. Übung: Internes Signal"
difficulty: "intro"
duration_min: 10
type: "exercise"
-->

### 3.1.a. Übung: Internes Signal

Ein internes Signal verbindet den Eingang mit dem Ausgang des Moduls.

#### Schnittstelle

| Port | Richtung | Typ | Beschreibung |
|------|----------|-----|--------------|
| `signal_in` | `input` | `logic` | Weiterzuleitendes Eingangssignal |
| `signal_out` | `output` | `logic` | Über das interne Signal weitergeleiteter Wert |

#### Verhalten

- `signal_out` folgt unverändert `signal_in`.

#### Realisierung

- Deklarieren Sie das interne 1-Bit-Signal `signal_internal` als `logic`.
- Verbinden Sie mit zwei `assign`-Zuweisungen den Eingang mit dem internen Signal und dieses mit dem Ausgang.
- Verwenden Sie keine `always`-Blöcke und keinen Speicher.

**EXERCISE_START**
```verilog
module module_signal_copy(
    input logic signal_in,
    output logic signal_out
);

// Hier Code hinzufügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_signal_copy(
    input logic signal_in,
    output logic signal_out
);

logic signal_internal;

assign signal_internal = signal_in;
assign signal_out = signal_internal;

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_signal_copy;

localparam integer VALUE_WIDTH = 1;
localparam time WATCHDOG_TIME = 90;

// BEGIN TEST HELPERS
// Wird für HDLab direkt in jede Testbench eingebettet (keine Includes nötig).
// VALUE_WIDTH und WATCHDOG_TIME werden in der jeweiligen Testbench festgelegt.
integer tests_run = 0;
integer tests_passed = 0;
bit all_passed = 1'b1;

function automatic string bit_string(
    input logic [VALUE_WIDTH-1:0] value,
    input integer width
);
    string result;
    result = "";
    for (integer i = width - 1; i >= 0; i = i - 1)
        result = {result, $sformatf("%b", value[i])};
    return result;
endfunction

function automatic bit report_check(
    input bit passed,
    input string description,
    input string details
);
    tests_run = tests_run + 1;
    if (passed) begin
        tests_passed = tests_passed + 1;
        $display("✅ PASS %0d: %s", tests_run, description);
    end
    else begin
        $display("❌ FAIL %0d: %s", tests_run, description);
        $display("   %s", details);
    end
    return passed;
endfunction

function automatic bit assert_equal(
    input logic [VALUE_WIDTH-1:0] actual,
    input logic [VALUE_WIDTH-1:0] expected,
    input string description,
    input integer width = VALUE_WIDTH
);
    return report_check(actual === expected, description,
        $sformatf("Erwartet: %s (unsigned %0d); erhalten: %s (unsigned %0d)",
                  bit_string(expected, width), expected,
                  bit_string(actual, width), actual));
endfunction

function automatic bit assert_equal_signed(
    input logic signed [VALUE_WIDTH-1:0] actual,
    input logic signed [VALUE_WIDTH-1:0] expected,
    input string description
);
    return report_check(actual === expected, description,
        $sformatf("Erwartet: %0d (Bits %b); erhalten: %0d (Bits %b)",
                  expected, expected, actual, actual));
endfunction

function automatic bit assert_true(
    input logic condition,
    input string description
);
    return report_check(condition === 1'b1, description,
        $sformatf("Erwartet: wahr (1); erhalten: %b", condition));
endfunction

task automatic finish_tests;
    // Ohne ausgeführte Prüfungen darf eine Testbench nicht bestehen.
    all_passed = all_passed & (tests_run > 0) & (tests_run == tests_passed);
    $display("\nErgebnis: %0d von %0d Prüfungen bestanden.", tests_passed, tests_run);
    if (all_passed)
        $display("✅ PASS Gesamtergebnis");
    else
        $display("❌ FAIL Gesamtergebnis");
    // Maschinenlesbares Gesamtergebnis für die bestehende HDLab-Auswertung.
    $display("TEST_SOLVED=%b", all_passed);
    $finish;
endtask

initial begin : watchdog
    #WATCHDOG_TIME;
    $display("❌ FAIL Timeout: Testbench nach %0t nicht beendet.", $time);
    all_passed = 1'b0;
    finish_tests();
end
// END TEST HELPERS

//------------------------------------------------------------------------ //

logic signal_in, signal_out;

module_signal_copy dut (
    .signal_in(signal_in),
    .signal_out(signal_out)
);

task automatic check_case(input logic value, input string name);
    signal_in = value;
    #1;
    all_passed &= assert_equal(signal_out, value, name);
endtask

initial begin
    check_case(1'b0, "Internes Signal: Low weiterleiten");
    check_case(1'b1, "Internes Signal: High weiterleiten");
    check_case(1'b0, "Internes Signal: Rückkehr zu Low");
    finish_tests();
end
endmodule
```
**TESTBENCH_END**

---

<!--
lesson_id: 303
lesson_title: "3.3 Vektoren und Bit-Indizierung"
difficulty: "intro"
duration_min: 10
type: "theory"
-->

### 3.3 Vektoren und Bit-Indizierung

Ein **Vektor** bündelt mehrere Bits. `logic [7:0] data;` deklariert acht Bits mit den Positionen 7 bis 0. Bei dieser Schreibweise ist Bit 0 das **LSB**, Bit 7 das **MSB**.

**Beispiel:** Einzelne Bits und Bitgruppen lassen sich auswählen und neu zusammensetzen.

```verilog
module module_select(
    input logic [7:0] data_in,
    output logic lsb_out,
    output logic [3:0] upper_out,
    output logic [2:0] selected_out
);

assign lsb_out = data_in[0];
assign upper_out = data_in[7:4];
assign selected_out = {data_in[7], data_in[4], data_in[0]};

endmodule
```

- `data_in[0]` wählt ein Bit aus.
- `data_in[7:4]` wählt vier zusammenhängende Bits aus.
- `{...}` setzt Bits zusammen; links stehen die höchstwertigen Bits.

Ein Vektor `[n-1:0]` besitzt n Bits. Quelle und Ziel sollten passende Breiten haben; bei einem kleineren Ziel gehen die höchstwertigen Bits verloren.

---

<!--
lesson_id: 304
lesson_title: "3.3.a. Übung: Bitselektion"
difficulty: "intro"
duration_min: 10
type: "exercise"
-->

### 3.3.a. Übung: Bitselektion

Das Modul wählt drei einzelne Bits aus einem Datenwort aus und setzt sie zu einem neuen Vektor zusammen.

#### Schnittstelle

| Port | Richtung | Typ | Beschreibung |
|------|----------|-----|--------------|
| `data_in` | `input` | `logic [7:0]` | 8-Bit-Datenwort |
| `data_out` | `output` | `logic [2:0]` | Zusammengesetzte ausgewählte Bits |

#### Verhalten

- `data_out[2]` übernimmt `data_in[7]`.
- `data_out[1]` übernimmt `data_in[4]`.
- `data_out[0]` übernimmt `data_in[0]`.

#### Realisierung

- Verwenden Sie Bitselektion und Konkatenation (`{...}`).
- Beachten Sie die Reihenfolge: Bit 7 wird das MSB, Bit 0 das LSB des Ausgangs.
- Verwenden Sie `assign`, keine `always`-Blöcke.

**EXERCISE_START**
```verilog
module module_assign(
    input logic [7:0] data_in,
    output logic [2:0] data_out
);

// Hier Code hinzufügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_assign(
    input logic [7:0] data_in,
    output logic [2:0] data_out
);

assign data_out = {data_in[7], data_in[4], data_in[0]};

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_assign;

localparam integer VALUE_WIDTH = 3;
localparam time WATCHDOG_TIME = 90;

// BEGIN TEST HELPERS
// Wird für HDLab direkt in jede Testbench eingebettet (keine Includes nötig).
// VALUE_WIDTH und WATCHDOG_TIME werden in der jeweiligen Testbench festgelegt.
integer tests_run = 0;
integer tests_passed = 0;
bit all_passed = 1'b1;

function automatic string bit_string(
    input logic [VALUE_WIDTH-1:0] value,
    input integer width
);
    string result;
    result = "";
    for (integer i = width - 1; i >= 0; i = i - 1)
        result = {result, $sformatf("%b", value[i])};
    return result;
endfunction

function automatic bit report_check(
    input bit passed,
    input string description,
    input string details
);
    tests_run = tests_run + 1;
    if (passed) begin
        tests_passed = tests_passed + 1;
        $display("✅ PASS %0d: %s", tests_run, description);
    end
    else begin
        $display("❌ FAIL %0d: %s", tests_run, description);
        $display("   %s", details);
    end
    return passed;
endfunction

function automatic bit assert_equal(
    input logic [VALUE_WIDTH-1:0] actual,
    input logic [VALUE_WIDTH-1:0] expected,
    input string description,
    input integer width = VALUE_WIDTH
);
    return report_check(actual === expected, description,
        $sformatf("Erwartet: %s (unsigned %0d); erhalten: %s (unsigned %0d)",
                  bit_string(expected, width), expected,
                  bit_string(actual, width), actual));
endfunction

function automatic bit assert_equal_signed(
    input logic signed [VALUE_WIDTH-1:0] actual,
    input logic signed [VALUE_WIDTH-1:0] expected,
    input string description
);
    return report_check(actual === expected, description,
        $sformatf("Erwartet: %0d (Bits %b); erhalten: %0d (Bits %b)",
                  expected, expected, actual, actual));
endfunction

function automatic bit assert_true(
    input logic condition,
    input string description
);
    return report_check(condition === 1'b1, description,
        $sformatf("Erwartet: wahr (1); erhalten: %b", condition));
endfunction

task automatic finish_tests;
    // Ohne ausgeführte Prüfungen darf eine Testbench nicht bestehen.
    all_passed = all_passed & (tests_run > 0) & (tests_run == tests_passed);
    $display("\nErgebnis: %0d von %0d Prüfungen bestanden.", tests_passed, tests_run);
    if (all_passed)
        $display("✅ PASS Gesamtergebnis");
    else
        $display("❌ FAIL Gesamtergebnis");
    // Maschinenlesbares Gesamtergebnis für die bestehende HDLab-Auswertung.
    $display("TEST_SOLVED=%b", all_passed);
    $finish;
endtask

initial begin : watchdog
    #WATCHDOG_TIME;
    $display("❌ FAIL Timeout: Testbench nach %0t nicht beendet.", $time);
    all_passed = 1'b0;
    finish_tests();
end
// END TEST HELPERS

//------------------------------------------------------------------------ //

logic [7:0] signal_in1;
logic [2:0] signal_out1;

module_assign dut (
    .data_in(signal_in1),
    .data_out(signal_out1)
);

task automatic check_case(input logic [7:0] value, input logic [2:0] expected_out, input string name);
    signal_in1 = value;
    #1;
    all_passed &= assert_equal(signal_out1, expected_out,
                              $sformatf("%s (data_in=%b)", name, value));
endtask

initial begin
    check_case(8'h00, 3'b000, "Alle Eingangsbits Low");
    // Einzeln gesetzte Bits prüfen auch, dass die übrigen Positionen ignoriert werden.
    check_case(8'h01, 3'b001, "Bit 0 wird Ausgangsbit 0");
    check_case(8'h02, 3'b000, "Bit 1 darf den Ausgang nicht beeinflussen");
    check_case(8'h04, 3'b000, "Bit 2 darf den Ausgang nicht beeinflussen");
    check_case(8'h08, 3'b000, "Bit 3 darf den Ausgang nicht beeinflussen");
    check_case(8'h10, 3'b010, "Bit 4 wird Ausgangsbit 1");
    check_case(8'h20, 3'b000, "Bit 5 darf den Ausgang nicht beeinflussen");
    check_case(8'h40, 3'b000, "Bit 6 darf den Ausgang nicht beeinflussen");
    check_case(8'h80, 3'b100, "Bit 7 wird Ausgangsbit 2");
    check_case(8'h91, 3'b111, "Alle drei ausgewählten Bits High");
    check_case(8'h6E, 3'b000, "Nur die nicht ausgewählten Bits High");
    check_case(8'hFF, 3'b111, "Alle Eingangsbits High");
    check_case(8'h00, 3'b000, "Rückkehr zu allen Eingangsbits Low");
    finish_tests();
end
endmodule
```
**TESTBENCH_END**

---

<!--
lesson_id: 305
lesson_title: "3.5 Numerische Typen und Konstanten"
difficulty: "intro"
duration_min: 10
type: "theory"
-->

### 3.5 Numerische Typen und Konstanten

`logic [7:0]` beschreibt einen unsigned 8-Bit-Wert; `logic signed [7:0]` einen signed 8-Bit-Wert.

Konstanten enthalten **Bitbreite, Zahlenbasis und Wert**. Ein zusätzliches `s` kennzeichnet signed-Konstanten:

| Konstante | Bedeutung |
|-----------|-----------|
| `8'b0000_1001` | Binär: 9 |
| `8'h09` | Hexadezimal: 9 |
| `8'd9` | Dezimal: 9 |
| `-8'sd3` | Signed, dezimal: −3 |

**Benannte Konstanten** werden mit `localparam` deklariert. Ihr Wert bleibt während des Betriebs unverändert.

**Beispiel:** Zwei Konstanten mit festgelegter Bitbreite und Vorzeicheninterpretation:

```verilog
localparam logic [7:0] VALUE_NINE = 8'd9;
localparam logic signed [7:0] VALUE_MINUS_THREE = -8'sd3;
```

Bitbreite und Vorzeicheninterpretation müssen zum Zielsignal passen.

---

<!--
lesson_id: 306
lesson_title: "3.5.a. Übung: Numerische Konstanten"
difficulty: "intro"
duration_min: 10
type: "exercise"
-->

### 3.5.a. Übung: Numerische Konstanten

Benannte Konstanten stellen einen positiven und einen negativen Wert am Ausgang bereit.

#### Schnittstelle

| Port | Richtung | Typ | Beschreibung |
|------|----------|-----|--------------|
| `nine_out` | `output` | `logic [7:0]` | Vorzeichenlose Konstante 9 |
| `minus_three_out` | `output` | `logic signed [7:0]` | Vorzeichenbehaftete Konstante −3 |

#### Verhalten

- `nine_out` liefert dauerhaft 9.
- `minus_three_out` liefert dauerhaft −3.

#### Realisierung

- Deklarieren Sie zwei typisierte `localparam`-Konstanten mit passender Bitbreite und Vorzeicheninterpretation.
- Verbinden Sie die Konstanten mit den Ausgängen durch `assign`.
- Verwenden Sie keine `always`-Blöcke.

**EXERCISE_START**
```verilog
module module_constants(
    output logic [7:0] nine_out,
    output logic signed [7:0] minus_three_out
);

// Hier Code hinzufügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_constants(
    output logic [7:0] nine_out,
    output logic signed [7:0] minus_three_out
);

localparam logic [7:0] VALUE_NINE = 8'd9;
localparam logic signed [7:0] VALUE_MINUS_THREE = -8'sd3;

assign nine_out = VALUE_NINE;
assign minus_three_out = VALUE_MINUS_THREE;

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_constants;

localparam integer VALUE_WIDTH = 8;
localparam time WATCHDOG_TIME = 90;

// BEGIN TEST HELPERS
// Wird für HDLab direkt in jede Testbench eingebettet (keine Includes nötig).
// VALUE_WIDTH und WATCHDOG_TIME werden in der jeweiligen Testbench festgelegt.
integer tests_run = 0;
integer tests_passed = 0;
bit all_passed = 1'b1;

function automatic string bit_string(
    input logic [VALUE_WIDTH-1:0] value,
    input integer width
);
    string result;
    result = "";
    for (integer i = width - 1; i >= 0; i = i - 1)
        result = {result, $sformatf("%b", value[i])};
    return result;
endfunction

function automatic bit report_check(
    input bit passed,
    input string description,
    input string details
);
    tests_run = tests_run + 1;
    if (passed) begin
        tests_passed = tests_passed + 1;
        $display("✅ PASS %0d: %s", tests_run, description);
    end
    else begin
        $display("❌ FAIL %0d: %s", tests_run, description);
        $display("   %s", details);
    end
    return passed;
endfunction

function automatic bit assert_equal(
    input logic [VALUE_WIDTH-1:0] actual,
    input logic [VALUE_WIDTH-1:0] expected,
    input string description,
    input integer width = VALUE_WIDTH
);
    return report_check(actual === expected, description,
        $sformatf("Erwartet: %s (unsigned %0d); erhalten: %s (unsigned %0d)",
                  bit_string(expected, width), expected,
                  bit_string(actual, width), actual));
endfunction

function automatic bit assert_equal_signed(
    input logic signed [VALUE_WIDTH-1:0] actual,
    input logic signed [VALUE_WIDTH-1:0] expected,
    input string description
);
    return report_check(actual === expected, description,
        $sformatf("Erwartet: %0d (Bits %b); erhalten: %0d (Bits %b)",
                  expected, expected, actual, actual));
endfunction

function automatic bit assert_true(
    input logic condition,
    input string description
);
    return report_check(condition === 1'b1, description,
        $sformatf("Erwartet: wahr (1); erhalten: %b", condition));
endfunction

task automatic finish_tests;
    // Ohne ausgeführte Prüfungen darf eine Testbench nicht bestehen.
    all_passed = all_passed & (tests_run > 0) & (tests_run == tests_passed);
    $display("\nErgebnis: %0d von %0d Prüfungen bestanden.", tests_passed, tests_run);
    if (all_passed)
        $display("✅ PASS Gesamtergebnis");
    else
        $display("❌ FAIL Gesamtergebnis");
    // Maschinenlesbares Gesamtergebnis für die bestehende HDLab-Auswertung.
    $display("TEST_SOLVED=%b", all_passed);
    $finish;
endtask

initial begin : watchdog
    #WATCHDOG_TIME;
    $display("❌ FAIL Timeout: Testbench nach %0t nicht beendet.", $time);
    all_passed = 1'b0;
    finish_tests();
end
// END TEST HELPERS

//------------------------------------------------------------------------ //

logic [7:0] nine_out;
logic signed [7:0] minus_three_out;

module_constants dut (
    .nine_out(nine_out),
    .minus_three_out(minus_three_out)
);

initial begin
    #1;
    all_passed &= assert_equal(nine_out, 8'd9, "nine_out: Konstante 9");
    all_passed &= assert_equal_signed(minus_three_out, -8'sd3, "minus_three_out: Konstante -3");
    finish_tests();
end
endmodule
```
**TESTBENCH_END**

---

<!--
lesson_id: 400
lesson_title: "4. Operatoren und Ausdrücke"
difficulty: "intro"
duration_min: 1
type: "theory"
-->

## 4. Operatoren und Ausdrücke

Operatoren bilden aus Signalen neue Werte. Dieses Kapitel behandelt logische Verknüpfungen, das Zusammensetzen von Bitfolgen sowie Berechnungen und Vergleiche.

**Beispiel:** `a & b` verknüpft Bits; `a < b` vergleicht Zahlen.

---

<!--
lesson_id: 401
lesson_title: "4.1 Bitweise und logische Operatoren"
difficulty: "intro"
duration_min: 10
type: "theory"
-->

### 4.1 Bitweise und logische Operatoren

**Bitweise Operatoren** verknüpfen die einzelnen Bits zweier Vektoren. **Logische Operatoren** behandeln jeden Operanden als Wahrheitswert: null ist falsch, ungleich null ist wahr. Ihr Ergebnis besitzt ein Bit.

| Bitweise | Bedeutung | Logisch | Bedeutung |
|----------|-----------|---------|-----------|
| `&` | AND je Bit | `&&` | Beide Werte sind wahr |
| `\|` | OR je Bit | `\|\|` | Mindestens ein Wert ist wahr |
| `^` | XOR je Bit | — | — |
| `~` | Bits invertieren | `!` | Wahrheitswert negieren |

**Beispiel:** Für `a = 4'b0010` und `b = 4'b0100` ist `a & b` gleich `0000`. Beide Werte sind aber ungleich null; ihr logisches AND ist deshalb 1.

```verilog
module module_operators(
    input logic [3:0] a,
    input logic [3:0] b,
    output logic [3:0] bitwise_and_out,
    output logic logical_and_out,
    output logic [3:0] inverted_out,
    output logic is_zero_out
);

assign bitwise_and_out = a & b;
assign logical_and_out = (a != 4'b0000) && (b != 4'b0000);
assign inverted_out = ~a;
assign is_zero_out = !(a != 4'b0000);

endmodule
```

`a != 0` bedeutet „a ist ungleich null“. Die Vergleiche wandeln die Vektoren vor der logischen Verknüpfung ausdrücklich in Wahrheitswerte um.

---

<!--
lesson_id: 402
lesson_title: "4.1.a. Übung: Bitweise und logisch"
difficulty: "intro"
duration_min: 10
type: "exercise"
-->

### 4.1.a. Übung: Bitweise und logisch

Das Modul zeigt den Unterschied zwischen bitweisem und logischem AND bei Vektoren.

#### Schnittstelle

| Port | Richtung | Typ | Beschreibung |
|------|----------|-----|--------------|
| `a` | `input` | `logic [3:0]` | Erster 4-Bit-Operand |
| `b` | `input` | `logic [3:0]` | Zweiter 4-Bit-Operand |
| `bitwise_out` | `output` | `logic [3:0]` | Bitweise AND-Verknüpfung |
| `logical_out` | `output` | `logic` | Logische AND-Verknüpfung |

#### Verhalten

- Jedes Bit von `bitwise_out` ist das AND der entsprechenden Bits von `a` und `b`.
- `logical_out` ist 1, wenn beide Eingangsvektoren ungleich null sind, sonst 0.
- Beispiel: `a = 4'b0010`, `b = 4'b0100` ergibt `bitwise_out = 4'b0000` und `logical_out = 1'b1`.

#### Realisierung

- Verwenden Sie `&` für bitweises AND und `&&` für logisches AND.
- Das bitweise Ergebnis besitzt 4 Bit, das logische Ergebnis nur 1 Bit.
- Verwenden Sie `assign`, keine `always`-Blöcke.

**EXERCISE_START**
```verilog
module module_bitwise_logical(
    input logic [3:0] a,
    input logic [3:0] b,
    output logic [3:0] bitwise_out,
    output logic logical_out
);

// Hier Code hinzufügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_bitwise_logical(
    input logic [3:0] a,
    input logic [3:0] b,
    output logic [3:0] bitwise_out,
    output logic logical_out
);

assign bitwise_out = a & b;
assign logical_out = (a != 4'b0000) && (b != 4'b0000);

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_bitwise_logical;

localparam integer VALUE_WIDTH = 4;
localparam time WATCHDOG_TIME = 90;

// BEGIN TEST HELPERS
// Wird für HDLab direkt in jede Testbench eingebettet (keine Includes nötig).
// VALUE_WIDTH und WATCHDOG_TIME werden in der jeweiligen Testbench festgelegt.
integer tests_run = 0;
integer tests_passed = 0;
bit all_passed = 1'b1;

function automatic string bit_string(
    input logic [VALUE_WIDTH-1:0] value,
    input integer width
);
    string result;
    result = "";
    for (integer i = width - 1; i >= 0; i = i - 1)
        result = {result, $sformatf("%b", value[i])};
    return result;
endfunction

function automatic bit report_check(
    input bit passed,
    input string description,
    input string details
);
    tests_run = tests_run + 1;
    if (passed) begin
        tests_passed = tests_passed + 1;
        $display("✅ PASS %0d: %s", tests_run, description);
    end
    else begin
        $display("❌ FAIL %0d: %s", tests_run, description);
        $display("   %s", details);
    end
    return passed;
endfunction

function automatic bit assert_equal(
    input logic [VALUE_WIDTH-1:0] actual,
    input logic [VALUE_WIDTH-1:0] expected,
    input string description,
    input integer width = VALUE_WIDTH
);
    return report_check(actual === expected, description,
        $sformatf("Erwartet: %s (unsigned %0d); erhalten: %s (unsigned %0d)",
                  bit_string(expected, width), expected,
                  bit_string(actual, width), actual));
endfunction

function automatic bit assert_equal_signed(
    input logic signed [VALUE_WIDTH-1:0] actual,
    input logic signed [VALUE_WIDTH-1:0] expected,
    input string description
);
    return report_check(actual === expected, description,
        $sformatf("Erwartet: %0d (Bits %b); erhalten: %0d (Bits %b)",
                  expected, expected, actual, actual));
endfunction

function automatic bit assert_true(
    input logic condition,
    input string description
);
    return report_check(condition === 1'b1, description,
        $sformatf("Erwartet: wahr (1); erhalten: %b", condition));
endfunction

task automatic finish_tests;
    // Ohne ausgeführte Prüfungen darf eine Testbench nicht bestehen.
    all_passed = all_passed & (tests_run > 0) & (tests_run == tests_passed);
    $display("\nErgebnis: %0d von %0d Prüfungen bestanden.", tests_passed, tests_run);
    if (all_passed)
        $display("✅ PASS Gesamtergebnis");
    else
        $display("❌ FAIL Gesamtergebnis");
    // Maschinenlesbares Gesamtergebnis für die bestehende HDLab-Auswertung.
    $display("TEST_SOLVED=%b", all_passed);
    $finish;
endtask

initial begin : watchdog
    #WATCHDOG_TIME;
    $display("❌ FAIL Timeout: Testbench nach %0t nicht beendet.", $time);
    all_passed = 1'b0;
    finish_tests();
end
// END TEST HELPERS

//------------------------------------------------------------------------ //

logic [3:0] a, b, bitwise_out;
logic logical_out;

module_bitwise_logical dut (
    .a(a),
    .b(b),
    .bitwise_out(bitwise_out),
    .logical_out(logical_out)
);

task automatic check_case(
    input logic [3:0] a_in, b_in, expected_bits,
    input logic expected_logical,
    input string name
);
    a = a_in;
    b = b_in;
    #1;
    all_passed &= assert_equal(bitwise_out, expected_bits,
        $sformatf("%s: bitweises AND (a=%b, b=%b)", name, a, b));
    all_passed &= assert_equal(VALUE_WIDTH'(logical_out), VALUE_WIDTH'(expected_logical),
        $sformatf("%s: logisches AND (a=%b, b=%b)", name, a, b), 1);
endtask

initial begin
    check_case(4'h0, 4'h0, 4'h0, 0, "Beide Operanden null");
    check_case(4'h0, 4'hF, 4'h0, 0, "Nur a ist null");
    check_case(4'hF, 4'h0, 4'h0, 0, "Nur b ist null");
    check_case(4'h2, 4'h4, 4'h0, 1, "Beide ungleich null, aber kein gemeinsames gesetztes Bit");
    check_case(4'hA, 4'hC, 4'h8, 1, "Teilweise überlappende Bitmuster");
    check_case(4'h5, 4'h5, 4'h5, 1, "Identische Bitmuster");
    check_case(4'hF, 4'hF, 4'hF, 1, "Alle Bits gesetzt");
    check_case(4'h0, 4'h0, 4'h0, 0, "Rückkehr zu null");
    finish_tests();
end
endmodule
```
**TESTBENCH_END**

---

<!--
lesson_id: 403
lesson_title: "4.3 Konkatenation und Replikation"
difficulty: "intro"
duration_min: 10
type: "theory"
-->

### 4.3 Konkatenation und Replikation

Die **Konkatenation** `{a, b}` setzt Bitfolgen zusammen. Der linke Teil bildet die höchstwertigen Bits. Die Ergebnisbreite ist die Summe der einzelnen Breiten.

Die **Replikation** `{anzahl{wert}}` wiederholt eine Bitfolge. Die Wiederholungszahl ist eine feste Konstante.

**Beispiel:** Für `high_in = 4'b1010` und `low_in = 4'b0011` ergibt die Konkatenation `1010_0011`. Die zweimalige Wiederholung von `low_in` ergibt `0011_0011`.

```verilog
module module_join(
    input logic [3:0] high_in,
    input logic [3:0] low_in,
    output logic [7:0] joined_out,
    output logic [7:0] repeated_out
);

assign joined_out = {high_in, low_in};
assign repeated_out = {2{low_in}};

endmodule
```

---

<!--
lesson_id: 404
lesson_title: "4.3.a. Übung: Zusammensetzen und wiederholen"
difficulty: "intro"
duration_min: 10
type: "exercise"
-->

### 4.3.a. Übung: Zusammensetzen und wiederholen

Das Modul setzt zwei Datenfelder zusammen und wiederholt ein Datenfeld.

#### Schnittstelle

| Port | Richtung | Typ | Beschreibung |
|------|----------|-----|--------------|
| `high_in` | `input` | `logic [3:0]` | Datenfeld für die oberen vier Bits |
| `low_in` | `input` | `logic [3:0]` | Datenfeld für die unteren Bits und die Wiederholung |
| `joined_out` | `output` | `logic [7:0]` | Zusammengesetztes 8-Bit-Datenwort |
| `repeated_out` | `output` | `logic [7:0]` | Zweimal wiederholtes unteres Datenfeld |

#### Verhalten

- `joined_out[7:4]` übernimmt `high_in`, `joined_out[3:0]` übernimmt `low_in`.
- Die obere und die untere Hälfte von `repeated_out` übernehmen jeweils `low_in`.

#### Realisierung

- Verwenden Sie Konkatenation für `joined_out` und Replikation für `repeated_out`.
- Die Wiederholungszahl ist konstant und beträgt 2.
- Verwenden Sie `assign`, keine `always`-Blöcke.

**EXERCISE_START**
```verilog
module module_join_repeat(
    input logic [3:0] high_in,
    input logic [3:0] low_in,
    output logic [7:0] joined_out,
    output logic [7:0] repeated_out
);

// Hier Code hinzufügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_join_repeat(
    input logic [3:0] high_in,
    input logic [3:0] low_in,
    output logic [7:0] joined_out,
    output logic [7:0] repeated_out
);

assign joined_out = {high_in, low_in};
assign repeated_out = {2{low_in}};

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_join_repeat;

localparam integer VALUE_WIDTH = 8;
localparam time WATCHDOG_TIME = 90;

// BEGIN TEST HELPERS
// Wird für HDLab direkt in jede Testbench eingebettet (keine Includes nötig).
// VALUE_WIDTH und WATCHDOG_TIME werden in der jeweiligen Testbench festgelegt.
integer tests_run = 0;
integer tests_passed = 0;
bit all_passed = 1'b1;

function automatic string bit_string(
    input logic [VALUE_WIDTH-1:0] value,
    input integer width
);
    string result;
    result = "";
    for (integer i = width - 1; i >= 0; i = i - 1)
        result = {result, $sformatf("%b", value[i])};
    return result;
endfunction

function automatic bit report_check(
    input bit passed,
    input string description,
    input string details
);
    tests_run = tests_run + 1;
    if (passed) begin
        tests_passed = tests_passed + 1;
        $display("✅ PASS %0d: %s", tests_run, description);
    end
    else begin
        $display("❌ FAIL %0d: %s", tests_run, description);
        $display("   %s", details);
    end
    return passed;
endfunction

function automatic bit assert_equal(
    input logic [VALUE_WIDTH-1:0] actual,
    input logic [VALUE_WIDTH-1:0] expected,
    input string description,
    input integer width = VALUE_WIDTH
);
    return report_check(actual === expected, description,
        $sformatf("Erwartet: %s (unsigned %0d); erhalten: %s (unsigned %0d)",
                  bit_string(expected, width), expected,
                  bit_string(actual, width), actual));
endfunction

function automatic bit assert_equal_signed(
    input logic signed [VALUE_WIDTH-1:0] actual,
    input logic signed [VALUE_WIDTH-1:0] expected,
    input string description
);
    return report_check(actual === expected, description,
        $sformatf("Erwartet: %0d (Bits %b); erhalten: %0d (Bits %b)",
                  expected, expected, actual, actual));
endfunction

function automatic bit assert_true(
    input logic condition,
    input string description
);
    return report_check(condition === 1'b1, description,
        $sformatf("Erwartet: wahr (1); erhalten: %b", condition));
endfunction

task automatic finish_tests;
    // Ohne ausgeführte Prüfungen darf eine Testbench nicht bestehen.
    all_passed = all_passed & (tests_run > 0) & (tests_run == tests_passed);
    $display("\nErgebnis: %0d von %0d Prüfungen bestanden.", tests_passed, tests_run);
    if (all_passed)
        $display("✅ PASS Gesamtergebnis");
    else
        $display("❌ FAIL Gesamtergebnis");
    // Maschinenlesbares Gesamtergebnis für die bestehende HDLab-Auswertung.
    $display("TEST_SOLVED=%b", all_passed);
    $finish;
endtask

initial begin : watchdog
    #WATCHDOG_TIME;
    $display("❌ FAIL Timeout: Testbench nach %0t nicht beendet.", $time);
    all_passed = 1'b0;
    finish_tests();
end
// END TEST HELPERS

//------------------------------------------------------------------------ //

logic [3:0] high_in, low_in;
logic [7:0] joined_out, repeated_out;

module_join_repeat dut (
    .high_in(high_in),
    .low_in(low_in),
    .joined_out(joined_out),
    .repeated_out(repeated_out)
);

task automatic check_case(
    input logic [3:0] high_value, low_value,
    input logic [7:0] expected_joined, expected_repeated,
    input string name
);
    high_in = high_value;
    low_in = low_value;
    #1;
    all_passed &= assert_equal(joined_out, expected_joined,
        $sformatf("%s: Konkatenation (high=%h, low=%h)", name, high_in, low_in));
    all_passed &= assert_equal(repeated_out, expected_repeated,
        $sformatf("%s: Replikation (low=%h)", name, low_in));
endtask

initial begin
    check_case(4'h0, 4'h0, 8'h00, 8'h00, "Beide Datenfelder null");
    check_case(4'hA, 4'h3, 8'hA3, 8'h33, "Unterschiedliche obere und untere Hälfte");
    check_case(4'h0, 4'hF, 8'h0F, 8'hFF, "Nur unteres Datenfeld gesetzt");
    check_case(4'hF, 4'h0, 8'hF0, 8'h00, "Nur oberes Datenfeld gesetzt");
    check_case(4'h1, 4'h8, 8'h18, 8'h88, "Bitreihenfolge innerhalb der Felder erhalten");
    check_case(4'hF, 4'hF, 8'hFF, 8'hFF, "Alle Bits gesetzt");
    check_case(4'h0, 4'h0, 8'h00, 8'h00, "Rückkehr zu null");
    finish_tests();
end
endmodule
```
**TESTBENCH_END**

---

<!--
lesson_id: 405
lesson_title: "4.5 Arithmetische und relationale Operatoren"
difficulty: "intro"
duration_min: 10
type: "theory"
-->

### 4.5 Arithmetische und relationale Operatoren

**Arithmetische Operatoren** rechnen mit Zahlen. **Vergleichsoperatoren** liefern 1, wenn die angegebene Beziehung gilt, sonst 0.

| Operator | Bedeutung |
|----------|-----------|
| `+`, `-` | Addition, Subtraktion |
| `*` | Multiplikation |
| `/`, `%` | Ganzzahlige Division, Rest |
| `<`, `<=`, `>`, `>=` | Kleiner, kleiner gleich, größer, größer gleich |
| `==`, `!=` | Gleich, ungleich |

**Beispiel:** Zwei unsigned 4-Bit-Zahlen können zusammen bis zu 30 ergeben. Die Summe benötigt deshalb fünf Bits. Für `a = 15` und `b = 1` ergibt sich `sum_out = 16` und `greater_out = 1`.

```verilog
module module_calculate(
    input logic [3:0] a,
    input logic [3:0] b,
    output logic [4:0] sum_out,
    output logic less_out,
    output logic equal_out,
    output logic greater_out
);

assign sum_out = {1'b0, a} + {1'b0, b};
assign less_out = a < b;
assign equal_out = a == b;
assign greater_out = a > b;

endmodule
```

Die führenden Nullen erweitern beide Operanden für die Addition auf fünf Bits. Bei Division wird der Nachkommateil verworfen: `7 / 2` ergibt 3; der Rest `7 % 2` ist 1.

---

<!--
lesson_id: 406
lesson_title: "4.5.a. Übung: Summe und Vergleich"
difficulty: "intro"
duration_min: 10
type: "exercise"
-->

### 4.5.a. Übung: Summe und Vergleich

Das Modul addiert zwei Zahlen und vergleicht sie miteinander.

#### Schnittstelle

| Port | Richtung | Typ | Beschreibung |
|------|----------|-----|--------------|
| `a` | `input` | `logic [3:0]` | Erster vorzeichenloser Operand |
| `b` | `input` | `logic [3:0]` | Zweiter vorzeichenloser Operand |
| `sum_out` | `output` | `logic [4:0]` | Summe einschließlich Übertrag |
| `less_out` | `output` | `logic` | Kennzeichen für a kleiner als b |
| `equal_out` | `output` | `logic` | Kennzeichen für gleiche Operanden |

#### Verhalten

- `sum_out` liefert die Summe von `a` und `b` ohne Verlust des Übertrags.
- `less_out` ist 1 genau dann, wenn `a < b` gilt.
- `equal_out` ist 1 genau dann, wenn beide Werte gleich sind.
- Beispiel: `a = 15`, `b = 1` ergibt `sum_out = 16`, `less_out = 0`, `equal_out = 0`.

#### Realisierung

- Behandeln Sie beide Eingänge als unsigned.
- Erweitern Sie die Operanden für die Addition auf 5 Bit; die Summe kann bis zu 30 betragen.
- Verwenden Sie arithmetische und Vergleichsoperatoren in `assign`-Zuweisungen, keine `always`-Blöcke.

**EXERCISE_START**
```verilog
module module_sum_compare(
    input logic [3:0] a,
    input logic [3:0] b,
    output logic [4:0] sum_out,
    output logic less_out,
    output logic equal_out
);

// Hier Code hinzufügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_sum_compare(
    input logic [3:0] a,
    input logic [3:0] b,
    output logic [4:0] sum_out,
    output logic less_out,
    output logic equal_out
);

assign sum_out = {1'b0, a} + {1'b0, b};
assign less_out = a < b;
assign equal_out = a == b;

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_sum_compare;

localparam integer VALUE_WIDTH = 5;
localparam time WATCHDOG_TIME = 90;

// BEGIN TEST HELPERS
// Wird für HDLab direkt in jede Testbench eingebettet (keine Includes nötig).
// VALUE_WIDTH und WATCHDOG_TIME werden in der jeweiligen Testbench festgelegt.
integer tests_run = 0;
integer tests_passed = 0;
bit all_passed = 1'b1;

function automatic string bit_string(
    input logic [VALUE_WIDTH-1:0] value,
    input integer width
);
    string result;
    result = "";
    for (integer i = width - 1; i >= 0; i = i - 1)
        result = {result, $sformatf("%b", value[i])};
    return result;
endfunction

function automatic bit report_check(
    input bit passed,
    input string description,
    input string details
);
    tests_run = tests_run + 1;
    if (passed) begin
        tests_passed = tests_passed + 1;
        $display("✅ PASS %0d: %s", tests_run, description);
    end
    else begin
        $display("❌ FAIL %0d: %s", tests_run, description);
        $display("   %s", details);
    end
    return passed;
endfunction

function automatic bit assert_equal(
    input logic [VALUE_WIDTH-1:0] actual,
    input logic [VALUE_WIDTH-1:0] expected,
    input string description,
    input integer width = VALUE_WIDTH
);
    return report_check(actual === expected, description,
        $sformatf("Erwartet: %s (unsigned %0d); erhalten: %s (unsigned %0d)",
                  bit_string(expected, width), expected,
                  bit_string(actual, width), actual));
endfunction

function automatic bit assert_equal_signed(
    input logic signed [VALUE_WIDTH-1:0] actual,
    input logic signed [VALUE_WIDTH-1:0] expected,
    input string description
);
    return report_check(actual === expected, description,
        $sformatf("Erwartet: %0d (Bits %b); erhalten: %0d (Bits %b)",
                  expected, expected, actual, actual));
endfunction

function automatic bit assert_true(
    input logic condition,
    input string description
);
    return report_check(condition === 1'b1, description,
        $sformatf("Erwartet: wahr (1); erhalten: %b", condition));
endfunction

task automatic finish_tests;
    // Ohne ausgeführte Prüfungen darf eine Testbench nicht bestehen.
    all_passed = all_passed & (tests_run > 0) & (tests_run == tests_passed);
    $display("\nErgebnis: %0d von %0d Prüfungen bestanden.", tests_passed, tests_run);
    if (all_passed)
        $display("✅ PASS Gesamtergebnis");
    else
        $display("❌ FAIL Gesamtergebnis");
    // Maschinenlesbares Gesamtergebnis für die bestehende HDLab-Auswertung.
    $display("TEST_SOLVED=%b", all_passed);
    $finish;
endtask

initial begin : watchdog
    #WATCHDOG_TIME;
    $display("❌ FAIL Timeout: Testbench nach %0t nicht beendet.", $time);
    all_passed = 1'b0;
    finish_tests();
end
// END TEST HELPERS

//------------------------------------------------------------------------ //

logic [3:0] a, b;
logic [4:0] sum_out;
logic less_out, equal_out;

module_sum_compare dut (
    .a(a),
    .b(b),
    .sum_out(sum_out),
    .less_out(less_out),
    .equal_out(equal_out)
);

task automatic check_case(
    input logic [3:0] a_in, b_in,
    input logic [4:0] expected_sum,
    input logic expected_less, expected_equal,
    input string name
);
    a = a_in;
    b = b_in;
    #1;
    all_passed &= assert_equal(sum_out, expected_sum,
        $sformatf("%s: Summe (a=%0d, b=%0d)", name, a, b));
    all_passed &= assert_equal(VALUE_WIDTH'(less_out), VALUE_WIDTH'(expected_less),
        $sformatf("%s: kleiner (a=%0d, b=%0d)", name, a, b), 1);
    all_passed &= assert_equal(VALUE_WIDTH'(equal_out), VALUE_WIDTH'(expected_equal),
        $sformatf("%s: gleich (a=%0d, b=%0d)", name, a, b), 1);
endtask

initial begin
    check_case(0, 0, 0, 0, 1, "Beide Operanden null");
    check_case(0, 15, 15, 1, 0, "a kleiner als b");
    check_case(15, 0, 15, 0, 0, "a größer als b");
    check_case(7, 7, 14, 0, 1, "Gleiche Operanden ungleich null");
    check_case(15, 1, 16, 0, 0, "Übertrag darf nicht verloren gehen");
    check_case(1, 15, 16, 1, 0, "Übertrag bei vertauschten Operanden");
    check_case(15, 15, 30, 0, 1, "Größte mögliche Summe");
    check_case(8, 7, 15, 0, 0, "Unsigned-Vergleich bei gesetztem MSB");
    check_case(7, 8, 15, 1, 0, "Unsigned-Vergleich in Gegenrichtung");
    check_case(0, 0, 0, 0, 1, "Rückkehr zu null");
    finish_tests();
end
endmodule
```
**TESTBENCH_END**

---

<!--
lesson_id: 500
lesson_title: "5. Kontinuierliche und bedingte Zuweisungen"
difficulty: "beginner"
duration_min: 1
type: "theory"
-->

## 5. Kontinuierliche und bedingte Zuweisungen

`assign` beschreibt kombinatorische Verbindungen. Mit Bedingungen lässt sich zwischen mehreren Werten auswählen.

**Beispiel:** `assign y = enable ? data : 1'b0;` gibt bei `enable = 1` den Wert von `data` aus, sonst 0.

---

<!--
lesson_id: 501
lesson_title: "5.1 Kontinuierliche Zuweisung (assign)"
difficulty: "beginner"
duration_min: 10
type: "theory"
-->

### 5.1 Kontinuierliche Zuweisung (assign)

Eine **kontinuierliche Zuweisung** verbindet einen Ausdruck dauerhaft mit einem Zielsignal:

```verilog
assign ziel = ausdruck;
```

Ändert sich ein Eingang des Ausdrucks, folgt der Ausgang dem neuen Ergebnis. Die Zuweisung speichert keinen Zustand. Mehrere `assign`-Anweisungen wirken gleichzeitig; ihre Reihenfolge beschreibt keinen zeitlichen Ablauf.

**Beispiel:** Das Modul invertiert die Eingangsdaten und prüft, ob mindestens ein Bit gesetzt ist.

```verilog
module module_continuous(
    input logic [3:0] data_in,
    output logic [3:0] inverted_out,
    output logic any_set_out
);

assign inverted_out = ~data_in;
assign any_set_out = |data_in;

endmodule
```

Ein Operator vor einem einzelnen Vektor heißt hier **Reduktionsoperator**: `|data_in` verknüpft alle Bits mit OR. `^data_in` verknüpft sie mit XOR und liefert 1 bei einer ungeraden Anzahl Einsen. Darauf basiert die nächste Übung.

---

<!--
lesson_id: 502
lesson_title: "5.1.a. Übung: Paritätsgenerator"
difficulty: "beginner"
duration_min: 10
type: "exercise"
-->

### 5.1.a. Übung: Paritätsgenerator

Ein Paritätsgenerator ergänzt ein Datenwort um ein Prüfbit für gerade Parität.

#### Schnittstelle

| Port | Richtung | Typ | Beschreibung |
|------|----------|-----|--------------|
| `data_in` | `input` | `logic [3:0]` | Zu prüfendes 4-Bit-Datenwort |
| `parity_out` | `output` | `logic` | Prüfbit für gerade Parität |

#### Verhalten

- Datenwort und Paritätsbit besitzen zusammen eine gerade Anzahl Einsen.
- Bei einer ungeraden Anzahl Einsen in `data_in` ist `parity_out` gleich 1, sonst 0.
- Beispiele: `0000` → 0, `0001` → 1, `0011` → 0, `0111` → 1.

#### Realisierung

- Verwenden Sie die XOR-Reduktion (`^data_in`).
- Verwenden Sie eine kontinuierliche Zuweisung (`assign`), keine `always`-Blöcke.

**EXERCISE_START**
```verilog
module module_parity(
    input logic [3:0] data_in,
    output logic parity_out
);

// Hier Code hinzufügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_parity(
    input logic [3:0] data_in,
    output logic parity_out
);

assign parity_out = ^data_in;

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_parity;

localparam integer VALUE_WIDTH = 1;
localparam time WATCHDOG_TIME = 90;

// BEGIN TEST HELPERS
// Wird für HDLab direkt in jede Testbench eingebettet (keine Includes nötig).
// VALUE_WIDTH und WATCHDOG_TIME werden in der jeweiligen Testbench festgelegt.
integer tests_run = 0;
integer tests_passed = 0;
bit all_passed = 1'b1;

function automatic string bit_string(
    input logic [VALUE_WIDTH-1:0] value,
    input integer width
);
    string result;
    result = "";
    for (integer i = width - 1; i >= 0; i = i - 1)
        result = {result, $sformatf("%b", value[i])};
    return result;
endfunction

function automatic bit report_check(
    input bit passed,
    input string description,
    input string details
);
    tests_run = tests_run + 1;
    if (passed) begin
        tests_passed = tests_passed + 1;
        $display("✅ PASS %0d: %s", tests_run, description);
    end
    else begin
        $display("❌ FAIL %0d: %s", tests_run, description);
        $display("   %s", details);
    end
    return passed;
endfunction

function automatic bit assert_equal(
    input logic [VALUE_WIDTH-1:0] actual,
    input logic [VALUE_WIDTH-1:0] expected,
    input string description,
    input integer width = VALUE_WIDTH
);
    return report_check(actual === expected, description,
        $sformatf("Erwartet: %s (unsigned %0d); erhalten: %s (unsigned %0d)",
                  bit_string(expected, width), expected,
                  bit_string(actual, width), actual));
endfunction

function automatic bit assert_equal_signed(
    input logic signed [VALUE_WIDTH-1:0] actual,
    input logic signed [VALUE_WIDTH-1:0] expected,
    input string description
);
    return report_check(actual === expected, description,
        $sformatf("Erwartet: %0d (Bits %b); erhalten: %0d (Bits %b)",
                  expected, expected, actual, actual));
endfunction

function automatic bit assert_true(
    input logic condition,
    input string description
);
    return report_check(condition === 1'b1, description,
        $sformatf("Erwartet: wahr (1); erhalten: %b", condition));
endfunction

task automatic finish_tests;
    // Ohne ausgeführte Prüfungen darf eine Testbench nicht bestehen.
    all_passed = all_passed & (tests_run > 0) & (tests_run == tests_passed);
    $display("\nErgebnis: %0d von %0d Prüfungen bestanden.", tests_passed, tests_run);
    if (all_passed)
        $display("✅ PASS Gesamtergebnis");
    else
        $display("❌ FAIL Gesamtergebnis");
    // Maschinenlesbares Gesamtergebnis für die bestehende HDLab-Auswertung.
    $display("TEST_SOLVED=%b", all_passed);
    $finish;
endtask

initial begin : watchdog
    #WATCHDOG_TIME;
    $display("❌ FAIL Timeout: Testbench nach %0t nicht beendet.", $time);
    all_passed = 1'b0;
    finish_tests();
end
// END TEST HELPERS

//------------------------------------------------------------------------ //

logic [3:0] data_in;
logic parity_out;

module_parity dut (
    .data_in(data_in),
    .parity_out(parity_out)
);

task automatic check_case(input logic [3:0] value, input logic expected_parity);
    data_in = value;
    #1;
    all_passed &= assert_equal(parity_out, expected_parity,
        $sformatf("Gerade Parität für data_in=%b", value));
endtask

initial begin
    // Die Wahrheitstabelle ist unabhängig vom XOR-Ausdruck der Musterlösung.
    for (int value = 0; value < 16; value = value + 1) begin
        case (value)
            0, 3, 5, 6, 9, 10, 12, 15: check_case(value[3:0], 0);
            default: check_case(value[3:0], 1);
        endcase
    end
    check_case(4'b0000, 0);
    finish_tests();
end
endmodule
```
**TESTBENCH_END**

---

<!--
lesson_id: 503
lesson_title: "5.3 Bedingte Zuweisungen"
difficulty: "beginner"
duration_min: 10
type: "theory"
-->

### 5.3 Bedingte Zuweisungen

Der **bedingte Operator** `?:` wählt zwischen zwei Werten:

```verilog
assign ziel = bedingung ? wert_wenn_wahr : wert_wenn_falsch;
```

Die Auswahl beschreibt einen **Multiplexer**. Beide Alternativen sind angegeben; ein vorheriger Ausgangswert wird nicht gespeichert.

**Beispiel:** Ein 2-Bit-Eingang wählt aus drei festen Ausgabewerten.

```verilog
module module_select_value(
    input logic [1:0] level_in,
    output logic [7:0] value_out
);

assign value_out = (level_in == 2'b00) ? 8'd0 :
                   (level_in == 2'b01) ? 8'd64 :
                                        8'd128;

endmodule
```

Bei `00` wird 0 ausgegeben, bei `01` der Wert 64, sonst 128. Bei verschachtelten Bedingungen hat die zuerst zutreffende Bedingung Vorrang. Die Alternativen sollten die gleiche Bitbreite besitzen.

---

<!--
lesson_id: 504
lesson_title: "5.3.a. Übung: Lüfterstufe auswählen"
difficulty: "beginner"
duration_min: 10
type: "exercise"
-->

### 5.3.a. Übung: Lüfterstufe auswählen

Das Modul wählt anhand einer Temperatur eine Lüfterstufe. Es liefert einen Stufencode; die Ansteuerung des realen Lüfters ist nicht Teil der Aufgabe.

#### Schnittstelle

| Port | Richtung | Typ | Beschreibung |
|------|----------|-----|--------------|
| `temperature_in` | `input` | `logic [7:0]` | Temperatur als vorzeichenlose Ganzzahl in °C |
| `speed_out` | `output` | `logic [1:0]` | Lüfterstufe: 00 aus, 01 langsam, 10 mittel, 11 schnell |

#### Verhalten

- Unter 30 °C: `speed_out = 2'b00`.
- Von 30 bis 49 °C: `speed_out = 2'b01`.
- Von 50 bis 69 °C: `speed_out = 2'b10`.
- Ab 70 °C: `speed_out = 2'b11`.
- Die Auswahl hängt ausschließlich von der aktuellen Temperatur ab; es gibt keine Hysterese.

#### Realisierung

- Verwenden Sie Vergleiche und verschachtelte bedingte Zuweisungen (`assign` mit `?:`), keine `always`-Blöcke.
- Prüfen Sie die oberen Grenzen von unten nach oben: unter 30, unter 50, unter 70; danach folgt der verbleibende Fall.
- Diese Vergleichsbedingungen überlappen sich. Die zuerst zutreffende Bedingung hat Priorität.
- Berücksichtigen Sie die Grenzwerte 30, 50 und 70 und verwenden Sie 2-Bit-Konstanten für die Lüfterstufen.

**EXERCISE_START**
```verilog
module module_fan_selector(
    input logic [7:0] temperature_in,
    output logic [1:0] speed_out
);

// Hier Code hinzufügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_fan_selector(
    input logic [7:0] temperature_in,
    output logic [1:0] speed_out
);

assign speed_out = (temperature_in < 8'd30) ? 2'b00 :
                   (temperature_in < 8'd50) ? 2'b01 :
                   (temperature_in < 8'd70) ? 2'b10 :
                                              2'b11;

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_fan_selector;

localparam integer VALUE_WIDTH = 2;
localparam time WATCHDOG_TIME = 90;

// BEGIN TEST HELPERS
// Wird für HDLab direkt in jede Testbench eingebettet (keine Includes nötig).
// VALUE_WIDTH und WATCHDOG_TIME werden in der jeweiligen Testbench festgelegt.
integer tests_run = 0;
integer tests_passed = 0;
bit all_passed = 1'b1;

function automatic string bit_string(
    input logic [VALUE_WIDTH-1:0] value,
    input integer width
);
    string result;
    result = "";
    for (integer i = width - 1; i >= 0; i = i - 1)
        result = {result, $sformatf("%b", value[i])};
    return result;
endfunction

function automatic bit report_check(
    input bit passed,
    input string description,
    input string details
);
    tests_run = tests_run + 1;
    if (passed) begin
        tests_passed = tests_passed + 1;
        $display("✅ PASS %0d: %s", tests_run, description);
    end
    else begin
        $display("❌ FAIL %0d: %s", tests_run, description);
        $display("   %s", details);
    end
    return passed;
endfunction

function automatic bit assert_equal(
    input logic [VALUE_WIDTH-1:0] actual,
    input logic [VALUE_WIDTH-1:0] expected,
    input string description,
    input integer width = VALUE_WIDTH
);
    return report_check(actual === expected, description,
        $sformatf("Erwartet: %s (unsigned %0d); erhalten: %s (unsigned %0d)",
                  bit_string(expected, width), expected,
                  bit_string(actual, width), actual));
endfunction

function automatic bit assert_equal_signed(
    input logic signed [VALUE_WIDTH-1:0] actual,
    input logic signed [VALUE_WIDTH-1:0] expected,
    input string description
);
    return report_check(actual === expected, description,
        $sformatf("Erwartet: %0d (Bits %b); erhalten: %0d (Bits %b)",
                  expected, expected, actual, actual));
endfunction

function automatic bit assert_true(
    input logic condition,
    input string description
);
    return report_check(condition === 1'b1, description,
        $sformatf("Erwartet: wahr (1); erhalten: %b", condition));
endfunction

task automatic finish_tests;
    // Ohne ausgeführte Prüfungen darf eine Testbench nicht bestehen.
    all_passed = all_passed & (tests_run > 0) & (tests_run == tests_passed);
    $display("\nErgebnis: %0d von %0d Prüfungen bestanden.", tests_passed, tests_run);
    if (all_passed)
        $display("✅ PASS Gesamtergebnis");
    else
        $display("❌ FAIL Gesamtergebnis");
    // Maschinenlesbares Gesamtergebnis für die bestehende HDLab-Auswertung.
    $display("TEST_SOLVED=%b", all_passed);
    $finish;
endtask

initial begin : watchdog
    #WATCHDOG_TIME;
    $display("❌ FAIL Timeout: Testbench nach %0t nicht beendet.", $time);
    all_passed = 1'b0;
    finish_tests();
end
// END TEST HELPERS

//------------------------------------------------------------------------ //

logic [7:0] temperature_in;
logic [1:0] speed_out;

module_fan_selector dut (
    .temperature_in(temperature_in),
    .speed_out(speed_out)
);

task automatic check_case(input logic [7:0] temperature, input logic [1:0] expected_speed, input string name);
    temperature_in = temperature;
    #1;
    all_passed &= assert_equal(speed_out, expected_speed,
        $sformatf("%s (temperature_in=%0d)", name, temperature));
endtask

initial begin
    check_case(0,   2'b00, "Niedrigste Temperatur: Lüfter aus");
    check_case(29,  2'b00, "Direkt unter der Einschaltschwelle");
    check_case(30,  2'b01, "Einschaltschwelle: langsam");
    check_case(31,  2'b01, "Direkt über der Einschaltschwelle");
    check_case(49,  2'b01, "Letzter Wert der langsamen Stufe");
    check_case(50,  2'b10, "Schwelle zur mittleren Stufe");
    check_case(51,  2'b10, "Direkt über der mittleren Schwelle");
    check_case(69,  2'b10, "Letzter Wert der mittleren Stufe");
    check_case(70,  2'b11, "Schwelle zur schnellen Stufe");
    check_case(71,  2'b11, "Direkt über der schnellen Schwelle");
    check_case(255, 2'b11, "Höchste darstellbare Temperatur");
    check_case(69,  2'b10, "Abkühlen unter 70: keine Hysterese");
    check_case(49,  2'b01, "Abkühlen unter 50: keine Hysterese");
    check_case(29,  2'b00, "Abkühlen unter 30: Lüfter wieder aus");
    finish_tests();
end
endmodule
```
**TESTBENCH_END**

---

<!--
lesson_id: 600
lesson_title: "6. Prozedurale Blöcke"
difficulty: "beginner"
duration_min: 1
type: "theory"
-->

## 6. Prozedurale Blöcke

Prozedurale Blöcke fassen mehrere Anweisungen zusammen. Dieses Kapitel behandelt ihren Aufbau, die Auswertungsreihenfolge und den Unterschied zwischen kombinatorischen und getakteten Blöcken.

---

<!--
lesson_id: 601
lesson_title: "6.1 Aufbau eines prozeduralen Blocks"
difficulty: "beginner"
duration_min: 5
type: "theory"
-->

### 6.1 Aufbau eines prozeduralen Blocks

Eine kontinuierliche Zuweisung mit `assign` beschreibt eine einzelne Verbindung. Ein **prozeduraler Block** kann mehrere Berechnungsschritte zusammenfassen.

**Beispiel:** Der kombinatorische Block `always_comb` leitet einen Eingang über ein internes Signal weiter.

```verilog
module module_always_comb(
    input logic signal_in,
    output logic signal_out
);

logic signal_direct;

always_comb begin
    signal_direct = signal_in;
end

assign signal_out = signal_direct;

endmodule
```

- `always_comb` kennzeichnet den Block als kombinatorische Logik.
- `begin` und `end` fassen seine Anweisungen zusammen.
- Innerhalb des Blocks stehen Zuweisungen mit `=`, jeweils mit Semikolon.
- Hinter `begin` und `end` steht kein Semikolon.

Die Zuweisung im Block enthält kein `assign`. Ein Ausgang vom Typ `logic` kann auch direkt im Block zugewiesen werden. Ein Signal darf dabei nicht zusätzlich durch eine andere Zuweisung oder einen anderen Block angesteuert werden.

---

<!--
lesson_id: 602
lesson_title: "6.1.a. Übung: Prozedural invertieren"
difficulty: "beginner"
duration_min: 10
type: "exercise"
-->

### 6.1.a. Übung: Prozedural invertieren

Das Modul invertiert ein Eingangssignal in einem prozeduralen Block.

#### Schnittstelle

| Port | Richtung | Typ | Beschreibung |
|------|----------|-----|--------------|
| `signal_in` | `input` | `logic` | Zu invertierendes Eingangssignal |
| `signal_out` | `output` | `logic` | Invertierter Eingangswert |

#### Verhalten

- Bei `signal_in = 0` ist `signal_out = 1`.
- Bei `signal_in = 1` ist `signal_out = 0`.

#### Realisierung

- Einen `always_comb`-Block mit `begin` und `end` verwenden.
- Den Ausgang im Block mit `=` zuweisen; dazu den Operator `~` verwenden.
- Keine kontinuierliche Zuweisung mit `assign` verwenden.

**EXERCISE_START**
```verilog
module module_procedural_not(
    input logic signal_in,
    output logic signal_out
);

always_comb begin
    // Ausgang hier zuweisen
end

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_procedural_not(
    input logic signal_in,
    output logic signal_out
);

always_comb begin
    signal_out = ~signal_in;
end

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_procedural_not;

localparam integer VALUE_WIDTH = 1;
localparam time WATCHDOG_TIME = 90;

// BEGIN TEST HELPERS
// Wird für HDLab direkt in jede Testbench eingebettet (keine Includes nötig).
// VALUE_WIDTH und WATCHDOG_TIME werden in der jeweiligen Testbench festgelegt.
integer tests_run = 0;
integer tests_passed = 0;
bit all_passed = 1'b1;

function automatic string bit_string(
    input logic [VALUE_WIDTH-1:0] value,
    input integer width
);
    string result;
    result = "";
    for (integer i = width - 1; i >= 0; i = i - 1)
        result = {result, $sformatf("%b", value[i])};
    return result;
endfunction

function automatic bit report_check(
    input bit passed,
    input string description,
    input string details
);
    tests_run = tests_run + 1;
    if (passed) begin
        tests_passed = tests_passed + 1;
        $display("✅ PASS %0d: %s", tests_run, description);
    end
    else begin
        $display("❌ FAIL %0d: %s", tests_run, description);
        $display("   %s", details);
    end
    return passed;
endfunction

function automatic bit assert_equal(
    input logic [VALUE_WIDTH-1:0] actual,
    input logic [VALUE_WIDTH-1:0] expected,
    input string description,
    input integer width = VALUE_WIDTH
);
    return report_check(actual === expected, description,
        $sformatf("Erwartet: %s (unsigned %0d); erhalten: %s (unsigned %0d)",
                  bit_string(expected, width), expected,
                  bit_string(actual, width), actual));
endfunction

function automatic bit assert_equal_signed(
    input logic signed [VALUE_WIDTH-1:0] actual,
    input logic signed [VALUE_WIDTH-1:0] expected,
    input string description
);
    return report_check(actual === expected, description,
        $sformatf("Erwartet: %0d (Bits %b); erhalten: %0d (Bits %b)",
                  expected, expected, actual, actual));
endfunction

function automatic bit assert_true(
    input logic condition,
    input string description
);
    return report_check(condition === 1'b1, description,
        $sformatf("Erwartet: wahr (1); erhalten: %b", condition));
endfunction

task automatic finish_tests;
    // Ohne ausgeführte Prüfungen darf eine Testbench nicht bestehen.
    all_passed = all_passed & (tests_run > 0) & (tests_run == tests_passed);
    $display("\nErgebnis: %0d von %0d Prüfungen bestanden.", tests_passed, tests_run);
    if (all_passed)
        $display("✅ PASS Gesamtergebnis");
    else
        $display("❌ FAIL Gesamtergebnis");
    // Maschinenlesbares Gesamtergebnis für die bestehende HDLab-Auswertung.
    $display("TEST_SOLVED=%b", all_passed);
    $finish;
endtask

initial begin : watchdog
    #WATCHDOG_TIME;
    $display("❌ FAIL Timeout: Testbench nach %0t nicht beendet.", $time);
    all_passed = 1'b0;
    finish_tests();
end
// END TEST HELPERS

//------------------------------------------------------------------------ //

logic signal_in, signal_out;

module_procedural_not dut (
    .signal_in(signal_in),
    .signal_out(signal_out)
);

task automatic check_case(input logic value, expected_out, input string description);
    signal_in = value;
    #1;
    all_passed &= assert_equal(signal_out, expected_out, description);
endtask

initial begin
    check_case(0, 1, "Eingang Low -> Ausgang High");
    check_case(1, 0, "Eingang High -> Ausgang Low");
    check_case(0, 1, "Rückkehr zu Low -> Ausgang wieder High");
    finish_tests();
end
endmodule
```
**TESTBENCH_END**

---

<!--
lesson_id: 603
lesson_title: "6.2 Ablauf innerhalb eines Blocks"
difficulty: "beginner"
duration_min: 5
type: "theory"
-->

### 6.2 Ablauf innerhalb eines Blocks

Innerhalb eines prozeduralen Blocks werden die Anweisungen von oben nach unten ausgewertet. Bei einer **blockierenden Zuweisung** mit `=` steht das Ergebnis sofort für die nächste Anweisung bereit.

**Beispiel:** Zuerst wird `a` invertiert. Danach wird das Zwischenergebnis mit `b` verknüpft.

```verilog
module module_comb_steps(
    input logic a,
    input logic b,
    output logic y
);

logic not_a;

always_comb begin
    not_a = ~a;
    y = not_a & b;
end

endmodule
```

Für `a = 0` und `b = 1` ergibt die erste Anweisung `not_a = 1`, die zweite anschließend `y = 1`. Das Zwischensignal muss vor seiner Verwendung berechnet werden.

Die Reihenfolge beschreibt die Berechnung, keine Verzögerung um Takte. Der Block bleibt kombinatorisch. Verschiedene Blöcke eines Moduls arbeiten dagegen nebenläufig.

In einem kombinatorischen Block müssen die berechneten Signale bei jeder Ausführung vollständig zugewiesen werden. Im Beispiel erhalten sowohl `not_a` als auch `y` immer einen Wert.

---

<!--
lesson_id: 604
lesson_title: "6.2.a. Übung: Berechnung in zwei Schritten"
difficulty: "beginner"
duration_min: 10
type: "exercise"
-->

### 6.2.a. Übung: Berechnung in zwei Schritten

Das Modul prüft, ob Eingang a ausgeschaltet und Eingang b eingeschaltet ist.

#### Schnittstelle

| Port | Richtung | Typ | Beschreibung |
|------|----------|-----|--------------|
| `a` | `input` | `logic` | Erster Eingang |
| `b` | `input` | `logic` | Zweiter Eingang |
| `y` | `output` | `logic` | Ergebnis: a ist Low und b ist High |

#### Verhalten

- `y` ist nur für `a = 0` und `b = 1` gleich 1.
- Für die übrigen Eingangskombinationen ist `y = 0`.

#### Realisierung

- Ein internes Signal `not_a` vom Typ `logic` deklarieren.
- In einem `always_comb`-Block zuerst `not_a = ~a` berechnen und danach das Ergebnis mit `b` verknüpfen.
- Blockierende Zuweisungen mit `=` verwenden; kein `assign`.

**EXERCISE_START**
```verilog
module module_procedural_steps(
    input logic a,
    input logic b,
    output logic y
);

// Internes Signal deklarieren

always_comb begin
    // Schritt 1: a invertieren
    // Schritt 2: Zwischenergebnis mit b verknüpfen
end

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_procedural_steps(
    input logic a,
    input logic b,
    output logic y
);

logic not_a;

always_comb begin
    not_a = ~a;
    y = not_a & b;
end

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_procedural_steps;

localparam integer VALUE_WIDTH = 1;
localparam time WATCHDOG_TIME = 90;

// BEGIN TEST HELPERS
// Wird für HDLab direkt in jede Testbench eingebettet (keine Includes nötig).
// VALUE_WIDTH und WATCHDOG_TIME werden in der jeweiligen Testbench festgelegt.
integer tests_run = 0;
integer tests_passed = 0;
bit all_passed = 1'b1;

function automatic string bit_string(
    input logic [VALUE_WIDTH-1:0] value,
    input integer width
);
    string result;
    result = "";
    for (integer i = width - 1; i >= 0; i = i - 1)
        result = {result, $sformatf("%b", value[i])};
    return result;
endfunction

function automatic bit report_check(
    input bit passed,
    input string description,
    input string details
);
    tests_run = tests_run + 1;
    if (passed) begin
        tests_passed = tests_passed + 1;
        $display("✅ PASS %0d: %s", tests_run, description);
    end
    else begin
        $display("❌ FAIL %0d: %s", tests_run, description);
        $display("   %s", details);
    end
    return passed;
endfunction

function automatic bit assert_equal(
    input logic [VALUE_WIDTH-1:0] actual,
    input logic [VALUE_WIDTH-1:0] expected,
    input string description,
    input integer width = VALUE_WIDTH
);
    return report_check(actual === expected, description,
        $sformatf("Erwartet: %s (unsigned %0d); erhalten: %s (unsigned %0d)",
                  bit_string(expected, width), expected,
                  bit_string(actual, width), actual));
endfunction

function automatic bit assert_equal_signed(
    input logic signed [VALUE_WIDTH-1:0] actual,
    input logic signed [VALUE_WIDTH-1:0] expected,
    input string description
);
    return report_check(actual === expected, description,
        $sformatf("Erwartet: %0d (Bits %b); erhalten: %0d (Bits %b)",
                  expected, expected, actual, actual));
endfunction

function automatic bit assert_true(
    input logic condition,
    input string description
);
    return report_check(condition === 1'b1, description,
        $sformatf("Erwartet: wahr (1); erhalten: %b", condition));
endfunction

task automatic finish_tests;
    // Ohne ausgeführte Prüfungen darf eine Testbench nicht bestehen.
    all_passed = all_passed & (tests_run > 0) & (tests_run == tests_passed);
    $display("\nErgebnis: %0d von %0d Prüfungen bestanden.", tests_passed, tests_run);
    if (all_passed)
        $display("✅ PASS Gesamtergebnis");
    else
        $display("❌ FAIL Gesamtergebnis");
    // Maschinenlesbares Gesamtergebnis für die bestehende HDLab-Auswertung.
    $display("TEST_SOLVED=%b", all_passed);
    $finish;
endtask

initial begin : watchdog
    #WATCHDOG_TIME;
    $display("❌ FAIL Timeout: Testbench nach %0t nicht beendet.", $time);
    all_passed = 1'b0;
    finish_tests();
end
// END TEST HELPERS

//------------------------------------------------------------------------ //

logic a, b, y;

module_procedural_steps dut (
    .a(a),
    .b(b),
    .y(y)
);

task automatic check_case(input logic a_in, b_in, expected_out, input string description);
    a = a_in;
    b = b_in;
    #1;
    all_passed &= assert_equal(y, expected_out, description);
endtask

initial begin
    check_case(0, 0, 0, "a=0, b=0 -> y=0");
    check_case(0, 1, 1, "a=0, b=1 -> y=1");
    check_case(1, 1, 0, "a=1, b=1 -> y=0");
    check_case(1, 0, 0, "a=1, b=0 -> y=0");
    check_case(0, 1, 1, "Rückkehr zu a=0, b=1 -> y=1");
    finish_tests();
end
endmodule
```
**TESTBENCH_END**

---

<!--
lesson_id: 605
lesson_title: "6.3 Der Takt (Clock)"
difficulty: "beginner"
duration_min: 5
type: "theory"
-->

### 6.3 Der Takt (Clock)

Ein **Takt** ist ein Signal, das regelmäßig zwischen 0 (Low) und 1 (High) wechselt. Es wird meist `clk` genannt und legt fest, wann getaktete Register neue Werte übernehmen.

- **Steigende Flanke (`posedge`):** Wechsel von 0 auf 1.
- **Fallende Flanke (`negedge`):** Wechsel von 1 auf 0.

Ein Register mit steigender Taktflanke übernimmt den Eingang genau an dieser Flanke. Zwischen den Flanken hält es den gespeicherten Wert. Ein High-Pegel allein löst keine weitere Übernahme aus. Kombinatorische Logik benötigt dagegen keinen Takt.

**Beispiel:** Der dargestellte Takt besitzt eine Periodendauer von 10 ns.

![Taktsignal mit steigender und fallender Flanke sowie Periodendauer](/Kurse/ES1/images/generated/clock.png)

Die **Periodendauer T** ist der Abstand zwischen zwei aufeinanderfolgenden steigenden Flanken. Die **Frequenz f** gibt die Anzahl vollständiger Perioden pro Sekunde an: **f = 1 / T**.

Im Beispiel entsprechen **10 ns einer Frequenz von 100 MHz**. Die dargestellte High- und Low-Phase dauern jeweils 5 ns.

Die Eingangsdaten müssen bereits kurz vor der übernehmenden Flanke stabil sein und kurz danach stabil bleiben. In den Testbenches werden sie deshalb an der fallenden Flanke geändert und nach der folgenden steigenden Flanke geprüft. Der nächste Abschnitt zeigt die zugehörige Beschreibung mit `always_ff`.

---

<!--
lesson_id: 606
lesson_title: "6.4 Sensitivitätsliste und Blocktypen"
difficulty: "beginner"
duration_min: 10
type: "theory"
-->

### 6.4 Sensitivitätsliste und Blocktypen

Die **Sensitivitätsliste** legt fest, welches Ereignis die Auswertung eines Blocks auslöst. Ein Ereignis kann eine Signaländerung oder eine Taktflanke sein.

#### Kombinatorisch: always_comb

Bei `always_comb` wird die Sensitivität automatisch aus den gelesenen Signalen bestimmt. Ändert sich eines dieser Signale, wird das Ergebnis neu berechnet. Der Block wird auch zu Beginn der Simulation einmal ausgewertet.

**Beispiel aus dem bisherigen Tutorial:** Der Ausgang folgt dem Eingang ohne Takt.

```verilog
module module_comb(
    input logic signal_in,
    output logic signal_out
);

always_comb begin
    signal_out = signal_in;
end

endmodule
```

In älterem Verilog steht dafür häufig `always @(*)`. Das Sternchen bestimmt die Sensitivität automatisch; im Tutorial wird die SystemVerilog-Form `always_comb` verwendet. Eine ausgeschriebene Liste wie `always @(a or b)` müsste alle relevanten Signale enthalten.

#### Getaktet: always_ff

Ein **Flip-Flop** übernimmt seinen Eingang an einer Taktflanke und hält den Wert dazwischen. `posedge clk` bezeichnet den Wechsel des Takts von 0 auf 1.

**Beispiel aus dem bisherigen Tutorial:** Ein Bit wird bei jeder steigenden Taktflanke gespeichert.

```verilog
module module_always_ff(
    input logic clk,
    input logic signal_in,
    output logic signal_out
);

logic signal_indirect;

always_ff @(posedge clk) begin
    signal_indirect <= signal_in;
end

assign signal_out = signal_indirect;

endmodule
```

Liegt `signal_in = 1` an der steigenden Flanke an, wird 1 gespeichert. Eine Änderung des Eingangs danach beeinflusst den Ausgang erst bei der nächsten steigenden Flanke. Ein definierter Anfangswert wird in diesem Beispiel nicht vorausgesetzt.

Getaktete Register werden mit **nichtblockierenden Zuweisungen** (`<=`) beschrieben: Die rechten Seiten werden an der Flanke ausgewertet; die Register werden anschließend aktualisiert. Bei mehreren Registerzuweisungen im selben Block werden deshalb noch die bisherigen Registerwerte gelesen.

| Blocktyp | Auslöser | Zuweisung in den Beispielen | Verhalten |
|----------|----------|----------------------------|-----------|
| `always_comb` | Änderung gelesener Signale | `=` | Ergebnis neu berechnen |
| `always_ff @(posedge clk)` | Steigende Taktflanke | `<=` | Wert übernehmen und halten |

Ein Signal wird nur von einem Block beziehungsweise einer kontinuierlichen Zuweisung angesteuert. `always_comb` und `always_ff` machen die beabsichtigte Hardware deutlich und ermöglichen zusätzliche Werkzeugprüfungen.

---

<!--
lesson_id: 607
lesson_title: "6.4.a. Übung: Ein Bit speichern"
difficulty: "beginner"
duration_min: 10
type: "exercise"
-->

### 6.4.a. Übung: Ein Bit speichern

Das Modul speichert ein Eingangssignal bei jeder steigenden Taktflanke.

#### Schnittstelle

| Port | Richtung | Typ | Beschreibung |
|------|----------|-----|--------------|
| `clk` | `input` | `logic` | Takt zur Datenübernahme |
| `signal_in` | `input` | `logic` | Zu speicherndes Bit |
| `signal_out` | `output` | `logic` | Zuletzt übernommener Wert |

#### Verhalten

- An jeder steigenden Flanke von `clk` wird `signal_in` nach `signal_out` übernommen.
- Zwischen den steigenden Flanken bleibt `signal_out` unverändert.
- Der Wert vor der ersten Datenübernahme wird nicht geprüft.

#### Realisierung

- `always_ff @(posedge clk)` mit `begin` und `end` verwenden.
- Den Ausgang mit der nichtblockierenden Zuweisung `<=` beschreiben.
- Kein `assign` und keinen kombinatorischen Block für den Ausgang verwenden.

**EXERCISE_START**
```verilog
module module_procedural_register(
    input logic clk,
    input logic signal_in,
    output logic signal_out
);

always_ff @(posedge clk) begin
    // Eingangswert speichern
end

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_procedural_register(
    input logic clk,
    input logic signal_in,
    output logic signal_out
);

always_ff @(posedge clk) begin
    signal_out <= signal_in;
end

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_procedural_register;

localparam integer VALUE_WIDTH = 1;
localparam time WATCHDOG_TIME = 90;

// BEGIN TEST HELPERS
// Wird für HDLab direkt in jede Testbench eingebettet (keine Includes nötig).
// VALUE_WIDTH und WATCHDOG_TIME werden in der jeweiligen Testbench festgelegt.
integer tests_run = 0;
integer tests_passed = 0;
bit all_passed = 1'b1;

function automatic string bit_string(
    input logic [VALUE_WIDTH-1:0] value,
    input integer width
);
    string result;
    result = "";
    for (integer i = width - 1; i >= 0; i = i - 1)
        result = {result, $sformatf("%b", value[i])};
    return result;
endfunction

function automatic bit report_check(
    input bit passed,
    input string description,
    input string details
);
    tests_run = tests_run + 1;
    if (passed) begin
        tests_passed = tests_passed + 1;
        $display("✅ PASS %0d: %s", tests_run, description);
    end
    else begin
        $display("❌ FAIL %0d: %s", tests_run, description);
        $display("   %s", details);
    end
    return passed;
endfunction

function automatic bit assert_equal(
    input logic [VALUE_WIDTH-1:0] actual,
    input logic [VALUE_WIDTH-1:0] expected,
    input string description,
    input integer width = VALUE_WIDTH
);
    return report_check(actual === expected, description,
        $sformatf("Erwartet: %s (unsigned %0d); erhalten: %s (unsigned %0d)",
                  bit_string(expected, width), expected,
                  bit_string(actual, width), actual));
endfunction

function automatic bit assert_equal_signed(
    input logic signed [VALUE_WIDTH-1:0] actual,
    input logic signed [VALUE_WIDTH-1:0] expected,
    input string description
);
    return report_check(actual === expected, description,
        $sformatf("Erwartet: %0d (Bits %b); erhalten: %0d (Bits %b)",
                  expected, expected, actual, actual));
endfunction

function automatic bit assert_true(
    input logic condition,
    input string description
);
    return report_check(condition === 1'b1, description,
        $sformatf("Erwartet: wahr (1); erhalten: %b", condition));
endfunction

task automatic finish_tests;
    // Ohne ausgeführte Prüfungen darf eine Testbench nicht bestehen.
    all_passed = all_passed & (tests_run > 0) & (tests_run == tests_passed);
    $display("\nErgebnis: %0d von %0d Prüfungen bestanden.", tests_passed, tests_run);
    if (all_passed)
        $display("✅ PASS Gesamtergebnis");
    else
        $display("❌ FAIL Gesamtergebnis");
    // Maschinenlesbares Gesamtergebnis für die bestehende HDLab-Auswertung.
    $display("TEST_SOLVED=%b", all_passed);
    $finish;
endtask

initial begin : watchdog
    #WATCHDOG_TIME;
    $display("❌ FAIL Timeout: Testbench nach %0t nicht beendet.", $time);
    all_passed = 1'b0;
    finish_tests();
end
// END TEST HELPERS

//------------------------------------------------------------------------ //

localparam time CLOCK_PERIOD = 10;
logic clk = 1'b0;
logic signal_in = 1'b0;
logic signal_out;

module_procedural_register dut (
    .clk(clk),
    .signal_in(signal_in),
    .signal_out(signal_out)
);

always #(CLOCK_PERIOD / 2) clk = ~clk;

// Nach der Taktflanke warten, bis nichtblockierende Zuweisungen wirksam sind.
task automatic tick;
    @(posedge clk);
    #1;
endtask

initial begin
    // Kein Anfangswert des DUT wird vorausgesetzt.
    @(negedge clk);
    signal_in = 1'b1;
    tick();
    all_passed &= assert_equal(signal_out, 1'b1, "Steigende Flanke übernimmt High");

    @(negedge clk);
    signal_in = 1'b0;
    #1;
    all_passed &= assert_equal(signal_out, 1'b1, "Eingangsänderung zwischen Flanken: High bleibt gespeichert");
    tick();
    all_passed &= assert_equal(signal_out, 1'b0, "Nächste steigende Flanke übernimmt Low");

    @(negedge clk);
    signal_in = 1'b1;
    #1;
    all_passed &= assert_equal(signal_out, 1'b0, "Fallende Flanke und neuer Eingang verändern das Register nicht");
    tick();
    all_passed &= assert_equal(signal_out, 1'b1, "Weitere steigende Flanke übernimmt wieder High");
    finish_tests();
end
endmodule
```
**TESTBENCH_END**

---

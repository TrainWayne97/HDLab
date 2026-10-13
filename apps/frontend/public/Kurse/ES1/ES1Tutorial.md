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
    - [Vom Bit zur Zahl](#vom-bit-zur-zahl)
    - [Stellenwerte: Dezimal und binär](#stellenwerte-dezimal-und-binär)
    - [Eine Dezimalzahl binär darstellen](#eine-dezimalzahl-binär-darstellen)
    - [Bitbreite und Wertebereich](#bitbreite-und-wertebereich)
    - [Hexadezimal: Eine kompakte Schreibweise](#hexadezimal-eine-kompakte-schreibweise)
    - [Zahlenkonstanten in SystemVerilog](#zahlenkonstanten-in-systemverilog)
  - [1.2. Übung: Zahlen darstellen](#12-übung-zahlen-darstellen)
    - [Schnittstelle](#schnittstelle)
    - [Verhalten](#verhalten)
    - [Realisierung](#realisierung)
  - [1.3 Logische Gatter und Wahrheitstabelle](#13-logische-gatter-und-wahrheitstabelle)
  - [1.4. Übung: NAND](#14-übung-nand)
    - [Schnittstelle](#schnittstelle-1)
    - [Verhalten](#verhalten-1)
    - [Realisierung](#realisierung-1)
  - [1.5 Zweierkomplement und vorzeichenbehaftete Zahlen](#15-zweierkomplement-und-vorzeichenbehaftete-zahlen)
    - [Dasselbe Bitmuster, unterschiedliche Zahlenwerte](#dasselbe-bitmuster-unterschiedliche-zahlenwerte)
    - [Stellenwerte im Zweierkomplement](#stellenwerte-im-zweierkomplement)
    - [Wertebereich und Bitbreite](#wertebereich-und-bitbreite)
    - [Eine negative Zahl bilden](#eine-negative-zahl-bilden)
    - [Addition und Überlauf](#addition-und-überlauf)
    - [Signed-Werte in SystemVerilog](#signed-werte-in-systemverilog)
    - [Eine negative Zahl auf mehr Bits erweitern](#eine-negative-zahl-auf-mehr-bits-erweitern)
  - [1.6. Übung: Vorzeichen](#16-übung-vorzeichen)
    - [Schnittstelle](#schnittstelle-2)
    - [Verhalten](#verhalten-2)
    - [Realisierung](#realisierung-2)
- [2. Entities und Module](#2-entities-und-module)
  - [2.1 Aufbau einer Komponente](#21-aufbau-einer-komponente)
  - [2.2. Übung: Assign](#22-übung-assign)
    - [Schnittstelle](#schnittstelle-3)
    - [Verhalten](#verhalten-3)
    - [Realisierung](#realisierung-3)
  - [2.3 Ein Interface, mehrere Implementierungen](#23-ein-interface-mehrere-implementierungen)
  - [2.4. Übung: Alternative Implementierung](#24-übung-alternative-implementierung)
    - [Schnittstelle](#schnittstelle-4)
    - [Verhalten](#verhalten-4)
    - [Realisierung](#realisierung-4)
  - [2.5 Port-Richtungen](#25-port-richtungen)
  - [2.6. Übung: Port-Richtungen](#26-übung-port-richtungen)
    - [Schnittstelle](#schnittstelle-5)
    - [Verhalten](#verhalten-5)
    - [Realisierung](#realisierung-5)
- [3. Signale und Datentypen](#3-signale-und-datentypen)
  - [3.1 Signale und logische Typen](#31-signale-und-logische-typen)
  - [3.2. Übung: Internes Signal](#32-übung-internes-signal)
    - [Schnittstelle](#schnittstelle-6)
    - [Verhalten](#verhalten-6)
    - [Realisierung](#realisierung-6)
  - [3.3 Vektoren und Bit-Indizierung](#33-vektoren-und-bit-indizierung)
  - [3.4. Übung: Bitselektion](#34-übung-bitselektion)
    - [Schnittstelle](#schnittstelle-7)
    - [Verhalten](#verhalten-7)
    - [Realisierung](#realisierung-7)
  - [3.5 Numerische Typen und Konstanten](#35-numerische-typen-und-konstanten)
  - [3.6. Übung: Numerische Konstanten](#36-übung-numerische-konstanten)
    - [Schnittstelle](#schnittstelle-8)
    - [Verhalten](#verhalten-8)
    - [Realisierung](#realisierung-8)
- [4. Operatoren und Ausdrücke](#4-operatoren-und-ausdrücke)
  - [4.1 Bitweise und logische Operatoren](#41-bitweise-und-logische-operatoren)
  - [4.2. Übung: Bitweise und logisch](#42-übung-bitweise-und-logisch)
    - [Schnittstelle](#schnittstelle-9)
    - [Verhalten](#verhalten-9)
    - [Realisierung](#realisierung-9)
  - [4.3 Konkatenation und Replikation](#43-konkatenation-und-replikation)
  - [4.4. Übung: Zusammensetzen und wiederholen](#44-übung-zusammensetzen-und-wiederholen)
    - [Schnittstelle](#schnittstelle-10)
    - [Verhalten](#verhalten-10)
    - [Realisierung](#realisierung-10)
  - [4.5 Arithmetische und relationale Operatoren](#45-arithmetische-und-relationale-operatoren)
  - [4.6. Übung: Summe und Vergleich](#46-übung-summe-und-vergleich)
    - [Schnittstelle](#schnittstelle-11)
    - [Verhalten](#verhalten-11)
    - [Realisierung](#realisierung-11)
- [5. Kontinuierliche und bedingte Zuweisungen](#5-kontinuierliche-und-bedingte-zuweisungen)
  - [5.1 Kontinuierliche Zuweisung (assign)](#51-kontinuierliche-zuweisung-assign)
  - [5.2. Übung: Paritätsgenerator](#52-übung-paritätsgenerator)
    - [Schnittstelle](#schnittstelle-12)
    - [Verhalten](#verhalten-12)
    - [Realisierung](#realisierung-12)
  - [5.3 Bedingte Zuweisungen](#53-bedingte-zuweisungen)
  - [5.4. Übung: Lüfterstufe auswählen](#54-übung-lüfterstufe-auswählen)
    - [Schnittstelle](#schnittstelle-13)
    - [Verhalten](#verhalten-13)
    - [Realisierung](#realisierung-13)

---

<!--
lesson_id: 001
lesson_title: "0.1 Ziel"
difficulty: "intro"
duration_min: 5
type: "theory"
-->

### 0.1 Ziel

Im Kurs entsteht auf dem **Basys3-Board** ein **RISC-V-Prozessorsystem** als **System-on-Chip (SoC)**. Das System verbindet einen Prozessor mit Speicher und weiteren Hardwaremodulen auf dem FPGA. Ziel ist der Entwurf eines **Gaming-Systems**, das im Verlauf des Kurses schrittweise um zusätzliche Module erweitert wird. Diese Module werden mit einer Hardwarebeschreibungssprache (HDL), hier SystemVerilog, beschrieben und in das SoC integriert.

Das Verilog-Tutorial dient dazu, die Sprache und ihre grundlegenden Entwurfsmethoden zu erlernen. Die Lektionen, Beispiele und Übungen in HDLab schaffen die Grundlage für die Entwicklung der Module des Gaming-Systems.

![Basys3-FPGA-Board von Digilent](/Kurse/ES1/images/basys3.png)

*Basys3-Board als Hardwareplattform für das Gaming-System.*

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

Verilog ist eine **Hardware Description Language (HDL)**. Wir beschreiben digitale Schaltungen: ihre Verbindungen, ihre kombinatorische Logik und ihre Speicher. Anders als bei einem Programm für eine CPU arbeiten mehrere Teile einer Schaltung gleichzeitig.

**SystemVerilog** erweitert Verilog unter anderem um Datentypen wie `logic` und Sprachmittel wie `always_comb` und `always_ff`. Es bietet außerdem Möglichkeiten zur Verifikation. Nicht jedes Sprachmittel lässt sich in Hardware umsetzen.

In diesem Tutorial verwenden wir SystemVerilog. Die Codeblöcke sind aus Kompatibilitätsgründen mit HDLab weiterhin als `verilog` markiert.


**Beispiel:** Dieses Modul beschreibt ein AND-Gatter. Die beiden Eingänge werden gleichzeitig verknüpft.

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

Ein **FPGA (Field Programmable Gate Array)** ist ein Chip mit konfigurierbaren Logik- und Speicherbausteinen sowie Verbindungen zwischen ihnen. Seine Konfiguration bestimmt, welche digitale Schaltung entsteht.

- **Look-up Tables (LUTs)** bilden logische Funktionen ab.
- **Flip-Flops** speichern einzelne Bits.
- **Block-RAM** speichert größere Datenmengen.
- **DSP-Blöcke** unterstützen beispielsweise Multiplikationen und Additionen.
- Das **Routing** verbindet die Bausteine; Ein- und Ausgangsblöcke verbinden sie mit den Pins.

**Aufbau des Chips**

Die konfigurierbaren Logikblöcke (**Configurable Logic Blocks, CLBs**) bilden die Grundstruktur der programmierbaren Logik. **I/O-Blöcke (IOBs)** verbinden interne Signale mit den Pins des Chips. Programmierbare Routingkanäle und Schaltstellen verbinden die Blöcke untereinander.

![Vereinfachte FPGA-Chipstruktur mit CLBs, I/O-Blöcken und Routing](/Kurse/ES1/images/generated/fpga-overview.png)

*Vereinfachte Strukturübersicht. Zusätzliche Ressourcen wie Block-RAM, DSP-Blöcke und das Taktnetz sind nicht dargestellt; die Anordnung ist kein maßstabsgetreuer Chipplan.*

**Ein CLB im Detail**

Beim Artix-7-FPGA des Basys3 besteht ein CLB aus zwei **Slices**. Jeder Slice enthält vier 6-Eingangs-LUTs, acht Flip-Flops sowie Multiplexer und Carry-Logik für arithmetische Funktionen.

![CLB mit zwei Slices und vereinfachtem Signalpfad aus LUT, Flip-Flop und Multiplexer](/Kurse/ES1/images/generated/clb-detail.png)

Die LUT erzeugt einen Wert aus den aktuellen Eingängen. Ein Flip-Flop kann diesen Wert an einer Taktflanke speichern. Der dargestellte Multiplexer wählt zwischen dem direkten und dem gespeicherten Ergebnis. Seine Auswahl wird durch die FPGA-Konfiguration festgelegt. Das Diagramm zeigt einen vereinfachten Signalpfad; die tatsächliche Verschaltung enthält weitere Ressourcen und Auswahlmöglichkeiten.

Eigene schematische Darstellungen. Fachliche Grundlage: [AMD – 7 Series FPGAs Configurable Logic Block User Guide (UG474), CLB Overview](https://docs.amd.com/r/en-US/ug474_7Series_CLB/CLB-Overview). Eine weitere beispielhafte CLB-Schaltung zeigt [Wikipedia – Configurable Logic Block](https://de.wikipedia.org/wiki/Configurable_Logic_Block#/media/Datei:FPGA_cell_example.png).

HDLab ermöglicht zunächst die Simulation einer Hardwarebeschreibung. Für den Einsatz auf einem FPGA werden anschließend Werkzeuge benötigt, die sie in eine passende Konfiguration umsetzen.


**Beispiel:** Die Funktion `y = a & b` kann auf einem FPGA durch eine LUT abgebildet werden. Sie liefert nur für die Eingangskombination `a = 1`, `b = 1` eine 1. Wird eine LED an den Ausgang angeschlossen, leuchtet sie bei dieser Kombination.

---

<!--
lesson_id: 004
lesson_title: "0.4 Synthese"
difficulty: "intro"
duration_min: 5
type: "theory"
-->

### 0.4 Synthese

Bei der **Simulation** prüfen wir, wie sich eine Hardwarebeschreibung bei vorgegebenen Eingängen verhält. Eine **Testbench** erzeugt diese Eingänge und vergleicht die Ausgänge mit den erwarteten Werten.

Bei der **Synthese** übersetzt ein Werkzeug den synthetisierbaren Teil der Beschreibung in ein Netz aus Logik und Speichern. Danach werden die Bausteine auf dem FPGA platziert und verbunden; daraus entsteht die Konfiguration für den Chip.

Eine Beschreibung kann sich simulieren lassen, ohne synthetisierbar zu sein. Beispielsweise dienen `#1` und `$display` in unseren Testbenches der Simulation und gehören nicht in die zu synthetisierende Schaltung.

Wir unterscheiden **kombinatorische Logik**, deren Ausgänge von den aktuellen Eingängen abhängen, und **sequentielle Logik**, die einen Zustand speichert. Die ersten Übungen behandeln kombinatorische Logik.


**Beispiel:** Die kontinuierliche Zuweisung im folgenden Modul kann als AND-Funktion synthetisiert werden. In der Simulation ergibt `a = 1`, `b = 0` den Ausgang `y = 0`.

```verilog
module module_synthesis_and(
    input logic a,
    input logic b,
    output logic y
);

assign y = a & b;

endmodule
```

Eine Testbench könnte nach dem Setzen der Eingänge mit `#1` warten und mit `$display` den Ausgang anzeigen. Diese Testanweisungen beschreiben keine Teile des AND-Gatters.

---

<!--
lesson_id: 100
lesson_title: "1. Digitale Grundlagen"
difficulty: "intro"
duration_min: 1
type: "theory"
-->

## 1. Digitale Grundlagen

Wir lernen, wie Bits Zahlen darstellen und wie logische Gatter sie verknüpfen. Nach jeder Lektion folgt eine einfache Übung. Die Modulrahmen sind zunächst vorgegeben; ihren Aufbau lernen wir in Kapitel 2.


**Beispiel:** Das Bitmuster `1010` stellt unsigned die Dezimalzahl 10 dar. Ein AND-Gatter liefert für die Eingänge 1 und 0 den Ausgang 0.

---

<!--
lesson_id: 101
lesson_title: "1.1 Binär und Hexadezimal"
difficulty: "intro"
duration_min: 15
type: "theory"
-->

### 1.1 Binär und Hexadezimal

Digitale Schaltungen verarbeiten Bitmuster. Um damit Zahlen darzustellen, müssen die einzelnen Bits eine festgelegte Bedeutung erhalten. Diese Lektion behandelt zunächst **vorzeichenlose ganze Zahlen**. Negative Zahlen folgen in Lektion 1.5.

#### Vom Bit zur Zahl

Ein **Bit** kann den Wert 0 oder 1 annehmen. Mehrere Bits bilden ein Bitmuster. Mit vier Bits gibt es beispielsweise 16 verschiedene Muster, von `0000` bis `1111`.

Ein Bitmuster ist zunächst eine Folge von Nullen und Einsen. Seine Interpretation legt fest, ob es beispielsweise eine Zahl, mehrere Schalterzustände oder einen anderen Wert beschreibt. Für die folgenden Beispiele wird es als vorzeichenlose Binärzahl interpretiert.

#### Stellenwerte: Dezimal und binär

Im **Dezimalsystem** gibt es zehn Ziffern: 0 bis 9. Von rechts nach links besitzen die Stellen die Gewichte 1, 10, 100 und so weiter. Beispielsweise bedeutet die Dezimalzahl 205:

**205 = 2 × 100 + 0 × 10 + 5 × 1.**

Das **Binärsystem** funktioniert nach demselben Prinzip, verwendet aber nur die Ziffern 0 und 1. Die Stellengewichte sind Potenzen von 2: **1, 2, 4, 8, 16, …**. Jede Stelle links hat das doppelte Gewicht ihrer rechten Nachbarstelle.

**Beispiel: Das Bitmuster `1101`**

| Bitposition | 3 | 2 | 1 | 0 |
|-------------|---|---|---|---|
| Stellengewicht | 8 | 4 | 2 | 1 |
| Bitwert | 1 | 1 | 0 | 1 |
| Beitrag zum Zahlenwert | 8 | 4 | 0 | 1 |

Der Zahlenwert ergibt sich durch Addieren der Beiträge:

**(1101)₂ = 1 × 8 + 1 × 4 + 0 × 2 + 1 × 1 = (13)₁₀.**

Die tiefgestellte 2 beziehungsweise 10 kennzeichnet die Zahlenbasis. Ohne Kennzeichnung sind Zahlen im erklärenden Text dezimal gemeint. Eine Bitfolge wird ausdrücklich als Bitmuster oder Binärzahl bezeichnet.

Die Bitpositionen werden hier von rechts beginnend mit 0 gezählt. Das rechte Bit hat das kleinste Stellengewicht und heißt **Least Significant Bit (LSB)**. Das linke Bit hat das größte Stellengewicht und heißt **Most Significant Bit (MSB)**.

#### Eine Dezimalzahl binär darstellen

Eine vorzeichenlose Zahl lässt sich in passende Zweierpotenzen zerlegen. Dazu wird jeweils das größte noch passende Stellengewicht abgezogen.

**Beispiel: 13 als Binärzahl mit vier Bits**

1. 8 passt in 13: Bit 3 wird 1; Rest 5.
2. 4 passt in 5: Bit 2 wird 1; Rest 1.
3. 2 passt nicht in 1: Bit 1 wird 0; Rest bleibt 1.
4. 1 passt in 1: Bit 0 wird 1; Rest 0.

Das Ergebnis ist `1101`. Führende Nullen verändern den Zahlenwert nicht: `0000_1101` stellt ebenfalls 13 dar, besitzt aber acht statt vier Bits.

#### Bitbreite und Wertebereich

Mit **n Bits** gibt es **2ⁿ verschiedene Bitmuster**. Als vorzeichenlose ganze Zahlen stellen sie den Bereich **0 bis 2ⁿ − 1** dar.

| Bitbreite | Anzahl der Bitmuster | Vorzeichenloser Wertebereich |
|-----------|---------------------|-----------------------------|
| 1 Bit | 2 | 0 bis 1 |
| 4 Bit | 16 | 0 bis 15 |
| 8 Bit | 256 | 0 bis 255 |

Die Zahl 16 benötigt mindestens fünf Bits: `10000`. Sie passt nicht in vier Bits. **Zahlenwert und Bitbreite sind deshalb getrennt zu betrachten.**

#### Hexadezimal: Eine kompakte Schreibweise

Das **Hexadezimalsystem** verwendet die Basis 16. Seine Ziffern sind 0 bis 9 und A bis F. Die Buchstaben stehen für die Werte 10 bis 15.

Da **16 = 2⁴** gilt, entspricht jede Hexadezimalziffer genau einem Block aus vier Bits:

| Vier Bits | Dezimalwert | Hexadezimalziffer |
|-----------|-------------|------------------|
| `0000` | 0 | 0 |
| `0001` | 1 | 1 |
| `0010` | 2 | 2 |
| `0011` | 3 | 3 |
| `0100` | 4 | 4 |
| `0101` | 5 | 5 |
| `0110` | 6 | 6 |
| `0111` | 7 | 7 |
| `1000` | 8 | 8 |
| `1001` | 9 | 9 |
| `1010` | 10 | A |
| `1011` | 11 | B |
| `1100` | 12 | C |
| `1101` | 13 | D |
| `1110` | 14 | E |
| `1111` | 15 | F |

Zur Umwandlung wird eine Binärzahl **von rechts aus in Vierergruppen** aufgeteilt. Eine unvollständige Gruppe links wird für die Darstellung mit führenden Nullen ergänzt. Anschließend wird jede Gruppe durch ihre Hexadezimalziffer ersetzt.

**Beispiel:** Aus `10_1101` wird zunächst `0010_1101`. Die Gruppen `0010` und `1101` entsprechen 2 und D. Damit gilt:

**(0010_1101)₂ = (2D)₁₆ = (45)₁₀.**

Auch hexadezimale Stellen besitzen Gewichte: von rechts nach links 1, 16, 256 und so weiter. Daher ergibt `2D` den Wert **2 × 16 + 13 × 1 = 45**.

Binär, dezimal und hexadezimal sind unterschiedliche Schreibweisen derselben Zahl. Die Hexadezimaldarstellung verändert weder den Zahlenwert noch die Hardware.

#### Zahlenkonstanten in SystemVerilog

Für die folgenden Übungen werden Zahlenkonstanten mit expliziter Bitbreite verwendet. Ihre Schreibweise lautet:

**`Bitbreite'BasisWert`**

- **Bitbreite:** Anzahl der Bits, immer als Dezimalzahl angegeben.
- **Apostroph:** trennt die Bitbreite von der Basisangabe.
- **Basis:** `b` für binär, `h` für hexadezimal oder `d` für dezimal.
- **Wert:** Ziffern in der gewählten Zahlenbasis.

| Konstante | Bitbreite | Zahlenbasis | Dezimalwert | Bitmuster |
|-----------|-----------|-------------|-------------|-----------|
| `8'b0010_1101` | 8 Bit | Binär | 45 | `0010_1101` |
| `8'h2D` | 8 Bit | Hexadezimal | 45 | `0010_1101` |
| `8'd45` | 8 Bit | Dezimal | 45 | `0010_1101` |

Unterstriche dienen der Lesbarkeit und verändern den Wert nicht. Die `8` vor dem Apostroph bezeichnet in allen drei Fällen die **Anzahl der Bits**. Ein zugehöriger Vektor hat den Indexbereich `[7:0]`: acht Bits mit den Positionen 7 bis 0.

**Beispiel:** Die folgenden Zuweisungen liefern dasselbe 8-Bit-Muster an drei Ausgängen. Der Modulrahmen wird in Kapitel 2 erläutert.

```verilog
module module_number_formats(
    output logic [7:0] binary_out,
    output logic [7:0] hex_out,
    output logic [7:0] decimal_out
);

assign binary_out  = 8'b0010_1101;
assign hex_out     = 8'h2D;
assign decimal_out = 8'd45;

endmodule
```

Die Ausgänge besitzen keine eigene Zahlenbasis. Nur die Schreibweise der Konstanten im Quelltext unterscheidet sich; alle drei Ausgänge liefern dieselben Bits. Der Wert einer Konstante muss in die angegebene Bitbreite passen, damit keine höchstwertigen Bits verloren gehen.

---

<!--
lesson_id: 102
lesson_title: "1.2. Übung: Zahlen darstellen"
difficulty: "intro"
duration_min: 10
type: "exercise"
-->

### 1.2. Übung: Zahlen darstellen

Das Modul stellt dieselbe Zahl in drei Schreibweisen bereit.

#### Schnittstelle

| Port | Richtung | Typ | Beschreibung |
|------|----------|-----|--------------|
| `binary_out` | `output` | `logic [3:0]` | Binär dargestellter Wert |
| `hex_out` | `output` | `logic [3:0]` | Hexadezimal dargestellter Wert |
| `decimal_out` | `output` | `logic [3:0]` | Dezimal dargestellter Wert |

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
module tb_module_numbers #(
    parameter integer TEST_LENGTH = 1,
    parameter integer TEST_WIDTH = 12
) (
    output logic [TEST_WIDTH-1:0] test_array [TEST_LENGTH],
    output logic test_solved [TEST_LENGTH]
);

logic [3:0] binary_out, hex_out, decimal_out;

module_numbers dut (
    .binary_out(binary_out),
    .hex_out(hex_out),
    .decimal_out(decimal_out)
);

initial begin
    for (int i = 0; i < TEST_LENGTH; i = i + 1) begin
        // Die Ausgänge sind konstant.
        #1;
        test_array[i] = {decimal_out, hex_out, binary_out};
        test_solved[i] = (binary_out === 4'b1010 && hex_out === 4'b1010 && decimal_out === 4'b1010);
        $display("Test %0d | Daten: %b | Solved? %s", i, test_array[i],
                 test_solved[i] ? "✅" : "❌");
    end
    $finish;
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
lesson_title: "1.4. Übung: NAND"
difficulty: "intro"
duration_min: 10
type: "exercise"
-->

### 1.4. Übung: NAND

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
module tb_module_nand #(
    parameter integer TEST_LENGTH = 4,
    parameter integer TEST_WIDTH = 3
) (
    output logic [TEST_WIDTH-1:0] test_array [TEST_LENGTH],
    output logic test_solved [TEST_LENGTH]
);

logic signal_a, signal_b, signal_out;
logic expected;

int length;

module_nand dut (
    .signal_a_in(signal_a),
    .signal_b_in(signal_b),
    .signal_a_nand_b_out(signal_out)
);

initial begin
    for (length = 0; length < TEST_LENGTH; length = length + 1) begin
        signal_a = length[0];
        signal_b = length[1];

        #1;

        test_array[length][0] = signal_a;
        test_array[length][1] = signal_b;
        test_array[length][2] = signal_out;
        expected = ~(signal_a & signal_b);
        test_solved[length] = (signal_out === expected);

        #1;
    end
    $display("\n");
    $display("==================================================");
    $display("| signal_a | signal_b | signal_out |   Solved?   |");
    $display("==================================================");

    for (int i = 0; i < TEST_LENGTH; i = i + 1) begin
        $display("|     %b    |     %b    |      %b     |      %s      |",
            test_array[i][0], // signal_a_in
            test_array[i][1], // signal_b_in
            test_array[i][2], // signal_a_nand_b_out
            test_solved[i] ? "✅" : "❌"
        );
    end
    $display("==================================================\n");
    $finish;
end
endmodule
```
**TESTBENCH_END**

---

<!--
lesson_id: 105
lesson_title: "1.5 Zweierkomplement und vorzeichenbehaftete Zahlen"
difficulty: "intro"
duration_min: 15
type: "theory"
-->

### 1.5 Zweierkomplement und vorzeichenbehaftete Zahlen

Lektion 1.1 behandelt vorzeichenlose Zahlen. Mit vier Bits lassen sich dabei die Werte 0 bis 15 darstellen. Für negative Zahlen ist eine andere Interpretation derselben Bitmuster erforderlich. SystemVerilog verwendet für die hier betrachteten vorzeichenbehafteten Ganzzahlen das **Zweierkomplement**.

#### Dasselbe Bitmuster, unterschiedliche Zahlenwerte

**Unsigned** bedeutet vorzeichenlos, **signed** bedeutet vorzeichenbehaftet. Die Bits selbst ändern sich durch diese Interpretation nicht.

| Bitmuster mit 4 Bit | Unsigned | Signed im Zweierkomplement |
|--------------------|----------|----------------------------|
| `0000` | 0 | 0 |
| `0011` | 3 | 3 |
| `0111` | 7 | 7 |
| `1000` | 8 | −8 |
| `1101` | 13 | −3 |
| `1111` | 15 | −1 |

Bei einem höchstwertigen Bit von 0 stimmen beide Interpretationen überein. Bei einem höchstwertigen Bit von 1 ist die vorzeichenbehaftete Zahl negativ.

#### Stellenwerte im Zweierkomplement

Im Zweierkomplement besitzt das höchstwertige Bit ein **negatives Stellengewicht**. Die übrigen Stellen behalten ihre positiven Gewichte. Für vier Bits ergibt sich:

| Bitposition | 3 | 2 | 1 | 0 |
|-------------|---|---|---|---|
| Unsigned-Stellengewicht | +8 | +4 | +2 | +1 |
| Signed-Stellengewicht | −8 | +4 | +2 | +1 |

**Beispiel: `1101` als vorzeichenbehaftete Zahl**

**1 × (−8) + 1 × 4 + 0 × 2 + 1 × 1 = −3.**

Unsigned ergibt dasselbe Bitmuster dagegen **8 + 4 + 1 = 13**. Das höchste Bit kennzeichnet somit das Vorzeichen, ist aber kein separat angehängtes Minuszeichen. `1101` bedeutet im Zweierkomplement nicht „minus 5“.

#### Wertebereich und Bitbreite

Mit n Bits gibt es weiterhin 2ⁿ Bitmuster. Im Zweierkomplement werden diese auf negative und nichtnegative Zahlen aufgeteilt. Der Wertebereich reicht von **−2ⁿ⁻¹ bis 2ⁿ⁻¹ − 1**.

| Bitbreite | Unsigned-Wertebereich | Signed-Wertebereich |
|-----------|----------------------|--------------------|
| 4 Bit | 0 bis 15 | −8 bis +7 |
| 8 Bit | 0 bis 255 | −128 bis +127 |

Der signed-Bereich ist asymmetrisch: Die Null gehört zu den nichtnegativen Werten. Deshalb gibt es einen negativen Wert mehr als positive Werte. Bei vier Bits kann −8 dargestellt werden, +8 dagegen nicht.

**Beispiel:** Die Zahl 9 passt in vier unsigned Bits (`1001`), benötigt aber mindestens fünf signed Bits (`01001`). Als signed 4-Bit-Wert bedeutet `1001` stattdessen −7.

#### Eine negative Zahl bilden

Das Bitmuster für eine negative Zahl entsteht, indem die Bits der entsprechenden positiven Zahl **invertiert** werden und anschließend **1 addiert** wird. Dabei bleibt die Bitbreite fest.

**Beispiel: −3 mit vier Bits**

| Schritt | Bitmuster |
|---------|-----------|
| +3 mit vier Bits darstellen | `0011` |
| Alle vier Bits invertieren | `1100` |
| 1 addieren | `1101` |

Die Stellenwertrechnung bestätigt das Ergebnis: **−8 + 4 + 1 = −3**.

Das Verfahren funktioniert auch in umgekehrter Richtung: Aus `1101` wird durch Invertieren `0010` und durch Addieren von 1 wieder `0011`, also +3.

**Sonderfälle:** Null bleibt Null; ein Übertrag über die festgelegte Bitbreite hinaus entfällt. Der kleinste signed-Wert besitzt innerhalb derselben Bitbreite keinen positiven Gegenwert: Zu −8 gibt es bei vier signed Bits kein darstellbares +8.

#### Addition und Überlauf

Ein Vorteil des Zweierkomplements ist, dass positive und negative Zahlen mit derselben binären Addition verarbeitet werden können.

**Beispiel: 3 + (−3) mit vier Bits**

```text
  0011   (+3)
+ 1101   (−3)
------
 10000
```

Die unteren vier Bits sind `0000`, also 0. Das fünfte Bit (Übertrag) entfällt bei einem 4-Bit-Ergebnis. In diesem Beispiel ist das signed-Ergebnis korrekt.

Ein **signed-Überlauf** entsteht dagegen, wenn das mathematische Ergebnis außerhalb des signed-Wertebereichs liegt. Beispielsweise ergibt `0111 + 0001` das Bitmuster `1000`: Die gewünschte Summe +8 kann mit vier signed Bits nicht dargestellt werden; das Muster wird als −8 interpretiert. Ein Übertragsbit und ein signed-Überlauf sind deshalb nicht dasselbe.

#### Signed-Werte in SystemVerilog

Ein Signal wird durch `signed` als vorzeichenbehaftet deklariert:

```verilog
logic signed [3:0] value;
```

Bei einer Zahlenkonstante kennzeichnet ein `s` vor der Basisangabe die signed-Interpretation. Beispielsweise steht `4'sd3` für eine signed 4-Bit-Konstante mit dem Dezimalwert +3. Das Minus wird als Operator **vor die vollständige Konstante** geschrieben: `-4'sd3`.

**Beispiel:** Die folgenden drei Ausgänge liefern alle das Bitmuster `1101`. Der erste Ausgang interpretiert es als 13, die beiden signed-Ausgänge als −3.

```verilog
module module_signed_formats(
    output logic [3:0] unsigned_out,
    output logic signed [3:0] signed_out,
    output logic signed [3:0] negative_out
);

assign unsigned_out = 4'b1101;
assign signed_out   = 4'sb1101;
assign negative_out = -4'sd3;

endmodule
```

Für die Übungen müssen **Bitbreite und Vorzeicheninterpretation** sowohl bei den Signalen als auch bei den Konstanten zum gewünschten Wertebereich passen. Die Kennzeichnung `signed` vergrößert die Bitbreite nicht.

#### Eine negative Zahl auf mehr Bits erweitern

Bei einer signed-Zahl wird zur Erhaltung des Zahlenwerts das höchste Bit nach links wiederholt. Dieses Verfahren heißt **Vorzeichenerweiterung**.

**Beispiel: −3 von vier auf acht Bits erweitern**

- Vier Bits: `1101` → −8 + 4 + 1 = −3.
- Acht Bits mit Vorzeichenerweiterung: `1111_1101` → −128 + 64 + 32 + 16 + 8 + 4 + 1 = −3.
- Acht Bits mit führenden Nullen: `0000_1101` → +13.

Negative Zweierkomplementzahlen dürfen daher nicht einfach mit Nullen erweitert werden. Bei nichtnegativen signed-Zahlen ist das höchste Bit 0; die Vorzeichenerweiterung ergänzt entsprechend Nullen.

---

<!--
lesson_id: 106
lesson_title: "1.6. Übung: Vorzeichen"
difficulty: "intro"
duration_min: 10
type: "exercise"
-->

### 1.6. Übung: Vorzeichen

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
module tb_module_assign #(
    parameter integer TEST_LENGTH = 1,
    parameter integer TEST_WIDTH = 8
) (
    output logic [TEST_WIDTH-1:0] test_array [TEST_LENGTH],
    output logic test_solved [TEST_LENGTH]
);



logic [3:0] signal_out1;
logic signed [3:0] signal_out2;
logic [7:0] expected = 8'b11011001;

int length;

module_assign dut (
    .a1(signal_out1),
    .a2(signal_out2)
);

initial begin
    for (length = 0; length < TEST_LENGTH; length = length + 1) begin

        #1;

        test_array[length][3:0] = signal_out1;
        test_array[length][7:4] = signal_out2;
        test_solved[length] = ((signal_out1 === expected[3:0]) && (signal_out2 === expected[7:4]));

        #1;
    end
    $display("\n");
    $display("=======================================");
    $display("| Output a1 | Output a2 |   Solved?   |");
    $display("=======================================");

    for (int i = 0; i < TEST_LENGTH; i = i + 1) begin
        $display("|    %b     |     %b     |      %s      |",
            test_array[i][3:0], // a1
            test_array[i][7:4], // a2
            test_solved[i] ? "✅" : "❌"
        );
    end
    $display("=======================================\n");
    $finish;
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

Eine Komponente besitzt eine äußere Schnittstelle und eine innere Implementierung. Wir lernen, wie SystemVerilog beides in einem Modul beschreibt.


**Beispiel:** Ein Modul für einen Lichtschalter besitzt einen Eingang `switch_in` und einen Ausgang `led_out`. Die Portliste beschreibt die Schnittstelle; `assign led_out = switch_in;` beschreibt das Verhalten.

---

<!--
lesson_id: 201
lesson_title: "2.1 Aufbau einer Komponente"
difficulty: "intro"
duration_min: 10
type: "theory"
-->

### 2.1 Aufbau einer Komponente

Eine **Komponente** kapselt einen Teil einer Schaltung. In SystemVerilog beschreiben wir sie mit einem **Modul**. In VHDL wird die Schnittstelle als *Entity* und die Implementierung als *Architecture* beschrieben; in SystemVerilog gehören beide zum Modul.

```verilog
module module_copy(
    input logic signal_in,
    output logic signal_out
);

assign signal_out = signal_in;

endmodule
```

- `module` beginnt die Beschreibung, danach steht der Modulname.
- Die **Portliste** in runden Klammern beschreibt die Anschlüsse. Einträge werden mit Kommas getrennt; nach dem letzten Eintrag steht kein Komma.
- Nach `);` folgt die Implementierung. Hier verbindet `assign` den Eingang mit dem Ausgang.
- `endmodule` beendet das Modul.

`input` kennzeichnet hier den Eingang und `output` den Ausgang. `logic` ist der logische Datentyp, den wir in Kapitel 3 näher betrachten.

Kommentare beginnen mit `//` und reichen bis zum Zeilenende. Mehrzeilige Kommentare stehen zwischen `/*` und `*/`.

![Aufbau eines SystemVerilog-Moduls](/Kurse/ES1/images/generated/module.png)

---

<!--
lesson_id: 202
lesson_title: "2.2. Übung: Assign"
difficulty: "intro"
duration_min: 10
type: "exercise"
-->

### 2.2. Übung: Assign

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
module tb_module_assign #(
    parameter integer TEST_LENGTH = 2,
    parameter integer TEST_WIDTH = 3
) (
    output logic [TEST_WIDTH-1:0] test_array [TEST_LENGTH],
    output logic test_solved [TEST_LENGTH]
);

logic signal_in1, signal_out1, signal_out2;
logic expected;

int length;

module_assign dut (
    .e1(signal_in1),
    .a1(signal_out1),
    .a2(signal_out2)
);

initial begin
    for (length = 0; length < TEST_LENGTH; length = length + 1) begin
        signal_in1 = length[0];

        #1;

        test_array[length][0] = signal_in1;
        test_array[length][1] = signal_out1;
        test_array[length][2] = signal_out2;
        expected = signal_in1;
        test_solved[length] = ((signal_out1 === expected) && (signal_out2 === 1'b1));

        #1;
    end
    $display("\n");
    $display("===================================================");
    $display("| Input e1 | Output a1 | Output a2 |   Solved?   |");
    $display("===================================================");

    for (int i = 0; i < TEST_LENGTH; i = i + 1) begin
        $display("|    %b     |     %b     |     %b     |      %s      |",
            test_array[i][0], // e1
            test_array[i][1], // a1
            test_array[i][2], // a2
            test_solved[i] ? "✅" : "❌"
        );
    end
    $display("===================================================\n");
    $finish;
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

Das **Interface** einer Komponente ist hier ihre äußere Schnittstelle: die Namen, Richtungen und Typen ihrer Ports. Nutzer der Komponente müssen wissen, welches Verhalten sie an diesen Ports erwarten können.

Unterschiedliche Implementierungen können dieselbe Schnittstelle und dasselbe Verhalten besitzen. Beispiel: Zwei Varianten eines NAND-Gatters.

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

Beide Varianten haben die Ports `a`, `b` und `y` und liefern dieselbe Wahrheitstabelle. Die identische Portliste allein garantiert noch kein identisches Verhalten: Das müssen wir durch die Beschreibung und die Tests sicherstellen.

Der Begriff Interface meint hier die Port-Schnittstelle. SystemVerilog bietet zusätzlich ein eigenes Sprachkonstrukt `interface`, das wir für diese Beispiele noch nicht benötigen.

---

<!--
lesson_id: 204
lesson_title: "2.4. Übung: Alternative Implementierung"
difficulty: "intro"
duration_min: 10
type: "exercise"
-->

### 2.4. Übung: Alternative Implementierung

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
module tb_module_nand_alternative #(
    parameter integer TEST_LENGTH = 4,
    parameter integer TEST_WIDTH = 3
) (
    output logic [TEST_WIDTH-1:0] test_array [TEST_LENGTH],
    output logic test_solved [TEST_LENGTH]
);

logic a, b, y;

module_nand_alternative dut (
    .a(a),
    .b(b),
    .y(y)
);

initial begin
    for (int i = 0; i < TEST_LENGTH; i = i + 1) begin
        a = i[0];
        b = i[1];
        #1;
        test_array[i] = {y, b, a};
        test_solved[i] = (y === ~(a & b));
        $display("Test %0d | Daten: %b | Solved? %s", i, test_array[i],
                 test_solved[i] ? "✅" : "❌");
    end
    $finish;
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

Ports legen fest, wie ein Modul mit seiner Umgebung verbunden ist. Die Richtung gilt aus Sicht des Moduls:

| Richtung | Bedeutung |
|----------|-----------|
| `input` | Ein Signal kommt in das Modul hinein. |
| `output` | Das Modul gibt ein Signal nach außen aus. |
| `inout` | Ein Anschluss kann in beiden Richtungen genutzt werden. |

Ein Eingang wird von außen getrieben und innerhalb des Moduls gelesen. Einen Ausgang treiben wir im Modul. Für die meisten Übungen reichen `input` und `output`.

```verilog
module module_ports(
    input logic signal_in,
    output logic signal_out
);

assign signal_out = signal_in;

endmodule
```

`inout` wird beispielsweise für gemeinsam genutzte bidirektionale Pins verwendet. Solche Verbindungen brauchen eine Regel, wer sie treiben darf, und einen Netztyp wie `wire`. Wir verwenden sie in diesen ersten Übungen noch nicht.

![Eingangs- und Ausgangsports eines Moduls](/Kurse/ES1/images/generated/ports.png)

---

<!--
lesson_id: 206
lesson_title: "2.6. Übung: Port-Richtungen"
difficulty: "intro"
duration_min: 10
type: "exercise"
-->

### 2.6. Übung: Port-Richtungen

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
module tb_module_switch #(
    parameter integer TEST_LENGTH = 2,
    parameter integer TEST_WIDTH = 2
) (
    output logic [TEST_WIDTH-1:0] test_array [TEST_LENGTH],
    output logic test_solved [TEST_LENGTH]
);

logic switch_in, led_out;

module_switch dut (
    .switch_in(switch_in),
    .led_out(led_out)
);

initial begin
    for (int i = 0; i < TEST_LENGTH; i = i + 1) begin
        switch_in = i[0];
        #1;
        test_array[i] = {led_out, switch_in};
        test_solved[i] = (led_out === switch_in);
        $display("Test %0d | Daten: %b | Solved? %s", i, test_array[i],
                 test_solved[i] ? "✅" : "❌");
    end
    $finish;
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

Wir beschreiben Verbindungen mit passenden Datentypen und Bitbreiten. Jede Lektion endet mit einer einfachen Übung.


**Beispiel:** `logic [7:0] data;` bündelt acht Bits. Die unsigned Konstante `8'd9` belegt darin das Bitmuster `0000_1001`.

---

<!--
lesson_id: 301
lesson_title: "3.1 Signale und logische Typen"
difficulty: "intro"
duration_min: 10
type: "theory"
-->

### 3.1 Signale und logische Typen

Ein **Signal** transportiert einen Wert zwischen Teilen unserer Hardwarebeschreibung. Seine deklarierte Bitbreite bleibt während des Betriebs fest.

Der SystemVerilog-Datentyp **`logic`** kann pro Bit vier Zustände darstellen:

| Wert | Bedeutung in der Simulation |
|------|-----------------------------|
| `0` | Low |
| `1` | High |
| `x` | Unbekannter Wert, etwa bei fehlender Initialisierung |
| `z` | Hochohmig, etwa bei einem freigegebenen Anschluss |

Der Typ **`bit`** besitzt nur die zwei Zustände 0 und 1. Wir verwenden zunächst `logic`, damit unbekannte Werte in der Simulation sichtbar bleiben.

**`wire`** kennzeichnet ein Netz, also eine Verbindung. `logic` beschreibt einen Datentyp und kann beispielsweise für interne Variablen und Ausgangsports mit einem Treiber verwendet werden. Ob Hardware einen Speicher benötigt, hängt von der beschriebenen Logik ab, nicht allein vom Wort `logic`.

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

Hier wird kein Wert gespeichert: `signal_internal` verbindet Eingang und Ausgang. Ein Signal darf in unseren Beispielen nur einen Treiber besitzen.

![Weiterleitung über ein internes Signal ohne Speicher](/Kurse/ES1/images/generated/internal-signal.png)

---

<!--
lesson_id: 302
lesson_title: "3.2. Übung: Internes Signal"
difficulty: "intro"
duration_min: 10
type: "exercise"
-->

### 3.2. Übung: Internes Signal

Ein internes Signal verbindet den Eingang mit dem Ausgang des Moduls.

#### Schnittstelle

| Port | Richtung | Typ | Beschreibung |
|------|----------|-----|--------------|
| `signal_in` | `input` | `logic` | Weiterzuleitendes Eingangssignal |
| `signal_out` | `output` | `logic` | Über das interne Signal weitergeleiteter Wert |

#### Verhalten

- `signal_out` folgt unverändert `signal_in`.
- Auch die Simulationszustände `x` und `z` werden unverändert weitergeleitet.

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
module tb_module_signal_copy #(
    parameter integer TEST_LENGTH = 4,
    parameter integer TEST_WIDTH = 2
) (
    output logic [TEST_WIDTH-1:0] test_array [TEST_LENGTH],
    output logic test_solved [TEST_LENGTH]
);

logic signal_in, signal_out;

module_signal_copy dut (
    .signal_in(signal_in),
    .signal_out(signal_out)
);

initial begin
    for (int i = 0; i < TEST_LENGTH; i = i + 1) begin
        case (i % 4)
            0: signal_in = 1'b0;
            1: signal_in = 1'b1;
            2: signal_in = 1'bx;
            3: signal_in = 1'bz;
        endcase
        #1;
        test_array[i] = {signal_out, signal_in};
        test_solved[i] = (signal_out === signal_in);
        $display("Test %0d | Daten: %b | Solved? %s", i, test_array[i],
                 test_solved[i] ? "✅" : "❌");
    end
    $finish;
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

Ein **Vektor** bündelt mehrere Bits. `logic [7:0] data` besitzt 8 Bits: die Indizes laufen von 7 bis 0. Für unsere absteigend deklarierten Vektoren ist Bit 0 das **Least Significant Bit (LSB)** und Bit 7 das **Most Significant Bit (MSB)**.

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

- `data_in[0]` selektiert ein einzelnes Bit.
- `data_in[7:4]` selektiert vier zusammenhängende Bits.
- `{...}` setzt Teile zusammen; der linke Eintrag bildet die höchstwertigen Bits.

Die allgemeine Breite einer Deklaration `[links:rechts]` ist `|links − rechts| + 1`. Auch aufsteigende Bereiche sind zulässig; wir verwenden hier einheitlich `[n-1:0]`.

Achten Sie auf passende Breiten: Bei einer Zuweisung an einen kleineren Vektor gehen die höchstwertigen Bits verloren.

---

<!--
lesson_id: 304
lesson_title: "3.4. Übung: Bitselektion"
difficulty: "intro"
duration_min: 10
type: "exercise"
-->

### 3.4. Übung: Bitselektion

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
module tb_module_assign #(
    parameter integer TEST_LENGTH = 256,
    parameter integer TEST_WIDTH = 11
) (
    output logic [TEST_WIDTH-1:0] test_array [TEST_LENGTH],
    output logic test_solved [TEST_LENGTH]
);



logic [7:0] signal_in1;
logic [2:0] signal_out1;
logic [7:0] input_data [TEST_LENGTH];
logic [2:0] expected;

int length;

module_assign dut (
    .data_in(signal_in1),
    .data_out(signal_out1)
);

initial begin
    foreach (input_data[i]) begin
        input_data[i] = i;
    end

    for (length = 0; length < TEST_LENGTH; length = length + 1) begin
        signal_in1 = input_data[length];

        #1;

        test_array[length][7:0] = signal_in1;
        test_array[length][10:8] = signal_out1;
        expected = {signal_in1[7], signal_in1[4], signal_in1[0]};
        test_solved[length] = (signal_out1 === expected);

        #1;
    end
    $display("\n");
    $display("=================================================");
    $display("| Input data_in | Output data_out |   Solved?   |");
    $display("=================================================");

    for (int i = 0; i < TEST_LENGTH; i = i + 1) begin
        $display("|   %b    |       %b       |      %s      |",
            test_array[i][7:0],  // data_in
            test_array[i][10:8], // data_out
            test_solved[i] ? "✅" : "❌"
        );
    end
    $display("=================================================\n");
    $finish;
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

Vektoren aus `logic` sind ohne weitere Angabe **unsigned**. Mit `signed` interpretieren wir sie als vorzeichenbehaftete Zahlen im Zweierkomplement.

```verilog
logic [7:0] positive_value;
logic signed [7:0] signed_value;
int count;
```

`int` ist standardmäßig ein vorzeichenbehafteter 32-Bit-Typ mit vier Zuständen pro Bit. Für Hardware mit genau festgelegter Breite verwenden wir zunächst `logic [n-1:0]` beziehungsweise `logic signed [n-1:0]`.

Konstanten schreiben wir mit **Bitbreite**, optionalem **`s`** für signed, **Zahlenbasis** und **Wert**:

| Konstante | Bedeutung |
|-----------|-----------|
| `8'b0000_1001` | 8 Bit, unsigned, binär: 9 |
| `8'h09` | 8 Bit, unsigned, hexadezimal: 9 |
| `8'd9` | 8 Bit, unsigned, dezimal: 9 |
| `-8'sd3` | 8 Bit, signed, dezimal: −3 |

Unterstriche verbessern die Lesbarkeit und verändern den Wert nicht. Das Minus steht vor der vollständigen Konstante. Wählen Sie Bitbreite und Vorzeichen passend zum Zielsignal.

Für feste benannte Werte können wir `localparam` verwenden:

```verilog
localparam logic [7:0] VALUE_NINE = 8'd9;
localparam logic signed [7:0] VALUE_MINUS_THREE = -8'sd3;
```

Diese Konstanten ändern sich während des Betriebs nicht. Bei Berechnungen und Vergleichen müssen wir auf die Breite und signed/unsigned-Interpretation aller beteiligten Werte achten.

---

<!--
lesson_id: 306
lesson_title: "3.6. Übung: Numerische Konstanten"
difficulty: "intro"
duration_min: 10
type: "exercise"
-->

### 3.6. Übung: Numerische Konstanten

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
module tb_module_constants #(
    parameter integer TEST_LENGTH = 1,
    parameter integer TEST_WIDTH = 16
) (
    output logic [TEST_WIDTH-1:0] test_array [TEST_LENGTH],
    output logic test_solved [TEST_LENGTH]
);

logic [7:0] nine_out;
logic signed [7:0] minus_three_out;

module_constants dut (
    .nine_out(nine_out),
    .minus_three_out(minus_three_out)
);

initial begin
    for (int i = 0; i < TEST_LENGTH; i = i + 1) begin
        // Die Ausgänge sind konstant.
        #1;
        test_array[i] = {minus_three_out, nine_out};
        test_solved[i] = (nine_out === 8'd9 && minus_three_out === -8'sd3);
        $display("Test %0d | Daten: %b | Solved? %s", i, test_array[i],
                 test_solved[i] ? "✅" : "❌");
    end
    $finish;
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

Operatoren verknüpfen Signale zu Ausdrücken. Wir unterscheiden Operationen auf einzelnen Bits, logische Aussagen und Berechnungen mit Zahlen.

**Beispiel:** `a & b` verknüpft Bits; `a < b` prüft, ob die Zahl `a` kleiner als `b` ist.

---

<!--
lesson_id: 401
lesson_title: "4.1 Bitweise und logische Operatoren"
difficulty: "intro"
duration_min: 10
type: "theory"
-->

### 4.1 Bitweise und logische Operatoren

**Bitweise Operatoren** wirken auf jedes Bit eines Vektors getrennt. **Logische Operatoren** interpretieren ihre Operanden als Wahrheitswerte: Ein bekannter Wert ungleich null gilt als wahr, null als falsch. Ihr Ergebnis ist ein einzelnes Bit.

| Bitweise | Bedeutung | Logisch | Bedeutung |
|----------|-----------|---------|-----------|
| `&` | AND je Bit | `&&` | Beide Operanden sind wahr |
| `\|` | OR je Bit | `\|\|` | Mindestens ein Operand ist wahr |
| `^` | XOR je Bit | — | — |
| `~` | Jedes Bit invertieren | `!` | Wahrheitswert negieren |

**Beispiel:** Bei `a = 4'b0010` und `b = 4'b0100` ist `a & b` gleich `4'b0000`, aber `a && b` gleich `1'b1`: Beide Vektoren sind ungleich null, obwohl sie keine gemeinsame gesetzte Bitposition besitzen.

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
assign logical_and_out = a && b;
assign inverted_out = ~a;
assign is_zero_out = !a;

endmodule
```

Bei unbekannten Bits (`x` oder `z`) kann auch der Wahrheitswert unbekannt sein. In den ersten Aufgaben prüfen wir die Operatoren mit bekannten 0/1-Werten. Verwenden Sie Klammern, um die beabsichtigte Reihenfolge klar zu machen.

---

<!--
lesson_id: 402
lesson_title: "4.2. Übung: Bitweise und logisch"
difficulty: "intro"
duration_min: 10
type: "exercise"
-->

### 4.2. Übung: Bitweise und logisch

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
- Beispiel: `a = 0010`, `b = 0100` ergibt `bitwise_out = 0000` und `logical_out = 1`.

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
assign logical_out = a && b;

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_bitwise_logical #(
    parameter integer TEST_LENGTH = 256,
    parameter integer TEST_WIDTH = 13
) (
    output logic [TEST_WIDTH-1:0] test_array [TEST_LENGTH],
    output logic test_solved [TEST_LENGTH]
);

logic [3:0] a, b, bitwise_out;
logic logical_out;
logic [3:0] expected_bits;
logic expected_logical;

module_bitwise_logical dut (
    .a(a),
    .b(b),
    .bitwise_out(bitwise_out),
    .logical_out(logical_out)
);

initial begin
    for (int i = 0; i < TEST_LENGTH; i = i + 1) begin
        a = i % 16;
        b = (i / 16) % 16;
        for (int k = 0; k < 4; k = k + 1)
            expected_bits[k] = (a[k] == 1'b1) && (b[k] == 1'b1);
        expected_logical = (a != 0) && (b != 0);
        #1;
        test_array[i] = {logical_out, bitwise_out, b, a};
        test_solved[i] = (bitwise_out === expected_bits && logical_out === expected_logical);
        $display("Test %0d | Daten: %b | Solved? %s", i, test_array[i],
                 test_solved[i] ? "✅" : "❌");
    end
    $finish;
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

Die **Konkatenation** `{a, b}` setzt Bitfolgen zusammen. Links stehen die höchstwertigen Bits. Die Ergebnisbreite ist die Summe der Breiten der einzelnen Teile.

Die **Replikation** `{anzahl{wert}}` wiederholt eine Bitfolge. Die Wiederholungszahl muss eine konstante, beim Aufbau der Schaltung bekannte Zahl sein.

**Beispiel:** Für `high_in = 4'b1010` und `low_in = 4'b0011` ergibt `{high_in, low_in}` den Wert `8'b1010_0011`. `{2{low_in}}` ergibt `8'b0011_0011`.

```verilog
module module_join(
    input logic [3:0] high_in,
    input logic [3:0] low_in,
    output logic [7:0] joined_out,
    output logic [7:0] repeated_out,
    output logic [7:0] extended_out
);

assign joined_out = {high_in, low_in};
assign repeated_out = {2{low_in}};
assign extended_out = {{4{low_in[3]}}, low_in};

endmodule
```

Die letzte Zeile kopiert das höchstwertige Bit viermal. Wenn `low_in` als 4-Bit-Zweierkomplement interpretiert wird, bleibt so sein Zahlenwert bei der Erweiterung auf 8 Bit erhalten. Das Ergebnis einer Konkatenation ist jedoch unsigned; für nachfolgende vorzeichenbehaftete Rechnungen muss die Interpretation ebenfalls stimmen.

---

<!--
lesson_id: 404
lesson_title: "4.4. Übung: Zusammensetzen und wiederholen"
difficulty: "intro"
duration_min: 10
type: "exercise"
-->

### 4.4. Übung: Zusammensetzen und wiederholen

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
module tb_module_join_repeat #(
    parameter integer TEST_LENGTH = 256,
    parameter integer TEST_WIDTH = 24
) (
    output logic [TEST_WIDTH-1:0] test_array [TEST_LENGTH],
    output logic test_solved [TEST_LENGTH]
);

logic [3:0] high_in, low_in;
logic [7:0] joined_out, repeated_out;
logic [7:0] expected_joined, expected_repeated;

module_join_repeat dut (
    .high_in(high_in),
    .low_in(low_in),
    .joined_out(joined_out),
    .repeated_out(repeated_out)
);

initial begin
    for (int i = 0; i < TEST_LENGTH; i = i + 1) begin
        high_in = (i / 16) % 16;
        low_in = i % 16;
        expected_joined = high_in * 16 + low_in;
        expected_repeated = low_in * 17;
        #1;
        test_array[i] = {repeated_out, joined_out, high_in, low_in};
        test_solved[i] = (joined_out === expected_joined && repeated_out === expected_repeated);
        $display("Test %0d | Daten: %b | Solved? %s", i, test_array[i],
                 test_solved[i] ? "✅" : "❌");
    end
    $finish;
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

**Arithmetische Operatoren** rechnen mit Zahlen. **Relationale Operatoren** vergleichen Zahlen und liefern einen Wahrheitswert von einem Bit.

| Operator | Bedeutung |
|----------|-----------|
| `+`, `-` | Addition, Subtraktion; `-a` negiert einen Wert |
| `*` | Multiplikation |
| `/`, `%` | Ganzzahlige Division, Rest |
| `<`, `<=`, `>`, `>=` | Kleiner, kleiner gleich, größer, größer gleich |
| `==`, `!=` | Gleichheit, Ungleichheit |

`==` und `!=` gehören zu den Gleichheitsoperatoren. Bei unbekannten Bits kann ein Vergleich `x` ergeben. Die Testbenches verwenden dagegen `===`, um auch `x` und `z` eindeutig zu vergleichen.

**Beispiel:** Für `a = 4'd15` und `b = 4'd1` ist die Summe 16. Dafür benötigen wir **5 Bit**. Ein 4-Bit-Ergebnis würde auf 0 überlaufen.

```verilog
module module_calculate(
    input logic [3:0] a,
    input logic [3:0] b,
    output logic [4:0] sum_out,
    output logic [7:0] product_out,
    output logic less_out,
    output logic equal_out,
    output logic greater_out
);

assign sum_out = {1'b0, a} + {1'b0, b};
assign product_out = {4'b0000, a} * {4'b0000, b};
assign less_out = a < b;
assign equal_out = a == b;
assign greater_out = a > b;

endmodule
```

Hier sind beide Eingänge unsigned. Bei signed-Werten gelten andere Wertebereiche; vermeiden Sie unbeabsichtigte Mischungen von signed und unsigned.

Division durch null hat kein gültiges numerisches Ergebnis. Ganzzahlige Division verwirft den Nachkommateil, beispielsweise `7 / 2 = 3`. Multiplikation und insbesondere Division können mehr Hardware benötigen als einfache logische Verknüpfungen.

---

<!--
lesson_id: 406
lesson_title: "4.6. Übung: Summe und Vergleich"
difficulty: "intro"
duration_min: 10
type: "exercise"
-->

### 4.6. Übung: Summe und Vergleich

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
module tb_module_sum_compare #(
    parameter integer TEST_LENGTH = 256,
    parameter integer TEST_WIDTH = 15
) (
    output logic [TEST_WIDTH-1:0] test_array [TEST_LENGTH],
    output logic test_solved [TEST_LENGTH]
);

logic [3:0] a, b;
logic [4:0] sum_out;
logic less_out, equal_out;
integer expected_sum;

module_sum_compare dut (
    .a(a),
    .b(b),
    .sum_out(sum_out),
    .less_out(less_out),
    .equal_out(equal_out)
);

initial begin
    for (int i = 0; i < TEST_LENGTH; i = i + 1) begin
        a = i % 16;
        b = (i / 16) % 16;
        expected_sum = i % 16 + (i / 16) % 16;
        #1;
        test_array[i] = {equal_out, less_out, sum_out, b, a};
        test_solved[i] = (sum_out === expected_sum[4:0] && less_out === (a < b) && equal_out === (a == b));
        $display("Test %0d | Daten: %b | Solved? %s", i, test_array[i],
                 test_solved[i] ? "✅" : "❌");
    end
    $finish;
end
endmodule
```
**TESTBENCH_END**

---

<!--
lesson_id: 500
lesson_title: "5. Kontinuierliche und bedingte Zuweisungen"
difficulty: "intro"
duration_min: 1
type: "theory"
-->

## 5. Kontinuierliche und bedingte Zuweisungen

Wir beschreiben kombinatorische Verbindungen mit `assign` und wählen mit Bedingungen zwischen verschiedenen Werten.

**Beispiel:** `assign y = enable ? data : 1'b0;` gibt abhängig von `enable` entweder `data` oder 0 aus.

---

<!--
lesson_id: 501
lesson_title: "5.1 Kontinuierliche Zuweisung (assign)"
difficulty: "intro"
duration_min: 10
type: "theory"
-->

### 5.1 Kontinuierliche Zuweisung (assign)

Eine **kontinuierliche Zuweisung** beschreibt dauerhaft, welcher Ausdruck einen Ausgang oder ein internes Signal treibt:

```verilog
assign ziel = ausdruck;
```

Ändert sich ein Signal im Ausdruck, wird das Ergebnis in der Simulation neu bestimmt. Die Zuweisung speichert keinen Zustand. Mehrere `assign`-Anweisungen wirken nebenläufig; ihre Reihenfolge im Quelltext beschreibt keine zeitliche Abfolge.

**Beispiel:** Das folgende Modul invertiert die Eingangsdaten und kennzeichnet, ob mindestens ein Eingangsbit gesetzt ist.

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

Das einstellige `|` ist hier ein **Reduktionsoperator**: Es verknüpft alle Bits des Vektors mit OR und liefert ein einzelnes Bit. Entsprechend reduziert `&data_in` mit AND und `^data_in` mit XOR.

`^data_in` liefert 1, wenn eine ungerade Anzahl Bits gesetzt ist. Das verwenden wir im folgenden Paritätsgenerator. Jedes Zielsignal besitzt in unseren Beispielen genau einen Treiber.

---

<!--
lesson_id: 502
lesson_title: "5.2. Übung: Paritätsgenerator"
difficulty: "intro"
duration_min: 10
type: "exercise"
-->

### 5.2. Übung: Paritätsgenerator

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
module tb_module_parity #(
    parameter integer TEST_LENGTH = 16,
    parameter integer TEST_WIDTH = 5
) (
    output logic [TEST_WIDTH-1:0] test_array [TEST_LENGTH],
    output logic test_solved [TEST_LENGTH]
);

logic [3:0] data_in;
logic parity_out;
integer ones;
logic expected_parity;

module_parity dut (
    .data_in(data_in),
    .parity_out(parity_out)
);

initial begin
    for (int i = 0; i < TEST_LENGTH; i = i + 1) begin
        data_in = i % 16;
        ones = 0;
        for (int k = 0; k < 4; k = k + 1)
            ones = ones + data_in[k];
        expected_parity = ones % 2;
        #1;
        test_array[i] = {parity_out, data_in};
        test_solved[i] = (parity_out === expected_parity);
        $display("Test %0d | Daten: %b | Solved? %s", i, test_array[i],
                 test_solved[i] ? "✅" : "❌");
    end
    $finish;
end
endmodule
```
**TESTBENCH_END**

---

<!--
lesson_id: 503
lesson_title: "5.3 Bedingte Zuweisungen"
difficulty: "intro"
duration_min: 10
type: "theory"
-->

### 5.3 Bedingte Zuweisungen

Mit dem **bedingten Operator** `?:` wählen wir zwischen zwei Ausdrücken. In einer kontinuierlichen Zuweisung schreiben wir:

```verilog
assign ziel = bedingung ? wert_wenn_wahr : wert_wenn_falsch;
```

Beide Alternativen sind angegeben. Für bekannte Bedingungen beschreibt dies kombinatorische Auswahl, also einen **Multiplexer**. Es wird kein bisheriger Ausgangswert gespeichert.

**Beispiel:** Ein 2-Bit-Eingang `level_in` wählt aus drei festen 8-Bit-Werten.

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

Bei `00` wird 0 ausgegeben, bei `01` der Wert 64, bei `10` und `11` der Wert 128. Verschachtelte Bedingungen werden von außen nach innen ausgewählt: Der letzte Ausdruck bildet den verbleibenden Fall ab.

Achten Sie auf gleich breite und passend typisierte Alternativen. Bei einer unbekannten Bedingung kann das Ergebnis unbekannte Bits enthalten; `x` ist kein gewöhnliches falsch.

---

<!--
lesson_id: 504
lesson_title: "5.4. Übung: Lüfterstufe auswählen"
difficulty: "intro"
duration_min: 10
type: "exercise"
-->

### 5.4. Übung: Lüfterstufe auswählen

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
module tb_module_fan_selector #(
    parameter integer TEST_LENGTH = 256,
    parameter integer TEST_WIDTH = 10
) (
    output logic [TEST_WIDTH-1:0] test_array [TEST_LENGTH],
    output logic test_solved [TEST_LENGTH]
);

logic [7:0] temperature_in;
logic [1:0] speed_out;
logic [1:0] expected_speed;

module_fan_selector dut (
    .temperature_in(temperature_in),
    .speed_out(speed_out)
);

initial begin
    for (int i = 0; i < TEST_LENGTH; i = i + 1) begin
        temperature_in = i % 256;
        expected_speed = 2'b00;
        if (temperature_in >= 30) expected_speed = expected_speed + 1'b1;
        if (temperature_in >= 50) expected_speed = expected_speed + 1'b1;
        if (temperature_in >= 70) expected_speed = expected_speed + 1'b1;
        #1;
        test_array[i] = {speed_out, temperature_in};
        test_solved[i] = (speed_out === expected_speed);
        $display("Test %0d | Daten: %b | Solved? %s", i, test_array[i],
                 test_solved[i] ? "✅" : "❌");
    end
    $finish;
end
endmodule
```
**TESTBENCH_END**

---

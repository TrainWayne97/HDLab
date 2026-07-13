<!--
lesson_id: 001
lesson_title: "Vorwort"
difficulty: "intro"
duration_min: 5
type: "theory"
-->

# Ultimativer Spektakulärer (System)Verilog Guide 
## Vorwort
Zuerst ein **Hallo und Willkommen!**
In diesem Guide werden wir lernen wie **Verilog funktioniert** und es zu einem **mächtigen Tool** für uns machen.
Zum Start ein kurzer Hintergrund: **Verilog** wurde 1983/84 von Phil Moorby entworfen, wobei man heutzutage fast ausschließlich die **synonym** verwendete **SystemVerilog** Extension aus 2009 nutzt. Dieses Tutorial wird auch dauerhaft Verilog schreiben und Systemverilog meinen.

---

<!--
lesson_id: 002
lesson_title: "Inhaltsverzeichnis"
difficulty: "intro"
duration_min: 0
type: "theory" 
-->

- [Ultimativer Spektakulärer (System)Verilog Guide](#ultimativer-spektakulärer-systemverilog-guide)
  - [Vorwort](#vorwort)
  - [0. Grundlagen für das Hardware Verständnis](#0-grundlagen-für-das-hardware-verständnis)
    - [0.1 Was ist Verilog?](#01-was-ist-verilog)
    - [0.2 Zustände: Die "Highs and Lows" des Computers](#02-zustände-die-highs-and-lows-des-computers)
    - [0.3 Der Index \[7:0\]](#03-der-index-70)
    - [0.4 Binär und Hexadezimal](#04-binär-und-hexadezimal)
    - [0.5 Zahlensysteme](#05-zahlensysteme)
    - [0.6 Truth Table](#06-truth-table)
    - [0.7 Sequentiell Kombinatorisch, was ist das?](#07-sequentiell-kombinatorisch-was-ist-das)
    - [0.8 FPGA: Was, Warum, Wie?](#08-fpga-was-warum-wie)
    - [0.9 Was macht das Synthesetool und warum muss ich dauerhaft drauf achten, dass er mich nicht missversteht?](#09-was-macht-das-synthesetool-und-warum-muss-ich-dauerhaft-drauf-achten-dass-er-mich-nicht-missversteht)
  - [1. Aufbau eines Moduls](#1-aufbau-eines-moduls)
    - [1.1 Modul: Der Rahmen des Codes](#11-modul-der-rahmen-des-codes)
    - [1.2 Portliste: Anschluss der Außenwelt](#12-portliste-anschluss-der-außenwelt)
    - [1.3 Kommentare: Überblick trotz Chaos](#13-kommentare-überblick-trotz-chaos)
  - [2. Signale](#2-signale)
    - [2.1 Einfache Zuweisungen: Was soll wo hin?](#21-einfache-zuweisungen-was-soll-wo-hin)
    - [2.2 Übung: Assign](#22-übung-assign)
    - [2.3 Leitungen: Verbindungen im Code](#23-leitungen-verbindungen-im-code)
    - [2.4 Always @ (posedge signal) : Sequentiell](#24-always--posedge-signal--sequentiell)
    - [2.5 Always\_ff](#25-always_ff)
    - [2.6 Always @ (\*): Kombinatorisch](#26-always---kombinatorisch)
    - [2.7 Always\_comb](#27-always_comb)
    - [2.8 Blocking und Non-Blocking](#28-blocking-und-non-blocking)
    - [2.9 Begin End](#29-begin-end)
    - [2.10 Übung: Verzögerungen kontrollieren](#210-übung-verzögerungen-kontrollieren)
    - [2.11 Logic](#211-logic)
    - [2.12 Always\_latch](#212-always_latch)
  - [3. Erweiterte Signale](#3-erweiterte-signale)
    - [3.1 Breite von Signalen](#31-breite-von-signalen)
    - [3.2 Vorzeichen](#32-vorzeichen)
    - [3.3 Übung: Vorzeichen](#33-übung-vorzeichen)
    - [3.4 Bitselektion aus Leitungen](#34-bitselektion-aus-leitungen)
    - [3.5 Übung: Bitselektion](#35-übung-bitselektion)
    - [3.6 Anpassen der Signalbreite](#36-anpassen-der-signalbreite)
    - [3.7 Arrays](#37-arrays)
    - [3.8 Packed vs Unpacked Arrays](#38-packed-vs-unpacked-arrays)
    - [3.9 Übung: Arrays](#39-übung-arrays)
    - [3.10 Übung: 7-Segment Display](#310-übung-7-segment-display)
  - [4. Logische Operationen](#4-logische-operationen)
    - [4.1 Grundoperationen: AND, NOT](#41-grundoperationen-and-not)
    - [4.2 Übung: NAND](#42-übung-nand)
    - [4.3 Weitere Grundoperationen: OR, XOR](#43-weitere-grundoperationen-or-xor)
    - [4.4 Übung: OR](#44-übung-or)
    - [4.5 Übung: NOR \& XOR](#45-übung-nor--xor)
    - [4.6 Übung: Wechselschaltung](#46-übung-wechselschaltung)
    - [4.7 Boolean: Wahrheitswerte](#47-boolean-wahrheitswerte)
    - [4.8 Zusatz-Übung: Wechselschaltung mit Knöpfen](#48-zusatz-übung-wechselschaltung-mit-knöpfen)
    - [4.9 Übung: Wahrheitswerte](#49-übung-wahrheitswerte)
    - [4.10 If: Wenn x, dann y](#410-if-wenn-x-dann-y)
    - [4.11 Übung: Priority If](#411-übung-priority-if)
    - [4.12 Case: If nur anders](#412-case-if-nur-anders)
    - [4.13 Bedingte Zuweisung](#413-bedingte-zuweisung)
  - [5. Arithmetische Operationen](#5-arithmetische-operationen)
    - [5.1 Bit-Shifts](#51-bit-shifts)
    - [5.2 Übung: 2 zu 4 Binärer Dekodierer](#52-übung-2-zu-4-binärer-dekodierer)
    - [5.3 Übung: Erweitern auf 3 zu 8 Binärer Dekodierer](#53-übung-erweitern-auf-3-zu-8-binärer-dekodierer)
    - [5.4 Arithmetische Operationen: Addition und Subtraktion](#54-arithmetische-operationen-addition-und-subtraktion)
    - [5.5 Übung: Halbaddierer](#55-übung-halbaddierer)
    - [5.6 Übung: Volladdierer](#56-übung-volladdierer)
    - [5.7 Übung: Subtraktion mittels Addition](#57-übung-subtraktion-mittels-addition)
    - [5.8 Arithmetische Operationen: Multiplikation](#58-arithmetische-operationen-multiplikation)
    - [5.9 Übung: Sequentieller Multiplikator](#59-übung-sequentieller-multiplikator)
    - [5.10 Übung: Kombinatorischer Multiplikator](#510-übung-kombinatorischer-multiplikator)
    - [5.11 Arithmetische Operationen: Division und Rest](#511-arithmetische-operationen-division-und-rest)
    - [5.12 Übung: Sequentielle Division](#512-übung-sequentielle-division)
    - [5.13 Übung: Kombinatorische Division](#513-übung-kombinatorische-division)
  - [6. Startbedingungen und Moduling](#6-startbedingungen-und-moduling)
    - [6.1 Anfangswerte](#61-anfangswerte)
    - [6.2 Übung: Resets](#62-übung-resets)
    - [6.3 Moduling](#63-moduling)
    - [6.4 Übung: Moduling](#64-übung-moduling)
    - [6.5 Parameter](#65-parameter)
    - [6.6 Übung: Timer](#66-übung-timer)
  - [7. Zustände z und x](#7-zustände-z-und-x)
    - [7.1 Synthese von z und x](#71-synthese-von-z-und-x)
    - [7.2 casez und casex](#72-casez-und-casex)
  - [8. Finite State Machine](#8-finite-state-machine)
    - [8.1 Automaten](#81-automaten)
    - [8.2 Moore](#82-moore)
    - [8.3 Mealy](#83-mealy)
  - [9. Das Gesamtsystem](#9-das-gesamtsystem)
    - [9.1 Codestruktur](#91-codestruktur)
    - [9.2 Physische Größe (FPGA): Warum nicht alles riesig?](#92-physische-größe-fpga-warum-nicht-alles-riesig)
    - [9.3 Warum und wann sollte man Speichern?](#93-warum-und-wann-sollte-man-speichern)
    - [9.4 Zusammenfassung 1/0](#94-zusammenfassung-10)
  - [10. Projekte](#10-projekte)

---

<!--
lesson_id: 003
lesson_title: "0. Grundlagen für das Hardware Verständnis"
difficulty: "intro"
duration_min: 1
type: "theory"
-->

## 0. Grundlagen für das Hardware Verständnis
- Im ersten Kapitel dieses Tutorials wollen wir alle nötigen Grundkenntnisse auffrischen, sodass Sie gut vorbereitet in Verilog starten können.

---

<!--
lesson_id: 004
lesson_title: "0.1 Grundlagen: Was ist Verilog?"
difficulty: "intro"
duration_min: 5
type: "theory"
-->

### 0.1 Was ist Verilog?
- Die erste Frage, welche wir klären sollten, bevor wir anfangen ist, was denn eigentlich Verilog ist?
- Verilog ist eine **Hardware Description Language (HDL)**, das bedeutet wir programmieren keine fertige CPU. Wir sagen den Bausteinen eines Systems, wie genau sie sich verbinden sollen.
- Einem HDL Entwickler ist es möglich Berechnungsaufgaben schneller, platzsparender und effizienter zu lösen, als es mit Programmiersprachen möglich ist, was allerdings meist längere Entwicklungszeiten und spezialisiertere Systeme mit sich bringt.

---

<!--
lesson_id: 005
lesson_title: "0.2 Zustände: Die "Highs and Lows" des Computers"
difficulty: "intro"
duration_min: 5
type: "theory" 
-->

### 0.2 Zustände: Die "Highs and Lows" des Computers
- High und Low bezeichnen hierbei den Zustand eines Kabel und damit den Wert des Zustandes, mit **High als 1** und **Low als 0**. In Verilog gibt es außerdem **z als hochohmig** (nicht verbunden) und **x als undefiniert**, also für Verilog unbekannt oder "egal".

---

<!--
lesson_id: 006
lesson_title: "0.3 Der Index [7:0]"
difficulty: "intro"
duration_min: 5
type: "theory" 
-->

### 0.3 Der Index [7:0]
- Anders als man es vielleicht gewöhnt ist, fängt man in der Informatik in der Regel an bei der 0 zu zählen.
- Somit ist das erste Kapitel nicht Kapitel 1, sondern Kapitel 0. Dies betrifft insbesondere das Zählen von Bitpositionen.
- Hierbei ist das **Least Significant Bit (LSB)** immer Bit 0 und das **Most Significant Bit (MSB)** immer Bit **n-1** mit **n** als **Anzahl binärer Stellen**.
- Somit ist eine Leitung, welche [7:0] Leitungen hat, also Leitung 0 bis Leitung 7, 8 Bit groß.

---

<!--
lesson_id: 007
lesson_title: "0.4 Binär und Hexadezimal"
difficulty: "intro"
duration_min: 10
type: "theory"
-->

### 0.4 Binär und Hexadezimal
- Bevor wir anfangen können Computer zu beschreiben müssen wir verstehen wie sie Zahlen darstellen.
- Unser Zahlensystem ist für Computer nicht direkt nutzbar, da das System auf welchem sie basieren nur zwei Zahlen nutzen kann.
- Diese sind 0 und 1 und werden durch verschiedene Spannungen repräsentiert.
- Um größere Zahlen darzustellen kann man nun mehrere Leitungen nebeneinander verlegen. Dies ist gleichzusetzen mit dem danebenschreiben einer weiteren Zahl, um eine zweistellige Zahl im Zehnersystem zu erhalten.
- Hierbei hat die **x-te Stelle den Wert: Ziffer * 2<sup> (x)</sup>**
- Denken Sie daran, dass x bei 0 beginnt.
- Es ist weiterhin zu beachten, dass diese Stelle natürlich nur den Wert repräsentiert, wenn an ihr auch eine 1 steht.
- Wenn man mehrstellige Zahlen hat muss man die Werte der einzelnen Stellen mit 1 nun nur noch addieren und man bekommt seine Zahl.
- Da 32 Bit Zahlen relativ schnell anstrengend zu schreiben werden, hat man das Hexadezimalsystem eingeführt.
- Dieses fasst immer 4 Positionen, angefangen beim LSB, zusammen, wobei es von 0 bis F reicht.
- Hierbei wird zum Beispiel die 0000 zu 0, 0010 zu 2, 1010 zu A und 1111 zu F.
- Somit berechnet sich der **Wert an Stelle x: Ziffer * 16<sup> (x)</sup>**
- In Verilog werden diese Zahlen mit ihrer Bitlänge und die Art der Repräsentation angegeben. Somit ist eine **8 Bit 15 schreibbar als 8'b00001111 für Binär, 8'h0F für Hexadezimal oder 8'd15 für Dezimal.**
>**ACHTUNG:** Dies ist eine der wenigen Ausnahmen, wobei nicht der Index genommen wird.

---

<!--
lesson_id: 008
lesson_title: "0.5 Zahlensysteme"
difficulty: "intro"
duration_min: 10
type: "theory"
-->

### 0.5 Zahlensysteme
- In Mathematik beginnt man von natürlichen Zahlen und arbeitet sich zu komplexen Zahlen hoch, indem man, wenn man an ein Limit stößt, neue Systeme einführt.
- Zum Beispiel das Minus als Indikator für negative Zahlen oder das Komma für Dezimalbrüche.
- An elektrische Leitungen kann man allerdings nicht einfach ein Minus oder Komma setzen, wodurch man sich behelfen muss.
- Bei Ganzzahlen hat sich das Zweierkomplement durchgesetzt, welches eine negative Zahl durch die Invertierung der positiven Zahl plus 1 repräsentiert.
- Dies hat den Vorteil, dass die mathematische Rechnung mit dem Zweierkomplement direkt die richtigen Ergebnisse zur Folge hat, später mehr dazu.
- Mit dem Komma funktioniert es ähnlich. Am einfachsten sind die Fixkommazahlen, bei welchen sich der Entwickler das Komma zwischen zwei Binären Stellen denkt und sonst einfach normal rechnet. Hierbei bekommt man auch direkt das richtige Ergebnis, man muss jedoch aufpassen, da bei zum Beispiel Multiplikationen die Kommastelle der einen Zahl plus die der zweiten Zahl, die Stelle des Ergebnisses ist.
- Gleitkommazahlen sind etwas schwieriger umzusetzen, werden allerdings später in ihrem eigenen Teil erklärt.

---

<!--
lesson_id: 009
lesson_title: "0.6 Truth Table"
difficulty: "intro"
duration_min: 5
type: "theory"
-->

### 0.6 Truth Table
- Truth Table (übersetzt Wahrheitstabellen) sind Anreihungen aller möglichen Inputs und den zugehörigen Outputs.
- Es ist anfangs sehr empfehlenswert sich die Truth-Table zu erstellen, da sie direkt Eingang mit Ausgang verknüpfen, ohne sich Gedanken über das "Wie?" zu machen.

<div style="display: flex; gap: 400px;">

<div>

**NAND-Gatter**
| A | B | Out |
|---|---|---|
| 0 | 0 | 1 |
| 1 | 0 | 1 |
| 0 | 1 | 1 |
| 1 | 1 | 0 |

</div>

<div>

**Halbaddierer**
| A | B | Summe | Carry |
|---|---|---|---|
| 0 | 0 | 0 | 0 |
| 1 | 0 | 1 | 0 |
| 0 | 1 | 1 | 0 |
| 1 | 1 | 0 | 1 |

</div>

</div>

---

<!--
lesson_id: 010
lesson_title: "0.7 Sequentiell Kombinatorisch, was ist das?"
difficulty: "intro"
duration_min: 10
type: "theory"
-->

### 0.7 Sequentiell Kombinatorisch, was ist das?
- Diese Begriffe mögen vielleicht am Anfang etwas komisch wirken, allerdings beschreiben sie einfach nur zwei Arten von Operationen.
- Sequentiell bedeutet nacheinander, was hierbei auf die zeitliche Abfolge von Operationen in Takten bezogen ist, später dazu mehr. Es beschreibt hierbei nur das Abspeichern von Werten, sodass sie sicher vorliegen, auch wenn der Rechenapparat hinter ihnen weiter benutzt wird.
- Dieser Rechenapparat ist hierbei der kombinatorische Teil, wobei man Logische Gatter kombiniert, um arithmetische Operationen und mehr zu verwirklichen.
- Es ist gern gesehen seinen Code strikt in diese Teile zu trennen, da er so viel übersichtlicher und einfacher zu warten ist.

---

<!--
lesson_id: 011
lesson_title: "0.8 FPGA: Was, Warum, Wie?"
difficulty: "intro"
duration_min: 10
type: "theory"
-->

### 0.8 FPGA: Was, Warum, Wie?
- Beginnen wir mit was denn überhaupt so ein FPGA ist.
- FPGA steht für Field Programmable Gate Array und es ist genau das was der Name beschreibt.
- Sie sind programmierbare Ansammlungen von Gattern, welche fast beliebig verbunden werden können.
- Früher musste man immer einen ganzen Chip fertigen lassen, welcher seine Gatter enthielt, um prüfen zu können, ob das Design auch praktisch funktioniert.
- FPGAs ermöglichen es heutzutage seinen Code direkt zu testen und anzupassen und verkürzen somit Entwicklungsdauer und auch Entwicklungskosten neuer Chipsdesigns.
- Aber wie macht er das eigentlich?
- FPGAs haben eine feste Anzahl konfigurierbarer Logikblöcke (CLB). Auf diesen sitzen sogenannte Slices, welche LUT, DSP, MUX und FF beherbergen.
- LUT sind hierbei Look Up Tables, welche speichern, welcher Wert bei welchen Eingangssignalen ausgegeben wird.
- DSP sind hierbei das Herzstück, warum FPGAs überhaupt so schnell sein können. Sie sind starr für eine einzige Aufgabe ausgelegt: (A*B) + C zu rechnen und das machen sie sehr schnell.
- MUX sind hierbei die Multiplexer, welche die richtigen Signale an die richtigen Stellen leiten.
- Außerdem sind natürlich Flip-Flops, also Register verbaut um Daten speichern zu können.
- Es ist außerdem ein riesiges Verbindungsnetz verbaut, um Daten von einem Teil des FPGAs zu weiter entfernten Stellen leiten zu können.
- Bei großen zusammenhängenden Berechnungen werden außerdem Carry Chains verwendet, um direkt von einem Slice zu einem anderen Daten zu übertragen, ohne das allgemeine Routing Netz nutzen zu müssen, wodurch dies sehr viel schneller ist.

---

<!--
lesson_id: 012
lesson_title: "0.9 Was macht das Synthesetool und warum muss ich dauerhaft drauf achten, dass er mich nicht missversteht?"
difficulty: "intro"
duration_min: 10
type: "theory"
-->

### 0.9 Was macht das Synthesetool und warum muss ich dauerhaft drauf achten, dass er mich nicht missversteht?
- Statt Verilog Code zu schreiben könnte man auch jedes Gatter von Hand setzen. Dies würde aber bei heutigen Chips so viel Zeit beanspruchen, dass es sich nicht lohnt und fast unmöglich ist zu optimieren.
- Hierbei vertraut man einem Synthesetool den Verilog Code so umzuformen, sodass er ansatzweise optimal auf einem FPGA laufen kann.
- Das Synthesetool kann allerdings auch nur den Code so gut umsetzen, wie er geschrieben ist, weshalb man immer strenge Designvorschriften einhalten muss, sodass der Code vom Synthesetool nicht missinterpretiert werden kann.
- Worauf man achten muss, damit der Code nicht missinterpretiert werden kann wird in jedem Kapitel erwähnt.

---

<!--
lesson_id: 100
lesson_title: "1. Aufbau eines Moduls"
difficulty: "beginner"
duration_min: 1
type: "theory"
-->

## 1. Aufbau eines Moduls
- Im Folgenden Kapitel lernen Sie, wie ein Modul, der Rahmen für den verilog Code aufgebaut ist.

---

<!--
lesson_id: 101
lesson_title: "1.1 Modul: Der Rahmen des Codes"
difficulty: "beginner"
duration_min: 5
type: "theory"
-->

### 1.1 Modul: Der Rahmen des Codes
- Verilog ist in seiner Syntax sehr ähnlich zur Sprache **C**. 
- Am Anfang muss man sein Modul definieren und ihm einen Namen geben, sowie den Endpunkt des Moduls definieren. Warum auch der Endpunkt nützlich ist, neben dem dass er eine Voraussetzung ist, schauen wir uns später an.
- Hierbei ist darauf zu achten, dass so wie in C hinter **jeder Zuweisung** im Code, zwischen **module** und **endmodule**, ein **Semikolon** eingefügt werden muss.
```verilog
module module_name;

endmodule
```

![Modell des Moduls](./images/model_module.png)

---

<!--
lesson_id: 102
lesson_title: "1.2 Portliste: Anschluss der Außenwelt"
difficulty: "beginner"
duration_min: 5
type: "theory"
-->

### 1.2 Portliste: Anschluss der Außenwelt
- Weiterhin ist wichtig anzumerken, dass man ein System baut, mit welchem man nur durch vordefinierte Schnittstellen (Ports) kommunizieren kann.
- Hierbei gibt es drei Portarten
  - input name_des_ports:   Zum Hineinführen von Signalen
  - output name_des_ports:  Zum Herausführen von Signalen
  - inout name_des_ports:   Falls der Port als Ein- & Ausgabe genutzt werden soll
- Normalerweise werden nur input und output verwendet, wodurch nur kurz gegen Ende ein Beispiel für inout besprochen wird.
- Die Ports werden hierbei in normalen Klammer hinter dem Modulnamen angegeben. Sie müssen mit Kommas getrennt werden.
- Es ist außerdem sehr ratsam seine Ports mit der zugehörigen Art zu kennzeichnen, um später besseren Überblick zu behalten.
```verilog
module module_ports(
    input signal_in,
    output signal_out
);

endmodule
```

![Modell der Ports](./images/model_ports.png)

---

<!--
lesson_id: 103
lesson_title: "1.3 Kommentare: Überblick trotz Chaos"
difficulty: "beginner"
duration_min: 5
type: "theory"
-->

### 1.3 Kommentare: Überblick trotz Chaos
- Um in großen Codes nicht zu vergessen, was da überhaupt vor einem ist, ist es sehr oft hilfreich es einfach daneben zu schreiben. Kommentare sind hierbei nur für den Betrachter sichtbar und werden später beim Ausführen gänzlich ignoriert.
- Man schreibt ihn mit doppelten Schrägstrich **// Kommentar**, allerdings ist damit alles dahinter auskommentiert und wird ignoriert.
- Es ist auch möglich einen mehrzeiligen Kommentar zu schreiben, hierfür nutzt man /* Kommentar */.
- Er ist besonders für das auskommentieren von Codeblöcken nützlich.

```verilog
module module_comment(
    input signal_in,
    output signal_out
);

// Das wird von der Maschine ignoriert.

endmodule
```

![Modell Kommis](./images/model_comments.png)

---

<!--
lesson_id: 200
lesson_title: "2. Signale"
difficulty: "beginner"
duration_min: 1
type: "theory"
-->

## 2. Signale

---

<!--
lesson_id: 201
lesson_title: "2.1 Einfache Zuweisungen: Was soll wo hin?"
difficulty: "beginner"
duration_min: 5
type: "theory"
-->

### 2.1 Einfache Zuweisungen: Was soll wo hin?
- Momentan macht unser Modul noch gar nichts. Es existiert zwar ein input, dieser wird allerdings nicht verwertet und der output ist undefiniert.
- Um eine einfache Zuweisung von unserem Eingang auf den Ausgang zu schaffen gibt es das **assign**. Die Anordnung ist wie folgt: **assign Name_Ziel = Name_Herkunft**
- Die assign Zuweisung ist **kein Speicher** für Werte. Sie legt Kabel von einer Stelle an eine andere.
- Im Beispiel werden jetzt einfach nur Kabel vom Eingang an den Ausgang gelegt. Ändert sich der Eingang, ändert sich direkt der Ausgang.
- Hierbei darf man das Semikolon nicht vergessen.

```verilog
module module_assign(
    input signal_in,
    output signal_out,
    output signal_high_out
);

assign signal_out = signal_in;
assign signal_high_out = 1'b1;

endmodule
```

![Modell Assign](./images/model_assign.png)

---

<!--
lesson_id: 202
lesson_title: "2.2 Übung: Assign"
difficulty: "beginner"
duration_min: 10
type: "exercise"
-->

### 2.2 Übung: Assign
- Damit Sie mit der Syntax von Verilog vertraut werden, fangen wir einfach an.
- In der ersten Übung sollen Sie den Eingang e1 auf den Ausgang a1 weiterleiten und den Ausgang a2 dauerhaft auf High setzen.
> **Tipp:** Sie können jederzeit in vorherigen Lektionen nachschlagen, wenn Sie sich nicht mehr sicher sind.

**EXERCISE_START**
```verilog
module module_assign(
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
module module_assign(
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
logic [1:0] expected;

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
        test_solved[length] = ((signal_out1 === expected[length]) && (signal_out2 === 1'b1));

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
lesson_title: "2.3 Leitungen: Verbindungen im Code"
difficulty: "beginner"
duration_min: 5
type: "theory"
-->

### 2.3 Leitungen: Verbindungen im Code
- In Verilog gibt es keine Variablen wie in C. Jedes Signal braucht hierbei seine eigene Leitung, welche eine **feste Größe** hat und **während der Laufzeit nicht angepasst oder neu angelegt** werden kann.
- Um eine Verbindung zu deklarieren nutzt man das Kennwort **wire**.
- Sollte man in den Ports nichts anderes angeben wird immer angenommen, dass diese wires sind.

```verilog
module module_cable(
    input wire signal_in,
    output wire signal_out
);

wire signal_intern;

assign signal_intern = signal_in;
assign signal_out = signal_intern;

endmodule
```

![Modell der Kabel](./images/model_wire.png)

---

<!--
lesson_id: 204
lesson_title: "2.4 Always @ (posedge signal) : Sequentiell"
difficulty: "beginner"
duration_min: 15
type: "theory"
-->

### 2.4 Always @ (posedge signal) : Sequentiell
- Zum Speichern von Daten verwendet man Register.
- Damit das System weiß, wann gespeichert werden soll, nutzt man **always @ (posedge clk)** oder **always @ (negedge clk)**.
- Hierbei werden alle Daten zur positiven (posedge) oder negativen (negedge) Flanke vom Signal sig übernommen.
- Eine Flanke ist hierbei die Änderung von Low zu High (positiv) oder von High zu Low (negativ).
- Meistens ist dieses Signal eine Clock, ein periodisches Signal mit hoher Frequenz (meist ab hohem MHz Bereich).
- Man kann es auch von nicht periodischen Signalen abhängig machen, allerdings wird dies eher vermieden, da es auch in den periodischen Blöcken umgesetzt werden kann und zu Fehlern führen kann.
- Das **Keyword des Registers** ist hierbei **reg** und muss mit **reg signal_name;** deklariert werden.
- Innerhalb des always Blocks müssen alle Register mittels Non-Blocking Assignment **<=** definiert werden.
- Die Definition kann hierbei mittels Signalen von Ergebnissen von Operationen oder direkt durch Operationen in der Zeile stattfinden.
- Tipp: Es ist außerdem gern gesehen, wenn man seine Ausgänge ganz unten im Modul via assign Zuweisungen zuweist, sodass man schnell finden kann, wie genau das Modul funktioniert. Sollte man jedoch in einem always Block einen output definieren, dann muss man nach dem output den Datentyp reg ergänzen.
> **Achtung:** Es bietet sich immer an, strikt in Sequentiell und Kombinatorisch zu teilen und im sequentiellen Block nur die Ergebnisse des Kombinatorischen zu speichern.

> **WICHTIG:** Sie dürfen niemals dasselbe Signal in zwei verschiedenen always Blöcken definieren. Dies führt zu Fehlern, da ein Signal mehrere Ursprünge (Multiple Drivers) hat.

```verilog
module module_sequ(
    input wire signal_in,
    input wire clk,
    output wire signal_out
);

reg signal_saved;

always @ (posedge clk) signal_saved <= signal_in;

assign signal_out = signal_saved;

endmodule
```

---

<!--
lesson_id: 205
lesson_title: "2.5 Always_ff"
difficulty: "beginner"
duration_min: 5
type: "theory"
-->

### 2.5 Always_ff
- Statt always @(posedge clk) zu verwenden, kann man auch always_ff @(posedge clk) nutzen.
- Hierbei besteht der Vorteil darin, dass dem Synthesetool direkt gesagt wird, dass nur Speicher synthetisiert werden sollen.
- Somit bricht die Synthese ab, wenn kombinatorische Logik detektiert wird.

```verilog
module module_always_ff(
    input wire clk,
    input wire signal_in,
    output wire signal_out
);

reg signal_indirect;

always_ff @(posedge clk) signal_indirect <= signal_in;

assign signal_out = signal_indirect;

endmodule
```

---


<!--
lesson_id: 206
lesson_title: "2.6 Always @ (*): Kombinatorisch"
difficulty: "beginner"
duration_min: 15
type: "theory"
-->

### 2.6 Always @ (*): Kombinatorisch
- Um in Kombinatorisch und Sequentiell teilen zu können fehlt uns nun noch der kombinatorische Block.
- Dieser funktioniert im allgemeinen ähnlich, wie die assign Zuweisung.
- Er ist nicht zum Speichern von Werten, sondern rein für logische und arithmetische Operationen vorgesehen.
- Man kann ihn verstehen als Block, welcher bei Änderung von * (eines beliebigen Eingangssignals) alle Ausgänge aktualisiert.
- Man kann alles auch nur von bestimmten Signalen abhängig machen, welche dann durch Kommas innerhalb der Klammer getrennt sind (always @ (sig_a, sig_b)), hiervon wird aber stark abgeraten, da sich hier das Verhalten von Simulation und Synthese unterscheidet und somit die Fehlersuche sehr erschwert wird.
- In der Synthese funktionieren always @ (*), always @ (sig_a) und always @ (sig_a, sig_b) gleich, nur in der Simulation ist das Verhalten unterschiedlich.
- Hierbei kann man Signale mittels Blocking Assignment **=** definieren.
- Das definierte Signal muss hierbei wieder als reg deklariert sein.
- Tipp: Es ist außerdem gern gesehen, wenn man seine Ausgänge ganz unten im Modul via assign Zuweisungen zuweist, sodass man schnell finden kann, wie genau das Modul funktioniert. Sollte man jedoch in einem always Block einen output definieren, dann muss man nach dem output den Datentyp reg ergänzen.

> **Achtung:**  Sie können in einem always-Block mehrfach dasselbe Signal definieren. Hierbei ist es wichtig, welche Art Zuweisung Sie verwenden. Es ist ein riesiger Unterschied zwischen <= und =. Wenn Sie eine Kette von Operationen ausführen möchten, nutzen Sie unbedingt '=', da bei '<=' ungewollte Speicher entstehen können.
>               Des Weiteren ist wichtig zu beachten, dass bei der Simulation Ihres Moduls der Block erst nach Änderung der Eingangssignale ausgeführt wird, sodass es sein kann, dass die berechneten Signale zu Beginn der Simulation nicht definiert sind.

> **EXTREM WICHTIG:** Wenn Sie in einem kombinatorischem Block ein Signal zuweisen und dieses Signal erst darunter definieren, dann wird Ihnen das Synthesetool einen ungewollten Speicher bauen und Sie werden mit alten, falschen Werten rechnen. **Achten Sie deshalb darauf, zuerst die Zwischenschritte zu berechnen und dann zusammen zu führen.**

```verilog
module module_comb(
    input wire signal_in,
    output wire signal_out
);

reg signal_direct;

always @ (*) signal_direct = signal_in;

assign signal_out = signal_direct;

endmodule
```

---

<!--
lesson_id: 207
lesson_title: "2.7 Always_comb"
difficulty: "beginner"
duration_min: 10
type: "theory"
-->

### 2.7 Always_comb
- Statt always @ (*) zu verwenden, kann man auch always_comb nutzen.
- Beide funktionieren fast gleich, nur verbietet always_comb das Bauen von Latches, wodurch er sehr nützlich ist. Hierbei wirft es einen Fehler, sobald in der Synthese ein Latch entdeckt wird.
- Sobald das Synthesetool einen Speicher innerhalb des always_comb Blocks bauen müsste, hält es an und wirft einen Fehler, wodurch das debugging sehr stark vereinfacht wird.
- Es reagiert hierbei auf jede Änderung der Eingangssignale und es wird zum Start der Simulation immer ein Mal ausgeführt, egal ob sich die Eingangswerte ändern oder nicht.

```verilog
module module_always_comb(
    input signal_in,
    output signal_out
);

reg signal_direct;

always_comb signal_direct = signal_in;

assign signal_out = signal_direct;

endmodule
```


---

<!--
lesson_id: 208
lesson_title: "2.8 Blocking und Non-Blocking"
difficulty: "beginner"
duration_min: 10
type: "theory"
-->


### 2.8 Blocking und Non-Blocking
- Im letzten Teil hatten wir die Bedingung aufgestellt, dass ein Signal nie in zwei unterschiedlichen always Blöcken definiert sein darf.
- Im selben Block darf es allerdings definiert werden, was zu vielen Vorteilen führt.
- Non-Blocking: Hierbei werden beim Auswerten alle Eingangssignale eingefroren und alle Zuweisungen gleichzeitig ausgeführt. Sollte ein Signal mehrfach definiert sein gewinnt das unterste.
- Blocking: Hierbei wird jede Zeile nacheinander betrachtet. Es ist möglich Verkettungen von Operationen zu bauen und demselben Signal sich selbst als input zu geben, sollte es davor schon definiert sein. Hierbei baut das Synthesetool nun eine Verkettung, welche zuerst die obere Operation, dann die Untere ausführt und dieses Signal ausgibt.
- Es ist möglich <= innerhalb von kombinatorischen Blöcken zu nutzen, kann bei falscher Benutzung aber schnell zu Fehlern (Endlosschleifen) führen, wodurch davon **strengstens abgeraten** wird.
- Es ist möglich = innerhalb von sequentiellen Blöcken zu nutzen, kann aber bei falscher Benutzung aber schnell zu Fehlern (race-conditions) führen, wodurch davon **strengstens abgeraten** wird.

---

<!--
lesson_id: 209
lesson_title: "2.9 Begin End"
difficulty: "beginner"
duration_min: 5
type: "theory"
-->

### 2.9 Begin End
- Meist braucht man allerdings mehr als nur eine Zeile. Dafür gibt es auch einen Befehl, sodass alles nachfolgende noch auf den vorhergehenden Block reagiert.
- **begin *Code* end** sagt dem Synthesetool, dass die nachfolgenden Zeilen **bis zum end** noch auf den Block reagieren.
- Hierbei muss man beachten, dass hinter begin und end **kein Semikolon** gehört.

```verilog
module module_saveData_2(
    input signal_in,
    input clk,
    output signal_out
);

reg signal_a;
reg signal_b;
reg signal_combined;

always @ (posedge clk) begin
    signal_a <= signal_in;
    signal_b <= signal_in;
end

always @ (*) begin
    signal_combined = signal_a & signal_b;
end

assign signal_out = signal_combined;

endmodule
```

---

<!--
lesson_id: 210
lesson_title: "2.10 Übung: Verzögerung kontrollieren"
difficulty: "beginner"
duration_min: 10
type: "exercise"
-->

### 2.10 Übung: Verzögerungen kontrollieren
- Wie Sie gelernt haben, wird Ihr Signal durch jedes Speichern um einen Takt verzögert.
- Im ersten Moment wirkt dies eher nachteilhaft, aber es kann nützlich sein.
- Um damit vertraut zu werden, sollen Sie ihr Eingangssignal um genau 5 Takte verzögern.
> **Tipp:** Überlegen Sie genau, welcher always-Block ein Signal speichert und nutzen Sie begin ... end.

**EXERCISE_START**
```verilog
module module_delay(
    input wire clk,
    input wire e1,
    output wire a1
);

// Hier Code hinzufügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_delay(
    input wire clk,
    input wire e1,
    output wire a1
);

reg delay_1, delay_2, delay_3, delay_4, delay_5;

always_ff @(posedge clk) begin
    delay_1 <= e1;
    delay_2 <= delay_1;
    delay_3 <= delay_2;
    delay_4 <= delay_3;
    delay_5 <= delay_4;
end

assign a1 = delay_5;

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_delay #(
    parameter integer TEST_LENGTH = 10,
    parameter integer TEST_WIDTH = 2
) (
    output logic [TEST_WIDTH-1:0] test_array [TEST_LENGTH],
    output logic test_solved [TEST_LENGTH]
);



logic signal_in1, signal_out1;
logic [9:0] expected = 10'b10010xxxxx;
logic [9:0] input_data = 10'b0000010010;
logic clk;

int length;

module_delay dut (
    .clk(clk),
    .e1(signal_in1),
    .a1(signal_out1)
);

always #4 clk = ~clk;

initial begin
    clk = 0;
    for (length = 0; length < TEST_LENGTH; length = length + 1) begin
        @ (negedge clk)
        #1;
        signal_in1 = input_data[length];

        @ (posedge clk)
        #1;
        test_array[length][0] = signal_in1;
        test_array[length][1] = signal_out1;
        
        test_solved[length] = (expected[length] === signal_out1);
    end
    $display("\n");
    $display("=======================================");
    $display("| Input e1 | Output a1 |   Solved?   |");
    $display("=======================================");

    for (int i = 0; i < TEST_LENGTH; i = i + 1) begin
        $display("|    %b     |     %b     |      %s      |", 
            test_array[i][0],
            test_array[i][1],
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
lesson_id: 211
lesson_title: "2.11 Logic"
difficulty: "beginner"
duration_min: 5
type: "theory"
-->

### 2.11 Logic
- Statt Wires und Register zu definieren, kann man diese auch als **Logic** definieren. Das ist insofern einfacher, da man nicht mehr strikt zwischen Wires und Registers unterscheiden muss, sondern einfach **Logic für beides** nehmen kann.
- Es ist außerdem möglich Signale mit gleicher Bitlänge, per Komma, hintereinander zu deklarieren.

```verilog
module module_logic(
    input logic signal_in,
    input logic clk,
    output logic signal_out,
    output logic one_out
);

logic signal_a, signal_b, signal_combined, signal_one;

always @ (posedge clk) begin
    signal_a <= signal_in;
    signal_b <= signal_in;
end

always @ (*) begin
    signal_combined = signal_a & signal_b;
end

assign signal_one = 1'b1;
assign one_out = signal_one;
assign signal_out = signal_combined;

endmodule
```

---

<!--
lesson_id: 212
lesson_title: "2.12 Always_latch"
difficulty: "intermediate"
duration_min: 15
type: "theory"
-->

### 2.12 Always_latch
- Falls man eigene Speicher bauen möchte, müssen diese in always_latch Blöcken stehen. 
- Hierbei blockiert das Synthesetool nicht das Bilden von speichern, wodurch man selber Latches bauen kann und diese zu Flip-Flops und Registernetzwerken zusammenbauen kann
- Always_latch funktioniert wie always @ (*).

```verilog
module module_always_latch(
    input logic clk,
    input logic signal_in,
    output logic signal_out
);

logic signal_saved_master, signal_saved_slave;

always_latch if (clk) signal_saved_master = signal_in;

always_latch if (~clk) signal_saved_slave = signal_saved_master;

assign signal_out = signal_saved_slave;

endmodule
```

---

<!--
lesson_id: 300
lesson_title: "3. Erweiterte Signale".
difficulty: "beginner"
duration_min: 1
type: "theory"
-->

## 3. Erweiterte Signale
- Im folgenden Kapitel wollen wir uns etwas tiefer mit den Signalen in Verilog beschäftigen.

---

<!--
lesson_id: 301
lesson_title: "3.1 Breite von Signalen"
difficulty: "beginner"
duration_min: 10
type: "theory"
-->

### 3.1 Breite von Signalen
- Bis jetzt haben wir immer nur Signale betrachtet, welche ein Bit breit sind, also nur High (1) oder Low (0) sein können.
- Damit ist zwar schon möglich alles zu bauen, was es gibt, allerdings ist es manchmal schön, vor allem bei Zahlen, wenn die zugehörigen Bits direkt beieinander sind.
- Damit man seine Signale nun bündeln kann, muss man hinter den Typ des Signals die **Bitbreite n** in eckigen Klammern [n-1:0] angeben.
- Somit können wir nun vorzeichenlose Zahlen direkt vergleichen oder Grundoperationen auf diese anwenden.
- Hierbei können wir nun auch Werte, wie "9" mittels 4'd9, zuweisen.
> **Achtung: Das Synthesetool ist erbarmungslos! Wenn die Bitbreiten nicht passen, dann wird radikal abgeschnitten oder mit Nullen gefüllt. Meist gibt es eine Warnung, aber es ist immer gut vorsichtig zu sein, sodass das gewollte Verhalten entsteht.**

```verilog
module module_bitwidth(
    input logic [3:0] signal_a_in,
    output logic [3:0] signal_a_out,
    output logic [7:0] nine_out
);

logic [7:0] signal_nine;

assign signal_a_out = signal_a_in;  // Gleiche Anzahl Stellen, Eingangssignal, wie Ausgangssignal

assign signal_nine = 8'd9;          // Input als [7:0] deklariert, aber mit 8'd beschrieben, da Anzahl Stellen mit 0. gezählt wird.
assign nine_out = signal_nine;

endmodule
```



---

<!--
lesson_id: 302
lesson_title: "3.2 Vorzeichen"
difficulty: "beginner"
duration_min: 10
type: "theory"
-->

### 3.2 Vorzeichen
- Im letzten Teil haben wir Bitbreiten eingeführt, um einfacher Zahlen darstellen zu können, allerdings haben wir noch keinen Weg einfach das Vorzeichen darzustellen, sodass ein Vergleich im Zweierkomplement einer negativen Zahl und einer positiven Zahl, zum Beispiel -1 > 1, wahr zurückgeben würde, da z.B. in 8 Bit 8'hFF > 8'h01 unsigned gilt.
- Unsigned bedeutet, dass diese Zahl keine Vorzeichen hat und immer als positive Zahl gesehen wird.
- Um dies zu ändern nutzt man **signed** bei der Einführung des Signals direkt hinter input/output oder logic. Verilog verwendet dann **automatisch** das **Zweierkomplement**.
- Hierbei muss der Typ der Zahl, von unsigned Dezimal ('d) / Binär ('b) / Hex ('h), zu signed Dezimal ('sd) / Binär ('sb) / Hex ('sh) geändert werden.
-  Dies ist so wichtig, da das Minus - vor einer Zahl immer nur anzeigt, dass das Zweierkomplement genommen wird. Wird nun eine Zahl -4'd1 in ein 8 Bit großes Register gespeichert, wird zuerst das Zweierkomplement gebildet und dann auf 8 Bit erweitert. Da die Zahl unsigned ist wird das Vorzeichen nicht erweitert und es wird eine falsche Zahl abgespeichert, auch wenn das Register richtig als signed deklariert ist. Bei -4'sd1 würde das Vorzeichen erweitert werden.
> **WICHTIG: Wenn nur ein Wert in einer Abfolge von Operationen unsigned ist, dann wird die komplette Abfolge in der Regel als unsigned betrachtet. Dies gilt auch für Zuweisungen von negativen Zahlen. Hierbei müssen diese als zum Beispiel -4'sd1 definiert werden für -1.**

```verilog
module module_signed(
    input logic signed [3:0] signal_a_in,
    input logic signed [3:0] signal_b_in,
    output logic signal_a_equals_b_out,
    output logic signal_a_less_b_out,
    output logic signed [3:0] minus_one_out
);

logic signal_a_less_b;

assign signal_a_equals_b_out = (signal_a_in == signal_b_in);    // Ausblick: Überlegen Sie, was hier passieren könnte.
assign signal_a_less_b = (signal_a_in < signal_b_in);           // Ausblick: Überlegen Sie, was hier passieren könnte.

assign signal_a_less_b_out = signal_a_less_b;
assign minus_one_out = -4'sd1;

endmodule
```

---

<!--
lesson_id: 303
lesson_title: "3.3 Übung: Vorzeichen"
difficulty: "beginner"
duration_min: 10
type: "exercise"
-->

### 3.3 Übung: Vorzeichen
- Nun sollen Sie mit vorzeichenbehafteten Zahlen vertraut werden.
- Leiten Sie dafür bitte "9" auf a1 und "-3" auf a2 aus dem Modul.
- Sie sollen 4 Bit breite Ausgänge verwenden.
> **Tipp:** Sie können jederzeit in vorherigen Lektionen nachschlagen, wenn Sie sich nicht mehr sicher sind.

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
lesson_id: 304
lesson_title: "3.4 Bitselektion aus Leitungen"
difficulty: "beginner"
duration_min: 10
type: "theory"
-->

### 3.4 Bitselektion aus Leitungen
- Manchmal tragen Leitungen mehr als nur eine Information. Um an diese zu gelangen, aber trotzdem den Vorteil zu behalten nur ein Kabel durch das Modul schleusen zu müssen, kann man einzelne Bits selektieren und neue Leitungen daraus formen.
- Hierbei kann man entweder direkt den Teil des Kabels mit Bitbreite auswählen oder mittels **geschweifter Klammern {}** zusammensetzen. Dies funktioniert hier nicht wie bei der Bitbreiteeinstellung der Leitung, sondern wird nach dem Namen gesetzt.
- Falls man Vorzeichen kopieren oder kompakter schreiben möchte, kann man den Kopieroperator nutzen. Dieser wird durch { Anzahl_Kopien { Signal [Stelle]}} angezeigt.
- Es ist außerdem möglich mit **\$signed()** und **\$unsigned()** eine Sign Extension durchzuführen, indem man dies um ein Signal schreibt.
- Man sollte immer versuchen explizit hinzuschreiben, was passieren soll, auch wenn nur mit Nullen aufgefüllt wird, da für die nächste Person, sowie das Synthesetool, es verständlicher ist.
- Sie können auch variabel auf ein Signal zugreifen, solange die Breite der abgegriffenen Bits gleich bleibt. Hierfür nutzt man signal[i +: n] oder signal[i -: n], wobei n die feste Breite des Abgriffs ist und i die variable Startstelle. Das Plus zählt hierbei hoch und das Minus runter. Sollte man außerhalb der Signalbreite gelangen, ist nicht festgelegt, wie das System reagieren wird, wodurch man diese Fälle mit if () else ausschließen muss.

```verilog
module module_bitselektion(
    input logic [15:0] signal_a_in,
    output logic [15:0] signal_a_out,
    output logic [7:0] signal_a_message_out,
    output logic [15:0] signal_a_message_middle_out,
    output logic [31:0] signal_a_extended_copy_out,
    output logic signed [31:0] signal_a_extended_signed_out
);

// Message ist in Bits 4 bis 11 versteckt. 8 Bit

assign signal_a_out = signal_a_in;                                          // Unveränderte Ausgabe
assign signal_a_message_out = signal_a_in [11:4];                           // Ausgabe der mittleren 8 Bit
assign signal_a_message_middle_out = {4'h0, signal_a_in [11:4], 4'h0};      // Hängt vorn und hinten 4 Nullen an
assign signal_a_extended_copy_out = {{16{signal_a_in [15]}}, signal_a_in};  // Kopiert MSB 16 mal und hängt es vorn an
assign signal_a_extended_signed_out = $signed(signal_a_in);     // Wird automatisch sign extended, da linke Leitungsbreite größer rechts UND rechts signed, der Wert wird hierbei nicht geändert

endmodule
```

---

<!--
lesson_id: 305
lesson_title: "3.5 Übung: Bitselektion"
difficulty: "beginner"
duration_min: 10
type: "exercise"
-->

### 3.5 Übung: Bitselektion
- Nun sollen Sie sich selbst an der Bitselektion probieren.
- Hierfür sollen Sie Bit 0, 4 und 7 eines 8 Bit breiten Eingangs selektieren und zusammen (7 MSB, 4, 0 LSB) ausgeben.

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
    parameter integer TEST_LENGTH = 4,
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
        input_data[i] = $urandom_range(255, 0);
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
lesson_id: 306
lesson_title: "3.4 Anpassen der Signalbreite"
difficulty: "intermediate"
duration_min: 10
type: "theory"
-->

### 3.6 Anpassen der Signalbreite
- Manchmal möchte man die Größe von Signalen anpassen, ohne direkt neue Leitungen zu deklarieren.
- Hierbei nutzt man n'(Signal) mit n als Bitbreite.
- Hierbei wird eine sign-extention ausgeführt, wenn das Signal als signed definiert ist, sonst wird mit Nullen aufgefüllt und danach die Operation verarbeitet.
- Sollte allerdings das Zielregister wieder kleiner sein, wird der überstehende Teil abgeschnitten.
- Dies ist insbesondere bei der Arithmetik nützlich, worauf später noch eingegangen wird.

```verilog
module module_change_bitwidth(
    input logic [7:0] signal_in,
    output logic [15:0] signal_us_out         // Wird nicht Vorzeichenerweitert
    output logic  [15:0] signal_se_out         // Wird Vorzeichenerweitert
);

assign signal_us_out = 16'(signal_in);
assign signal_se_out = 16'($signed(signal_in));

endmodule
```

---

<!--
lesson_id: 307
lesson_title: "3.7 Arrays"
difficulty: "intermediate"
duration_min: 10
type: "theory"
-->

### 3.7 Arrays
- An manchen Stellen, wie zum Beispiel bei Koordinaten, braucht man mehrere Wires mit denselben Bitbreiten. Hier kann es nützlich sein, wenn man diese zu einem Array zusammenführt.
- Dafür muss nur nach dem Signalnamen, wie bei der Bitbreite, die Breite des Arrays als Index angegeben werden [n-1:0]. Dies funktioniert für alle Datentypen, wie Logic, Wires und Registers.
- Es ist außerdem möglich mehrdimensionale Arrays anzulegen, indem man weitere eckige Klammern hintereinander schreibt. ( z. B. logic [1:0] signal_name [1:0] [1:0]; )

> **Achtung:** Bei (mehr-)dimensionalen Arrays muss auf die Reihenfolge des Zugriffs geachtet werden. Zuerst greift man auf die unpacked Arrays (y,z) rechts vom Signalnamen zu, wobei von links nach rechts iteriert wird und zuletzt auf das packed Array (x), welches links vom Signalnamen steht. Was genau packed und unpacked unterscheidet, wird in der nächsten Lektion behandelt.
>   - Deklaration: logic [X:0] array [Y:0] [Z:0];
>   - Definition: array [y] [z] [x] = n;

- Um auf ein einzelnes Bit in einem Array zuzugreifen, muss man die Bitposition nach der Arrayposition in eckigen Klammern angeben.
- Um Arrays zuzuweisen, kann man '{x, y, z} nutzen. **'{}** symbolisiert dem Synthesetool hierbei, dass es sich um ein Array handelt. Für mehrdimensionale Arrays kann x auch ein Array sein.
- Man kann Arrays auch mittels der Größe als Zahl direkt deklarieren ( logic [N-1:0] array [M]; ), dies funktioniert nur bei unpacked Arrays, welche in der nächsten Lektion näher erklärt werden.

```verilog
module module_array(
    input logic clk,
    input logic [1:0] signal_a_in [1:0],
    input logic [1:0] signal_b_in [2],
    output logic [1:0] signal_a_out [2],
    output logic [1:0] signal_b_out [1:0]
);

logic [1:0] signal_a [1:0];
logic [1:0] signal_b [2];

always_ff @ (posedge clk) begin
    signal_a [0] <= signal_a_in [0];
    signal_a [1] <= signal_a_in [1];
    signal_b <= signal_b_in;
end

assign signal_a_out = '{signal_a[1], signal_a[0]};
assign signal_b_out = signal_b;


endmodule
```

---

<!--
lesson_id: 308
lesson_title: "3.8 Packed vs Unpacked Arrays"
difficulty: "intermediate"
duration_min: 10
type: "theory"
-->

### 3.8 Packed vs Unpacked Arrays
- Es gibt einen großen Unterschied zwischen packed und unpacked Arrays.
- Packed Arrays werden vom Synthesetool oder Simulation als eine zusammenhängende Bitkette betrachtet. Man kann mit ihr logische oder arithmetische Operationen ausführen.
- Bei unpacked Arrays gilt dies nicht. Sie sind eine Sammlung von eigenständigen Elementen, zum Beispiel packed Arrays, auf welche man erst zugreifen muss, um sie auswerten zu können.

```verilog
module module_packedunpacked;

logic unpacked_array [1:0];
logic [1:0] packed_array;
logic [1:0] unpacked_packed_array [1:0];

endmodule
```

---

<!--
lesson_id: 309
lesson_title: "3.9 Übung: Arrays"
difficulty: "beginner"
duration_min: 10
type: "exercise"
-->

### 3.9 Übung: Arrays
- In 3.5 haben Sie sich bereits an der Bitselektion geübt.
- Nun sollen Sie diese innerhalb von Arrays machen.
- Hierfür sollen Sie das MSB des Arrays mit Index 3, die obere Hälfte des Arrays mit Index 2, die untere Hälfte des Arrays mit Index 1 und das LSB des Arrays mit Index 0, in dieser Reihenfolge, koppeln und ausgeben.

**EXERCISE_START**
```verilog
module module_assign(
    input logic [7:0] data_in [4],
    output logic [9:0] data_out
);

// Hier Code hinzufügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_assign(
    input logic [7:0] data_in [4],
    output logic [9:0] data_out
);

assign data_out = {data_in[3][7], data_in[2][7:4], data_in[1][3:0], data_in[0][0]};

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_assign #(
    parameter integer TEST_LENGTH = 4,
    parameter integer TEST_WIDTH = 20
) (
    output logic [TEST_WIDTH-1:0] test_array [TEST_LENGTH],
    output logic test_solved [TEST_LENGTH]
);


logic [7:0] signal_in1 [4];
logic [9:0] signal_out1;
logic [7:0] input_data [TEST_LENGTH] [4];
logic [9:0] expected;

assign expected = {signal_in1[3][7], signal_in1[2][7:4], signal_in1[1][3:0], signal_in1[0][0]};

int length;

module_assign dut (
    .data_in(signal_in1),
    .data_out(signal_out1)
);

initial begin
    foreach (input_data[i, j]) begin
        input_data[i][j] = $urandom_range(255, 0);
    end

    for (length = 0; length < TEST_LENGTH; length = length + 1) begin
        signal_in1 = input_data[length];

        #1;

        test_array[length][9:0] = signal_out1;
        test_array[length][19:10] = expected;
        test_solved[length] = (signal_out1 === expected);

        #1;
    end
    $display("\n");
    $display("==================================================");
    $display("| Output data_out |    Expected    |   Solved?   |");
    $display("==================================================");

    for (int i = 0; i < TEST_LENGTH; i = i + 1) begin
        $display("|    %b   |   %b   |      %s     |", 
            test_array[i][9:0],   // signal_out1
            test_array[i][19:10], // expected
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
lesson_id: 310
lesson_title: "3.10 Übung: 7-Segment Display"
difficulty: "intermediate"
duration_min: 10
type: "exercise"
-->

### 3.10 Übung: 7-Segment Display
- Nun sollen Sie eine einstellige Dezimalzahl decodieren und jede Stelle des 7-Segment Displays ansteuern.
- Tipp: Machen Sie sich einen Truth-Table.

**EXERCISE_START**
```verilog
module seven_segment(
    input logic [3:0] number,
    output logic top,
    output logic top_left,
    output logic top_right,
    output logic middle,
    output logic bottom_left,
    output logic bottom_right,
    output logic bottom
);

// Code hier einfügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
Truth-Table:
| Input | Binär | top | top_left | top_right | middle | bottom_left | bottom_right | bottom | Gatter |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| 0 | 4'b0000 | 1 | 1 | 1 | 0 | 1 | 1 | 1 | !number[0] & !number[1] & !number[2] & !number[3]
| 1 | 4'b0001 | 0 | 0 | 1 | 0 | 0 | 1 | 0 | number[0] & !number[1] & !number[2] & !number[3]
| 2 | 4'b0010 | 1 | 0 | 1 | 1 | 1 | 0 | 1 | !number[0] & number[1] & !number[2] & !number[3]
| 3 | 4'b0011 | 1 | 0 | 1 | 1 | 0 | 1 | 1 | number[0] & number[1] & !number[2] & !number[3]
| 4 | 4'b0100 | 0 | 1 | 1 | 1 | 0 | 1 | 0 | !number[0] & !number[1] & number[2] & !number[3]
| 5 | 4'b0101 | 1 | 1 | 0 | 1 | 0 | 1 | 1 | number[0] & !number[1] & number[2] & !number[3]
| 6 | 4'b0110 | 1 | 1 | 0 | 1 | 1 | 1 | 1 | !number[0] & number[1] & number[2] & !number[3]
| 7 | 4'b0111 | 1 | 0 | 1 | 0 | 0 | 1 | 0 | number[0] & number[1] & number[2] & !number[3]
| 8 | 4'b1000 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | !number[0] & !number[1] & !number[2] & number[3]
| 9 | 4'b1001 | 1 | 1 | 1 | 1 | 0 | 1 | 1 | number[0] & !number[1] & !number[2] & number[3]


```verilog
module seven_segment(
    input logic [3:0] number,
    output logic top,
    output logic top_left,
    output logic top_right,
    output logic middle,
    output logic bottom_left,
    output logic bottom_right,
    output logic bottom
);

always_comb begin
    {top, top_left, top_right, middle, bottom_left, bottom_right, bottom} = 7'bxxxxxxx;   
    case(number)
    4'd0: {top, top_left, top_right, middle, bottom_left, bottom_right, bottom} = 7'b1110111;
    4'd1: {top, top_left, top_right, middle, bottom_left, bottom_right, bottom} = 7'b0010010;
        4'd2: {top, top_left, top_right, middle, bottom_left, bottom_right, bottom} = 7'b1011101;
        4'd3: {top, top_left, top_right, middle, bottom_left, bottom_right, bottom} = 7'b1011011;
        4'd4: {top, top_left, top_right, middle, bottom_left, bottom_right, bottom} = 7'b0111010;
        4'd5: {top, top_left, top_right, middle, bottom_left, bottom_right, bottom} = 7'b1101011;
        4'd6: {top, top_left, top_right, middle, bottom_left, bottom_right, bottom} = 7'b1101111;
        4'd7: {top, top_left, top_right, middle, bottom_left, bottom_right, bottom} = 7'b1010010;
        4'd8: {top, top_left, top_right, middle, bottom_left, bottom_right, bottom} = 7'b1111111;
        4'd9: {top, top_left, top_right, middle, bottom_left, bottom_right, bottom} = 7'b1111011;
        default: {top, top_left, top_right, middle, bottom_left, bottom_right, bottom} = 7'bxxxxxxx;
        endcase
end

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_seven_segment #(
    parameter integer TEST_LENGTH = 10,
    parameter integer TEST_WIDTH = 11
) (
    output logic [TEST_WIDTH-1:0] test_array [TEST_LENGTH],
    output logic test_solved [TEST_LENGTH]
);

logic [3:0] signal_in;
logic top_out, top_left_out, top_right_out, middle_out, bottom_left_out, bottom_right_out, bottom_out;
logic [6:0] actual_out, expected_out;
int length;

logic [6:0] expected_list [10] = '{
    7'b1110111, // 0
    7'b0010010, // 1
    7'b1011101, // 2
    7'b1011011, // 3
    7'b0111010, // 4
    7'b1101011, // 5
    7'b1101111, // 6
    7'b1010010, // 7
    7'b1111111, // 8
    7'b1111011  // 9
};

seven_segment dut (
    .number(signal_in),
    .top(top_out),
    .top_left(top_left_out),
    .top_right(top_right_out),
    .middle(middle_out),
    .bottom_left(bottom_left_out),
    .bottom_right(bottom_right_out),
    .bottom(bottom_out)
);

assign actual_out = {top_out, top_left_out, top_right_out, middle_out, bottom_left_out, bottom_right_out, bottom_out};

initial begin
    for (length = 0; length < TEST_LENGTH; length = length + 1) begin
        signal_in = length[3:0];
        
        #1;

        expected_out = expected_list[length];

        test_array[length][10:7] = signal_in;
        test_array[length][6:0]  = actual_out;

        test_solved[length] = (actual_out === expected_out);

        #1;
    end
    
    $display("\n");
    $display("=========================================================================");
    $display("| Number | top | top_L | top_R | mid | bot_L | bot_R | bot |  Solved? |");
    $display("=========================================================================");

    for (int i = 0; i < TEST_LENGTH; i = i + 1) begin
        $display("|  %b  |  %b  |   %b   |   %b   |  %b  |   %b   |   %b   |  %b  |    %s    |", 
            test_array[i][10:7], // number
            test_array[i][6],    // top
            test_array[i][5],    // top_left
            test_array[i][4],    // top_right
            test_array[i][3],    // middle
            test_array[i][2],    // bottom_left
            test_array[i][1],    // bottom_right
            test_array[i][0],    // bottom
            test_solved[i] ? "✅" : "❌"
        );
    end
    $display("=========================================================================\n");
    $finish;
end
endmodule
```
**TESTBENCH_END**

---

<!--
lesson_id: 400
lesson_title: "4. Logische Operationen"
difficulty: "beginner"
duration_min: 1
type: "theory"
-->

## 4. Logische Operationen
- Nun wollen wir uns endlichen einigen Funktionen widmen, welche unsere Signale ändern. Hierbei beschäftigen wir uns zuerst mit logischen Operationen.

---

<!--
lesson_id: 401
lesson_title: "4.1 Grundoperationen: AND, NOT"
difficulty: "beginner"
duration_min: 10
type: "theory"
-->

### 4.1 Grundoperationen: AND, NOT
- Wie in der Vorlesung besprochen wurde kann **jede Funktion** in Verilog **rein aus NAND-Gattern** gebaut werden.
- Ein reines NAND Zeichen gibt es in Verilog nicht, allerdings sind die Synthese-Tools genau auf solche Optimierungen ausgelegt, sodass in der Regel kein Nachteil durch Zusammensetzung entsteht.
- Ein **AND** wird hierbei mit **&** geschrieben und ein **NOT** mit **~**.
- **AND** ist hierbei nur **High**, wenn **beide inputs High** sind und **NOT invertiert** den eingegebenen Wert.
- Sie können direkt in always Blöcken oder assign Zuweisungen verwendet werden. Es ist immer besser, für Lesbarkeit und bessere Synthese, jede Zeile nur mit einem Operator zu verknüpfen.
- Dies wollen wir in den folgenden Lektionen nachvollziehen und werden dafür alle Grundoperationen erarbeiten.

>**Wichtig:** Es gibt zwei NOT-Operatoren. Einmal ~, welche jedes Bit einzeln invertiert und !, welches 1 Bit zurück gibt, abhängig davon, ob das Signal ungleich Null (1'b0) oder gleich Null (1'b1) ist.

```verilog
module module_and_not(
    input signal_a_in,
    input signal_b_in,
    output signal_not_a_out,
    output signal_a_and_b_out
);

assign signal_not_a_out = ~signal_a_in;
assign signal_a_and_b_out = signal_a_in & signal_b_in;

endmodule
```

![Modell NAND](./images/model_NAND.png)

---

<!--
lesson_id: 402
lesson_title: "4.2 Übung: NAND"
difficulty: "beginner"
duration_min: 10
type: "exercise"
-->

### 4.2 Übung: NAND
- In dieser Übung sollen Sie nun beide Eingangssignale mittels NAND verbinden.
- Tipp: AND &, NOT ~

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

logic signal_a_and_b;

always_comb begin
    signal_a_and_b = signal_a_in & signal_b_in;
end

assign signal_a_nand_b_out = ~(signal_a_and_b);

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
lesson_id: 403
lesson_title: "4.3 Weitere Grundoperationen: OR, XOR"
difficulty: "beginner"
duration_min: 10
type: "theory"
-->

### 4.3 Weitere Grundoperationen: OR, XOR
- Man kann jedes OR oder XOR aus Gattern bauen, allerdings ist das auf Dauer etwas nervig, weshalb Befehle für OR und XOR bereits hinterlegt sind.
- **OR** ist hierbei **|** (Tastatur: Alt Gr + <) und **XOR** ist **^**.
- Das **NOR** müsste man sich wieder selbst zusammen bauen.

```verilog
module module_or_xor(
    input logic signal_a_in,
    input logic signal_b_in,
    output logic signal_a_or_b_out,
    output logic signal_a_xor_b_out
);

assign signal_a_or_b_out = signal_a_in | signal_b_in;
assign signal_a_xor_b_out = signal_a_in ^ signal_b_in;

endmodule
```

---

<!--
lesson_id: 404
lesson_title: "4.4 Übung: OR"
difficulty: "beginner"
duration_min: 10
type: "exercise"
-->

### 4.4 Übung: OR
- Da wir nun etwas mit der Syntax vertraut sind, wollen wir uns an etwas Schwierigeres wagen.
- Die **OR** Operation verknüpft wieder zwei Werte und gibt High aus, solange mindestens ein Signal High ist, sonst Low.
- Versuchen Sie nun selbst nur aus den Grundgattern **AND** und **NOT** ein **OR** Gatter zu erschaffen.
- Tipp:
  - Falls Sie noch etwas Schwierigkeiten haben das Problem zu lösen, versuchen sie sich daran die Truth-Tables einiger Kombinationen von Gattern aufzustellen.
  - Bedenken Sie außerdem, dass es für das Synthesetool immer gut ist, wenn nur eine Operation pro Zeile ausgeführt wird. Nutzen Sie bei mehreren hintereinander liegenden Zuweisungen Leitungen.

**EXERCISE_START**
```verilog
module module_or(
    input logic signal_a_in,
    input logic signal_b_in,
    output logic signal_a_or_b_out
);

// Hier Code einfügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_or(
    input logic signal_a_in,
    input logic signal_b_in,
    output logic signal_a_or_b_out
);

logic signal_not_a;
logic signal_not_b;
logic signal_not_a_and_not_b;

always_comb begin
    signal_not_a = ~(signal_a_in);
    signal_not_b = ~(signal_b_in);
    signal_not_a_and_not_b = signal_not_a & signal_not_b;
end

assign signal_a_or_b_out = ~(signal_not_a_and_not_b);

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_or #(
    parameter integer TEST_LENGTH = 4,
    parameter integer TEST_WIDTH = 3
) (
    output logic [TEST_WIDTH-1:0] test_array [TEST_LENGTH],
    output logic test_solved [TEST_LENGTH]
);

logic signal_a, signal_b, signal_out, expected;
int length;

module_or dut (
    .signal_a_in(signal_a),
    .signal_b_in(signal_b),
    .signal_a_or_b_out(signal_out)
);

initial begin
    for (length = 0; length < TEST_LENGTH; length = length + 1) begin
        signal_a = length[0];
        signal_b = length[1];

        #1;

        test_array[length][0] = signal_a;
        test_array[length][1] = signal_b;
        test_array[length][2] = signal_out;
        expected = signal_a | signal_b;
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
            test_array[i][2], // signal_a_or_b_out
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
lesson_id: 405
lesson_title: "4.5 Übung: NOR & XOR"
difficulty: "beginner"
duration_min: 10
type: "exercise"
-->

### 4.5 Übung: NOR & XOR
- Um die letzten zwei Gatter abzuhaken, sollen Sie jetzt versuchen das **XOR** und **NOR** zu bauen. 
- Nutzen Sie wieder nur **AND** und **NOT** und vergessen Sie nicht, falls Sie Schwierigkeiten haben, die Wahrheitstabelle zu entwickeln (vor allem rückwärts, startend von XOR und NOR).

**EXERCISE_START**
```verilog
module module_xor_nor(
    input logic signal_a_in,
    input logic signal_b_in,
    output logic signal_a_nor_b_out,
    output logic signal_a_xor_b_out
);

// Hier Code einfügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_xor_nor(
    input logic signal_a_in,
    input logic signal_b_in,
    output logic signal_a_nor_b_out,
    output logic signal_a_xor_b_out
);

logic signal_not_a;
logic signal_not_b;
logic signal_not_a_and_not_b;
logic signal_a_or_b;
logic signal_a_and_b;
logic signal_a_nand_b;

always_comb begin
    signal_not_a = ~(signal_a_in);
    signal_not_b = ~(signal_b_in);
    signal_not_a_and_not_b = signal_not_a & signal_not_b;
    signal_a_or_b = ~(signal_not_a_and_not_b);
    signal_a_and_b = signal_a_in & signal_b_in;
    signal_a_nand_b = ~(signal_a_and_b);
end

assign signal_a_nor_b_out = ~(signal_a_or_b);
assign signal_a_xor_b_out = signal_a_nand_b & signal_a_or_b;

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_xor_nor #(
    parameter integer TEST_LENGTH = 4,
    parameter integer TEST_WIDTH = 4
) (
    output logic [TEST_WIDTH-1:0] test_array [TEST_LENGTH],
    output logic test_solved [TEST_LENGTH]
);

logic signal_a, signal_b, signal_xor_out, signal_nor_out, expected_xor, expected_nor;
int length;

module_xor_nor dut (
    .signal_a_in(signal_a),
    .signal_b_in(signal_b),
    .signal_a_nor_b_out(signal_nor_out),
    .signal_a_xor_b_out(signal_xor_out)
);

initial begin
    for (length = 0; length < TEST_LENGTH; length = length + 1) begin
        signal_a = length[0];
        signal_b = length[1];

        #1;

        test_array[length][0] = signal_a;
        test_array[length][1] = signal_b;
        test_array[length][2] = signal_xor_out;
        test_array[length][3] = signal_nor_out;
        expected_nor = ~(signal_a | signal_b);
        expected_xor = signal_a ^ signal_b;
        test_solved[length] = (signal_nor_out === expected_nor) && (signal_xor_out === expected_xor);

        #1;
    end
    $display("\n");
    $display("===============================================================");
    $display("| signal_a | signal_b | xor_out (2) | nor_out (3) |  Solved?  |");
    $display("===============================================================");

    for (int i = 0; i < TEST_LENGTH; i = i + 1) begin
        $display("|     %b    |     %b    |      %b      |      %b      |     %s    |", 
            test_array[i][0], // signal_a_in
            test_array[i][1], // signal_b_in
            test_array[i][2], // signal_a_xor_b_out
            test_array[i][3], // signal_a_nor_b_out
            test_solved[i] ? "✅" : "❌"
        );
    end
    $display("===============================================================\n");
    $finish;
end
endmodule
```
**TESTBENCH_END**

---

<!--
lesson_id: 406
lesson_title: "4.6 Übung: Wechselschaltung"
difficulty: "intermediate"
duration_min: 10
type: "exercise"
-->

### 4.6 Übung: Wechselschaltung
- Ihnen sind zwei Schalter gegeben, welche eine Lampe steuern.
- Diese sollen beide die Lampe an und ausschalten können, unabhängig vom Zustand des anderen.
- Die Schalter bleiben beim schalten in ihrem Zustand.
- Entwickeln Sie eine Schaltung.

**EXERCISE_START**
```verilog
module module_switch(
    input logic switch_a,
    input logic switch_b,
    output logic lamp
);

// Hier Code einfügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_switch(
    input logic switch_a,
    input logic switch_b,
    output logic lamp
);

assign lamp = switch_a ^ switch_b;

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_switch #(
    parameter integer TEST_LENGTH = 4,
    parameter integer TEST_WIDTH = 3
) (
    output logic [TEST_WIDTH-1:0] test_array [TEST_LENGTH],
    output logic test_solved [TEST_LENGTH]
);

logic signal_a, signal_b, signal_out, expected_xor;
int length;

module_switch dut (
    .switch_a(signal_a),
    .switch_b(signal_b),
    .lamp(signal_out)
);

initial begin
    for (length = 0; length < TEST_LENGTH; length = length + 1) begin
        signal_a = length[0];
        signal_b = length[1];

        #1;

        test_array[length][0] = signal_a;
        test_array[length][1] = signal_b;
        test_array[length][2] = signal_out;
        expected_xor = signal_a ^ signal_b;
        test_solved[length] = (signal_out === expected_xor);

        #1;
    end
    $display("\n");
    $display("=================================================");
    $display("| switch_a | switch_b |   lamp   |   Solved?    |");
    $display("=================================================");

    for (int i = 0; i < TEST_LENGTH; i = i + 1) begin
        $display("|     %b    |     %b    |     %b    |      %s      |", 
            test_array[i][0], // switch_a
            test_array[i][1], // switch_b
            test_array[i][2], // lamp
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
lesson_id: 407
lesson_title: "4.7 Boolean: Wahrheitswerte"
difficulty: "beginner"
duration_min: 10
type: "theory"
-->

### 4.7 Boolean: Wahrheitswerte
- Genau wie bei den Gattern ist es möglich Vergleiche direkt als Zeichen in Verilog zu schreiben.
- Hierfür werden die Standardzeichen **<** High, wenn **a kleiner b**,  **>** High, wenn a größer b, **==** für High wenn gleich und **!=** für High wenn ungleich verwendet.
- Das logische Nicht wird hierbei als ! geschrieben und invertiert den 1 Bit Wahrheitswert
- Hierbei verwendet man nicht das ~, da dies gesamte Bitketten invertiert und so logische Fehler unbemerkt bleiben können.
- Hierbei steht die Rückgabe **1 für true (Wahr) und 0 für false (Falsch)**.
- Für die Verknüpfung von Wahrheitswerten, können && (logisches Und), || (logisches Oder) oder ! (logisches Nicht) verwendet werden.

> Tipp: Möchten Sie eine logische Operation auf alle Bits eines Signals anwenden, dann können Sie auch die Operation vor das Signal schreiben. Hierbei wird ein 1 Bit Wahrheitswert entsprechend der Operation ausgegeben.

```verilog
module module_truth(
    input signal_a_in,
    input signal_b_in,
    input [3:0] signal_c,
    output signal_a_equal_b_out,
    output signal_a_unequal_b_out,
    output signal_a_less_b_out,
    output always_low,
    output signal_c_or_out,
    output signal_c_and_out,
    output signal_c_xor_out
);

assign signal_a_equal_b_out = (signal_a_in == signal_b_in);
assign signal_a_unequal_b_out = (signal_a_in != signal_b_in);
assign signal_a_less_b_out = (signal_a_in < signal_b_in);

assign always_low = (signal_a_in == 1'b0) && (signal_a_in == 1'b1);

assign signal_c_or_out = |signal_c_in;
assign signal_c_and_out = &signal_c_in;
assign signal_c_xor_out = ^signal_c_in;

endmodule
```

---

<!--
lesson_id: 408
lesson_title: "4.8 Zusatz-Übung: Wechselschaltung mit Knöpfen"
difficulty: "advanced"
duration_min: 10
type: "exercise"
-->

### 4.8 Zusatz-Übung: Wechselschaltung mit Knöpfen
- Jetzt werden die Schalter durch Knöpfe ausgetauscht. Passen Sie Ihre Schaltung an.
- In späteren Lektionen lernen Sie, wie Sie Anfangswerte richtig setzen. Nutzen Sie hier das vorgegebene output logic lamp = 1'b0.
- Tipp: Diese Übung kann viel schwieriger wirken, als die Übungen davor. Versuchen Sie sich zu überlegen, was wann genau gelten muss.
- Tipp: Die Platzierung der Übungen ist nicht zufällig.

**EXERCISE_START**
```verilog
module module_switch_button(
    input logic button_a,
    input logic button_b,
    input logic clk,
    output logic logic lamp = 1'b0
);

// Hier Code einfügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_switch_button(
    input logic button_a,
    input logic button_b,
    input logic clk,
    output logic lamp = 1'b0
);

logic button_a_old, button_b_old;

always_ff @ (posedge clk) begin
    button_a_old <= button_a;
    button_b_old <= button_b;
    if ((button_a & !button_a_old) | (button_b & !button_b_old)) begin
        lamp <= ~lamp;
    end
    else begin
        lamp <= lamp;
    end
end

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_switch_button (
    output logic [TEST_WIDTH-1:0] test_array [TEST_LENGTH],
    output logic test_solved [TEST_LENGTH]
);

parameter integer TEST_LENGTH = 8;
parameter integer TEST_WIDTH = 3;

logic signal_a, signal_b, signal_out, clk;
logic vec_signal_a [TEST_LENGTH] = '{1,1,0,0,1,0,0,1};
logic vec_signal_b [TEST_LENGTH] = '{0,0,1,1,0,1,1,0};
logic vec_result [TEST_LENGTH];
logic vec_expected [TEST_LENGTH] = '{1,0,1,0,1,0,1,0};
int length;

module_switch_button dut (
    .clk(clk),
    .button_a(signal_a),
    .button_b(signal_b),
    .lamp(signal_out)
);

initial begin
    clk = 0;
    forever #4 clk=~clk;
end

initial begin
    for (length = 0; length < TEST_LENGTH; length = length + 1) begin
        @ (negedge clk)
        #1;
        signal_a = vec_signal_a[length];
        signal_b = vec_signal_b[length];
        @ (posedge clk)
        #1;
        test_array[length][0] = signal_a;
        test_array[length][1] = signal_b;
        test_array[length][2] = signal_out;
        vec_result[length] = signal_out;
        test_solved[length] = (vec_result[length] == vec_expected[length]);
        #1;
        signal_a = 0;
        signal_b = 0;
        #21;
    end
    $display("\n");
    $display("=================================================");
    $display("| button_a | button_b |   lamp   |   Solved?    |");
    $display("=================================================");

    for (int i = 0; i < TEST_LENGTH; i = i + 1) begin
        $display("|     %b    |     %b    |    %b     |      %s      |", 
            test_array[i][0], 
            test_array[i][1], 
            test_array[i][2], 
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
lesson_id: 409
lesson_title: "4.9 Übung: Wahrheitswerte"
difficulty: "intermediate"
duration_min: 10
type: "exercise"
-->

### 4.9 Übung: Wahrheitswerte
- Wahrheitswerte können am Anfang etwas verwirren, weshalb es sehr sinnvoll ist, sie selbst nachzubauen und genau dies ist Ihre nächste Aufgabe.
- Hierbei können die Eingangssignale nur 1'b0 oder 1'b1 annehmen, wodurch der Aufwand reduziert wird. Normalerweise werden natürlich größere Mengen an Bits verglichen.
- Nutzen Sie alle bisher behandelten Logikgatter, inklusive OR und XOR.

**EXERCISE_START**
```verilog
module module_truth_gates(
    input logic signal_a_in,
    input logic signal_b_in,
    output logic signal_a_equals_b_out,
    output logic signal_a_less_b_out,
    output  logic signal_a_greater_b_out
);

// Code hier einfügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_truth_gates(
    input logic signal_a_in,
    input logic signal_b_in,
    output logic signal_a_equals_b_out,
    output logic signal_a_less_b_out,
    output logic signal_a_greater_b_out
);

logic signal_a_xor_b;
logic signal_not_a;
logic signal_not_b;

always_comb begin
    signal_a_xor_b = signal_a_in ^ signal_b_in;
    signal_not_a = ~signal_a_in;
    signal_not_b = ~signal_b_in;
end

assign signal_a_equals_b_out = ~signal_a_xor_b;
assign signal_a_less_b_out = signal_not_a & signal_b_in;
assign signal_a_greater_b_out = signal_not_b & signal_a_in;

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_truth_gates #(
    parameter integer TEST_LENGTH = 4,
    parameter integer TEST_WIDTH = 5
) (
    output logic [TEST_WIDTH-1:0] test_array [TEST_LENGTH],
    output logic test_solved [TEST_LENGTH]
);

logic signal_a, signal_b, expected_aeqb, expected_alessb, expected_agreaterb, signal_a_equals_b, signal_a_less_b, signal_a_greater_b;
int length;

module_truth_gates dut (
    .signal_a_in(signal_a),
    .signal_b_in(signal_b),
    .signal_a_equals_b_out(signal_a_equals_b),
    .signal_a_less_b_out(signal_a_less_b),
    .signal_a_greater_b_out(signal_a_greater_b)
);

initial begin
    for (length = 0; length < TEST_LENGTH; length = length + 1) begin
        signal_a = length[0];
        signal_b = length[1];

        #1;

        test_array[length][0] = signal_a;
        test_array[length][1] = signal_b;
        test_array[length][2] = signal_a_equals_b;
        test_array[length][3] = signal_a_less_b;
        test_array[length][4] = signal_a_greater_b;
        expected_aeqb = (signal_a == signal_b);
        expected_alessb = (signal_a < signal_b);
        expected_agreaterb = (signal_a > signal_b);
        test_solved[length] = ((signal_a_equals_b === expected_aeqb) && (signal_a_less_b === expected_alessb) && (signal_a_greater_b === expected_agreaterb));

        #1;
    end
    $display("\n");
    $display("===================================================================");
    $display("| signal_a | signal_b | A == B | A < B  | A > B  |   Solved?    |");
    $display("===================================================================");

    for (int i = 0; i < TEST_LENGTH; i = i + 1) begin
        $display("|     %b    |     %b    |   %b    |   %b    |   %b    |      %s      |", 
            test_array[i][0],   // signal_a_in
            test_array[i][1],   // signal_b_in
            test_array[i][2],   // signal_a_equals_b_out
            test_array[i][3],   // signal_a_less_b_out
            test_array[i][4],   // signal_a_greater_b_out
            test_solved[i] ? "✅" : "❌"
        );
    end
    $display("===================================================================\n");
    $finish;
end
endmodule
```
**TESTBENCH_END**

---

<!--
lesson_id: 410
lesson_title: "4.10 If: Wenn x, dann y"
difficulty: "beginner"
duration_min: 10
type: "theory"
-->

### 4.10 If: Wenn x, dann y
- Momentan führt unser Code jede Anweisung einfach stumpf aus, allerdings wollen wir manchmal Code nur unter bestimmten Umständen ausführen.
- Hierfür gibt es, wie in High Level Sprachen, das **if**, **else if** und **else**.
- Hierbei hat immer das **erste if Priorität** und es wird aus einem if Block nur eine Anweisung ausgeführt.
> Es sollte **immer** ein **else** angegeben sein, da sonst unklar ist, was das Synthesetool macht, wenn keiner der Fälle eintritt. Hierbei kann ein ungewollter Latch entstehen, welcher falsche Daten speichert.
> Außerdem ist zu beachten, dass man auch nur auf eine Variable prüfen kann. Hierbei ist True, wenn "signal != 0" und False bei "signal == 0".

> **WICHTIG:** If-Statements müssen immer innerhalb von always Blöcken stehen.

```verilog
module module_if(
    input signal_a_in,
    input signal_b_in,
    output signal_1_out,
    output signal_2_out,
    output signal_3_out
);
logic signal_1;
logic signal_2;
logic signal_3;

always @ (*) begin
     if (signal_a_in == signal_b_in) begin
        signal_1 = 1'b1;
        signal_2 = 1'b0;
        signal_3 = 1'b0;
     end
     else if ((signal_a_in == 1'b1) && !(signal_b_in == 1'b1)) begin
        signal_1 = 1'b0;
        signal_2 = 1'b1;
        signal_3 = 1'b0;
     end
     else begin
        signal_1 = 1'b0;
        signal_2 = 1'b0;
        signal_3 = 1'b1;
     end
end

assign signal_1_out = signal_1;
assign signal_2_out = signal_2;
assign signal_3_out = signal_3;

endmodule
```

---

<!--
lesson_id: 411
lesson_title: "4.11 Übung: Priority If"
difficulty: "advanced"
duration_min: 10
type: "exercise"
-->

### 4.11 Übung: Priority If
- Nun sollen Sie versuchen, die if Funktion nachzubauen. Hierbei ist Ihnen der "normale" Code in Verilog gegeben und Sie sollen diesen ohne "if" realisieren.

**Vorgabe:**
```verilog
module module_if(
    input logic signed [3:0] a_in,
    input logic signed [3:0] b_in,
    input logic [3:0] m_unsigned_in,
    input logic [3:0] n_unsigned_in,
    output logic signed [3:0] signal_out
);

always_comb begin
    if (m_unsigned_in == n_unsigned_in) begin
        signal_out = a_in;
    end
    else if (m_unsigned_in > n_unsigned_in) begin
        signal_out = b_in;
    end
    else begin
        signal_out = 4'sb1100;
    end
end

endmodule
```

**EXERCISE_START**
```verilog
module module_if(
// Ports hier einfügen
);

// Code hier einfügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_if(
    input logic signed [3:0] a_in,
    input logic signed [3:0] b_in,
    input logic [3:0] m_unsigned_in,
    input logic [3:0] n_unsigned_in,
    output logic signed [3:0] signal_out
);

logic [3:0] signal_intermediate;
logic eq_true, gr_true;
logic [3:0] if_true, else_if_true, else_true, el_if;

always_comb begin
    eq_true = (m_unsigned_in == n_unsigned_in);             // Wahr, wenn m = n
    gr_true = (m_unsigned_in > n_unsigned_in);              // Wahr, wenn m > n

    if_true = (a_in) & ({4{eq_true}});                      // AND von eq_true und a_in, wenn True wird a_in weitergeleitet, wenn False, wird Null weitergeleitet.
    else_if_true = (b_in & {4{gr_true}});                   // Siehe oben
    else_true = ((4'sb1100) & ({4{~gr_true}}));             // Siehe oben

    signal_intermediate = (else_if_true | else_true);       // OR rückwärts durch den If-Block. Mindestens eines der Signale ist gleich Null, somit wird das andere oder Null weitergeleitet.
    el_if = signal_intermediate & ({4{~eq_true}});          // In diesem Fall ist es nicht möglich, dass zwei Fälle gleichzeitig True sind, dies ist im Normalfall allerdings möglich,
                                                            // weswegen wir die Priorität garantieren müssen.
    signal_out = if_true |  el_if;                          // Zusammenführen der letzten beiden Signale, hier ist wieder maximal eines ungleich Null.
end

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_if #(
    parameter integer TEST_LENGTH = 3,
    parameter integer TEST_WIDTH = 20
) (
    output logic [TEST_WIDTH-1:0] test_array [TEST_LENGTH],
    output logic test_solved [TEST_LENGTH]
);
 
logic signed [3:0]  signal_a, signal_b;
logic signed [3:0] signal_out;
logic [3:0] m_unsigned, n_unsigned;
logic signed [3:0] signal_list_a [TEST_LENGTH] = '{4'sd3, 4'sd2, -4'sd1};
logic signed [3:0] signal_list_b [TEST_LENGTH] = '{4'sd4, -4'sd2, -4'sd2};
logic [3:0] signal_list_m [TEST_LENGTH] = '{4'd0, 4'd15, 4'd7};
logic [3:0] signal_list_n [TEST_LENGTH] = '{4'd0, 4'd0, 4'd8};
logic signed [3:0] expected_list [TEST_LENGTH] = '{4'sd3, -4'sd2, 4'sb1100};
int length;

module_if dut (
    .a_in(signal_a),
    .b_in(signal_b),
    .m_unsigned_in(m_unsigned),
    .n_unsigned_in(n_unsigned),
    .signal_out(signal_out)
);

initial begin
    for (length = 0; length < TEST_LENGTH; length = length + 1) begin
        signal_a = signal_list_a[length];
        signal_b = signal_list_b[length];
        m_unsigned = signal_list_m[length];
        n_unsigned = signal_list_n[length];

        #1;

        test_array[length][3:0] = signal_a;
        test_array[length][7:4] = signal_b;
        test_array[length][11:8] = m_unsigned;
        test_array[length][15:12] = n_unsigned;
        test_array[length][19:16] = signal_out;
        test_solved[length] = (signal_out === expected_list[length]);

        #1;
    end
    $display("\n");
    $display("=========================================================");
    $display("| a_in | b_in | m_in | n_in | signal_out |  Solved? |");
    $display("=========================================================");

    for (int i = 0; i < TEST_LENGTH; i = i + 1) begin
        $display("| %b | %b | %b | %b |    %b    |    %s    |", 
            test_array[i][3:0],   // a_in
            test_array[i][7:4],   // b_in
            test_array[i][11:8],  // m
            test_array[i][15:12], // n
            test_array[i][19:16], // out
            test_solved[i] ? "✅" : "❌"
        );
    end
    $display("=========================================================\n");
    $finish;
end
endmodule
```
**TESTBENCH_END**

---

<!--
lesson_id: 412
lesson_title: "4.12 Case: If nur anders"
difficulty: "beginner"
duration_min: 10
type: "theory"
-->

### 4.12 Case: If nur anders
- Hat man einen **langen if-Block**, welcher **eine Variable** auf **verschiedene Zustände** prüft, ist es meist ratsam einen **case-Block** zur Übersichtlichkeit zu nutzen.
- Hierbei prüft case, ob der Wert vor den Doppelpunkten mit dem des Signals im Kopf der Funktion übereinstimmt.
- Man sollte immer einen default-case angeben, sodass falls keines der cases zutrifft, das Synthesetool weiß, was zu tun ist. Dieser default kann mehrere Zwecke haben, von einem "Error-Anzeiger" bis zu einem "Don't care" Wert.
- Falls mehrere cases auf den gleichen Wert prüfen wird immer der oberste ausgeführt.
> **WICHTIG:** Case-Statements müssen immer innerhalb von always Blöcken stehen.

```verilog
module module_case(
    input [3:0] signal_a_in,
    input signal_b_in,
    output signal_out
);

always @ (*) begin
    case (signal_a_in)
        4'd1: signal_out = 1'b1;
        4'd7: signal_out = 1'b1;
        default: begin
            signal_out = 1'b0;
        end
    endcase
end

endmodule
```

---

<!--
lesson_id: 413
lesson_title: "4.13 Bedingte Zuweisung"
difficulty: "beginner"
duration_min: 10
type: "theory"
-->

### 4.13 Bedingte Zuweisung
- Wenn man nur a oder b Zuweisen möchte, kann man auch die bedingte Zuweisung verwenden.
- Hierbei wird das hintere Signal bei False und das vordere bei True zugewiesen.
> Bedingte Zuweisungen, anders als If oder Case, können auch ausserhalb von always Blöcken mittels assign stehen.

```verilog
module module_conditional(
    input signal_a_in,
    input signal_b_in,
    output signal_out
);

assign signal_out = signal_a_in ? signal_b_in : 1'b0;

endmodule
```

---

<!--
lesson_id: 500
lesson_title: "5. Arithmetische Operationen"
difficulty: "beginner"
duration_min: 1
type: "theory"
-->

## 5. Arithmetische Operationen
- Nach den logischen Operationen wenden wir uns nun den eingebauten arithmetischen Funktionen zu.

---

<!--
lesson_id: 501
lesson_title: "5.1 Bit-Shifts"
difficulty: "beginner"
duration_min: 10
type: "theory"
-->

### 5.1 Bit-Shifts
- Manchmal möchte man innerhalb einer Leitung Bits verschieben, sodass alle Bits zum Beispiel um eins nach links verschoben sind und das letzte Bit mit 0 gefüllt wird.
- Dies geht mittels Bitshifts. Ein **Linksshift** wird hierbei durch **<<** ausgedrückt.
- Bei den Rechtsshift muss man unterscheiden, da es einen Unterschied zwischen dem arithmetischen und logischen Rechtsshift gibt.
- **Logischer Rechtsshift**: Füllt immer das MSB mit 0 auf und wird mit **>>** geschrieben.
- **Arithmetischer Rechtsshift**: Füllt das **MSB** mit dem **Alten MSB** (Vorzeichen) auf, solange die **Leitung signed** ist, **sonst** mit **0**. Er wird mit **>>>** geschrieben.
- Die Shifts funktionieren wie jede andere Zusweisung, nur dass man nach dem Operator die Anzahl zu shiftender Stellen angibt.
- Hierbei sollte man auf die Größe der Shifts acht geben, da jeder **Shift** um n Stellen mit einer **Multiplikation mit oder Division durch 2<sup> n</sup> gleichzusetzen** ist.

>**ACHTUNG:** Man kann nicht um negative Zahlen shiften. Diese werden direkt in riesige positive Zahlen umgewandelt.

- An sich gibt es einen Logischen Linksshift << und arithmetischen Linksshift <<<, allerdings funktionieren beide genau gleich.

```verilog
module module_shift(
    input signed [7:0] signal_in,
    input [3:0] shift_amount_in,
    output [7:0] signal_leftShifted_out,
    output [7:0] signal_logicRightShifted_out,
    output [7:0] signal_arithmeticRightShifted_out
);

assign signal_leftShifted_out = signal_in << shift_amount_in;
assign signal_logicRightShifted_out = signal_in >> shift_amount_in;
assign signal_arithmeticRightShifted_out = signal_in >>> shift_amount_in;

endmodule
```

---

<!--
lesson_id: 502
lesson_title: "5.2 Übung: 2 zu 4 Binärer Dekodierer"
difficulty: "beginner"
duration_min: 10
type: "exercise"
-->

### 5.2 Übung: 2 zu 4 Binärer Dekodierer
- In dieser Aufgabe sollen Sie einen Dekodierer bauen, welcher aus einer 2 Bit Zahl den zugehörigen Ausgang mit High füttert.

**EXERCISE_START**
```verilog
module module_2_bit_decoder(
    input logic [1:0] a_in,
    output logic [3:0] a_out
);

// Code hier einfügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_2_bit_decoder(
    input logic [1:0] a_in,
    output logic [3:0] a_out
);

assign a_out = 4'b0001 << a_in;

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_2_bit_decoder #(
    parameter integer TEST_LENGTH = 4,
    parameter integer TEST_WIDTH = 6,
    parameter integer TEST_LENGTH_BITS = $clog2(TEST_LENGTH)
) (
    output logic [TEST_WIDTH-1:0] test_array [TEST_LENGTH],
    output logic test_solved [TEST_LENGTH]
);

logic [TEST_LENGTH_BITS-1:0]  signal_a;
logic [3:0] expected, signal_out;
int length;

module_2_bit_decoder dut (
    .a_in(signal_a),
    .a_out(signal_out)
);

initial begin
    for (length = 0; length < TEST_LENGTH; length = length + 1) begin
        signal_a = length[TEST_LENGTH_BITS-1:0];

        #1;

        test_array[length][1:0] = signal_a;
        test_array[length][5:2] = signal_out;
        expected = 4'b0001 << signal_a;
        test_solved[length] = (signal_out === expected);

        #1;
    end
    $display("\n");
    $display("==============================");
    $display("| a_in | a_out |   Solved?   |");
    $display("==============================");

    for (int i = 0; i < TEST_LENGTH; i = i + 1) begin
        $display("|  %b  | %b  |      %s     |", 
            test_array[i][1:0],     // a_in
            test_array[i][5:2],     // a_out
            test_solved[i] ? "✅" : "❌"
        );
    end
    $display("==============================\n");
    $finish;
end
endmodule
```
**TESTBENCH_END**

---

<!--
lesson_id: 503
lesson_title: "5.3 Übung: Erweitern auf 3 zu 8 Binärer Dekodierer"
difficulty: "beginner"
duration_min: 10
type: "exercise"
-->

### 5.3 Übung: Erweitern auf 3 zu 8 Binärer Dekodierer
- Erweitern Sie nun ihren Dekodierer auf 3-8.

**EXERCISE_START**
```verilog
module module_3_bit_decoder(
    input logic [2:0] a_in,
    output logic [7:0] a_out
);

// Code hier einfügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_3_bit_decoder(
    input logic [2:0] a_in,
    output logic [7:0] a_out
);

assign a_out = 8'h01 << a_in;

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_3_bit_decoder #(
    parameter integer TEST_LENGTH = 8,
    parameter integer TEST_WIDTH = 11,
    parameter integer TEST_LENGTH_BITS = $clog2(TEST_LENGTH)
) (
    output logic [TEST_WIDTH-1:0] test_array [TEST_LENGTH],
    output logic test_solved [TEST_LENGTH]
);

logic [TEST_LENGTH_BITS-1:0]  signal_a;
logic [7:0] expected, signal_out;
int length;

module_3_bit_decoder dut (
    .a_in(signal_a),
    .a_out(signal_out)
);

initial begin
    for (length = 0; length < TEST_LENGTH; length = length + 1) begin
        signal_a = length[TEST_LENGTH_BITS-1:0];

        #1;

        test_array[length][2:0] = signal_a;
        test_array[length][10:3] = signal_out;
        expected = 1'b1 << signal_a;
        test_solved[length] = (signal_out === expected);

        #1;
    end
    $display("\n");
    $display("=======================================");
    $display("| a_in |   a_out  |      Solved?      |");
    $display("=======================================");

    for (int i = 0; i < TEST_LENGTH; i = i + 1) begin
        $display("|  %b | %b |         %s        |", 
            test_array[i][2:0],     // a_in
            test_array[i][10:3],    // a_out
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
lesson_id: 504
lesson_title: "5.4 Arithmetische Operationen: Addition und Subtraktion"
difficulty: "beginner"
duration_min: 10
type: "theory"
-->

### 5.4 Arithmetische Operationen: Addition und Subtraktion
- Man kann zwar aus Grundgattern Addierer bauen, wie Sie auch später selbst ausprobieren sollen, allerdings ist dies bei großen Projekten eher nervig als eine wirkliche Herausforderung.
- Hierfür gibt es direkt eingebaute Befehle, welche selbst das Zweierkomplement automatisch umsetzen.
- Diese sind so einfach, wie in der Mathematik Plus **+ für Addition** und **- für Subtraktion**.

> **Achtung:** Bei der **Addition** zweier Zahlen kann der Carry überlaufen. Um dem entgegenzuwirken, muss man das Ergebnis einer um 1 Bit größeren Leitung zuweisen. Hierbei macht Verilog eine Vergrößerung der Signalbreite (Kap. 3 Anpassen der Signalbreite), um den Verlust zu verhindern. Dasselbe gilt für die **Subtraktion** von zwei **signed-Signalen**.

> **Besonders Wichtig:** Bei vorzeichenloser Subtraktion würde bei der Berechnung von 2'b00 minus 2'b01 das Ergebnis 2'b11 resultieren. Da allerdings das Signal vorzeichenlos ist, wird dies als positive falsche Zahl gedeutet, ein **Wrap-around** entsteht. Hierbei gilt höchste Vorsicht: Wenn nur ein Signal in der Berechnung unsigned ist, wird die komplette Rechnung unsigned ausgeführt. Hierbei würde die Erweiterung der Signalbreite nicht helfen.

```verilog
module module_plus_minus(
    input signed [7:0] signal_a_in,
    input signed [7:0] signal_b_in,
    output signed [8:0] signal_a_plus_b_out,
    output signed [8:0] signal_a_minus_b_out
);

assign signal_a_plus_b_out = signal_a_in + signal_b_in;
assign signal_a_minus_b_out = signal_a_in - signal_b_in;

endmodule
```

---

<!--
lesson_id: 505
lesson_title: "5.5 Übung: Halbaddierer"
difficulty: "beginner"
duration_min: 10
type: "exercise"
-->

### 5.5 Übung: Halbaddierer
- Nun sollen Sie zeigen, was Sie gelernt haben.
- Verwenden Sie alle bekannten Gatter (kein +) um einen Halbaddierer zu bauen.
- Ein Halbaddierer hat zwei Signale als Input und gibt die Summe und den Carry (Übertrag) aus.
- **Tipp:** Betrachten Sie die beiden Outputs separat und zeichnen Sie sich wieder für beide die Wahrheitstabellen.
- Nutzen Sie alle bisher behandelten Gatter, inklusive or und xor.

**EXERCISE_START**
```verilog
module module_halfadder(
    input logic a_in,
    input logic b_in,
    output logic sum_out,
    output logic carry_out
);

// Hier Code einfügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_halfadder(
    input logic a_in,
    input logic b_in,
    output logic sum_out,
    output logic carry_out
);

assign sum_out = a_in ^ b_in;
assign carry_out = a_in & b_in;

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_halfadder #(
    parameter integer TEST_LENGTH = 4,
    parameter integer TEST_WIDTH = 4
) (
    output logic [TEST_WIDTH-1:0] test_array [TEST_LENGTH],
    output logic test_solved[TEST_LENGTH]
);

logic signal_a, signal_b, carry_out, sum_out, expected_sum, expected_carry;
int length;

module_halfadder dut (
    .a_in(signal_a),
    .b_in(signal_b),
    .sum_out(sum_out),
    .carry_out(carry_out)
);

initial begin
    for (length = 0; length < TEST_LENGTH; length = length + 1) begin
        signal_a = length[0];
        signal_b = length[1];

        #1;

        test_array[length][0] = signal_a;
        test_array[length][1] = signal_b;
        test_array[length][2] = sum_out;
        test_array[length][3] = carry_out;
        expected_sum = signal_a ^ signal_b;
        expected_carry = signal_a & signal_b;
        test_solved[length] = (sum_out == expected_sum) && (carry_out == expected_carry);

        #1;
    end
    $display("\n");
    $display("=========================================================");
    $display("| a_in | b_in | sum_out | carry_out |      Solved?      |");
    $display("=========================================================");

    for (int i = 0; i < TEST_LENGTH; i = i + 1) begin
        $display("|   %b  |   %b  |    %b    |     %b     |         %s        |", 
            test_array[i][0],   // a_in
            test_array[i][1],   // b_in
            test_array[i][2],   // sum_out
            test_array[i][3],   // carry_out
            test_solved[i] ? "✅" : "❌"
        );
    end
    $display("=========================================================\n");
    $finish;
end
endmodule
```
**TESTBENCH_END**

---

<!--
lesson_id: 506
lesson_title: "5.6 Übung: Volladdierer"
difficulty: "intermediate"
duration_min: 10
type: "exercise"
-->

### 5.6 Übung: Volladdierer
- Da wir nun einen funktionierenden Halbaddierer haben ist Ihnen wahrscheinlich schon aufgefallen, dass wir noch keinen Eingang für den Carry, also den Übertrag haben.
- Dies unterscheidet den Halb- zum Volladdierer.
- Versuchen Sie nun Ihr Design des Halbaddierer abzuwandeln, sodass er drei Inputs und zwei Outputs hat.
- Nutzen Sie alle bisher behandelten Gatter, inklusive OR und XOR.

[//]: # (Frage an Studis: Warum baut man den Carry in echten Chips mit ^, anstatt mit |? Sind beide nicht gleich? ... carry_out = 'a & b' | 'b & carry_in' | 'a & carry_in' vs carry_out = 'a & b' | 'carry_in & 'a ^ b'' <-- Wiederverwendbarkeit) 

**EXERCISE_START**
```verilog
module module_fulladder(
    input logic a_in,
    input logic b_in,
    input logic carry_in,
    output logic sum_out,
    output logic carry_out
);

// Hier Code einfügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_fulladder(
    input logic a_in,
    input logic b_in,
    input logic carry_in,
    output logic sum_out,
    output logic carry_out
);

logic a_and_b;
logic a_xor_b;
logic c_and_xor;

always_comb begin
    a_and_b = a_in & b_in;
    a_xor_b = a_in ^ b_in;
    c_and_xor = carry_in & a_xor_b;
end

assign sum_out = a_xor_b ^ carry_in;
assign carry_out = a_and_b | c_and_xor;

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_fulladder #(
    parameter integer TEST_LENGTH = 8,
    parameter integer TEST_WIDTH = 5
) (
    output logic [TEST_WIDTH-1:0] test_array [TEST_LENGTH],
    output logic test_solved [TEST_LENGTH]
);

logic signal_a, signal_b, carry_out, sum_out, expected_sum, expected_carry, carry_in;
int length;

module_fulladder dut (
    .a_in(signal_a),
    .b_in(signal_b),
    .carry_in(carry_in),
    .sum_out(sum_out),
    .carry_out(carry_out)
);

initial begin
    for (length = 0; length < TEST_LENGTH; length = length + 1) begin
        signal_a = length[0];
        signal_b = length[1];
        carry_in = length[2];

        #1;

        test_array[length][0] = signal_a;
        test_array[length][1] = signal_b;
        test_array[length][2] = carry_in;
        test_array[length][3] = sum_out;
        test_array[length][4] = carry_out;
        expected_sum = signal_a ^ signal_b ^ carry_in;
        expected_carry = (signal_a & signal_b) | (carry_in & (signal_a ^ signal_b));
        test_solved[length] = (sum_out === expected_sum) && (carry_out === expected_carry);

        #1;
    end
    $display("\n");
    $display("===================================================================");
    $display("| a_in | b_in | carry_in | sum_out | carry_out |    Solved?     |");
    $display("===================================================================");

    for (int i = 0; i < TEST_LENGTH; i = i + 1) begin
        $display("|  %b   |  %b   |    %b     |    %b    |     %b     |       %s       |", 
            test_array[i][0], // a_in
            test_array[i][1], // b_in
            test_array[i][2], // carry_in
            test_array[i][3], // sum_out
            test_array[i][4], // carry_out
            test_solved[i] ? "✅" : "❌"
        );
    end
    $display("===================================================================\n");
    $finish;
end
endmodule
```
**TESTBENCH_END**

---

<!--
lesson_id: 507
lesson_title: "5.7 Übung: Subtraktion durch Addition"
difficulty: "intermediate"
duration_min: 10
type: "exercise"
-->

### 5.7 Übung: Subtraktion mittels Addition
- Eine Subtraktion direkt in Hardware einzubauen, ist schwierig und kann unnötig sein. (z.B. in CPUs)
- Um dies nachzuvollziehen sollen Sie nun die Subtraktion mittels der Addition und Regeln des Overflows nachbilden.
- Hierfür haben Sie drei Eingangssignale, wobei enable_subtract High ist, wenn statt Addition eine Subtraktion von a_in - b_in ausgeführt werden soll.
- Tipp: Achten Sie darauf, dass bei 4'shF +/- 4'shF das richtige Ergebnis berechnet wird.
- Tipp: Zweierkomplement

**EXERCISE_START**
```verilog
module module_subtract(
    input logic signed [3:0] a_in,
    input logic signed [3:0] b_in,
    input logic enable_subtract,
    output logic signed [4:0] result_out
);

// Hier Code einfügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_subtract(
    input logic signed [3:0] a_in,
    input logic signed [3:0] b_in,
    input logic enable_subtract,
    output logic signed [4:0] result_out
);

logic signed [3:0] b_one, b_two, second_summand;

always_comb begin
    b_one = ~b_in;
    b_two = b_one + 4'd1;

    if (enable_subtract) begin      // Multiplexer, welcher den zweieten Eingang der Additionseinheit steuert, sodass nur eine Addierer nötig ist,
        second_summand = b_two;     // statt aufwendig einen Addierer und eine Subtraktionseinheit zu bauen. (Nützlich z.B. in CPUs)
    end
    else begin
        second_summand = b_in;
    end

    result = 5'(a_in) + 5'(second_summand); // Erweitern auf 5 Bit für Overflow (würde auch automatisch passieren, aber ist gern gesehen, da nun direkt erkennbar)
end

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_subtract #(
    parameter integer TEST_LENGTH = 512,
    parameter integer TEST_WIDTH = 14
) (
    output logic [TEST_WIDTH-1:0] test_array [TEST_LENGTH],
    output logic test_solved [TEST_LENGTH]
);

logic [3:0] signal_a, signal_b;
logic [4:0] expected, signal_out;
int length;

module_subtract dut (
    .a_in(signal_a),
    .b_in(signal_b),
    .enable_subtract(enable_subtract),
    .result_out(signal_out)
);

initial begin
    for (length = 0; length < TEST_LENGTH; length = length + 1) begin
        signal_a = length[3:0];
        signal_b = length[7:4];
        enable_subtract = length[8];

        #1;

        test_array[length][3:0] = signal_a;
        test_array[length][7:4] = signal_b;
        test_array[length][8] = enable_subtract;
        test_array[length][13:9] = signal_out;

        if (enable_subtract) begin
            expected = 5'(signal_a) - 5'(signal_b);
        end
        else begin
            expected = 5'(signal_a) + 5'(signal_b);
        end

        test_solved[length] = (signal_out === expected);

        #1;
    end
    $display("\n");
    $display("==========================================================================");
    $display("|  a_in  |  b_in  | enable_subtract | result_out |       Solved?         |");
    $display("==========================================================================");

    for (int i = 0; i < TEST_LENGTH; i = i + 1) begin
        $display("|  %b  |  %b  |        %b        |   %b    |          %s          |", 
            test_array[i][3:0],   // a_in
            test_array[i][7:4],   // b_in
            test_array[i][8],     // enable_subtract
            test_array[i][13:9],  // result_out
            test_solved[i] ? "✅" : "❌"
        );
    end
    $display("==========================================================================\n");
    $finish;
end
endmodule
```
**TESTBENCH_END**

---

<!--
lesson_id: 508
lesson_title: "5.8 Arithmetische Operationen: Multiplikation"
difficulty: "beginner"
duration_min: 10
type: "theory"
-->

### 5.8 Arithmetische Operationen: Multiplikation
- Für die Multiplikation gilt dasselbe, wie für Addition und Subtraktion, allerdings muss man hierbei beachten, dass diese eine deutlich längere Zeit braucht, um durchgeführt zu werden.
- Auf die Zeit welche einzelne Operationen brauchen wird hierbei nochmal im Teil **"Warum und wann sollte man Speichern?"** eingegangen.
- Die Multiplikation kann, um sie schnell zu schreiben mittels **Stern \*** geschrieben werden.
>**Achtung:** Die **Bitgröße** des **Ergebnisses** **<u>MUSS</u>** mindestens die **Addition** der **Bitgrößen** der beiden **Eingangssignalen** sein, **sonst** werden die überstehenden Bit **gnadenlos abgeschnitten**.

> **WICHTIG:** Es ist nicht möglich alle Zahlen genau darzustellen. Im Gegensatz zum Zehnersystem ist zum Beispiel die 0.1 nicht endlich darstellbar. Somit muss man schauen, welche Genauigkeit überhaupt sinvoll ist und man nicht die Multiplikation mit 1.98569 auf 2 runden kann und somit einen viel schnelleren Bitshift um 1 nutzt. Hierbei ist die Bitbreite ein wichtiges Indiz, da diese entscheidet, ob die Zahl überhaupt verarbeitet werden kann.

```verilog
module module_multiplikation(
    input signed [7:0] signal_a_in,
    input signed [7:0] signal_b_in,
    output signed [15:0] signal_a_times_b_out
);

assign signal_a_times_b_out = signal_a_in * signal_b_in;

endmodule
```

---

<!--
lesson_id: 509
lesson_title: "5.9 Übung: Sequentieller Multiplikator"
difficulty: "intermediate"
duration_min: 10
type: "exercise"
-->

### 5.9 Übung: Sequentieller Multiplikator
- Manchmal ist es relativ egal, wie lange eine Multiplikation dauert. Um Platz zu sparen, kann man diese in einem Sequentiellen Multiplikator umsetzen.
- Er funktioniert mittels einfachem Aufaddierens über mehrere Takte und signalisiert, dass er fertig ist, mittels mult_finished auf High.
- Er ist auch bei sehr hohen Clock-Raten von Vorteil, da nur wenige Gatter pro Takt durchlaufen werden müssen.
- Bauen Sie nun selbst einen Sequentiellen Multiplikator, welcher sobald er fertig gerechnet hat sein Ergebnis sicher hält. Er soll trotz des Sequentiellen Designs sein Ergbnis so schnell wie möglich bereit stellen.
- Achtung: Bei der Multiplikation im Binären, ist die Bitbreite des Zielregisters immer die Addition der Bitbreiten der Eingangsregister.

**EXERCISE_START**
```verilog
module module_mult_seq(
    input logic clk_in,
    input logic [1:0] a_in,
    input logic [1:0] b_in,
    output logic [3:0] result_out,
    output logic mult_finished_out
);

logic [3:0] intermediate, counter;

// Hier Code einfügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_mult_seq(
    input logic clk_in,
    input logic [1:0] a_in,
    input logic [1:0] b_in,
    output logic [3:0] result_out,
    output logic mult_finished_out
);

logic [3:0] intermediate, counter;
logic [3:0] intermediate_comb, counter_comb;
logic [1:0] a_old, b_old;
logic [3:0] result;
logic mult_finished;

always_ff @(posedge clk_in) begin
    a_old <= a_in;
    b_old <= b_in;

    if ((a_in != a_old) || (b_in != b_old)) begin
        mult_finished <= 1'h0;
        counter <= 4'h1;
        intermediate <= a_in;
    end

    else if ((a_in == 2'd0) || (b_in == 2'd0)) begin
        result <= 4'h0;
        mult_finished <= 1'h1;
    end

    else if (counter == b_in) begin
        result <= intermediate;
        mult_finished <= 1'h1;
    end

    else begin
        counter <= counter_comb;
        intermediate <= intermediate_comb;
    end
end

always_comb begin
    intermediate_comb = intermediate + a_in;        // Es werden immer 2 Additionseinheiten benötigt.
    counter_comb = counter + 4'h1;
end

assign result_out = result;
assign mult_finished_out = mult_finished;

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_mult_seq #(
    parameter integer TEST_LENGTH = 16,
    parameter integer TEST_WIDTH = 9
) (
    output logic [TEST_WIDTH-1:0] test_array [TEST_LENGTH],
    output logic test_solved [TEST_LENGTH]
);

logic [1:0] signal_a, signal_b;
logic [3:0] expected, signal_out, repeater;
logic clk, mult_finished;
int length;

module_mult_seq dut (
    .clk_in(clk),
    .a_in(signal_a),
    .b_in(signal_b),
    .result_out(signal_out),
    .mult_finished_out(mult_finished)
);
initial begin
    clk = 1'b0;
end


always #1 clk = ~clk;

initial begin
    for (length = 0; length < TEST_LENGTH; length = length + 1) begin
        @(negedge clk);
        signal_a = length[1:0];
        signal_b = length[3:2];
        
        repeater = (signal_a > signal_b) ? signal_a : signal_b;

        repeat (repeater + 1) @(posedge clk);

        test_array[length][1:0] = signal_a;
        test_array[length][3:2] = signal_b;
        test_array[length][7:4] = signal_out;
        test_array[length][8] = mult_finished;

        expected = signal_a * signal_b;

        test_solved[length] = (signal_out === expected);

        @(posedge clk);
    end
    $display("\n");
    $display("===============================================================");
    $display("| a_in | b_in | mult_finished | result_out |     Solved?      |");
    $display("===============================================================");

    for (int i = 0; i < TEST_LENGTH; i = i + 1) begin
        $display("|  %b  |  %b  |       %b       |    %b    |        %s        |", 
            test_array[i][1:0],   // a_in
            test_array[i][3:2],   // b_in
            test_array[i][8],     // mult_finished
            test_array[i][7:4],   // result_out
            test_solved[i] ? "✅" : "❌"
        );
    end
    $display("===============================================================\n");
    $finish;
end
endmodule
```
**TESTBENCH_END**

---

<!--
lesson_id: 510
lesson_title: "5.10 Übung: Kombinatorischer Multiplikator"
difficulty: "intermediate"
duration_min: 10
type: "exercise"
-->

### 5.10 Übung: Kombinatorischer Multiplikator
- Wenn nun eine Multiplikation so schnell wie möglich durchgeführt werden soll, nimmt man einen Kombinatorischen Multiplikator.
- Dieser funktioniert gleich, wie die Schriftliche Multiplikation.
- Das normale Mal-Zeichen benutzt genau so einen Multiplikator und kann somit innerhalb eines Taktes ein Produkt liefern.
- Bauen Sie nun einen eigenen Kombinatorischen Multiplikator.
- Tipp: Falls Sie Schwierigkeiten haben den Algorithmus hinter dem Multiplikator zu entwickeln, versuchen Sie die schriftliche Multiplikation Schritt für Schritt durchzugehen.

**EXERCISE_START**
```verilog
module module_mult_comb(
    input logic [1:0] a_in,
    input logic [1:0] b_in,
    output logic [3:0] result_out
);

// Hier Code einfügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_mult_comb(
    input logic [1:0] a_in,
    input logic [1:0] b_in,
    output logic [3:0] result_out
);

logic [1:0] a_and_b_zero, a_and_b_one;

logic [3:0] intermediate_zero, intermediate_one, result;

always_comb begin
    a_and_b_zero = a_in & {2{b_in[0]}};
    a_and_b_one  = a_in & {2{b_in[1]}};

    intermediate_zero = 4'(a_and_b_zero);
    intermediate_one  = 4'(a_and_b_one) << 1'b1;

    result = intermediate_zero + intermediate_one;      // Die Anzahl der Additionen ist direkt Abhängig von der Bitbreite des schmalsten Einganges.
end                                                     // Bsp.: 64'd10 * 64'd10 ==> Gigantischer Hardwareaufwand im Vergleich zu Sequentiell

assign result_out = result;

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_mult_comb #(
    parameter integer TEST_LENGTH = 16,
    parameter integer TEST_WIDTH = 8
) (
    output logic [TEST_WIDTH-1:0] test_array [TEST_LENGTH],
    output logic test_solved [TEST_LENGTH]
);

logic [1:0] signal_a, signal_b;
logic [3:0] expected, signal_out;
int length;

module_mult_comb dut (
    .a_in(signal_a),
    .b_in(signal_b),
    .result_out(signal_out)
);

initial begin
    for (length = 0; length < TEST_LENGTH; length = length + 1) begin

        signal_a = length[1:0];
        signal_b = length[3:2];

        #1;

        test_array[length][1:0] = signal_a;
        test_array[length][3:2] = signal_b;
        test_array[length][7:4] = signal_out;

        expected = signal_a * signal_b;

        test_solved[length] = (signal_out === expected);

        #1;
    end
    $display("\n");
    $display("===============================================");
    $display("| a_in | b_in | result_out |     Solved?      |");
    $display("===============================================");

    for (int i = 0; i < TEST_LENGTH; i = i + 1) begin
        $display("|  %b  |  %b  |    %b    |        %s        |", 
            test_array[i][1:0],   // a_in
            test_array[i][3:2],   // b_in
            test_array[i][7:4],   // result_out
            test_solved[i] ? "✅" : "❌"
        );
    end
    $display("===============================================\n");
    $finish;
end
endmodule
```
**TESTBENCH_END**

---

<!--
lesson_id: 511
lesson_title: "5.11 Arithmetische Operationen: Division und Rest"
difficulty: "beginner"
duration_min: 10
type: "theory"
-->

### 5.11 Arithmetische Operationen: Division und Rest
- Zur Multiplikation gehört natürlich auch noch ihre Rückoperation die Division.
- Dabei wird diese mit dem **Schrägstrich /** und die **Restildung** mit dem **Prozentsymbol %** geschrieben.
- Hierbei wird immer bei der Benutzung von **/ oder %** das jeweils andere mitgeneriert, da dies gratis mitberechnet wird. Die Synthesetools sind hierfür wieder ausgelegt, dass man beide Befehle nebeneinander schreiben kann, jedoch nur einmal die Hardware verbaut wird, um beides (bei gleichen Inputs) zu bekommen.
> **WICHTIG:** Die Division, vor allem von großen Signalbreiten ist zeit- und ressourcenintensiv. Deshalb sollte man sich immer Fragen, ob eine Division wirklich nötig ist und man nicht einfacher mit dem Inversen multiplizieren könnte oder eine Rundung über einem Bitshift sinnvoller wäre. Mehr dazu in späteren Kapiteln **Bitbreiten: Warum nicht alles riesig?** und **"Warum und wann sollte man Speichern?"**.

```verilog
module module_division_remainder(
    input signed [7:0] signal_a_in,
    input signed [7:0] signal_b_in,
    output signed [7:0] signal_a_div_b_out,
    output signed [7:0] signal_a_rem_b_out
);

assign signal_a_div_b_out = signal_a_in / signal_b_in;
assign signal_a_rem_b_out = signal_a_in % signal_b_in;

endmodule
```

---

<!--
lesson_id: 512
lesson_title: "5.12 Übung: Sequentieller Multiplikator"
difficulty: "intermediate"
duration_min: 10
type: "exercise"
-->

### 5.12 Übung: Sequentielle Division
- Division in Hardware ist meist negativ behaftet. In diesen Übungen wollen wir uns anschauen, warum dies der Fall ist.
- Beginnen wir mit der einfacheren Variante, einem Sequentiellen Dividier.
- Dieser zieht jeden Zyklus b von a ab, bis dies nicht mehr möglich ist.
- Wie Sie gelernt haben, entsteht bei der Hardware Dividier immer gleich der Rest gratis mit, welchen Sie auch ausgeben sollen.
- Bauen Sie nun Ihren eigenen Sequentiellen Dividier, welcher a_in / b_in rechnet und Quotient, sowie Rest ausgibt. Er soll trotz des Sequentiellen Designs sein Ergbnis so schnell wie möglich bereit stellen. Bei der Division durch Null, soll der remainder Ausgang auf 3'b111 und der result Ausgang auf 3'000 gesetzt werden.

**EXERCISE_START**
```verilog
module module_div_seq(
    input logic clk_in,
    input logic [2:0] a_in,
    input logic [2:0] b_in,
    output logic [2:0] result_out,
    output logic [2:0] remainder_out,
    output logic div_finished_out
);

// Hier Code einfügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_div_seq(
    input logic clk_in,
    input logic [2:0] a_in,
    input logic [2:0] b_in,
    output logic [2:0] result_out,
    output logic [2:0] remainder_out,
    output logic div_finished_out
);

logic [2:0] intermediate_result, intermediate_result_comb, intermediate_remainder, intermediate_remainder_comb, a_old, b_old, result, remainder;
logic div_finished;

always_ff @(posedge clk_in) begin
    a_old                   <= a_in;
    b_old                   <= b_in;

    if ((a_in != a_old) || (b_in != b_old)) begin
        intermediate_remainder  <= a_in;
        div_finished            <= 1'b0;
        intermediate_result     <= 3'd0;
    end
    else if (b_in == 3'd0) begin
        result                  <= 3'b000;
        remainder               <= 3'b111;
        div_finished            <= 1'b1;
    end
    else if (intermediate_remainder >= b_in) begin
        intermediate_remainder  <= intermediate_remainder_comb;
        intermediate_result     <= intermediate_result_comb;
    end
    else begin
        result                  <= intermediate_result;
        remainder               <= intermediate_remainder;
        div_finished            <= 1'b1;
    end
end

always_comb begin
    intermediate_remainder_comb = intermediate_remainder - b_in;
    intermediate_result_comb    = intermediate_result + 3'd1;
end

assign result_out       = result;
assign remainder_out    = remainder;
assign div_finished_out = div_finished;

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_div_seq #(
    parameter integer TEST_LENGTH = 64,
    parameter integer TEST_WIDTH = 13
) (
    output logic [TEST_WIDTH-1:0] test_array [TEST_LENGTH],
    output logic test_solved [TEST_LENGTH]
);

logic [2:0] signal_a, signal_b, repeater, result_out, expected_result, remainder_out, expected_remainder;
logic clk, div_finished;
int length;

module_div_seq dut (
    .clk_in(clk),
    .a_in(signal_a),
    .b_in(signal_b),
    .result_out(result_out),
    .remainder_out(remainder_out),
    .div_finished_out(div_finished)
);
initial begin
    clk = 1'b0;
end


always #1 clk = ~clk;

initial begin
    for (length = 0; length < TEST_LENGTH; length = length + 1) begin
        @(negedge clk);
        signal_a = length[2:0];
        signal_b = length[5:3];

        if(signal_b == 0) begin
            repeater = 1;
        end
        else begin
            repeater = signal_a / signal_b;
        end
        repeat (repeater + 2) @(posedge clk);

        test_array[length][2:0] = signal_a;
        test_array[length][5:3] = signal_b;
        test_array[length][8:6] = result_out;
        test_array[length][11:9] = remainder_out;
        test_array[length][12]   = div_finished;

        if (signal_b == 0) begin
            expected_result = 3'd0;
            expected_remainder = 3'b111;
        end
        else begin
            expected_result = signal_a / signal_b;
            expected_remainder = signal_a % signal_b;
        end

        test_solved[length] = ((result_out === expected_result) && (remainder_out === expected_remainder) && (div_finished === 1'b1));

        @(posedge clk);
    end
    $display("\n");
    $display("=========================================================================");
    $display("| a_in | b_in | div_finished | result_out | remainder_out |   Solved?   |");
    $display("=========================================================================");

    for (int i = 0; i < TEST_LENGTH; i = i + 1) begin
        $display("|  %b |  %b |       %b      |     %b    |      %b      |      %s     |", 
            test_array[i][2:0],   // a_in
            test_array[i][5:3],   // b_in
            test_array[i][12],    // div_finished
            test_array[i][8:6],   // result_out
            test_array[i][11:9],  // remainder_out
            test_solved[i] ? "✅" : "❌"
        );
    end
    $display("=========================================================================\n");
    $finish;
end
endmodule
```
**TESTBENCH_END**

---

<!--
lesson_id: 513
lesson_title: "5.13 Übung: Kombinatorische Divison"
difficulty: "intermediate"
duration_min: 10
type: "exercise"
-->

### 5.13 Übung: Kombinatorische Division
- Manchmal braucht man das Ergebnis einer Division schon im nächsten Takt.
- Hierfür nutzt man Kombinatorische Dividier, welche auch bei den eingebauten Funktionen / und % eingesetzt werden.
- Um nachvollziehen zu können, warum Divisionseinheiten negativ im Licht stehen, sollen Sie Ihre eigene bauen.
- Bei einer Division durch Null sollen wieder der remainder_out auf 3'b111 und result_out auf 3'b000 gesetzt werden.

**EXERCISE_START**
```verilog
module module_div_comb(
    input logic [2:0] a_in,
    input logic [2:0] b_in,
    output logic [2:0] result_out,
    output logic [2:0] remainder_out
);

// Hier Code einfügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_div_comb(
    input logic [2:0] a_in,
    input logic [2:0] b_in,
    output logic [2:0] result_out,
    output logic [2:0] remainder_out
);

logic [2:0] result, remainder;

always_comb begin
    result                  = 3'd0;
    remainder               = 3'd0;

    if (b_in == 3'd0) begin
        result              = 3'b000;
        remainder           = 3'b111;
    end
    else begin
        remainder = {remainder[1:0], a_in[2]};
        if (remainder >= b_in) begin
            result[2]       = 1'b1;
            remainder       = remainder - b_in;
        end

        remainder = {remainder[1:0], a_in[1]};
        if (remainder >= b_in) begin
            result[1]       = 1'b1;
            remainder       = remainder - b_in;
        end

        remainder = {remainder[1:0], a_in[0]};
        if (remainder >= b_in) begin
            result[0]       = 1'b1;
            remainder       = remainder - b_in;
        end
    end
end

assign result_out       = result;
assign remainder_out    = remainder;

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_div_comb #(
    parameter integer TEST_LENGTH = 64,
    parameter integer TEST_WIDTH = 12
) (
    output logic [TEST_WIDTH-1:0] test_array [TEST_LENGTH],
    output logic test_solved [TEST_LENGTH]
);

logic [2:0] signal_a, signal_b, expected_remainder, expected_result, remainder_out, result_out;
int length;

module_div_comb dut (
    .a_in(signal_a),
    .b_in(signal_b),
    .result_out(result_out),
    .remainder_out(remainder_out)
);

initial begin
    for (length = 0; length < TEST_LENGTH; length = length + 1) begin

        signal_a = length[2:0];
        signal_b = length[5:3];

        #1;

        test_array[length][2:0]     = signal_a;
        test_array[length][5:3]     = signal_b;
        test_array[length][8:6]     = result_out;
        test_array[length][11:9]    = remainder_out;

        if (signal_b == 0) begin
            expected_result     = 3'b000;
            expected_remainder  = 3'b111;
        end
        else begin
            expected_result     = signal_a / signal_b;
            expected_remainder  = signal_a % signal_b;
        end

        test_solved[length] = ((result_out === expected_result) && (remainder_out === expected_remainder));

        #1;
    end
    $display("\n");
    $display("==========================================================");
    $display("| a_in | b_in | result_out | remainder_out |   Solved?   |");
    $display("==========================================================");

    for (int i = 0; i < TEST_LENGTH; i = i + 1) begin
        $display("|  %b |  %b |     %b    |      %b      |      %s     |", 
            test_array[i][2:0],   // a_in
            test_array[i][5:3],   // b_in
            test_array[i][8:6],   // result_out
            test_array[i][11:9],  // remainder_out
            test_solved[i] ? "✅" : "❌"
        );
    end
    $display("===========================================================\n");
    $finish;
end
endmodule
```
**TESTBENCH_END**

---

<!--
lesson_id: 600
lesson_title: "6. Startbedingungen und Moduling"
difficulty: "intermediate"
duration_min: 1
type: "theory"
-->

## 6. Startbedingungen und Moduling
- Wenn man intern zählen möchte, muss man bei einer Zahl beginnen. Aber woher weiß das Modul, bei welchem Wert es beginnen soll?
- Um dies und weitere Code-Qualität geht es im nächsten Kapitel.

---

<!--
lesson_id: 601
lesson_title: "6.1 Anfangswerte"
difficulty: "intermediate"
duration_min: 10
type: "theory"
-->

### 6.1 Anfangswerte
- Wenn man seinen FPGA hochfährt oder etwas simulieren möchte, weiß man anfangs nicht, welche Werte überhaupt in den Registern gespeichert sind.
- Um deterministisch festzulegen, welche Werte anfangs gespeichert sind, baut man reset-Blöcke ein.
- Hierbei kann man sich aussuchen, ob man active-low oder active-high resetten möchte. Hierbei kann es nützlich sein zu achten, ob der FPGA einen Pullup oder Pulldown am Input hat, da man so beim Kappen der Leitung das Programm automatisch beenden kann.
- Des Weiteren muss man sich entscheiden, ob man unabhängig vom clk Signal den Reset durchführen möchte oder erst mit der positiven Flanke, wodurch ein asynchroner und synchroner Reset existiert.
- Heutzutage wird allerdings meist der synchrone Reset bevorzugt, da dieser physischen Platz spart. Für den Asynchronen müsste das rst Signal in der Empfindlichkeitsliste hinzugefügt werden.
- Die hier gezeigte Schaltung ist active-high mit einem synchronen Reset.
> **Achtung:** Man kann nur in der Simulation Werte mit initial oder direkt in der Signaldeklaration zuweisen, **NICHT** in der Synthese, weshalb dies hier nicht behandelt wird.

```verilog
module module_beginning(
    input signal_in,
    input rst,
    input clk,
    output reg signal_out
);

always @ (posedge clk) begin
    if (rst) begin
        signal_out <= 1'b0;
    end
    else begin
        signal_out <= signal_in;
    end
end

endmodule
```

---

<!--
lesson_id: 602
lesson_title: "6.2 Übung: Resets"
difficulty: "intermediate"
duration_min: 10
type: "exercise"
-->

### 6.2 Übung: Resets
- Nur die wenigsten Projekte kommen gänzlich ohne Resets aus, weswegen man lernen muss, wie man sie richtig einsetzt.
- Bauen Sie ein Array aus Registern, bei welchem Array[0] einfach hochzählt, Array[1] doppelt so schnell hochzählt, Array[2] gleich 2 ist und Array[3] jeden Takt a_in aufaddiert.
- Bei aktivem Reset, solllen alle Register auf 0 gesetzt werden.

**EXERCISE_START**
```verilog
module module_reset(
    input logic clk_in,
    input logic rst_in,
    input logic [1:0] a_in,
    output logic [1:0] array_out [4]
);

// Hier Code einfügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_reset(
    input logic clk_in,
    input logic rst_in,
    input logic [1:0] a_in,
    output logic [1:0] array_out [4]
);

logic [1:0] array[4];

always_ff @(posedge clk_in) begin
    if (rst_in) begin
        array[0] <= 2'd0;
        array[1] <= 2'd0;
        array[2] <= 2'd0;
        array[3] <= 2'd0;
    end
    else begin
        array[0] <= array[0] + 2'd1;
        array[1] <= array[1] + 2'd2;
        array[2] <= 2'd2;
        array[3] <= array[3] + a_in;
    end
end

assign array_out = array;

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_reset #(
    parameter integer TEST_LENGTH = 4,
    parameter integer TEST_WIDTH = 17
) (
    output logic [TEST_WIDTH-1:0] test_array [TEST_LENGTH],
    output logic test_solved [TEST_LENGTH]
);

logic [1:0] signal_a;
logic [1:0] array [4];
logic [1:0] expected_array [4];
logic rst, clk;
int length;

module_reset dut (
    .rst_in(rst),
    .clk_in(clk),
    .a_in(signal_a),
    .array_out(array)
);

always_ff @(posedge clk) begin
    if (rst) begin
        expected_array[0] <= 2'd0;
        expected_array[1] <= 2'd0;
        expected_array[2] <= 2'd0;
        expected_array[3] <= 2'd0;
    end
    else begin
        expected_array[0] <= expected_array[0] + 2'd1;
        expected_array[1] <= expected_array[1] + 2'd2;
        expected_array[2] <= 2'd2;
        expected_array[3] <= expected_array[3] + signal_a;
    end
end

initial begin
    clk = 1'b0;
    forever #1 clk = ~clk;
end

initial begin
    @(negedge clk) rst = 1'b1;
    for (length = 0; length < TEST_LENGTH; length = length + 1) begin
        @ (negedge clk) begin
            rst = 1'b0;
            signal_a = $urandom_range(3,0);
            test_array[length][0 +: 2]     = signal_a;
        end
        @ (negedge clk) begin
            rst = $urandom_range(1,0);
            signal_a = $urandom_range(3,0);
            test_array[length][2 +: 2]     = signal_a;
        end
        @ (negedge clk) begin
            rst = 1'b0;
            signal_a = $urandom_range(3,0);
            test_array[length][4 +: 2]     = signal_a;
        end
        @ (negedge clk) begin
            signal_a = $urandom_range(3,0);
            test_array[length][6 +: 2]     = signal_a;
            if (length == 3) begin
                rst = 1'b1;
            end
        end

        @(negedge clk) begin

            test_array[length][8 +: 2]      = array[0];
            test_array[length][10 +: 2]     = array[1];
            test_array[length][12 +: 2]     = array[2];
            test_array[length][14 +: 2]     = array[3];
            test_array[length][16]          = rst;

            test_solved[length] = ((array[0] === expected_array[0]) 
                                    && (array[1] === expected_array[1]) 
                                    && (array[2] === expected_array[2]) 
                                    && (array[3] === expected_array[3]));
            
            rst = 1'b1;

        end
    end
    $display("\n");
    $display("==================================================================================");
    $display("| Any Rst | a_in (1->4) | arr[0] | arr[1] | arr[2] | arr[3] |      Solved?     |");
    $display("==================================================================================");

    for (int i = 0; i < TEST_LENGTH; i = i + 1) begin
        $display("|    %b    | %b %b %b %b |   %b   |   %b   |   %b   |   %b   |        %s        |", 
            test_array[i][16],     // rst
            test_array[i][1:0],    // a_in Zyklus 1
            test_array[i][3:2],    // a_in Zyklus 2
            test_array[i][5:4],    // a_in Zyklus 3
            test_array[i][7:6],    // a_in Zyklus 4
            test_array[i][9:8],    // arr[0]
            test_array[i][11:10],  // arr[1]
            test_array[i][13:12],  // arr[2]
            test_array[i][15:14],  // arr[3]
            test_solved[i] ? "✅" : "❌"
        );
    end
    $display("==================================================================================\n");
    $finish;
end
endmodule
```
**TESTBENCH_END**

---

<!--
lesson_id: 603
lesson_title: "6.3 Moduling"
difficulty: "intermediate"
duration_min: 10
type: "theory"
-->

### 6.3 Moduling
- Wenn man große Projekte hat, muss man diese Teilen um besser zu **testen** und **optimieren** zu können.
- Diese Funktion ist auch direkt in Verilog eingebaut, sodass man mehrere Module in der selben Datei oder über mehrere Dateien kombinieren kann.
- Hierbei wird das **Modul in einem Topmodul**, aufgerufen, ihm wird ein Name gegeben und die Pins werden mit Leitungen im Topmodul verbunden.
- Der **Aufruf** funktioniert folgendermaßen: **modul_name modul_instanzname (.PortImModul(LeitungImTop), .NächsterPortImModul(ZugehörigeLeitungImTop))**, der Modulinstanzname ist hierbei wie ein Spitzname, falls man mehrmals dasselbe Modul aufruft.
> **ACHTUNG:** Bei dem Aufruf aus einem anderen Dokument muss der Dokumentname gleich dem Modulnamen sein. Achten Sie auch auf das **Semikolon** nach dem Aufruf.

```verilog
//Topmodul

module module_top(
    input signed [7:0] signal_in,
    output [7:0] signal_leftShifted_out,
    output [7:0] signal_logicRightShifted_out,
    output [7:0] signal_arithmeticRightShifted_out
);

logic [3:0] shift_by_2;

assign shift_by_2 = 4'd2;

module_shift modul_shift_inst (
    .signal_in(signal_in),
    .shift_amount_in(shift_by_2),
    .signal_leftShifted_out(signal_leftShifted_out),
    .signal_logicRightShifted_out(signal_logicRightShifted_out),
    .signal_arithmeticRightShifted_out(signal_arithmeticRightShifted_out)
);

endmodule

// Untermodul

module module_shift(
    input signed [7:0] signal_in,
    input [3:0] shift_amount_in,
    output [7:0] signal_leftShifted_out,
    output [7:0] signal_logicRightShifted_out,
    output [7:0] signal_arithmeticRightShifted_out
);

assign signal_leftShifted_out = signal_in << shift_amount_in;
assign signal_logicRightShifted_out = signal_in >> shift_amount_in;
assign signal_arithmeticRightShifted_out = signal_in >>> shift_amount_in;

endmodule
```

---

<!--
lesson_id: 604
lesson_title: "6.4 Übung: Moduling"
difficulty: "intermediate"
duration_min: 10
type: "exercise"
-->

### 6.4 Übung: Moduling
- Ihnen ist in dieser Übung eine Black-Box gegeben.
- Diese macht komplexe Rechnungen mit Ihren Eingangswerten.
- Sie sollen hierbei diese Blackbox richtig anschließen.

| Ports der Black_Box | Bitbreite |
| :--- | :---: |
| clk_in | 1 |
| rst_in | 1 |
| data_in | 512 |
| data_out | 256 |
| finished_out | 1 |

**EXERCISE_START**
```verilog
module module_moduling(

);

black_box();

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_moduling(
    input logic clk_in,
    input logic rst_in,
    input logic [511:0] data_in,
    output logic [255:0] data_out,
    output logic finished_out
);

black_box(
    .clk_in(clk_in),
    .rst_in(rst_in),
    .data_in(data_in),
    .data_out(data_out),
    .finished_out(finished_out)
);

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
// Absoluter Overkill :D
module black_box(
    input logic clk_in,
    input logic rst_in,
    input logic [511:0] data_in,
    output logic [255:0] data_out,
    output logic finished_out
);

logic [31:0] word_array [16];
logic [31:0] H [8];
logic [31:0] a, b, c, d, e, f, g, h;
logic [31:0] t1, t2, sig0, sig1, ch, maj;
logic [6:0] counter, round_idx;
logic [5:0] index;
logic [31:0] next_word, word_t2, word_t7, word_t15, word_t16;
logic finished;
logic [31:0] k [64];

initial begin   // Sollte im FPGA hoffentlich in den ROM geladen werden :)
    k[0]  = 32'h428a2f98;   k[1]  = 32'h71374491;   k[2]  = 32'hb5c0fbcf;   k[3]  = 32'he9b5dba5;
    k[4]  = 32'h3956c25b;   k[5]  = 32'h59f111f1;   k[6]  = 32'h923f82a4;   k[7]  = 32'hab1c5ed5;
    k[8]  = 32'hd807aa98;   k[9]  = 32'h12835b01;   k[10] = 32'h243185be;   k[11] = 32'h550c7dc3;
    k[12] = 32'h72be5d74;   k[13] = 32'h80deb1fe;   k[14] = 32'h9bdc06a7;   k[15] = 32'hc19bf174;
    k[16] = 32'he49b69c1;   k[17] = 32'hefbe4786;   k[18] = 32'h0fc19dc6;   k[19] = 32'h240ca1cc;
    k[20] = 32'h2de92c6f;   k[21] = 32'h4a7484aa;   k[22] = 32'h5cb0a9dc;   k[23] = 32'h76f988da;
    k[24] = 32'h983e5152;   k[25] = 32'ha831c66d;   k[26] = 32'hb00327c8;   k[27] = 32'hbf597fc7;
    k[28] = 32'hc6e00bf3;   k[29] = 32'hd5a79147;   k[30] = 32'h06ca6351;   k[31] = 32'h14292967;
    k[32] = 32'h27b70a85;   k[33] = 32'h2e1b2138;   k[34] = 32'h4d2c6dfc;   k[35] = 32'h53380d13;
    k[36] = 32'h650a7354;   k[37] = 32'h766a0abb;   k[38] = 32'h81c2c92e;   k[39] = 32'h92722c85;
    k[40] = 32'ha2bfe8a1;   k[41] = 32'ha81a664b;   k[42] = 32'hc24b8b70;   k[43] = 32'hc76c51a3;
    k[44] = 32'hd192e819;   k[45] = 32'hd6990624;   k[46] = 32'hf40e3585;   k[47] = 32'h106aa070;
    k[48] = 32'h19a4c116;   k[49] = 32'h1e376c08;   k[50] = 32'h2748774c;   k[51] = 32'h34b0bcb5;
    k[52] = 32'h391c0cb3;   k[53] = 32'h4ed8aa4a;   k[54] = 32'h5b9cca4f;   k[55] = 32'h682e6ff3;
    k[56] = 32'h748f82ee;   k[57] = 32'h78a5636f;   k[58] = 32'h84c87814;   k[59] = 32'h8cc70208;
    k[60] = 32'h90befffa;   k[61] = 32'ha4506ceb;   k[62] = 32'hbef9a3f7;   k[63] = 32'hc67178f2;
end

always_ff @(posedge clk_in) begin
    if (rst_in) begin
        H[0] <= 32'h6a09e667;   H[1] <= 32'hbb67ae85;   H[2] <= 32'h3c6ef372;   H[3] <= 32'ha54ff53a;
        H[4] <= 32'h510e527f;   H[5] <= 32'h9b05688c;   H[6] <= 32'h1f83d9ab;   H[7] <= 32'h5be0cd19;

        a <= 0; b <= 0; c <= 0; d <= 0; e <= 0; f <= 0; g <= 0; h <= 0;

        counter <= 6'd0;

        finished <= 1'b0;
    end
    else begin
        if (counter == 6'd0) begin
            counter <= counter + 1;
            a <= H[0];
            b <= H[1];
            c <= H[2];
            d <= H[3];
            e <= H[4];
            f <= H[5];
            g <= H[6];
            h <= H[7];
        end
        else if (counter <= 7'd64) begin
            counter <= counter + 1;
            word_array[0] <= next_word;
            word_array[1] <= word_array[0];
            word_array[2] <= word_array[1];
            word_array[3] <= word_array[2];
            word_array[4] <= word_array[3];
            word_array[5] <= word_array[4];
            word_array[6] <= word_array[5];
            word_array[7] <= word_array[6];
            word_array[8] <= word_array[7];
            word_array[9] <= word_array[8];
            word_array[10] <= word_array[9];
            word_array[11] <= word_array[10];
            word_array[12] <= word_array[11];
            word_array[13] <= word_array[12];
            word_array[14] <= word_array[13];
            word_array[15] <= word_array[14];
            a <= t1 + t2;
            b <= a;
            c <= b;
            d <= c;
            e <= d + t1;
            f <= e;
            g <= f;
            h <= g;
        end
        else begin
            H[0] <= H[0] + a;
            H[1] <= H[1] + b;
            H[2] <= H[2] + c;
            H[3] <= H[3] + d;
            H[4] <= H[4] + e;
            H[5] <= H[5] + f;
            H[6] <= H[6] + g;
            H[7] <= H[7] + h;
            finished <= 1'b1;
        end
    end
end

always_comb begin
    round_idx = counter - 7'd1;
    index = (counter == 0) ? 6'd0 : round_idx[5:0];

    word_t2 = 32'd0;
    word_t7 = 32'd0;
    word_t15 = 32'd0;
    word_t16 = 32'd0;

    sig0 = {a[1:0], a[31:2]} ^ {a[12:0], a[31:13]} ^ {a[21:0], a[31:22]};
    sig1 = {e[5:0], e[31:6]} ^ {e[10:0], e[31:11]} ^ {e[24:0], e[31:25]};
    ch = (e & f) ^ (~e & g);
    maj = (a & b) ^ (a & c) ^ (b & c);
    t1 = h + sig1 + ch + k[index] + next_word;
    t2 = sig0 + maj;
    
    if (index < 6'd16) begin
        next_word = data_in[(511 - index * 32) -: 32];
    end
    else begin
        word_t2 = {word_array[1][16:0], word_array[1][31:17]} 
                    ^ {word_array[1][18:0], word_array[1][31:19]}
                    ^ word_array[1] >> 10;
        word_t7 = word_array[6];
        word_t15 = {word_array[14][6:0], word_array[14][31:7]} 
                    ^ {word_array[14][17:0], word_array[14][31:18]}
                    ^ word_array[14] >> 3;
        word_t16 = word_array[15];
        next_word = word_t2 + word_t7 + word_t15 + word_t16;
    end
end

assign data_out = {H[0], H[1], H[2], H[3], H[4], H[5], H[6], H[7]};
assign finished_out = finished;

endmodule

module tb_module_moduling #(
    parameter integer TEST_LENGTH = 4,
    parameter integer TEST_WIDTH = 769
) (
    output logic [TEST_WIDTH-1:0] test_array [TEST_LENGTH],
    output logic test_solved [TEST_LENGTH]
);

logic [511:0] data_in;
logic [255:0] data_out, expected_out;
logic finished_out, expected_finished_out, clk_in, rst_in;
logic [511:0] data [TEST_LENGTH] = '{{"Passwort12345", 8'h80, 336'h0, 64'd104},
                                    {"HTWKLeipzigFakultaetIngenieurwissenschaften", 8'h80, 96'h0, 64'd344},
                                    {"WasIstDasWarumMachtDasSowas", 8'h80, 224'h0, 64'd216},
                                    {"HDLabVerilogEinfachGemacht", 8'h80, 232'h0, 64'd208}};
int length;

module_moduling dut (
    .clk_in(clk_in),
    .rst_in(rst_in),
    .data_in(data_in),
    .data_out(data_out),
    .finished_out(finished_out)
);

black_box black_box_inst (
    .clk_in(clk_in),
    .rst_in(rst_in),
    .data_in(data_in),
    .data_out(expected_out),
    .finished_out(expected_finished_out)
);

initial begin
    clk_in = 1'b0;
    forever #2 clk_in = ~clk_in;
end

initial begin
    for (length = 0; length < TEST_LENGTH; length = length + 1) begin

        @(negedge) rst_in = 1'b1;

        @(negedge clk_in) begin
            data_in = data[length];
            rst_in = 1'b0;
        end

        wait(expected_finished_out === 1'b1);

        test_solved[length] = ((finished_out === expected_finished_out) && (data_out === expected_out));
        test_array[length] = {data_in, data_out, finished_out};

    end
    $display("\n");
    $display("==============================================================================================================================================");
    $display("| Passwort (Eingabe)                                   | SHA-256 Hash (Vollstaendig als Hex)                              | Finished | Solved? |");
    $display("==============================================================================================================================================");

    for (int i = 0; i < TEST_LENGTH; i = i + 1) begin
        $display("| %-52s | %64h |    %b     |   %s    |", 
            test_array[i][768:257],  // data_in
            test_array[i][256:1],    // data_out
            test_array[i][0],        // finished_out
            test_solved[i] ? "✅" : "❌"
        );
    end
    $display("==============================================================================================================================================\n");
    $finish;
end
endmodule
```
**TESTBENCH_END**

---

<!--
lesson_id: 605
lesson_title: "6.5 Parameter"
difficulty: "intermediate"
duration_min: 10
type: "theory"
-->

### 6.5 Parameter
- Damit man nicht **\*magische\* Zahlen** für Zustände von Systemen, zum Beispiel 0 für Pause und 1 für Arbeiten, nutzen muss, kann man Parameter mit Namen erschaffen.
- Hierbei muss man lokale Parameter, welche fest gesetzt werden und genau so vom Synthesetool eingebaut werden und normale Parameter, welche vom Synthesetool geändert werden können, sollte dies durch ein Top-Modul gefordert werden, unterscheiden.
- Damit Parameter von einem Topmodul übernommen werden, muss man diese **vor dem Instanznamen im Top-Modul** in **runde Klammern** schreiben und mit einer **Raute #** kennzeichnen.
- Man kann sich hierbei auswählen, wo im Untermodul man den Parameter deklariert und gleich definiert und es ist auch hier möglich ihn nach dem Modulnamen zu deklarieren und definieren, wobei mehrere, wie die Portdeklaration, mit Kommas getrennt werden und der Letzte keins besitzt.
- Lokale Parameter: **localparam signed? [n-1:0] parameter_name = parameter_wert;**
- Parameter: **parameter signed? [n-1:0] parameter_name = parameter_wert;**
> **WICHTIG:** Sollte kein Wert von einem Topmodul gegeben werden, wird der Wert hinter der Deklaration des Parameters genommen. Es ist Standard **Parameternamen in caps-lock** zu schreiben, sodass man sie einfach von Leitungen trennen kann.

> **ACHTUNG:** Die Parameter können nicht während der Laufzeit geändert werden, sondern immer nur während der Synthese. Sie sind außerdem **standardmäßig unsigned**.

[//]: # (**Extra**:Es gibt bereits vorgefertigte Datentypen, welche vor allem für Parameter eingesetzt werden. Diese werden in einem extra Teil erläutert.)

```verilog
//Topmodul

module module_top(
    input signed [7:0] signal_in,
    output [7:0] signal_leftShifted_out,
    output [7:0] signal_logicRightShifted_out,
    output [7:0] signal_arithmeticRightShifted_out
);

localparam [3:0] SHIFT_AMOUNT = 4'd2;

module_shift #(
    .SHIFT_AMOUNT(SHIFT_AMOUNT)
) modul_shift_inst (
    .signal_in(signal_in),
    .signal_leftShifted_out(signal_leftShifted_out),
    .signal_logicRightShifted_out(signal_logicRightShifted_out),
    .signal_arithmeticRightShifted_out(signal_arithmeticRightShifted_out)
);

endmodule

// Untermodul

module module_shift #(
    parameter [3:0] SHIFT_AMOUNT = 4'd0
)(
    input signed [7:0] signal_in,
    output [7:0] signal_leftShifted_out,
    output [7:0] signal_logicRightShifted_out,
    output [7:0] signal_arithmeticRightShifted_out
);

//parameter [3:0] SHIFT_AMOUNT = 4'd0; <-- Eins von beidem

assign signal_leftShifted_out = signal_in << SHIFT_AMOUNT;
assign signal_logicRightShifted_out = signal_in >> SHIFT_AMOUNT;
assign signal_arithmeticRightShifted_out = signal_in >>> SHIFT_AMOUNT;

endmodule
```

---

<!--
lesson_id: 606
lesson_title: "6.6 Übung: Timer"
difficulty: "intermediate"
duration_min: 10
type: "exercise"
-->

### 6.6 Übung: Timer
- Nun sollen Sie einen Timer bauen.
- Hierfür ist Ihnen eine **100 MHz Clock** gegeben. Verwenden Sie diese, um den Ausgang **signal_out jede Sekunde für genau einen Takt High** zu setzen.
- Bauen Sie direkt auch noch einen Reset ein, um den Timer zu nullen und nutzen Sie den Parameter COUNT_MAX, um anzugeben wie hoch der Zähler zählen soll.

**EXERCISE_START**
```verilog
module module_timer #(

) (
    input logic clk_in,
    input logic rst_in,
    output logic signal_out
);

// Code hier einfügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module module_timer #(
    parameter int COUNT_MAX = 32'd100_000_000
) (
    input logic clk_in,
    input logic rst_in,
    output logic signal_out
);

logic [31:0] counter_intermediate, counter;
logic signal_comb;

always_ff @ (posedge clk_in) begin
    if (rst_in) begin
        counter <= 32'd0;
    end
    else begin
        counter <= counter_intermediate;
    end
end

always_comb begin
    if (counter == (COUNT_MAX - 32'd1)) begin
        counter_intermediate = 32'd0;
        signal_comb = 1'b1;
    end
    else begin
        counter_intermediate = counter + 32'd1;
        signal_comb = 1'b0;
    end
end

assign signal_out = signal_comb;

endmodule
```
**SOLUTION_END**

**TESTBENCH_START**
```verilog
module tb_module_timer #(
    parameter integer TEST_LENGTH = 10,
    parameter integer TEST_WIDTH = 3
) (
    output logic [TEST_WIDTH-1:0] test_array [TEST_LENGTH],
    output logic test_solved [TEST_LENGTH]
);

int length;
localparam integer WAIT_TIME = 32'd4;

logic clk_in, rst_in;
logic signal_out, expected_out;

module_timer #(
    .COUNT_MAX(WAIT_TIME)
) dut (
    .clk_in(clk_in),
    .rst_in(rst_in),
    .signal_out(signal_out)
);

logic [31:0] counter_intermediate, counter;
logic signal_comb;

always_ff @ (posedge clk_in) begin
    if (rst_in) begin
        counter <= 32'd0;
    end
    else begin
        counter <= counter_intermediate;
    end
end

always_comb begin
    if (counter == (WAIT_TIME - 32'd1)) begin
        counter_intermediate = 32'd0;
        signal_comb = 1'b1;
    end
    else begin
        counter_intermediate = counter + 32'd1;
        signal_comb = 1'b0;
    end
end

assign expected_out = signal_comb;

initial begin
    clk_in = 1'b0;
    forever #5 clk_in = ~clk_in;
end

initial begin
    rst_in = 1'b1;
    @(posedge clk_in);
    rst_in = 1'b0;
    for (length = 0; length < TEST_LENGTH; length = length + 1) begin
        if (length == 5) begin
            rst_in = 1'b1;
        end
        else begin
            rst_in = 1'b0;
        end
        @(posedge clk_in);
        #1;
        test_array[length][0] = rst_in;
        test_array[length][1] = signal_out;
        test_array[length][2] = expected_out;
        test_solved[length] = (signal_out === expected_out);
    end
    $display("\n");
    $display("Zum beschleunigen der Simulation wurde COUNT_MAX auf 4 runter gesetzt. Ihr Modul sollte durch die Verwendung des Parameters trotzdem einwandfrei funktionieren.");
    $display("==========================================================");
    $display("| Takt | rst_in | signal_out | expected_out |  Solved?   |");
    $display("==========================================================");

    for (int i = 0; i < TEST_LENGTH; i = i + 1) begin
        $display("|  %2d  |   %b    |     %b      |      %b       |     %s     |", 
            i,
            test_array[i][0], // rst_in
            test_array[i][1], // signal_out
            test_array[i][2], // expected_out
            test_solved[i] ? "✅" : "❌"
        );
    end
    $display("==========================================================\n");
    $finish;
end
endmodule
```
**TESTBENCH_END**

---

<!--
lesson_id: 700
lesson_title: "7. Zustände z und x"
difficulty: "advanced"
duration_min: 1
type: "theory"
-->

## 7. Zustände z und x
- Manchmal bietet es sich an "don't care" (x) Werte oder "not connected" (z) zu verwenden. Diese werden im nächsten Kapitel thematisiert.

---

<!--
lesson_id: 701
lesson_title: "7.1 Synthese von z und x"
difficulty: "advanced"
duration_min: 10
type: "theory"
-->

### 7.1 Synthese von z und x

- Im Kapitel 0. Zustände: Die Highs und Lows des Computers wurden die vier Zustände einer Leitung angesprochen: 0, 1, hochohmig (z) und unbekannt (x).
- z stellt hierbei eine getrennte Verbindung dar und wird meist in Verbindungen mit bidirektionalen Leitungen verwendet.
- Hierbei wird die Zuweisung auf signal_inout gekappt, sobald Daten von der anderen Seite kommen sollen (input_enable_in).
> **ACHTUNG:** Man muss einen inout Port immer in assign Zuweisungen bestimmen, da inputs immer wires sein müssen, allerdings innerhalb always Blöcke links immer Register stehen müssen, logic funktioniert hier nicht.
- x hat hierbei eine ganz andere Aufgabe. In der Simulation steht es für einen unbekannten Zustand, welcher also noch nicht initialisiert wurde. In der Synthese steht er dafür, dass uns dieser Fall egal ist und das Synthesetool machen kann was es möchte, um das Programm zu optimieren.
- Meist wird dies in if oder case Zuweisungen verwendet, wenn man alle Fälle abgedeckt hat, die eintreten können und noch Fälle über sind. (Recap zu if: Für das Synthesetool sollte es immer ein else geben!)
- z und x werden bei zu kleiner Bitbreite mit jeweils z oder x aufgefüllt. Dies funktioniert auch bei Kombinationen aus 0, 1, x und z, wobei hier das MSB in der Zuweisung priorität hat. (8'bxz01 => 8'bxxxxxz01)


```verilog
module module_z_x(
    input [3:0] signal_in,
    input input_enable_in,
    inout [3:0] signal_inout,
    output logic [3:0] signal_z_out,
    output logic [1:0] signal_x_out
);

logic [1:0] signal_x;

always @ (*) begin
    case (signal_in)
        4'b0000: signal_x = 2'b00;
        4'b0001: signal_x = 2'b01;
        4'b1010: signal_x = 2'b11;
        default: signal_x = 2'bxx;
    endcase

    if (input_enable_in) begin
        signal_z_out = signal_inout;
    end
    else begin
        signal_z_out = 4'b0000;       
    end
end

assign signal_x_out = signal_x;
assign signal_inout = (input_enable_in) ? 4'bzzzz : signal_in;

endmodule
```

---

<!--
lesson_id: 702
lesson_title: "7.2 casez und casex"
difficulty: "advanced"
duration_min: 10
type: "theory"
-->

### 7.2 casez und casex
- Neben dem normalen Case statement gibt es außerdem casez und casex.
- Das casez wird eingesetzt, falls man zum Beispiel auf ein 4 Bit Signal prüft, allerdings weiß, sobald das MSB High ist, ist das Ausgangssignal immer gleich.
- Somit kann man dem Synthesetool sagen, dass bestimmte Werte vernachlässigt werden sollen und somit die Optimierung vereinfachen.
- Dies funktioniert mit dem z oder ?, an der zugehörigen Stelle in der Bitfolge. (z.B.4'b1?1z)
- Das casex funktioniert fast gleich, nur maskiert es in der Testbench x mit einem Joker, also einen gültigen Signal, welches keine Fehler wirft.
- Dies ist sehr gefährlich, da man so beim Testen Fehler übersehen kann, wird dadurch nicht verwendet und hier nicht vorgeführt.
- Sobald das Signal, auf welches geprüft wird, x als Wert hat wird dies ignoriert und das erste mögliche case ausgeführt.

```verilog
module module_casez(
    input [3:0] signal_in,
    output [1:0] signal_out
);

logic [1:0] signal;

always @ (*) begin
    casez (signal_in)
        4'b1???: signal = 2'b11;
        4'b01??: signal = 2'b10;
        4'b001?: signal = 2'b01;
        4'b0001: signal = 2'b00;
        default: signal = 2'bxx;
    endcase
end

assign signal_out = signal;

endmodule
```

---

<!--
lesson_id: 800
lesson_title: "8. Finite State Machine"
difficulty: "advanced"
duration_min: 2
type: "theory"
-->

## 8. Finite State Machine
- Um effektiv Probleme zu bearbeiten, verwendet man Finite State Machines, welche eine endliche Abfolge von Schritten nach einem bestimmten Algorithmus abarbeiten. Im nächsten Kapitel sollen Sie lernen, wie Sie eigene FSM in Verilog schreiben.

---

<!--
lesson_id: 801
lesson_title: "8.1 Automaten"
difficulty: "advanced"
duration_min: 10
type: "theory"
-->

### 8.1 Automaten
- Meist muss man einen Schritt nach dem anderen abarbeiten, hierbei ist es nützlich sich Automaten zu schreiben, welche eine endliche Anzahl Zustände (finite states) besitzt.
- Diese können Abhängig von ihren Eingangswerten und Berechnungen nach einem vorher geschriebenen Algorithmus entscheiden, in welchen Zustand gewechselt wird oder auch, ob der Zustand gehalten wird.
- Hierbei sind zwei Automatentypen zu unterscheiden.

---

<!--
lesson_id: 802
lesson_title: "8.2 Moore"
difficulty: "advanced"
duration_min: 10
type: "theory"
-->

### 8.2 Moore
- Beim Moore Automaten sind die Ausgangssignale alleinig vom aktuellen Zustand abhängig.
- Die Eingangssignale beeinflussen hierbei nur in welchen Zustand als nächstes gewechselt wird und ändern nicht die Ausgabe.

[//]: # (Möglich hier zu Fragen, warum man manchmal "nicht den default braucht")

```verilog
module module_moore(
    input clk,
    input rst,
    input signal_in,
    output logic signal_out
);

localparam [0:0] LOW = 1'b0;
localparam [0:0] HIGH = 1'b1;

logic signal, state, next_state;

always @ (posedge clk) begin
    if (rst) begin
        state <= LOW;
    end
    else begin
        state <= next_state;
    end
end

always @ (*) begin
    next_state = state;
    case (state)
        LOW: if (signal_in == 1'b1) next_state = HIGH;
        HIGH: if (signal_in == 1'b0) next_state = LOW;
    endcase
end

always @ (*) begin
    signal = 1'b0;
    case (state)
        LOW: signal = 1'b0;
        HIGH: signal = 1'b1;
    endcase
end

assign signal_out = signal;

endmodule
```

---

<!--
lesson_id: 803
lesson_title: "8.3 Mealy"
difficulty: "advanced"
duration_min: 10
type: "theory"
-->

### 8.3 Mealy
- Der Mealy Automat berechnet seine Ausgabe hierbei basierend auf seinem Zustand, aber auch abhängig von seinen Eingangssignalen.

```verilog
module module_mealy(
    input clk,
    input rst,
    input signal_in,
    output logic signal_out
);

localparam [0:0] LOW = 1'b0;
localparam [0:0] HIGH = 1'b1;

logic signal, state, next_state;

always @ (posedge clk) begin
    if (rst) begin
        state <= LOW;
    end
    else begin
        state <= next_state;
    end
end

always @ (*) begin
    next_state = state;
    case (state)
        LOW: if (signal_in == 1'b1) next_state = HIGH;
        HIGH: if (signal_in == 1'b0) next_state = LOW;
    endcase
end

always @ (*) begin
    signal = 1'b0;
    case (state)
        LOW: begin
            if (state == signal_in) signal = 1'b1;
        end
        HIGH: begin
            if (state == signal_in) signal = 1'b1;
        end
    endcase
end

assign signal_out = signal;

endmodule
```

---

<!--
lesson_id: 900
lesson_title: "9. Das Gesamtsystem"
difficulty: "intermediate"
duration_min: 10
type: "theory"
-->

## 9. Das Gesamtsystem
- Nun da wir mit dem grundlegendem Syntax durch sind, wollen wir uns noch einigen Fragen und Praktiken widmen, sodass Sie Ihren Code später, ohne schlechtes Gewissen auf echter Hardware wiederverwenden können.

---

<!--
lesson_id: 901
lesson_title: "9.1 Codestruktur"
difficulty: "intermediate"
duration_min: 10
type: "theory"
-->

### 9.1 Codestruktur
- Damit Code einfacher zu debuggen ist, sollte man seinen Code strukturieren.
- Somit hat man eine klare Abfolge im Code, welche einfacher zu durchschauen ist, vor allem wenn man den Code nicht selbst geschrieben hat.
- Eine weit verbreitete Abfolge ist diese, wobei die Parameter an einer der beiden Stellen deklariert werden.
- Abfolge:
  - Instanziierung
  - (Parameterdeklaration)
  - Portdeklaration
  - (Parameterdeklaration)
  - Leitung-/Registerdeklaration
  - Seqeuentielle Logik
  - Kombinatorische Logik
  - Assign des Outputs
  - Ende Modul

**Hier Beispiel einfügen** <-- I guess kann komplexer sein... Vllt eine kleine Alu als Ausblick 1/0

---

<!--
lesson_id: 902
lesson_title: "9.2 Physische Größe (FPGA): Warum nicht alles riesig?"
difficulty: "intermediate"
duration_min: 10
type: "theory"
-->

### 9.2 Physische Größe (FPGA): Warum nicht alles riesig?
- In der Simulation ist es einfach Bitbreiten riesig zu setzen, vor allem wenn Module kleiner sind. Dies führt allerdings in der Praxis mit der Verwendung von FPGAs zu riesigen Problemen, da hier der pyhsische Platz und Routing-Ressourcen ein stark limitierender Faktor ist.
- Um dem entgegen zu wirken muss man sich immer fragen, ob die Größe, welche man nutzen möchte wirklich Sinn ergibt: Brauche ich die extra Genauigkeit wirklich die mir 32 Bit geben, wenn ich in der Einheit Meter rechnen möchte und maximal 10 Meter eingebe?
- Meist kann man hierbei die Bitbreite drastisch reduzieren oder auch auf andere Methoden zurückgreifen, um Programme zu simplifizieren.
- Zum Beispiel ist der Bitshift eine beliebte Alternative zur Multiplikation und Division, da er praktisch kostenlos und fast unmittelbar ist.
- Andere Möglichkeiten zum einsparen von Platz wäre die Multiplikation mit der Inversen statt der Division oder die Multiplikation mit der gewünschten Zahl mal einen vordefinierten Bitshift, wobei man danach den Bitshift auf das Ergebnis anwendet.
- Beim mehrfachen aufrufen desselben Moduls kann man sich auch überlegen, ob man nicht doch Zeit zwischen Operationen hat, um eine Pipeline aus Inputs zu bauen, sodass man taktet, welches Ergebnis berechnet wird.
- Dies geht zum Beispiel bei der Generierung von Steuerbefehlen von Modellautos gut, da diese Befehle im Kilohertz benötigen, FPGAs allerdings mit Megahertz operieren und somit lange Zeiten entstehen, in welchen der FPGA praktisch nichts macht.
- Des Weiteren kann es passieren, dass bei riesigen Rechnungen Logic Units (LUTs) plötzlich nur noch für das Routing genutzt werden, sodass sie effektiv zur Berechnung fehlen und der Code viel mehr Platz einnimmt als nötig.

---

<!--
lesson_id: 903
lesson_title: "9.3 Warum und wann sollte man Speichern?"
difficulty: "beginner"
duration_min: 10
type: "theory"
-->

### 9.3 Warum und wann sollte man Speichern?
- Wissen wann man richtig speichern muss ist die Eigenschaft, welche entscheidend ist, damit der Code am Ende ressourcen- und zeitoptimiert funktioniert.
- Synthesetools sind hierbei darauf ausgelegt den Code weitestgehend zu optimieren, sodass Signale auch lokal beieinander sind. Dies ist dementsprechend wichtig, da bei, zum Beispiel einer 100 MHz Clock eine Aneinanderreihung von Multiplikation, Division, Addition und Invertierung sehr wahrscheinlich NICHT innerhalb eines Taktes beendet ist.
- Diese Weg nennt man den Kritischen Pfad und es wird versucht ihn so weit wie möglich zu reduzieren.
- Sollte das Signal es nicht schaffen den Kritischen Pfad in der Zeit abzulaufen und man nun versucht das Ergebnis am Ende des Taktes zu speichern, kann alles Anliegen von nur Nullen bis nur Einsen. Diese unvorhersehbaren Zwischenzustände nennt man Glitches.
- Um dem entgegen zu wirken muss man jedes Ergebnis einzeln speichern. Das tolle daran: Es klingt nach großer Verschwendung, dass man so oft abspeichert, aber die Synthesetools sind genau darauf optimiert, da sichere, richtige Daten immer wichtiger sind als schnelle.
- Hierbei ist das Keyword Pipelining, sobald diese einen Durchlauf absolviert hat, gibt sie jeden Zyklus ein Ergebnis mit richtigen Werten aus.
- **TIPP:** Vor allem am Anfang kann es schwierig sein einzuschätzen, wie viel in einem Takt gleichzeitig bearbeitet werden kann. Darum bietet sich immer an einfach alles sequentiell zu speichern.

---

<!--
lesson_id: 904
lesson_title: "9.4 Zusammenfassung"
difficulty: "intro"
duration_min: 10
type: "theory"
-->

### 9.4 Zusammenfassung 1/0

// Alles Aufgereiht und mit nummern versehen. Einfacher an Schreibtisch...

```verilog
module top (    // Modulisierung ()

);

endmodule

module zusammenfassung (

);

endmodule
```

Alles nochmal direkt aufgelistet als Cheat-Sheet

---

<!--
lesson_id: 1000
lesson_title: "10. Projekte"
difficulty: "beginner"
duration_min: 10
type: "theory"
-->

## 10. Projekte
- Dieses Kapitel ist eine auflistung von weiterführenden Übungen.
- Sie sind schwieriger als die vorherigen Übungen.

---
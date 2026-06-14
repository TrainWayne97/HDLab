---
lesson_id: 1
lesson_title: "Vorwort"
difficulty: "intro"
duration_min: 5
type: "theory"
---

# Ultimativer Spektakulärer (System)Verilog Guide

## Vorwort

Zum Start ein kurzer Hintergrund: **Verilog** wurde 1983/84 von Phil Moorby entworfen, wobei man heutzutage fast ausschließlich die **synonym** verwendete **SystemVerilog** Extention aus 2009 nutzt. Dieses Tutorial wird auch dauerhaft Verilog schreiben und Systemverilog meinen.

---

---
lesson_id: 2
lesson_title: "Exkurs: Die Highs and Lows des Computers"
difficulty: "beginner"
duration_min: 10
type: "theory"
---

## Syntax

### Exkurs: Die "Highs and Lows" des Computers

High und Low bezeichnen hierbei den Zustand eines Kabel und damit den Wert des Zustandes, mit **High als 1** und **Low als 0**. In Verilog gibt es außerdem **z als hochohmig** (nicht verbunden) und **x als undefiniert**, also für Verilog unbekannt. Unbekannt tritt in der Regel nur bei Fehlern auf.

---

---
lesson_id: 3
lesson_title: "Modul: Der Rahmen des Codes"
difficulty: "beginner"
duration_min: 8
type: "theory"
---

### Modul: Der Rahmen des Codes

- Verilog ist in seiner Syntax sehr ähnlich zu Sprachen zu **C**. 
- Am Anfang muss man sein Modul definieren und ihm einen Namen geben, sowie den Endpunkt des Moduls definieren. Warum auch der Endpunkt nützlich ist, neben dem dass er eine Voraussetzung ist, schauen wir uns später an.
- Hierbei ist darauf zu achten, dass so wie in C hinter **jede Zeile** Code zwischen **module** und **endmodule** ein **Semikolon** eingefügt werden muss.

```verilog
module modul_name;

endmodule
```

---

---
lesson_id: 4
lesson_title: "Portliste: Anschluss der Außenwelt"
difficulty: "beginner"
duration_min: 10
type: "theory"
---

### Portliste: Anschluss der Außenwelt

- Weiterhin ist wichtig anzumerken, dass man ein System baut, mit welchem man nur durch Vordefinierte Schnittstellen (Ports) kommunizieren kann.
- Hierbei gibt es drei Portarten
  - input name_des_ports:   Zum hineinführen von Signalen
  - output name_des_ports:  Zum rausführen von Signalen
  - inout name_des_ports:   Falls der Port als Ein- & Ausgabe genutzt werden soll
- Normalerweise werden nur input und output verwendet, wodurch nur kurz gegen Ende ein Beispiel für inout besprochen wird.
- Die Ports werden hierbei in normalen Klammer hinter dem Modulnamen angegeben. Sie müssen mit Kommas getrennt werden.
- Es ist außerdem sehr ratsam seine Ports mit der zugehörigen Art zu kennzeichnen, um später besseren Überblick zu behalten.

```verilog
module modul_ports(
    input signal_in,
    output signal_out
);

endmodule
```

---

---
lesson_id: 5
lesson_title: "Kommentare: Überblick trotz Chaos"
difficulty: "beginner"
duration_min: 5
type: "theory"
---

### Kommentare: Überblick trotz Chaos

- Um in großen Codes nicht zu vergessen, was da überhaupt vor einem ist, ist es sehr oft hilfreich es einfach daneben zu schreiben. Kommentare sind hierbei nur für den Betrachter sichtbar und werden später beim Ausführen gänzlich ignoriert.
- Man schreibt ihn mit doppelten Schrägstrich **// Kommentar**, allerdings ist damit alles dahinter auskommentiert und wird ignoriert.
- Es ist auch möglich in einer Zeile einen Kommentar zu hinterlassen, dies ist allerdings sehr unüblich, da es den Code eher schwerer lesbar macht. Hierbei nutzt man /* Kommentar */.

```verilog
module modul_comment(
    input signal_in,
    output signal_out
);

// Das wird von der Maschine ignoriert.

endmodule
```

---

---
lesson_id: 6
lesson_title: "Einfache Zuweisungen: Was soll wo hin?"
difficulty: "beginner"
duration_min: 10
type: "theory"
---

### Einfache Zuweisungen: Was soll wo hin?

- Momentan macht unser Modul noch gar nichts. Es existiert zwar ein input, dieser wird allerdings nicht verwertet und der output ist undefiniert.
- Um eine einfache Zuweisung von unserem Eingang auf den Ausgang zu schaffen gibt es das **assign**. Die Anordnung ist wie folgt: **assign Name_Ziel = Name_Herkunft**
- Die assign Zuweisung ist **kein Speicher** für Werte. Sie legt Kabel von einer Stelle an eine andere.
- Im Beispiel werden jetzt einfach nur Kabel vom Eingang an den Ausgang gelegt. Ändert sich der Eingang, ändert sich direkt der Ausgang.
- Hierbei darf man das Semikolon nicht vergessen.

```verilog
module modul_assign(
    input signal_in,
    output signal_out
);

assign signal_out = signal_in;

endmodule
```

---

---
lesson_id: 7
lesson_title: "Leitungen: Verbindungen im Code"
difficulty: "beginner"
duration_min: 10
type: "theory"
---

### Leitungen: Verbindungen im Code

- In Verilog gibt es keine Variablen wie in C. Jedes Signal braucht hierbei seine eigene Leitung, welche eine **feste Größe** hat und **während der Laufzeit nicht angepasst oder neu angelegt** werden kann.
- Um eine Verbindung zu deklarieren nutzt man in das Kennwort **logic**.

```verilog
module modul_cable(
    input signal_in,
    output signal_out
);

logic signal_intern;

assign signal_intern = signal_in;
assign signal_out = signal_intern;

endmodule
```

---

---
lesson_id: 8
lesson_title: "Speichern von Daten: Register"
difficulty: "intermediate"
duration_min: 15
type: "theory"
---

### Speichern von Daten: Register

- An sich werden zum **speichern von Daten** heutzutage nur **Register** verwendet, welche normalerweise auf eine positive oder negative Flanke, dem Wechsel von Low zu High oder anders herum, den anliegenden Wert speichern und am Ausgang bereitstellen.
- Man kann selbst speicher mittels Grundoperationen innerhalb von always_latch Blöcken bauen, allerdings wird dies nicht sonderlich oft genutzt, weshalb es hier übersprungen wird.
- Standard ist die Verwendung von **always @ ()**, welches sich **entweder** wie eine **assign Zuweisung** oder ein **Datenspeicher** verhält.
- Die Schreibweise, welche wie die assign Zuweisung funktioniert, kann man auch so verstehen: **always @ (*)** bedeutet "Immer wenn sich eine **Eingangsvariable ändert**, **aktualisiere** alle **Ausgänge**".
- Der Datenspeicher funktioniert ähnlich: **always @ (posedge clk)** bedeutet "Immer wenn das clock Signal von **Low zu High** wechselt (nicht anders herum!), dann übernehme den Eingangswert.
- Dasselbe gilt für **always @ (negedge clk)**, hierbei speichert man allerdings beim Wechsel von **High auf Low**.
- Es ist gern gesehen, wenn eine **Trennung in Kombinatorischen Block (always @ (*)) und Sequentiellen Block (always @ (posedge clk))** stattfindet. Dies bedeutet auch, dass die Berechnung vom speichern getrennt ist. 
- Die **clock** ist hierbei meist ein **periodisches Signal mit fester Frequenz**.
- Tipp: Es ist außerdem gern gesehen, wenn man seine Außgänge ganz unten im Modul via assign Zuweisungen zuweist, sodass man schnell finden kann, wie genau das Modul funktioniert.

```verilog
module modul_saveData_2(
    input signal_in,
    output signal_out
);

logic signal_a;
logic signal_b;
logic signal_combined;

always @ (posedge clk) signal_a = signal_in;
always @ (negedge clk) signal_b = signal_in;

always @ (*) signal_combined = signal_a & signal_b;

assign signal_out = signal_combined;

endmodule
```

Meist braucht man allerdings mehr als nur eine Zeile. Dafür gibt es auch einen Befehl, sodass alles nachfolgende noch auf den vorhergehenden Block reagiert.

**begin *Code* end** sagt dem Synthesetool, dass die nachfolgenden Zeilen bis zum end noch auf den Block reagieren.

```verilog
module modul_saveData_2(
    input signal_in,
    output signal_out
);

logic signal_a;
logic signal_b;
logic signal_combined;

always @ (posedge clk) begin
    signal_a = signal_in;
    signal_b = signal_in;
end

always @ (*) begin
    signal_combined = signal_a & signal_b;
end

assign signal_out = signal_combined;

endmodule
```

---

---
lesson_id: 9
lesson_title: "Grundoperationen: AND, NOT"
difficulty: "beginner"
duration_min: 12
type: "theory"
---

### Grundoperationen: AND, NOT

- Wie in der Vorlesung besprochen wurde kann **jede Funktion** in Verilog **rein aus NAND-Gattern** gebaut werden.
- Ein reines NAND Zeichen gibt es in Verilog nicht, allerdings sind die Synthese-Tools genau auf solche Optimisierungen ausgelegt, sodass in der Regel kein Nachteil durch Zusammensetzung entsteht.
- Ein **AND** wird hierbei mit **&** geschrieben und ein **NOT** mit **~** (Tastatur: Alt Gr + *).
- **AND** ist hierbei nur **High**, wenn **beide inputs High** sind und **NOT invertiert** den eingegebenen Wert.
- Sie können direkt in always Blöcken oder assign Zuweisungen verwendet werden. Es ist immer besser, für Lesbarkeit und bessere Synthese, jede Zeile nur mit einem Operator zu verknüpfen.
- Dies wollen wir in den folgenden Modulen auch nochmal nachvollziehen und werden dafür uns alle Grundoperationen erarbeiten.

```verilog
module modul_and_not(
    input signal_a_in,
    input signal_b_in,
    output signal_not_a_out,
    output signal_a_and_b_out
);

assign signal_not_a_out = ~signal_a_in;
assign signal_a_and_b_out = signal_a_in & signal_b_in;

endmodule
```

---

---
lesson_id: 10
lesson_title: "Grundoperation: NAND"
difficulty: "intermediate"
duration_min: 20
type: "exercise"
---

### Grundoperation: NAND

Jetzt sollen Sie einmal selbst probieren Code zu schreiben. Der Rahmen ist hierbei vorgefertigt und Sie sollen beide Werte mittels **NAND** verknüpfen und diesen Wert ausgeben.

**Tipp:** Bei solchen Aufgaben ist es ratsam sich nochmal den Truth-Table des gewünschten Ergebnisses zu zeichnen.

[//]: # (0adsddasd asdd) 


**EXERCISE_START**
```verilog
module modul_nand(
    input signal_a_in,
    input signal_b_in,
    output signal_a_nand_b_out
);

logic signal_a_and_b;
logic signal_not_a_and_b;

// TODO: Hier Code einfügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module modul_nand(
    input signal_a_in,
    input signal_b_in,
    output signal_a_nand_b_out
);

logic signal_a_and_b;

always @ (*) begin
    signal_a_and_b = signal_a_in & signal_b_in;
end

assign signal_a_nand_b_out = ~(signal_a_and_b);

endmodule
```
**SOLUTION_END**

---

---
lesson_id: 11
lesson_title: "Grundoperation: OR"
difficulty: "intermediate"
duration_min: 20
type: "exercise"
---

### Grundoperation: OR

Da wir nun etwas mit dem Syntax vertraut sind, wollen wir uns an etwas schwierigeres wagen.

Die **OR** Operation verknüpft wieder zwei Werte und gibt High aus, solange mindestens ein Signal High ist, sonst Low.

Versuchen Sie nun selbst nur aus den Grundgattern **AND** und **NOT** ein **OR** Gatter zu erschaffen.

**Tipps:**
- Falls Sie noch Schwierigkeiten haben das Problem zu lösen, versuchen Sie sich daran die Truth-Tables einiger Kombinationen von Gattern aufzustellen.
- Bedenken Sie außerdem, für das Synthesetool ist es immer gut, wenn nur eine Operation pro Zeile ausgeführt wird. Nutzen Sie bei mehreren Zuweisungen infolge Leitungen.

**EXERCISE_START**
```verilog
module modul_or(
    input signal_a_in,
    input signal_b_in,
    output signal_a_or_b_out
);

// TODO: Hier Code einfügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module modul_or(
    input signal_a_in,
    input signal_b_in,
    output signal_a_or_b_out
);

logic signal_not_a;
logic signal_not_b;
logic signal_not_a_and_not_b;

always @ (*) begin
    signal_not_a = ~(signal_a_in);
    signal_not_b = ~(signal_b_in);
    signal_not_a_and_not_b = signal_not_a & signal_not_b;
end

assign signal_a_or_b_out = ~(signal_not_a_and_not_b);

endmodule
```
**SOLUTION_END**

---

---
lesson_id: 12
lesson_title: "Weitere Grundoperationen: XOR, NOR"
difficulty: "intermediate"
duration_min: 25
type: "exercise"
---

### Weitere Grundoperationen: XOR, NOR

Jetzt wo wir auch praktisch etwas vertrauter sind wenden wir uns nochmal dem theoretischen.

Niemand möchte die gesamte Zeit den Code für jedes OR oder XOR ausschrieben, weshalb Befehle für OR und XOR bereits hinterlegt sind.

- **OR** ist hierbei **|** (Tastatur: Alt Gr + <)
- **XOR** ist **^**
- Das **NOR** müsste man sich wieder selbst zusammen bauen.

**Zusatz-Challenge:** Versuchen Sie selbst nochmal das **XOR** und **NOR** aus Grundgattern zu bauen.

**EXERCISE_START**
```verilog
module modul_xor_nor(
    input signal_a_in,
    input signal_b_in,
    output signal_a_nor_b_out,
    output signal_a_xor_b_out
);

// TODO: Hier Code einfügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module modul_xor_nor(
    input signal_a_in,
    input signal_b_in,
    output signal_a_nor_b_out,
    output signal_a_xor_b_out
);

logic signal_not_a;
logic signal_not_b;
logic signal_not_a_and_not_b;
logic signal_a_or_b;
logic signal_a_and_b;
logic signal_a_nand_b;

always @ (*) begin
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

---

---
lesson_id: 13
lesson_title: "Boolean: Wahrheitswerte"
difficulty: "intermediate"
duration_min: 20
type: "exercise"
---

### Boolean: Wahrheitswerte

Genau wie bei den Gattern ist es möglich Vergleiche direkt als Zeichen in Verilog zu schreiben.

Hierfür werden die Standardzeichen verwendet:
- **<** gibt High, wenn **a kleiner b**
- **>** gibt High, wenn **a größer b**
- **==** gibt High wenn **gleich**

Hierbei steht die Rückgabe **1 für true und 0 für false**.

**Zusatz-Challenge:** Versuchen Sie wieder diese komplexeren Operationen aus einfachen Gattern zu bauen. Nutzen Sie ruhig alle bisher Behandelten, inklusive OR und XOR.

**EXERCISE_START**
```verilog
module modul_truth(
    input signal_a_in,
    input signal_b_in,
    output signal_a_equals_b_out,
    output signal_a_less_b_out
);

// TODO: Hier Code einfügen (mit eingebauten Operatoren)

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module modul_truth(
    input signal_a_in,
    input signal_b_in,
    output signal_a_equals_b_out,
    output signal_a_less_b_out
);

assign signal_a_equals_b_out = (signal_a_in == signal_b_in);
assign signal_a_less_b_out = (signal_a_in < signal_b_in);

endmodule
```

**Alternative Lösung (aus Gattern):**
```verilog
module modul_truth_gates(
    input signal_a_in,
    input signal_b_in,
    output signal_a_equals_b_out,
    output signal_a_less_b_out
);

logic signal_a_xor_b;
logic signal_not_a;

always @ (*) begin
    signal_a_xor_b = signal_a_in ^ signal_b_in;
    signal_not_a = ~signal_a_in;
end

assign signal_a_equals_b_out = ~signal_a_xor_b;
assign signal_a_less_b_out = signal_not_a & signal_b_in;

endmodule
```
**SOLUTION_END**

---

---
lesson_id: 14
lesson_title: "If: Wenn x, dann y"
difficulty: "intermediate"
duration_min: 15
type: "theory"
---

### If: Wenn x, dann y

Momentan führt unser Code jede Anweisung einfach stumpf aus, allerdings wollen wir manchmal Code nur unter bestimmten Umständen ausführen.

Hierfür gibt es, wie in High Level Sprachen, das **if**, **else if** und **else**.

Wichtige Regeln:
- Das **erste if hat Priorität** und es wird aus einem if Block nur eine Anweisung ausgeführt.
- Es sollte **immer** ein **else** angegeben sein, da sonst unklar ist, was das Synthesetool macht, wenn keiner der Fälle eintritt.

```verilog
module modul_if(
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
        signal_1 = 1;
        signal_2 = 0;
        signal_3 = 0;
     end
     else if ((signal_a_in == 1) && ~(signal_b_in == 1)) begin
        signal_1 = 0;
        signal_2 = 1;
        signal_3 = 0;
     end
     else begin
        signal_1 = 0;
        signal_2 = 0;
        signal_3 = 1;
     end
end

assign signal_1_out = signal_1;
assign signal_2_out = signal_2;
assign signal_3_out = signal_3;

endmodule
```

---

---
lesson_id: 15
lesson_title: "Breite von Signalen"
difficulty: "intermediate"
duration_min: 15
type: "theory"
---

### Breite von Signalen

Bis jetzt haben wir immer nur Signale betrachtet, welche ein Bit breit sind, also nur High (1) oder Low (0) sein können.

Damit ist zwar schon möglich alles zu bauen, was es gibt, allerdings ist es manchmal schön, vor allem bei Zahlen, wenn die zugehörigen Bits direkt beieinander sind und man sich die einzelnen Leitungen zusammensuchen muss. Hierfür kann man hinter den Typ des Signals die **Bitbreite n** in eckigen Klammern [n-1:0] angeben.

Somit können wir nun unsigned Zahlen direkt vergleichen oder Grundoperationen auf diese anwenden.

**⚠️ Achtung:** Das Synthesetool ist erbarmungslos! Wenn die Bitbreiten nicht passen, dann wird radikal abgeschnitten oder mit Nullen gefüllt. Meist gibt es eine Warnung, aber es ist immer gut vorsichtig zu sein, sodass das gewollte Verhalten entsteht.

```verilog
module modul_bitwidth(
    input [3:0] signal_a_in,
    input [3:0] signal_b_in,
    output signal_a_equals_b_out,
    output signal_a_less_b_out,
    output [3:0] signal_c_out
);

logic [3:0] signal_c;

always @ (*) begin
    if (signal_a_in == 3) begin
        signal_c = 3;
    end
    else begin
        signal_c = 0;
    end
end

assign signal_a_equals_b_out = (signal_a_in == signal_b_in);
assign signal_a_less_b_out = (signal_a_in < signal_b_in);
assign signal_c_out = signal_c;

endmodule
```

---

---
lesson_id: 16
lesson_title: "Vorzeichen"
difficulty: "intermediate"
duration_min: 12
type: "theory"
---

### Vorzeichen

Im letzten Teil haben wir Bitbreiten eingeführt, um einfacher Zahlen darstellen zu können, allerdings haben wir noch keinen Weg einfach das Vorzeichen darzustellen, sodass ein Vergleich im Zweikomplement einer negativen Zahl und einer positiven Zahl, zum Beispiel -1 > 1, wahr zurückgeben würde, da z.B. in 8 Bit 8'hFF > 8'h01 unsigned gilt.

**Unsigned** bedeutet, dass diese Zahl keine Vorzeichen hat und immer als positive Zahl gesehen wird.

Um dies zu ändern nutzt man **signed** bei der Einführung des Signals direkt hinter input/output oder logic. Verilog verwendet dann **automatisch** das **Zweierkomplement**.

**⚠️ WICHTIG:** Wenn nur ein Wert in einer Abfolge von Operationen unsigned ist, dann wird die komplette Abfolge in der Regel als unsigned betrachtet.

```verilog
module modul_signed(
    input signed [3:0] signal_a_in,
    input signed [3:0] signal_b_in,
    output signal_a_equals_b_out,
    output signal_a_less_b_out
);

logic signed signal_a_less_b;

assign signal_a_equals_b_out = (signal_a_in == signal_b_in);
assign signal_a_less_b = (signal_a_in < signal_b_in);
assign signal_a_less_b_out = signal_a_less_b;

endmodule
```

---

---
lesson_id: 17
lesson_title: "Case: If nur anders"
difficulty: "intermediate"
duration_min: 10
type: "theory"
---

### Case: If nur anders

Wenn man einen langen if Block, welcher allerdings nur auf eine Variable prüft hat, lohnt es sich einen case Block zu verwenden.

*(Diese Lektion wird noch entwickelt)*

---

---
lesson_id: 18
lesson_title: "Arrays von Registern"
difficulty: "advanced"
duration_min: 15
type: "theory"
---

### Arrays von Registern

*(Diese Lektion wird noch entwickelt)*

---

---
lesson_id: 19
lesson_title: "Bit-Shifts"
difficulty: "advanced"
duration_min: 15
type: "theory"
---

### Bit-Shifts

*(Diese Lektion wird noch entwickelt)*

---

---
lesson_id: 20
lesson_title: "Zusammenfassung Syntax"
difficulty: "beginner"
duration_min: 30
type: "theory"
---

### Zusammenfassung

*(Diese Lektion wird noch entwickelt)*

---

---
lesson_id: 21
lesson_title: "Halbaddierer"
difficulty: "advanced"
duration_min: 20
type: "<project>"
---

## Die Anfänge

### Halbaddierer

Da wir nun mit dem Syntax etwas vertraut sind wollen wir uns an ein Problem heranwagen, welches die Zusammensetzung mehrerer Gatter erfordert und zwei Ausgänge hat.

*(Diese Lektion wird noch entwickelt)*

---

---
lesson_id: 22
lesson_title: "Datenspeicher 1: SR-Latch"
difficulty: "advanced"
duration_min: 25
type: "theory"
---

## SystemVerilog Erweiterung

### Praxis: Datenspeicher 1 - SR-Latch

Jede Funktion eines Computers ist bereits mit Aneinanderreihungen von NAND-Gattern abbildbar. Somit muss es auch möglich sein Daten zu speichern.

Um dies umzusetzen müssen wir einige Forderungen an unser Speichersystem stellen, damit es so agiert, wie wir es wollen.

Zuerst wollen wir versuchen ein System zu bauen, welches ein High speichert, sobald ein Set-Signal aktiviert wird und löscht, also auf Low geht, wenn ein Reset-Signal aktiviert wird.

*(Diese Lektion wird noch entwickelt)*

---

---
lesson_id: 23
lesson_title: "Datenspeicher 2: D-Latch"
difficulty: "advanced"
duration_min: 30
type: "exercise"
---

### Praxis: Datenspeicher 2 - D-Latch

Kommen wir nun zu einer weiterentwickelten Version, dem **D-Latch**.

Im letzten Teil haben wir uns damit beschäftigt, wie man High aktiv speichern und löschen kann. Das ist zwar schon gut, aber leider noch nicht so nützlich.

Jetzt wollen wir uns anschauen, wie ein System funktioniert, welches den input abspeichert, egal welchen Wert dieser hat und das **immer wenn wir es wollen**.

Versuchen Sie selbst ein System zu entwickeln, welches das **eingehende Signal kopiert**, solange das **Enable-Signal High** ist.

**⚠️ HINWEIS:** Dieses Modul MUSS im Synthesetool getestet werden. Es kann sein, dass D-Latches in Verilog zu Fehlern führen.

**EXERCISE_START**
```verilog
module modul_d_latch(
    input data_in,
    input enable_in,
    output data_out
);

// TODO: Hier Code einfügen

endmodule
```
**EXERCISE_END**

**SOLUTION_START**
```verilog
module modul_d_latch(
    input data_in,
    input enable_in,
    output data_out
);

logic save_high;
logic not_data;
logic save_low;
logic high_or_norlow;
logic low_or_norhigh;
logic norhigh;
logic norlow;

assign save_high = data_in & enable_in;
assign not_data = ~ data_in;
assign save_low = not_data & enable_in;
assign high_or_norlow = save_high | norlow;
assign low_or_norhigh = save_low | norhigh;
assign norhigh = ~high_or_norlow;
assign norlow = ~low_or_norhigh;
assign data_out = norlow;

endmodule
```
**SOLUTION_END**

---

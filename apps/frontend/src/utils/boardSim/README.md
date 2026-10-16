# Basys3-Board-Simulation

Der Dock-Reiter **„Basys3“** lässt das Top-Modul eines Projekts auf einem virtuellen
Digilent Basys3 laufen: 16 Schalter, 5 Taster, 16 LEDs und eine 4-stellige 7-Segment-Anzeige,
alles live bedienbar.

Leitidee der Umsetzung: **Der Server synthetisiert nur einmal kurz, simuliert wird im Browser.**
Ein Lauf auf dem Server dauert unter einer Sekunde (Yosys, kein Verilator). Danach läuft die
Simulation in einem Web Worker auf dem Rechner der Nutzerin bzw. des Nutzers, beliebig lange und
ohne den Server zu belasten.

- [Teil 1: Funktionen](#teil-1-funktionen) – Bedienung, Port-Namen, Anzeige, Grenzen
- [Teil 2: Implementierung](#teil-2-implementierung) – Ablauf, Compiler, Worker, Mittelung, Konstanten

---

## Teil 1: Funktionen

### Bedienung

1. Design im Editor schreiben; Ports wie im Basys3-Master-XDC benennen (siehe unten).
2. Im Dock den Reiter **Basys3** öffnen und **„⚙ Synthetisieren & starten“** klicken.
3. Schalter und Taster bedienen, LEDs und Anzeige beobachten.

Die Testbench spielt keine Rolle, das Board nutzt nur das Design (Top-Datei ★ samt aller
Design-Dateien, Packages und Header).

| Element | Funktion |
|---|---|
| ⚙ Synthetisieren / Neu synthetisieren | Design an den Server schicken, Netlist laden, Simulation starten |
| ▶ Start / ⏸ Pause | Simulation laufen lassen bzw. anhalten |
| +1 Takt | Einen Takt weiter (nur pausiert) |
| ⟲ Neustart | Alle Register auf ihre Startwerte, wie nach dem Laden des Bitstreams |
| Takt `[−] [Wert] [Einheit] [+]` | Simulierter Takt von 1 mHz bis 100 MHz oder **Max** (so schnell wie möglich). Wert frei eingeben (Komma oder Punkt, Enter übernimmt, Esc verwirft), Einheit Max/MHz/kHz/Hz/mHz; −/+ und ↑/↓ im Feld springen in 1-2-5-Schritten (… 1, 2, 5, 10 …). „−“ von Max aus geht auf den nächsten Schritt unter dem gerade erreichten Takt |
| Statuszeile | Erreichter Takt, Faktor zu 100 MHz, simulierte Zeit und Taktanzahl |
| „Code geändert – neu synthetisieren“ | Der Code wurde nach der letzten Synthese geändert |
| Infozeile unter dem Board | Zugeordnete Ports, Zellen/Flip-Flops, nicht zugeordnete Ports, fehlender Takt |

Ist der Reiter nicht sichtbar (anderer Reiter, anderer Browser-Tab), pausiert die Simulation
automatisch und läuft beim Zurückkehren weiter.

**Schalter:** Klick schaltet um (oder Fokus + Leertaste/Enter).
**Taster:** gedrückt, solange die Maus gedrückt ist (oder Leertaste/Enter gehalten wird).
**Umschalt+Klick** rastet einen Taster ein (gelb markiert), ein zweiter Umschalt+Klick löst ihn.
Nicht verbundene Schalter, Taster und LEDs werden abgeblendet dargestellt.

### Port-Namen

Zugeordnet wird über die Portnamen des Top-Moduls, wie im Basys3-Master-XDC von Digilent.
Groß-/Kleinschreibung spielt keine Rolle (`btnC`, `BTNC` und `btnc` funktionieren).

| Board | Port | Richtung | Polarität | Auch erkannt |
|---|---|---|---|---|
| 100-MHz-Takt | `clk` | input | – | `clk100mhz`, `clk_100mhz`, `clock`, `sysclk`, `sys_clk`, `clk_i` |
| Schalter SW15…SW0 | `sw[15:0]` | input | 1 = oben | `sws`, `switch`, `switches`, `sw_i` |
| Taster | `btnC`, `btnU`, `btnL`, `btnR`, `btnD` | input | 1 = gedrückt | `btn_c`, `btncenter`, `btn_u`, `btnup`, … |
| LEDs LD15…LD0 | `led[15:0]` | output | 1 = an | `leds`, `led_o` |
| Segmente a…g | `seg[6:0]` (`seg[0]` = a) | output | aktiv low | `segs`, `segment`, `segments`, `seg_o` |
| Dezimalpunkt | `dp` | output | aktiv low | `dp_o`; alternativ `seg[7]` bei 8 Bit breitem `seg` |
| Anoden AN3…AN0 | `an[3:0]` (`an[0]` = rechte Ziffer) | output | aktiv low | `anode`, `anodes`, `an_o` |

Schmalere Vektoren (z. B. `sw[7:0]`) werden auf die unteren Bits gelegt. Ports mit anderen
Namen bleiben unverbunden: Eingänge sind dann 0, sie stehen in der Infozeile. Ohne `clk` läuft
nur kombinatorische Logik (Schalter/Taster können aber selbst als Takt dienen).

Minimalbeispiel:

```systemverilog
module top (
  input  logic        clk,
  input  logic        btnC,
  input  logic [15:0] sw,
  output logic [15:0] led
);
  logic [26:0] cnt;
  always_ff @(posedge clk or posedge btnC)
    if (btnC) cnt <= '0;
    else      cnt <= cnt + 1'b1;
  assign led = {cnt[26:19], sw[7:0]};   // obere LEDs zählen, untere zeigen die Schalter
endmodule
```

### Zeitverhalten

Die Simulation läuft langsamer als das echte Board. Typische Übungsdesigns erreichen im Browser
etwa **5–20 MHz**, also 1:5 bis 1:20 der echten 100 MHz (abhängig von Designgröße und Rechner).
Alle Zeitangaben auf dem Board (simulierte Zeit, Nachleuchten, Tastendauer) beziehen sich auf
**Board-Zeit bei 100 MHz**, nicht auf die Echtzeit.

Praktische Folgen und Tipps:

- Ein Design, das auf dem Board 1-mal pro Sekunde blinkt, blinkt in der Simulation etwa alle 5–20 s.
- Für schnelleres Feedback den Teiler im Design parametrierbar machen (z. B. `parameter int CLK_FREQ`)
  und für die Simulation kleiner wählen, oder einen „Turbo“-Schalter einbauen.
- Mit dem Takt-Regler lässt sich die Simulation bewusst verlangsamen (bis 1 mHz, also ein Takt
  alle 1000 s), um einzelne Zustandswechsel zu verfolgen; **+1 Takt** im Pause-Modus geht taktgenau vor.
- Bei festem Takt zeigt die Statuszeile den eingestellten Wert, solange der Rechner mithält,
  sonst den tatsächlich erreichten.

### Anzeige: zeitliche Mittelung

LEDs und 7-Segment-Anzeige zeigen nicht den Momentanwert, sondern **den Anteil der Zeit, in dem
sie an waren**:

- PWM-gedimmte LEDs erscheinen gedimmt (z. B. 25 % Tastverhältnis = 25 % Helligkeit).
- Die gemultiplexte 7-Segment-Anzeige flackert nicht: Jede Ziffer zeigt die Segmente, die
  während ihrer aktiven Phase (Anode low) an waren, normiert auf diese Phase.
- Eine Ziffer, die gerade nicht aktiv ist, behält ihr Bild bis zu **50 ms Board-Zeit**
  (Nachleuchten des Auges). Multiplext ein Design langsamer, flackert es in der Simulation genauso
  wie auf dem echten Board.
- Ziffern, die sich sehr schnell ändern (z. B. Millisekunden einer Stoppuhr), verschwimmen
  wie in echt.

### Taster: Mindestdauer

Ein Mausklick dauert ~100 ms Echtzeit, bei 5 MHz Simulationstakt sind das nur ~500.000 Takte.
Entpreller für echte Hardware (10 ms = 1.000.000 Takte) würden kurze Klicks verlieren. Deshalb
hält **jeder Tasterzustand (gedrückt und losgelassen) mindestens 25 ms Board-Zeit**, höchstens
aber 1 s Echtzeit – und in jedem Fall mindestens 4 Takte, damit Synchronisierer und
Flankenerkennung den Druck auch bei sehr langsamem Takt sehen (bei 1 Hz also ~4 s). Schnelle Klickfolgen werden der Reihe nach abgearbeitet (bis 4 Klicks im Voraus).
Die Taste bleibt auf dem Board sichtbar gedrückt, solange das Design sie gedrückt sieht.
Im Pause-Modus wirken Taster sofort.

### Was unterstützt wird

Synthetisiert wird mit Yosys und dem SystemVerilog-Frontend **yosys-slang**, unterstützt ist also
synthetisierbares SystemVerilog bzw. Verilog-2005:

- `always_ff`/`always_comb`/`always @(...)`, `case`, `for`, `generate`, Funktionen, Packages,
  `typedef`/`enum`/`struct`, Parameter, beliebig tiefe Modulhierarchien, Header per `` `include ``
- Beliebige Breiten (bis 32 Bit schnell, darüber mit BigInt), signed/unsigned, `*`, `/`, `%`, `**`, Shifts
- Mehrere und **abgeleitete Takte** (`always_ff @(posedge clk_div)`), negative Flanken,
  Schalter/Taster als Takt
- **Asynchrone Resets** (`posedge clk or posedge rst`), wirken sofort, auch bei langsamen Takten;
  asynchrones Setzen/Laden
- Speicher (RAM/ROM), synchron und asynchron gelesen, inklusive Initialisierung
- Startwerte aus Deklarationen (`logic [7:0] c = 8'd5;`) und `initial`-Blöcken
  (z. B. ROM-Inhalte); `$display` & Co. werden ignoriert
- Latches

### Grenzen

| Thema | Verhalten |
|---|---|
| Zweiwertige Logik | `x`/`z` werden als 0 simuliert; Register starten mit 0, sofern kein Startwert angegeben ist |
| Division durch 0 | ergibt 0 (wie Verilator, also wie die normale HDLab-Simulation) |
| Kombinatorische Schleifen | werden mit Fehlermeldung abgelehnt |
| Zeitangaben | `#10` und andere Verzögerungen werden ignoriert, es zählt nur der Takt |
| Pinbelegung | nur über Portnamen; XDC-Dateien werden nicht ausgewertet |
| Board-Peripherie | nur Schalter, Taster, LEDs, 7-Segment; kein VGA, UART/USB, PMOD |
| Codeänderungen | erfordern eine neue Synthese (Hinweis in der Toolbar) |
| Größe | bis 200.000 Zellen, Speicher bis 2^20 Wörter, Netlist bis 12 MB |
| Nicht unterstützt | asynchrone Speicher-Schreibports, Leseports mit asynchronem Reset, `$dffsr` über 32 Bit, `$bmux` mit mehr als 10 Auswahlbits |

### Typische Fehlermeldungen

| Meldung | Ursache | Abhilfe |
|---|---|---|
| Yosys-Fehler mit Zeilennummer | Syntax- oder Elaborationsfehler, nicht synthetisierbarer Code | Code korrigieren; nicht synthetisierbares (Testbench-Konstrukte) entfernen |
| „Nicht unterstützte Elemente im Design: …“ | Zelltyp, den der Simulator nicht kennt (siehe Grenzen) | Konstrukt umschreiben |
| „Kombinatorische Schleife im Design“ | Ein Signal hängt ohne Register von sich selbst ab | Rückkopplung über ein Register führen |
| „Das Design kommt nicht zur Ruhe …“ | Takt/Reset hängt über Logik von sich selbst ab, Zustände kippen endlos | Takt- und Resetlogik prüfen |
| „Netz mit mehreren Treibern“ | Ein Signal wird von mehreren Stellen getrieben | Nur einen Treiber pro Signal |
| Kein Takteingang „clk“ gefunden | Takt heißt anders | Port `clk` nennen |
| Nicht zugeordnet: … | Port mit unbekanntem Namen | Namen aus der Tabelle oben verwenden |

---

## Teil 2: Implementierung

### Überblick

```
Browser (Basys3Board.jsx)                     Server
──────────────────────────                    ──────────────────────────────────────────
"Synthetisieren" ─ POST /api/projects ──────▶ Backend: Projekt speichern
                 ─ POST /api/simulations ───▶ Backend: Simulation {settings.mode: 'board'}
                   (mode 'board', topModule,             │ RabbitMQ "simulations"
                    topFile)                             ▼
                 ◀ GET  .../results (Polling)  Worker: processBoardSynthesis → boardRunner.js
                                                        │ docker run hdl-sim-verilator MODE=board
                                                        ▼
                                               Container: run_board (Yosys) → board.json
                                                        │
                                               Worker: compactNetlist → Mongo "BoardNetlist"
                 ◀ GET  .../board (JSON) ───── Backend
        │
        ▼ postMessage({type: 'load', netlist})
Web Worker (boardSim.worker.js)
  compile.js:   Netlist → JavaScript-Simulator (new Function)
  basys3.js:    Ports → Board-Rollen
  Schleife:     Takte rechnen, Ausgänge als Histogramm sammeln
  display.js:   zeitliche Mittelung → Helligkeiten
        │ postMessage({type: 'frame', leds, digits, held, …}) ~30×/s
        ▼
Basys3Board.jsx: SVG-Board rendern; Schalter/Taster → postMessage({type: 'input'})
```

### Dateien

| Datei | Aufgabe |
|---|---|
| `docker/sim-verilator/entrypoint.sh` (`run_board`) | Yosys-Flow, schreibt `board.json` und `sim.log` |
| `apps/worker/src/index.js` (`processBoardSynthesis`) | Job mit `settings.mode === 'board'` erkennen, Ergebnis speichern |
| `apps/worker/src/boardRunner.js` | Container starten, `compactNetlist`, Größenlimit |
| `apps/worker/src/models/BoardNetlist.js`, `apps/backend/src/models/BoardNetlist.js` | Mongo-Model `{ simulationId, json, createdAt }` |
| `apps/backend/src/routes.js` | `GET /api/simulations/:id/board`, `hasBoard` in `.../results` |
| `apps/frontend/src/App.jsx` (`synthesizeBoard`) | Projekt hochladen, Job anlegen, pollen, Netlist laden |
| `apps/frontend/src/components/SimulationPanel.jsx` | Reiter „Basys3“ im Dock |
| `apps/frontend/src/components/Basys3Board.jsx`, `Basys3Board.css` | Oberfläche (SVG-Board, Toolbar) |
| `apps/frontend/src/utils/boardSim/compile.js` | Netlist → JavaScript |
| `apps/frontend/src/utils/boardSim/basys3.js` | Board-Konstanten, Port-Zuordnung, Bitlayout des Ausgabe-Schlüssels |
| `apps/frontend/src/utils/boardSim/boardSim.worker.js` | Simulationsschleife, Geschwindigkeit, Taster-Warteschlange |
| `apps/frontend/src/utils/boardSim/speed.js` | Takt-Regler: Einheiten, Eingabe parsen, 1-2-5-Schritte, Grenzen 1 mHz…100 MHz |
| `apps/frontend/src/utils/boardSim/display.js` | Zeitliche Mittelung von LEDs und 7-Segment |

### Server: Synthese

Der Worker startet den Sim-Container mit `MODE=board`, `TOPMODULE` und `SV_SOURCES`
(Kompilierreihenfolge, Packages zuerst; Header liegen nur im Verzeichnis). `run_board` führt aus:

```
read_slang -j 1 --ignore-timing --ignore-assertions $SV_SOURCES --top $TOPMODULE
hierarchy -top $TOPMODULE
proc                    # always-Blöcke → Multiplexer und Flip-Flops
flatten                 # Hierarchie auflösen: ein einziges Modul
opt_clean
memory -nomap -nordff   # Arrays als $mem_v2 behalten (nicht in Flip-Flops zerlegen),
                        # Ausgangsregister nicht in den Speicher ziehen
opt -full
dffunmap                # Enable/synchronen Reset als Multiplexer vor das Flip-Flop
opt_clean -purge
write_json -compat-int board.json
```

- Erst **mit** `initial`-Blöcken (Startwerte, ROM-Inhalte); schlägt das fehl, ein zweiter Versuch
  mit `--ignore-initial`. Timeout je 120 s; bei Fehler Exit-Code 7, `sim.log` enthält die Yosys-Ausgabe.
- Bewusst **kein** `async2sync`: es würde asynchrone Resets synchron machen, und ein kurzer
  Reset-Puls ginge bei langsamen abgeleiteten Takten verloren. Der Simulator kann `$adff` direkt.
- `compactNetlist` (Worker) behält nur Ports, Zellen (Typ, Parameter, Verbindungen, Richtungen)
  und Netznamen mit `init`-Attribut. Das spart ca. zwei Drittel; Grenze 12 MB (Mongo-Dokument max. 16 MB).

### Compiler (`compile.js`)

`compileNetlist(netlist, { clock, observe })` erzeugt den Quelltext eines Simulators,
`instantiate(compiled, change)` macht daraus mit `new Function` ein Objekt. Das geschieht im
Web Worker, nicht im UI-Thread.

**Signale.** Jeder Eingangsport und jeder Zellausgang wird eine Variable `s<n>`: bis 32 Bit eine
Number (immer vorzeichenlos im Bereich 0…2^w−1), darüber ein BigInt. Ein Netz-Bit gehört genau
einem Treiber `(Signal, Bitposition)`. Zelleingänge werden aus Bits zusammengesetzt (`gather`):
zusammenhängende Bitfolgen eines Signals werden zu Shift + Maske, Konstanten zu einem Literal,
ganze Signale direkt übernommen. Breiten, Vorzeichen-/Null-Erweiterung und Kürzung folgen den
Regeln von Yosys' `simlib`.

**Kombinatorik.** Kombinatorische Zellen und asynchrone Speicher-Leseports werden topologisch
sortiert (Kahn). Bleiben Zellen übrig, ist es eine kombinatorische Schleife → Fehler. Die
Anweisungen landen in Funktionen zu je 400 Zeilen (`c0()`, `c1()` …), weil V8 sehr große Funktionen
nicht optimiert; `comb()` ruft sie der Reihe nach auf.

**Takte und Zustand.** Alle taktflankengesteuerten Aktionen (Flip-Flops, Speicher-Schreibports,
synchrone Leseports) werden nach Taktnetz und Flanke gruppiert. `edges()`:

1. liest alle Takte, vergleicht mit dem vorherigen Wert → Flanken,
2. **tastet alle** D-Eingänge der ausgelösten Gruppen ab (`t<n> = D`), dann
3. **übernimmt** sie (`Q = t<n>`): gleichzeitige Flanken sehen also die alten Werte,
4. wendet asynchrone Resets/Sets/Loads an (`$adff`, `$aldff`, `$dffsr`; Pegel, nicht Flanke),
5. meldet, ob sich etwas geändert hat.

`settle()` wiederholt `edges()` + `comb()`, bis nichts mehr passiert. So funktionieren
**abgeleitete Takte**: Ein Flip-Flop toggelt `clk_div`, `comb()` rechnet weiter, der nächste
`edges()`-Durchlauf sieht die Flanke von `clk_div`. Nach 1000 Runden gilt das Design als
oszillierend (Fehler `OSCILLATION`).

**Schneller Pfad.** Ein Takt (`run(1)`) setzt `clk = 1`, `settle()`, `clk = 0`, `settle()`.
Liest keine kombinatorische Zelle den Takt direkt (der Normalfall), entfällt `comb()` vor
`settle()` (`clockFeedsLogic: false` in den Statistiken). Pro Takt läuft die Kombinatorik dann
typischerweise nur einmal.

**Speicher.** `$mem_v2` wird zu einem `Uint32Array` (bis 32 Bit Wortbreite) bzw. Array von BigInts,
initialisiert aus dem `INIT`-Parameter. Leseports ohne Takt sind kombinatorische Knoten,
getaktete Leseports und Schreibports sind Taktaktionen (Lesen vor Schreiben, Bit-Enables).

**Startwerte.** `init`-Attribute der Netze werden auf die Flip-Flop-Ausgänge übertragen und in
`INIT` abgelegt; `reset()` stellt sie (und die Speicherinhalte) wieder her.

**Beobachtete Ausgänge.** `observe` ist eine Liste von höchstens 31 Ausgangsbits. `key()` packt
sie in eine Number (Layout siehe `basys3.js`: Bit 0–15 LEDs, 16–22 Segmente a–g, 23 Dezimalpunkt,
24–27 Anoden). Nach jedem Takt vergleicht `note()` den Schlüssel; ändert er sich, ruft der
Simulator `change(alterSchlüssel, dauerInTakten)` auf. Statt jedes Takts wird so nur jede
Änderung gemeldet.

**Sicherheit.** Der erzeugte Code enthält nur Zahlen und generierte Bezeichner, nie Namen oder
Strings aus der Netlist (die aus Nutzercode stammt). Er läuft im Web Worker ohne DOM-Zugriff.

**Unterstützte Zelltypen.**

| Gruppe | Zellen |
|---|---|
| Unär/Reduktion | `$not $pos $neg $buf $reduce_and $reduce_or $reduce_xor $reduce_xnor $reduce_bool $logic_not` |
| Binär | `$and $or $xor $xnor $logic_and $logic_or $add $sub $mul $div $mod $divfloor $modfloor $pow` |
| Vergleich | `$lt $le $eq $ne $eqx $nex $ge $gt` |
| Shift | `$shl $shr $sshl $sshr $shift $shiftx` |
| Multiplexer | `$mux $pmux $bmux $demux $bwmux $tribuf` |
| Sonstige | `$slice $concat $equiv $initstate` |
| Zustand | `$dff $adff $aldff $dffsr $dlatch $mem_v2` |
| Ignoriert | `$scopeinfo $print $check $assert $assume $cover $live $fair $specify2 $specify3 $specrule $meminit $meminit_v2` |

**API des erzeugten Simulators:**

| Funktion | Bedeutung |
|---|---|
| `run(n)` | `n` volle Takte des Board-Takts |
| `setInput(index, value)` | Eingang setzen (Number oder BigInt), danach `comb()` + `settle()` |
| `reset()` | Startwerte, Speicherinhalte, Taktzähler 0 |
| `key()` | aktueller Schlüssel der beobachteten Ausgänge |
| `flush()` | Takte seit der letzten Meldung (für das Ende eines Frames) |
| `cycles()` | Takte seit dem Start |
| `readOutputs()` | alle Ausgangsports (Debugging, Tests) |

Beispiel: Für

```systemverilog
module top (input logic clk, input logic btnC, input logic [15:0] sw, output logic [15:0] led);
  logic [3:0] cnt;
  always_ff @(posedge clk or posedge btnC)
    if (btnC) cnt <= '0;
    else      cnt <= cnt + 1'b1;
  assign led = {sw[15:4], cnt};
endmodule
```

erzeugt der Compiler (gekürzt; `s0` = clk, `s1` = btnC, `s2` = sw, `s3` = Addierer, `s4` = cnt):

```js
function c0(){
  s3=(((s4+1))&15);                       // $add
}
function edges(){let ch=false;
  const c0=s0;                            // Taktnetz lesen
  const e0p=c0>p0;                        // steigende Flanke?
  p0=c0;
  if(e0p){ t0=s3; s4=t0; ch=true; }       // abtasten, dann übernehmen
  if(s1===1&&s4!==0){s4=0;ch=true;}       // asynchroner Reset ($adff)
  return ch;}
function run(n){for(let i=0;i<n;i++){s0=1;settle();s0=0;settle();cyc++;note();}}
function readOutputs(){return [(s4|((s2>>>4)<<4))];}   // led = {sw[15:4], cnt}
```

### Web Worker (`boardSim.worker.js`)

Nachrichten vom UI: `load { netlist, inputs }`, `input { role, value }`, `play`, `pause`,
`step { cycles }`, `reset`, `speed { hz }` (0 = Max).
Nachrichten zum UI: `loaded { stats, mapping }`, `frame { leds, digits, held, cycles, rate, running }`,
`error { message }`.

**Schleife.** `tick()` rechnet pro Durchlauf höchstens 12 ms und schläft danach (`setTimeout`),
die Seite bleibt flüssig und ein CPU-Kern wird nicht dauerhaft voll ausgelastet. Gerechnet wird in
Stücken (`chunk`), deren Größe sich auf etwa 1 ms Rechenzeit einregelt (verdoppeln unter 0,5 ms,
halbieren über 2 ms).

- **Max:** so viele Takte, wie in 12 ms passen, dann sofort der nächste Durchlauf.
- **Fester Takt:** Takte = Ziel × vergangene Echtzeit, Durchlauf alle 16 ms. Der Bruchteil eines
  Takts wird übertragen (bei 1 mHz sammelt sich über 1000 s ein ganzer Takt an). Kommt der
  Rechner nicht hinterher, wird höchstens 250 ms Rückstand aufgeholt.
- Gemeldeter Takt: bei festem Takt der Zielwert, solange alle fälligen Takte gerechnet wurden;
  sonst (und bei Max) ein gleitender Mittelwert (80/20) der Takte pro Echtzeit.

**Frames.** Am Ende jedes Durchlaufs geht das Histogramm `Schlüssel → Takte` an den
`DisplayAverager`; höchstens alle 33 ms (~30 Bilder/s) wird ein `frame` an das UI geschickt.
Pausiert zeigt die Anzeige den Momentanzustand (z. B. nach **+1 Takt** oder einer Eingabe).

**Taster.** Pro Taster gibt es Pegel, Zeitpunkt (Takt und Echtzeit) und eine Warteschlange.
Ein neuer Pegel wird übernommen, sobald der vorige mindestens 25 ms Board-Zeit
(2.500.000 Takte) **oder** 1 s Echtzeit und mindestens 4 Takte anlag; geprüft wird nach jedem Rechenstück. Die
Warteschlange fasst 8 Pegel (4 Klicks), bei Überlauf fällt das älteste Paar weg. Pausiert, bei
**+1 Takt** und bei **Neustart** werden Pegel sofort übernommen. `frame.held` meldet die Pegel,
die das Design gerade sieht.

### Zeitliche Mittelung (`display.js`)

Pro Frame entstehen aus dem Histogramm Summen: Takte gesamt, LED-Takte je LED, aktive Takte je
Ziffer (`an[d] = 0`) und Segment-Takte je Ziffer (`an[d] = 0` und `seg[s] = 0`).
Auch Frames ohne Takt (langsamer Takt, Pause) werden gespeichert: Sie zählen als Echtzeit, damit
sich das Fenster bei langsamem Takt nicht über viele Sekunden streckt. Die letzten 64 Frames
werden aufbewahrt.

Bei der Berechnung werden Frames vom neuesten rückwärts summiert, bis **50 ms Board-Zeit**
(5.000.000 Takte) **oder 100 ms Echtzeit** erreicht sind:

- **LED:** Helligkeit = LED-Takte / Takte. Die Echtzeitgrenze hält Reaktionen (Schalter → LED) schnell.
- **Ziffer:** War sie im Fenster mindestens 256 Takte aktiv (bei kleinen Fenstern mindestens ein
  Viertel des Fensters), ist die Segmenthelligkeit
  Segment-Takte / aktive Takte. Die Normierung auf die aktive Phase lässt gemultiplexte Ziffern voll
  hell erscheinen; sehr kurze Aktivphasen (Umschaltmoment) zählen nicht, sonst blitzt das Muster
  der vorigen Ziffer auf.
- **Nachleuchten:** Ist eine Ziffer im Fenster nicht aktiv, behält sie ihre letzte Helligkeit,
  solange ihre letzte Aktivität höchstens 50 ms Board-Zeit zurückliegt; sonst ist sie dunkel.

Enthält das Fenster keinen Takt (pausiert, sehr langsamer Takt), zählt der aktuelle Schlüssel als
Fenster aus einem Takt. Er läuft durch dieselbe Logik, Ziffern behalten also auch dann ihr
letztes Bild (z. B. beim Durchsteppen mit **+1 Takt**).

### Oberfläche (`Basys3Board.jsx`)

Props: `onSynthesize()` (liefert die Netlist, wirft bei Fehler mit dem Yosys-Log als Meldung),
`designKey` (ändert sich mit dem Code → Hinweis „Code geändert“), `active` (Reiter sichtbar),
`uiLanguage`.

- Der Web Worker wird bei der ersten Synthese erzeugt und beim Unmount beendet
  (`SimulationPanel` ist pro Projekt gekeyt: Projektwechsel beendet die Simulation).
- Schalter- und Tasterzustand bleiben über Neu-Synthesen erhalten und werden mit `load` übergeben.
- Pausiert wird bei `active === false` oder `document.hidden`; ob danach weiterläuft, merkt sich
  `wantRunRef`.
- Das Board ist ein SVG (viewBox 900×350) und skaliert mit der Dockgröße. Die Platinenfarben sind
  in beiden Themes gleich, Toolbar und Infozeile nutzen die Workbench-Tokens.
- Segment-/LED-Deckkraft: `0,08 + 0,92 × Helligkeit` (unbeleuchtete Segmente bleiben schwach sichtbar).

### Stellschrauben

| Konstante | Wert | Datei | Wirkung |
|---|---|---|---|
| `BASYS3_CLOCK_HZ` | 100 MHz | `basys3.js` | Bezug für Board-Zeit |
| `PERSISTENCE_S` | 0,05 s | `display.js` | Nachleuchten der Ziffern, maximales Mittelungsfenster |
| `WINDOW_MS` | 100 ms | `display.js` | maximales Mittelungsfenster in Echtzeit |
| `MIN_ACTIVE_CYCLES` | 256 | `display.js` | Mindest-Aktivzeit einer Ziffer für ein neues Bild |
| `MIN_BUTTON_LEVEL_CYCLES` | 25 ms Board-Zeit | `boardSim.worker.js` | Mindestdauer eines Tasterzustands |
| `MAX_BUTTON_LEVEL_MS` | 1000 ms | `boardSim.worker.js` | Obergrenze dafür in Echtzeit |
| `MIN_BUTTON_LEVEL_EDGES` | 4 Takte | `boardSim.worker.js` | Mindestdauer eines Tasterzustands in Takten |
| `MIN_HZ` / `MAX_HZ` | 1 mHz / 100 MHz | `speed.js` | Grenzen des Takt-Reglers |
| `BUDGET_MS` / `FRAME_MS` / `POST_MS` | 12 / 16 / 33 ms | `boardSim.worker.js` | Rechenzeit pro Durchlauf, Intervall bei festem Takt, UI-Bildrate |
| `MAX_CATCHUP_MS` | 250 ms | `boardSim.worker.js` | maximal aufgeholter Rückstand |
| `MAX_CELLS` / `MAX_MEM_WORDS` | 200.000 / 2^20 | `compile.js` | Größengrenzen |
| `MAX_SETTLE` | 1000 | `compile.js` | Runden bis „Oszillation“ |
| `CHUNK` | 400 | `compile.js` | Anweisungen pro erzeugter Funktion |
| `MAX_BOARD_JSON_BYTES` | 12 MB | `apps/worker/src/boardRunner.js` | Größe der gespeicherten Netlist |

### Verifikation

Bei der Entwicklung wurde der Compiler **differenziell gegen Verilator** geprüft: dieselben
Designs mit denselben Zufallseingaben, Ausgänge nach jedem Takt verglichen.

- Board-typische Designs (Arithmetik signed/unsigned und > 32 Bit, Zustandsautomat, abgeleiteter
  Takt mit asynchronem Reset, negative Flanke, RAM/ROM mit `initial`, Stoppuhr mit Multiplexing):
  bis 3000 Takte identisch.
- 250 zufällig erzeugte Designs mit gemischten Breiten, Vorzeichen, Shifts, Division,
  Vergleichen und Konkatenationen: alle identisch.
- Die Mittelung, die Taster-Warteschlange und die Oberfläche wurden mit Testdesigns im Worker bzw.
  im Browser (Firefox) geprüft.

Die Testskripte liegen nicht im Repository; ein automatisierter Test (z. B. Node-Skript mit
YoWASP-Yosys und dem Sim-Image als Referenz) wäre eine sinnvolle Ergänzung.

### Erweiterungsideen

- XDC-Dateien auswerten (Pinbelegung statt Portnamen)
- Weitere Boards (z. B. Nexys A7 mit 8 Ziffern und RGB-LEDs) über eine eigene Variante von `basys3.js`
- VGA-Ausgabe, UART-Konsole
- Waveform-Aufzeichnung ausgewählter Signale während der Board-Simulation

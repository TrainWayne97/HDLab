<!-- DEUTSCH / GERMAN -->
# Verilator Simulations-Container

## Zweck
Führt SystemVerilog-Simulationen mit Verilator in einer isolierten Umgebung aus.
Der Container unterstützt dabei zwei Modi:

- klassische SystemVerilog-Simulation mit `tb.sv`
- Python-Testbench mit `tb.py` und Cocotb

Verwendete Verilator-Version: **5.036** (fest im Dockerfile gesetzt). Zusätzlich ist **Yosys** installiert (eigener Layer, damit der Verilator-Build im Cache bleibt), um optional eine Netlist für die Schaltplan-Ansicht zu erzeugen. Seit Oktober 2026 als YoWASP-Build (`yowasp-yosys`, Version per `YOWASP_YOSYS_VERSION` im Dockerfile, als `/usr/local/bin/yosys` verlinkt) mit dem SystemVerilog-Frontend **yosys-slang**: Das Ubuntu-Paket (Yosys 0.33) versteht kein `import` in Packages oder Modul-Headern und kein `return` in Funktionen. Das WebAssembly-Modul wird beim Image-Build einmal kompiliert und liegt danach im Cache (`/root/.cache`).

## Nutzung
- Erwartet im Arbeitsverzeichnis `/sim` mindestens eine Design-Datei (`.sv` oder `.v`, seit Oktober 2026 frei benannt; die Datei mit dem Top-Modul wählt der Nutzer im Editor) und optional `tb.sv` (SystemVerilog-Testbench) oder `tb.py` (Cocotb-Testbench) sowie ggf. `sim_main.cpp` (C++-Testbench-Wrapper). Alle `.sv`/`.v`-Dateien (Packages, Untermodule) werden mitkompiliert.
- Startet mit `/entrypoint.sh`.
- Ergebnisse: `sim.log`, ggf. `waveform.vcd` und `netlist.json` im selben Verzeichnis.

### Relevante Umgebungsvariablen

- `TOPMODULE`: explizites Top-Modul für Verilator
- `COCOTB_TEST_MODULES`: Cocotb-Testmodulname(n), typischerweise `tb`
- `GENERATE_WAVE=0|1`: aktiviert/deaktiviert VCD-Erzeugung. Bei `1` wird Verilator (klassischer Flow und Cocotb-Makefile) mit `--trace --trace-structs` aufgerufen - ohne `--trace-structs` fehlten Signale in Structs/Interfaces und tieferen Modulhierarchien im VCD (seit September 2026).
- `SV_SOURCES` (seit Oktober 2026): vom Worker vorgegebene Reihenfolge aller `.sv`-Dateien (leerzeichengetrennt), Packages stehen vor den Dateien, die sie importieren. Wird für Verilator und das Cocotb-Makefile (`VERILOG_SOURCES`) verwendet; ohne Vorgabe alle `*.sv` alphabetisch.
- `NETLIST_SOURCES` / `NETLIST_LIBS` (seit Oktober 2026): Dateien für die Netlist. `NETLIST_SOURCES` (Packages + Top-Datei, Default `main.sv`) liest Yosys normal, `NETLIST_LIBS` (übrige Zusatzdateien ohne Package) nur als Library-Dateien (`read_slang -v`, im Fallback `read_verilog -sv -lib`), damit `prep -auto-top` kein unbenutztes Bibliotheksmodul als Top wählt.
- `MODE=board` (seit Oktober 2026): nur Synthese für die Basys3-Board-Simulation, kein Verilator-Lauf. Yosys liest `SV_SOURCES` mit `read_slang` (zuerst mit `initial`-Blöcken für Startwerte/ROM-Inhalte, bei Fehler mit `--ignore-initial`) und führt `hierarchy -top $TOPMODULE; proc; flatten; memory -nomap -nordff; opt -full; dffunmap` aus. Ergebnis: `board.json` (flache Netlist, im Browser simuliert), `sim.log` mit der Zellstatistik bzw. dem Yosys-Fehler (Exit-Code 7), Timeout je 120 s.
- `GENERATE_NETLIST=0|1` (seit Oktober 2026): bei `1` erzeugt Yosys **vor** der Simulation aus `NETLIST_SOURCES`/`NETLIST_LIBS` eine JSON-Netlist: zuerst mit `read_slang -j 1 --best-effort-hierarchy --ignore-timing --ignore-initial --ignore-assertions` (Testbench-Konstrukte wie Delays, `initial` und `$finish` werden ignoriert; `-j 1`, weil der WebAssembly-Build keine Threads kann), bei Fehler mit dem klassischen `read_verilog -sv`; danach `prep -auto-top; write_json netlist.json`, Timeout je 30 s. Der Worker rendert daraus den Schaltplan. Rein informativ: Yosys versteht weniger SystemVerilog als Verilator, ein Fehler wird deshalb nur geloggt (`[Entrypoint] Netlist konnte nicht erzeugt werden`, Ausgabe aus `yosys.log`) und bricht die Simulation nie ab.

## Beispiel (lokal bauen & testen)
```sh
cd docker/sim-verilator
sudo docker build -t hdl-sim-verilator .
sudo docker run --rm -v "$PWD/testdata:/sim" hdl-sim-verilator
```

## Integration Worker
- Worker kopiert User-Code in ein temporäres Verzeichnis, mounted es als `/sim` in den Container und startet diesen.
- Bei vorhandener `tb.py` wird Cocotb über ein generiertes Makefile ausgeführt.
- Ergebnisse werden nach der Simulation ausgelesen und gespeichert; `netlist.json` rendert der Worker mit `netlistsvg` zu SVG.

### Warnungen

Seit Oktober 2026 läuft auch der klassische Verilator-Flow mit `-Wno-fatal` (wie das Cocotb-Makefile): Warnungen wie `WIDTHTRUNC` brechen die Simulation nicht mehr ab, Vivado verhält sich genauso. Damit sie sichtbar bleiben, stellt `prepend_verilator_warnings` die Warnungen aus `verilator.log` (ohne Verilators Statistikzeilen) vor die Ausgabe in `sim.log`. Das Frontend zeigt im Output-Tab einen Hinweis mit der Anzahl und die vollständigen Warnungen unter „Details anzeigen“ (`apps/frontend/src/utils/simLog.js`).

## Bekannte Einschränkungen (aktueller Stand)

- `TOPMODULE` wird automatisch aus der ersten `module`-Deklaration in `tb.sv` erkannt, falls nicht explizit gesetzt (siehe `entrypoint.sh`); für Cocotb (`tb.py`) ist der Default `main`, sofern `TOPMODULE`/`sim.settings.topModule` nicht gesetzt ist
- Die dynamisch generierte `sim_main.cpp` (siehe Worker-README) begrenzt die Simulation auf 100 Zeiteinheiten - lang laufende Testbenches müssen deutlich davor `$finish` aufrufen
- Die Netlist wird aus der Top-Datei und den übrigen Design-Dateien erzeugt (nicht aus der Testbench); Designs mit Konstrukten, die weder yosys-slang noch `read_verilog` synthetisieren können, liefern keinen Schaltplan

---

# English Documentation

## Verilator Simulation Container

## Purpose
Runs SystemVerilog simulations with Verilator in an isolated environment. The container supports two modes:

- classic SystemVerilog simulation with `tb.sv`
- Python testbench with `tb.py` and Cocotb

Pinned Verilator version: **5.036** (fixed in the Dockerfile). **Yosys** is installed as well (own layer, so the Verilator build stays cached) to optionally generate a netlist for the schematic view. Since October 2026 it is the YoWASP build (`yowasp-yosys`, version via `YOWASP_YOSYS_VERSION` in the Dockerfile, linked as `/usr/local/bin/yosys`) with the SystemVerilog frontend **yosys-slang**: the Ubuntu package (Yosys 0.33) doesn't understand `import` in packages or module headers, nor `return` in functions. The WebAssembly module is compiled once during the image build and then cached (`/root/.cache`).

## Usage
- Expects at least one design file (`.sv` or `.v`, freely named since October 2026; the user picks the file holding the top module in the editor) in the working directory `/sim`, plus optionally `tb.sv` (SystemVerilog testbench) or `tb.py` (Cocotb testbench), and possibly `sim_main.cpp` (C++ testbench wrapper). All `.sv`/`.v` files (packages, submodules) are compiled.
- Starts with `/entrypoint.sh`.
- Results: `sim.log`, optionally `waveform.vcd` and `netlist.json` in the same directory.

### Relevant environment variables

- `TOPMODULE`: explicit top module for Verilator
- `COCOTB_TEST_MODULES`: Cocotb test module name(s), typically `tb`
- `GENERATE_WAVE=0|1`: enables/disables VCD generation. With `1`, Verilator (plain flow and Cocotb Makefile) is invoked with `--trace --trace-structs` - without `--trace-structs`, signals inside structs/interfaces and deeper module hierarchies were missing from the VCD (since September 2026).
- `SV_SOURCES` (since October 2026): order of all `.sv` files given by the worker (space-separated), packages come before the files importing them. Used for Verilator and the Cocotb makefile (`VERILOG_SOURCES`); if unset, all `*.sv` in alphabetical order.
- `NETLIST_SOURCES` / `NETLIST_LIBS` (since October 2026): files for the netlist. Yosys reads `NETLIST_SOURCES` (packages + top file, default `main.sv`) normally and `NETLIST_LIBS` (remaining additional files without a package) as library files only (`read_slang -v`, in the fallback `read_verilog -sv -lib`), so `prep -auto-top` never picks an unused library module as top.
- `MODE=board` (since October 2026): synthesis only for the Basys3 board simulation, no Verilator run. Yosys reads `SV_SOURCES` with `read_slang` (first with `initial` blocks for initial values/ROM contents, on failure with `--ignore-initial`) and runs `hierarchy -top $TOPMODULE; proc; flatten; memory -nomap -nordff; opt -full; dffunmap`. Result: `board.json` (flat netlist, simulated in the browser), `sim.log` with the cell statistics or the Yosys error (exit code 7), 120 s timeout each.
- `GENERATE_NETLIST=0|1` (since October 2026): with `1`, Yosys generates a JSON netlist from `NETLIST_SOURCES`/`NETLIST_LIBS` **before** the simulation: first with `read_slang -j 1 --best-effort-hierarchy --ignore-timing --ignore-initial --ignore-assertions` (testbench constructs like delays, `initial` and `$finish` are ignored; `-j 1` because the WebAssembly build has no threads), on failure with the classic `read_verilog -sv`; then `prep -auto-top; write_json netlist.json`, 30 s timeout each. The worker renders the schematic from it. Informational only: Yosys understands less SystemVerilog than Verilator, so a failure is only logged (`[Entrypoint] Netlist konnte nicht erzeugt werden`, output from `yosys.log`) and never aborts the simulation.

## Example (build & test locally)
```sh
cd docker/sim-verilator
sudo docker build -t hdl-sim-verilator .
sudo docker run --rm -v "$PWD/testdata:/sim" hdl-sim-verilator
```

## Worker Integration
- Worker copies user code into a temporary directory, mounts it as `/sim` in the container, and starts it.
- If `tb.py` is present, Cocotb is run via a generated Makefile.
- Results are read and stored after simulation; the worker renders `netlist.json` to SVG with `netlistsvg`.

### Warnings

Since October 2026 the classic Verilator flow also runs with `-Wno-fatal` (like the Cocotb makefile): warnings such as `WIDTHTRUNC` no longer abort the simulation, matching Vivado. To keep them visible, `prepend_verilator_warnings` puts the warnings from `verilator.log` (without Verilator's statistics lines) in front of the output in `sim.log`. The frontend shows a hint with the count in the output tab and the full warnings under "Show details" (`apps/frontend/src/utils/simLog.js`).

## Known Limitations (Current)

- `TOPMODULE` is auto-detected from the first `module` declaration in `tb.sv` if not explicitly set (see `entrypoint.sh`); for Cocotb (`tb.py`) it defaults to `main` unless `TOPMODULE`/`sim.settings.topModule` is set
- The dynamically generated `sim_main.cpp` (see worker README) caps evaluation at 100 time units - long-running testbenches must call `$finish` well before that
- The netlist is generated from the top file and the other design files (not from the testbench); designs with constructs neither yosys-slang nor `read_verilog` can synthesize produce no schematic

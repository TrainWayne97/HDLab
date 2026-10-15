<!-- DEUTSCH / GERMAN -->
# Verilator Simulations-Container

## Zweck
Führt SystemVerilog-Simulationen mit Verilator in einer isolierten Umgebung aus.
Der Container unterstützt dabei zwei Modi:

- klassische SystemVerilog-Simulation mit `tb.sv`
- Python-Testbench mit `tb.py` und Cocotb

Verwendete Verilator-Version: **5.036** (fest im Dockerfile gesetzt). Zusätzlich ist **Yosys** installiert (eigener Layer, damit der Verilator-Build im Cache bleibt), um optional eine Netlist für die Schaltplan-Ansicht zu erzeugen.

## Nutzung
- Erwartet im Arbeitsverzeichnis `/sim` mindestens `main.sv` (Design) und optional `tb.sv` (SystemVerilog-Testbench) oder `tb.py` (Cocotb-Testbench) sowie ggf. `sim_main.cpp` (C++-Testbench-Wrapper). Weitere `.sv`-Dateien (SystemVerilog-Packages, Module aus der Bibliothek) werden mitkompiliert.
- Startet mit `/entrypoint.sh`.
- Ergebnisse: `sim.log`, ggf. `waveform.vcd` und `netlist.json` im selben Verzeichnis.

### Relevante Umgebungsvariablen

- `TOPMODULE`: explizites Top-Modul für Verilator
- `COCOTB_TEST_MODULES`: Cocotb-Testmodulname(n), typischerweise `tb`
- `GENERATE_WAVE=0|1`: aktiviert/deaktiviert VCD-Erzeugung. Bei `1` wird Verilator (klassischer Flow und Cocotb-Makefile) mit `--trace --trace-structs` aufgerufen - ohne `--trace-structs` fehlten Signale in Structs/Interfaces und tieferen Modulhierarchien im VCD (seit September 2026).
- `SV_SOURCES` (seit Oktober 2026): vom Worker vorgegebene Reihenfolge aller `.sv`-Dateien (leerzeichengetrennt), Packages stehen vor den Dateien, die sie importieren. Wird für Verilator und das Cocotb-Makefile (`VERILOG_SOURCES`) verwendet; ohne Vorgabe alle `*.sv` alphabetisch.
- `NETLIST_SOURCES` / `NETLIST_LIBS` (seit Oktober 2026): Dateien für die Netlist. `NETLIST_SOURCES` (Packages + `main.sv`, Default `main.sv`) liest Yosys normal, `NETLIST_LIBS` (übrige Zusatzdateien ohne Package) nur als Blackbox (`read_verilog -sv -lib`), damit `prep -auto-top` kein unbenutztes Bibliotheksmodul als Top wählt.
- `GENERATE_NETLIST=0|1` (seit Oktober 2026): bei `1` erzeugt Yosys **vor** der Simulation aus `main.sv` (plus `NETLIST_SOURCES`/`NETLIST_LIBS`) eine JSON-Netlist (`read_verilog -sv main.sv; prep -auto-top; write_json netlist.json`, Timeout 30 s). Der Worker rendert daraus den Schaltplan. Rein informativ: Yosys versteht weniger SystemVerilog als Verilator, ein Fehler wird deshalb nur geloggt (`[Entrypoint] Netlist konnte nicht erzeugt werden`, Ausgabe aus `yosys.log`) und bricht die Simulation nie ab.

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

## Bekannte Einschränkungen (aktueller Stand)

- `TOPMODULE` wird automatisch aus der ersten `module`-Deklaration in `tb.sv` erkannt, falls nicht explizit gesetzt (siehe `entrypoint.sh`); für Cocotb (`tb.py`) ist der Default `main`, sofern `TOPMODULE`/`sim.settings.topModule` nicht gesetzt ist
- Die dynamisch generierte `sim_main.cpp` (siehe Worker-README) begrenzt die Simulation auf 100 Zeiteinheiten - lang laufende Testbenches müssen deutlich davor `$finish` aufrufen
- Die Netlist wird nur aus `main.sv` erzeugt (nicht aus der Testbench); Designs mit SystemVerilog-Konstrukten, die Yosys nicht unterstützt, liefern keinen Schaltplan

---

# English Documentation

## Verilator Simulation Container

## Purpose
Runs SystemVerilog simulations with Verilator in an isolated environment. The container supports two modes:

- classic SystemVerilog simulation with `tb.sv`
- Python testbench with `tb.py` and Cocotb

Pinned Verilator version: **5.036** (fixed in the Dockerfile). **Yosys** is installed as well (own layer, so the Verilator build stays cached) to optionally generate a netlist for the schematic view.

## Usage
- Expects at least `main.sv` (design) in the working directory `/sim`, plus optionally `tb.sv` (SystemVerilog testbench) or `tb.py` (Cocotb testbench), and possibly `sim_main.cpp` (C++ testbench wrapper). Additional `.sv` files (SystemVerilog packages, modules from the library) are compiled as well.
- Starts with `/entrypoint.sh`.
- Results: `sim.log`, optionally `waveform.vcd` and `netlist.json` in the same directory.

### Relevant environment variables

- `TOPMODULE`: explicit top module for Verilator
- `COCOTB_TEST_MODULES`: Cocotb test module name(s), typically `tb`
- `GENERATE_WAVE=0|1`: enables/disables VCD generation. With `1`, Verilator (plain flow and Cocotb Makefile) is invoked with `--trace --trace-structs` - without `--trace-structs`, signals inside structs/interfaces and deeper module hierarchies were missing from the VCD (since September 2026).
- `SV_SOURCES` (since October 2026): order of all `.sv` files given by the worker (space-separated), packages come before the files importing them. Used for Verilator and the Cocotb makefile (`VERILOG_SOURCES`); if unset, all `*.sv` in alphabetical order.
- `NETLIST_SOURCES` / `NETLIST_LIBS` (since October 2026): files for the netlist. Yosys reads `NETLIST_SOURCES` (packages + `main.sv`, default `main.sv`) normally and `NETLIST_LIBS` (remaining additional files without a package) as blackboxes only (`read_verilog -sv -lib`), so `prep -auto-top` never picks an unused library module as top.
- `GENERATE_NETLIST=0|1` (since October 2026): with `1`, Yosys generates a JSON netlist from `main.sv` (plus `NETLIST_SOURCES`/`NETLIST_LIBS`) **before** the simulation (`read_verilog -sv main.sv; prep -auto-top; write_json netlist.json`, 30 s timeout). The worker renders the schematic from it. Informational only: Yosys understands less SystemVerilog than Verilator, so a failure is only logged (`[Entrypoint] Netlist konnte nicht erzeugt werden`, output from `yosys.log`) and never aborts the simulation.

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

## Known Limitations (Current)

- `TOPMODULE` is auto-detected from the first `module` declaration in `tb.sv` if not explicitly set (see `entrypoint.sh`); for Cocotb (`tb.py`) it defaults to `main` unless `TOPMODULE`/`sim.settings.topModule` is set
- The dynamically generated `sim_main.cpp` (see worker README) caps evaluation at 100 time units - long-running testbenches must call `$finish` well before that
- The netlist is generated from `main.sv` only (not from the testbench); designs using SystemVerilog constructs Yosys doesn't support produce no schematic

<!-- DEUTSCH / GERMAN -->
# Verilator Simulations-Container

## Zweck
Führt SystemVerilog-Simulationen mit Verilator in einer isolierten Umgebung aus.
Der Container unterstützt dabei zwei Modi:

- klassische SystemVerilog-Simulation mit `tb.sv`
- Python-Testbench mit `tb.py` und Cocotb

Verwendete Verilator-Version: **5.036** (fest im Dockerfile gesetzt).

## Nutzung
- Erwartet im Arbeitsverzeichnis `/sim` mindestens `main.sv` (Design) und optional `tb.sv` (SystemVerilog-Testbench) oder `tb.py` (Cocotb-Testbench) sowie ggf. `sim_main.cpp` (C++-Testbench-Wrapper).
- Startet mit `/entrypoint.sh`.
- Ergebnisse: `sim.log`, ggf. `waveform.vcd` im selben Verzeichnis.

### Relevante Umgebungsvariablen

- `TOPMODULE`: explizites Top-Modul für Verilator
- `COCOTB_TEST_MODULES`: Cocotb-Testmodulname(n), typischerweise `tb`
- `GENERATE_WAVE=0|1`: aktiviert/deaktiviert VCD-Erzeugung

## Beispiel (lokal bauen & testen)
```sh
cd docker/sim-verilator
sudo docker build -t hdl-sim-verilator .
sudo docker run --rm -v "$PWD/testdata:/sim" hdl-sim-verilator
```

## Integration Worker
- Worker kopiert User-Code in ein temporäres Verzeichnis, mounted es als `/sim` in den Container und startet diesen.
- Bei vorhandener `tb.py` wird Cocotb über ein generiertes Makefile ausgeführt.
- Ergebnisse werden nach der Simulation ausgelesen und gespeichert.

## Bekannte Einschränkungen (aktueller Stand)

- `TOPMODULE` wird automatisch aus der ersten `module`-Deklaration in `tb.sv` erkannt, falls nicht explizit gesetzt (siehe `entrypoint.sh`); für Cocotb (`tb.py`) ist der Default `main`, sofern `TOPMODULE`/`sim.settings.topModule` nicht gesetzt ist
- Die dynamisch generierte `sim_main.cpp` (siehe Worker-README) begrenzt die Simulation auf 100 Zeiteinheiten - lang laufende Testbenches müssen deutlich davor `$finish` aufrufen

---

# English Documentation

## Verilator Simulation Container

## Purpose
Runs SystemVerilog simulations with Verilator in an isolated environment. The container supports two modes:

- classic SystemVerilog simulation with `tb.sv`
- Python testbench with `tb.py` and Cocotb

Pinned Verilator version: **5.036** (fixed in the Dockerfile).

## Usage
- Expects at least `main.sv` (design) in the working directory `/sim`, plus optionally `tb.sv` (SystemVerilog testbench) or `tb.py` (Cocotb testbench), and possibly `sim_main.cpp` (C++ testbench wrapper).
- Starts with `/entrypoint.sh`.
- Results: `sim.log`, optionally `waveform.vcd` in the same directory.

### Relevant environment variables

- `TOPMODULE`: explicit top module for Verilator
- `COCOTB_TEST_MODULES`: Cocotb test module name(s), typically `tb`
- `GENERATE_WAVE=0|1`: enables/disables VCD generation

## Example (build & test locally)
```sh
cd docker/sim-verilator
sudo docker build -t hdl-sim-verilator .
sudo docker run --rm -v "$PWD/testdata:/sim" hdl-sim-verilator
```

## Worker Integration
- Worker copies user code into a temporary directory, mounts it as `/sim` in the container, and starts it.
- If `tb.py` is present, Cocotb is run via a generated Makefile.
- Results are read and stored after simulation.

## Known Limitations (Current)

- `TOPMODULE` is auto-detected from the first `module` declaration in `tb.sv` if not explicitly set (see `entrypoint.sh`); for Cocotb (`tb.py`) it defaults to `main` unless `TOPMODULE`/`sim.settings.topModule` is set
- The dynamically generated `sim_main.cpp` (see worker README) caps evaluation at 100 time units - long-running testbenches must call `$finish` well before that

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

---

# English Documentation

## Verilator Simulation Container

## Purpose
Runs SystemVerilog simulations with Verilator in an isolated environment.

Pinned Verilator version: **5.036** (fixed in the Dockerfile).

## Usage
- Expects at least `main.sv` (design) in the working directory `/sim`, optionally `tb.sv` (testbench) and `sim_main.cpp` (C++ testbench wrapper).
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
- Results are read and stored after simulation.

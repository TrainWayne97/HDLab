# Verilator Simulations-Container

## Zweck
Führt SystemVerilog-Simulationen mit Verilator in einer isolierten Umgebung aus.

## Nutzung
- Erwartet im Arbeitsverzeichnis `/sim` mindestens `main.sv` (Design) und optional `tb.sv` (Testbench) sowie ggf. `sim_main.cpp` (C++-Testbench-Wrapper).
- Startet mit `/entrypoint.sh`.
- Ergebnisse: `sim.log`, ggf. `waveform.vcd` im selben Verzeichnis.

## Beispiel (lokal bauen & testen)
```sh
cd docker/sim-verilator
sudo docker build -t hdl-sim-verilator .
sudo docker run --rm -v "$PWD/testdata:/sim" hdl-sim-verilator
```

## Integration Worker
- Worker kopiert User-Code in ein temporäres Verzeichnis, mounted es als `/sim` in den Container und startet diesen.
- Ergebnisse werden nach der Simulation ausgelesen und gespeichert.

#!/bin/bash
set -e


# Debug: Inhalt von /simtmp auflisten
echo "[Entrypoint] Inhalt von /simtmp vor Prüfung:"
ls -l /simtmp

# Arbeitsverzeichnis setzen
cd /simtmp

# Erwartet: main.sv und ggf. tb.sv im /simtmp-Verzeichnis
if [ ! -f main.sv ]; then
  echo "main.sv fehlt!" >&2
  exit 1
fi

# Optional: Testbench
TB_ARG=""
if [ -f tb.sv ]; then
  TB_ARG="tb.sv"
fi


# Kompilieren
verilator --cc main.sv $TB_ARG --exe sim_main.cpp || exit 2
make -C obj_dir -j -f Vmain.mk || exit 3

# Ausführen
./obj_dir/Vmain > sim.log 2>&1 || exit 4

# Ergebnis kopieren
cp sim.log /simtmp/
if [ -f waveform.vcd ]; then
  cp waveform.vcd /simtmp/
fi

echo "Simulation abgeschlossen."

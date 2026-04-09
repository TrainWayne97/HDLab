#!/bin/bash
set -e


# Debug: Inhalt von /simtmp auflisten
echo "[Entrypoint] Inhalt von /simtmp vor Prüfung:"
ls -l /simtmp

# Arbeitsverzeichnis setzen
cd /simtmp


# Alle .sv-Dateien sammeln
SV_FILES=$(ls *.sv 2>/dev/null | xargs)
if [ -z "$SV_FILES" ]; then
  echo "Keine .sv-Dateien gefunden!" >&2
  exit 1
fi


# Top-Level-Modul bestimmen (Standard: main, nur tb wenn tb.sv existiert, NICHT leer ist und ein Modul tb deklariert ist)
TOPMODULE="main"
if [ -s tb.sv ] && grep -q 'module[[:space:]]\+tb' tb.sv 2>/dev/null; then
  TOPMODULE="tb"
fi


# Kompilieren mit allen .sv-Dateien und Top-Level
echo "[Entrypoint] Verilator-Kommando: verilator --cc $SV_FILES --top-module $TOPMODULE --timing --exe sim_main.cpp"
verilator --cc $SV_FILES --top-module $TOPMODULE --timing --exe sim_main.cpp > verilator.log 2>&1 || {
  echo "[Entrypoint] Verilator-Fehler:"; cat verilator.log; cp verilator.log sim.log; exit 2;
}

echo "[Entrypoint] Inhalt von obj_dir nach Verilator:"
ls -l obj_dir
echo "[Entrypoint] Makefiles in obj_dir:"
ls obj_dir/*.mk || true

if [ ! -f obj_dir/V${TOPMODULE}.mk ]; then
  echo "[Entrypoint] Makefile obj_dir/V${TOPMODULE}.mk nicht gefunden!" | tee sim.log
  exit 3
fi

make -C obj_dir -j -f V${TOPMODULE}.mk || { echo "[Entrypoint] make-Fehler" | tee -a sim.log; exit 3; }

# Ausführen
./obj_dir/V${TOPMODULE} > sim.log 2>&1 || { echo "[Entrypoint] Ausführungsfehler" | tee -a sim.log; exit 4; }

# Ergebnis kopieren
cp sim.log /simtmp/
if [ -f waveform.vcd ]; then
  cp waveform.vcd /simtmp/
fi

echo "Simulation abgeschlossen."

#!/bin/bash
set -euo pipefail

echo "[Entrypoint] Inhalt von $PWD vor Prüfung:"
ls -la

if [ ! -f main.sv ]; then
  echo "Keine main.sv gefunden!" >&2
  exit 1
fi

run_cocotb() {
  local topmodule="${TOPMODULE:-main}"
  local testmodule="${COCOTB_TEST_MODULES:-tb}"
  local generate_wave="${GENERATE_WAVE:-0}"

  echo "[Entrypoint] Python Testbench tb.py erkannt, starte Cocotb-Flow"
  if ! command -v cocotb-config >/dev/null 2>&1; then
    echo "[Entrypoint] cocotb-config nicht gefunden" >&2
    exit 2
  fi

  cat > Makefile.cocotb <<EOF
TOPLEVEL_LANG ?= verilog
SIM ?= verilator
COCOTB_TOPLEVEL = ${topmodule}
COCOTB_TEST_MODULES = ${testmodule}
VERILOG_SOURCES += \$(wildcard *.sv)
EXTRA_ARGS += --timing -Wno-fatal
COMPILE_ARGS += --timing -Wno-fatal
ifeq (${generate_wave},1)
EXTRA_ARGS += --trace
COMPILE_ARGS += --trace
endif
COCOTB_HDL_TIMEUNIT = 1ns
COCOTB_HDL_TIMEPRECISION = 1ps
include \$(shell cocotb-config --makefiles)/Makefile.sim
EOF

  echo "[Entrypoint] Cocotb Makefile erstellt"
  make -f Makefile.cocotb 2>&1 | tee sim.log

  if [ "${generate_wave}" = "1" ] && [ ! -f waveform.vcd ]; then
    vcd_file="$(find . -maxdepth 3 -type f -name '*.vcd' | head -n 1 || true)"
    if [ -n "${vcd_file}" ]; then
      cp "${vcd_file}" waveform.vcd
    fi
  fi
}

run_verilator() {
  local generate_wave="${GENERATE_WAVE:-0}"
  SV_FILES=$(ls *.sv 2>/dev/null | xargs)
  if [ -z "$SV_FILES" ]; then
    echo "Keine .sv-Dateien gefunden!" >&2
    exit 1
  fi

  ls -la "$PWD"
  echo "[Entrypoint] mount output:"
  mount

  TOPMODULE="main"
  if [ -s tb.sv ] && grep -q 'module[[:space:]]\+tb' tb.sv 2>/dev/null; then
    TOPMODULE="tb"
  fi

  TRACE_ARGS=""
  if [ "${generate_wave}" = "1" ]; then
    TRACE_ARGS="--trace"
  fi

  echo "[Entrypoint] Verilator-Kommando: verilator --cc $SV_FILES --top-module $TOPMODULE --timing $TRACE_ARGS --exe sim_main.cpp"
  verilator --cc $SV_FILES --top-module "$TOPMODULE" --timing $TRACE_ARGS --exe sim_main.cpp > verilator.log 2>&1 || {
    echo "[Entrypoint] Verilator-Fehler:"; cat verilator.log; cp verilator.log sim.log; exit 3;
  }

  echo "[Entrypoint] Inhalt von obj_dir nach Verilator:"
  ls -l obj_dir
  echo "[Entrypoint] Makefiles in obj_dir:"
  ls obj_dir/*.mk || true

  if [ ! -f obj_dir/V${TOPMODULE}.mk ]; then
    echo "[Entrypoint] Makefile obj_dir/V${TOPMODULE}.mk nicht gefunden!" | tee sim.log
    exit 4
  fi

  make -C obj_dir -j -f V${TOPMODULE}.mk || { echo "[Entrypoint] make-Fehler" | tee -a sim.log; exit 5; }

  ./obj_dir/V${TOPMODULE} > sim.log 2>&1 || { echo "[Entrypoint] Ausführungsfehler" | tee -a sim.log; exit 6; }
}

if [ -f tb.py ]; then
  run_cocotb
else
  run_verilator
fi

echo "Simulation abgeschlossen."

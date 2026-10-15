#!/bin/bash
set -euo pipefail

echo "[Entrypoint] Inhalt von $PWD vor Prüfung:"
ls -la

if [ ! -f main.sv ]; then
  echo "Keine main.sv gefunden!" >&2
  exit 1
fi

# Reihenfolge der SV-Quellen kommt vom Worker (Packages vor den Dateien, die sie
# importieren). Ohne Vorgabe: alle .sv-Dateien alphabetisch wie bisher.
SV_SOURCES="${SV_SOURCES:-$(ls *.sv 2>/dev/null | xargs)}"

# Netlist fuer die Schaltplan-Ansicht (Yosys -> JSON, gerendert wird im Worker).
# Rein informativ: Yosys versteht weniger SystemVerilog als Verilator, ein Fehler
# hier darf die Simulation deshalb nie abbrechen.
generate_netlist() {
  if [ "${GENERATE_NETLIST:-0}" != "1" ]; then
    return 0
  fi
  if ! command -v yosys >/dev/null 2>&1; then
    echo "[Entrypoint] yosys nicht installiert, ueberspringe Netlist"
    return 0
  fi
  local sources="${NETLIST_SOURCES:-main.sv}"
  local libs="${NETLIST_LIBS:-}"

  # 1. yosys-slang: versteht Packages (import im Package/Modul-Header), return in
  #    Funktionen usw. Testbench-Konstrukte (initial, Delays, $finish) werden ignoriert.
  #    Zusatzdateien ohne Package sind Library-Dateien (-v): nur genutzte Module zaehlen.
  #    -j 1, weil der WebAssembly-Build keine Threads kann.
  local slang="read_slang -j 1 --best-effort-hierarchy --ignore-timing --ignore-initial --ignore-assertions $sources"
  if [ -n "$libs" ]; then
    slang="$slang -v ${libs// /,}"
  fi
  if timeout 30 yosys -q -p "$slang; prep -auto-top; write_json netlist.json" > yosys.log 2>&1; then
    return 0
  fi
  echo "[Entrypoint] read_slang fehlgeschlagen, versuche read_verilog:"
  cat yosys.log
  rm -f netlist.json

  # 2. Fallback: klassischer Yosys-Parser. Zusaetzliche Dateien ohne Package nur als
  #    Blackbox lesen, damit prep -auto-top kein unbenutztes Library-Modul als Top waehlt.
  local script="read_verilog -sv $sources;"
  if [ -n "$libs" ]; then
    script="$script read_verilog -sv -lib $libs;"
  fi
  timeout 30 yosys -q -p "$script prep -auto-top; write_json netlist.json" > yosys.log 2>&1 || {
    echo "[Entrypoint] Netlist konnte nicht erzeugt werden:"
    cat yosys.log
    rm -f netlist.json
  }
}

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
VERILOG_SOURCES += ${SV_SOURCES}
EXTRA_ARGS += --timing -Wno-fatal
COMPILE_ARGS += --timing -Wno-fatal
ifeq (${generate_wave},1)
EXTRA_ARGS += --trace --trace-structs
COMPILE_ARGS += --trace --trace-structs
endif
COCOTB_HDL_TIMEUNIT = 1ns
COCOTB_HDL_TIMEPRECISION = 1ps
include \$(shell cocotb-config --makefiles)/Makefile.sim
EOF

  echo "[Entrypoint] Cocotb Makefile erstellt"
  make -f Makefile.cocotb 2>&1 | tee sim.log

  if [ "${generate_wave}" = "1" ] && [ ! -f waveform.vcd ]; then
    vcd_file=$(find . -type f -name '*.vcd' | sort | head -n 1 || true)
    if [ -n "${vcd_file}" ]; then
      cp "${vcd_file}" waveform.vcd
      echo "[Entrypoint] VCD kopiert von ${vcd_file} nach waveform.vcd"
    else
      echo "[Entrypoint] Keine VCD-Datei gefunden!"
    fi
  fi
}

# Mit -Wno-fatal brechen Warnungen (z.B. WIDTHTRUNC) die Simulation nicht mehr ab, wie
# im Cocotb-Flow und in Vivado. Damit sie trotzdem sichtbar sind, kommen sie vor die
# Ausgabe der Simulation in sim.log (ohne Verilators Statistikzeilen).
prepend_verilator_warnings() {
  if [ -f verilator.log ] && grep -q '^%Warning' verilator.log; then
    {
      grep -v -e '^- V e r i l a t i o n' -e '^- Verilator:' verilator.log || true
      echo
      cat sim.log 2>/dev/null || true
    } > sim.log.tmp
    mv sim.log.tmp sim.log
  fi
}

run_verilator() {
  local topmodule="${TOPMODULE:-}"
  local generate_wave="${GENERATE_WAVE:-0}"
  SV_FILES="$SV_SOURCES"
  if [ -z "$SV_FILES" ]; then
    echo "Keine .sv-Dateien gefunden!" >&2
    exit 1
  fi

  ls -la "$PWD"
  echo "[Entrypoint] mount output:"
  mount

  if [ -z "$topmodule" ] && [ -s tb.sv ]; then
    topmodule="$(sed -E 's://.*$::; s:/\*[^*]*\*/::g' tb.sv | grep -Eo 'module[[:space:]]+[A-Za-z_][A-Za-z0-9_$]*' | head -n 1 | awk '{print $2}')"
  fi

  if [ -z "$topmodule" ]; then
    topmodule="main"
  fi

  TRACE_ARGS=""
  if [ "${generate_wave}" = "1" ]; then
    TRACE_ARGS="--trace --trace-structs"
  fi

  echo "[Entrypoint] Verilator-Kommando: verilator --cc $SV_FILES --top-module $topmodule --timing -Wno-fatal $TRACE_ARGS --exe sim_main.cpp"
  verilator --cc $SV_FILES --top-module "$topmodule" --timing -Wno-fatal $TRACE_ARGS --exe sim_main.cpp > verilator.log 2>&1 || {
    echo "[Entrypoint] Verilator-Fehler:"; cat verilator.log; cp verilator.log sim.log; exit 3;
  }

  echo "[Entrypoint] Inhalt von obj_dir nach Verilator:"
  ls -l obj_dir
  echo "[Entrypoint] Makefiles in obj_dir:"
  ls obj_dir/*.mk || true

  if [ ! -f obj_dir/V${topmodule}.mk ]; then
    echo "[Entrypoint] Makefile obj_dir/V${topmodule}.mk nicht gefunden!" | tee sim.log
    exit 4
  fi

  make -C obj_dir -j -f V${topmodule}.mk || { echo "[Entrypoint] make-Fehler" | tee -a sim.log; exit 5; }

  ./obj_dir/V${topmodule} > sim.log 2>&1 || { echo "[Entrypoint] Ausführungsfehler" | tee -a sim.log; prepend_verilator_warnings; exit 6; }
  prepend_verilator_warnings
}

generate_netlist

if [ -f tb.py ]; then
  run_cocotb
else
  run_verilator
fi

echo "Simulation abgeschlossen."

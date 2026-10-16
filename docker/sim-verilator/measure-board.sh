#!/bin/bash
# Misst, was eine Basys3-Board-Synthese auf dem Server kostet: genau den Container-Lauf, den
# der Worker bei "Synthetisieren" startet (MODE=board). Die Simulation selbst laeuft danach
# im Browser und braucht keine Server-Ressourcen.
#
# Aufruf:   docker/sim-verilator/measure-board.sh <top-modul> <dateien...>
#           Dateien: .sv/.v in Kompilierreihenfolge (Packages zuerst), Header .svh/.vh
# Optional: IMAGE=hdl-sim-verilator RUNS=3
# Beispiel: docker/sim-verilator/measure-board.sh basys3 main.sv defs.svh
#
# Pro Lauf (cgroup des Containers): Dauer inklusive Container-Start, davon Synthese,
# CPU-Zeit, Spitzen-RAM, Groesse von board.json und der Form, die in MongoDB landet.
set -euo pipefail

if [ $# -lt 2 ]; then
  sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
  exit 1
fi
IMAGE="${IMAGE:-hdl-sim-verilator}"
RUNS="${RUNS:-3}"
TOP="$1"
shift
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKER_SRC="$SCRIPT_DIR/../../apps/worker/src/boardRunner.js"

SOURCES=""
for f in "$@"; do
  [ -f "$f" ] || { echo "Datei nicht gefunden: $f" >&2; exit 1; }
  case "$f" in
    *.sv|*.v) SOURCES="$SOURCES $(basename "$f")" ;;
    *.svh|*.vh) ;;
    *) echo "Unbekannte Endung (erlaubt: .sv .v .svh .vh): $f" >&2; exit 1 ;;
  esac
done
SOURCES="${SOURCES# }"

WORK="$(mktemp -d)"
cleanup() {
  # Der Container schreibt als root: mit demselben Image aufraeumen
  docker run --rm -v "$WORK":/w --entrypoint rm "$IMAGE" -rf /w/runs >/dev/null 2>&1 || true
  rm -rf "$WORK"
}
trap cleanup EXIT
mkdir -p "$WORK/runs"

kb() { awk -v b="$1" 'BEGIN { printf "%.1f KB", b / 1024 }'; }
mb() { awk -v b="$1" 'BEGIN { printf "%.0f MB", b / 1048576 }'; }
sec() { awk -v ms="$1" 'BEGIN { printf "%.2f s", ms / 1000 }'; }

echo "Image $IMAGE, Top-Modul $TOP, Quellen: $SOURCES"
printf '%-5s %10s %10s %10s %11s %12s %12s\n' Lauf Dauer Synthese CPU RAM-Spitze board.json "in MongoDB"
for i in $(seq 1 "$RUNS"); do
  dir="$WORK/runs/$i"
  mkdir -p "$dir"
  cp "$@" "$dir/"
  chmod -R 777 "$dir"

  t0=$(date +%s%N)
  stats=$(docker run --rm -v "$dir":/w -w /w -e MODE=board -e TOPMODULE="$TOP" -e SV_SOURCES="$SOURCES" \
    --entrypoint bash "$IMAGE" -c '
      s=$(date +%s%N); /entrypoint.sh >/dev/null 2>&1; rc=$?; e=$(date +%s%N)
      echo "$rc $(( (e - s) / 1000000 )) $(awk "/usage_usec/ { print \$2 }" /sys/fs/cgroup/cpu.stat) $(cat /sys/fs/cgroup/memory.peak)"')
  t1=$(date +%s%N)
  read -r rc synth_ms cpu_us mem_bytes <<< "$stats"
  if [ "$rc" != 0 ]; then
    echo "Synthese fehlgeschlagen (Exit-Code $rc):"
    cat "$dir/sim.log" 2>/dev/null || true
    exit 1
  fi

  raw=$(stat -c %s "$dir/board.json")
  stored="-"
  if command -v node >/dev/null && [ -f "$WORKER_SRC" ]; then
    bytes=$(node --input-type=module -e "
      import { readFileSync } from 'fs';
      import { compactNetlist } from '$WORKER_SRC';
      const json = JSON.stringify(compactNetlist(JSON.parse(readFileSync('$dir/board.json', 'utf8'))));
      process.stdout.write(String(json.length));" 2>/dev/null) && stored=$(kb "$bytes")
  fi
  printf '%-5s %10s %10s %10s %11s %12s %12s\n' "$i" "$(sec $(( (t1 - t0) / 1000000 )))" "$(sec "$synth_ms")" \
    "$(sec $(( cpu_us / 1000 )))" "$(mb "$mem_bytes")" "$(kb "$raw")" "$stored"
done

echo
echo "Zellen laut Yosys (letzter Lauf):"
sed -n '2,$p' "$dir/sim.log"

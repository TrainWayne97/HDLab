#!/bin/bash
# Setup-Skript für HDLab: Installiert Abhängigkeiten, baut Docker-Images und erstellt .env für den Worker
set -e

# Projektverzeichnis ermitteln
WORKDIR="$(cd "$(dirname "$0")" && pwd)"
SIMTMP_PATH="$WORKDIR/simtmp"

# 1. npm install für alle Apps
for app in apps/backend apps/frontend apps/worker; do
  echo "[Setup] npm install in $app ..."
  (cd "$WORKDIR/$app" && npm install)
done

# 2. Docker-Images bauen (inkl. sim-verilator)
echo "[Setup] Baue alle Docker-Images ..."
docker compose build

echo "[Setup] Baue sim-verilator Image ..."
docker build -t hdl-sim-verilator "$WORKDIR/docker/sim-verilator"

# 3. .env für Worker mit korrektem SIMTMP_HOST_PATH erstellen
echo "SIMTMP_HOST_PATH=$SIMTMP_PATH" > "$WORKDIR/.env"
echo "[Setup] .env für Worker geschrieben:"
cat "$WORKDIR/.env"

echo "[Setup] Fertig! Du kannst jetzt docker compose up ausführen."

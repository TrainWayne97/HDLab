#!/bin/bash
set -e

echo "Baue Docker-Images..."
docker compose build

echo "Starte alle Services im Hintergrund..."
docker compose up -d

echo "Zeige Logs (Strg+C zum Beenden)..."
docker compose logs -f

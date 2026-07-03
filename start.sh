#!/bin/bash
set -e

MODE=${1:-local}

if [ ! -f .env.runtime ]; then
  echo "Missing .env.runtime. Run ./setup.sh local|server first"
  exit 1
fi

echo "[Start] Mode: $MODE"
echo "[Start] Using .env.runtime"

if [ "$MODE" = "local" ]; then
  echo "[Start] Starting local stack..."

  docker compose \
    --env-file .env.runtime \
    -f docker-compose.yml \
    -f docker-compose.override.yml \
    up -d --build

elif [ "$MODE" = "server" ]; then
  echo "[Start] Starting server stack..."

  docker compose \
    --env-file .env.runtime \
    -f docker-compose.yml \
    up -d --build

else
  echo "Unknown mode: $MODE"
  exit 1
fi

docker compose logs -f
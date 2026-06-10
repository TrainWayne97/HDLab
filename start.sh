#!/bin/bash
set -e

if [ ! -f .env.runtime ]; then
  echo "Missing .env.runtime. Run ./setup.sh local|server first"
  exit 1
fi

echo "[Start] Using .env.runtime"

docker compose up -d --build
docker compose logs -f
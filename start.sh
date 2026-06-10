#!/bin/bash
set -e

ENV=$1

if [ "$ENV" = "local" ]; then
  cp .env.local .env.runtime
elif [ "$ENV" = "server" ]; then
  cp .env.server .env.runtime
else
  echo "Usage: ./start.sh local|server"
  exit 1
fi

docker compose up -d --build
docker compose logs -f
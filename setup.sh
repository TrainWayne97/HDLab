#!/bin/bash
set -e

MODE=${1:-local}

WORKDIR="$(cd "$(dirname "$0")" && pwd)"
SIMTMP_PATH="$WORKDIR/simtmp"

echo "[Setup] Mode: $MODE"

# npm install
for app in apps/backend apps/frontend apps/worker; do
  echo "[Setup] npm install in $app ..."
  (cd "$WORKDIR/$app" && npm install)
done

echo "[Setup] Building Docker images ..."
docker compose build

echo "[Setup] Building sim-verilator image ..."
docker build -t hdl-sim-verilator "$WORKDIR/docker/sim-verilator"

# -------------------------
# ENV GENERATION
# -------------------------
ENV_FILE="$WORKDIR/.env"

echo "[Setup] Generating .env for $MODE ..."

if [ "$MODE" = "server" ]; then
  cat > "$ENV_FILE" <<EOF
NODE_ENV=production
SIMTMP_HOST_PATH=$SIMTMP_PATH

FRONTEND_PORT=5173
BACKEND_PORT=3001

MONGO_URL=mongodb://mongo:27017/hdlab
RABBITMQ_URL=amqp://user:password@rabbitmq:5672

CORS_ORIGIN=*
VITE_API_URL=http://SERVER_IP:3001/api

LOG_LEVEL=info
EOF

elif [ "$MODE" = "local" ]; then
  cat > "$ENV_FILE" <<EOF
NODE_ENV=development
SIMTMP_HOST_PATH=$SIMTMP_PATH

FRONTEND_PORT=5173
BACKEND_PORT=3001

MONGO_URL=mongodb://mongo:27017/hdlab
RABBITMQ_URL=amqp://user:password@rabbitmq:5672

CORS_ORIGIN=http://localhost:5173
VITE_API_URL=http://localhost:3001/api

LOG_LEVEL=debug
EOF
else
  echo "Unknown mode: $MODE"
  exit 1
fi

echo "[Setup] .env created:"
cat "$ENV_FILE"

echo "[Setup] Done."
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
docker compose build --no-cache frontend
docker compose build backend worker

echo "[Setup] Building sim-verilator image ..."
docker build -t hdl-sim-verilator "$WORKDIR/docker/sim-verilator"

# -------------------------
# ENV GENERATION
# -------------------------
ENV_FILE="$WORKDIR/.env.runtime"

echo "[Setup] Generating .env for $MODE ..."

if [ "$MODE" = "server" ]; then
  cat > "$ENV_FILE" <<EOF
NODE_ENV=production
SIMTMP_HOST_PATH=$SIMTMP_PATH

FRONTEND_PORT=5173
BACKEND_PORT=3001
BACKEND_URL=http://backend:3001
MONGO_URL=mongodb://mongo:27017/hdlab
RABBITMQ_URL=amqp://user:password@rabbitmq:5672

CORS_ORIGIN=https://hdlab.eit.htwk-leipzig.de
APP_URL=https://hdlab.eit.htwk-leipzig.de
VITE_API_URL=/api
VITE_TUTORIAL_SOLUTION_PASSWORD=\$26SolHDLab

LOG_LEVEL=info
EOF

elif [ "$MODE" = "local" ]; then
  cat > "$ENV_FILE" <<EOF
NODE_ENV=development
SIMTMP_HOST_PATH=$SIMTMP_PATH

FRONTEND_PORT=5173
BACKEND_PORT=3001
BACKEND_URL=http://backend:3001
MONGO_URL=mongodb://mongo:27017/hdlab
RABBITMQ_URL=amqp://user:password@rabbitmq:5672

CORS_ORIGIN=http://localhost:5173
APP_URL=http://localhost:8080
VITE_API_URL=/api
VITE_TUTORIAL_SOLUTION_PASSWORD=\$26SolHDLab

LOG_LEVEL=debug
EOF
else
  echo "Unknown mode: $MODE"
  exit 1
fi

# Zugangsdaten (JWT_SECRET, GITLAB_CLIENT_ID, GITLAB_CLIENT_SECRET, ...) stehen
# in .env.secrets: die Datei liegt nicht im Git und wird hier nur angehängt,
# übersteht also jedes erneute Setup.
SECRETS_FILE="$WORKDIR/.env.secrets"
if [ -f "$SECRETS_FILE" ]; then
  echo "" >> "$ENV_FILE"
  cat "$SECRETS_FILE" >> "$ENV_FILE"
  echo "[Setup] Appended .env.secrets"
else
  echo "[Setup] No .env.secrets found - GitLab login stays disabled"
fi

echo "[Setup] .env created (values hidden):"
sed 's/=.*/=***/' "$ENV_FILE"

echo "[Setup] Done."
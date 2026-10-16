#!/bin/bash
set -e

MODE=${1:-local}

WORKDIR="$(cd "$(dirname "$0")" && pwd)"
SIMTMP_PATH="$WORKDIR/simtmp"

echo "[Setup] Mode: $MODE"

# -------------------------
# JWT_SECRET (vor dem Build prüfen)
# -------------------------
# Das Backend startet ohne gültiges JWT_SECRET (mind. 32 Zeichen) nicht. Auf dem
# Server wird es manuell in .env.secrets gepflegt; lokal wird eins erzeugt.
SECRETS_FILE="$WORKDIR/.env.secrets"
JWT_SECRET_VALUE=""
if [ -f "$SECRETS_FILE" ]; then
  JWT_SECRET_VALUE="$(grep -E '^JWT_SECRET=' "$SECRETS_FILE" | tail -n 1 | cut -d= -f2-)"
fi

if [ "${#JWT_SECRET_VALUE}" -lt 32 ]; then
  if [ "$MODE" = "local" ]; then
    echo "[Setup] No valid JWT_SECRET in .env.secrets - generating one for local development"
    sed -i '/^JWT_SECRET=/d' "$SECRETS_FILE" 2>/dev/null || true
    echo "JWT_SECRET=$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')" >> "$SECRETS_FILE"
  else
    echo "[Setup] ERROR: .env.secrets has no JWT_SECRET with at least 32 characters."
    echo "[Setup] Add one, e.g.: echo \"JWT_SECRET=\$(openssl rand -hex 32)\" >> .env.secrets"
    exit 1
  fi
fi

# npm install
for app in apps/backend apps/frontend apps/worker; do
  echo "[Setup] npm install in $app ..."
  (cd "$WORKDIR/$app" && npm install)
done

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

# Zugangsdaten (JWT_SECRET, GITLAB_CLIENT_ID, GITLAB_CLIENT_SECRET, SMTP_*, ...) stehen
# in .env.secrets: die Datei liegt nicht im Git und wird hier nur angehängt,
# übersteht also jedes erneute Setup.
if [ -f "$SECRETS_FILE" ]; then
  echo "" >> "$ENV_FILE"
  cat "$SECRETS_FILE" >> "$ENV_FILE"
  echo "[Setup] Appended .env.secrets"
else
  echo "[Setup] No .env.secrets found - GitLab login stays disabled"
fi

echo "[Setup] .env created (values hidden):"
sed 's/=.*/=***/' "$ENV_FILE"

# Erst nach .env.runtime: das Frontend bekommt VITE_API_URL und
# VITE_TUTORIAL_SOLUTION_PASSWORD beim Build daraus (Build-Args)
echo "[Setup] Building Docker images ..."
docker compose --env-file "$ENV_FILE" -f "$WORKDIR/docker-compose.yml" build --no-cache frontend
docker compose --env-file "$ENV_FILE" -f "$WORKDIR/docker-compose.yml" build backend worker

echo "[Setup] Building sim-verilator image ..."
docker build -t hdl-sim-verilator "$WORKDIR/docker/sim-verilator"

echo "[Setup] Done."
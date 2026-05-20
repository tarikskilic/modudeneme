#!/usr/bin/env bash
# Build + rsync + Traefik Docker container (VPS uses Traefik on :80/:443, not host nginx)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VPS_HOST="${VPS_HOST:-72.62.95.96}"
VPS_USER="${VPS_USER:-deploy}"
VPS_PATH="${VPS_PATH:-/var/www/modu-grid}"
REMOTE_COMPOSE="${REMOTE_COMPOSE:-/home/deploy/modu-grid-docker}"
SSH_TARGET="${VPS_USER}@${VPS_HOST}"
SSH_OPTS="${SSH_OPTS:--o StrictHostKeyChecking=accept-new}"

if [[ ! -f .env.production ]]; then
  if [[ -f .env.local ]]; then
    grep -E '^VITE_' .env.local > .env.production || true
  else
    echo "ERROR: .env.production gerekli"
    exit 1
  fi
fi

echo "==> Build..."
if [[ -f package-lock.json ]]; then npm ci; else npm install; fi
npm run build

echo "==> Upload dist..."
ssh $SSH_OPTS "$SSH_TARGET" "sudo mkdir -p '${VPS_PATH}' && sudo chown -R ${VPS_USER}:www-data '${VPS_PATH}'"
rsync -avz --delete dist/ "${SSH_TARGET}:${VPS_PATH}/"

echo "==> Upload Docker/Traefik config..."
ssh $SSH_OPTS "$SSH_TARGET" "mkdir -p '${REMOTE_COMPOSE}'"
scp $SSH_OPTS deploy/docker/nginx-spa.conf deploy/docker/docker-compose.yml \
  "${SSH_TARGET}:${REMOTE_COMPOSE}/"

echo "==> Recreate container (TLS labels)..."
ssh $SSH_OPTS "$SSH_TARGET" "cd '${REMOTE_COMPOSE}' && docker compose up -d --force-recreate"

echo "==> Restart Traefik (ACME yeniden dene)..."
ssh $SSH_OPTS "$SSH_TARGET" "docker restart n8n_traefik_1 2>/dev/null || docker ps --format '{{.Names}}' | grep -i traefik | head -1 | xargs -r docker restart"

echo "==> Done. DNS: modu-grid.com A → ${VPS_HOST}"
echo "    Site: https://modu-grid.com (Traefik Let's Encrypt, birkaç dk sürebilir)"

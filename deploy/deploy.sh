#!/usr/bin/env bash
# Build locally and upload dist/ to VPS.
#
# Usage:
#   export VPS_HOST=1.2.3.4
#   export VPS_USER=root
#   export VPS_PATH=/var/www/modu-grid
#   export DOMAIN=modu-grid.com          # optional, first-time nginx only
#   ./deploy/deploy.sh
#
# Requires: .env.production with VITE_SUPABASE_* (or copy from .env.local)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VPS_HOST="${VPS_HOST:-72.62.95.96}"
VPS_USER="${VPS_USER:-deploy}"
VPS_PATH="${VPS_PATH:-/var/www/modu-grid}"
DOMAIN="${DOMAIN:-}"
SSH_OPTS="${SSH_OPTS:--o StrictHostKeyChecking=accept-new}"

if [[ ! -f .env.production ]]; then
  if [[ -f .env.local ]]; then
    echo "==> No .env.production; copying VITE_* from .env.local"
    grep -E '^VITE_' .env.local > .env.production || true
  else
    echo "ERROR: Create .env.production with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
    exit 1
  fi
fi

echo "==> Building production bundle..."
if [[ -f package-lock.json ]]; then npm ci; else npm install; fi
npm run build

echo "==> Uploading to ${VPS_USER}@${VPS_HOST}:${VPS_PATH}"
ssh $SSH_OPTS "${VPS_USER}@${VPS_HOST}" "sudo mkdir -p '${VPS_PATH}' && sudo chown -R ${VPS_USER}:www-data '${VPS_PATH}'"
rsync -avz --delete \
  --exclude '.git' \
  dist/ "${VPS_USER}@${VPS_HOST}:${VPS_PATH}/"

if [[ "${SETUP_NGINX:-}" == "1" ]]; then
  echo "==> Installing nginx site config on VPS..."
  scp $SSH_OPTS deploy/nginx/modu-grid.conf "${VPS_USER}@${VPS_HOST}:/tmp/modu-grid.conf"
  ssh $SSH_OPTS "${VPS_USER}@${VPS_HOST}" \
    "DOMAIN='${DOMAIN}' APP_DIR='${VPS_PATH}' bash -s" < deploy/setup-vps.sh
fi

echo "==> Reload nginx on VPS"
ssh $SSH_OPTS "${VPS_USER}@${VPS_HOST}" "nginx -t && systemctl reload nginx" 2>/dev/null || true

echo "==> Deploy complete: http://${VPS_HOST}${DOMAIN:+ ($DOMAIN)}"

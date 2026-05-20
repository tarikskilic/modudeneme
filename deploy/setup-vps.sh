#!/usr/bin/env bash
# First-time VPS setup (Ubuntu/Debian). Run ON the server as root or with sudo.
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/modu-grid}"
NGINX_SITE="${NGINX_SITE:-modu-grid}"
DOMAIN="${DOMAIN:-}"

echo "==> Installing nginx..."
apt-get update -qq
apt-get install -y nginx certbot python3-certbot-nginx

echo "==> Creating app directory: $APP_DIR"
mkdir -p "$APP_DIR"
chown -R www-data:www-data "$APP_DIR"

if [[ -f "/tmp/modu-grid.conf" ]]; then
  sed "s|YOUR_DOMAIN|${DOMAIN:-_}|g" /tmp/modu-grid.conf > "/etc/nginx/sites-available/$NGINX_SITE"
  ln -sf "/etc/nginx/sites-available/$NGINX_SITE" "/etc/nginx/sites-enabled/$NGINX_SITE"
  rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
  nginx -t
  systemctl reload nginx
fi

if [[ -n "$DOMAIN" && "$DOMAIN" != "_" ]]; then
  echo "==> SSL with certbot for $DOMAIN"
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "admin@${DOMAIN}" || true
fi

echo "==> VPS ready. Deploy static files to $APP_DIR"

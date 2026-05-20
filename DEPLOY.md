# MODÜ-GRID — VPS deploy

Statik Vite build. Bu VPS'te **port 80/443 Traefik (Docker)** kullanıyor — host nginx değil.

## DNS (Hostinger — modu-grid.com)

| Tür | Ad | Değer |
|-----|-----|--------|
| **A** | `@` | **`72.62.95.96`** (VPS IP — şu an `2.57.91.91` ise güncelle) |
| CNAME | `www` | `modu-grid.com` (zaten var, kalabilir) |

DNS yayılımı 5–30 dk sürebilir.

## Deploy (Traefik — önerilen)

```bash
chmod +x deploy/deploy-traefik.sh
./deploy/deploy-traefik.sh
```

Traefik otomatik HTTPS (Let's Encrypt) verir.

## Gereksinimler

- VPS SSH: `yunus-vps` (`~/.ssh/config`)
- Supabase `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY`

## 1. İlk kurulum (VPS’te bir kez)

Sunucuya SSH ile bağlan:

```bash
ssh root@VPS_IP
```

Projeden nginx config’i kopyala ve kurulum script’ini çalıştır:

```bash
# Lokal makineden:
scp deploy/nginx/modu-grid.conf root@VPS_IP:/tmp/modu-grid.conf
ssh root@VPS_IP 'DOMAIN=panel.senindomain.com bash -s' < deploy/setup-vps.sh
```

`DOMAIN` yerine gerçek domain’ini yaz. DNS A kaydı VPS IP’ye işaret etmeli (SSL için).

## 2. Production env (lokal)

```bash
cp .env.production.example .env.production
# .env.production içine gerçek Supabase değerlerini yaz
```

## 3. Deploy (her güncellemede)

```bash
chmod +x deploy/deploy.sh

export VPS_HOST=1.2.3.4
export VPS_USER=root
export VPS_PATH=/var/www/modu-grid

# İlk deploy + nginx kurulumu birlikte:
export DOMAIN=panel.senindomain.com
export SETUP_NGINX=1

./deploy/deploy.sh
```

Sonraki deploy’larda sadece `VPS_HOST`, `VPS_USER`, `VPS_PATH` yeterli.

## Supabase

Supabase Dashboard → Authentication → URL Configuration:

- **Site URL**: `https://panel.senindomain.com`
- **Redirect URLs**: aynı origin + gerekli path’ler

## Kontrol

- `curl -I http://VPS_IP` → 200
- Tarayıcıda `/admin`, `/resident` vb. sayfalar (SPA fallback)

## Sorun giderme

| Sorun | Çözüm |
|--------|--------|
| 404 alt route’larda | nginx `try_files` — `deploy/nginx/modu-grid.conf` aktif mi? |
| Beyaz sayfa / Supabase yok | `.env.production` ile yeniden `npm run build` + deploy |
| SSL | `certbot --nginx -d domain.com` |

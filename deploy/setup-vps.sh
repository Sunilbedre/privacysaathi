#!/usr/bin/env bash
# Privacy Saathi: one-time setup on a fresh Ubuntu 22.04/24.04 VPS. Run as root or with sudo access.
set -euo pipefail

REPO="${REPO:-https://github.com/Sunilbedre/privacysaathi.git}"
APP=/var/www/privacysaathi
DATA=/var/www/ps-data
SETTINGS=/var/www/ps-settings
DOMAINS="privacysaathi.in privacysaathi.com privacysathi.in privacysathi.com"
SUDO=""; [ "$(id -u)" -ne 0 ] && SUDO="sudo"

echo "== Privacy Saathi setup =="
read -r -s -p "Choose an admin password (long, unique; you will not see it typed): " ADMIN_PW; echo
[ "${#ADMIN_PW}" -ge 12 ] || { echo "Password must be at least 12 characters."; exit 1; }
read -r -p "Email for SSL notices (for Let's Encrypt): " SSL_EMAIL

$SUDO apt-get update -y
$SUDO apt-get install -y git nginx certbot python3-certbot-nginx curl ca-certificates
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | $SUDO -E bash -
  $SUDO apt-get install -y nodejs
fi
$SUDO npm install -g pm2

# Swap, so the build does not run out of memory on small servers.
if [ "$(free -m | awk '/^Mem:/{print $2}')" -lt 3000 ] && [ ! -f /swapfile ]; then
  $SUDO fallocate -l 2G /swapfile && $SUDO chmod 600 /swapfile && $SUDO mkswap /swapfile && $SUDO swapon /swapfile
fi

$SUDO mkdir -p /var/www "$DATA" "$SETTINGS"
$SUDO chown -R "$(id -un)":"$(id -gn)" /var/www
if [ -d "$APP/.git" ]; then git -C "$APP" pull; else git clone "$REPO" "$APP"; fi
cd "$APP"

umask 077
cat > .env.local <<ENV
CMS_ADMIN_PASSWORD=$ADMIN_PW
NEXT_PUBLIC_SITE_URL=https://privacysaathi.in
PS_SECRET=$(head -c 48 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 40)
LEADS_DIR=$DATA
SETTINGS_DIR=$SETTINGS
ENV
umask 022

npm install
npm run build
PORT=3000 pm2 start npm --name privacysaathi -- start || pm2 restart privacysaathi
pm2 save
$SUDO env PATH="$PATH" pm2 startup systemd -u "$(id -un)" --hp "$HOME" >/dev/null || true

NAMES=""; for d in $DOMAINS; do NAMES="$NAMES $d www.$d"; done
$SUDO tee /etc/nginx/sites-available/privacysaathi >/dev/null <<NG
server {
  listen 80;
  server_name$NAMES;
  client_max_body_size 2m;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host \$host;
    proxy_set_header X-Forwarded-Host \$host;
    proxy_set_header X-Forwarded-For \$remote_addr;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }
}
NG
$SUDO ln -sf /etc/nginx/sites-available/privacysaathi /etc/nginx/sites-enabled/privacysaathi
$SUDO rm -f /etc/nginx/sites-enabled/default
$SUDO nginx -t && $SUDO systemctl reload nginx

echo
read -r -p "Have all four domains' DNS A records been pointed to this server? Get SSL now? (y/n) " YN
if [ "$YN" = "y" ]; then
  ARGS=""; for d in $DOMAINS; do ARGS="$ARGS -d $d -d www.$d"; done
  $SUDO certbot --nginx --non-interactive --agree-tos -m "$SSL_EMAIL" --redirect $ARGS
else
  echo "Skipped SSL. Later run:  sudo certbot --nginx -d privacysaathi.in -d www.privacysaathi.in ..."
fi
echo "Done. Open https://privacysaathi.in and https://privacysaathi.in/qwedsa"

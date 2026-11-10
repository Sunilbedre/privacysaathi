#!/usr/bin/env bash
set -euo pipefail

REPO="${REPO:-https://github.com/Sunilbedre/privacysaathi.git}"
APP=/var/www/privacysaathi
DATA=/var/www/ps-data
SETTINGS=/var/www/ps-settings
DOMAINS="privacysaathi.in privacysaathi.com privacysathi.in privacysathi.com"
SSL_EMAIL="${SSL_EMAIL:-hello@privacysaathi.in}"
LOG=/tmp/ps-deploy.log

exec > >(tee -a "$LOG") 2>&1
echo "== Privacy Saathi deploy started $(date -Is) =="

apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get install -y git nginx certbot python3-certbot-nginx curl ca-certificates

if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
npm install -g pm2

mkdir -p /var/www "$DATA" "$SETTINGS"

if [ -d "$APP/.git" ]; then
  git -C "$APP" fetch origin && git -C "$APP" reset --hard origin/main
else
  git clone "$REPO" "$APP"
fi
cd "$APP"

if [ ! -f .env.local ]; then
  CMS_PW="$(head -c 48 /dev/urandom | base64 | tr -dc 'A-Za-z0-9!@#%^&*' | head -c 24)"
  PS_SECRET="$(head -c 48 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 40)"
  PS_CRON="$(head -c 32 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 24)"
  SETTINGS_SECRET="$(head -c 48 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 32)"
  umask 077
  cat > .env.local <<ENV
CMS_ADMIN_PASSWORD=$CMS_PW
NEXT_PUBLIC_SITE_URL=https://privacysaathi.in
PS_PRIMARY_HOST=privacysaathi.in
PS_ALIAS_HOSTS=privacysathi.in,privacysaathi.com,privacysathi.com
PS_SECRET=$PS_SECRET
PS_CRON_SECRET=$PS_CRON
LEADS_DIR=$DATA
SETTINGS_DIR=$SETTINGS
SETTINGS_SECRET=$SETTINGS_SECRET
ENV
  umask 022
  chmod 600 .env.local
  echo "$CMS_PW" > /root/ps-cms-admin-password.txt
  chmod 600 /root/ps-cms-admin-password.txt
else
  echo "Keeping existing .env.local"
fi

npm ci
npm run build

if pm2 describe privacysaathi >/dev/null 2>&1; then
  pm2 delete privacysaathi || true
fi
PORT=3000 pm2 start npm --name privacysaathi -- start
pm2 save
env PATH="$PATH" pm2 startup systemd -u root --hp /root | tail -1 | bash || true

NAMES=""
for d in $DOMAINS; do NAMES="$NAMES $d www.$d"; done
tee /etc/nginx/sites-available/privacysaathi >/dev/null <<NG
server {
  listen 80;
  server_name$NAMES;
  client_max_body_size 2m;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host \$host;
    proxy_set_header X-Forwarded-Host \$host;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }
}
NG
ln -sf /etc/nginx/sites-available/privacysaathi /etc/nginx/sites-enabled/privacysaathi
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

ARGS=""
for d in $DOMAINS; do ARGS="$ARGS -d $d -d www.$d"; done
certbot --nginx --non-interactive --agree-tos -m "$SSL_EMAIL" --redirect $ARGS || echo "Certbot warning (check DNS / rate limits)"

echo "== Deploy finished $(date -Is) =="
pm2 status
curl -sS -o /dev/null -w "local_http:%{http_code}\n" http://127.0.0.1:3000/ || true

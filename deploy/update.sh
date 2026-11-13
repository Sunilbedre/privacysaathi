#!/usr/bin/env bash
# Run on the VPS after DNS/nginx/pm2 are already configured.
set -euo pipefail
APP=/var/www/privacysaathi
cd "$APP"
git fetch origin && git reset --hard origin/main
npm ci
npm run build
pm2 restart privacysaathi
echo "Updated to $(git rev-parse --short HEAD)"

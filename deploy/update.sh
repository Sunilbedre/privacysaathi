#!/usr/bin/env bash
# VPS: pull latest main, rebuild, restart PM2. Used by GitHub Actions and manual runs.
set -euo pipefail
APP=/var/www/privacysaathi
cd "$APP"
git fetch origin
git reset --hard origin/main
echo "Deploying commit $(git rev-parse --short HEAD) — $(git log -1 --pretty=%s)"
npm ci
npm run build
pm2 restart privacysaathi
pm2 save
echo "Live at $(date -Is)"

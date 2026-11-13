#!/usr/bin/env bash
# Poll GitHub for new main commits and redeploy if changed (fallback when Actions secrets are not set).
set -euo pipefail
APP=/var/www/privacysaathi
LOCK=/tmp/ps-auto-pull.lock
LOG=/var/log/ps-auto-pull.log

exec 9>"$LOCK"
flock -n 9 || exit 0

cd "$APP"
git fetch origin -q
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)
[ "$LOCAL" = "$REMOTE" ] && exit 0

{
  echo "=== $(date -Is) $LOCAL -> $REMOTE ==="
  git reset --hard origin/main
  npm ci
  npm run build
  pm2 restart privacysaathi
  pm2 save
  echo "Done $(git rev-parse --short HEAD)"
} >>"$LOG" 2>&1

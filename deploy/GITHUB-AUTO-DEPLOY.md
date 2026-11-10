# Auto-deploy on git push

Two mechanisms (use either or both):

1. **GitHub Actions (instant)** — every push to **`main`** runs [`.github/workflows/deploy-vps.yml`](../.github/workflows/deploy-vps.yml).
2. **VPS cron (fallback)** — [`deploy/auto-pull.sh`](auto-pull.sh) runs every 2 minutes on the server, checks `origin/main`, and redeploys if the commit changed. Already enabled on the live VPS; logs at `/var/log/ps-auto-pull.log`.

## One-time GitHub secrets

In the repo: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Value |
|--------|--------|
| `VPS_HOST` | Server IP or hostname (e.g. `174.138.183.173`) |
| `VPS_USER` | SSH user (e.g. `root`) |
| `VPS_SSH_KEY` | Private key (ed25519) whose **public** key is in `~/.ssh/authorized_keys` on the VPS |

Do not commit the private key. Rotate by generating a new key pair, updating the VPS and the secret.

## Manual deploy on the server

```bash
bash /var/www/privacysaathi/deploy/update.sh
```

## Re-run without a new commit

GitHub → **Actions** → **Deploy VPS** → **Run workflow**.

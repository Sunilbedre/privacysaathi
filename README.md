# Privacy Saathi

Passive DPDP Act and cyber security readiness scanner for Indian businesses. A sub-brand of Bedre Web Technologies Pvt. Ltd.

- Next.js 16 (App Router). Public pages live in `app/ps`, APIs in `app/api/ps`, scanner in `lib/scan`.
- Admin at `/qwedsa` (login, enquiry CRM, settings for email, WhatsApp and SMS). `/admin` returns 404 on purpose.
- Host routing in `proxy.ts`: privacysaathi.in is the main domain; the other three redirect to it.

## Run locally
```bash
npm install
cp .env.example .env.local   # then fill in values
npm run dev
```

## Deploy
Set the environment variables from `.env.example` on your host. At minimum: `CMS_ADMIN_PASSWORD`, `NEXT_PUBLIC_SITE_URL`, `LEADS_DIR` (a folder that survives restarts). The real-browser consent test needs Chromium and `PS_BROWSER_PROBE=1`; leave it off if the host cannot run Chromium.

Never commit `.env*` files or the `.data` folder.

import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

/**
 * Keys and switches the owner can set from /qwedsa/settings instead of environment files.
 * Values are stored ENCRYPTED (AES-256-GCM) in `settings.enc` inside SETTINGS_DIR (default ./.data). The encryption key is derived from
 * SETTINGS_SECRET, or from CMS_ADMIN_PASSWORD when SETTINGS_SECRET is not set. A value saved here wins over the environment variable of the
 * same name; clearing it falls back to the environment. Secret values are never sent back to the browser.
 */
export interface SettingDef { key: string; label: string; help: string; group: 'Leads' | 'Email (SMTP)' | 'WhatsApp alerts' | 'SMS alerts'; secret: boolean; placeholder?: string }

export const SETTING_DEFS: SettingDef[] = [
  { key: 'RESEND_API_KEY', label: 'Resend API key', help: 'Sends lead alerts and visitor confirmations by email. Create it at resend.com.', group: 'Leads', secret: true, placeholder: 're_…' },
  { key: 'LEAD_FROM_EMAIL', label: 'Send emails from', help: 'A verified sender in Resend, for example leads@bedreweb.com.', group: 'Leads', secret: false },
  { key: 'LEAD_TO_EMAIL', label: 'Send lead alerts to', help: 'The inbox that should receive every new lead. Several addresses can be separated by commas.', group: 'Leads', secret: false },
  { key: 'PS_NOTIFY_WEBHOOK', label: 'Chat alert webhook (optional)', help: 'A Slack-compatible incoming webhook URL (https). Every new Privacy Saathi lead is posted there as a short message.', group: 'Leads', secret: true, placeholder: 'https://hooks.slack.com/services/…' },
  { key: 'CRM_BASE_URL', label: 'Admin website address', help: 'Where your admin lives, used in alert links to open a lead, for example https://bedreweb.com', group: 'Leads', secret: false, placeholder: 'https://bedreweb.com' },
  { key: 'SMTP_HOST', label: 'SMTP server', help: 'Your Mail Baby SMTP host, from your Mail Baby account.', group: 'Email (SMTP)', secret: false, placeholder: 'relay.mailbaby.net' },
  { key: 'SMTP_PORT', label: 'SMTP port', help: '587 (STARTTLS) or 465 (SSL). Default 587.', group: 'Email (SMTP)', secret: false, placeholder: '587' },
  { key: 'SMTP_USER', label: 'SMTP username', help: 'The SMTP login from Mail Baby.', group: 'Email (SMTP)', secret: false },
  { key: 'SMTP_PASS', label: 'SMTP password', help: 'The SMTP password from Mail Baby. Saved encrypted.', group: 'Email (SMTP)', secret: true },
  { key: 'SMTP_FROM', label: 'Send emails from', help: 'Sender shown to visitors, for example Privacy Saathi <hello@privacysaathi.in>. The domain must be allowed in Mail Baby.', group: 'Email (SMTP)', secret: false },
  { key: 'WA_PHONE_NUMBER_ID', label: 'WhatsApp phone number ID', help: 'Meta for Developers → WhatsApp → API Setup → Phone number ID.', group: 'WhatsApp alerts', secret: false },
  { key: 'WA_WABA_ID', label: 'WhatsApp Business Account ID', help: 'Meta for Developers → WhatsApp → API Setup → WhatsApp Business Account ID.', group: 'WhatsApp alerts', secret: false },
  { key: 'WA_TOKEN', label: 'WhatsApp access token', help: 'A permanent system-user token with whatsapp_business_messaging permission. Saved encrypted.', group: 'WhatsApp alerts', secret: true },
  { key: 'WA_OWNER_NUMBERS', label: 'Send alerts to these WhatsApp numbers', help: 'Your number(s) with country code, no plus sign, separated by commas. Example: 919876543210', group: 'WhatsApp alerts', secret: false },
  { key: 'WA_TEMPLATE_SCAN', label: 'Template name: scan enquiry', help: 'Name of the approved template for “someone scanned a site”. See the template text below.', group: 'WhatsApp alerts', secret: false, placeholder: 'ps_scan_enquiry' },
  { key: 'WA_TEMPLATE_SOLUTION', label: 'Template name: solution enquiry', help: 'Name of the approved template for “someone wants a solution”.', group: 'WhatsApp alerts', secret: false, placeholder: 'ps_solution_enquiry' },
  { key: 'WA_TEMPLATE_LANG', label: 'Template language code', help: 'Default en.', group: 'WhatsApp alerts', secret: false, placeholder: 'en' },
  { key: 'WA_CLIENT_SEND', label: 'Also message the visitor on WhatsApp', help: 'Type on to send each visitor a confirmation on WhatsApp. Leave empty to keep it off. Turn it on only after the two visitor templates (Message templates tab) are approved.', group: 'WhatsApp alerts', secret: false, placeholder: 'on' },
  { key: 'WA_TEMPLATE_CLIENT_SCAN', label: 'Template name: visitor, after a scan', help: 'Approved template sent to the visitor after they see their result.', group: 'WhatsApp alerts', secret: false, placeholder: 'ps_client_scan' },
  { key: 'WA_TEMPLATE_CLIENT_SOLUTION', label: 'Template name: visitor, after asking for help', help: 'Approved template sent to the visitor after they request help.', group: 'WhatsApp alerts', secret: false, placeholder: 'ps_client_solution' },
  { key: 'SMS_API_KEY', label: 'SMSAlert API key', help: 'SMSAlert dashboard → API key. Saved encrypted.', group: 'SMS alerts', secret: true },
  { key: 'SMS_SENDER_ID', label: 'SMSAlert sender ID', help: 'Your approved 6-letter DLT sender ID, for example BEDRWB.', group: 'SMS alerts', secret: false },
  { key: 'SMS_CLIENT_SEND', label: 'Also text the visitor', help: 'Type on to send each visitor a confirmation SMS. Leave empty to keep it off. Turn it on only after the two visitor DLT templates (Message templates tab) are approved.', group: 'SMS alerts', secret: false, placeholder: 'on' },
  { key: 'SMS_OWNER_NUMBERS', label: 'Send SMS alerts to', help: 'Your mobile number(s) with country code, no plus sign, separated by commas. Example: 919876543210', group: 'SMS alerts', secret: false },
];
const KEYS = new Set(SETTING_DEFS.map((d) => d.key));

const dir = () => process.env.SETTINGS_DIR || path.join(process.cwd(), '.data');
const file = () => path.join(dir(), 'settings.enc');
const material = () => process.env.SETTINGS_SECRET || process.env.CMS_ADMIN_PASSWORD || '';
export const settingsEnabled = () => !!material();
const aesKey = () => scryptSync(material(), 'bedre-settings-v1', 32);

let cache: { mtime: number; values: Record<string, string>; unreadable: boolean } | null = null;

function load(): { values: Record<string, string>; unreadable: boolean } {
  if (!settingsEnabled()) return { values: {}, unreadable: false };
  let st: fs.Stats;
  try { st = fs.statSync(file()); } catch { return { values: {}, unreadable: false }; }
  if (cache && cache.mtime === st.mtimeMs) return cache;
  try {
    const j = JSON.parse(fs.readFileSync(file(), 'utf8')) as { iv: string; tag: string; data: string };
    const d = createDecipheriv('aes-256-gcm', aesKey(), Buffer.from(j.iv, 'base64'));
    d.setAuthTag(Buffer.from(j.tag, 'base64'));
    const text = Buffer.concat([d.update(Buffer.from(j.data, 'base64')), d.final()]).toString('utf8');
    cache = { mtime: st.mtimeMs, values: JSON.parse(text) as Record<string, string>, unreadable: false };
  } catch {
    // wrong secret, or the file was damaged: treat as empty, and tell the admin page
    cache = { mtime: st.mtimeMs, values: {}, unreadable: true };
  }
  return cache;
}

/** The value saved in the admin if there is one, otherwise the environment variable of the same name. */
export function getSetting(key: string): string | undefined {
  if (KEYS.has(key)) { const v = load().values[key]; if (v) return v; }
  const e = process.env[key];
  return e && e.trim() ? e : undefined;
}

export interface SettingStatus extends SettingDef { source: 'admin' | 'env' | 'none'; hint: string; value?: string }

/** What the admin page shows. Secret values are reduced to the last four characters. */
export function settingsStatus(): { items: SettingStatus[]; unreadable: boolean } {
  const { values, unreadable } = load();
  const items = SETTING_DEFS.map((d) => {
    const saved = values[d.key];
    const env = process.env[d.key]?.trim();
    const v = saved || env || '';
    const source: SettingStatus['source'] = saved ? 'admin' : env ? 'env' : 'none';
    return { ...d, source, hint: d.secret && v ? `ends in ${v.slice(-4)}` : '', value: d.secret ? undefined : v };
  });
  return { items, unreadable };
}

/** patch: a string saves it, null removes it. Only known keys are accepted. */
export function updateSettings(patch: Record<string, string | null>): void {
  if (!settingsEnabled()) throw new Error('Set CMS_ADMIN_PASSWORD or SETTINGS_SECRET first.');
  const current = { ...load().values };
  for (const [k, v] of Object.entries(patch)) {
    if (!KEYS.has(k)) continue;
    if (v === null) delete current[k];
    else { const t = v.trim(); if (t && t.length <= 600 && !/[\r\n]/.test(t)) current[k] = t; }
  }
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', aesKey(), iv);
  const data = Buffer.concat([c.update(JSON.stringify(current), 'utf8'), c.final()]);
  fs.mkdirSync(dir(), { recursive: true });
  const tmp = file() + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify({ v: 1, iv: iv.toString('base64'), tag: c.getAuthTag().toString('base64'), data: data.toString('base64') }), { mode: 0o600 });
  fs.renameSync(tmp, file());
  cache = null;
}

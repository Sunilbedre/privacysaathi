import 'server-only';
import { getSetting } from '@/lib/settings';
import { appendLine } from './store';

export type ChannelResult = 'sent' | 'failed' | 'skipped' | 'outbox';
const nums = (k: string) => (getSetting(k) ?? '').split(/[,;]/).map((s) => s.replace(/\D/g, '')).filter((s) => s.length >= 10 && s.length <= 15);
const devOutbox = () => process.env.NODE_ENV !== 'production' || process.env.PS_MAIL_OUTBOX === '1';

/** A visitor's phone as digits with country code. A 10-digit Indian mobile gets 91 in front. */
export const intlPhone = (p: string) => { const d = String(p ?? '').replace(/\D/g, ''); return d.length === 10 ? '91' + d : d.length === 11 && d.startsWith('0') ? '91' + d.slice(1) : d; };
/** Switch values saved in Settings: on / yes / 1 / true. */
export const isOn = (k: string) => /^(on|yes|1|true)$/i.test((getSetting(k) ?? '').trim());

/** WhatsApp template parameters must be single-line and short. */
export const waText = (s: unknown, max = 120) => String(s ?? '').replace(/[\r\n\t]+/g, ' ').replace(/ {2,}/g, ' ').trim().slice(0, max) || '-';

/** WhatsApp Cloud API template message to the owner number(s). */
export async function sendWhatsApp(template: string | undefined, params: string[], recipients?: string[]): Promise<ChannelResult> {
  const id = getSetting('WA_PHONE_NUMBER_ID'), token = getSetting('WA_TOKEN'), to = recipients ? recipients.map(intlPhone).filter((x) => x.length >= 10 && x.length <= 15) : nums('WA_OWNER_NUMBERS');
  if (!id || !token || !template || !to.length) return 'skipped';
  const lang = getSetting('WA_TEMPLATE_LANG') || 'en';
  const results = await Promise.all(to.map(async (n) => {
    const res = await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(id)}/messages`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(8000),
      body: JSON.stringify({ messaging_product: 'whatsapp', to: n, type: 'template', template: { name: template, language: { code: lang }, components: [{ type: 'body', parameters: params.map((t) => ({ type: 'text', text: waText(t) })) }] } }),
    }).catch(() => null);
    if (!res?.ok) console.error('ps whatsapp failed', res?.status);
    return !!res?.ok;
  }));
  return results.some(Boolean) ? 'sent' : 'failed';
}

/** WhatsApp authentication template (code in the body and in the "Copy code" button), sent to the visitor's own number. */
export async function sendWhatsAppOtp(template: string | undefined, to: string, code: string): Promise<ChannelResult> {
  const id = getSetting('WA_PHONE_NUMBER_ID'), token = getSetting('WA_TOKEN');
  const num = intlPhone(to);
  if (!id || !token || !template || num.length < 10 || num.length > 15) return 'skipped';
  const res = await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(id)}/messages`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(8000),
    body: JSON.stringify({ messaging_product: 'whatsapp', to: num, type: 'template', template: { name: template, language: { code: getSetting('WA_TEMPLATE_LANG') || 'en' }, components: [
      { type: 'body', parameters: [{ type: 'text', text: code }] },
      { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: code }] },
    ] } }),
  }).catch(() => null);
  if (!res?.ok) console.error('ps whatsapp otp failed', res?.status, res ? await res.text().catch(() => '') : '');
  return res?.ok ? 'sent' : 'failed';
}

/**
 * SMS through SMSAlert (smsalert.co.in). Indian DLT rules: the text sent must match your approved template, so each message is built
 * from a fixed template where the {#var#} slots are filled in. SMSAlert answers HTTP 200 even for errors, so we read its JSON status.
 */
export async function sendSms(text: string, recipients?: string[]): Promise<ChannelResult> {
  const key = getSetting('SMS_API_KEY'), sender = getSetting('SMS_SENDER_ID'), to = recipients ? recipients.map(intlPhone).filter((x) => x.length >= 10 && x.length <= 15) : nums('SMS_OWNER_NUMBERS');
  if (!key || !sender || !to.length) return 'skipped';
  const res = await fetch('https://www.smsalert.co.in/api/push.json', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', accept: 'application/json' }, signal: AbortSignal.timeout(8000),
    body: new URLSearchParams({ apikey: key, sender, mobileno: to.join(','), text }).toString(),
  }).catch(() => null);
  const j = res?.ok ? await res.json().catch(() => null) as { status?: string } | null : null;
  const ok = !!j && String(j.status).toLowerCase() === 'success';
  if (!ok) console.error('ps sms failed', res?.status, j?.status);
  return ok ? 'sent' : 'failed';
}

/** Fills a DLT template: each {#var#} is replaced in order, single line, short. */
export const fillSms = (tpl: string, vals: string[]) => { let i = 0; return tpl.replace(/\{#var#\}/g, () => waText(vals[i++], 30)); };

/** SMTP (Mail Baby or any provider). Returns null when SMTP is not configured so the caller can fall back. */
export async function sendSmtp(o: { to: string[]; subject: string; html: string; text: string; replyTo?: string; headers?: Record<string, string> }): Promise<ChannelResult | null> {
  const host = getSetting('SMTP_HOST'), user = getSetting('SMTP_USER'), pass = getSetting('SMTP_PASS'), from = getSetting('SMTP_FROM');
  if (!host || !user || !pass || !from) return null;
  const port = Number(getSetting('SMTP_PORT')) || 587;
  try {
    const nodemailer = await import('nodemailer');
    const t = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass }, connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 12000 });
    await t.sendMail({ from, to: o.to, subject: o.subject, html: o.html, text: o.text, replyTo: o.replyTo, headers: o.headers });
    return 'sent';
  } catch (e) { console.error('ps smtp failed', (e as Error).message); return 'failed'; }
}

export async function devNote(kind: string, payload: unknown) { if (devOutbox()) await appendLine('outbox', { ts: new Date().toISOString(), kind, payload }); }

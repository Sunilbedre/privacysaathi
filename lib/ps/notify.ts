import 'server-only';
import { getSetting } from '@/lib/settings';
import { appendLine } from './store';
import type { Mail } from './mail';
import { sendSmtp } from './channels';

export type SendResult = 'sent' | 'outbox' | 'skipped' | 'failed';
const EMAIL = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]{2,}$/;

/** Owner inboxes: LEAD_TO_EMAIL may hold several addresses separated by commas or semicolons. */
export const ownerRecipients = (): string[] => (getSetting('LEAD_TO_EMAIL') ?? '').split(/[,;]/).map((s) => s.trim()).filter((s) => EMAIL.test(s));

export interface SendOpts { to: string | string[]; mail: Mail; replyTo?: string; headers?: Record<string, string>; kind: 'visitor' | 'owner' | 'followup' }

/**
 * Sends through SMTP (Mail Baby) when SMTP_* are set, else through Resend when RESEND_API_KEY and LEAD_FROM_EMAIL are set (from /qwedsa/settings or the environment).
 * Without them, in development (or when PS_MAIL_OUTBOX=1) the message is written to .data/ps/outbox.jsonl so it can be read instead of sent.
 * In production without settings it is skipped, never silently pretended to be sent.
 */
export async function sendMail({ to, mail, replyTo, headers, kind }: SendOpts): Promise<SendResult> {
  const recipients = (Array.isArray(to) ? to : [to]).filter((e) => EMAIL.test(e));
  if (!recipients.length) return 'skipped';
  const smtp = await sendSmtp({ to: recipients, subject: mail.subject, html: mail.html, text: mail.text, replyTo, headers });
  if (smtp) return smtp === 'sent' ? 'sent' : 'failed';
  const key = getSetting('RESEND_API_KEY'), from = getSetting('LEAD_FROM_EMAIL');
  if (key && from) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(8000),
      body: JSON.stringify({ from, to: recipients, reply_to: replyTo, subject: mail.subject, html: mail.html, text: mail.text, headers }),
    }).catch(() => null);
    if (!res?.ok) console.error(`ps mail (${kind}) failed`, res?.status);
    return res?.ok ? 'sent' : 'failed';
  }
  if (process.env.PS_MAIL_OUTBOX === '1' || process.env.NODE_ENV !== 'production') {
    await appendLine('outbox', { ts: new Date().toISOString(), kind, to: recipients, replyTo, subject: mail.subject, text: mail.text, html: mail.html, headers });
    return 'outbox';
  }
  return 'skipped';
}

/** Posts a short message to a Slack-compatible incoming webhook (PS_NOTIFY_WEBHOOK). Must be https. */
export async function postWebhook(text: string): Promise<boolean> {
  const url = getSetting('PS_NOTIFY_WEBHOOK');
  if (!url || !/^https:\/\//i.test(url)) return false;
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }), signal: AbortSignal.timeout(5000) }).catch(() => null);
  if (!res?.ok) console.error('ps webhook failed', res?.status);
  return !!res?.ok;
}

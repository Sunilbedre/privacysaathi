import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { LeadInput } from './validation';
import { getSetting } from './settings';

export interface LeadRecord extends Omit<LeadInput, 'website' | 'consent' | 'meeting' | 'timing'> {
  receivedAt: string;
  consentText: string;
  ip?: string;
}

export const CONSENT_TEXT = 'I agree that Bedre may contact me about this enquiry. Consent is stored with the lead record.';

/** Returns true when at least one durable sink accepted the lead. */
export async function saveLead(lead: LeadRecord, opts: { skipEmail?: boolean } = {}): Promise<boolean> {
  let stored = false;

  const key = getSetting('RESEND_API_KEY');
  const to = getSetting('LEAD_TO_EMAIL');
  const from = getSetting('LEAD_FROM_EMAIL');
  if (key && to && from && !opts.skipEmail) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from, to: [to], reply_to: lead.email,
        subject: `New enquiry: ${lead.interest || 'General'} from ${lead.name}`,
        text: [
          `Name: ${lead.name}`, `Email: ${lead.email}`, `Organisation: ${lead.organisation}`, `Interested in: ${lead.interest}`,
          '', lead.message, '', `Consent: ${lead.consentText}`, `Received: ${lead.receivedAt}`,
        ].join('\n'),
      }),
    }).catch(() => null);
    if (res?.ok) stored = true;
    else console.error('lead email failed', res?.status);
  }

  // File sink: always in development, and in production when LEADS_DIR points at a writable folder outside the web root.
  const dir = process.env.LEADS_DIR || (process.env.NODE_ENV !== 'production' ? path.join(process.cwd(), '.data') : '');
  if (dir) {
    try {
      await fs.mkdir(dir, { recursive: true });
      await fs.appendFile(path.join(dir, 'leads.jsonl'), JSON.stringify(lead) + '\n');
      stored = true;
    } catch (e) { console.error('lead file sink failed', e); }
  }
  // TODO(phase 2): insert into Postgres via Prisma once the database is chosen.
  return stored;
}

/** Sends a plain-text email to the visitor. Returns false when email is not configured or fails. */
export async function sendToVisitor(to: string, subject: string, text: string): Promise<boolean> {
  const key = getSetting('RESEND_API_KEY');
  const from = getSetting('LEAD_FROM_EMAIL');
  if (!key || !from) return false;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], reply_to: getSetting('LEAD_TO_EMAIL') || undefined, subject, text }),
  }).catch(() => null);
  return !!res?.ok;
}

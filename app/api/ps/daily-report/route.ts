import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { inWindow, summarise, toCsv, toText, type EventRow, type LeadRow } from '@/lib/ps/daily';
import { readLines } from '@/lib/ps/store';

export const dynamic = 'force-dynamic';
const ok = (given: string, secret: string) => { const a = Buffer.from(given), b = Buffer.from(secret); return a.length === b.length && timingSafeEqual(a, b); };

/**
 * Called by a scheduler (host cron or external): curl -H "Authorization: Bearer $PS_CRON_SECRET" https://privacysaathi.in/api/ps/daily-report
 * Add ?dry=1 to see the report without emailing it. ?hours=24 sets the window.
 */
async function run(req: Request) {
  const secret = process.env.PS_CRON_SECRET;
  if (!secret || secret.length < 16) return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  const given = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!ok(given, secret)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const u = new URL(req.url);
  const hours = Math.min(24 * 31, Math.max(1, Number(u.searchParams.get('hours')) || 24));
  const to = Date.now(), from = to - hours * 3600_000;
  const leads = inWindow(await readLines<LeadRow>('leads'), (l) => l.receivedAt, from, to);
  const events = inWindow(await readLines<EventRow>('events'), (e) => e.ts, from, to);
  const s = summarise(leads, events);
  const label = `${new Date(from).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })} to ${new Date(to).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })} IST`;
  const text = toText(s, label), csv = toCsv(leads);
  if (u.searchParams.get('dry')) return NextResponse.json({ summary: s, text, csvRows: leads.length });

  const key = process.env.RESEND_API_KEY, tos = process.env.LEAD_TO_EMAIL, from_ = process.env.LEAD_FROM_EMAIL;
  if (!key || !tos || !from_) return NextResponse.json({ error: 'Email is not configured (RESEND_API_KEY, LEAD_TO_EMAIL, LEAD_FROM_EMAIL)', summary: s }, { status: 503 });
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: from_, to: [tos], subject: `Privacy Saathi: ${s.total} new lead${s.total === 1 ? '' : 's'} (${new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })})`, text, attachments: [{ filename: `privacy-saathi-leads-${new Date().toISOString().slice(0, 10)}.csv`, content: Buffer.from(csv).toString('base64') }] }),
  }).catch(() => null);
  if (!res?.ok) return NextResponse.json({ error: 'Email failed to send' }, { status: 502 });
  return NextResponse.json({ sent: true, leads: s.total });
}
export const GET = run;
export const POST = run;

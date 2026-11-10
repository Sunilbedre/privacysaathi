import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { buildReport } from '@/lib/scan/score';
import { summariseDpdp } from '@/lib/ps/dpdp-map';
import { emailHash, renderFollowup, unsubToken, type MailCtx } from '@/lib/ps/mail';
import { sendMail } from '@/lib/ps/notify';
import { PS_SITE } from '@/lib/ps/config';
import { appendLine, getScan, readLines, retentionDays } from '@/lib/ps/store';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const ok = (given: string, secret: string) => { const a = Buffer.from(given), b = Buffer.from(secret); return a.length === b.length && timingSafeEqual(a, b); };

interface LeadRow { receivedAt: string; email: string; name: string; company?: string; domain?: string; scanId: string; no_official_email?: boolean }
const HOUR = 3600_000;

/**
 * Run hourly from a scheduler: curl -H "Authorization: Bearer $PS_CRON_SECRET" https://privacysaathi.in/api/ps/followups
 * Each lead gets at most two reminders: step 1 after 24 hours, step 2 after 72 hours. One email per lead per run, nothing after 14 days,
 * nothing to free or personal addresses, nothing to anyone who unsubscribed. Add ?dry=1 to see who would be emailed without sending.
 */
async function run(req: Request) {
  const secret = process.env.PS_CRON_SECRET;
  if (!secret || secret.length < 16) return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  if (!ok((req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, ''), secret)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const dry = !!new URL(req.url).searchParams.get('dry');

  const [leads, sent, supp] = await Promise.all([readLines<LeadRow>('leads'), readLines<{ k: string }>('followups'), readLines<{ h: string }>('suppress')]);
  const done = new Set(sent.map((r) => r.k)), blocked = new Set(supp.map((r) => r.h));
  const latest = new Map<string, LeadRow>();                         // newest lead per email wins
  for (const l of leads) if (l.email) latest.set(l.email.trim().toLowerCase(), l);

  const plan: { l: LeadRow; step: 1 | 2; h: string }[] = [];
  for (const [email, l] of latest) {
    if (l.no_official_email) continue;
    const h = emailHash(email); if (blocked.has(h)) continue;
    const age = (Date.now() - Date.parse(l.receivedAt)) / HOUR;
    if (!(age >= 24 && age <= 14 * 24)) continue;
    const step: 1 | 2 | null = age >= 72 ? (done.has(`${h}:2`) ? null : 2) : (done.has(`${h}:1`) ? null : 1);
    if (step) plan.push({ l, step, h });
  }
  if (dry) return NextResponse.json({ considered: latest.size, due: plan.map((p) => ({ step: p.step, email: p.l.email.replace(/^(.).*(@.*)$/, '$1***$2') })) });

  const booking = process.env.NEXT_PUBLIC_BOOKING_URL || 'https://bedreweb.com/contact';
  let sentN = 0, failed = 0;
  for (const { l, step, h } of plan.slice(0, 50)) {
    const rec = l.scanId ? await getScan(l.scanId) : null;       // the report may have expired: then we send a general reminder
    const rep = rec ? buildReport(rec.result ?? null, rec.answers ?? {}) : null;
    const dp = rep ? summariseDpdp(rep.checks, { score: rep.headline, band: rep.band, mode: rec?.result?.mode ?? 'questions', pages: 0 }) : null;
    const ctx: MailCtx = {
      first: (l.name || 'there').trim().split(/\s+/)[0], who: l.domain || l.company || 'your business', score: rep?.headline ?? 0, band: rep?.band ?? '',
      exposureCr: dp?.exposure.maxCr ?? 0, exposureLevel: dp?.exposure.level ?? 'none', exposureDuty: dp?.exposure.dutyLabel ?? '', gaps: dp?.exposure.gaps ?? 0,
      top: rep ? rep.priorities.slice(0, 3).map((c) => ({ title: c.title, fix: c.fix })) : [], reportUrl: rec ? `${PS_SITE}/report/${l.scanId}` : `${PS_SITE}/dpdp`, bookingUrl: booking,
      unsubUrl: `${PS_SITE}/api/ps/unsubscribe?e=${encodeURIComponent(l.email)}&t=${unsubToken(l.email)}`, retentionDays: retentionDays(),
    };
    const r = await sendMail({ to: l.email, mail: renderFollowup(step, ctx), headers: { 'List-Unsubscribe': `<${ctx.unsubUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }, kind: 'followup' });
    if (r === 'sent' || r === 'outbox') { await appendLine('followups', { k: `${h}:${step}`, scanId: l.scanId, step, ts: new Date().toISOString(), via: r }); sentN++; } else if (r === 'failed') failed++;
  }
  return NextResponse.json({ considered: latest.size, due: plan.length, sent: sentN, failed });
}
export const GET = run;
export const POST = run;

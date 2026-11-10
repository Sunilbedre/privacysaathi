import { NextResponse } from 'next/server';
import { z } from 'zod';
import { phoneProblem } from '@/lib/lead-rules';
import { ipLimited } from '@/lib/ps/guard';
import { getScan } from '@/lib/ps/store';
import { buildReport } from '@/lib/scan/score';
import { DUTIES, dutyOf, summariseDpdp } from '@/lib/ps/dpdp-map';
import { priorityOf } from '@/lib/ps/mail';
import { createEnquiry } from '@/lib/ps/crm';
import { alertEnquiry, solutionVisitorMail } from '@/lib/ps/enquiry';
import { sourceLabel } from '@/lib/ps/origin';

/** Enquiry type 2: the visitor clicked a solution and asked Bedre to help. Only possible after the scan lead exists. */
const schema = z.object({
  scanId: z.string().max(64), duty: z.string().max(20).default('all'), name: z.string().trim().min(2).max(120), phone: z.string().trim().max(30), email: z.string().trim().toLowerCase().max(200),
  message: z.string().trim().max(600).optional().default(''), preferredTime: z.string().trim().max(60).optional().default(''), consent: z.literal(true), hp: z.string().max(0).optional(),
});

export async function POST(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  if (ipLimited(`enq:${ip}`, 10)) return NextResponse.json({ error: 'Too many requests. Please try again in a while.' }, { status: 429 });
  const p = schema.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ error: 'Please check the form and tick the consent box.' }, { status: 400 });
  const d = p.data;
  if (d.hp) return NextResponse.json({ ok: true });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) return NextResponse.json({ error: 'Please enter a valid email', field: 'email' }, { status: 400 });
  const pp = phoneProblem(d.phone); if (pp) return NextResponse.json({ error: pp, field: 'phone' }, { status: 400 });
  const rec = await getScan(d.scanId);
  if (!rec) return NextResponse.json({ error: 'Your result has expired. Please run the check again.' }, { status: 410 });
  if (!rec.leadCaptured) return NextResponse.json({ error: 'Please view your result first.' }, { status: 403 });

  const rep = buildReport(rec.result ?? null, rec.answers ?? {});
  const dp = summariseDpdp(rep.checks, { score: rep.headline, band: rep.band, mode: rec.result?.mode ?? 'questions', pages: rec.result?.pagesScanned ?? 0 });
  const duty = DUTIES.find((x) => x.id === d.duty);
  const gaps = rep.checks.filter((c) => (c.status === 'fail' || c.status === 'warn') && (!duty || dutyOf(c) === duty.id)).map((c) => c.title);
  const topic = duty ? `${duty.label} (${duty.ref})` : 'All gaps found';
  const enq = await createEnquiry({
    type: 'solution', name: d.name, phone: d.phone, email: d.email, company: rec.company ?? '', website: rec.domain, scanId: rec.id, score: rep.headline, band: rep.band,
    priority: priorityOf(rep.headline, dp.exposure), exposureCr: duty ? duty.fineCr : dp.exposure.maxCr, gaps: dp.exposure.gaps, topic,
    message: [d.message, gaps.length ? `Gaps: ${gaps.slice(0, 6).join('; ')}` : ''].filter(Boolean).join(' | ').slice(0, 900), preferredTime: d.preferredTime, source: sourceLabel(rec.origin, 'solution_click'), utm: '', origin: rec.origin,
  });
  const alerts = await alertEnquiry(enq, { visitorMail: solutionVisitorMail(enq) });
  return NextResponse.json({ ok: true, id: enq.id, emailed: alerts.visitorEmail === 'sent' || alerts.visitorEmail === 'outbox' });
}

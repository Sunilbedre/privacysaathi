import { NextResponse } from 'next/server';
import { z } from 'zod';
import { buildReport, type Answers } from '@/lib/scan/score';
import { summariseDpdp } from '@/lib/ps/dpdp-map';
import { ipLimited } from '@/lib/ps/guard';
import { getScan, hashIp, newId, putScan, retentionDays, updateScan } from '@/lib/ps/store';

const YNP = z.enum(['yes', 'no', 'partly', 'unsure']);
const body = z.object({
  scanId: z.string().max(64).optional(), company: z.string().trim().max(150).optional().default(''), industry: z.string().max(30).optional().default('other'),
  answers: z.object({ hasPolicy: YNP.optional(), consentRecords: YNP.optional(), breachPlan: YNP.optional(), requestOwner: YNP.optional(), training: YNP.optional(), vendors: YNP.optional(), children: YNP.optional() }).default({}),
  hp: z.string().max(0).optional(),
});

/** Questionnaire assessment: for visitors without a website, or to add process answers to a scan. Returns the per-duty summary only. */
export async function POST(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  if (ipLimited(`as:${ip}`, 30)) return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  const p = body.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ error: 'Please check your answers.' }, { status: 400 });
  const d = p.data;
  if (d.hp) return NextResponse.json({ id: newId() });
  const answers = d.answers as Answers;
  let id = d.scanId ?? '';
  let rec = id ? await getScan(id) : null;
  if (id && !rec) return NextResponse.json({ error: 'Your check has expired. Please start again.' }, { status: 410 });
  if (!rec) {
    if (!d.company) return NextResponse.json({ error: 'Please enter your company name.' }, { status: 400 });
    id = newId(); const now = new Date();
    rec = { id, domain: '', url: '', deep: false, status: 'done', step: 'Done', pct: 100, createdAt: now.toISOString(), expiresAt: new Date(now.getTime() + 86400_000).toISOString(), ipHash: hashIp(ip), websiteless: true, company: d.company };
    await putScan(rec);
  }
  await updateScan(id, { answers, industry: d.industry, company: d.company || rec.company });
  const rep = buildReport(rec.result ?? null, answers);
  if (!rec.leadCaptured) return NextResponse.json({ id, locked: true }); // result is shown only after contact details are given
  return NextResponse.json({ id, dpdp: summariseDpdp(rep.checks, { score: rep.headline, band: rep.band, mode: rec.result?.mode ?? 'questions', pages: rec.result?.pagesScanned ?? 0 }) });
}

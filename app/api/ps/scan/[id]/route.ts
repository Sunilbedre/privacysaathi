import { NextResponse } from 'next/server';
import { getScan } from '@/lib/ps/store';
import { summariseQuick } from '@/lib/scan/nodes';
import { dutyOf, summariseDpdp } from '@/lib/ps/dpdp-map';
import { buildReport, confidenceOf } from '@/lib/scan/score';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const r = await getScan(id);
  if (!r) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: { 'X-Robots-Tag': 'noindex' } });
  const quick = r.status === 'done' && r.result && new URL(req.url).searchParams.get('s') ? summariseQuick(r.result.checks, r.result.mode, r.result.pagesScanned) : undefined;
  const u = new URL(req.url);
  let dpdp, details;
  if (r.status === 'done' && (u.searchParams.get('d') || u.searchParams.get('full'))) {
    const rep = buildReport(r.result ?? null, r.answers ?? {});
    // The summary itself is held back until contact details are given: no result is shown before a lead exists.
    if (!r.leadCaptured && u.searchParams.get('full')) return NextResponse.json({ error: 'Details unlock after you share your contact details.' }, { status: 403, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
    if (!r.leadCaptured) return NextResponse.json({ status: r.status, step: r.step, pct: r.pct, deep: r.deep, domain: r.domain, company: r.company, locked: true }, { headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
    dpdp = summariseDpdp(rep.checks, { score: rep.headline, band: rep.band, mode: r.result?.mode ?? 'questions', pages: r.result?.pagesScanned ?? 0 });
    // Full detail (what we saw, why it matters, how to fix) only after a lead has been captured for this report.
    if (u.searchParams.get('full')) {
      if (!r.leadCaptured) return NextResponse.json({ error: 'Details unlock after you share your contact details.' }, { status: 403, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
      details = rep.checks.filter((c) => c.status === 'fail' || c.status === 'warn').map((c) => ({ title: c.title, status: c.status, duty: dutyOf(c), confidence: confidenceOf(c), evidence: c.evidence, whyItMatters: c.whyItMatters, fix: c.fix, relatedService: c.relatedService ?? null }));
    }
  }
  return NextResponse.json({ status: r.status, step: r.step, pct: r.pct, error: r.error, deep: r.deep, domain: r.domain, company: r.company, quick, dpdp, details }, { headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}

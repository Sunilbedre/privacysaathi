import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseWebsite, sameCompany, emailDomain } from '@/lib/lead-rules';
import { assertScannableUrl, ScanBlocked } from '@/lib/scan/ssrf';
import { runScan } from '@/lib/scan/run';
import { domainRecentlyDeepScanned, ipLimited, ownershipVerified, slot, turnstileOk } from '@/lib/ps/guard';
import { hashIp, newId, putScan, retentionDays, updateScan } from '@/lib/ps/store';

export const maxDuration = 60;
const body = z.object({
  website: z.string().max(300), email: z.string().max(200).optional().default(''), authorised: z.boolean().optional().default(false),
  turnstile: z.string().nullable().optional(), hp: z.string().max(0).optional(),
});

export async function POST(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  const p = body.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ error: 'Please check the form and try again.' }, { status: 400 });
  const d = p.data;
  if (d.hp) return NextResponse.json({ id: newId() }); // bot: fake success
  if (ipLimited(ip)) return NextResponse.json({ error: 'Too many scans from your network. Please try again later.' }, { status: 429 });
  if (!(await turnstileOk(d.turnstile ?? null, ip))) return NextResponse.json({ error: 'Could not confirm you are human. Please retry.' }, { status: 400 });
  const site = parseWebsite(d.website);
  if (!site) return NextResponse.json({ error: 'Please enter a valid website, for example yourcompany.com' }, { status: 400 });
  try { assertScannableUrl(site.url); } catch (e) { return NextResponse.json({ error: e instanceof ScanBlocked ? e.reason : 'That address cannot be scanned.' }, { status: 400 }); }

  // Deep scan only with confirmed authorisation AND (matching email domain OR verified ownership).
  const matches = !!d.email && sameCompany(emailDomain(d.email), site.domain);
  const deep = d.authorised && (matches || (await ownershipVerified(site.domain)));
  if (deep && (await domainRecentlyDeepScanned(site.domain))) return NextResponse.json({ error: 'This website had a full scan in the last 24 hours. Please try again tomorrow.' }, { status: 429 });
  if (!slot.take()) return NextResponse.json({ error: 'We are busy right now. Please try again in a minute.' }, { status: 503 });

  const id = newId(), now = new Date();
  await putScan({ id, domain: site.domain, url: site.url, deep, status: 'running', step: 'Starting', pct: 1, createdAt: now.toISOString(), expiresAt: new Date(now.getTime() + (deep ? retentionDays() : 1) * 86400_000).toISOString(), ipHash: hashIp(ip) });
  // Runs in the background of this Node process; the browser polls GET /api/ps/scan/[id].
  void (async () => {
    try {
      const result = await runScan({ url: site.url, deep, onProgress: (step, pct) => void updateScan(id, { step, pct }) });
      await updateScan(id, { status: 'done', step: 'Done', pct: 100, result });
    } catch (e) {
      await updateScan(id, { status: 'error', error: e instanceof ScanBlocked ? e.reason : 'We could not finish the scan of this website.' });
    } finally { slot.release(); }
  })();
  return NextResponse.json({ id, deep });
}

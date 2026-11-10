import { NextResponse } from 'next/server';
import { parseWebsite } from '@/lib/lead-rules';
import { ownershipVerified, verifyToken } from '@/lib/ps/guard';
import { ipLimited } from '@/lib/ps/guard';

/** GET ?domain=acme.com returns the token to publish. POST {domain} checks whether it is in place. */
export async function GET(req: Request) {
  const s = parseWebsite(new URL(req.url).searchParams.get('domain') ?? '');
  if (!s) return NextResponse.json({ error: 'Invalid domain' }, { status: 400 });
  return NextResponse.json({ domain: s.domain, token: verifyToken(s.domain), dns: `privacysaathi-verify=${verifyToken(s.domain)}`, meta: `<meta name="privacysaathi-verify" content="${verifyToken(s.domain)}">` });
}
export async function POST(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  if (ipLimited(`vf:${ip}`, 20)) return NextResponse.json({ error: 'Too many checks. Try again later.' }, { status: 429 });
  const b = await req.json().catch(() => ({}));
  const s = parseWebsite(String(b.domain ?? ''));
  if (!s) return NextResponse.json({ error: 'Invalid domain' }, { status: 400 });
  return NextResponse.json({ verified: await ownershipVerified(s.domain) });
}

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { phoneProblem } from '@/lib/lead-rules';
import { ipLimited } from '@/lib/ps/guard';
import { intlPhone, sendWhatsAppOtp } from '@/lib/ps/channels';
import { checkCode, codeFor, makeChallenge, makeToken, otpEnabled, otpTemplate } from '@/lib/ps/otp';

/** Is mobile verification switched on? The forms ask this to know whether to show the "Verify" step. */
export async function GET() { return NextResponse.json({ required: otpEnabled() }, { headers: { 'cache-control': 'no-store' } }); }

const send = z.object({ action: z.literal('send'), phone: z.string().trim().max(30) });
const verify = z.object({ action: z.literal('verify'), phone: z.string().trim().max(30), challenge: z.string().max(200), code: z.string().max(12) });
const perPhone = new Map<string, number[]>();

export async function POST(req: Request) {
  if (!otpEnabled()) return NextResponse.json({ error: 'Verification is not switched on.' }, { status: 404 });
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  const body = await req.json().catch(() => ({}));

  const v = verify.safeParse(body);
  if (v.success) {
    if (ipLimited(`otpv:${ip}`, 30, 10 * 60_000)) return NextResponse.json({ error: 'Too many tries. Please wait a few minutes.' }, { status: 429 });
    const r = checkCode(v.data.challenge, v.data.phone, v.data.code);
    if (r === 'ok') return NextResponse.json({ ok: true, token: makeToken(v.data.phone) });
    const msg = { wrong: 'That code is not right. Please check and try again.', expired: 'That code has expired. Please ask for a new one.', locked: 'Too many wrong codes. Please ask for a new code.', invalid: 'Please ask for a new code.' }[r];
    return NextResponse.json({ error: msg, expired: r !== 'wrong' }, { status: 400 });
  }

  const s = send.safeParse(body);
  if (!s.success) return NextResponse.json({ error: 'Please enter your mobile number.' }, { status: 400 });
  const pp = phoneProblem(s.data.phone); if (pp) return NextResponse.json({ error: pp }, { status: 400 });
  if (ipLimited(`otps:${ip}`, 6, 60 * 60_000)) return NextResponse.json({ error: 'Too many requests. Please try again in a while.' }, { status: 429 });
  const num = intlPhone(s.data.phone), now = Date.now();
  const hits = (perPhone.get(num) ?? []).filter((t) => now - t < 60 * 60_000);
  if (hits.length && now - hits[hits.length - 1] < 40_000) return NextResponse.json({ error: 'Please wait a moment before asking for another code.' }, { status: 429 });
  if (hits.length >= 4) return NextResponse.json({ error: 'Too many codes requested for this number. Please try again in an hour.' }, { status: 429 });
  hits.push(now); perPhone.set(num, hits); if (perPhone.size > 5000) perPhone.clear();

  const challenge = makeChallenge(s.data.phone, now);
  const r = await sendWhatsAppOtp(otpTemplate(), num, codeFor(challenge));
  if (r !== 'sent') return NextResponse.json({ error: 'We could not send the WhatsApp code. Please check the number has WhatsApp and try again.' }, { status: 502 });
  return NextResponse.json({ ok: true, challenge, expiresInMin: 10 });
}

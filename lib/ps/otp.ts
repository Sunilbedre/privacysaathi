import 'server-only';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { getSetting } from '@/lib/settings';
import { intlPhone, isOn } from './channels';

/**
 * Mobile number verification by WhatsApp code. No database: the code is derived from a signed challenge, so it survives restarts.
 * Flow: send (we make a challenge, WhatsApp the code, return the challenge) then verify (challenge + code gives a 30-minute token bound to the number).
 */
const secret = () => process.env.PS_SECRET || process.env.CMS_ADMIN_PASSWORD || 'dev-only-secret';
const sig = (s: string) => createHmac('sha256', secret()).update(s).digest('base64url');
const eq = (a: string, b: string) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };

export const OTP_TTL_MS = 10 * 60_000;
export const TOKEN_TTL_MS = 30 * 60_000;
export const otpTemplate = () => getSetting('WA_TEMPLATE_OTP') || 'ps_otp_mobile_verification';

/** Verification is on only when you switched it on AND WhatsApp is set up, so a missing key can never block your leads. */
export const otpEnabled = () => isOn('WA_OTP_REQUIRED') && !!getSetting('WA_TOKEN') && !!getSetting('WA_PHONE_NUMBER_ID');

export function makeChallenge(phone: string, now = Date.now()) {
  const body = `${intlPhone(phone)}.${now + OTP_TTL_MS}.${randomBytes(6).toString('base64url')}`;
  return `${body}.${sig('c:' + body)}`;
}
const parse = (ch: string) => { const p = ch.split('.'); return p.length === 4 && eq(p[3], sig('c:' + p.slice(0, 3).join('.'))) ? { phone: p[0], exp: Number(p[1]) } : null; };
/** The 6-digit code for a challenge. */
export const codeFor = (ch: string) => String(parseInt(createHmac('sha256', secret()).update('otp:' + ch).digest('hex').slice(0, 8), 16) % 1_000_000).padStart(6, '0');

const tries = new Map<string, number>();
export type CodeCheck = 'ok' | 'wrong' | 'expired' | 'locked' | 'invalid';
export function checkCode(ch: string, phone: string, code: string, now = Date.now()): CodeCheck {
  const c = parse(ch);
  if (!c || c.phone !== intlPhone(phone)) return 'invalid';
  if (now > c.exp) return 'expired';
  const n = (tries.get(ch) ?? 0) + 1; tries.set(ch, n);
  if (tries.size > 5000) tries.clear();
  if (n > 5) return 'locked';
  return eq(String(code).replace(/\D/g, ''), codeFor(ch)) ? 'ok' : 'wrong';
}

export function makeToken(phone: string, now = Date.now()) {
  const body = `v.${intlPhone(phone)}.${now + TOKEN_TTL_MS}`;
  return `${body}.${sig('t:' + body)}`;
}
export function checkToken(token: string | undefined, phone: string, now = Date.now()): boolean {
  const p = (token ?? '').split('.');
  if (p.length !== 4 || p[0] !== 'v') return false;
  return eq(p[3], sig('t:' + p.slice(0, 3).join('.'))) && p[1] === intlPhone(phone) && now <= Number(p[2]);
}

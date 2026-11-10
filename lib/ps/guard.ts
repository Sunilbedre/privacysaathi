import 'server-only';
import { createHmac } from 'node:crypto';
import dns from 'node:dns/promises';
import { safeFetch } from '@/lib/scan/safe-fetch';
import { metaContent } from '@/lib/scan/html';
import { listScans } from './store';

const secret = () => process.env.PS_SECRET || 'dev-only-secret';
/** Deterministic ownership token: no storage needed. */
export const verifyToken = (domain: string) => createHmac('sha256', secret()).update(domain.toLowerCase()).digest('hex').slice(0, 24);

export async function ownershipVerified(domain: string): Promise<boolean> {
  const t = verifyToken(domain);
  const txt = await dns.resolveTxt(domain).catch(() => []);
  if (txt.some((r) => r.join('').trim() === `privacysaathi-verify=${t}`)) return true;
  try {
    const r = await safeFetch(`https://${domain}/`, { maxBytes: 300_000, timeoutMs: 8000 });
    return metaContent(r.body, 'privacysaathi-verify') === t;
  } catch { return false; }
}

export async function turnstileOk(token: string | null, ip: string): Promise<boolean> {
  const s = process.env.TURNSTILE_SECRET;
  if (!s) return true; // not configured: skip (honeypot and rate limits still apply)
  if (!token) return false;
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: new URLSearchParams({ secret: s, response: token, remoteip: ip }) }).catch(() => null);
  return !!(res && (await res.json().catch(() => ({}))).success);
}

const ipHits = new Map<string, number[]>();
export function ipLimited(ip: string, max = 5, windowMs = 60 * 60_000) {
  const now = Date.now();
  const r = (ipHits.get(ip) ?? []).filter((t) => now - t < windowMs); r.push(now); ipHits.set(ip, r);
  return r.length > max;
}
let running = 0;
export const MAX_CONCURRENT = Number(process.env.PS_MAX_CONCURRENT) || 3;
export const slot = { take: () => (running < MAX_CONCURRENT ? (running++, true) : false), release: () => { running = Math.max(0, running - 1); } };

/** One deep scan per domain per 24 hours. */
export async function domainRecentlyDeepScanned(domain: string): Promise<boolean> {
  const day = Date.now() - 24 * 3600_000;
  return (await listScans()).some((s) => s.domain === domain && s.deep && Date.parse(s.createdAt) > day);
}

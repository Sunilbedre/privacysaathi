import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

const COOKIE = 'bedre_cms_session';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function secret() {
  const s = process.env.CMS_ADMIN_PASSWORD;
  if (!s) return null;
  return s;
}

export function cmsEnabled() {
  return Boolean(secret());
}

function sign(payload: string, key: string) {
  return createHmac('sha256', key).update(payload).digest('hex');
}

export function createSessionToken(key: string) {
  const payload = `${Date.now()}`;
  return `${payload}.${sign(payload, key)}`;
}

function verifyToken(token: string, key: string) {
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const ts = Number(payload);
  if (!Number.isFinite(ts) || Date.now() - ts > MAX_AGE_MS) return false;
  const expected = sign(payload, key);
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function setCmsSession() {
  const key = secret();
  if (!key) throw new Error('CMS not configured');
  const jar = await cookies();
  jar.set(COOKIE, createSessionToken(key), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_MS / 1000,
  });
}

export async function clearCmsSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function isCmsAuthed() {
  const key = secret();
  if (!key) return false;
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return false;
  return verifyToken(token, key);
}

export function verifyPassword(input: string) {
  const key = secret();
  if (!key) return false;
  try {
    return timingSafeEqual(Buffer.from(input), Buffer.from(key));
  } catch {
    return false;
  }
}

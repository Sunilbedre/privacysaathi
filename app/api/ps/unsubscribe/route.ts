import { NextResponse } from 'next/server';
import { emailHash, verifyUnsub } from '@/lib/ps/mail';
import { appendLine, readLines } from '@/lib/ps/store';

const page = (title: string, body: string, status = 200) => new NextResponse(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex"><title>${title}</title></head><body style="margin:0;background:#F4F6FB;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0A0A0A"><div style="max-width:480px;margin:12vh auto;background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:32px"><h1 style="margin:0 0 10px;font-size:22px">${title}</h1><p style="margin:0;color:#5F5F5F;line-height:1.6">${body}</p></div></body></html>`, { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });

/** One link, one click: /api/ps/unsubscribe?e=<email>&t=<token>. POST works too, for mail clients that offer one-click unsubscribe. */
async function handle(req: Request) {
  const u = new URL(req.url), email = (u.searchParams.get('e') ?? '').trim().toLowerCase(), token = u.searchParams.get('t') ?? '';
  if (!email || !token || !verifyUnsub(email, token)) return page('This link is not valid', 'The unsubscribe link is incomplete or has been changed. Reply to the email and we will remove you.', 400);
  const h = emailHash(email);
  if (!(await readLines<{ h: string }>('suppress')).some((r) => r.h === h)) await appendLine('suppress', { h, ts: new Date().toISOString() });
  return page('You are unsubscribed', 'We will not send you any more follow-up emails from Privacy Saathi. If you asked for a review call, a consultant may still contact you about it. Reply to any of our emails to stop that too.');
}
export const GET = handle;
export const POST = handle;

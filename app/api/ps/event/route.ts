import { NextResponse } from 'next/server';
import { z } from 'zod';
import { appendLine } from '@/lib/ps/store';
import { ipLimited } from '@/lib/ps/guard';
import { createHash } from 'node:crypto';

const BOT = /bot|crawl|spider|slurp|preview|monitor|uptime|lighthouse|headless|curl|wget|python|go-http|httpclient|facebookexternalhit|pingdom|gtmetrix/i;
const istDay = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
/** One-day hash of the browser id: counts distinct visitors per day, cannot be followed from day to day, and the raw id is never stored. */
const dayHash = (vid: string) => createHash('sha256').update(`${process.env.PS_SECRET || process.env.CMS_ADMIN_PASSWORD || 'dev'}|${istDay()}|${vid}`).digest('hex').slice(0, 16);

const EVENTS = ['visit', 'scan_started', 'scan_completed', 'report_viewed', 'generate_lead', 'booking_clicked', 'email_help_clicked', 'dpdp_check_started', 'dpdp_report_unlocked', 'popup_shown', 'popup_lead', 'report_printed', 'dpdp_solution_enquiry', 'dock_whatsapp', 'dock_call', 'dock_scan', 'bot_opened', 'bot_started', 'bot_completed', 'bot_expert_requested', 'ask_ai'] as const;
const schema = z.object({ event: z.enum(EVENTS), tags: z.record(z.string(), z.string().max(300)).optional(), path: z.string().max(200).optional(), sid: z.string().max(40).optional(), vid: z.string().max(40).optional() });

export async function POST(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  if (ipLimited(`ev:${ip}`, 120)) return new NextResponse(null, { status: 204 });
  if (BOT.test(req.headers.get('user-agent') ?? '')) return new NextResponse(null, { status: 204 }); // crawlers and monitors are not visitors
  const p = schema.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ ok: false }, { status: 400 });
  // No IP, no name, no raw browser id: event name, campaign tags, page, time and a one-day hash.
  await appendLine('events', { ts: new Date().toISOString(), event: p.data.event, tags: p.data.tags ?? {}, path: p.data.path, sid: p.data.sid, ...(p.data.vid ? { vh: dayHash(p.data.vid) } : {}) });
  return new NextResponse(null, { status: 204 });
}

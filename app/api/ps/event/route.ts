import { NextResponse } from 'next/server';
import { z } from 'zod';
import { appendLine } from '@/lib/ps/store';
import { ipLimited } from '@/lib/ps/guard';

const EVENTS = ['visit', 'scan_started', 'scan_completed', 'report_viewed', 'generate_lead', 'booking_clicked', 'email_help_clicked', 'dpdp_check_started', 'dpdp_report_unlocked', 'popup_shown', 'popup_lead'] as const;
const schema = z.object({ event: z.enum(EVENTS), tags: z.record(z.string(), z.string().max(300)).optional(), path: z.string().max(200).optional(), sid: z.string().max(40).optional() });

export async function POST(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  if (ipLimited(`ev:${ip}`, 120)) return new NextResponse(null, { status: 204 });
  const p = schema.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ ok: false }, { status: 400 });
  // No IP, no personal data: event name, campaign tags, time.
  await appendLine('events', { ts: new Date().toISOString(), event: p.data.event, tags: p.data.tags ?? {}, path: p.data.path, sid: p.data.sid });
  return new NextResponse(null, { status: 204 });
}

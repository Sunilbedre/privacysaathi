import 'server-only';
import { listEnquiries, STATUSES, type Enquiry } from '@/lib/ps/crm';
import { listScans } from '@/lib/ps/store';

const TZ = 'Asia/Kolkata';
export const dayKey = (d: Date | string) => new Date(d).toLocaleDateString('en-CA', { timeZone: TZ });

export interface Dashboard {
  total: number; today: number; week: number; weekPrev: number; month: number; hot: number; open: number; wonCount: number; winRate: number; avgScore: number | null;
  byStatus: Record<string, number>; byType: { scan: number; solution: number };
  series: { key: string; label: string; scan: number; solution: number }[];
  scans: { total: number; week: number; done: number; leadRate: number; failed: number };
  alerts: { channel: string; label: string; sent: number; failed: number; skipped: number }[];
  latest: Enquiry[]; needFollowUp: Enquiry[];
}

const CHANNELS: [string, string][] = [['whatsapp', 'WhatsApp'], ['sms', 'SMS'], ['ownerEmail', 'Email to you'], ['visitorEmail', 'Email to visitor'], ['clientWhatsapp', 'WhatsApp to visitor'], ['clientSms', 'SMS to visitor'], ['webhook', 'Chat webhook']];

export async function dashboard(): Promise<Dashboard> {
  const [enq, scans] = await Promise.all([listEnquiries(), listScans()]);
  const now = Date.now(), DAY = 86400000;
  const todayKey = dayKey(new Date());
  const within = (e: Enquiry, from: number, to: number) => { const t = new Date(e.createdAt).getTime(); return t >= from && t < to; };

  const series = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now - (13 - i) * DAY);
    return { key: dayKey(d), label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: TZ }), scan: 0, solution: 0 };
  });
  for (const e of enq) { const s = series.find((x) => x.key === dayKey(e.createdAt)); if (s) s[e.type] += 1; }

  const byStatus: Record<string, number> = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const e of enq) byStatus[e.status] = (byStatus[e.status] ?? 0) + 1;
  const scored = enq.filter((e) => e.type === 'scan' && typeof e.score === 'number');
  const closed = byStatus.won + byStatus.lost;

  const done = scans.filter((s) => s.status === 'done');
  const alerts = CHANNELS.map(([channel, label]) => {
    const vals = enq.map((e) => e.alerts?.[channel]).filter(Boolean) as string[];
    return { channel, label, sent: vals.filter((v) => v === 'sent' || v === 'outbox').length, failed: vals.filter((v) => v === 'failed').length, skipped: vals.filter((v) => v === 'skipped').length };
  });

  return {
    total: enq.length,
    today: enq.filter((e) => dayKey(e.createdAt) === todayKey).length,
    week: enq.filter((e) => within(e, now - 7 * DAY, now + DAY)).length,
    weekPrev: enq.filter((e) => within(e, now - 14 * DAY, now - 7 * DAY)).length,
    month: enq.filter((e) => within(e, now - 30 * DAY, now + DAY)).length,
    hot: enq.filter((e) => e.priority === 'hot' && (e.status === 'new' || e.status === 'contacted')).length,
    open: enq.filter((e) => e.status !== 'won' && e.status !== 'lost').length,
    wonCount: byStatus.won, winRate: closed ? Math.round((byStatus.won / closed) * 100) : 0,
    avgScore: scored.length ? Math.round(scored.reduce((a, e) => a + (e.score ?? 0), 0) / scored.length) : null,
    byStatus, byType: { scan: enq.filter((e) => e.type === 'scan').length, solution: enq.filter((e) => e.type === 'solution').length },
    series,
    scans: {
      total: scans.length, week: scans.filter((s) => now - new Date(s.createdAt).getTime() < 7 * DAY).length, done: done.length,
      leadRate: done.length ? Math.round((done.filter((s) => s.leadCaptured).length / done.length) * 100) : 0, failed: scans.filter((s) => s.status === 'error').length,
    },
    alerts,
    latest: enq.slice(0, 6),
    needFollowUp: enq.filter((e) => e.status === 'new' && now - new Date(e.createdAt).getTime() > DAY / 2).slice(0, 5),
  };
}

/** Filter, search and sort for the CRM list. */
export function filterEnquiries(all: Enquiry[], o: { t?: string; s?: string; p?: string; q?: string; sort?: string }) {
  const q = (o.q ?? '').trim().toLowerCase();
  let rows = all.filter((e) => (!o.t || e.type === o.t) && (!o.s || e.status === o.s) && (!o.p || e.priority === o.p)
    && (!q || [e.name, e.phone, e.email, e.company, e.website, e.topic, e.id].some((x) => (x ?? '').toLowerCase().includes(q))));
  if (o.sort === 'old') rows = [...rows].reverse();
  else if (o.sort === 'score') rows = [...rows].sort((a, b) => (a.score ?? 101) - (b.score ?? 101));
  else if (o.sort === 'exposure') rows = [...rows].sort((a, b) => b.exposureCr - a.exposureCr);
  return rows;
}

const cell = (v: unknown) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export function toCsv(rows: Enquiry[]) {
  const head = ['Received', 'Type', 'Stage', 'Priority', 'Name', 'Phone', 'Email', 'Business', 'Website', 'Score', 'Band', 'Max fine (Cr)', 'Gaps', 'Wants help with', 'Message', 'Best time', 'Source', 'Campaign', 'Notes', 'ID'];
  const lines = rows.map((e) => [e.createdAt, e.type, e.status, e.priority, e.name, e.phone, e.email, e.company, e.website, e.score ?? '', e.band, e.exposureCr, e.gaps, e.topic, e.message, e.preferredTime, e.source, e.utm, e.notes.map((n) => n.text).join(' | '), e.id].map(cell).join(','));
  return '﻿' + [head.join(','), ...lines].join('\n');
}

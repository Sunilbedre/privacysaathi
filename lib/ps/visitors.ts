import 'server-only';
import { readLines } from './store';
import { listEnquiries } from './crm';
import { originFromTags, sourceLabel } from './origin';

/** Daily visitor numbers from the anonymous visit events. "Visitors" = distinct one-day hashes; "Page views" = every page opened. */
const TZ = 'Asia/Kolkata';
export const dayKey = (d: Date | string) => new Date(d).toLocaleDateString('en-CA', { timeZone: TZ });
interface Ev { ts: string; event: string; tags?: Record<string, string>; path?: string; vh?: string }
export interface DayRow { key: string; label: string; weekday: string; views: number; visitors: number; scans: number; leads: number }
export interface VisitorStats {
  days: number; series: DayRow[];
  today: { visitors: number; views: number; leads: number }; range: { visitors: number; views: number; leads: number; scans: number; perDay: number; conversion: number };
  yesterdayVisitors: number; pages: { path: string; views: number; visitors: number }[]; sources: { label: string; visitors: number }[]; devices: { label: string; visitors: number }[];
  hasUnique: boolean; since: string | null;
}

const normPath = (p?: string) => ((p ?? '/').split('?')[0].replace(/^\/ps(?=\/|$)/, '') || '/').slice(0, 80);

export function buildStats(evs: Ev[], leadDates: string[], days: number, now = new Date()): VisitorStats {
  const keys = Array.from({ length: days }, (_, i) => dayKey(new Date(now.getTime() - (days - 1 - i) * 86400000)));
  const rows = new Map<string, DayRow & { set: Set<string> }>(keys.map((k) => { const d = new Date(k + 'T12:00:00+05:30'); return [k, { key: k, label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: TZ }), weekday: d.toLocaleDateString('en-IN', { weekday: 'short', timeZone: TZ }), views: 0, visitors: 0, scans: 0, leads: 0, set: new Set<string>() }]; }));
  const pages = new Map<string, { views: number; v: Set<string> }>(), sources = new Map<string, Set<string>>(), devices = new Map<string, Set<string>>(), seen = new Set<string>(), rangeVisitors = new Set<string>();
  let hasUnique = false, since: string | null = null;
  for (const e of evs) {
    const k = dayKey(e.ts), r = rows.get(k); if (!r) continue;
    if (!since || e.ts < since) since = e.ts;
    if (e.event === 'scan_started') r.scans++;
    if (e.event !== 'visit') continue;
    r.views++;
    const pg = pages.get(normPath(e.path)) ?? { views: 0, v: new Set<string>() }; pg.views++; if (e.vh) pg.v.add(e.vh); pages.set(normPath(e.path), pg);
    if (e.vh) {
      hasUnique = true; r.set.add(e.vh); rangeVisitors.add(k + e.vh);
      if (!seen.has(k + e.vh)) { // first visit of that visitor that day decides their source and device
        seen.add(k + e.vh);
        const src = sourceLabel(originFromTags(e.tags), 'Not recorded'); (sources.get(src) ?? sources.set(src, new Set()).get(src)!).add(k + e.vh);
        const dev = e.tags?.device || 'Not recorded'; (devices.get(dev) ?? devices.set(dev, new Set()).get(dev)!).add(k + e.vh);
      }
    }
  }
  for (const d of leadDates) { const r = rows.get(dayKey(d)); if (r) r.leads++; }
  const series: DayRow[] = [...rows.values()].map((r) => ({ key: r.key, label: r.label, weekday: r.weekday, views: r.views, visitors: r.set.size, scans: r.scans, leads: r.leads }));
  const sum = (f: (r: DayRow) => number) => series.reduce((a, r) => a + f(r), 0);
  const today = series[series.length - 1], visitors = sum((r) => r.visitors), leads = sum((r) => r.leads);
  const top = <T,>(m: Map<string, T>, f: (v: T) => number) => [...m.entries()].map(([label, v]) => ({ label, n: f(v) })).sort((a, b) => b.n - a.n);
  return {
    days, series, today: { visitors: today.visitors, views: today.views, leads: today.leads },
    range: { visitors, views: sum((r) => r.views), leads, scans: sum((r) => r.scans), perDay: Math.round(visitors / days), conversion: visitors ? Math.round((leads / visitors) * 1000) / 10 : 0 },
    yesterdayVisitors: series.length > 1 ? series[series.length - 2].visitors : 0,
    pages: top(pages, (p) => p.views).slice(0, 8).map((x) => ({ path: x.label, views: x.n, visitors: pages.get(x.label)!.v.size })),
    sources: top(sources, (s) => s.size).slice(0, 8).map((x) => ({ label: x.label, visitors: x.n })), devices: top(devices, (s) => s.size).map((x) => ({ label: x.label, visitors: x.n })),
    hasUnique, since,
  };
}

export async function visitorStats(days = 30): Promise<VisitorStats> {
  const [evs, enq] = await Promise.all([readLines<Ev>('events'), listEnquiries()]);
  return buildStats(evs, enq.map((e) => e.createdAt), days);
}

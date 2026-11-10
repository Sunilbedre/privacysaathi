/** Pure helpers for the daily lead report (no I/O), so they can be tested. */
export interface LeadRow { receivedAt: string; name: string; email: string; phone: string; company?: string; domain: string; industry: string; size: string; score: number; scoreBand: string; no_official_email: boolean; email_domain_matches_website: boolean; no_website: boolean; path?: string; utm_source: string; utm_medium: string; utm_campaign: string; utm_term: string; gclid: string; lead_source?: string; landing_host: string; referrer: string }
export interface EventRow { ts: string; event: string; tags?: Record<string, string> }

export const FUNNEL = ['visit', 'scan_started', 'scan_completed', 'report_viewed', 'generate_lead', 'booking_clicked', 'dpdp_check_started', 'dpdp_report_unlocked', 'popup_shown', 'popup_lead'] as const;
const count = <T,>(rows: T[], key: (r: T) => string) => { const m = new Map<string, number>(); for (const r of rows) { const k = key(r) || '(none)'; m.set(k, (m.get(k) ?? 0) + 1); } return [...m.entries()].sort((a, b) => b[1] - a[1]); };

export function inWindow<T>(rows: T[], ts: (r: T) => string, from: number, to: number) { return rows.filter((r) => { const t = Date.parse(ts(r)); return t >= from && t < to; }); }

export function summarise(leads: LeadRow[], events: EventRow[]) {
  const funnel = Object.fromEntries(FUNNEL.map((f) => [f, events.filter((e) => e.event === f).length])) as Record<(typeof FUNNEL)[number], number>;
  return {
    total: leads.length, funnel,
    byHost: count(leads, (l) => l.landing_host), byCampaign: count(leads, (l) => l.utm_campaign), byKeyword: count(leads, (l) => l.utm_term),
    byBand: count(leads, (l) => l.scoreBand), bySource: count(leads, (l) => l.lead_source ?? ''), withGclid: leads.filter((l) => l.gclid).length, noOfficialEmail: leads.filter((l) => l.no_official_email).length,
    domainMismatch: leads.filter((l) => !l.no_website && !l.email_domain_matches_website && l.domain).length,
  };
}

/** Spreadsheet formula injection guard: cells starting with = + - @ get a leading apostrophe. */
const cell = (v: unknown) => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const COLS: (keyof LeadRow)[] = ['receivedAt', 'name', 'email', 'phone', 'company', 'domain', 'industry', 'size', 'score', 'scoreBand', 'no_official_email', 'email_domain_matches_website', 'no_website', 'path', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'gclid', 'lead_source', 'landing_host', 'referrer'];
export const toCsv = (leads: LeadRow[]) => [COLS.join(','), ...leads.map((l) => COLS.map((c) => cell(l[c])).join(','))].join('\n') + '\n';

export function toText(s: ReturnType<typeof summarise>, label: string) {
  const list = (rows: [string, number][]) => rows.slice(0, 10).map(([k, n]) => `  ${k}: ${n}`).join('\n') || '  (none)';
  const f = s.funnel;
  return [
    `Privacy Saathi daily report, ${label}`, '', `New leads: ${s.total}`, `With gclid (Google Ads click): ${s.withGclid}`, `No official email: ${s.noOfficialEmail}`, `Email domain differs from website: ${s.domainMismatch}`, '',
    'Funnel (events)', `  Visited: ${f.visit}`, `  Started scan: ${f.scan_started}`, `  Finished scan: ${f.scan_completed}`, `  Report viewed: ${f.report_viewed}`, `  Lead submitted: ${f.generate_lead}`, `  Booking clicked: ${f.booking_clicked}`, `  DPDP check started: ${f.dpdp_check_started}`, `  DPDP report unlocked: ${f.dpdp_report_unlocked}`, `  Popup shown: ${f.popup_shown}`, `  Popup lead: ${f.popup_lead}`, '',
    'Leads by landing domain', list(s.byHost), '', 'Leads by campaign', list(s.byCampaign), '', 'Leads by keyword', list(s.byKeyword), '', 'Leads by score band', list(s.byBand), '', 'Leads by source (dpdp_check, popup, scan)', list(s.bySource), '',
    'CSV of these leads is attached. Contains personal data: handle with care.',
  ].join('\n');
}

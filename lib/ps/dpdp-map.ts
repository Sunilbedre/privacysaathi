import type { Check, Duty } from '@/lib/scan/types';

/**
 * DPDP duties with the Act reference, the maximum penalty tier and why each matters.
 * Section numbers and fine tiers follow published summaries of the DPDP Act, 2023 (Schedule to section 33) and the Rules, 2025.
 * They are NOT legal advice and must be confirmed by a legal adviser before launch (see content/dpdp.ts).
 */
export interface DutyInfo { id: Duty; label: string; ref: string; fineCr: number; tier: string; importance: string; steps: string[] }

const BASE: Omit<DutyInfo, 'steps'>[] = [
  { id: 'notice', label: 'Clear notice', ref: 'Section 5', fineCr: 50, tier: 'Other breaches', importance: 'People must be told what you collect, why, and how to complain, before you collect it. It is the first thing a regulator or customer checks.' },
  { id: 'consent', label: 'Valid consent', ref: 'Section 6', fineCr: 50, tier: 'Other breaches', importance: 'Consent must be free, specific and as easy to withdraw as to give. Forms and trackers without it are the most common gap.' },
  { id: 'purpose', label: 'Purpose and minimisation', ref: 'Sections 4 and 8(7)', fineCr: 50, tier: 'Other breaches', importance: 'Use personal data only for the purpose you stated and erase it when that purpose is served. You cannot protect data you cannot locate.' },
  { id: 'security', label: 'Reasonable security safeguards', ref: 'Section 8(5)', fineCr: 250, tier: 'Highest tier', importance: 'The highest penalty tier in the Act. A weak website, email or server setup is the most visible way to fail this duty.' },
  { id: 'breach', label: 'Breach response', ref: 'Section 8(6)', fineCr: 200, tier: 'Second tier', importance: 'A breach must be reported to the Data Protection Board and affected people, with a detailed report within 72 hours. You need a plan before it happens.' },
  { id: 'children', label: 'Children’s data', ref: 'Section 9', fineCr: 200, tier: 'Second tier', importance: 'Verifiable parental consent is needed for anyone under 18, and tracking or targeted advertising aimed at children is restricted.' },
  { id: 'rights', label: 'People’s rights and grievances', ref: 'Sections 11 to 14', fineCr: 50, tier: 'Other breaches', importance: 'People can ask to see, correct or erase their data and to complain to you first. You need a named contact and a process.' },
  { id: 'logs', label: 'Logs and erasure', ref: 'Rules, 2025', fineCr: 50, tier: 'Other breaches', importance: 'Processing and traffic logs must be kept for at least a year, then data you no longer need must be erased.' },
];

/** Generic first steps per duty: what a business typically does. Specific findings add to these in the report. */
const STEPS: Record<Duty, string[]> = {
  notice: ['Publish a plain-language privacy notice: what you collect, why, how long you keep it and who to complain to.', 'Link it in the footer and next to every form or app screen that collects data.', 'Name a contact for privacy questions and complaints.'],
  consent: ['Add a clear consent line and an unticked checkbox beside every form that collects personal data.', 'Load analytics and ad trackers only after the visitor agrees, and let them withdraw as easily as they agreed.', 'Record who agreed, when, to what, and which notice version they saw.'],
  purpose: ['List the personal data you hold, where it lives and why you collect it.', 'Stop collecting fields you do not need.', 'Set a retention period for each data set and erase data when it expires.'],
  security: ['Force HTTPS everywhere and add the missing security headers (HSTS, CSP and others).', 'Turn on multi-factor login for staff and admin accounts, and keep software and plugins updated.', 'Set up SPF, DKIM and DMARC for your email and keep tested backups.'],
  breach: ['Write a one-page breach plan: who decides, who reports, who tells customers.', 'Know how to notify the Data Protection Board and affected people, with a detailed report within 72 hours.', 'Set up logging and alerts so you would notice a breach.'],
  children: ['Find out whether you collect data from anyone under 18, directly or through a school or app.', 'If you do, get verifiable parental consent before collecting it.', 'Turn off tracking and targeted advertising aimed at children.'],
  rights: ['Name an owner for privacy requests and complaints and publish their contact.', 'Create a simple process to answer access, correction and erasure requests on time.', 'Keep a log of requests and your replies.'],
  logs: ['Keep processing and traffic logs for at least one year.', 'Protect the logs from change and limit who can read them.', 'Erase personal data you no longer need once the purpose and any legal retention end.'],
};
export const DUTIES: DutyInfo[] = BASE.map((d) => ({ ...d, steps: STEPS[d.id] }));
/** First sentence of a longer text, for compact cards. */
export const firstSentence = (t: string) => (t.match(/^.*?[.!?](\s|$)/)?.[0] ?? t).trim();

export type DutyStatus = 'gap' | 'review' | 'ok' | 'unknown';
export interface DutyRow extends DutyInfo { status: DutyStatus; issues: number; titles: string[] }
export interface Exposure { level: 'gap' | 'review' | 'none'; maxCr: number; dutyLabel: string; gaps: number; reviews: number }
export interface DpdpSummary {
  score: number; band: string; mode: 'light' | 'deep' | 'questions'; pages: number;
  duties: DutyRow[]; exposure: Exposure; counts: Record<DutyStatus, number>; top: { title: string; status: 'fail' | 'warn'; duty: Duty | null }[];
}

/** A check counts toward a duty by its own label, or toward security safeguards when it is a technical security check. */
export const dutyOf = (c: Check): Duty | null => c.duty ?? (c.area === 'security' || c.area === 'email' ? 'security' : null);

export function assessDuties(checks: Check[]): DutyRow[] {
  return DUTIES.map((d) => {
    const cs = checks.filter((c) => dutyOf(c) === d.id);
    const fails = cs.filter((c) => c.status === 'fail'), warns = cs.filter((c) => c.status === 'warn');
    const status: DutyStatus = fails.length ? 'gap' : warns.length ? 'review' : cs.some((c) => c.status === 'pass') ? 'ok' : 'unknown';
    return { ...d, status, issues: fails.length + warns.length, titles: [...fails, ...warns].slice(0, 2).map((c) => c.title) };
  });
}

export function exposureOf(rows: DutyRow[]): Exposure {
  const gaps = rows.filter((r) => r.status === 'gap'), reviews = rows.filter((r) => r.status === 'review');
  const pool = gaps.length ? gaps : reviews;
  const top = [...pool].sort((a, b) => b.fineCr - a.fineCr)[0];
  return { level: gaps.length ? 'gap' : reviews.length ? 'review' : 'none', maxCr: top?.fineCr ?? 0, dutyLabel: top?.label ?? '', gaps: gaps.length, reviews: reviews.length };
}

const W = { high: 3, medium: 2, low: 1 } as const;
export function summariseDpdp(checks: Check[], meta: { score: number; band: string; mode: DpdpSummary['mode']; pages: number }): DpdpSummary {
  const duties = assessDuties(checks);
  const counts = { gap: 0, review: 0, ok: 0, unknown: 0 } as Record<DutyStatus, number>;
  for (const d of duties) counts[d.status]++;
  const top = checks.filter((c) => c.status === 'fail' || c.status === 'warn')
    .sort((a, b) => W[b.severity] * (b.status === 'fail' ? 2 : 1) - W[a.severity] * (a.status === 'fail' ? 2 : 1)).slice(0, 5)
    .map((c) => ({ title: c.title, status: c.status as 'fail' | 'warn', duty: dutyOf(c) }));
  return { ...meta, duties, exposure: exposureOf(duties), counts, top };
}

export const crore = (n: number) => `₹${n} crore`;

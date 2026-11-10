import type { Check, Confidence, Duty, ScanResult } from './types';

/**
 * HOW WE SCORE (shown to visitors in a "how we score" note):
 * each check is worth 3 (high), 2 (medium) or 1 (low) points. Pass earns all, warn earns half, fail earns none.
 * "Unknown" checks are left out so we never mark you down for what we could not see.
 * DPDP readiness uses the DPDP checks plus your answers. Security hygiene uses website and email security checks.
 * Headline score = average of the two. Bands: under 35 Just starting, 35 to 59 Some foundations, 60 to 79 Well on your way, 80 and up Strong position.
 */
const W = { high: 3, medium: 2, low: 1 } as const;
const P = { pass: 1, warn: 0.5, fail: 0 } as const;

export function areaScore(checks: Check[]): number | null {
  let got = 0, max = 0;
  for (const c of checks) {
    if (c.status === 'unknown') continue;
    max += W[c.severity]; got += W[c.severity] * P[c.status];
  }
  return max ? Math.round((got / max) * 100) : null;
}
export const band = (n: number) => (n < 35 ? 'Just starting' : n < 60 ? 'Some foundations' : n < 80 ? 'Well on your way' : 'Strong position');

/** Checks that read page source and so can miss things loaded by script (banners, policy links, forms). */
const INFERRED = new Set(['privacy-policy', 'terms', 'notice-content', 'grievance', 'forms-consent', 'trackers', 'consent-banner', 'trackers-before-consent', 'children', 'cookie-flags']);
export function confidenceOf(c: Pick<Check, 'id' | 'status'>): Confidence {
  if (c.id.startsWith('a-')) return 'self';
  if (c.id === 'consent-live') return 'confirmed';
  if (c.status === 'unknown') return 'unseen';
  return INFERRED.has(c.id) && c.status !== 'pass' ? 'likely' : 'confirmed';
}
export const CONFIDENCE_LABEL: Record<Confidence, string> = { confirmed: 'Confirmed', likely: 'Likely: please verify', self: 'From your answers', unseen: 'Cannot be seen from outside' };

export interface Answers {
  data?: string[]; children?: 'yes' | 'no' | 'unsure'; storage?: 'india' | 'abroad' | 'unknown'; vendors?: 'yes' | 'no' | 'unsure';
  records?: 'under1k' | '1k-100k' | '100k+' | 'unsure'; consentRecords?: 'yes' | 'no' | 'partly'; breachPlan?: 'yes' | 'no' | 'partly';
  requestOwner?: 'yes' | 'no'; training?: 'yes' | 'no' | 'partly'; hasPolicy?: 'yes' | 'no';
}

const yn = (v: string | undefined, id: string, title: string, duty: Duty, sev: Check['severity'], why: string, fix: string, svc: string): Check | null =>
  v === undefined ? null : { id, title, area: 'dpdp', duty, severity: sev, status: v === 'yes' ? 'pass' : v === 'partly' ? 'warn' : v === 'no' ? 'fail' : 'unknown', evidence: `You answered: ${v}.`, whyItMatters: why, fix, relatedService: svc };

export function answerChecks(a: Answers): Check[] {
  return [
    yn(a.hasPolicy, 'a-notice', 'You have a written privacy notice', 'notice', 'high', 'People must be told what you collect, why and how to complain before you collect it.', 'Publish a plain-language privacy notice and link it everywhere you collect data.', 'Security Consulting'),
    a.children === 'yes' || a.children === 'unsure' ? { id: 'a-children', title: 'Children\'s data is handled with parental consent', area: 'dpdp', duty: 'children', severity: 'high', status: a.children === 'yes' ? 'warn' : 'unknown', evidence: `You answered: ${a.children}.`, whyItMatters: 'Verifiable parental consent is needed for anyone under 18.', fix: 'Identify children\'s data and add verifiable parental consent and no tracking.', relatedService: 'Security Consulting' } as Check : null,
    yn(a.consentRecords, 'a-consent-records', 'You keep records of consent', 'consent', 'high', 'You must be able to show who agreed to what, and when.', 'Log consent with time, purpose and notice version.', 'Security Consulting'),
    yn(a.breachPlan, 'a-breach-plan', 'You have a data breach response plan', 'breach', 'high', 'A breach must be reported to the Board and affected people, with a detailed report within 72 hours.', 'Write a short breach plan: who decides, who reports, how to contact people.', 'Security Monitoring'),
    yn(a.requestOwner, 'a-requests', 'Someone owns privacy requests and complaints', 'rights', 'medium', 'People can ask to see, correct or erase their data.', 'Name an owner and a simple request process.', 'Security Consulting'),
    yn(a.training, 'a-training', 'Staff are trained on handling personal data', 'security', 'medium', 'Most breaches start with a human mistake.', 'Run a short yearly training and keep attendance records.', 'Security Consulting'),
    a.storage === 'unknown' ? { id: 'a-storage', title: 'You know where personal data is stored', area: 'dpdp', duty: 'purpose', severity: 'medium', status: 'fail', evidence: 'You answered: not sure.', whyItMatters: 'You cannot protect or erase data you cannot locate.', fix: 'Map where customer data lives (systems, vendors, files).', relatedService: 'Security Consulting' } as Check : null,
    a.vendors === 'yes' ? { id: 'a-vendors', title: 'Vendors who handle your data are covered by agreements', area: 'dpdp', duty: 'security', severity: 'medium', status: 'warn', evidence: 'You use outside vendors or processors. We cannot see contracts.', whyItMatters: 'You stay responsible for data your vendors handle.', fix: 'List vendors and add data protection terms to contracts.', relatedService: 'Security Consulting' } as Check : null,
  ].filter((x): x is Check => !!x);
}

const EFFORT: Record<string, 'low' | 'medium' | 'high'> = { hsts: 'low', csp: 'medium', 'sec-headers': 'low', dmarc: 'low', spf: 'low', 'privacy-policy': 'medium', grievance: 'low', 'forms-consent': 'medium', trackers: 'medium', 'consent-banner': 'medium', https: 'medium', exposed: 'low', 'cookie-flags': 'low', 'a-breach-plan': 'medium', 'a-consent-records': 'high', mx: 'medium', login: 'low', 'a-training': 'medium', 'a-requests': 'low' };

export interface Report {
  dpdp: number | null; security: number | null; headline: number; band: string;
  priorities: (Check & { effort: 'low' | 'medium' | 'high' })[]; checks: Check[];
}
export function buildReport(scan: Pick<ScanResult, 'checks'> | null, answers: Answers = {}): Report {
  const checks = [...(scan?.checks ?? []), ...answerChecks(answers)];
  const dpdp = areaScore(checks.filter((c) => c.area === 'dpdp'));
  const security = areaScore(checks.filter((c) => c.area !== 'dpdp'));
  const parts = [dpdp, security].filter((x): x is number => x !== null);
  const headline = parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : 0;
  const rank = (c: Check) => W[c.severity] * (c.status === 'fail' ? 2 : 1);
  const priorities = checks.filter((c) => c.status === 'fail' || c.status === 'warn').sort((a, b) => rank(b) - rank(a)).slice(0, 5).map((c) => ({ ...c, effort: EFFORT[c.id] ?? 'medium' }));
  return { dpdp, security, headline, band: band(headline), priorities, checks };
}

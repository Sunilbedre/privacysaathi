export type Status = 'pass' | 'warn' | 'fail' | 'unknown';
export type Severity = 'low' | 'medium' | 'high';
export type Area = 'dpdp' | 'security' | 'email';
/** The eight DPDP duties (see content/dpdp.ts). */
export type Duty = 'notice' | 'consent' | 'purpose' | 'security' | 'breach' | 'children' | 'rights' | 'logs';

export interface Check {
  id: string; title: string; area: Area; status: Status; severity: Severity;
  evidence: string; whyItMatters: string; fix: string; relatedService?: string; duty?: Duty;
}
export interface FormInfo { page: string; fields: string[]; personal: string[]; consentNearby: boolean; httpsPost: boolean; method: string }
export interface TrackerInfo { name: string; host: string; page: string }
export interface CookieInfo { name: string; secure: boolean; httpOnly: boolean; sameSite: string; lifetimeDays: number | null }
export interface ScanResult {
  domain: string; url: string; mode: 'light' | 'deep'; startedAt: string; finishedAt: string; partial: boolean;
  pagesScanned: number; checks: Check[]; forms: FormInfo[]; trackers: TrackerInfo[]; cookies: CookieInfo[];
  email: { mx: string[]; provider: string; spf: string | null; dmarc: string | null; dmarcPolicy: string | null; dkim: string[]; mtaSts: boolean; tlsRpt: boolean };
  notChecked: string[];
}

/** How sure we are. confirmed = we saw it directly; likely = inferred from page source; self = from the visitor's own answers; unseen = cannot be judged from outside. */
export type Confidence = 'confirmed' | 'likely' | 'self' | 'unseen';

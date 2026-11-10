import type { Check } from './types';
import { buildReport } from './score';

/** The six nodes of the live radar. Only titles and statuses leave the server, never evidence. */
export const NODES = [
  { id: 'notice', label: 'Notice', ids: ['privacy-policy', 'terms', 'notice-content', 'grievance'] },
  { id: 'consent', label: 'Consent', ids: ['forms-consent', 'forms-https', 'consent-banner', 'children'] },
  { id: 'trackers', label: 'Trackers', ids: ['trackers', 'trackers-before-consent', 'cookie-flags', 'third-party'] },
  { id: 'security', label: 'Security', ids: ['https', 'cert-expiry', 'tls-version', 'http-redirect', 'hsts', 'csp', 'sec-headers', 'mixed', 'info-leak', 'cms', 'login', 'exposed', 'caa'] },
  { id: 'email', label: 'Email', ids: ['mx', 'spf', 'dkim', 'dmarc', 'mta-sts'] },
] as const;

export type NodeStatus = 'pass' | 'warn' | 'fail' | 'unknown';
export interface QuickNode { id: string; label: string; status: NodeStatus; issues: number }
export interface Quick { score: number; band: string; mode: 'light' | 'deep'; pages: number; nodes: QuickNode[]; top: { title: string; status: 'warn' | 'fail' }[] }

const W = { high: 3, medium: 2, low: 1 } as const;

export function summariseQuick(checks: Check[], mode: 'light' | 'deep', pages: number): Quick {
  const nodes: QuickNode[] = NODES.map((n) => {
    const cs = checks.filter((c) => (n.ids as readonly string[]).includes(c.id));
    const fails = cs.filter((c) => c.status === 'fail').length, warns = cs.filter((c) => c.status === 'warn').length;
    const status: NodeStatus = fails ? 'fail' : warns ? 'warn' : cs.some((c) => c.status === 'pass') ? 'pass' : 'unknown';
    return { id: n.id, label: n.label, status, issues: fails + warns };
  });
  // Processes cannot be seen from outside: it is answered in the full report.
  nodes.push({ id: 'processes', label: 'Processes', status: 'unknown', issues: 0 });
  const rep = buildReport({ checks });
  const top = checks.filter((c) => c.status === 'fail' || c.status === 'warn')
    .sort((a, b) => W[b.severity] * (b.status === 'fail' ? 2 : 1) - W[a.severity] * (a.status === 'fail' ? 2 : 1))
    .slice(0, 3).map((c) => ({ title: c.title, status: c.status as 'warn' | 'fail' }));
  return { score: rep.headline, band: rep.band, mode, pages, nodes, top };
}

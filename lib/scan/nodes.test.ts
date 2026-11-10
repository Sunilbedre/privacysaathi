// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { summariseQuick } from './nodes';
import type { Check } from './types';

const c = (id: string, status: Check['status'], severity: Check['severity'] = 'medium'): Check => ({ id, title: `T ${id}`, area: 'security', status, severity, evidence: 'SECRET EVIDENCE', whyItMatters: 'w', fix: 'f' });

describe('summariseQuick', () => {
  it('rolls checks up to node status: fail beats warn beats pass', () => {
    const q = summariseQuick([c('hsts', 'warn'), c('csp', 'fail'), c('spf', 'pass'), c('dmarc', 'pass'), c('privacy-policy', 'warn')], 'light', 1);
    const by = Object.fromEntries(q.nodes.map((n) => [n.id, n]));
    expect(by.security.status).toBe('fail'); expect(by.security.issues).toBe(2);
    expect(by.email.status).toBe('pass'); expect(by.notice.status).toBe('warn');
    expect(by.trackers.status).toBe('unknown');
  });
  it('always adds an unknown processes node and ranks the top three worst first', () => {
    const q = summariseQuick([c('hsts', 'warn', 'low'), c('dmarc', 'fail', 'high'), c('csp', 'warn', 'high'), c('spf', 'fail', 'medium'), c('mx', 'warn', 'low')], 'light', 1);
    expect(q.nodes.at(-1)).toMatchObject({ id: 'processes', status: 'unknown' });
    expect(q.top).toHaveLength(3); expect(q.top[0].title).toBe('T dmarc');
  });
  it('never leaks evidence text', () => {
    expect(JSON.stringify(summariseQuick([c('hsts', 'fail')], 'light', 1))).not.toContain('SECRET');
  });
});

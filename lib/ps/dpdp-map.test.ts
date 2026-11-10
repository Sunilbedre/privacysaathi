// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { DUTIES, assessDuties, crore, exposureOf, summariseDpdp } from './dpdp-map';
import type { Check } from '@/lib/scan/types';

const c = (id: string, status: Check['status'], extra: Partial<Check> = {}): Check => ({ id, title: `T ${id}`, area: 'dpdp', status, severity: 'medium', evidence: 'SECRET', whyItMatters: 'w', fix: 'f', ...extra });

describe('DPDP duty map', () => {
  it('has all eight duties with the three published penalty tiers', () => {
    expect(DUTIES.map((d) => d.id).sort()).toEqual(['breach', 'children', 'consent', 'logs', 'notice', 'purpose', 'rights', 'security']);
    expect(Object.fromEntries(DUTIES.map((d) => [d.id, d.fineCr]))).toMatchObject({ security: 250, breach: 200, children: 200 });
  });
  it('maps technical security and email checks to the security safeguards duty', () => {
    const rows = assessDuties([c('hsts', 'warn', { area: 'security' }), c('dmarc', 'fail', { area: 'email' }), c('privacy-policy', 'pass', { duty: 'notice' })]);
    const by = Object.fromEntries(rows.map((r) => [r.id, r]));
    expect(by.security.status).toBe('gap'); expect(by.security.issues).toBe(2);
    expect(by.notice.status).toBe('ok'); expect(by.logs.status).toBe('unknown');
  });
  it('exposure is the highest tier among gaps, falling back to reviews, then none', () => {
    const gap = exposureOf(assessDuties([c('a', 'fail', { duty: 'notice' }), c('b', 'fail', { duty: 'security' })]));
    expect(gap).toMatchObject({ level: 'gap', maxCr: 250, dutyLabel: 'Reasonable security safeguards', gaps: 2 });
    expect(exposureOf(assessDuties([c('a', 'warn', { duty: 'breach' })]))).toMatchObject({ level: 'review', maxCr: 200 });
    expect(exposureOf(assessDuties([c('a', 'pass', { duty: 'notice' })])).level).toBe('none');
  });
  it('summary never carries evidence, and formats crore', () => {
    const s = summariseDpdp([c('a', 'fail', { duty: 'consent' })], { score: 40, band: 'Some foundations', mode: 'light', pages: 1 });
    expect(JSON.stringify(s)).not.toContain('SECRET'); expect(s.counts.gap).toBe(1); expect(crore(250)).toBe('₹250 crore');
  });
});

import { firstSentence } from './dpdp-map';
describe('solution content', () => {
  it('every duty has generic steps and the first-sentence helper trims long text', () => {
    expect(DUTIES.every((d) => d.steps.length === 3)).toBe(true);
    expect(firstSentence('People must be told. It is the first thing a regulator checks.')).toBe('People must be told.');
    expect(firstSentence('No full stop here')).toBe('No full stop here');
  });
});

// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { areaScore, band, buildReport, answerChecks } from './score';
import type { Check } from './types';

const c = (status: Check['status'], severity: Check['severity'] = 'medium', area: Check['area'] = 'dpdp'): Check => ({ id: Math.random().toString(), title: 't', area, status, severity, evidence: '', whyItMatters: '', fix: '' });

describe('scoring', () => {
  it('all pass is 100, all fail is 0, warn is half', () => {
    expect(areaScore([c('pass'), c('pass', 'high')])).toBe(100);
    expect(areaScore([c('fail'), c('fail', 'low')])).toBe(0);
    expect(areaScore([c('warn')])).toBe(50);
  });
  it('ignores unknown checks and returns null when nothing is scorable', () => {
    expect(areaScore([c('unknown')])).toBeNull();
    expect(areaScore([c('pass'), c('unknown', 'high')])).toBe(100);
  });
  it('weights by severity', () => { expect(areaScore([c('pass', 'high'), c('fail', 'low')])).toBe(75); });
  it('bands', () => { expect([20, 40, 70, 90].map(band)).toEqual(['Just starting', 'Some foundations', 'Well on your way', 'Strong position']); });
  it('builds a report with top 5 priorities, worst first', () => {
    const checks = [c('fail', 'high'), c('warn', 'low'), c('fail', 'low'), c('fail', 'medium'), c('warn', 'high'), c('warn', 'medium'), c('pass')];
    const r = buildReport({ checks });
    expect(r.priorities).toHaveLength(5);
    expect(r.priorities[0].status).toBe('fail');
    expect(r.priorities[0].severity).toBe('high');
  });
  it('questionnaire answers feed the DPDP score (no website path)', () => {
    const r = buildReport(null, { breachPlan: 'no', consentRecords: 'no', requestOwner: 'yes', training: 'partly' });
    expect(r.security).toBeNull();
    expect(r.dpdp).toBeLessThan(50);
    expect(answerChecks({ storage: 'unknown' })[0].status).toBe('fail');
  });
});

import { confidenceOf } from './score';
describe('confidenceOf', () => {
  it('labels how sure we are', () => {
    expect(confidenceOf({ id: 'hsts', status: 'fail' })).toBe('confirmed');
    expect(confidenceOf({ id: 'consent-banner', status: 'fail' })).toBe('likely');
    expect(confidenceOf({ id: 'consent-banner', status: 'pass' })).toBe('confirmed');
    expect(confidenceOf({ id: 'a-breach-plan', status: 'fail' })).toBe('self');
    expect(confidenceOf({ id: 'dmarc', status: 'unknown' })).toBe('unseen');
  });
});

import { extractScripts } from './html';
describe('gated scripts', () => {
  it('marks consent-held scripts', () => {
    const r = extractScripts('<script type="text/plain" data-cookieconsent="marketing" src="https://www.googletagmanager.com/gtm.js"></script><script src="/a.js"></script>', 'https://x.com');
    expect(r.map((x) => x.gated)).toEqual([true, false]);
  });
});

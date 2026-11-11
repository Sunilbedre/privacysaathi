import { describe, expect, it } from 'vitest';
import { CHECK_STEPS, DATA, FIRST, LEARN, NOTE, days, learnAnswer } from './botFlow';

describe('DPDP chat script', () => {
  it('answers every learn topic with plain lines', () => {
    for (const [k] of LEARN) { const a = learnAnswer(k); expect(a.length).toBeGreaterThan(0); expect(a.every((l) => l.length > 10)).toBe(true); }
  });
  it('lists the three penalty tiers when asked about fines', () => {
    const a = learnAnswer('fines').join(' ');
    expect(a).toContain('250 crore'); expect(a).toContain('200 crore'); expect(a).toContain('150 crore');
  });
  it('asks the seven process questions and collects contact details last', () => {
    for (const k of ['hasPolicy', 'consentRecords', 'breachPlan', 'requestOwner', 'training', 'vendors']) expect(CHECK_STEPS).toContain(k);
    expect(CHECK_STEPS.indexOf('name')).toBeGreaterThan(CHECK_STEPS.indexOf('vendors'));
    expect(CHECK_STEPS[CHECK_STEPS.length - 1]).toBe('consent');
  });
  it('has teaching notes only for known answers and uses real data choices', () => {
    expect(NOTE.breachPlan.no).toMatch(/72 hours/);
    expect(DATA.map(([k]) => k)).toContain('children');
    expect(NOTE.data.children).toMatch(/Section 9/);
  });
  it('counts days and takes a first name', () => { expect(days()).toBeGreaterThanOrEqual(0); expect(FIRST('  Asha  Rao ')).toBe('Asha'); expect(FIRST('')).toBe('there'); });
});

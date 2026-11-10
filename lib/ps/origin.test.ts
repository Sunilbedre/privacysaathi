import { describe, expect, it } from 'vitest';
import { originFromTags, sourceLabel } from './origin';

describe('visitor origin', () => {
  it('reads the browser tags into an origin', () => {
    const o = originFromTags({ landing_url: 'https://privacysaathi.in/dpdp?utm_source=google', ref: 'https://www.google.com/', form_page: '/dpdp', device: 'Phone', utm_source: 'google', utm_medium: 'cpc', gclid: 'abc', landing_host: 'privacysaathi.in' });
    expect(o.landingUrl).toContain('/dpdp'); expect(o.device).toBe('Phone'); expect(o.gclid).toBe('abc');
  });
  it('labels the source in plain words', () => {
    expect(sourceLabel(originFromTags({ gclid: 'x', utm_source: 'google', utm_medium: 'cpc' }))).toBe('Google Ads');
    expect(sourceLabel(originFromTags({ fbclid: 'x' }))).toBe('Meta Ads');
    expect(sourceLabel(originFromTags({ ref: 'https://www.google.com/search?q=dpdp', landing_host: 'privacysaathi.in' }))).toBe('Google (search)');
    expect(sourceLabel(originFromTags({ ref: 'https://www.linkedin.com/feed', landing_host: 'privacysaathi.in' }))).toBe('LinkedIn');
    expect(sourceLabel(originFromTags({ ref: '', landing_host: 'privacysaathi.in', device: 'Desktop' }))).toBe('Direct');
    expect(sourceLabel(originFromTags({ ref: 'https://privacysaathi.in/dpdp', landing_host: 'privacysaathi.in', device: 'Desktop' }))).toBe('Direct');
    expect(sourceLabel(undefined, 'dpdp_check')).toBe('dpdp_check');
  });
});

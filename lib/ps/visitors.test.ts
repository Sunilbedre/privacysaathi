// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { buildStats } from './visitors';

const now = new Date('2026-11-13T08:00:00.000Z'); // 13 Nov, 1:30 pm IST
const ev = (ts: string, o: Record<string, unknown> = {}) => ({ ts, event: 'visit', path: '/dpdp', vh: 'a', tags: {}, ...o });

describe('visitor numbers', () => {
  it('counts distinct visitors and every page view per day', () => {
    const s = buildStats([ev('2026-11-13T05:00:00Z', { vh: 'a' }), ev('2026-11-13T05:05:00Z', { vh: 'a', path: '/scan' }), ev('2026-11-13T06:00:00Z', { vh: 'b' }), ev('2026-11-12T06:00:00Z', { vh: 'a' })], [], 7, now);
    expect(s.today).toMatchObject({ visitors: 2, views: 3 });
    expect(s.yesterdayVisitors).toBe(1);
    expect(s.range.visitors).toBe(3);
  });
  it('uses India time for the day boundary', () => {
    const s = buildStats([ev('2026-11-12T19:00:00Z', { vh: 'x' })], [], 3, now); // 13 Nov 12:30 am IST
    expect(s.today.visitors).toBe(1); expect(s.yesterdayVisitors).toBe(0);
  });
  it('ignores events outside the range and other event types as page views', () => {
    const s = buildStats([ev('2026-09-01T05:00:00Z'), { ts: '2026-11-13T05:00:00Z', event: 'scan_started', vh: 'a' }], [], 7, now);
    expect(s.range.views).toBe(0); expect(s.range.scans).toBe(1);
  });
  it('treats old events without a visitor hash as page views only', () => {
    const s = buildStats([ev('2026-11-13T05:00:00Z', { vh: undefined })], [], 7, now);
    expect(s.today).toMatchObject({ visitors: 0, views: 1 }); expect(s.hasUnique).toBe(false);
  });
  it('works out sources, devices, top pages and conversion', () => {
    const s = buildStats([
      ev('2026-11-13T05:00:00Z', { vh: 'a', tags: { gclid: 'x', utm_source: 'google', utm_medium: 'cpc', device: 'Phone' } }),
      ev('2026-11-13T05:10:00Z', { vh: 'b', tags: { ref: 'https://www.linkedin.com/feed', landing_host: 'privacysaathi.in', device: 'Desktop' }, path: '/ps/scan' }),
    ], ['2026-11-13T07:00:00Z'], 7, now);
    expect(s.sources.map((x) => x.label).sort()).toEqual(['Google Ads', 'LinkedIn']);
    expect(s.devices.map((x) => x.label).sort()).toEqual(['Desktop', 'Phone']);
    expect(s.pages.map((p) => p.path).sort()).toEqual(['/dpdp', '/scan']);
    expect(s.range.conversion).toBe(50); expect(s.today.leads).toBe(1);
  });
});

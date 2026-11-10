// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { inWindow, summarise, toCsv, type LeadRow } from './daily';

const lead = (o: Partial<LeadRow> = {}): LeadRow => ({ receivedAt: '2026-11-08T10:00:00Z', name: 'A', email: 'a@acme.in', phone: '1', domain: 'acme.in', industry: 'retail', size: '1-10', score: 50, scoreBand: 'Some foundations', no_official_email: false, email_domain_matches_website: true, no_website: false, utm_source: 'google', utm_medium: '', utm_campaign: 'dpdp', utm_term: 'dpdp audit', gclid: 'x', landing_host: 'privacysaathi.in', referrer: '', ...o });

describe('daily report', () => {
  it('counts leads, gclid, no_official_email and funnel events', () => {
    const s = summarise([lead(), lead({ gclid: '', no_official_email: true, landing_host: 'privacysathi.in' }), lead({ email_domain_matches_website: false })], [{ ts: '', event: 'visit' }, { ts: '', event: 'visit' }, { ts: '', event: 'generate_lead' }]);
    expect(s.total).toBe(3); expect(s.withGclid).toBe(2); expect(s.noOfficialEmail).toBe(1); expect(s.domainMismatch).toBe(1);
    expect(s.funnel.visit).toBe(2); expect(s.funnel.booking_clicked).toBe(0);
    expect(s.byHost[0]).toEqual(['privacysaathi.in', 2]);
  });
  it('filters by time window', () => {
    const rows = [lead({ receivedAt: '2026-11-08T10:00:00Z' }), lead({ receivedAt: '2026-11-01T10:00:00Z' })];
    expect(inWindow(rows, (r) => r.receivedAt, Date.parse('2026-11-07T00:00:00Z'), Date.parse('2026-11-09T00:00:00Z'))).toHaveLength(1);
  });
  it('CSV escapes commas and quotes and blocks spreadsheet formulas', () => {
    const csv = toCsv([lead({ name: '=HYPERLINK("http://evil")', company: 'Acme, Inc' })]);
    expect(csv).toContain("\"'=HYPERLINK(");
    expect(csv).toContain('"Acme, Inc"');
    expect(csv.split('\n')[0]).toContain('gclid');
  });
});

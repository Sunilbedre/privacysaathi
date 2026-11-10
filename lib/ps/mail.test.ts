// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { esc, priorityOf, renderFollowup, renderOwner, renderVisitor, unsubToken, verifyUnsub, webhookText, type MailCtx, type OwnerLead } from './mail';

const ctx: MailCtx = { first: 'Asha', who: 'acme.in', score: 23, band: 'Just starting', exposureCr: 200, exposureLevel: 'gap', exposureDuty: 'Breach response', gaps: 3, top: [{ title: 'HSTS header', fix: 'Send HSTS.' }, { title: 'Privacy notice', fix: 'Publish one.' }], reportUrl: 'https://privacysaathi.in/report/abc', bookingUrl: 'https://bedreweb.com/contact', unsubUrl: 'https://privacysaathi.in/api/ps/unsubscribe?e=a', retentionDays: 90 };
const lead: OwnerLead = { name: 'Asha', email: 'asha@acme.in', phone: '+91 98765 43210', company: 'Acme', website: 'https://acme.in', domain: 'acme.in', industry: 'retail', size: '11-50', source: 'popup', utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'dpdp', utm_term: '', gclid: 'g', landing_host: 'privacysaathi.in', receivedAt: new Date().toISOString(), no_official_email: false, email_domain_matches_website: true, no_website: false, priority: 'hot' };

describe('lead priority', () => {
  it('is hot for a low score or a gap in a ₹200 crore or higher tier, warm otherwise', () => {
    expect(priorityOf(30, { level: 'none', maxCr: 0 })).toBe('hot');
    expect(priorityOf(70, { level: 'gap', maxCr: 250 })).toBe('hot');
    expect(priorityOf(70, { level: 'gap', maxCr: 50 })).toBe('warm');
    expect(priorityOf(70, { level: 'review', maxCr: 250 })).toBe('warm');
  });
});
describe('unsubscribe token', () => {
  it('verifies for the right email only, case-insensitively', () => {
    const t = unsubToken('Asha@Acme.in');
    expect(verifyUnsub('asha@acme.in', t)).toBe(true); expect(verifyUnsub('other@acme.in', t)).toBe(false); expect(verifyUnsub('asha@acme.in', 'x'.repeat(32))).toBe(false);
  });
});
describe('email content', () => {
  it('escapes visitor-supplied text so names cannot inject HTML', () => {
    expect(esc('<img src=x onerror=1>"&')).toBe('&lt;img src=x onerror=1&gt;&quot;&amp;');
    const o = renderOwner({ ...lead, name: '<script>alert(1)</script>', company: 'A&B <b>' }, ctx);
    expect(o.html).not.toContain('<script>'); expect(o.html).toContain('A&amp;B &lt;b&gt;');
    const v = renderVisitor({ ...ctx, first: '<b>x</b>' }); expect(v.html).not.toContain('<b>x</b>');
  });
  it('visitor email carries score, fine tier, report link, booking link, disclaimer and unsubscribe', () => {
    const v = renderVisitor(ctx);
    expect(v.subject).toContain('23/100'); expect(v.text).toContain('up to ₹200 crore'); expect(v.text).toContain(ctx.reportUrl); expect(v.text).toContain(ctx.bookingUrl); expect(v.text).toContain('not legal advice'); expect(v.html).toContain('Unsubscribe');
    expect(v.text).not.toMatch(/within one working day/i);
  });
  it('owner alert is tagged by priority and warns about free email and mismatched domains', () => {
    const o = renderOwner({ ...lead, no_official_email: true, email_domain_matches_website: false }, ctx);
    expect(o.subject).toMatch(/^\[HOT\] DPDP lead: Acme/); expect(o.text).toContain('Free or personal email'); expect(o.text).toContain('Email domain differs');
    expect(renderOwner({ ...lead, priority: 'warm' }, ctx).subject).toMatch(/^\[NEW\]/);
  });
  it('follow-ups differ by step and webhook text is compact', () => {
    expect(renderFollowup(1, ctx).subject).toContain('three DPDP fixes'); expect(renderFollowup(2, ctx).text).toContain('last reminder');
    expect(webhookText(lead, ctx)).toContain('*Acme*');
  });
});

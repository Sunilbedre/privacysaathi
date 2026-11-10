// @vitest-environment node
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
let POST: (r: Request) => Promise<Response>;
let dir: string;
const lines = (f: string) => (existsSync(path.join(dir, f)) ? readFileSync(path.join(dir, f), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
const body = (o: object) => new Request('http://x/api/ps/lead', { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '1.2.3.' + Math.floor(Math.random() * 250) }, body: JSON.stringify({ phone: '+91 98765 43210', noWebsite: true, company: 'Acme Traders', industry: 'retail', consent: true, answers: { hasPolicy: 'no', breachPlan: 'no', consentRecords: 'no' }, tags: { landing_host: 'privacysaathi.in', lead_source: 'popup', utm_source: 'google' }, ...o }) });

beforeAll(async () => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'ps-'));
  Object.assign(process.env, { PS_DATA_DIR: dir, LEADS_DIR: mkdtempSync(path.join(os.tmpdir(), 'bedre-')), PS_MAIL_OUTBOX: '1', LEAD_TO_EMAIL: 'owner@bedre.test, sales@bedre.test', PS_SECRET: 'test-secret-for-tokens-12345' });
  delete process.env.RESEND_API_KEY; delete process.env.PS_NOTIFY_WEBHOOK;
  POST = (await import('./route')).POST;
});

describe('lead route sends the right emails', () => {
  it('a work-email lead gets a visitor report email and the owners get a HOT alert; the lead is stored with priority', async () => {
    const r = await POST(body({ name: 'Asha Rao', email: 'asha@acmetraders.in' })); const j = await r.json();
    expect(r.status).toBe(200); expect(j.emailed).toBe(true); expect(j.gated).toBe(false);
    const out = lines('outbox.jsonl');
    const visitor = out.find((m) => m.kind === 'visitor'), owner = out.find((m) => m.kind === 'owner');
    expect(visitor.to).toEqual(['asha@acmetraders.in']); expect(visitor.subject).toContain('Acme Traders'); expect(visitor.text).toContain('/report/'); expect(visitor.html).toContain('Unsubscribe');
    expect(owner.to).toEqual(['owner@bedre.test', 'sales@bedre.test']); expect(owner.subject).toMatch(/^\[HOT\]/); expect(owner.replyTo).toBe('asha@acmetraders.in');
    const lead = lines('leads.jsonl')[0]; expect(lead).toMatchObject({ priority: 'hot', lead_source: 'popup', company: 'Acme Traders' }); expect(lead.exposureCr).toBeGreaterThan(0);
  });
  it('a free-email lead is stored and alerts the owners (with a call-first warning) but gets NO report email', async () => {
    const before = lines('outbox.jsonl').length;
    const r = await POST(body({ name: 'Free Mail', email: 'someone@gmail.com' })); const j = await r.json();
    expect(j.emailed).toBe(false); expect(j.gated).toBe(true);
    const added = lines('outbox.jsonl').slice(before);
    expect(added.some((m) => m.kind === 'visitor')).toBe(false); expect(added.find((m) => m.kind === 'owner').text).toContain('Free or personal email');
  });
  it('visitor-supplied names are escaped in the owner HTML', async () => {
    await POST(body({ name: '<img src=x onerror=alert(1)>', email: 'x@evilcorp.in' }));
    const owner = lines('outbox.jsonl').filter((m) => m.kind === 'owner').at(-1);
    expect(owner.html).not.toContain('<img src=x'); expect(owner.html).toContain('&lt;img');
  });
});

// @vitest-environment node
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
let POST: (r: Request) => Promise<Response>, dir: string, store: typeof import('@/lib/ps/store'), crm: typeof import('@/lib/ps/crm');
const body = (o: object) => new Request('http://x/api/ps/enquiry', { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '9.9.9.' + Math.floor(Math.random() * 250) }, body: JSON.stringify({ name: 'Asha Rao', phone: '9876543210', email: 'asha@acme.in', consent: true, duty: 'security', ...o }) });
const outbox = () => (existsSync(path.join(dir, 'outbox.jsonl')) ? readFileSync(path.join(dir, 'outbox.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);

beforeAll(async () => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'ps-'));
  Object.assign(process.env, { PS_DATA_DIR: dir, PS_MAIL_OUTBOX: '1', LEAD_TO_EMAIL: 'owner@bedre.test', PS_SECRET: 'test-secret' });
  store = await import('@/lib/ps/store'); crm = await import('@/lib/ps/crm'); POST = (await import('./route')).POST;
});
const rec = (id: string, extra = {}) => ({ id, domain: 'acme.in', url: 'https://acme.in', deep: false, status: 'done' as const, step: 'Done', pct: 100, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString(), ipHash: 'x', company: 'Acme',
  result: { domain: 'acme.in', url: 'https://acme.in', mode: 'light' as const, startedAt: '', finishedAt: '', partial: false, pagesScanned: 1, forms: [], trackers: [], cookies: [], email: { mx: [], provider: '', spf: null, dmarc: null, dmarcPolicy: null, dkim: [], mtaSts: false, tlsRpt: false }, notChecked: [],
    checks: [{ id: 'hsts', title: 'HSTS header', area: 'security' as const, status: 'fail' as const, severity: 'high' as const, evidence: 'e', whyItMatters: 'w', fix: 'f' }] }, ...extra });

describe('solution enquiry (type 2)', () => {
  it('is refused before the scan lead exists', async () => {
    const id = 'E'.repeat(32); await store.putScan(rec(id));
    expect((await POST(body({ scanId: id }))).status).toBe(403);
  });
  it('creates a separate solution enquiry, alerts the owner and confirms to the visitor', async () => {
    const id = 'F'.repeat(32); await store.putScan(rec(id, { leadCaptured: true }));
    const r = await POST(body({ scanId: id, message: 'We use Shopify' })); const j = await r.json();
    expect(r.status).toBe(200); expect(j.ok).toBe(true);
    const e = (await crm.listEnquiries()).find((x) => x.id === j.id)!;
    expect(e).toMatchObject({ type: 'solution', status: 'new', company: 'Acme', priority: 'hot' }); expect(e.topic).toMatch(/security/i); expect(e.message).toContain('Shopify'); expect(e.message).toContain('HSTS header');
    const out = outbox(); expect(out.find((m) => m.kind === 'owner').subject).toContain('SOLUTION enquiry'); expect(out.find((m) => m.kind === 'visitor').to).toEqual(['asha@acme.in']);
  });
  it('needs consent and a valid phone', async () => {
    const id = 'G'.repeat(32); await store.putScan(rec(id, { leadCaptured: true }));
    expect((await POST(body({ scanId: id, consent: false }))).status).toBe(400);
    expect((await POST(body({ scanId: id, phone: '123' }))).status).toBe(400);
  });
  it('CRM status and notes update', async () => {
    const [e] = await crm.listEnquiries();
    const u = await crm.patchEnquiry(e.id, { status: 'contacted', note: 'Called' });
    expect(u?.status).toBe('contacted'); expect(u?.notes[0].text).toBe('Called');
  });
});

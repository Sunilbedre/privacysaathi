// @vitest-environment node
import { mkdtempSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
let GET: (r: Request, c: { params: Promise<{ id: string }> }) => Promise<Response>;
let store: typeof import('@/lib/ps/store');
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const req = (id: string, qs: string) => new Request(`http://x/api/ps/scan/${id}${qs}`);

beforeAll(async () => {
  process.env.PS_DATA_DIR = mkdtempSync(path.join(os.tmpdir(), 'ps-'));
  store = await import('@/lib/ps/store');
  GET = (await import('./route')).GET;
});

const rec = (id: string, extra = {}) => ({ id, domain: 'acme.in', url: 'https://acme.in', deep: false, status: 'done' as const, step: 'Done', pct: 100, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString(), ipHash: 'h',
  result: { domain: 'acme.in', url: 'https://acme.in', mode: 'light' as const, startedAt: '', finishedAt: '', partial: false, pagesScanned: 1, forms: [], trackers: [], cookies: [], email: { mx: [], provider: '', spf: null, dmarc: null, dmarcPolicy: null, dkim: [], mtaSts: false, tlsRpt: false }, notChecked: [],
    checks: [{ id: 'hsts', title: 'HSTS header', area: 'security' as const, status: 'fail' as const, severity: 'high' as const, evidence: 'SECRET EVIDENCE', whyItMatters: 'because', fix: 'do this' }] }, ...extra });

describe('DPDP summary and detail gating', () => {
  it('summary carries duties and fines but never evidence or fixes', async () => {
    const id = 'A'.repeat(32); await store.putScan(rec(id, { leadCaptured: true }));
    const j = await (await GET(req(id, '?d=1'), ctx(id))).json();
    expect(j.dpdp.exposure).toMatchObject({ level: 'gap', maxCr: 250 });
    expect(JSON.stringify(j)).not.toContain('SECRET'); expect(JSON.stringify(j)).not.toContain('do this');
  });
  it('no result at all (not even the summary) is returned before a lead exists', async () => {
    const id = 'C'.repeat(32); await store.putScan(rec(id));
    const j = await (await GET(req(id, '?d=1'), ctx(id))).json();
    expect(j.locked).toBe(true); expect(j.dpdp).toBeUndefined(); expect(JSON.stringify(j)).not.toContain('SECRET');
  });
  it('full detail is refused until a lead is captured, then returned', async () => {
    const id = 'B'.repeat(32); await store.putScan(rec(id));
    expect((await GET(req(id, '?full=1'), ctx(id))).status).toBe(403);
    await store.updateScan(id, { leadCaptured: true });
    const r = await GET(req(id, '?full=1'), ctx(id)); const j = await r.json();
    expect(r.status).toBe(200); expect(j.details[0]).toMatchObject({ title: 'HSTS header', fix: 'do this' });
  });
});

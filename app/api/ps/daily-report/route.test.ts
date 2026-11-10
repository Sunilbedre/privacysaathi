// @vitest-environment node
import { mkdtempSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const SECRET = 'test-secret-1234567890';
let GET: (r: Request) => Promise<Response>;
const req = (qs = '', auth?: string) => new Request(`http://x/api/ps/daily-report${qs}`, { headers: auth ? { authorization: auth } : {} });

beforeAll(async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'ps-'));
  process.env.PS_DATA_DIR = dir; process.env.PS_CRON_SECRET = SECRET;
  const now = new Date().toISOString();
  writeFileSync(path.join(dir, 'leads.jsonl'), JSON.stringify({ receivedAt: now, name: 'T', email: 't@acme.in', phone: '1', domain: 'acme.in', industry: 'retail', size: '1-10', score: 40, scoreBand: 'Some foundations', no_official_email: false, email_domain_matches_website: true, no_website: false, utm_source: 'google', utm_medium: '', utm_campaign: 'c', utm_term: 'k', gclid: 'g', landing_host: 'privacysaathi.in', referrer: '' }) + '\n');
  writeFileSync(path.join(dir, 'events.jsonl'), JSON.stringify({ ts: now, event: 'visit' }) + '\n');
  GET = (await import('./route')).GET;
});

describe('daily report route', () => {
  it('rejects a missing or wrong secret', async () => {
    expect((await GET(req())).status).toBe(401);
    expect((await GET(req('', 'Bearer nope'))).status).toBe(401);
  });
  it('is disabled when no strong secret is configured', async () => {
    const keep = process.env.PS_CRON_SECRET; process.env.PS_CRON_SECRET = 'short';
    expect((await GET(req('', 'Bearer short'))).status).toBe(503);
    process.env.PS_CRON_SECRET = keep;
  });
  it('returns the summary on a dry run without emailing', async () => {
    const r = await GET(req('?dry=1', `Bearer ${SECRET}`)); const j = await r.json();
    expect(r.status).toBe(200); expect(j.summary.total).toBe(1); expect(j.summary.withGclid).toBe(1); expect(j.csvRows).toBe(1);
  });
  it('reports clearly when email is not configured', async () => {
    delete process.env.RESEND_API_KEY;
    expect((await GET(req('', `Bearer ${SECRET}`))).status).toBe(503);
  });
});

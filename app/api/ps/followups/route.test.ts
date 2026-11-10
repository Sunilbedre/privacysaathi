// @vitest-environment node
import { mkdirSync, mkdtempSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const SECRET = 'cron-secret-1234567890';
let run: (r: Request) => Promise<Response>, unsub: (r: Request) => Promise<Response>, dir: string;
const lines = (f: string) => (existsSync(path.join(dir, f)) ? readFileSync(path.join(dir, f), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
const ago = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
const lead = (email: string, h: number, extra = {}) => ({ receivedAt: ago(h), email, name: 'Asha Rao', company: 'Acme', domain: 'acme.in', scanId: 'S'.repeat(32), no_official_email: false, ...extra });
const call = (qs = '', auth = `Bearer ${SECRET}`) => run(new Request(`http://x/api/ps/followups${qs}`, { headers: { authorization: auth } }));

beforeAll(async () => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'ps-')); mkdirSync(path.join(dir, 'x'), { recursive: true });
  Object.assign(process.env, { PS_DATA_DIR: dir, PS_CRON_SECRET: SECRET, PS_MAIL_OUTBOX: '1', PS_SECRET: 'test-secret-for-tokens-12345' }); delete process.env.RESEND_API_KEY;
  writeFileSync(path.join(dir, 'leads.jsonl'), [
    lead('a@one.in', 30), lead('b@two.in', 80), lead('c@three.in', 2), lead('d@four.in', 30, { no_official_email: true }), lead('e@five.in', 30 * 24), lead('f@six.in', 30),
  ].map((l) => JSON.stringify(l)).join('\n') + '\n');
  run = (await import('./route')).GET; unsub = (await import('../unsubscribe/route')).GET;
});

describe('follow-up automation', () => {
  it('rejects a missing or wrong secret', async () => { expect((await call('', '')).status).toBe(401); expect((await call('', 'Bearer nope')).status).toBe(401); });
  it('dry run lists who is due without sending, masked', async () => {
    const j = await (await call('?dry=1')).json();
    expect(j.due).toEqual(expect.arrayContaining([{ step: 1, email: 'a***@one.in' }, { step: 2, email: 'b***@two.in' }, { step: 1, email: 'f***@six.in' }]));
    expect(j.due).toHaveLength(3); // c is too new, d is a free address, e is older than 14 days
    expect(lines('outbox.jsonl')).toHaveLength(0);
  });
  it('sends step 1 at 24h and step 2 at 72h, then never again (idempotent)', async () => {
    const j = await (await call()).json(); expect(j.sent).toBe(3);
    const out = lines('outbox.jsonl'); expect(out.map((m) => m.kind)).toEqual(['followup', 'followup', 'followup']);
    expect(out.find((m) => m.to[0] === 'b@two.in').subject).toMatch(/Want a hand/); expect(out.find((m) => m.to[0] === 'a@one.in').subject).toMatch(/three DPDP fixes/);
    expect(out[0].headers['List-Unsubscribe']).toContain('/api/ps/unsubscribe');
    expect((await (await call()).json()).sent).toBe(0);
  });
  it('unsubscribe needs a valid token, then suppresses future follow-ups', async () => {
    const { unsubToken } = await import('@/lib/ps/mail');
    expect((await unsub(new Request('http://x/api/ps/unsubscribe?e=g@seven.in&t=bad'))).status).toBe(400);
    writeFileSync(path.join(dir, 'leads.jsonl'), JSON.stringify(lead('g@seven.in', 30)) + '\n', { flag: 'a' });
    expect((await unsub(new Request(`http://x/api/ps/unsubscribe?e=g@seven.in&t=${unsubToken('g@seven.in')}`))).status).toBe(200);
    expect(JSON.stringify(lines('suppress.jsonl'))).not.toContain('seven');           // stored hashed, no address
    const before = lines('outbox.jsonl').length; await call();
    expect(lines('outbox.jsonl').slice(before).some((m) => m.to[0] === 'g@seven.in')).toBe(false);
  });
});

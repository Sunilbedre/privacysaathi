// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { createEnquiry, deleteEnquiry, getEnquiry, listEnquiries, patchEnquiry, updateEnquiryFields } from './crm';

let dir = '';
beforeAll(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ps-crm-')); process.env.PS_DATA_DIR = dir; });
afterAll(() => { fs.rmSync(dir, { recursive: true, force: true }); delete process.env.PS_DATA_DIR; });

const base = { type: 'scan' as const, name: 'Asha Rao', phone: '9876543210', email: 'asha@x.in', company: '', website: '', scanId: '', score: null, band: '', priority: 'warm' as const, exposureCr: 0, gaps: 0, topic: '', message: '', preferredTime: '', source: 'Manual: Phone call', utm: '' };

describe('CRM add, edit, delete', () => {
  it('adds a lead and lists it', async () => {
    const e = await createEnquiry(base);
    expect((await listEnquiries()).map((x) => x.id)).toContain(e.id);
    expect(e.status).toBe('new');
  });
  it('edits only the allowed fields and trims them', async () => {
    const e = await createEnquiry(base);
    const u = await updateEnquiryFields(e.id, { name: '  Asha K Rao  ', email: 'ASHA@X.IN', priority: 'hot', status: 'qualified', type: 'solution', topic: 'Breach plan' });
    expect(u).toMatchObject({ name: 'Asha K Rao', email: 'asha@x.in', priority: 'hot', status: 'qualified', type: 'solution', topic: 'Breach plan' });
    expect(u?.id).toBe(e.id); expect(u?.createdAt).toBe(e.createdAt);
  });
  it('ignores a made-up stage or priority', async () => {
    const e = await createEnquiry(base);
    const u = await updateEnquiryFields(e.id, { status: 'nonsense' as never, priority: 'urgent' as never });
    expect(u?.status).toBe('new'); expect(u?.priority).toBe('warm');
  });
  it('keeps notes when fields change', async () => {
    const e = await createEnquiry(base); await patchEnquiry(e.id, { note: 'Called once' });
    expect((await updateEnquiryFields(e.id, { name: 'New Name' }))?.notes).toHaveLength(1);
  });
  it('deletes a lead for good, and refuses bad ids', async () => {
    const e = await createEnquiry(base);
    expect(await deleteEnquiry(e.id)).toBe(true);
    expect(await getEnquiry(e.id)).toBeNull();
    expect(await deleteEnquiry(e.id)).toBe(false);
    expect(await deleteEnquiry('../../etc/passwd')).toBe(false);
  });
});

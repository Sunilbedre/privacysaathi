// @vitest-environment node
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
let ch: typeof import('./channels');
beforeAll(async () => { ch = await import('./channels'); });
afterEach(() => { vi.restoreAllMocks(); for (const k of ['WA_PHONE_NUMBER_ID', 'WA_TOKEN', 'WA_OWNER_NUMBERS', 'SMS_API_KEY', 'SMS_SENDER_ID', 'SMS_OWNER_NUMBERS']) delete process.env[k]; });

describe('channels', () => {
  it('skips quietly when not configured', async () => {
    expect(await ch.sendWhatsApp('t', ['a'])).toBe('skipped'); expect(await ch.sendSms('hi')).toBe('skipped'); expect(await ch.sendSmtp({ to: ['a@b.co'], subject: 's', html: 'h', text: 't' })).toBeNull();
  });
  it('sends a WhatsApp template with clean single-line parameters', async () => {
    Object.assign(process.env, { WA_PHONE_NUMBER_ID: '123', WA_TOKEN: 'tok', WA_OWNER_NUMBERS: '+91 98765 43210' });
    const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
    expect(await ch.sendWhatsApp('ps_scan_enquiry', ['Asha\nRao', 'x'])).toBe('sent');
    const [url, init] = f.mock.calls[0]; const b = JSON.parse(String((init as RequestInit).body));
    expect(String(url)).toContain('/123/messages'); expect(b.to).toBe('919876543210'); expect(b.template.name).toBe('ps_scan_enquiry'); expect(b.template.components[0].parameters[0].text).toBe('Asha Rao');
    expect((init as RequestInit & { headers: Record<string, string> }).headers.Authorization).toBe('Bearer tok');
  });
  it('reports failure when the API rejects', async () => {
    Object.assign(process.env, { WA_PHONE_NUMBER_ID: '123', WA_TOKEN: 'tok', WA_OWNER_NUMBERS: '919876543210' });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 400 }));
    expect(await ch.sendWhatsApp('t', ['a'])).toBe('failed');
  });
  it('sends SMS through SMSAlert and reads its JSON status', async () => {
    Object.assign(process.env, { SMS_API_KEY: 'k', SMS_SENDER_ID: 'BEDRWB', SMS_OWNER_NUMBERS: '919876543210, 919999999999' });
    const f = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('{"status":"success"}', { status: 200 })).mockResolvedValueOnce(new Response('{"status":"error"}', { status: 200 }));
    expect(await ch.sendSms(ch.fillSms('Hi {#var#} {#var#}', ['Asha', 'Rao']))).toBe('sent');
    const b = new URLSearchParams(String((f.mock.calls[0][1] as RequestInit).body)); expect(b.get('sender')).toBe('BEDRWB'); expect(b.get('mobileno')).toBe('919876543210,919999999999'); expect(b.get('text')).toBe('Hi Asha Rao');
    expect(await ch.sendSms('x')).toBe('failed');
  });
});

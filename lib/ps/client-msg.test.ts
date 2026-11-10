// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { fillSms, intlPhone } from './channels';
import { SMS_CLIENT_TEMPLATES, WA_CLIENT_TEMPLATES } from './enquiry';

describe('visitor messages', () => {
  it('adds the India code to a 10-digit mobile and keeps international numbers', () => {
    expect(intlPhone('98765 43210')).toBe('919876543210');
    expect(intlPhone('09876543210')).toBe('919876543210');
    expect(intlPhone('+91 98765 43210')).toBe('919876543210');
    expect(intlPhone('+44 7700 900123')).toBe('447700900123');
  });
  it('fills the visitor SMS templates in order', () => {
    expect(fillSms(SMS_CLIENT_TEMPLATES.solution, ['Asha', 'Breach plan', 'abc123'])).toBe('Hi Asha, we received your request for Breach plan. A Bedre consultant will call you soon. Ref abc123. - Privacy Saathi');
    expect(fillSms(SMS_CLIENT_TEMPLATES.scan, ['Asha', 'https://x.in/r/1'])).toContain('Hi Asha');
  });
  it('WhatsApp visitor templates have as many samples as variables', () => {
    for (const t of Object.values(WA_CLIENT_TEMPLATES)) expect((t.body.match(/\{\{\d\}\}/g) ?? []).length).toBe(t.sample.length);
  });
});

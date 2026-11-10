// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
process.env.PS_SECRET = 'test-secret-for-otp-1234567890';
import { checkCode, checkToken, codeFor, makeChallenge, makeToken, otpEnabled } from './otp';
import { sendWhatsAppOtp } from './channels';

afterEach(() => { vi.unstubAllGlobals(); delete process.env.WA_OTP_REQUIRED; delete process.env.WA_TOKEN; delete process.env.WA_PHONE_NUMBER_ID; });

describe('mobile verification code', () => {
  it('accepts the right code for the same number, in any number format', () => {
    const ch = makeChallenge('98765 43210');
    expect(codeFor(ch)).toMatch(/^\d{6}$/);
    expect(checkCode(ch, '+91 98765 43210', codeFor(ch))).toBe('ok');
  });
  it('rejects a wrong code, another number and an expired code', () => {
    const ch = makeChallenge('9876543210', 1_000_000);
    expect(checkCode(ch, '9876543210', '000000' === codeFor(ch) ? '111111' : '000000', 1_000_001)).toBe('wrong');
    expect(checkCode(ch, '9123456789', codeFor(ch), 1_000_001)).toBe('invalid');
    expect(checkCode(ch, '9876543210', codeFor(ch), 1_000_000 + 11 * 60_000)).toBe('expired');
    expect(checkCode(ch + 'x', '9876543210', codeFor(ch), 1_000_001)).toBe('invalid');
  });
  it('locks a challenge after five wrong tries', () => {
    const ch = makeChallenge('9000000001'); const bad = codeFor(ch) === '123456' ? '654321' : '123456';
    for (let i = 0; i < 5; i++) expect(checkCode(ch, '9000000001', bad)).toBe('wrong');
    expect(checkCode(ch, '9000000001', codeFor(ch))).toBe('locked');
  });
  it('the proof token is tied to the number and expires', () => {
    const t = makeToken('9876543210', 5_000_000);
    expect(checkToken(t, '+91 9876543210', 5_000_001)).toBe(true);
    expect(checkToken(t, '9123456789', 5_000_001)).toBe(false);
    expect(checkToken(t, '9876543210', 5_000_000 + 31 * 60_000)).toBe(false);
    expect(checkToken(t.slice(0, -2) + 'zz', '9876543210', 5_000_001)).toBe(false);
    expect(checkToken(undefined, '9876543210')).toBe(false);
  });
  it('is only on when switched on and WhatsApp is set up', () => {
    expect(otpEnabled()).toBe(false);
    process.env.WA_OTP_REQUIRED = 'on'; expect(otpEnabled()).toBe(false);
    process.env.WA_TOKEN = 't'; process.env.WA_PHONE_NUMBER_ID = '123'; expect(otpEnabled()).toBe(true);
  });
  it('sends the code to the visitor in the body and the copy-code button', async () => {
    process.env.WA_TOKEN = 't'; process.env.WA_PHONE_NUMBER_ID = '123';
    const f = vi.fn().mockResolvedValue({ ok: true, text: async () => '' }); vi.stubGlobal('fetch', f);
    expect(await sendWhatsAppOtp('ps_otp_mobile_verification', '98765 43210', '482913')).toBe('sent');
    const body = JSON.parse(f.mock.calls[0][1].body);
    expect(body.to).toBe('919876543210'); expect(body.template.name).toBe('ps_otp_mobile_verification');
    expect(body.template.components[0].parameters[0].text).toBe('482913');
    expect(body.template.components[1]).toMatchObject({ type: 'button', sub_type: 'url', index: '0' });
  });
});

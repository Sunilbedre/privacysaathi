// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { assertScannableUrl, isBlockedIp, ScanBlocked } from './ssrf';
import { safeFetch } from './safe-fetch';

describe('assertScannableUrl rejects', () => {
  const bad = [
    'http://127.0.0.1', 'http://localhost', 'http://169.254.169.254/latest/meta-data', 'http://[::1]', 'http://[::ffff:127.0.0.1]',
    'http://2130706433', 'http://0x7f000001', 'http://10.0.0.1', 'ftp://example.com', 'file:///etc/passwd', 'https://example.com:8080',
    'http://example.com:22', 'https://user:pw@example.com', 'http://intranet.local', 'http://metadata.google.internal', 'not a url',
  ];
  for (const b of bad) it(b, () => expect(() => assertScannableUrl(b)).toThrow(ScanBlocked));
  it('accepts normal sites', () => {
    expect(assertScannableUrl('https://example.com/a').hostname).toBe('example.com');
    expect(assertScannableUrl('http://example.com:80').hostname).toBe('example.com');
  });
  it('blocks own hosts', () => {
    expect(() => assertScannableUrl('https://bedreweb.com')).toThrow(ScanBlocked);
    expect(() => assertScannableUrl('https://www.bedreweb.com')).toThrow(ScanBlocked);
  });
});

describe('isBlockedIp', () => {
  const blocked = ['127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '224.0.0.1', '::', '::1', 'fe80::1', 'fc00::1', 'fd12::1', 'ff02::1', '::ffff:10.0.0.1', '::ffff:7f00:1', '64:ff9b::a00:1', 'garbage'];
  const open = ['93.184.216.34', '8.8.8.8', '1.1.1.1', '172.32.0.1', '2606:2800:220:1:248:1893:25c8:1946', '::ffff:8.8.8.8'];
  for (const ip of blocked) it(`blocks ${ip}`, () => expect(isBlockedIp(ip)).toBe(true));
  for (const ip of open) it(`allows ${ip}`, () => expect(isBlockedIp(ip)).toBe(false));
});

describe('safeFetch', () => {
  it('rejects a domain that resolves to a private IP', async () => {
    await expect(safeFetch('https://evil.example.com', { resolver: async () => ['10.0.0.5'] })).rejects.toThrow(/private/);
  });
  it('rejects when any returned address is private', async () => {
    await expect(safeFetch('https://evil.example.com', { resolver: async () => ['93.184.216.34', '127.0.0.1'] })).rejects.toThrow(ScanBlocked);
  });
  it('re-resolves a hostname on every hop (second host resolves private, so it is refused)', async () => {
    await expect(safeFetch('https://second-hop.example.org', { resolver: async () => ['192.168.0.9'] })).rejects.toThrow(/private/);
  });
  it('rejects a redirect target that is a private literal', () => {
    expect(() => assertScannableUrl(new URL('http://169.254.169.254/', 'https://a.example.com'))).toThrow(ScanBlocked);
  });
});

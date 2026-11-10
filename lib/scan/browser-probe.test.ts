// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { probeChecks, probeConsent } from './browser-probe';

describe('browser probe', () => {
  it('is off unless enabled', async () => {
    delete process.env.PS_BROWSER_PROBE;
    expect(await probeConsent('https://example.com/')).toBeNull();
  });
  it('refuses private addresses', async () => {
    process.env.PS_BROWSER_PROBE = '1';
    expect(await probeConsent('http://127.0.0.1/')).toBeNull();
    delete process.env.PS_BROWSER_PROBE;
  });
  it('fails when trackers or tracking cookies appeared before consent', () => {
    const [c] = probeChecks({ trackers: ['Meta Pixel'], cookies: ['_fbp'], bannerVisible: true, requests: 9 });
    expect(c.status).toBe('fail'); expect(c.evidence).toMatch(/Meta Pixel/); expect(c.evidence).toMatch(/banner was visible/);
  });
  it('passes when nothing loaded', () => {
    expect(probeChecks({ trackers: [], cookies: [], bannerVisible: false, requests: 2 })[0].status).toBe('pass');
  });
});

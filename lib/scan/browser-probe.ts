import dns from 'node:dns/promises';
import { assertScannableUrl, isBlockedIp } from './ssrf';
import { TRACKERS } from './html';
import type { Check } from './types';

/**
 * Real-browser consent test. Opens the home page in a clean headless browser, clicks nothing, and records which trackers
 * were requested and which tracking cookies were set before the visitor could agree to anything.
 * OFF unless PS_BROWSER_PROBE=1. Every request the browser makes is checked against the same public-address rules as the
 * rest of the scanner. If the browser is missing or fails, it returns null and the scan simply keeps its source-based checks.
 */
export interface ProbeResult { trackers: string[]; cookies: string[]; bannerVisible: boolean; requests: number }

export const probeEnabled = () => process.env.PS_BROWSER_PROBE === '1';

// Cookie names that exist to track or advertise (not session or security cookies).
const TRACKING_COOKIE = /^(_ga(_.*)?|_gid|_gat.*|_gcl_.*|_fbp|_fbc|_hj.*|_clck|_clsk|_uet.*|MUID|_ttp|_tt_.*|li_fat_id|lidc|bcookie|IDE|test_cookie|_pin_unauth|__hs.*|hubspotutk|_omappvc|ajs_.*|mp_.*|_mkto_trk|NID)$/i;
const BANNER_WORDS = /accept( all)?( cookies)?|reject( all)?|decline|cookie (settings|preferences)|manage (cookies|preferences)|i agree|allow all/i;

async function publicHost(host: string, memo: Map<string, boolean>): Promise<boolean> {
  const hit = memo.get(host); if (hit !== undefined) return hit;
  let ok = false;
  try {
    assertScannableUrl(`https://${host}/`);
    const addrs = await dns.lookup(host, { all: true });
    ok = addrs.length > 0 && addrs.every((a) => !isBlockedIp(a.address));
  } catch { ok = false; }
  memo.set(host, ok); return ok;
}

export async function probeConsent(url: string, timeoutMs = 18_000): Promise<ProbeResult | null> {
  if (!probeEnabled()) return null;
  let browser: import('playwright-core').Browser | undefined;
  try {
    assertScannableUrl(url);
    const { chromium } = await import('playwright-core');
    browser = await chromium.launch({ headless: true, timeout: 10_000, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const ctx = await browser.newContext({ serviceWorkers: 'block', acceptDownloads: false, javaScriptEnabled: true, userAgent: 'PrivacySaathiScanner/1.0 (+https://privacysaathi.in)' });
    const memo = new Map<string, boolean>();
    const seen = new Set<string>(); let requests = 0;
    await ctx.route('**/*', async (route) => {
      const u = new URL(route.request().url());
      if (u.protocol === 'data:' || u.protocol === 'blob:' || u.protocol === 'about:') return route.continue();
      if ((u.protocol !== 'http:' && u.protocol !== 'https:') || !(await publicHost(u.hostname, memo))) return route.abort('blockedbyclient');
      if (['media', 'font', 'image'].includes(route.request().resourceType())) return route.abort(); // not needed, saves time
      requests++;
      for (const [name, re] of TRACKERS) if (re.test(route.request().url())) seen.add(name);
      return route.continue();
    });
    const page = await ctx.newPage();
    page.setDefaultTimeout(timeoutMs);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    await page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => {});
    await page.waitForTimeout(2500); // late-loading tags
    const cookies = (await ctx.cookies()).map((c) => c.name).filter((n) => TRACKING_COOKIE.test(n));
    const bannerVisible = await page.evaluate((src) => {
      const re = new RegExp(src, 'i');
      return [...document.querySelectorAll('button,a,[role=button],input[type=button],input[type=submit]')].some((el) => {
        const r = (el as HTMLElement).getBoundingClientRect(), t = ((el as HTMLElement).innerText || (el as HTMLInputElement).value || '').trim();
        return r.width > 0 && r.height > 0 && t.length < 40 && re.test(t);
      });
    }, BANNER_WORDS.source).catch(() => false);
    return { trackers: [...seen].filter((n) => n !== 'Chat widget'), cookies: [...new Set(cookies)], bannerVisible, requests };
  } catch { return null; } finally { await browser?.close().catch(() => {}); }
}

export function probeChecks(p: ProbeResult): Check[] {
  const loaded = p.trackers.length > 0 || p.cookies.length > 0;
  const what = [p.trackers.length ? `${p.trackers.join(', ')} loaded` : '', p.cookies.length ? `tracking cookies set (${p.cookies.slice(0, 5).join(', ')})` : ''].filter(Boolean).join(' and ');
  return [{
    id: 'consent-live', title: 'Nothing tracks visitors before they agree (tested in a real browser)', area: 'dpdp', duty: 'consent',
    status: loaded ? 'fail' : 'pass', severity: 'high',
    evidence: loaded
      ? `We opened your home page in a clean browser and clicked nothing. ${what[0].toUpperCase() + what.slice(1)} before any consent. ${p.bannerVisible ? 'A consent banner was visible, but it did not hold these back.' : 'No consent banner was visible.'}`
      : `We opened your home page in a clean browser and clicked nothing. No known trackers loaded and no tracking cookies were set${p.bannerVisible ? ', and a consent banner was visible' : ''}.`,
    whyItMatters: 'Consent must be given before tracking starts, not after.',
    fix: loaded ? 'Configure your consent tool (or tag manager) to block these tags and cookies until the visitor accepts.' : 'Keep it this way, and re-test after any marketing tag change.',
    relatedService: loaded ? 'Security Consulting' : undefined,
  }];
}

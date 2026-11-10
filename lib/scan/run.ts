import { assertScannableUrl, ScanBlocked } from './ssrf';
import { safeFetch } from './safe-fetch';
import { crawl, parseRobots, type Robots } from './crawl';
import { exposedPaths, pageChecks } from './checks';
import { emailDns } from './dns-checks';
import { probeChecks, probeConsent, probeEnabled } from './browser-probe';
import type { ScanResult } from './types';

export interface RunOpts { url: string; deep: boolean; budgetMs?: number; onProgress?: (step: string, pct: number) => void }

export async function runScan({ url, deep, budgetMs = 45_000, onProgress = () => {} }: RunOpts): Promise<ScanResult> {
  const started = new Date();
  const deadline = Date.now() + budgetMs;
  const u = assertScannableUrl(url);
  const domain = u.hostname.replace(/^www\./, '');
  onProgress('Opening your home page', 5);
  // Prefer https; fall back to http only to report the problem.
  let home;
  try { home = await safeFetch(`https://${u.hostname}/`); } catch (e) {
    if (e instanceof ScanBlocked && /DNS|private|blocked/i.test(e.reason)) throw e;
    home = await safeFetch(`http://${u.hostname}/`);
  }
  let robots: Robots = { disallow: [], sitemaps: [], found: false };
  try { const r = await safeFetch(new URL('/robots.txt', home.url).toString(), { maxBytes: 200_000, timeoutMs: 6000 }); if (r.status === 200) robots = parseRobots(r.body); } catch { /* optional */ }

  onProgress('Reading more pages', 20);
  const pages = deep
    ? await crawl({ url: home.url, res: home }, robots, { maxPages: 25, maxDepth: 2, deadline: deadline - 12_000, useSitemap: true, onPage: (n) => onProgress(`Read ${n} pages`, Math.min(55, 20 + n * 2)) })
    : [{ url: home.url, res: home }];

  onProgress('Checking privacy and security signals', 60);
  const { checks, forms, trackers, cookies } = pageChecks(pages, robots);
  let notLive = false;

  onProgress('Checking email security', 75);
  const [{ email, checks: dnsChecks }, redirect] = await Promise.all([
    emailDns(domain),
    safeFetch(`http://${u.hostname}/`, { noRedirect: true, noBody: true, timeoutMs: 6000 }).catch(() => null),
  ]);
  checks.push(...dnsChecks);
  if (redirect) {
    const loc = String(redirect.headers.location ?? '');
    const ok = redirect.status >= 300 && redirect.status < 400 && loc.startsWith('https:');
    checks.push({ id: 'http-redirect', title: 'HTTP redirects to HTTPS', area: 'security', duty: 'security', status: ok ? 'pass' : 'warn', severity: 'medium', evidence: ok ? 'Plain HTTP is redirected to HTTPS.' : 'Plain HTTP does not redirect to HTTPS.', whyItMatters: 'Visitors who type http:// should not stay unencrypted.', fix: 'Add a site-wide redirect to HTTPS.', relatedService: 'Cloud and Server Security' });
  }
  if (probeEnabled() && Date.now() < deadline - 6000) {
    onProgress('Testing consent in a real browser', 85);
    const pr = await probeConsent(home.url);
    if (pr) { const i = checks.findIndex((c) => c.id === 'trackers-before-consent'); if (i >= 0) checks.splice(i, 1); checks.push(...probeChecks(pr)); }
    else notLive = true;
  }
  let partial = false;
  if (deep && Date.now() < deadline - 5000) { onProgress('Checking for exposed files', 90); checks.push(await exposedPaths(home.url, robots)); } else if (deep) partial = true;

  const notChecked = [
    ...(probeEnabled() && notLive ? ['The live browser consent test could not run this time'] : []),
    'Pages that need a login, and forms or banners built by scripts after the page loads',
    'What your privacy notice actually says (we only look for topics, we do not judge wording)',
    'Whether versions of your CMS and plugins are outdated',
    'DNSSEC and domain registration details',
    'Your internal systems, staff devices and any data stored behind the website',
    ...(deep ? [] : ['Pages beyond the home page (a full scan needs ownership confirmed)']),
    ...(robots.disallow.length ? ['Areas your robots.txt asks scanners to avoid'] : []),
  ];
  onProgress('Preparing your report', 98);
  return { domain, url: home.url, mode: deep ? 'deep' : 'light', startedAt: started.toISOString(), finishedAt: new Date().toISOString(), partial: partial || pages.length < 2 && deep, pagesScanned: pages.length, checks, forms, trackers, cookies, email, notChecked };
}

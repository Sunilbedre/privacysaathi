import type { Check, CookieInfo, FormInfo, TrackerInfo } from './types';
import type { Page } from './crawl';
import { anchorsWithText, CONSENT_BANNER, extractForms, extractMixed, extractScripts, TRACKERS, clean } from './html';
import { safeFetch } from './safe-fetch';
import { allowed, type Robots } from './crawl';

type Mk = Omit<Check, 'id' | 'title'>;
const mk = (id: string, title: string, c: Mk): Check => ({ id, title, ...c });

export function parseCookies(setCookie: string[] | string | undefined): CookieInfo[] {
  const arr = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  return arr.map((c) => {
    const parts = c.split(';').map((s) => s.trim());
    const name = clean(parts[0].split('=')[0], 40); // value is dropped on purpose
    const attr = (k: string) => parts.slice(1).find((p) => p.toLowerCase().startsWith(k));
    const maxAge = attr('max-age=')?.split('=')[1], exp = attr('expires=')?.slice(8);
    const days = maxAge ? Math.round(Number(maxAge) / 86400) : exp && !isNaN(Date.parse(exp)) ? Math.round((Date.parse(exp) - Date.now()) / 86400000) : null;
    return { name, secure: !!attr('secure'), httpOnly: !!attr('httponly'), sameSite: attr('samesite=')?.split('=')[1]?.toLowerCase() ?? 'not set', lifetimeDays: days };
  });
}

export function pageChecks(pages: Page[], robots: Robots) {
  const home = pages[0].res;
  const all = pages.map((p) => ({ url: p.res.url, html: p.res.body }));
  const forms: FormInfo[] = all.flatMap((p) => extractForms(p.html, p.url)).slice(0, 40);
  const trackers: TrackerInfo[] = [];
  const gatedT = new Set<string>();
  const seenT = new Set<string>();
  for (const p of all) for (const s of extractScripts(p.html, p.url)) for (const [name, re] of TRACKERS) {
    if (re.test(s.src) && s.gated) gatedT.add(name);
    else if (re.test(s.src) && !seenT.has(name)) { seenT.add(name); trackers.push({ name, host: new URL(s.src).hostname, page: p.url }); }
  }
  const homeScripts = extractScripts(home.body, home.url);
  const trackersInHtml = trackers.filter((t) => t.page === home.url);
  const gatedNames = [...gatedT].filter((n) => !seenT.has(n));
  const banner = CONSENT_BANNER.test(home.body) || homeScripts.some((s) => CONSENT_BANNER.test(s.src));
  const links = all.flatMap((p) => anchorsWithText(p.html));
  const find = (re: RegExp) => links.find((l) => re.test(l.text) || re.test(l.href));
  const privacy = find(/privacy|data protection/i), terms = find(/terms|conditions/i), grievance = find(/grievance|data protection officer|dpo/i);
  const text = all.map((p) => p.html).join(' ').toLowerCase();
  const checks: Check[] = [];

  checks.push(mk('privacy-policy', 'Privacy policy or notice is linked', privacy
    ? { area: 'dpdp', duty: 'notice', status: 'pass', severity: 'high', evidence: 'A privacy link was found on the site.', whyItMatters: 'The law expects a clear notice before you collect personal data.', fix: 'Check that it states purpose, what you collect, retention, rights and a grievance contact.', relatedService: 'Security Consulting' }
    : { area: 'dpdp', duty: 'notice', status: 'fail', severity: 'high', evidence: 'No privacy policy or notice link found in the pages we read.', whyItMatters: 'The law expects a clear notice before you collect personal data.', fix: 'Publish a plain-language privacy notice and link it in the footer and next to every form.', relatedService: 'Security Consulting' }));
  checks.push(mk('terms', 'Terms page (informational)', { area: 'dpdp', status: terms ? 'pass' : 'unknown', severity: 'low', evidence: terms ? 'Terms link found.' : 'No terms link found.', whyItMatters: 'Terms set out how the site and its data are used.', fix: 'Publish terms and link them in the footer.' }));
  const signals = ['purpose', 'retain|retention|stored for', 'right to|your rights|erase|erasure', 'grievance|data protection officer|contact us'].filter((s) => new RegExp(s).test(text)).length;
  checks.push(mk('notice-content', 'Notice mentions purpose, retention, rights and contact', privacy
    ? { area: 'dpdp', duty: 'notice', status: signals >= 3 ? 'pass' : 'warn', severity: 'medium', evidence: `${signals} of 4 common notice topics are mentioned somewhere on the pages we read.`, whyItMatters: 'A notice that skips these topics may not meet the standard.', fix: 'Review the notice against the four topics and fill gaps. This is a keyword signal, not a reading of your policy.', relatedService: 'Security Consulting' }
    : { area: 'dpdp', duty: 'notice', status: 'unknown', severity: 'medium', evidence: 'No notice found to assess.', whyItMatters: 'A notice that skips these topics may not meet the standard.', fix: 'Publish a notice first.' }));
  checks.push(mk('grievance', 'Grievance or data protection contact is visible', grievance || /grievance|data protection officer/.test(text)
    ? { area: 'dpdp', duty: 'rights', status: 'pass', severity: 'medium', evidence: 'A grievance or DPO mention was found.', whyItMatters: 'People need a way to raise complaints and exercise their rights.', fix: 'Make sure the contact is monitored and answers are tracked.' }
    : { area: 'dpdp', duty: 'rights', status: 'warn', severity: 'medium', evidence: 'No grievance officer or data protection contact found.', whyItMatters: 'People need a way to raise complaints and exercise their rights.', fix: 'Add a named contact and email for privacy requests.' }));

  const noConsent = forms.filter((f) => !f.consentNearby), insecure = forms.filter((f) => !f.httpsPost);
  checks.push(mk('forms-consent', 'Forms that collect personal data show a consent notice', !forms.length
    ? { area: 'dpdp', duty: 'consent', status: 'unknown', severity: 'high', evidence: 'No personal-data forms found in the pages we read (forms loaded by script cannot be seen).', whyItMatters: 'Consent and notice must come before collection.', fix: 'List every place you collect data, including embedded forms and WhatsApp links.' }
    : { area: 'dpdp', duty: 'consent', status: noConsent.length ? 'fail' : 'pass', severity: 'high', evidence: `${forms.length} form(s) collect personal data; ${noConsent.length} without a visible consent or notice line.`, whyItMatters: 'Consent and notice must come before collection.', fix: 'Add a clear consent line with a privacy notice link beside each form.', relatedService: 'Security Consulting' }));
  if (forms.length) checks.push(mk('forms-https', 'Forms send data over HTTPS', { area: 'security', duty: 'security', status: insecure.length ? 'fail' : 'pass', severity: 'high', evidence: insecure.length ? `${insecure.length} form(s) post to a non-HTTPS address.` : 'All forms post over HTTPS.', whyItMatters: 'Unencrypted forms expose personal data in transit.', fix: 'Serve every form over HTTPS.', relatedService: 'Application Security' }));

  checks.push(mk('trackers', 'Trackers and ad pixels', { area: 'dpdp', duty: 'consent', status: trackers.length ? (banner ? 'warn' : 'fail') : 'pass', severity: 'medium', evidence: trackers.length ? `Found: ${trackers.map((t) => t.name).join(', ')}.` : 'No known trackers found in page scripts.', whyItMatters: 'Tracking visitors needs their consent first.', fix: 'Load trackers only after consent, and list them in your notice.', relatedService: 'Security Consulting' }));
  checks.push(mk('consent-banner', 'Cookie consent banner', trackers.length
    ? { area: 'dpdp', duty: 'consent', status: banner ? 'pass' : 'fail', severity: 'medium', evidence: banner ? 'A consent tool or banner was detected.' : 'Trackers found but no consent banner detected.', whyItMatters: 'Visitors should be able to accept or refuse tracking.', fix: 'Add a consent banner that blocks trackers until the visitor agrees.' }
    : { area: 'dpdp', duty: 'consent', status: 'pass', severity: 'low', evidence: 'No trackers, so no banner needed on what we saw.', whyItMatters: 'Visitors should be able to accept or refuse tracking.', fix: 'None needed now.' }));
  if (trackersInHtml.length) checks.push(mk('trackers-before-consent', 'Trackers load before consent (likely)', { area: 'dpdp', duty: 'consent', status: banner ? 'warn' : 'fail', severity: 'medium', evidence: `${trackersInHtml.map((t) => t.name).join(', ')} appear in the page source. Some banners block them in the browser, so this is a heuristic.`, whyItMatters: 'Trackers that run before consent defeat the purpose of the banner.', fix: 'Confirm in a browser that nothing loads before the visitor accepts.' }));

  const kids = /school|student|admission|parent|kids|children|age group|date of birth|dob/i.test(text);
  if (gatedNames.length) checks.push(mk('trackers-gated', 'Trackers held back until consent', { area: 'dpdp', duty: 'consent', status: 'pass', severity: 'medium', evidence: `${gatedNames.join(', ')} ${gatedNames.length > 1 ? 'are' : 'is'} marked in the page source to wait for the visitor's agreement.`, whyItMatters: 'Trackers should only run after the visitor agrees.', fix: 'Keep it this way, and confirm in a browser that nothing loads before consent.' }));
  checks.push(mk('children', 'Signals of children\'s data', { area: 'dpdp', duty: 'children', status: kids ? 'warn' : 'pass', severity: 'medium', evidence: kids ? 'Content or fields suggest children or students may be involved.' : 'No strong signals.', whyItMatters: 'Children\'s data needs verifiable parent consent.', fix: 'Answer the children question in the next step.' }));

  // security
  const h = home.headers, isHttps = home.url.startsWith('https:');
  checks.push(mk('https', 'Site uses HTTPS with a valid certificate', isHttps && home.tls?.authorized
    ? { area: 'security', duty: 'security', status: 'pass', severity: 'high', evidence: `Valid certificate${home.tls.validTo ? `, expires ${home.tls.validTo}` : ''}; ${home.tls.protocol ?? 'TLS'}.`, whyItMatters: 'HTTPS protects visitors\' data in transit.', fix: 'Renew before expiry.', relatedService: 'Cloud and Server Security' }
    : { area: 'security', duty: 'security', status: isHttps ? 'fail' : 'fail', severity: 'high', evidence: isHttps ? `Certificate problem: ${clean(home.tls?.error ?? 'not trusted')}.` : 'The site served over plain HTTP.', whyItMatters: 'HTTPS protects visitors\' data in transit.', fix: 'Install a valid certificate and redirect all traffic to HTTPS.', relatedService: 'Cloud and Server Security' }));
  const days = home.tls?.validTo ? Math.round((Date.parse(home.tls.validTo) - Date.now()) / 86400000) : null;
  if (days !== null && days < 30) checks.push(mk('cert-expiry', 'Certificate expiry', { area: 'security', status: days < 0 ? 'fail' : 'warn', severity: 'medium', evidence: `Certificate expires in ${days} days.`, whyItMatters: 'An expired certificate shows visitors a security warning.', fix: 'Renew now and enable auto-renewal.', relatedService: 'Cloud and Server Security' }));
  const tlsOld = /TLSv1(\.0|\.1)?$/.test(home.tls?.protocol ?? '');
  if (home.tls?.protocol) checks.push(mk('tls-version', 'Modern TLS version', { area: 'security', status: tlsOld ? 'fail' : 'pass', severity: 'medium', evidence: `Negotiated ${home.tls.protocol}.`, whyItMatters: 'Old TLS versions are weak.', fix: 'Allow only TLS 1.2 and 1.3.', relatedService: 'Cloud and Server Security' }));
  const hdr = (n: string) => h[n] !== undefined;
  checks.push(mk('hsts', 'HSTS header', { area: 'security', status: hdr('strict-transport-security') ? 'pass' : 'warn', severity: 'medium', evidence: hdr('strict-transport-security') ? 'Present.' : 'Missing.', whyItMatters: 'HSTS stops browsers from ever using plain HTTP for your site.', fix: 'Send Strict-Transport-Security with a long max-age.', relatedService: 'Application Security' }));
  const csp = hdr('content-security-policy');
  const missing = [['x-content-type-options', 'X-Content-Type-Options'], ['referrer-policy', 'Referrer-Policy'], ['permissions-policy', 'Permissions-Policy']].filter(([k]) => !hdr(k)).map(([, n]) => n);
  if (!hdr('x-frame-options') && !/frame-ancestors/i.test(String(h['content-security-policy'] ?? ''))) missing.push('X-Frame-Options');
  checks.push(mk('csp', 'Content-Security-Policy header', { area: 'security', status: csp ? 'pass' : 'warn', severity: 'medium', evidence: csp ? 'Present.' : 'Missing.', whyItMatters: 'CSP limits what scripts can run, reducing damage from injected code.', fix: 'Add a CSP, starting in report-only mode.', relatedService: 'Application Security' }));
  checks.push(mk('sec-headers', 'Other security headers', { area: 'security', status: missing.length ? (missing.length > 2 ? 'fail' : 'warn') : 'pass', severity: 'low', evidence: missing.length ? `Missing: ${missing.join(', ')}.` : 'All present.', whyItMatters: 'These headers close common browser-side weaknesses.', fix: 'Add the missing headers at your server or CDN.', relatedService: 'Application Security' }));

  const cookies = parseCookies(h['set-cookie']);
  const badC = cookies.filter((c) => !c.secure || !c.httpOnly || c.sameSite === 'not set');
  checks.push(mk('cookie-flags', 'Cookie security flags', cookies.length
    ? { area: 'security', status: badC.length ? 'warn' : 'pass', severity: 'medium', evidence: badC.length ? `${badC.length} of ${cookies.length} cookie(s) miss Secure, HttpOnly or SameSite (${badC.map((c) => c.name).slice(0, 4).join(', ')}).` : 'All cookies set safe flags.', whyItMatters: 'Weak flags make session theft easier.', fix: 'Set Secure, HttpOnly and SameSite on session cookies.', relatedService: 'Application Security' }
    : { area: 'security', status: 'unknown', severity: 'low', evidence: 'No cookies on the first response (cookies set by scripts are not visible to us).', whyItMatters: 'Weak flags make session theft easier.', fix: 'Check cookies in browser developer tools.' }));

  const mixed = all.reduce((n, p) => n + (p.url.startsWith('https:') ? extractMixed(p.html) : 0), 0);
  checks.push(mk('mixed', 'Mixed content', { area: 'security', status: mixed ? 'warn' : 'pass', severity: 'medium', evidence: mixed ? `${mixed} resource(s) load over HTTP on HTTPS pages.` : 'None found.', whyItMatters: 'Insecure resources can be tampered with.', fix: 'Load every resource over HTTPS.', relatedService: 'Application Security' }));

  const server = String(h.server ?? ''), powered = String(h['x-powered-by'] ?? '');
  const leak = [server, powered].filter((s) => /\d+\.\d+/.test(s));
  checks.push(mk('info-leak', 'Version disclosure in headers', { area: 'security', status: leak.length ? 'warn' : 'pass', severity: 'low', evidence: leak.length ? `Headers reveal: ${leak.map((s) => clean(s, 40)).join(', ')}.` : 'No versions disclosed.', whyItMatters: 'Version details help attackers pick known exploits.', fix: 'Hide Server and X-Powered-By versions.', relatedService: 'Cloud and Server Security' }));
  const gen = home.body.match(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["']/i)?.[1];
  const wp = /wp-content|wp-includes/i.test(home.body);
  checks.push(mk('cms', 'CMS and library versions', { area: 'security', status: 'unknown', severity: 'low', evidence: `${wp ? 'WordPress detected. ' : ''}${gen ? `Generator: ${clean(gen, 40)}. ` : ''}${!wp && !gen ? 'No CMS clearly identified. ' : ''}We cannot say if versions are outdated from outside.`, whyItMatters: 'Outdated CMS plugins are a leading cause of site breaches.', fix: 'Confirm CMS, theme and plugin updates are current.', relatedService: 'Vulnerability Assessment' }));

  const ext = all.flatMap((p) => extractScripts(p.html, p.url)).filter((s) => new URL(s.src).hostname.replace(/^www\./, '') !== new URL(home.url).hostname.replace(/^www\./, ''));
  const noSri = ext.filter((s) => !s.sri).length;
  checks.push(mk('third-party', 'Third-party scripts', { area: 'security', status: ext.length > 10 ? 'warn' : 'pass', severity: 'low', evidence: `${new Set(ext.map((s) => new URL(s.src).hostname)).size} outside host(s), ${ext.length} script(s), ${noSri} without integrity checks.`, whyItMatters: 'Every outside script is code you do not control.', fix: 'Remove unused scripts; use integrity attributes where possible.', relatedService: 'Application Security' }));
  const login = links.some((l) => /login|sign.?in|wp-admin|my account/i.test(l.text + l.href));
  checks.push(mk('login', 'Login page (informational)', { area: 'security', status: login ? 'warn' : 'pass', severity: 'low', evidence: login ? 'A login area is linked. We cannot see whether multi-factor sign-in is on.' : 'No login link found.', whyItMatters: 'Logins without multi-factor are a top breach route.', fix: 'Turn on multi-factor for all staff and admin accounts.', relatedService: 'Zero Trust and MFA' }));
  return { checks, forms, trackers, cookies };
}

const PATHS = ['/.env', '/.git/HEAD', '/phpinfo.php', '/backup.zip', '/backup.sql', '/wp-config.php.bak', '/.DS_Store'];
export async function exposedPaths(base: string, robots: Robots): Promise<Check> {
  const found: string[] = [];
  let baseline: number | null = null;
  try { baseline = (await safeFetch(new URL('/ps-probe-' + Math.random().toString(36).slice(2), base).toString(), { noBody: true, timeoutMs: 6000 })).status; } catch { /* ignore */ }
  if (baseline === 200) return mk('exposed', 'Exposed sensitive files', { area: 'security', status: 'unknown', severity: 'high', evidence: 'This site returns "found" for any address, so we cannot tell. Check manually.', whyItMatters: 'Exposed .env, .git and backups leak secrets.', fix: 'Confirm those paths return 403 or 404.', relatedService: 'Vulnerability Assessment' });
  for (const p of PATHS) {
    if (!allowed(robots, p)) continue;
    try { const r = await safeFetch(new URL(p, base).toString(), { noBody: true, timeoutMs: 6000, noRedirect: true }); if (r.status === 200) found.push(p); } catch { /* ignore */ }
  }
  return mk('exposed', 'Exposed sensitive files', { area: 'security', status: found.length ? 'fail' : 'pass', severity: 'high', evidence: found.length ? `These respond as present (content not read): ${found.join(', ')}.` : 'None of the common sensitive paths responded as present.', whyItMatters: 'Exposed .env, .git and backups leak secrets.', fix: 'Remove or block these files at once.', relatedService: 'Vulnerability Assessment' });
}

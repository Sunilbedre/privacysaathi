import dns from 'node:dns/promises';
import type { Check, ScanResult } from './types';

const txt = async (name: string) => (await dns.resolveTxt(name).catch(() => [])).map((a) => a.join(''));
const DKIM_SELECTORS = ['google', 'selector1', 'selector2', 'default', 'k1', 'k2', 's1', 's2', 'zoho', 'mail', 'dkim', 'mandrill', 'smtp'];

export function mxProvider(mx: string[]): string {
  const j = mx.join(' ').toLowerCase();
  if (!j) return 'none';
  if (/google|googlemail/.test(j)) return 'Google Workspace';
  if (/outlook\.com|protection\.outlook|microsoft/.test(j)) return 'Microsoft 365';
  if (/zoho/.test(j)) return 'Zoho Mail';
  if (/mimecast|proofpoint|barracuda|pphosted/.test(j)) return 'Business mail gateway';
  return 'Other or shared hosting';
}

export async function emailDns(domain: string): Promise<{ email: ScanResult['email']; checks: Check[] }> {
  const mx = (await dns.resolveMx(domain).catch(() => [])).sort((a, b) => a.priority - b.priority).map((m) => m.exchange.toLowerCase()).filter((x) => x && x !== '.');
  const [root, dmarcRec, mtaSts, tlsRpt] = await Promise.all([txt(domain), txt(`_dmarc.${domain}`), txt(`_mta-sts.${domain}`), txt(`_smtp._tls.${domain}`)]);
  const spf = root.find((t) => /^v=spf1/i.test(t)) ?? null;
  const dmarc = dmarcRec.find((t) => /^v=DMARC1/i.test(t)) ?? null;
  const policy = dmarc?.match(/\bp\s*=\s*(none|quarantine|reject)/i)?.[1]?.toLowerCase() ?? null;
  const dkim: string[] = [];
  await Promise.all(DKIM_SELECTORS.map(async (s) => { if ((await txt(`${s}._domainkey.${domain}`)).some((t) => /p=[A-Za-z0-9+/=]{40,}/.test(t))) dkim.push(s); }));
  const provider = mxProvider(mx);
  const caa = await dns.resolveCaa(domain).catch(() => []);

  const C = (c: Omit<Check, 'area' | 'relatedService'>): Check => ({ area: 'email', relatedService: 'Email Security', ...c });
  const checks: Check[] = [];
  checks.push(C(mx.length
    ? { id: 'mx', title: 'Business email is set up on this domain', status: provider === 'Other or shared hosting' ? 'warn' : 'pass', severity: 'low', evidence: `Mail provider looks like: ${provider}`, whyItMatters: 'Shared website-hosting mail has weaker controls, logging and recovery than a business mail suite.', fix: 'Move company mail to Google Workspace, Microsoft 365 or Zoho.' }
    : { id: 'mx', title: 'Business email is set up on this domain', status: 'warn', severity: 'medium', evidence: 'No mail servers (MX records) found for this domain.', whyItMatters: 'If staff use free mail like Gmail, the company cannot control or audit access to business data.', fix: 'Set up official email on your own domain.' }));
  checks.push(C(spf
    ? { id: 'spf', title: 'SPF record (who may send mail as you)', status: /[-~]all\b/.test(spf) ? 'pass' : 'warn', severity: 'medium', evidence: /[-~]all\b/.test(spf) ? 'SPF record found with an end rule.' : 'SPF found but it does not end with -all or ~all.', whyItMatters: 'Without SPF, anyone can pretend to send email from your domain.', fix: 'Publish an SPF record that lists only your real senders and ends with -all.' }
    : { id: 'spf', title: 'SPF record (who may send mail as you)', status: mx.length ? 'fail' : 'unknown', severity: 'medium', evidence: 'No SPF record found.', whyItMatters: 'Without SPF, anyone can pretend to send email from your domain.', fix: 'Publish an SPF record that lists only your real senders and ends with -all.' }));
  checks.push(C(dkim.length
    ? { id: 'dkim', title: 'DKIM signing', status: 'pass', severity: 'medium', evidence: `DKIM key found (selector: ${dkim.join(', ')}).`, whyItMatters: 'DKIM proves your email was not changed on the way.', fix: 'Keep DKIM enabled for every service that sends mail for you.' }
    : { id: 'dkim', title: 'DKIM signing', status: 'unknown', severity: 'medium', evidence: 'No DKIM key at the common selector names. Your provider may use a custom name.', whyItMatters: 'DKIM proves your email was not changed on the way.', fix: 'Ask your mail provider to confirm DKIM is on, and check it manually.' }));
  checks.push(C(!dmarc
    ? { id: 'dmarc', title: 'DMARC policy', status: mx.length ? 'fail' : 'unknown', severity: 'high', evidence: 'No DMARC record found.', whyItMatters: 'DMARC tells receivers to reject fake mail pretending to be you, a common route for phishing and data theft.', fix: 'Publish DMARC (start with p=none and reports, then move to quarantine and reject).' }
    : policy === 'none'
      ? { id: 'dmarc', title: 'DMARC policy', status: 'warn', severity: 'medium', evidence: 'DMARC exists but the policy is "none" (monitor only).', whyItMatters: 'Monitor-only does not stop fake mail.', fix: 'Move to p=quarantine, then p=reject, once reports look clean.' }
      : { id: 'dmarc', title: 'DMARC policy', status: 'pass', severity: 'medium', evidence: `DMARC policy is "${policy ?? 'set'}".`, whyItMatters: 'Receivers are told to act on fake mail.', fix: 'Keep reviewing DMARC reports.' }));
  checks.push(C({ id: 'mta-sts', title: 'MTA-STS and TLS reporting (extra)', status: mtaSts.length ? 'pass' : 'unknown', severity: 'low', evidence: mtaSts.length ? 'MTA-STS record found.' : 'Not found (optional, informational).', whyItMatters: 'Forces encrypted delivery of mail to your domain.', fix: 'Optional hardening for mature setups.' }));
  checks.push({ id: 'caa', title: 'CAA record (who may issue certificates)', area: 'security', status: caa.length ? 'pass' : 'unknown', severity: 'low', evidence: caa.length ? 'CAA record found.' : 'No CAA record (optional hardening).', whyItMatters: 'Limits which companies can issue certificates for your domain.', fix: 'Add a CAA record naming your certificate provider.', relatedService: 'Cloud and Server Security' });
  return { email: { mx, provider, spf, dmarc, dmarcPolicy: policy, dkim, mtaSts: mtaSts.length > 0, tlsRpt: tlsRpt.length > 0 }, checks };
}

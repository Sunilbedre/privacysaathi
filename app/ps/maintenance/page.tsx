import type { Metadata } from 'next';
import { Activity, ArrowRight, ArrowUpRight, Bell, CalendarCheck, DatabaseBackup, RefreshCw, Radar, ShieldCheck } from 'lucide-react';
import { PsLink } from '@/components/ps/PsCtx';
import { PS_SITE } from '@/lib/ps/config';

export const metadata: Metadata = { title: 'Website care and security maintenance', description: 'Managed website security and maintenance from Bedre: scans, updates, backups and monitoring.', alternates: { canonical: PS_SITE + '/maintenance' } };

const plans = [
  { n: 'Starter', d: 'For small sites that need the basics watched and kept current.', f: ['Monthly security and privacy re-scan', 'Alerts when something gets worse', 'Update and backup checklist for your site', 'Certificate and domain expiry reminders', 'Email support'] },
  { n: 'Standard', d: 'For business sites that change often and collect customer data.', hi: true, f: ['Everything in Starter', 'Core, plugin and theme updates applied', 'Backups with a restore check', 'Help fixing the top scan findings', 'Quarterly review call'] },
  { n: 'Managed', d: 'For businesses that want Bedre to own security and upkeep.', f: ['Everything in Standard', 'Security monitoring and incident support', 'Access, vendor and email security reviews', 'Staff awareness sessions', 'Named Bedre contact'] },
];
const covered = [
  [Radar, 'Monthly re-scan', 'Your security and privacy score, and what changed since last month.'],
  [RefreshCw, 'Updates applied', 'Core, plugins and themes kept current, so known holes get closed.'],
  [DatabaseBackup, 'Backups that restore', 'A backup you have never restored is a hope, not a backup.'],
  [Bell, 'Alerts and reminders', 'Certificate and domain expiry, and any finding that gets worse.'],
  [Activity, 'Monitoring and incident support', 'Someone watching, and someone to call, on the Managed plan.'],
  [CalendarCheck, 'Regular reviews', 'A review call each quarter on Standard and Managed.'],
] as const;
const rows: [string, boolean, boolean, boolean][] = [
  ['Monthly security and privacy re-scan', true, true, true], ['Alerts on regressions', true, true, true], ['Update and backup checklist', true, true, true], ['Expiry reminders (certificate, domain)', true, true, true], ['Email support', true, true, true],
  ['Updates applied for you', false, true, true], ['Backups with a restore check', false, true, true], ['Help fixing top findings', false, true, true], ['Quarterly review call', false, true, true],
  ['Security monitoring and incident support', false, false, true], ['Access, vendor and email reviews', false, false, true], ['Staff awareness sessions', false, false, true], ['Named Bedre contact', false, false, true],
];
const Tick = ({ v }: { v: boolean }) => <span className={v ? 'ps-yes' : 'ps-no'} aria-label={v ? 'Included' : 'Not included'}>{v ? '✓' : '–'}</span>;
const start = [['Scan', 'Free and read-only. Your score and top fixes in minutes.'], ['Review', 'A free 30-minute call with a Bedre consultant on your report.'], ['Onboard', 'We agree scope, get the access we need and set a baseline.'], ['Care', 'Monthly scans, updates, backups and monitoring begin.']];
const faqs = [
  ['Why does a website need ongoing care?', 'Software, plugins, certificates and vendors change constantly. A site that was secure last quarter can be exposed by one outdated plugin or an expired certificate. Regular scans and updates catch that early.'],
  ['Does this replace my developer or hosting?', 'No. Website care sits alongside them. We check, patch and watch, and we work with whoever built or hosts your site.'],
  ['What does it cost?', 'Pricing is not published yet. We share it after a short call, once we know your site and what you need.'],
  ['Is this legal advice or certification?', 'No. Bedre is a technology company, not a law firm. We handle the technical side. Legal advice and formal audits come from your own advisers.'],
  ['Can I start with the free scan first?', 'Yes. Most people do. Run the scan, read your report, and talk to us only if you want help.'],
];

export default function Maintenance() {
  return (
    <>
      <section className="ps-ch ps-wc"><div className="ps-wrap ps-ch-grid">
        <div>
          <span className="ps-rh-pill"><ShieldCheck size={14} aria-hidden /> Website care · security · upkeep</span>
          <h1>Keep your website <em>secure, current and watched.</em></h1>
          <p className="ps-ch-lead">Managed security and maintenance for business websites, from the team that builds and secures them. Scans, updates, backups and monitoring on a monthly plan.</p>
          <div className="ps-ch-cta">
            <PsLink href="/scan" className="ps-rh-btn">Start with a free scan <ArrowRight size={18} aria-hidden /></PsLink>
            <a href="#plans" className="ps-rh-ghost ps-ch-ghost">Compare plans</a>
          </div>
          <p className="ps-ch-draft">Plan contents are a draft and not final. Pricing is shared after a short call.</p>
        </div>
        <div className="ps-cd" role="img" aria-label="Illustrative website care dashboard showing score, updates, backups, certificate and uptime">
          <div className="cd-h"><span><i />example-company.in</span><em>Illustrative</em></div>
          <div className="cd-top">
            <div className="cd-ring" style={{ '--p': 74 } as React.CSSProperties}><div><b>74</b></div></div>
            <div><b>Security score</b><span>Re-scanned every month</span></div>
          </div>
          <div className="cd-grid">
            <div><small>Updates</small><b>12 / 12 applied</b></div>
            <div><small>Backup</small><b>Restore verified</b></div>
            <div><small>Certificate</small><b>74 days left</b></div>
            <div><small>Open alerts</small><b>0</b></div>
          </div>
          <div className="cd-up"><small>Uptime, last 30 days</small><div>{Array.from({ length: 30 }, (_, i) => <i key={i} className={i === 21 ? 'warn' : undefined} />)}</div></div>
        </div>
      </div></section>

      <div className="ps-wrap" id="plans">
        <div className="ps-plans ps-plans-up">{plans.map((p) => (
          <div className={`ps-plan${p.hi ? ' ps-hi' : ''}`} key={p.n}>
            {p.hi && <span className="ps-badge">Suits growing teams</span>}
            <h3>{p.n}</h3><p>{p.d}</p>
            <ul>{p.f.map((x) => <li key={x}>{x}</li>)}</ul>
            <div className="ps-price">Pricing on request</div>
            <PsLink href="/scan" className={`ps-btn${p.hi ? '' : ' ps-btn-ghost'}`}>Start with a free scan</PsLink>
          </div>))}</div>
      </div>

      <section className="ps-sec ps-s-grid ps-grp"><div className="ps-wrap ps-r2">
        <figure className="ps-duo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/ps/sec-disk.jpg" alt="Inside of a hard drive, representing backups" loading="lazy" width={1000} height={750} />
          <span className="ps-duo-n" aria-hidden="true">01</span>
          <figcaption><i>Covered</i>Checked, patched, backed up</figcaption>
        </figure>
        <div className="ps-r2-body">
          <span className="ps-eyebrow"><i>01</i> What is covered</span>
          <h2 className="ps-h2">The routine that stops small problems becoming incidents</h2>
          <p className="ps-sub">Six jobs, done every month or quarter, so your site does not quietly fall behind.</p>
          <ul className="ps-slist">{covered.map(([Icon, n, d]) => (
            <li key={n}><a href="#plans"><span className="ps-ico"><Icon size={20} aria-hidden /></span><span className="ps-sl-t"><b>{n}</b><span>{d}</span></span><ArrowUpRight size={18} aria-hidden className="ps-sl-go" /></a></li>))}</ul>
        </div>
      </div></section>

      <section className="ps-sec ps-s-steel"><div className="ps-wrap">
        <span className="ps-eyebrow"><i>02</i> Compare plans</span><h2 className="ps-h2">What is in each plan</h2>
        <div className="ps-tablewrap" style={{ marginTop: 28 }}><table className="ps-table"><thead><tr><th>Feature</th><th className="c">Starter</th><th className="c">Standard</th><th className="c">Managed</th></tr></thead>
          <tbody>{rows.map(([f, a, b, c]) => <tr key={f}><td>{f}</td><td className="c"><Tick v={a} /></td><td className="c"><Tick v={b} /></td><td className="c"><Tick v={c} /></td></tr>)}</tbody></table></div>
      </div></section>

      <section className="ps-sec ps-s-dark"><div className="ps-wrap">
        <span className="ps-eyebrow"><i>03</i> How it starts</span>
        <h2 className="ps-h2">From first scan to steady care</h2>
        <div className="ps-dsteps ps-dsteps4">{start.map(([t, b], i) => <div key={t}><i>{String(i + 1).padStart(2, '0')}</i><h3>{t}</h3><p>{b}</p></div>)}</div>
      </div></section>

      <section className="ps-sec ps-s-hatch ps-faq"><div className="ps-wrap ps-faq2">
        <div className="ps-faq2-l">
          <span className="ps-eyebrow"><i>04</i> Assurance</span>
          <h2 className="ps-h2">About website care</h2>
          <p className="ps-sub">Straight answers about what it is, what it is not, and what it costs.</p>
          <p style={{ marginTop: 24 }}><a href="https://bedreweb.com/contact" rel="noopener" className="ps-btn ps-btn-ghost">Talk to Bedre</a></p>
        </div>
        <div className="ps-faq-one">{faqs.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
      </div></section>

      <section className="ps-band"><div className="ps-wrap ps-band-in"><div><h2>Not sure which plan fits?</h2><p>Run the free scan. Your report shows what needs attention.</p></div><PsLink href="/scan" className="ps-btn ps-btn-white ps-btn-lg">Scan free <ArrowRight size={18} aria-hidden /></PsLink></div></section>
    </>
  );
}

import type { Metadata } from 'next';
import { ArrowRight, ClipboardList, Cookie, Download, FileText, FormInput, Lock, LockKeyhole, MailCheck, ShieldCheck } from 'lucide-react';
import RadarHero from '@/components/ps/RadarHero';
import LiveCountdown from '@/components/ps/LiveCountdown';
import { PsLink } from '@/components/ps/PsCtx';
import { dpdpDeadline, dpdpPenalties } from '@/content/dpdp';
import { PS_SITE } from '@/lib/ps/config';

export const metadata: Metadata = {
  title: { absolute: 'Privacy Saathi | Cyber security, privacy and website care' },
  description: 'Cyber security, privacy compliance and managed website care from Bedre Web Technologies. Check your website free, live.',
  alternates: { canonical: PS_SITE + '/' },
};

const trust = ['Technology partner, not a law firm', 'A service of Bedre Web Technologies, Bengaluru', 'Free, read-only scan', 'Findings kept, never your page content', 'Reports deleted after 90 days'];
const services = ['Security Consulting', 'Vulnerability Assessment', 'Zero Trust & MFA', 'Identity & Access Management', 'Email Security', 'Cloud & Server Security', 'Application Security', 'Security Monitoring', 'Backup & Recovery Security', 'Managed Security Partner Solutions'];
const covers = [[FileText, 'Privacy notice'], [FormInput, 'Consent on forms'], [Cookie, 'Cookies and trackers'], [LockKeyhole, 'HTTPS and headers'], [MailCheck, 'Email security'], [ClipboardList, 'Your own processes']] as const;

const method = [
  ['Scan', 'Free and read-only. Your score and top fixes in minutes.'],
  ['Review', 'A free 30-minute call with a Bedre consultant on your report.'],
  ['Fix', 'Security hardening, consent flows and cleanup, scoped as a project.'],
  ['Maintain', 'Monthly re-scans, updates and monitoring so it stays fixed.'],
];
const faqs = [
  ['What does Privacy Saathi do?', 'It is a service of Bedre Web Technologies for cyber security, privacy compliance and website care. You start with a free scan of your public website and email, and we can help fix and maintain what it finds.'],
  ['Is the scan safe for my website?', 'Yes. It only reads public information, the way a visitor or search engine would, plus DNS and TLS checks. It does not log in, submit forms, guess passwords or put load on your site.'],
  ['Are you a law firm?', 'No. Bedre is a technology company. We handle the technical side of security and privacy. Legal advice and formal audits come from your own advisers.'],
  ['What is included in website care?', 'Plan contents are being finalised. They centre on regular security and privacy re-scans, updates, backups and monitoring, with help fixing what turns up. See the plans page for the current draft.'],
  ['What does it cost?', 'The scan is free. Fix projects and monthly plans are priced after a short call, once we know your systems. We do not publish prices yet.'],
];

export default function PsHome() {
  return (
    <>
      <RadarHero
        pill="Cyber security · privacy · website care"
        title={<>Complete <em>cyber security</em> for your business.</>}
        lead="Check your website free, live. Then let Bedre's engineers fix it and keep it protected, every month."
      />

      <section className="ps-mq" aria-label="Who we are and what we cover">
        {[{ items: trust, dir: 'l', pills: false }, { items: services, dir: 'r', pills: true }].map((row) => (
          <div className={`ps-mq-row ps-mq-${row.dir}`} key={row.dir}>
            <div className="ps-mq-track">
              {[0, 1].map((copy) => (
                <ul key={copy} aria-hidden={copy === 1 ? true : undefined}>
                  {row.items.map((t) => <li key={t} className={row.pills ? 'is-pill' : undefined}>{t}</li>)}
                </ul>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="ps-sec ps-s-grid"><div className="ps-wrap">
        <span className="ps-eyebrow"><i>01</i> Practices</span>
        <h2 className="ps-h2">Three practices. One managed service.</h2>
        <p className="ps-sub">Security, privacy and website upkeep are usually three vendors. Here they are one team, one report and one monthly plan.</p>
        <div className="ps-prac">
          <article className="ps-vcard ps-prac-card">
            <div className="ps-vstage ps-pv" aria-hidden="true">
              <span className="pv-ring r1" /><span className="pv-ring r2" /><span className="pv-ring r3" />
              <div className="pv-shield"><ShieldCheck size={34} /></div>
              <span className="pv-tag t1"><i />TLS 1.3</span><span className="pv-tag t2"><i />MFA on</span><span className="pv-tag t3"><i />DMARC reject</span>
            </div>
            <small className="ps-pk">Cyber security</small>
            <h3>Find the weak points, then close them</h3>
            <ul className="ps-plist"><li>Security consulting and vulnerability assessment</li><li>Zero trust, multi-factor login and access control</li><li>Email, cloud, server and application security</li></ul>
            <PsLink href="/cybersecurity" className="ps-link ps-pl">See security services <ArrowRight size={15} aria-hidden /></PsLink>
          </article>
          <article className="ps-vcard ps-prac-card">
            <div className="ps-vstage ps-pv" aria-hidden="true">
              <div className="pv-toggles">
                <div><span>Necessary cookies</span><i className="on" /></div>
                <div><span>Analytics</span><i /></div>
                <div><span>Marketing</span><i /></div>
                <p>Consent recorded with time and notice version</p>
              </div>
            </div>
            <small className="ps-pk">Privacy and compliance</small>
            <h3>Handle personal data the way the law expects</h3>
            <ul className="ps-plist"><li>DPDP Act readiness for your website and processes</li><li>Consent, notices, cookies and trackers</li><li>Breach response planning and records</li></ul>
            <PsLink href="/dpdp" className="ps-link ps-pl">See the DPDP page <ArrowRight size={15} aria-hidden /></PsLink>
          </article>
          <article className="ps-vcard ps-prac-card">
            <div className="ps-vstage ps-pv" aria-hidden="true">
              <div className="pv-board">
                <div><span>Updates</span><b>12 / 12 applied</b></div>
                <div><span>Backup</span><b>Restore verified</b></div>
                <div className="pv-up"><span>Uptime</span>{Array.from({ length: 28 }, (_, i) => <i key={i} className={i === 19 ? 'warn' : undefined} />)}</div>
              </div>
            </div>
            <small className="ps-pk">Website care</small>
            <h3>Keep it patched, backed up and watched</h3>
            <ul className="ps-plist"><li>Monthly security and privacy re-scans</li><li>Updates, backups and restore checks</li><li>Monitoring, alerts and a named Bedre contact</li></ul>
            <PsLink href="/maintenance" className="ps-link ps-pl">See website care plans <ArrowRight size={15} aria-hidden /></PsLink>
          </article>
        </div>
        <p className="ps-vnote">Illustrations are examples, not live data.</p>
      </div></section>

      <section className="ps-sec ps-s-steel"><div className="ps-wrap">
        <span className="ps-eyebrow"><i>02</i> The free check</span>
        <h2 className="ps-h2">Know where you stand, and what to do next</h2>
        <div className="ps-vcards">
          <article className="ps-vcard">
            <div className="ps-vstage ps-v-gauge" aria-hidden="true">
              <div className="ps-g-ring"><div><b>74</b><small>quick score</small></div></div>
              <span className="ps-v-float f1"><i /> DPDP readiness <b>68</b></span>
              <span className="ps-v-float f2"><i /> Security hygiene <b>81</b></span>
              <span className="ps-v-float f3">Well on your way</span>
            </div>
            <h3>A clear score</h3>
            <p>One number for DPDP readiness and one for security, so you know exactly where you stand.</p>
          </article>
          <article className="ps-vcard">
            <div className="ps-vstage ps-v-fixes" aria-hidden="true">
              <ol>
                <li><em>1</em><span>Add a consent line beside the form</span><span className="ps-chip fail">Fix needed</span></li>
                <li><em>2</em><span>Move DMARC to quarantine</span><span className="ps-chip warn">Attention</span></li>
                <li><em>3</em><span>Add a Content-Security-Policy</span><span className="ps-chip warn">Attention</span></li>
                <li><em>4</em><span>Name a privacy contact</span><span className="ps-chip">Low effort</span></li>
              </ol>
            </div>
            <h3>Your top five fixes</h3>
            <p>What to do first, why it matters and how big the job is, in plain words.</p>
          </article>
          <article className="ps-vcard">
            <div className="ps-vstage ps-v-doc" aria-hidden="true">
              <div className="ps-sheet back" />
              <div className="ps-sheet">
                <div className="ps-sheet-h"><span /><b>74</b></div>
                <i className="w90" /><i className="w70" /><i className="w80" />
                <div className="ps-sheet-row"><span className="ps-chip pass">Pass</span><i className="w50" /></div>
                <div className="ps-sheet-row"><span className="ps-chip warn">Review</span><i className="w60" /></div>
              </div>
              <span className="ps-v-float f4"><Download size={13} /> Save as PDF</span>
              <span className="ps-v-float f5"><Lock size={13} /> Private link</span>
            </div>
            <h3>A report you can share</h3>
            <p>Private link, save as PDF, and a free review with a Bedre consultant if you want one.</p>
          </article>
        </div>
        <p className="ps-vnote">Illustrations show what a report looks like. They are not real results.</p>
        <ul className="ps-covers2" aria-label="What the scan covers">
          {covers.map(([Icon, t]) => <li key={t}><Icon size={17} aria-hidden /><span>{t}</span></li>)}
        </ul>
      </div></section>

      <section className="ps-sec ps-s-dark"><div className="ps-wrap">
        <span className="ps-eyebrow"><i>03</i> Method</span>
        <h2 className="ps-h2">From first scan to ongoing protection</h2>
        <div className="ps-dsteps ps-dsteps4">{method.map(([t, b], i) => <div key={t}><i>{String(i + 1).padStart(2, '0')}</i><h3>{t}</h3><p>{b}</p></div>)}</div>
        <p style={{ marginTop: 36 }}><PsLink href="/scan" className="ps-btn ps-btn-lg">Start with a free scan <ArrowRight size={18} aria-hidden /></PsLink></p>
      </div></section>

      <section className="ps-sec ps-s-spot"><div className="ps-wrap ps-spot">
        <div>
          <span className="ps-eyebrow"><i>04</i> Compliance spotlight</span>
          <h2 className="ps-h2">Privacy law is now a security problem too</h2>
          <p className="ps-sub">India&apos;s DPDP Act expects reasonable security safeguards, and sets fines for failing to keep them. Most duties apply around 13 May 2027.</p>
          <div className="ps-light"><LiveCountdown date={dpdpDeadline} /></div>
          <p style={{ marginTop: 26 }}><PsLink href="/dpdp" className="ps-btn">Open the DPDP page <ArrowRight size={16} aria-hidden /></PsLink></p>
        </div>
        <div className="ps-pen">
          <div className="ps-pen-h">Maximum penalties under the Act</div>
          {dpdpPenalties.map(([a, b], i) => (
            <div className="ps-pen-row" key={a}>
              <b>{a.replace('Up to ', '')}</b>
              <div className="ps-pen-bar" aria-hidden="true"><i style={{ width: `${[100, 80, 60][i]}%` }} /></div>
              <p>{b}</p>
            </div>))}
          <p className="ps-note">Dates and fines are from published summaries of the DPDP Act, 2023 and Rules, 2025. Confirm with your legal adviser.</p>
        </div>
      </div></section>

      <section className="ps-sec ps-s-hatch ps-faq"><div className="ps-wrap ps-faq2">
        <div className="ps-faq2-l">
          <span className="ps-eyebrow"><i>05</i> Assurance</span>
          <h2 className="ps-h2">Common questions</h2>
          <p className="ps-sub">Straight answers about what we do, what we do not, and what it costs.</p>
          <p style={{ marginTop: 24 }}><a href="https://bedreweb.com/contact" rel="noopener" className="ps-btn ps-btn-ghost">Talk to Bedre</a></p>
        </div>
        <div className="ps-faq-one">{faqs.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
      </div></section>

      <section className="ps-band"><div className="ps-wrap ps-band-in">
        <div><h2>Find out where your security stands</h2><p>Free, read-only and done in about five minutes.</p></div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}><PsLink href="/scan" className="ps-btn ps-btn-white ps-btn-lg">Scan my website free <ArrowRight size={18} aria-hidden /></PsLink><a href="https://bedreweb.com/contact" rel="noopener" className="ps-btn ps-btn-line ps-btn-lg">Talk to Bedre</a></div>
      </div></section>

      <div className="ps-sticky"><a href="https://bedreweb.com/contact" rel="noopener" className="ps-btn ps-btn-ghost">Talk to Bedre</a><PsLink href="/scan" className="ps-btn">Scan free</PsLink></div>
    </>
  );
}

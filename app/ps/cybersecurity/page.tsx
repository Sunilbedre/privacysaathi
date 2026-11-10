import type { Metadata } from 'next';
import { Activity, ArrowRight, ArrowUpRight, Bug, Cloud, Code, DatabaseBackup, Handshake, KeyRound, MailCheck, ShieldCheck, Users } from 'lucide-react';
import { PsLink } from '@/components/ps/PsCtx';
import { services } from '@/content';
import { serviceHref } from '@/lib/catalog';
import { PS_SITE } from '@/lib/ps/config';

export const metadata: Metadata = { title: 'Cyber security services', description: 'Assess, protect and monitor: practical cyber security services from Bedre, in plain language.', alternates: { canonical: PS_SITE + '/cybersecurity' } };

// Names match the Bedre catalogue exactly (it uses "&"), so every card links to its real service page.
const groups = [
  { id: 'assess', n: '01', k: 'Assess', t: 'Know what is exposed', lead: 'Start with facts. We map what an attacker could see and reach, then rank the fixes by risk.', surface: 'ps-s-grid',
    img: '/images/ps/sec-desk.jpg', alt: 'Two people reviewing a security plan at a desk', cap: 'Findings ranked by risk',
    items: [[ShieldCheck, 'Security Consulting', 'A clear plan for what to fix first, in business language.'], [Bug, 'Vulnerability Assessment', 'Find weaknesses in your site and systems before attackers do.']] },
  { id: 'protect', n: '02', k: 'Protect', t: 'Close the doors', lead: 'Stop stolen passwords, spoofed email and exposed servers from becoming incidents.', surface: 'ps-s-steel',
    img: '/images/ps/sec-lock.jpg', alt: 'A padlock resting on a laptop keyboard', cap: 'Layered controls, not one tool',
    items: [[KeyRound, 'Zero Trust & MFA', 'Stop stolen passwords from being enough to get in.'], [Users, 'Identity & Access Management', 'The right people with the right access, nothing more.'], [MailCheck, 'Email Security', 'SPF, DKIM, DMARC and protection against phishing.'], [Cloud, 'Cloud & Server Security', 'Secure hosting, certificates and server settings.'], [Code, 'Application Security', 'Safer websites and apps, from headers to code review.']] },
  { id: 'monitor', n: '03', k: 'Monitor and recover', t: 'Notice quickly, recover fast', lead: 'Assume something will eventually go wrong. Be ready to see it early and get back up fast.', surface: 'ps-s-hatch',
    img: '/images/ps/sec-server.jpg', alt: 'Rows of servers in a dark data room', cap: 'Watched, backed up, recoverable',
    items: [[Activity, 'Security Monitoring', 'Know quickly when something goes wrong.'], [DatabaseBackup, 'Backup & Recovery Security', 'Get back up fast after an incident or ransomware.'], [Handshake, 'Managed Security Partner Solutions', 'Ongoing security run with trusted partners.']] },
] as const;

const layers = ['Monitoring', 'Identity and email', 'Applications', 'Cloud and servers', 'Data and backups'];
const method = [['Scan', 'A free, read-only look at your public website and email.'], ['Assess', 'We confirm findings and rank them by real risk.'], ['Harden', 'Fixes across identity, email, cloud, servers and applications.'], ['Watch', 'Monitoring, backups and monthly re-scans keep it that way.']];

export default function Cyber() {
  return (
    <>
      <section className="ps-ch"><div className="ps-wrap ps-ch-grid">
        <div>
          <span className="ps-rh-pill"><ShieldCheck size={14} aria-hidden /> Ten services · one security team</span>
          <h1>Assess. Protect. <em>Monitor.</em></h1>
          <p className="ps-ch-lead">Practical cyber security for business websites, email and cloud. Built in layers, explained in plain words, and run by the engineers who fix it.</p>
          <div className="ps-ch-cta">
            <PsLink href="/scan" className="ps-rh-btn">Scan my website free <ArrowRight size={18} aria-hidden /></PsLink>
            <a href="https://bedreweb.com/contact" rel="noopener" className="ps-rh-ghost ps-ch-ghost">Talk to Bedre</a>
          </div>
          <ul className="ps-ch-nav" aria-label="Jump to">{groups.map((g) => <li key={g.id}><a href={`#${g.id}`}><i>{g.n}</i>{g.k}</a></li>)}</ul>
        </div>
        <div className="ps-dd" role="img" aria-label="Defence in depth: five layers of protection around your business">
          <span className="ps-dd-ring r5" /><span className="ps-dd-ring r4" /><span className="ps-dd-ring r3" /><span className="ps-dd-ring r2" /><span className="ps-dd-ring r1" />
          <div className="ps-dd-core"><ShieldCheck size={30} aria-hidden /><b>Your business</b></div>
          {layers.map((l, i) => <span key={l} className={`ps-dd-tag t${i + 1}`}><i />{l}</span>)}
        </div>
      </div></section>

      <nav className="ps-subnav" aria-label="Jump to a service"><div className="ps-subnav-in">
        {groups.map((g) => (
          <div className="ps-sn-g" key={g.id}>
            <a className="ps-sn-h" href={`#${g.id}`}><i>{g.n}</i>{g.k}</a>
            {g.items.map(([Icon, n]) => <a className="ps-sn-i" key={n} href={`#${g.id}`}><Icon size={15} aria-hidden />{n}</a>)}
          </div>))}
      </div></nav>

      {groups.map((g, gi) => (
        <section id={g.id} className={`ps-sec ${g.surface} ps-grp`} key={g.id}><div className={`ps-wrap ps-r2${gi % 2 ? ' rev' : ''}`}>
          <figure className="ps-duo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={g.img} alt={g.alt} loading="lazy" width={1000} height={667} />
            <span className="ps-duo-n" aria-hidden="true">{g.n}</span>
            <figcaption><i>{g.k}</i>{g.cap}</figcaption>
          </figure>
          <div className="ps-r2-body">
            <span className="ps-eyebrow"><i>{g.n}</i> {g.k}</span>
            <h2 className="ps-h2">{g.t}</h2>
            <p className="ps-sub">{g.lead}</p>
            <ul className="ps-slist">{g.items.map(([Icon, n, d]) => { const sv = services.find((x) => x.name === n); return (
              <li key={n}>
                <a href={sv ? `https://bedreweb.com${serviceHref(sv)}` : '#'} rel="noopener">
                  <span className="ps-ico"><Icon size={20} aria-hidden /></span>
                  <span className="ps-sl-t"><b>{n}</b><span>{d}</span></span>
                  <ArrowUpRight size={18} aria-hidden className="ps-sl-go" />
                </a>
              </li>); })}</ul>
          </div>
        </div></section>))}

      <section className="ps-sec ps-s-dark"><div className="ps-wrap">
        <span className="ps-eyebrow"><i>04</i> How an engagement runs</span>
        <h2 className="ps-h2">From first scan to steady protection</h2>
        <div className="ps-dsteps ps-dsteps4">{method.map(([t, b], i) => <div key={t}><i>{String(i + 1).padStart(2, '0')}</i><h3>{t}</h3><p>{b}</p></div>)}</div>
      </div></section>

      <section className="ps-band"><div className="ps-wrap ps-band-in"><div><h2>Start with what your scan finds</h2><p>Know which of these you actually need before you spend anything.</p></div><PsLink href="/scan" className="ps-btn ps-btn-white ps-btn-lg">Scan free <ArrowRight size={18} aria-hidden /></PsLink></div></section>
    </>
  );
}

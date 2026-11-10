import type { Metadata } from 'next';
import { ArrowRight, BookOpenCheck, Clock3, Users } from 'lucide-react';
import Checklist from '@/components/ps/Checklist';
import LiveCountdown from '@/components/ps/LiveCountdown';
import DpdpCheck from '@/components/ps/DpdpCheck';
import { PsLink } from '@/components/ps/PsCtx';
import { dpdpChecks, dpdpDeadline, dpdpDuties, dpdpFaqs, dpdpPenalties, dpdpSteps, dpdpTimeline, dpdpWhat } from '@/content/dpdp';
import { PS_SITE } from '@/lib/ps/config';

export const metadata: Metadata = {
  title: 'DPDP Act readiness check',
  description: 'Check your website for India’s DPDP Act readiness free. See the deadline, the eight duties, fines and a self-check, in plain words.',
  alternates: { canonical: PS_SITE + '/dpdp' },
};

export default function DpdpPage() {
  return (
    <>
      <DpdpCheck />

      <section className="ps-sec ps-s-time"><div className="ps-wrap">
        <span className="ps-eyebrow"><i>01</i> The deadline</span>
        <div className="ps-stakes">
          <div><span className="ps-eyebrow ps-eyebrow-on">Main duties apply</span><LiveCountdown date={dpdpDeadline} /><div className="ps-days-l">until around 13 May 2027</div></div>
          <ul>{dpdpPenalties.map(([a, b]) => <li key={a}><b>{a}</b><span>{b}</span></li>)}</ul>
        </div>
        <p className="ps-note" style={{ marginTop: 12 }}>Dates and fines are from published summaries of the DPDP Act, 2023 and Rules, 2025, not the Gazette. Confirm with your legal adviser.</p>
      </div></section>

      <section className="ps-sec ps-s-grid ps-grp"><div className="ps-wrap ps-r2">
        <figure className="ps-duo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/ps/sec-door.jpg" alt="A smart lock controlled from a phone, representing control over personal data" loading="lazy" width={1000} height={667} />
          <span className="ps-duo-n" aria-hidden="true">02</span>
          <figcaption><i>The Act</i>Personal data, handled with care</figcaption>
        </figure>
        <div className="ps-r2-body">
          <span className="ps-eyebrow"><i>02</i> The basics</span>
          <h2 className="ps-h2">The DPDP Act in plain words</h2>
          <ul className="ps-slist">{dpdpWhat.map(([t, b], i) => { const Icon = [BookOpenCheck, Users, Clock3][i] ?? BookOpenCheck; return (
            <li key={t}><div className="ps-sl-row"><span className="ps-ico"><Icon size={20} aria-hidden /></span><span className="ps-sl-t"><b>{t}</b><span>{b}</span></span></div></li>); })}</ul>
        </div>
      </div></section>

      <section className="ps-sec ps-s-steel"><div className="ps-wrap">
        <span className="ps-eyebrow"><i>03</i> The eight duties</span>
        <h2 className="ps-h2">What the law asks of a business</h2>
        <div className="ps-grid ps-grid-4">{dpdpDuties.map((d, i) => <div className="ps-card" key={d.title}><span className="ps-duty-n">{i + 1}</span><h3>{d.title}</h3><p>{d.body}</p></div>)}</div>
      </div></section>

      <section className="ps-sec ps-s-dark"><div className="ps-wrap">
        <span className="ps-eyebrow"><i>04</i> Road to compliance</span>
        <h2 className="ps-h2">Six steps from here to ready</h2>
        <figure className="ps-duo ps-wide">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/ps/sec-server.jpg" alt="Rows of servers in a dark data room" loading="lazy" width={1100} height={617} />
          <figcaption><i>Roadmap</i>Map it, fix it, prove it, keep it</figcaption>
        </figure>
        <div className="ps-dsteps">{dpdpSteps.map(([t, b], i) => <div key={t}><i>{String(i + 1).padStart(2, '0')}</i><h3>{t}</h3><p>{b}</p></div>)}</div>
        <p style={{ marginTop: 36 }}><PsLink href="/scan" className="ps-btn ps-btn-lg">Start with a free scan <ArrowRight size={18} aria-hidden /></PsLink></p>
      </div></section>

      <section className="ps-sec"><div className="ps-wrap ps-split">
        <div>
          <span className="ps-eyebrow"><i>05</i> Timeline</span>
          <h2 className="ps-h2">Key dates</h2>
          <ol className="ps-tl">{dpdpTimeline.map((t) => <li key={t.when}><b>{t.when}</b><div><h3>{t.title}</h3><p>{t.body}</p></div></li>)}</ol>
          <figure className="ps-duo ps-duo-s">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/ps/sec-keys.jpg" alt="A padlock on a keyboard" loading="lazy" width={1000} height={668} />
            <figcaption><i>Prepare</i>The dates are fixed. Your readiness is not.</figcaption>
          </figure>
        </div>
        <div>
          <span className="ps-eyebrow"><i>06</i> Self-check</span>
          <h2 className="ps-h2">Ten things to have in place</h2>
          <div style={{ marginTop: 24 }}><Checklist items={dpdpChecks} /></div>
        </div>
      </div></section>

      <section className="ps-sec ps-s-hatch ps-faq"><div className="ps-wrap">
        <span className="ps-eyebrow"><i>07</i> Assurance</span>
        <h2 className="ps-h2">DPDP questions</h2>
        <div className="ps-faq-one">{dpdpFaqs.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}</div>
      </div></section>

      <section className="ps-band"><div className="ps-wrap ps-band-in">
        <div><h2>Know where your website stands today</h2><p>Free, read-only, about five minutes. We are a technology partner, not a law firm.</p></div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}><PsLink href="/scan" className="ps-btn ps-btn-white ps-btn-lg">Scan my website free <ArrowRight size={18} aria-hidden /></PsLink><PsLink href="/maintenance" className="ps-btn ps-btn-line ps-btn-lg">See website care</PsLink></div>
      </div></section>
    </>
  );
}

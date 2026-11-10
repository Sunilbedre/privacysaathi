import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardCheck, Clock, FileSearch, Globe2, KeyRound, ListChecks, MapPin, PhoneCall, ShieldAlert, Users } from 'lucide-react';
import { dpdpDeadline, dpdpDuties } from '@/content/dpdp';
import LpForm from '@/components/lp/LpForm';
import DaysLeft from '@/components/lp/DaysLeft';
import FaqAccordion from '@/components/service/FaqAccordion';
import Reveal from '@/components/service/Reveal';

export const metadata: Metadata = {
  title: { absolute: 'Free DPDP readiness review for your business | Bedre Web Technologies' },
  description: 'Is your website and data handling ready for India’s DPDP law? Get a free readiness review from Bedre’s technology team.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/dpdp' },
};

const COVERS = [
  [FileSearch, 'Your website’s data collection', 'Where your forms, chat, tracking and cookies collect personal data, and whether each one shows a clear notice.'],
  [ClipboardCheck, 'Consent and notice', 'Whether you record who agreed to what, and whether people can withdraw as easily as they agreed.'],
  [KeyRound, 'Security basics', 'Logins and multi-factor access, encryption, backups and logs: the safeguards the law expects you to have.'],
  [ListChecks, 'A short list of priorities', 'The biggest gaps first, in plain language, with the technical fix for each one.'],
] as const;

const STEPS = [
  ['Tell us about your business', 'Fill in the short form above. It takes about 30 seconds.'],
  ['We review your website', 'A Bedre consultant looks at your site and how it collects personal data.'],
  ['We talk it through', 'A 30-minute call to walk through the gaps and plan the fixes. No obligation.'],
] as const;

const WHY = [
  [Users, 'One accountable team', 'Consulting, build and ongoing support from the same people, so nothing is lost between hand-offs.'],
  [ShieldAlert, 'We fix the technology', 'Consent flows, access control, encryption, logging, backups and breach readiness, built and tested.'],
  [Globe2, 'Plain language, no jargon', 'You get clear next steps, not a 40-page report. Your legal adviser confirms what the law requires.'],
  [MapPin, 'Based in Bengaluru', 'Serving businesses in India, the UAE, the UK, the US and Australia.'],
] as const;

const FAQS = [
  { q: 'Is the review really free?', a: 'Yes. The readiness review and the 30-minute call are free and carry no obligation. If you want help fixing things, a consultant will explain the scope and price in writing first.' },
  { q: 'Does the DPDP law apply to a small business?', a: 'Yes. It applies to any organisation that handles personal data of people in India, whatever its size. Companies outside India that serve people in India can also be covered.' },
  { q: 'When do I need to be ready?', a: 'The detailed Rules were notified in November 2025. Most duties for businesses start about 18 months later, around May 2027. Confirm the exact dates with your legal adviser.' },
  { q: 'Do you give legal advice or certify compliance?', a: 'No. Bedre is a technology company, not a law firm. We review and fix the technical side, and your legal adviser confirms what the law requires of your business.' },
  { q: 'Why do you need my official email, website and phone number?', a: 'So a consultant can look at your real website before the call, send the summary to a business address, and call you at a time that suits you. Personal email addresses cannot be matched to a company.' },
];

export default function DpdpLanding() {
  return (
    <div className="lp-root">
      <header className="lp-top">
        <div className="wrap lp-top-in">
          <Link href="/" className="lp-logo" aria-label="Bedre Web Technologies home"><span /><b>Bedre</b></Link>
          <span className="lp-top-note"><Clock size={15} /> Free review · reply within one working day</span>
          <a className="btn pri sm" href="#lead-form">Get my free review</a>
        </div>
      </header>

      <section className="lp-hero">
        <div className="lp-aur" aria-hidden="true"><i /><i /><i /></div>
        <div className="wrap lp-hero-grid">
          <div className="lp-hero-tx">
            <span className="lp-pill"><AlertTriangle size={14} /> India’s DPDP law · penalties up to ₹250 crore</span>
            <h1 className="lp-h1">Is your business <em>DPDP-ready?</em></h1>
            <p className="lp-sub">The main duties start around May 2027. Get a free readiness review of your website and how it handles personal data, from Bedre’s technology team.</p>
            <ul className="lp-ticks">
              <li><CheckCircle2 size={20} /> We review your forms, cookies, consent and privacy notice</li>
              <li><CheckCircle2 size={20} /> You get your biggest gaps in plain language</li>
              <li><CheckCircle2 size={20} /> A free 30-minute call to plan the fixes. No obligation</li>
            </ul>
            <div className="lp-clock"><b><DaysLeft date={dpdpDeadline} /></b><span>days to the main duties<br /><small>around 13 May 2027</small></span></div>
          </div>
          <div className="lp-card"><LpForm thanksHref="/lp/dpdp/thanks" /></div>
        </div>
      </section>

      <section className="lp-strip">
        <div className="wrap lp-strip-in">
          <span><PhoneCall size={16} /> Technology partner, not a law firm</span>
          <span><MapPin size={16} /> Bengaluru · serving India, UAE, UK, US, Australia</span>
          <span><ShieldAlert size={16} /> 108 services, one accountable team</span>
        </div>
      </section>

      <section className="lp-sec">
        <div className="wrap">
          <Reveal className="lp-head"><span>Why act now</span><h2>The cost of waiting is high</h2><p>These are the figures behind the law, from public summaries of the Act and Rules.</p></Reveal>
          <div className="lp-stats">
            <Reveal className="lp-stat"><b>₹250 cr</b><p>Maximum fine for failing to keep reasonable security safeguards.</p></Reveal>
            <Reveal className="lp-stat" delay={80}><b>72 hrs</b><p>To send the Data Protection Board a detailed report after a breach.</p></Reveal>
            <Reveal className="lp-stat" delay={160}><b>18 months</b><p>From the Rules’ publication in November 2025 until most duties apply.</p></Reveal>
          </div>
        </div>
      </section>

      <section className="lp-sec lp-alt">
        <div className="wrap">
          <Reveal className="lp-head"><span>Your free review</span><h2>What we look at</h2><p>A technology review of your public website and data handling. It is not a legal opinion.</p></Reveal>
          <div className="lp-covers">
            {COVERS.map(([Ic, h, p], i) => (
              <Reveal key={h} delay={i * 70} className="lp-cover"><span><Ic size={24} /></span><b>{h}</b><p>{p}</p></Reveal>
            ))}
          </div>
          <div className="lp-mid"><a className="btn pri lp-big" href="#lead-form">Get my free review <ArrowRight size={18} /></a></div>
        </div>
      </section>

      <section className="lp-sec">
        <div className="wrap">
          <Reveal className="lp-head"><span>How it works</span><h2>Three simple steps</h2></Reveal>
          <ol className="lp-steps">
            {STEPS.map(([h, p], i) => <Reveal as="li" key={h} delay={i * 80} className="lp-step"><em>{i + 1}</em><b>{h}</b><p>{p}</p></Reveal>)}
          </ol>
        </div>
      </section>

      <section className="lp-sec lp-alt">
        <div className="wrap">
          <Reveal className="lp-head"><span>What the law asks</span><h2>Eight duties every business should know</h2><p>Each one is also a technology task: forms, systems, security and records.</p></Reveal>
          <div className="lp-duties">
            {dpdpDuties.map((d, i) => <Reveal key={d.title} delay={(i % 4) * 60} className="lp-duty"><em>{String(i + 1).padStart(2, '0')}</em><b>{d.title}</b><p>{d.body}</p></Reveal>)}
          </div>
        </div>
      </section>

      <section className="lp-sec">
        <div className="wrap">
          <Reveal className="lp-head"><span>Why Bedre</span><h2>The technology side, done properly</h2></Reveal>
          <div className="lp-why">
            {WHY.map(([Ic, h, p], i) => <Reveal key={h} delay={i * 70} className="lp-w"><span><Ic size={22} /></span><div><b>{h}</b><p>{p}</p></div></Reveal>)}
          </div>
        </div>
      </section>

      <section className="lp-sec lp-alt">
        <div className="wrap lp-faq">
          <div className="lp-faq-side"><span className="lp-pill">Questions</span><h2>Quick answers</h2><p>Not here? Ask on the form and a consultant will reply.</p></div>
          <FaqAccordion faqs={FAQS} />
        </div>
      </section>

      <section className="lp-final">
        <div className="wrap lp-final-grid">
          <div>
            <h2>Find your gaps before the deadline does.</h2>
            <p>Get your free DPDP readiness review. A consultant replies within one working day.</p>
            <ul className="lp-ticks"><li><CheckCircle2 size={20} /> Free, with no obligation</li><li><CheckCircle2 size={20} /> Plain-language summary</li><li><CheckCircle2 size={20} /> Technology team, not a sales script</li></ul>
          </div>
          <div className="lp-card"><LpForm id="lead-form-2" thanksHref="/lp/dpdp/thanks" /></div>
        </div>
      </section>

      <footer className="lp-foot">
        <div className="wrap lp-foot-in">
          <div className="lp-foot-top">
            <Link href="/" className="lp-logo" aria-label="Bedre Web Technologies home"><span /><b>Bedre</b></Link>
            <nav className="lp-foot-links" aria-label="Footer">
              <Link href="/privacy">Privacy notice</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/dpdp">Read the full DPDP guide</Link>
              <Link href="/contact">Contact us</Link>
            </nav>
          </div>
          <p className="lp-foot-fine">Bedre Web Technologies Pvt. Ltd., JP Nagar, Bengaluru, India. This page is general information, not legal advice. Bedre does not certify compliance. Read the Act and Rules and take legal advice before you rely on any date or detail.</p>
        </div>
      </footer>

      <div className="lp-sticky"><a className="btn pri" href="#lead-form">Get my free DPDP review <ArrowRight size={16} /></a></div>
    </div>
  );
}

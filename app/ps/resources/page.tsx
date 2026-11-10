import type { Metadata } from 'next';
import { ArrowRight, ArrowUpRight, BookOpenCheck, ListChecks, MessageCircleQuestion } from 'lucide-react';
import Checklist from '@/components/ps/Checklist';
import { PsLink } from '@/components/ps/PsCtx';
import { dpdpChecks, dpdpDuties, dpdpFaqs, dpdpSources } from '@/content/dpdp';
import { PS_SITE } from '@/lib/ps/config';

export const metadata: Metadata = { title: 'DPDP guide and checklist', description: 'The eight duties of the DPDP Act in plain language, a self-check list, common questions and sources.', alternates: { canonical: PS_SITE + '/resources' } };

const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };

export default function Resources() {
  return (
    <>
      <section className="ps-ch ps-rs"><div className="ps-wrap ps-ch-grid">
        <div>
          <span className="ps-rh-pill"><BookOpenCheck size={14} aria-hidden /> Guides · checklist · answers</span>
          <h1>The DPDP Act in <em>plain language.</em></h1>
          <p className="ps-ch-lead">The eight duties, a ten-point self-check and straight answers to common questions. No legal jargon, and no signup.</p>
          <p className="ps-ch-draft">Facts come from published summaries, not the Gazette. Confirm dates, fines and wording with your legal adviser.</p>
          <ul className="ps-ch-nav" aria-label="Jump to">
            <li><a href="#duties"><i>01</i>Eight duties</a></li><li><a href="#check"><i>02</i>Self-check</a></li><li><a href="#faq"><i>03</i>Questions</a></li><li><a href="#sources"><i>04</i>Sources</a></li>
          </ul>
        </div>
        <div className="ps-d3" role="img" aria-label="Three guide cards: the eight duties, a self-check and common questions">
          <div className="d d1"><span><BookOpenCheck size={18} aria-hidden /></span><b>The eight duties</b><em>What the law asks of a business</em><i /><i className="s" /><i /></div>
          <div className="d d2"><span><ListChecks size={18} aria-hidden /></span><b>Ten-point self-check</b><em>Tick what you already have</em><u><s className="on" /><i /></u><u><s className="on" /><i className="s" /></u><u><s /><i /></u></div>
          <div className="d d3"><span><MessageCircleQuestion size={18} aria-hidden /></span><b>Common questions</b><em>Plain answers</em><i /><i className="s" /></div>
        </div>
      </div></section>

      <section id="duties" className="ps-sec ps-s-grid"><div className="ps-wrap">
        <span className="ps-eyebrow"><i>01</i> The eight duties</span>
        <h2 className="ps-h2">What the law asks of a business</h2>
        <p className="ps-sub">Every finding in a Privacy Saathi report maps to one of these.</p>
        <div className="ps-duties">{dpdpDuties.map((d, i) => (
          <article className="ps-duty2" key={d.title}><span>{String(i + 1).padStart(2, '0')}</span><h3>{d.title}</h3><p>{d.body}</p></article>))}</div>
      </div></section>

      <section id="check" className="ps-sec ps-s-steel ps-grp"><div className="ps-wrap ps-r2 rev">
        <figure className="ps-duo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/ps/sec-desk.jpg" alt="Two people reviewing a checklist at a desk" loading="lazy" width={1000} height={668} />
          <span className="ps-duo-n" aria-hidden="true">02</span>
          <figcaption><i>Self-check</i>Know your gaps in five minutes</figcaption>
        </figure>
        <div className="ps-r2-body">
          <span className="ps-eyebrow"><i>02</i> Self-check</span>
          <h2 className="ps-h2">Ten things to have in place</h2>
          <p className="ps-sub">Tick what your business already does. Your ticks stay in this browser only.</p>
          <div className="ps-chk-card"><Checklist items={dpdpChecks} /></div>
          <p style={{ marginTop: 20 }}><PsLink href="/scan" className="ps-link">Let the scan check your website for you <ArrowRight size={16} aria-hidden /></PsLink></p>
        </div>
      </div></section>

      <section id="faq" className="ps-sec ps-s-hatch ps-faq"><div className="ps-wrap ps-faq2">
        <div className="ps-faq2-l">
          <span className="ps-eyebrow"><i>03</i> Questions</span>
          <h2 className="ps-h2">Common questions</h2>
          <p className="ps-sub">Short answers to what businesses ask first.</p>
          <p style={{ marginTop: 24 }}><PsLink href="/dpdp" className="ps-btn ps-btn-ghost">Open the DPDP page</PsLink></p>
        </div>
        <div className="ps-faq-one">{dpdpFaqs.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}</div>
      </div></section>

      <section id="sources" className="ps-sec ps-s-grid"><div className="ps-wrap">
        <span className="ps-eyebrow"><i>04</i> Sources</span>
        <h2 className="ps-h2">Where these facts come from</h2>
        <p className="ps-sub">Published law-firm and advisory summaries. Always confirm against the Gazette and with your own adviser.</p>
        <ul className="ps-srcs">{dpdpSources.map((s) => (
          <li key={s[1]}><a href={s[1]} rel="noopener"><span><b>{s[0]}</b><em>{host(s[1])}</em></span><ArrowUpRight size={18} aria-hidden /></a></li>))}</ul>
      </div></section>

      <section className="ps-band"><div className="ps-wrap ps-band-in"><div><h2>Turn the checklist into a real score</h2><p>Free, read-only and done in about five minutes.</p></div><PsLink href="/scan" className="ps-btn ps-btn-white ps-btn-lg">Scan my website free <ArrowRight size={18} aria-hidden /></PsLink></div></section>
    </>
  );
}

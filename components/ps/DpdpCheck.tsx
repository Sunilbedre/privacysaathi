'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CircleAlert, CircleCheck, CircleHelp, FileSearch, Lock, RotateCcw, ShieldAlert, X } from 'lucide-react';
import { crore, firstSentence, type DpdpSummary, type DutyRow, type DutyStatus } from '@/lib/ps/dpdp-map';
import { emailProblem, parseWebsite, phoneProblem } from '@/lib/lead-rules';
import { PS_CONSENT } from '@/lib/ps/config';
import { captureTags, track } from './PsTrack';
import { PsLink } from './PsCtx';
import { useDialog } from './useDialog';

type Phase = 'start' | 'scanning' | 'questions' | 'gate' | 'results';
const CONF = { confirmed: 'Confirmed', likely: 'Likely: please verify', self: 'From your answers', unseen: 'Not visible from outside' } as const;
interface Detail { title: string; confidence?: 'confirmed' | 'likely' | 'self' | 'unseen'; status: 'warn' | 'fail'; duty: string | null; evidence: string; whyItMatters: string; fix: string; relatedService: string | null }
declare global { interface Window { turnstile?: { render: (el: HTMLElement, o: Record<string, unknown>) => void } } }

const INDUSTRIES: [string, string][] = [['retail', 'Retail and e-commerce'], ['education', 'Education'], ['healthcare', 'Healthcare'], ['fintech', 'Fintech and financial services'], ['manufacturing', 'Manufacturing'], ['realestate', 'Real estate'], ['hospitality', 'Hospitality'], ['professional', 'Professional services'], ['saas', 'SaaS and IT'], ['agency', 'Agency'], ['other', 'Other']];
const QS: { k: string; q: string; o: [string, string][] }[] = [
  { k: 'hasPolicy', q: 'Do you have a written privacy notice?', o: [['yes', 'Yes'], ['no', 'No']] },
  { k: 'consentRecords', q: 'Do you record when and how people agreed to share data?', o: [['yes', 'Yes'], ['partly', 'Partly'], ['no', 'No']] },
  { k: 'breachPlan', q: 'Do you have a plan for a data breach?', o: [['yes', 'Yes'], ['partly', 'Partly'], ['no', 'No']] },
  { k: 'requestOwner', q: 'Does someone own privacy requests and complaints?', o: [['yes', 'Yes'], ['no', 'No']] },
  { k: 'training', q: 'Is your staff trained on handling personal data?', o: [['yes', 'Yes'], ['partly', 'Partly'], ['no', 'No']] },
  { k: 'vendors', q: 'Do outside vendors handle your customer data?', o: [['no', 'No'], ['yes', 'Yes'], ['unsure', 'Not sure']] },
  { k: 'children', q: 'Do you collect data from children under 18?', o: [['no', 'No'], ['yes', 'Yes'], ['unsure', 'Not sure']] },
];
const STEPS = ['Reading your pages', 'Checking notice and forms', 'Checking trackers and consent', 'Checking security and email', 'Mapping to the eight duties'];
const LABEL: Record<DutyStatus, string> = { gap: 'Gap found', review: 'Needs review', ok: 'No issues seen', unknown: 'Not assessed' };
const ICON = { gap: ShieldAlert, review: CircleAlert, ok: CircleCheck, unknown: CircleHelp };

export default function DpdpCheck() {
  const [phase, setPhase] = useState<Phase>('start');
  const [mode, setMode] = useState<'site' | 'nosite'>('site');
  const [site, setSite] = useState(''), [company, setCompany] = useState(''), [industry, setIndustry] = useState('');
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const [id, setId] = useState<string | null>(null), [pct, setPct] = useState(0);
  const [sum, setSum] = useState<DpdpSummary | null>(null), [domain, setDomain] = useState('');
  const [ans, setAns] = useState<Record<string, string>>({});
  const [lead, setLead] = useState({ name: '', phone: '', email: '', consent: false, hp: '' });
  const [lerr, setLerr] = useState<Record<string, string>>({}), [lbusy, setLbusy] = useState(false);
  const [details, setDetails] = useState<Detail[] | null>(null);
  const [mailed, setMailed] = useState<'sent' | 'gated' | 'none'>('none');
  const [modal, setModal] = useState<DutyRow | null | undefined>(undefined); // undefined: closed, null: all solutions
  const dlg = useRef<HTMLDivElement>(null);
  const [enq, setEnq] = useState({ message: '', time: '', consent: false }), [enqBusy, setEnqBusy] = useState(false), [enqErr, setEnqErr] = useState(''), [enqDone, setEnqDone] = useState<string[]>([]);
  const closeModal = () => setModal(undefined);
  const enqKey = (m: DutyRow | null | undefined) => (m ? m.id : 'all');
  async function sendEnquiry(e: React.FormEvent) {
    e.preventDefault();
    if (!enq.consent) { setEnqErr('Please tick the box so we may contact you.'); return; }
    setEnqBusy(true); setEnqErr('');
    const r = await fetch('/api/ps/enquiry', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scanId: id, duty: enqKey(modal), name: lead.name, phone: lead.phone, email: lead.email, message: enq.message, preferredTime: enq.time, consent: true, hp: lead.hp }) }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    setEnqBusy(false);
    if (!r || !r.ok) { setEnqErr(j.error ?? 'Something went wrong. Please try again.'); return; }
    setEnqDone((d) => [...d, enqKey(modal)]); track('dpdp_solution_enquiry', { duty: enqKey(modal) });
  }
  useDialog(modal !== undefined, closeModal, dlg);
  useEffect(() => { if (details && modal !== undefined) dlg.current?.querySelector<HTMLElement>('.ps-sm-r')?.scrollTo({ top: 0 }); }, [details, modal]);
  const [ts, setTs] = useState<string | null>(null);
  const tsRef = useRef<HTMLDivElement>(null), alive = useRef(true), top = useRef<HTMLElement>(null);
  const tsKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const booking = process.env.NEXT_PUBLIC_BOOKING_URL || 'https://bedreweb.com/contact';

  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    if (!tsKey || !tsRef.current || phase !== 'start' || mode !== 'site') return;
    const mount = () => window.turnstile && tsRef.current && !tsRef.current.hasChildNodes() && window.turnstile.render(tsRef.current, { sitekey: tsKey, callback: (t: string) => setTs(t) });
    if (window.turnstile) mount(); else if (!document.getElementById('cf-ts')) { const s = document.createElement('script'); s.id = 'cf-ts'; s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'; s.async = true; s.onload = mount; document.head.appendChild(s); }
  }, [tsKey, phase, mode]);
  useEffect(() => { if (phase === 'results') top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, [phase]);

  const reset = () => { setPhase('start'); setSum(null); setId(null); setDetails(null); setPct(0); setErr(''); setAns({}); };

  async function runScan(e: React.FormEvent) {
    e.preventDefault();
    const s = parseWebsite(site);
    if (!s) { setErr('Enter your website, for example yourcompany.com'); return; }
    setErr(''); setDomain(s.domain); setPct(2); setPhase('scanning'); track('dpdp_check_started', { mode: 'site' });
    const r = await fetch('/api/ps/scan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ website: s.domain, authorised: false, turnstile: ts }) }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    if (!r || !r.ok) { setErr(j.error ?? 'Could not start the check. Please try again.'); setPhase('start'); return; }
    setId(j.id);
    for (let i = 0; i < 70 && alive.current; i++) {
      await new Promise((ok) => setTimeout(ok, 900));
      const p = await fetch(`/api/ps/scan/${j.id}?d=1`, { cache: 'no-store' }).then((x) => x.json()).catch(() => null);
      if (!p) continue;
      setPct(p.pct ?? 0);
      if (p.status === 'error') { setErr(p.error ?? 'We could not check that website.'); setPhase('start'); return; }
      if (p.status === 'done') { setPct(100); if (p.dpdp) setSum(p.dpdp); setPhase(p.dpdp ? 'results' : 'gate'); return; }
    }
    if (alive.current) { setErr('The check took too long. Please try again.'); setPhase('start'); }
  }

  function startNoSite(e: React.FormEvent) {
    e.preventDefault();
    if (company.trim().length < 2) { setErr('Please enter your company name'); return; }
    if (!industry) { setErr('Please choose your industry'); return; }
    setErr(''); track('dpdp_check_started', { mode: 'nosite' }); setPhase('questions');
  }

  async function submitAnswers(e: React.FormEvent) {
    e.preventDefault();
    if (QS.some((q) => !ans[q.k])) { setErr('Please answer every question'); return; }
    setBusy(true); setErr('');
    const r = await fetch('/api/ps/assess', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scanId: id ?? undefined, company, industry: industry || 'other', answers: ans }) }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    setBusy(false);
    if (!r || !r.ok) { setErr(j.error ?? 'Something went wrong. Please try again.'); return; }
    setId(j.id); if (j.dpdp) { setSum(j.dpdp); setPhase('results'); } else setPhase('gate');
  }

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (lead.name.trim().length < 2) er.name = 'Please enter your name';
    const pp = phoneProblem(lead.phone); if (pp) er.phone = pp;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.email.trim())) er.email = 'Please enter a valid email';
    if (!lead.consent) er.consent = 'Please tick the consent box';
    setLerr(er); if (Object.keys(er).length || !id) return;
    setLbusy(true);
    const free = !!emailProblem(lead.email) && !/valid email/i.test(emailProblem(lead.email) ?? '');
    const r = await fetch('/api/ps/lead', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
      scanId: id, name: lead.name, email: lead.email, phone: lead.phone, website: mode === 'site' ? domain : '', noWebsite: mode === 'nosite', company, industry: industry || 'other',
      officialEmail: free ? 'no' : 'yes', answers: ans, consent: true, authorised: true, hp: lead.hp, tags: { ...captureTags(), lead_source: 'dpdp_check' },
    }) }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    if (!r || !r.ok) { setLbusy(false); setLerr({ form: j.error ?? 'Something went wrong. Please try again.' }); return; }
    setMailed(j.emailed ? 'sent' : j.gated ? 'gated' : 'none');
    const d = await fetch(`/api/ps/scan/${id}?full=1`, { cache: 'no-store' }).then((x) => x.json()).catch(() => null);
    setLbusy(false);
    if (!d?.dpdp) { setLerr({ form: 'We saved your details but could not load the result. Please try again.' }); return; }
    setSum(d.dpdp); setDetails(d.details ?? []); setPhase('results'); track('dpdp_report_unlocked', { mode });
    try { localStorage.setItem('ps-lead-done', String(Date.now())); } catch { /* storage unavailable */ }
  }

  const E = sum?.exposure;
  const needInput = sum ? sum.duties.filter((d) => d.status === 'unknown').length : 0;
  const ferr = (k: string) => (lerr[k] ? <span role="alert" className="ps-dc-err">{lerr[k]}</span> : null);

  return (
    <section className={`ps-ch ps-dc${phase === 'results' ? ' is-res' : ''}`} aria-labelledby="dc-h" ref={top}>
      <div className="ps-wrap">
        {phase !== 'results' && (
          <div className="ps-ch-grid">
            <div>
              <span className="ps-rh-pill"><FileSearch size={14} aria-hidden /> DPDP Act, 2023 · live assessment</span>
              <h1 id="dc-h">Is your business <em>DPDP-ready?</em></h1>
              <p className="ps-ch-lead">Check your website live, or answer seven quick questions if you do not have one. See what is missing, the Act section behind each gap, and the maximum fine at stake.</p>
              <ul className="ps-dc-facts">
                <li><b>8</b><span>duties assessed</span></li><li><b>{crore(250)}</b><span>highest penalty tier</span></li><li><b>&lt; 2 min</b><span>to your report</span></li>
              </ul>
            </div>
            <div className="ps-dc-card">
              {phase === 'start' && (<>
                <div className="ps-dc-tabs" role="tablist" aria-label="Do you have a website?">
                  <button role="tab" aria-selected={mode === 'site'} className={mode === 'site' ? 'on' : ''} onClick={() => { setMode('site'); setErr(''); }}>I have a website</button>
                  <button role="tab" aria-selected={mode === 'nosite'} className={mode === 'nosite' ? 'on' : ''} onClick={() => { setMode('nosite'); setErr(''); }}>No website</button>
                </div>
                {mode === 'site' ? (
                  <form onSubmit={runScan} noValidate>
                    <h2>Scan your website</h2><p>Free and read-only. We check your home page for notice, consent, trackers, security and email.</p>
                    <label htmlFor="dc-site" className="ps-dc-l">Company website</label>
                    <input id="dc-site" value={site} onChange={(e) => { setSite(e.target.value); setErr(''); }} inputMode="url" autoComplete="url" placeholder="yourcompany.com" aria-invalid={!!err} />
                    {tsKey && <div ref={tsRef} style={{ marginTop: 8 }} />}
                    <button className="ps-rh-btn ps-dc-go">Run free DPDP check <ArrowRight size={18} aria-hidden /></button>
                    <p className="ps-dc-note" role={err ? 'alert' : undefined} style={err ? { color: '#FF8A94' } : undefined}>{err || 'By scanning you confirm you may check this website. Home page only.'}</p>
                  </form>
                ) : (
                  <form onSubmit={startNoSite} noValidate>
                    <h2>Assess without a website</h2><p>Tell us about your business, then answer seven short questions about how you handle personal data.</p>
                    <label htmlFor="dc-co" className="ps-dc-l">Company name</label>
                    <input id="dc-co" value={company} onChange={(e) => { setCompany(e.target.value); setErr(''); }} autoComplete="organization" placeholder="Your company name" />
                    <label htmlFor="dc-in" className="ps-dc-l" style={{ marginTop: 12 }}>Industry</label>
                    <select id="dc-in" value={industry} onChange={(e) => { setIndustry(e.target.value); setErr(''); }}><option value="">Choose…</option>{INDUSTRIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                    <button className="ps-rh-btn ps-dc-go">Start the assessment <ArrowRight size={18} aria-hidden /></button>
                    <p className="ps-dc-note" role={err ? 'alert' : undefined} style={err ? { color: '#FF8A94' } : undefined}>{err || 'Takes about a minute. Nothing is scanned.'}</p>
                  </form>
                )}
              </>)}

              {phase === 'scanning' && (
                <div role="status" aria-live="polite">
                  <h2>Checking {domain}</h2><p>Reading public information only. This usually takes a few seconds.</p>
                  <ol className="ps-dc-steps">{STEPS.map((s, i) => { const at = Math.min(4, Math.floor((pct / 100) * 5)); return <li key={s} className={i < at ? 'done' : i === at ? 'now' : ''}><i aria-hidden />{s}</li>; })}</ol>
                  <div className="ps-dc-bar" aria-hidden><i style={{ width: `${pct}%` }} /></div>
                </div>
              )}

              {phase === 'gate' && (
                <form onSubmit={unlock} noValidate className="ps-dc-gate">
                  <span className="ps-dc-lock"><CircleCheck size={18} aria-hidden /></span>
                  <h2>Your DPDP result is ready</h2>
                  <p>Tell us where to send it. You will see your score, the fine exposure and every gap, with the Act section behind each one.</p>
                  <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" value={lead.hp} onChange={(e) => setLead({ ...lead, hp: e.target.value })} style={{ position: 'absolute', left: -9999 }} />
                  <label>Your name<input value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} autoComplete="name" />{ferr('name')}</label>
                  <div className="ps-pu-two">
                    <label>Mobile number<input type="tel" value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })} autoComplete="tel" placeholder="+91 98765 43210" />{ferr('phone')}</label>
                    <label>Work email<input type="email" value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} autoComplete="email" placeholder="you@company.com" />{ferr('email')}</label>
                  </div>
                  {mode === 'site' && <label>Company name (optional)<input value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="organization" /></label>}
                  <label className="ps-pu-chk"><input type="checkbox" checked={lead.consent} onChange={(e) => setLead({ ...lead, consent: e.target.checked })} /><span>{PS_CONSENT.replace(' I confirm I am authorised to assess the website I entered.', '')}</span></label>{ferr('consent')}
                  {lerr.form && <p role="alert" className="ps-pu-err">{lerr.form}</p>}
                  <button className="ps-rh-btn ps-dc-go" disabled={lbusy}>{lbusy ? 'Preparing your result…' : 'Show my result'} <ArrowRight size={18} aria-hidden /></button>
                </form>
              )}

              {phase === 'questions' && (
                <form onSubmit={submitAnswers} noValidate>
                  <h2>{mode === 'nosite' ? `A few questions about ${company}` : 'Add your processes'}</h2><p>{mode === 'site' ? 'Your website cannot show these. Answer to complete the assessment.' : 'Seven quick questions. Answer honestly; this is for you.'}</p>
                  <div className="ps-dc-qs">{QS.map((q) => (
                    <fieldset key={q.k}><legend>{q.q}</legend>
                      <div className="ps-dc-seg">{q.o.map(([v, l]) => <label key={v} className={ans[q.k] === v ? 'on' : ''}><input type="radio" name={q.k} value={v} checked={ans[q.k] === v} onChange={() => { setAns((a) => ({ ...a, [q.k]: v })); setErr(''); }} />{l}</label>)}</div>
                    </fieldset>))}</div>
                  {err && <p role="alert" className="ps-dc-err">{err}</p>}
                  <div className="ps-dc-row">
                    <button type="button" className="ps-rh-ghost" onClick={() => (mode === 'site' ? setPhase('results') : setPhase('start'))}>Back</button>
                    <button className="ps-rh-btn" disabled={busy}>{busy ? 'Working…' : 'See my report'} <ArrowRight size={18} aria-hidden /></button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {phase === 'results' && sum && E && (
          <div className="ps-dc-res">
            <div className="ps-dc-rh">
              <div><span className="ps-rh-pill"><FileSearch size={14} aria-hidden /> DPDP assessment · {mode === 'site' ? domain : company}</span><h1 id="dc-h">Your DPDP report</h1></div>
              <button className="ps-rh-ghost" onClick={reset}><RotateCcw size={15} aria-hidden /> Check another</button>
            </div>

            <div className="ps-dc-grid2">
              <aside className="ps-dc-side">
                <div className={`ps-dc-fine ${E.level}`}>
                  <small>{E.level === 'gap' ? 'Maximum fine exposure' : E.level === 'review' ? 'Possible fine exposure' : 'Fine exposure'}</small>
                  {E.level === 'none' ? <b className="none">None found</b> : <b>Up to {crore(E.maxCr)}</b>}
                  <span>{E.level === 'none' ? 'No gaps found in what we could check from outside. Some duties need your input.' : `Highest tier touched: ${E.dutyLabel}. ${E.gaps ? `${E.gaps} duty ${E.gaps === 1 ? 'gap' : 'gaps'} found` : `${E.reviews} to review`}.`}</span>
                </div>
                <div className="ps-dc-score">
                  <div className="ps-ring" style={{ '--p': sum.score } as React.CSSProperties}><div><span><b>{sum.score}</b><small>of 100</small></span></div></div>
                  <div><b>{sum.band}</b><span>{sum.mode === 'questions' ? 'From your answers' : `Quick score · ${sum.pages} page, ${sum.mode === 'deep' ? 'full scan' : 'home page only'}`}</span></div>
                </div>
                <ul className="ps-dc-counts" aria-label="Summary">
                  <li className="gap"><b>{sum.counts.gap}</b>gaps</li><li className="review"><b>{sum.counts.review}</b>to review</li><li className="ok"><b>{sum.counts.ok}</b>no issues</li><li className="unknown"><b>{sum.counts.unknown}</b>not assessed</li>
                </ul>
                {mode === 'site' && needInput > 0 && <button className="ps-dc-improve" onClick={() => { setErr(''); setPhase('questions'); }}><CircleHelp size={16} aria-hidden /> {needInput} duties need your input. Answer 7 questions</button>}
                <div className="ps-dc-cta">
                  {details ? (<>
                    <b>Need help fixing these?</b>
                    <p>Open any item for its fix steps, or ask a Bedre consultant to handle it for you.</p>
                    <button className="ps-rh-btn" onClick={() => setModal(null)}>Request help for all gaps <ArrowRight size={16} aria-hidden /></button>
                    <PsLink href={`/report/${id}`} className="ps-rh-btn">Open printable report <ArrowRight size={16} aria-hidden /></PsLink>
                    <a href={booking} target="_blank" rel="noopener" className="ps-rh-ghost ps-ch-ghost" onClick={() => track('booking_clicked')}>Book a free 30-minute review</a>
                  </>) : (<>
                    <b>Get the solution for every gap</b>
                    <p>Fix steps in plain words, plus a free 30-minute review with a Bedre consultant.</p>
                    <button className="ps-rh-btn" onClick={() => setModal(null)}>Unlock all solutions <ArrowRight size={16} aria-hidden /></button>
                  </>)}
                </div>
                <p className="ps-dc-fine-note">Maximum penalties the Act allows. Actual penalties are decided by the Data Protection Board. A technical assessment, not legal advice.</p>
              </aside>

              <div className="ps-dc-main">
                {([['gap', 'Gaps found', 'Fix these first.'], ['review', 'Needs review', 'Worth checking.'], ['unknown', 'Not assessed yet', 'Cannot be seen from outside. Answer the questions or ask us.'], ['ok', 'No issues seen', 'Nothing flagged in what we could check.']] as [DutyStatus, string, string][]).map(([st, title, hint]) => {
                  const rows = sum.duties.filter((d: DutyRow) => d.status === st); if (!rows.length) return null;
                  return (
                    <section key={st} className="ps-dc-group">
                      <h2>{title}<span>{rows.length}</span><em>{hint}</em></h2>
                      {rows.map((d: DutyRow) => { const I = ICON[d.status]; return (
                        <article key={d.id} className={`ps-dc-item ${d.status}`}>
                          <span className="ps-dc-ic"><I size={20} aria-hidden /></span>
                          <div className="ps-dc-mid">
                            <div className="ps-dc-t"><b>{d.label}</b><em>{d.ref}</em></div>
                            <p>{firstSentence(d.importance)}</p>
                            {d.titles.length > 0 && <small>Missing or weak: {d.titles.join('; ')}</small>}
                          </div>
                          <div className="ps-dc-fm"><b>{crore(d.fineCr)}</b><em>max fine</em></div>
                          {d.status !== 'ok' && <button className="ps-dc-sol" onClick={() => setModal(d)}>{d.status === 'unknown' ? 'View guidance' : 'View solution'} <ArrowRight size={15} aria-hidden /></button>}
                        </article>); })}
                    </section>);
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {modal !== undefined && sum && (
        <div className="ps-pu ps-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="ps-pu-box ps-sm-box" role="dialog" aria-modal="true" aria-labelledby="sm-h" ref={dlg}>
            <button type="button" className="ps-pu-x" onClick={closeModal} aria-label="Close"><X size={18} /></button>
            <aside className="ps-pu-l ps-sm-l">
              {modal ? (<>
                <span className="ps-rh-pill">{modal.ref}</span>
                <h2 id="sm-h">{modal.label}</h2>
                <div className={`ps-sm-fine ${modal.status}`}><small>Maximum fine</small><b>{crore(modal.fineCr)}</b><em>{modal.tier}</em></div>
                <p>{modal.importance}</p>
                {modal.titles.length > 0 && <div className="ps-sm-found"><small>What we found</small><ul>{modal.titles.map((t) => <li key={t}>{t}</li>)}</ul></div>}
              </>) : (<>
                <span className="ps-rh-pill">{sum.counts.gap + sum.counts.review} items</span>
                <h2 id="sm-h">Solutions for every gap</h2>
                <p>Plain-language fix steps for each duty we flagged, plus where to start.</p>
                <ul className="ps-sm-list">{sum.duties.filter((d: DutyRow) => d.status === 'gap' || d.status === 'review').map((d: DutyRow) => <li key={d.id}>{d.label}<em>{crore(d.fineCr)}</em></li>)}</ul>
              </>)}
            </aside>
            <div className="ps-pu-r ps-sm-r">
                <div className="ps-sm-sol" aria-live="polite">
                  <h3>{modal ? `How to fix ${modal.label.toLowerCase()}` : 'Your solutions'}</h3>
                  {(modal ? [modal] : sum.duties.filter((d: DutyRow) => d.status === 'gap' || d.status === 'review')).map((d: DutyRow) => {
                    const found = (details ?? []).filter((x) => x.duty === d.id);
                    return (
                      <section key={d.id} className="ps-sm-duty">
                        {!modal && <h4>{d.label}<em>{d.ref}</em></h4>}
                        {found.map((f) => <div key={f.title} className="ps-sm-fix"><b>{f.title}</b><span className={`ps-rh-chip ${f.status}`}>{f.status === 'fail' ? 'Fix needed' : 'Attention'}</span>{f.confidence && <span className={`ps-conf ${f.confidence}`}>{CONF[f.confidence]}</span>}<p><em>What we saw</em>{f.evidence}</p><p><em>How to fix</em>{f.fix}</p></div>)}
                        <ol className="ps-sm-steps">{d.steps.map((st) => <li key={st}>{st}</li>)}</ol>
                      </section>);
                  })}
                  {enqDone.includes(enqKey(modal)) ? (
                    <div className="ps-sm-done" role="status"><CircleCheck size={20} aria-hidden /><div><b>Request sent</b><span>A Bedre consultant will contact {lead.name.split(' ')[0]} on {lead.phone}{mailed === 'sent' ? ` and we have emailed a confirmation to ${lead.email}` : ''}.</span></div></div>
                  ) : (
                    <form className="ps-sm-enq" onSubmit={sendEnquiry} noValidate>
                      <h4>Want Bedre to fix {modal ? modal.label.toLowerCase() : 'these gaps'} for you?</h4>
                      <p className="ps-sm-sub">We will use the details you gave: {lead.name}, {lead.phone}, {lead.email}.</p>
                      <div className="ps-pu-two">
                        <label>Best time to call (optional)<select value={enq.time} onChange={(e) => setEnq({ ...enq, time: e.target.value })}><option value="">Any time</option><option>Morning</option><option>Afternoon</option><option>Evening</option></select></label>
                      </div>
                      <label>Anything we should know? (optional)<textarea rows={2} maxLength={500} value={enq.message} onChange={(e) => setEnq({ ...enq, message: e.target.value })} placeholder="For example: we use Shopify and WhatsApp for orders." /></label>
                      <label className="ps-pu-chk"><input type="checkbox" checked={enq.consent} onChange={(e) => setEnq({ ...enq, consent: e.target.checked })} /><span>Yes, a Bedre consultant may contact me about this request.</span></label>
                      {enqErr && <p role="alert" className="ps-pu-err">{enqErr}</p>}
                      <button className="ps-pu-btn" disabled={enqBusy}>{enqBusy ? 'Sending…' : 'Request help'} <ArrowRight size={18} aria-hidden /></button>
                    </form>
                  )}
                  <div className="ps-dc-row">
                    <a href={booking} target="_blank" rel="noopener" className="ps-sm-ghost ps-sm-focus" onClick={() => track('booking_clicked')}>Book a free 30-minute review <ArrowRight size={18} aria-hidden /></a>
                    <PsLink href={`/report/${id}`} className="ps-sm-ghost">Open printable report</PsLink>
                  </div>
                  <p className="ps-sm-note">{mailed === 'sent' ? `We have emailed a copy to ${lead.email}. ` : mailed === 'gated' ? 'You used a personal email address, so we did not email the report. Use your work email to receive it. ' : ''}A Bedre consultant will be in touch. We are a technology partner, not a law firm.</p>
                </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

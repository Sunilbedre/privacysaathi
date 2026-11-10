'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { emailDomain, emailProblem, parseWebsite, phoneProblem, sameCompany } from '@/lib/lead-rules';
import { PS_CONSENT } from '@/lib/ps/config';
import { captureTags, track } from './PsTrack';
import { usePsBase } from './PsCtx';
import { useOtp } from './useOtp';

const INDUSTRIES: [string, string][] = [['retail', 'Retail and e-commerce'], ['education', 'Education'], ['healthcare', 'Healthcare'], ['fintech', 'Fintech and financial services'], ['manufacturing', 'Manufacturing'], ['realestate', 'Real estate'], ['hospitality', 'Hospitality'], ['professional', 'Professional services'], ['saas', 'SaaS and IT'], ['agency', 'Agency'], ['other', 'Other']];
const SIZES = ['1-10', '11-50', '51-200', '201-1000', '1000+'];
const DATA: [string, string][] = [['contact', 'Names, emails, phone numbers'], ['payment', 'Payment or bank details'], ['ids', 'ID numbers (Aadhaar, PAN, passport)'], ['health', 'Health information'], ['location', 'Location or device data'], ['staff', 'Employee records'], ['children', 'Children\'s data (under 18)']];
const CHANNELS: [string, string][] = [['social', 'Social media pages'], ['whatsapp', 'WhatsApp'], ['marketplace', 'Marketplaces (Amazon, Flipkart etc.)'], ['app', 'A mobile app'], ['paper', 'Paper forms'], ['other', 'Something else']];

interface Q { key: string; text: string; help?: string; kind: 'multi' | 'single'; options: [string, string][]; show?: boolean }
type Vals = Record<string, string | string[]>;
type Scan = { status: 'running' | 'done' | 'error'; step: string; pct: number; error?: string; deep?: boolean };


const STEPS = ['Your details', 'Scan', 'Questions', 'Report'];
function Shell({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <div className="ps-fp">
      <aside className="ps-side"><div className="ps-side-in">
        <h2>Know where you stand in about five minutes</h2>
        <p>Free and read-only. We look at your public website and email, ask a few questions, and give you a clear score.</p>
        <ol>
          <li><b>1</b><div><strong>We read your public pages</strong><span>The way a visitor would. Nothing is changed.</span></div></li>
          <li><b>2</b><div><strong>You answer a few questions</strong><span>Short, plain, and pre-filled where we can.</span></div></li>
          <li><b>3</b><div><strong>You get your report</strong><span>Top five fixes and the next step.</span></div></li>
        </ol>
        <div className="ps-side-trust"><div>Technology partner, not a law firm</div><div>No page content stored</div><div>Reports deleted after 90 days</div></div>
      </div></aside>
      <div className="ps-main-col"><div className="ps-flow">
        <ol className="ps-stepper" aria-label="Progress">{STEPS.map((l, i) => <li key={l} className={i < step ? 'done' : i === step ? 'on' : ''} aria-current={i === step ? 'step' : undefined}><span>{l}</span></li>)}</ol>
        {children}
      </div></div>
    </div>
  );
}

declare global { interface Window { turnstile?: { render: (el: HTMLElement, o: Record<string, unknown>) => void } } }

export default function ScanFlow() {
  const router = useRouter(), base = usePsBase(), sp = useSearchParams();
  const [phase, setPhase] = useState<'intake' | 'questions' | 'finishing' | 'emailhelp'>('intake');
  const [f, setF] = useState({ hasSite: 'yes', website: sp.get('site') ?? '', email: '', official: 'yes', name: '', phone: '', company: '', industry: '', size: '', consent: false, authorised: false, hp: '' });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false), [msg, setMsg] = useState('');
  const [scanId, setScanId] = useState<string | null>(null);
  const [scan, setScan] = useState<Scan | null>(null);
  const [ans, setAns] = useState<Vals>({}), [qi, setQi] = useState(0);
  const [verified, setVerified] = useState<boolean | null>(null), [tok, setTok] = useState<{ dns: string; meta: string } | null>(null);
  const [ts, setTs] = useState<string | null>(null);
  const tsRef = useRef<HTMLDivElement>(null);
  const set = (k: string, v: string | boolean) => { setF((p) => ({ ...p, [k]: v })); setErrs((e) => ({ ...e, [k]: '' })); };

  const site = useMemo(() => parseWebsite(f.website), [f.website]);
  const free = !!f.email && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email) && !!emailProblem(f.email) && !/valid email/i.test(emailProblem(f.email) ?? '');
  const mismatch = !!site && !!f.email && !emailProblem(f.email) && !sameCompany(emailDomain(f.email), site.domain);
  const noOfficial = free || f.official === 'no';
  const noSite = f.hasSite === 'no';

  // Cloudflare Turnstile (only when a site key is set)
  const tsKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  useEffect(() => {
    if (!tsKey || !tsRef.current || phase !== 'intake' || noSite) return;
    const mount = () => window.turnstile && tsRef.current && !tsRef.current.hasChildNodes() && window.turnstile.render(tsRef.current, { sitekey: tsKey, callback: (t: string) => setTs(t) });
    if (window.turnstile) mount(); else if (!document.getElementById('cf-ts')) { const s = document.createElement('script'); s.id = 'cf-ts'; s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'; s.async = true; s.onload = mount; document.head.appendChild(s); }
  }, [tsKey, phase, noSite]);

  useEffect(() => {
    if (mismatch && f.authorised && site && !tok) fetch(`/api/ps/verify?domain=${site.domain}`).then((r) => r.json()).then((j) => setTok({ dns: j.dns, meta: j.meta })).catch(() => {});
  }, [mismatch, f.authorised, site, tok]);

  // Poll the scan
  useEffect(() => {
    if (!scanId || scan?.status === 'done' || scan?.status === 'error') return;
    const t = setInterval(async () => {
      const r = await fetch(`/api/ps/scan/${scanId}`, { cache: 'no-store' }).catch(() => null);
      if (!r || !r.ok) return;
      const j = await r.json(); setScan(j);
      if (j.status === 'done') track('scan_completed', { sid: scanId.slice(0, 8) });
    }, 1500);
    return () => clearInterval(t);
  }, [scanId, scan?.status]);

  const otp = useOtp(f.phone);
  const validateIntake = () => {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 2) e.name = 'Please enter your name';
    const em = emailProblem(f.email); if (em && !(free && !/valid email/i.test(em))) e.email = em; // free mail allowed here, but gated later
    if (!f.email.trim()) e.email = 'Please enter your email';
    const pp = phoneProblem(f.phone) || otp.check(); if (pp) e.phone = pp;
    if (!noSite && !site) e.website = 'Enter a valid website, for example yourcompany.com';
    if (!f.industry) e.industry = 'Please choose your industry';
    if (!f.size) e.size = 'Please choose a size';
    if (!noSite && !f.authorised) e.authorised = 'Please confirm you are authorised to assess this website';
    if (!f.consent) e.consent = 'Please tick the consent box';
    setErrs(e); return !Object.keys(e).length;
  };

  const startScan = async () => {
    if (!validateIntake()) return;
    setBusy(true); setMsg('');
    if (noSite) { setPhase('questions'); setBusy(false); return; }
    const r = await fetch('/api/ps/scan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ website: f.website, email: f.email, authorised: f.authorised, turnstile: ts, hp: f.hp }) }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    setBusy(false);
    if (!r || !r.ok) { setMsg(j.error ?? 'Could not start the scan. Please try again.'); return; }
    setScanId(j.id); setScan({ status: 'running', step: 'Starting', pct: 1, deep: j.deep }); setPhase('questions');
    track('scan_started', { deep: !!j.deep });
  };

  const verifyNow = async () => {
    if (!site) return; setVerified(null);
    const r = await fetch('/api/ps/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ domain: site.domain }) }).then((x) => x.json()).catch(() => ({}));
    setVerified(!!r.verified);
  };

  // Questions. Topics the scan already answers (privacy notice, trackers, forms) are not asked again; they come from the scan findings.
  const qs: Q[] = useMemo(() => {
    const data = (ans.data as string[] | undefined) ?? [];
    const all: Q[] = [
      ...(noSite ? [{ key: 'channels', text: 'Where do you collect customer data?', help: 'Pick all that apply.', kind: 'multi', options: CHANNELS } as Q] : []),
      { key: 'data', text: 'What personal data do you collect?', help: 'Pick all that apply.', kind: 'multi', options: DATA },
      { key: 'children', text: 'Do you collect data from children under 18?', help: 'Children\'s data needs verifiable parent consent.', kind: 'single', options: [['yes', 'Yes'], ['no', 'No'], ['unsure', 'Not sure']], show: !data.includes('children') },
      ...(noSite ? [{ key: 'hasPolicy', text: 'Do you have a written privacy notice?', kind: 'single', options: [['yes', 'Yes'], ['no', 'No']] } as Q] : []),
      { key: 'storage', text: 'Where is your customer data stored?', kind: 'single', options: [['india', 'In India'], ['abroad', 'Outside India'], ['unknown', 'I am not sure']] },
      { key: 'vendors', text: 'Do outside vendors handle your customer data?', help: 'For example CRM, payment gateway, cloud, email marketing.', kind: 'single', options: [['yes', 'Yes'], ['no', 'No'], ['unsure', 'Not sure']] },
      { key: 'records', text: 'Roughly how many people\'s records do you hold?', kind: 'single', options: [['under1k', 'Under 1,000'], ['1k-100k', '1,000 to 100,000'], ['100k+', 'Over 100,000'], ['unsure', 'Not sure']] },
      { key: 'consentRecords', text: 'Do you keep a record of when and how people agreed?', kind: 'single', options: [['yes', 'Yes'], ['partly', 'Partly'], ['no', 'No']] },
      { key: 'breachPlan', text: 'Do you have a plan for a data breach?', help: 'Who decides, who reports, who tells customers.', kind: 'single', options: [['yes', 'Yes'], ['partly', 'Partly'], ['no', 'No']] },
      { key: 'requestOwner', text: 'Does someone own privacy requests and complaints?', kind: 'single', options: [['yes', 'Yes'], ['no', 'No']] },
      { key: 'training', text: 'Is staff trained on handling personal data?', kind: 'single', options: [['yes', 'Yes'], ['partly', 'Partly'], ['no', 'No']] },
    ];
    return all.filter((q) => q.show !== false);
  }, [noSite, ans.data]);

  const q = qs[Math.min(qi, qs.length - 1)];
  const cur = ans[q?.key ?? ''];
  const answered = q ? (q.kind === 'multi' ? true : typeof cur === 'string' && cur !== '') : false;
  const pick = (k: string, v: string, multi: boolean) => setAns((a) => {
    if (!multi) return { ...a, [k]: v };
    const l = (a[k] as string[] | undefined) ?? []; return { ...a, [k]: l.includes(v) ? l.filter((x) => x !== v) : [...l, v] };
  });

  const submitLead = useCallback(async (path: 'scan' | 'email_help') => {
    setBusy(true); setMsg('');
    const { channels, data, ...rest } = ans as Record<string, string | string[]>;
    const answers = { ...rest, data, children: data && (data as string[]).includes('children') ? 'yes' : rest.children };
    const r = await fetch('/api/ps/lead', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
      path, scanId: scanId ?? undefined, name: f.name, email: f.email, phone: f.phone, website: noSite ? '' : f.website, noWebsite: noSite, company: f.company, industry: f.industry || 'other', size: f.size,
      officialEmail: noOfficial ? 'no' : 'yes', channels: channels ?? [], answers, consent: f.consent, authorised: f.authorised, hp: f.hp, otpToken: otp.token, tags: { ...captureTags(), form_page: location.pathname },
    }) }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    setBusy(false);
    if (!r || !r.ok) { setMsg(j.error ?? 'Something went wrong. Please try again.'); setPhase(path === 'scan' ? 'questions' : 'emailhelp'); return; }
    track('generate_lead', { path, no_official_email: noOfficial });
    router.push(path === 'email_help' ? `${base}/thanks?type=email` : `${base}/report/${j.id}`);
  }, [ans, scanId, f, noSite, noOfficial, router, base]);

  // After the last question, wait for the scan, then save and open the report.
  const lastDone = phase === 'finishing';
  useEffect(() => {
    if (lastDone && (noSite || scan?.status === 'done' || scan?.status === 'error')) void submitLead('scan');
  }, [lastDone, noSite, scan?.status, submitLead]);

  const err = (k: string) => (errs[k] ? <span role="alert" className="ps-err">{errs[k]}</span> : null);

  if (phase === 'emailhelp') return (
    <Shell step={0}>
      <h1>Let us help you set up official email</h1>
      <p className="ps-sub">Business email on your own domain can be secured, backed up and audited. Free mail cannot. Tell us who you are and we will call you. No website needed.</p>
      <form className="ps-f" onSubmit={(e) => { e.preventDefault(); const er: Record<string, string> = {}; if (f.name.trim().length < 2) er.name = 'Please enter your name'; if (!f.company.trim()) er.company = 'Please enter your business name'; const pp = phoneProblem(f.phone) || otp.check(); if (pp) er.phone = pp; if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) er.email = 'Please enter an email we can reach you on'; if (!f.consent) er.consent = 'Please tick the consent box'; setErrs(er); if (!Object.keys(er).length) void submitLead('email_help'); }} noValidate>
        <label className="f">Your name<input type="text" value={f.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" />{err('name')}</label>
        <label className="f">Business name<input type="text" value={f.company} onChange={(e) => set('company', e.target.value)} autoComplete="organization" />{err('company')}</label>
        <label className="f">Phone<input type="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" placeholder="+91 98765 43210" />{err('phone')}</label>
        {otp.node}
        <label className="f">Email we can reach you on<input type="email" value={f.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" />{err('email')}</label>
        <label className="ps-check"><input type="checkbox" checked={f.consent} onChange={(e) => set('consent', e.target.checked)} /><span>{PS_CONSENT.replace(' I confirm I am authorised to assess the website I entered.', '')}</span></label>{err('consent')}
        {msg && <span role="alert" className="ps-err">{msg}</span>}
        <div className="ps-row"><button type="button" className="ps-btn ps-btn-ghost" onClick={() => setPhase('intake')}>Back</button><button className="ps-btn" disabled={busy}>Request a call</button></div>
      </form>
    </Shell>
  );

  if (phase === 'questions' || phase === 'finishing') {
    const total = qs.length;
    return (
      <Shell step={phase === 'finishing' ? 3 : 2}>
        {!noSite && scan && (
          <div className="ps-live" role="status" aria-live="polite">
            {scan.status === 'running' && <><span className="ps-spin" aria-hidden /><span>Scanning {site?.domain}: {scan.step} ({scan.pct}%)</span></>}
            {scan.status === 'done' && <span>Scan finished{scan.deep ? '' : ' (home page only)'}. Finish the questions to see your report.</span>}
            {scan.status === 'error' && <span>We could not scan that website ({scan.error}). You can still finish the questions.</span>}
          </div>
        )}
        {phase === 'finishing' ? (
          <div className="ps-live" role="status"><span className="ps-spin" aria-hidden /><span>{busy ? 'Preparing your report…' : scan?.status === 'running' ? 'Waiting for the scan to finish…' : 'Preparing your report…'}</span></div>
        ) : q && (
          <>
            <div className="ps-prog" aria-hidden><i style={{ width: `${((qi + 1) / total) * 100}%` }} /></div>
            <div className="ps-stepno">Question {Math.min(qi + 1, total)} of {total}</div>
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend className="ps-q">{q.text}</legend>
              {q.help && <p className="ps-note" style={{ margin: '0 0 12px' }}>{q.help}</p>}
              <div className="ps-opts">
                {q.options.map(([v, l]) => {
                  const checked = q.kind === 'multi' ? ((cur as string[] | undefined) ?? []).includes(v) : cur === v;
                  return <label className="ps-opt" key={v}><input type={q.kind === 'multi' ? 'checkbox' : 'radio'} name={q.key} checked={checked} onChange={() => pick(q.key, v, q.kind === 'multi')} /><span>{l}</span></label>;
                })}
              </div>
            </fieldset>
            {msg && <p role="alert" className="ps-err">{msg}</p>}
            <div className="ps-row">
              <button type="button" className="ps-btn ps-btn-ghost" onClick={() => (qi === 0 ? setPhase('intake') : setQi(qi - 1))}><ArrowLeft size={16} aria-hidden /> Back</button>
              <button type="button" className="ps-btn" disabled={!answered} onClick={() => (qi + 1 >= total ? setPhase('finishing') : setQi(qi + 1))}>{qi + 1 >= total ? 'See my report' : 'Next'} <ArrowRight size={16} aria-hidden /></button>
            </div>
          </>
        )}
      </Shell>
    );
  }

  return (
    <Shell step={0}>
      <h1>Check your business</h1>
      <p className="ps-sub">Takes about five minutes. We only read public information.</p>
      <form className="ps-f" onSubmit={(e) => { e.preventDefault(); void startScan(); }} noValidate>
        <input type="text" name="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.hp} onChange={(e) => set('hp', e.target.value)} style={{ position: 'absolute', left: -9999 }} />
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="ps-q" style={{ fontSize: '1rem' }}>Does your business have a website?</legend>
          <div className="ps-opts" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <label className="ps-opt"><input type="radio" name="hasSite" checked={f.hasSite === 'yes'} onChange={() => set('hasSite', 'yes')} />Yes</label>
            <label className="ps-opt"><input type="radio" name="hasSite" checked={f.hasSite === 'no'} onChange={() => set('hasSite', 'no')} />No</label>
          </div>
        </fieldset>
        {!noSite && (
          <label className="f">Company website
            <input type="text" value={f.website} onChange={(e) => set('website', e.target.value)} inputMode="url" autoComplete="url" placeholder="yourcompany.com" aria-invalid={!!errs.website} />
            {site && <span className="ps-chip-domain">Domain detected: {site.domain}</span>}{err('website')}
          </label>
        )}
        <label className="f">Work email
          <input type="email" value={f.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" placeholder="you@yourcompany.com" aria-invalid={!!errs.email} />{err('email')}
        </label>
        {free && <div className="ps-box" role="status"><b>This looks like a personal email.</b> You will still see your result on screen, but we cannot email the report or book the consultant call to a free address. Business mail on a free provider cannot be secured or audited. <button type="button" className="ps-btn ps-btn-sm" style={{ marginTop: 8 }} onClick={() => { track('email_help_clicked'); setPhase('emailhelp'); }}>Help me set up official email</button></div>}
        {!free && !!f.email && !errs.email && (
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="ps-note" style={{ marginBottom: 6 }}>Is this your official company email?</legend>
            <div className="ps-opts" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <label className="ps-opt"><input type="radio" name="official" checked={f.official === 'yes'} onChange={() => set('official', 'yes')} />Yes</label>
              <label className="ps-opt"><input type="radio" name="official" checked={f.official === 'no'} onChange={() => set('official', 'no')} />No, personal</label>
            </div>
          </fieldset>
        )}
        <label className="f">Your name<input type="text" value={f.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" />{err('name')}</label>
        <label className="f">Phone<input type="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" placeholder="+91 98765 43210" />{err('phone')}</label>
        {otp.node}
        <label className="f">Business name (optional)<input type="text" value={f.company} onChange={(e) => set('company', e.target.value)} autoComplete="organization" /></label>
        <label className="f">Industry
          <select value={f.industry} onChange={(e) => set('industry', e.target.value)}><option value="">Choose…</option>{INDUSTRIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>{err('industry')}
        </label>
        <label className="f">Number of employees
          <select value={f.size} onChange={(e) => set('size', e.target.value)}><option value="">Choose…</option>{SIZES.map((s) => <option key={s} value={s}>{s}</option>)}</select>{err('size')}
        </label>
        {!noSite && <label className="ps-check"><input type="checkbox" checked={f.authorised} onChange={(e) => set('authorised', e.target.checked)} /><span>I am authorised to assess this website, and I understand this is a read-only scan of public information.</span></label>}{err('authorised')}
        {mismatch && f.authorised && (
          <div className="ps-box"><b>Your email domain is different from the website.</b> We will read only the home page unless you prove ownership. Add one of these, then press verify:
            {tok && <><code>DNS TXT record on {site?.domain}: {tok.dns}</code><code>Or add to your home page: {tok.meta}</code></>}
            <button type="button" className="ps-btn ps-btn-sm ps-btn-ghost" onClick={verifyNow}>Verify now</button>
            {verified === true && <p className="ps-note" style={{ color: 'var(--ps-pass)' }}>Ownership confirmed. The full scan will run.</p>}
            {verified === false && <p className="ps-note" style={{ color: 'var(--ps-fail)' }}>We could not find it yet. DNS can take a while. You can also continue with the home page check.</p>}
          </div>
        )}
        <label className="ps-check"><input type="checkbox" checked={f.consent} onChange={(e) => set('consent', e.target.checked)} /><span>{PS_CONSENT.replace(' I confirm I am authorised to assess the website I entered.', '')}</span></label>{err('consent')}
        {tsKey && !noSite && <div ref={tsRef} />}
        {msg && <p role="alert" className="ps-err">{msg}</p>}
        <button className="ps-btn" disabled={busy}>{busy ? 'Starting…' : noSite ? 'Continue' : 'Start the scan'} <ArrowRight size={18} aria-hidden /></button>
      </form>
    </Shell>
  );
}

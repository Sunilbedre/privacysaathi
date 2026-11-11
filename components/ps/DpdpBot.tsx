'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, MessageCircle, Phone, RotateCcw, Send, X } from 'lucide-react';
import { emailProblem, parseWebsite, phoneProblem } from '@/lib/lead-rules';
import { PS_CONSENT } from '@/lib/ps/config';
import { crore, type DpdpSummary } from '@/lib/ps/dpdp-map';
import { captureTags, track } from './PsTrack';
import { usePsBase } from './PsCtx';
import { otpRequired, otpSend, otpVerify } from './otpClient';
import { CHECK_STEPS, DATA, FIRST, INDUSTRIES, LEARN, NOTE, RECORDS, SIZES, STORAGE, TIMES, TOPICS, YN, YNU, YPN, days, learnAnswer, type Chip, type Flow } from './botFlow';
import Logo from './Logo';
import './psbot.css';

interface Msg { id: number; from: 'bot' | 'me'; text: string }
type D = { flow?: Flow; biz?: string; site?: string; domain?: string; industry?: string; size?: string; data?: string[]; records?: string; storage?: string; hasPolicy?: string; consentRecords?: string; breachPlan?: string; requestOwner?: string; training?: string; vendors?: string; vendorsAns?: string;
  topic?: string; time?: string; name?: string; phone?: string; email?: string; scanId?: string; token?: string; challenge?: string; leadId?: string };
interface Ui { chips?: Chip[]; multi?: Chip[]; input?: { type: 'text' | 'tel' | 'email' | 'url' | 'code'; ph: string }; }

const KEY = 'ps-bot-v1';
const CONSENT = PS_CONSENT.replace(' I confirm I am authorised to assess the website I entered.', '').replace('contact me by phone, WhatsApp, SMS and email', 'contact me by phone, WhatsApp, SMS and email');
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** What Saathi says at each step (lines) and what the visitor can do (chips, multi-select or typing). */
const SAY: Record<string, (d: D) => string[]> = {
  start: () => ['Namaste 👋 I’m Saathi, your DPDP Act assistant.', `The DPDP Act is now law and the main duties apply in about ${days()} days. I can scan your business for free in about 2 minutes and show exactly what is missing. Shall we start?`],
  biz: (d) => [d.flow === 'expert' ? 'Happy to connect you with a Bedre consultant. What is your business name?' : 'Great, let’s begin. What is your business name?'],
  hasSite: (d) => [`Nice to meet ${d.biz}. Do you have a website?`],
  site: () => ['Type your website address, for example yourcompany.com. I will start reading its public pages while we chat.'],
  industry: () => ['Which industry are you in?'],
  size: () => ['How many people work in your business?'],
  data: () => ['What personal data do you collect or handle? Pick all that apply.'],
  records: () => ['Roughly how many people’s data do you hold?'],
  storage: () => ['Where is that data mostly stored?'],
  hasPolicy: () => ['Now a few questions about how you work. Do you have a written privacy notice?'],
  consentRecords: () => ['Do you keep a record of when and how people agreed to share their data?'],
  breachPlan: () => ['Do you have a plan for what to do if there is a data breach?'],
  requestOwner: () => ['Does someone own privacy requests and complaints?'],
  training: () => ['Is your team trained on handling personal data?'],
  vendors: () => ['Do outside vendors handle your customer data (hosting, CRM, payments, marketing tools)?'],
  topic: () => ['What do you need help with?'],
  time: () => ['When is the best time for a call?'],
  name: (d) => [d.flow === 'expert' ? 'Please tell me your name.' : 'That is everything I need. Where should I send your result? Your name, please.'],
  phone: (d) => [`Thanks ${FIRST(d.name ?? '')}. Your mobile number?`],
  otp: () => ['I have sent a 6-digit code to your WhatsApp. Type it here to confirm your number.'],
  email: () => ['And your work email?'],
  consent: () => [CONSENT],
  after: (d) => [`Thank you ${FIRST(d.name ?? '')}. Would you like a Bedre consultant to call you and walk through the result?`],
  learn: () => ['Pick a topic and I will explain it in plain words.'],
  learnMore: () => ['Anything else?'],
  done: (d) => [`All set. A Bedre consultant will contact you on ${d.phone}${d.time && d.time !== 'Any time' ? ` in the ${d.time.toLowerCase()}` : ''}.`, 'You can also message us on WhatsApp anytime.'],
};
const UI: Record<string, Ui> = {
  start: { chips: [['check', 'Start my free DPDP scan'], ['learn', 'Understand the DPDP Act'], ['expert', 'Talk to an expert']] },
  biz: { input: { type: 'text', ph: 'Your business name' } },
  hasSite: { chips: [['yes', 'Yes, I have one'], ['no', 'No website']] },
  site: { input: { type: 'url', ph: 'yourcompany.com' } },
  industry: { chips: INDUSTRIES }, size: { chips: SIZES }, data: { multi: DATA }, records: { chips: RECORDS }, storage: { chips: STORAGE },
  hasPolicy: { chips: YN }, consentRecords: { chips: YPN }, breachPlan: { chips: YPN }, requestOwner: { chips: YN }, training: { chips: YPN }, vendors: { chips: [['no', 'No'], ['yes', 'Yes'], ['unsure', 'Not sure']] },
  topic: { chips: TOPICS }, time: { chips: TIMES },
  name: { input: { type: 'text', ph: 'Your name' } }, phone: { input: { type: 'tel', ph: '+91 98765 43210' } }, otp: { input: { type: 'code', ph: '6-digit code' }, chips: [['resend', 'Send a new code']] },
  email: { input: { type: 'email', ph: 'you@company.com' } }, consent: { chips: [['yes', 'Yes, I agree'], ['no', 'Not now']] },
  after: { chips: [['yes', 'Yes, call me'], ['no', 'No, thanks']] },
  learn: { chips: LEARN }, learnMore: { chips: [['more', 'Another topic'], ['check', 'Check my readiness'], ['expert', 'Talk to an expert']] },
};
const FLOW_STEPS: Record<Flow, readonly string[]> = { check: CHECK_STEPS, expert: ['biz', 'topic', 'time', 'name', 'phone', 'email', 'consent'], learn: [] };

export default function DpdpBot({ open, onClose, whatsapp, call, booking }: { open: boolean; onClose: () => void; whatsapp?: string; call?: string; booking: string }) {
  const base = usePsBase();
  const [msgs, setMsgs] = useState<Msg[]>([]), [step, setStep] = useState('start'), [d, setD] = useState<D>({});
  const [typing, setTyping] = useState(false), [busy, setBusy] = useState(false), [text, setText] = useState(''), [sel, setSel] = useState<string[]>([]), [err, setErr] = useState('');
  const [result, setResult] = useState<{ id: string; sum: DpdpSummary } | null>(null);
  const dd = useRef<D>({}), idRef = useRef(1), started = useRef(false), scan = useRef<Promise<string | null> | null>(null), box = useRef<HTMLDivElement>(null), inp = useRef<HTMLInputElement>(null), otpOn = useRef<boolean | null>(null);
  const flow = d.flow ?? 'check';

  const upd = (p: Partial<D>) => { dd.current = { ...dd.current, ...p }; setD(dd.current); };
  const push = (from: Msg['from'], t: string) => setMsgs((m) => [...m, { id: idRef.current++, from, text: t }]);
  const say = async (lines: string[]) => { for (const l of lines) { setTyping(true); await wait(Math.min(1100, 380 + l.length * 7)); setTyping(false); push('bot', l); } };
  const go = async (s: string) => { setSel([]); setText(''); setErr(''); setStep('typing'); await say(SAY[s](dd.current)); setStep(s); };

  // Save and restore the chat for this browser session.
  useEffect(() => { try { if (msgs.length) sessionStorage.setItem(KEY, JSON.stringify({ msgs: msgs.slice(-80), step: ['typing', 'working'].includes(step) ? 'consent' : step === 'otp' ? 'phone' : step, d, result })); } catch { /* storage unavailable */ } }, [msgs, step, d, result]);
  useEffect(() => {
    if (!open || started.current) return; started.current = true; track('bot_opened');
    try { const s = JSON.parse(sessionStorage.getItem(KEY) || 'null'); if (s?.msgs?.length) { setMsgs(s.msgs); idRef.current = s.msgs.length + 5; dd.current = s.d ?? {}; setD(dd.current); setResult(s.result ?? null); setStep(s.step ?? 'start'); return; } } catch { /* ignore */ }
    void go('start'); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight, behavior: 'smooth' }); }, [msgs, typing, step, result]);
  useEffect(() => { if (open && inp.current) inp.current.focus({ preventScroll: true }); }, [step, open]);
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k); }, [open, onClose]);

  const restart = () => { try { sessionStorage.removeItem(KEY); } catch { /* ignore */ } dd.current = {}; setD({}); setMsgs([]); setResult(null); scan.current = null; setErr(''); void go('start'); };

  /** Reads the website in the background while the visitor answers the questions. */
  const startScan = (domain: string) => {
    scan.current = (async () => {
      const r = await fetch('/api/ps/scan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ website: domain, authorised: false }) }).catch(() => null);
      const j = r ? await r.json().catch(() => ({})) : {};
      if (!r || !r.ok || !j.id) return null;
      for (let i = 0; i < 70; i++) { await wait(900); const p = await fetch(`/api/ps/scan/${j.id}?d=1`, { cache: 'no-store' }).then((x) => x.json()).catch(() => null); if (p?.status === 'error') return null; if (p?.status === 'done') return j.id as string; }
      return null;
    })();
  };

  const sendCode = async () => {
    setBusy(true);
    const r = await otpSend(dd.current.phone ?? ''); setBusy(false);
    if (!r.ok) { await say([r.error]); await go('phone'); return; }
    upd({ challenge: r.challenge }); await go('otp');
  };

  const nextAfterPhone = async () => {
    if (otpOn.current === null) otpOn.current = await otpRequired();
    if (otpOn.current && !dd.current.token) { await sendCode(); return; }
    await go('email');
  };

  const submit = async () => {
    const x = dd.current; setStep('working'); setBusy(true);
    const c = flow === 'expert';
    await say([c ? 'Sending your request…' : `Thanks ${FIRST(x.name ?? '')}. Putting your result together…`]);
    const answers: Record<string, unknown> = { hasPolicy: x.hasPolicy, consentRecords: x.consentRecords, breachPlan: x.breachPlan, requestOwner: x.requestOwner, training: x.training, vendors: x.vendors, children: x.data?.includes('children') ? 'yes' : 'no', data: x.data, records: x.records, storage: x.storage };
    for (const k of Object.keys(answers)) if (answers[k] === undefined) delete answers[k];
    let id: string | null = null;
    if (!c) {
      id = scan.current ? await scan.current : null;
      const asr = await fetch('/api/ps/assess', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scanId: id ?? undefined, company: x.biz, industry: x.industry || 'other', answers: { hasPolicy: x.hasPolicy, consentRecords: x.consentRecords, breachPlan: x.breachPlan, requestOwner: x.requestOwner, training: x.training, vendors: x.vendors, children: answers.children } }) }).catch(() => null);
      const aj = asr ? await asr.json().catch(() => ({})) : {}; if (asr?.ok && aj.id) id = aj.id;
    }
    const free = !!emailProblem(x.email ?? '') && !/valid email/i.test(emailProblem(x.email ?? '') ?? '');
    const lr = await fetch('/api/ps/lead', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
      scanId: id ?? undefined, name: x.name, email: x.email, phone: x.phone, website: x.domain ?? '', noWebsite: !x.domain, company: x.biz, industry: x.industry || 'other', size: x.size ?? '', officialEmail: free ? 'no' : 'yes',
      answers: c ? {} : answers, consent: true, authorised: true, hp: '', otpToken: x.token, topic: c ? x.topic ?? '' : '', message: c ? `Asked for an expert call via chat${x.time ? ` (${x.time})` : ''}` : 'Completed the DPDP readiness chat',
      tags: { ...captureTags(), form_page: location.pathname, lead_source: c ? 'chatbot_expert' : 'chatbot', preferred_time: x.time ?? '' },
    }) }).catch(() => null);
    const lj = lr ? await lr.json().catch(() => ({})) : {};
    setBusy(false);
    if (!lr || !lr.ok) {
      await say([lj.error ?? 'Something went wrong while saving. Please try again.']);
      if (lj.field === 'phone') { upd({ token: undefined }); await go('phone'); } else await go('consent');
      return;
    }
    upd({ leadId: lj.id }); track(c ? 'bot_expert_requested' : 'bot_completed');
    if (c) { await go('done'); return; }
    const fr = await fetch(`/api/ps/scan/${lj.id}?full=1`, { cache: 'no-store' }).then((r2) => r2.json()).catch(() => null);
    if (fr?.dpdp) { setResult({ id: lj.id, sum: fr.dpdp }); await say(['Here is your DPDP snapshot.']); }
    else await say(['Your details are saved. A Bedre consultant will share the result with you.']);
    await go('after');
  };

  const callMe = async (yes: boolean) => {
    if (!yes) { await say(['No problem. Your result is yours to keep. You can reopen it any time from the link below.']); setStep('end'); return; }
    upd({ topic: 'Review my readiness report' }); await go('time');
  };

  const finishCall = async (time: string) => {
    upd({ time }); setBusy(true);
    const x = dd.current;
    const r = await fetch('/api/ps/enquiry', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scanId: x.leadId, duty: 'all', name: x.name, phone: x.phone, email: x.email, message: 'Asked for a call from the DPDP chat', preferredTime: time, consent: true, hp: '' }) }).catch(() => null);
    setBusy(false);
    if (!r?.ok) { await say(['I could not book that just now, but your details are saved and the team will reach out.']); setStep('end'); return; }
    track('bot_expert_requested'); await go('done'); setStep('end');
  };

  /** Handles one answer and moves the conversation on. */
  const answer = async (value: string, label: string) => {
    if (busy || typing || step === 'typing' || step === 'working') return;
    push('me', label); setErr(''); setText(''); setSel([]);
    const f = (k: keyof D, v: string) => upd({ [k]: v } as Partial<D>);
    const note = async (k: string, v: string) => { const n = NOTE[k]?.[v]; if (n) await say([n]); };
    switch (step) {
      case 'start':
        if (value === 'check') { upd({ flow: 'check' }); track('bot_started'); await go('biz'); }
        else if (value === 'expert') { upd({ flow: 'expert' }); await go('biz'); }
        else { upd({ flow: 'learn' }); await go('learn'); }
        break;
      case 'learn': await say(learnAnswer(value)); await go('learnMore'); break;
      case 'learnMore': if (value === 'more') await go('learn'); else { upd({ flow: value === 'check' ? 'check' : 'expert' }); if (value === 'check') track('bot_started'); await go('biz'); } break;
      case 'biz': f('biz', value); await go(dd.current.flow === 'expert' ? 'topic' : 'hasSite'); break;
      case 'hasSite': if (value === 'yes') await go('site'); else { upd({ domain: undefined }); await say(['No problem, I will go by your answers instead.']); await go('industry'); } break;
      case 'site': { const s = parseWebsite(value)!; upd({ site: value, domain: s.domain }); startScan(s.domain); await say([`Thanks. I am reading ${s.domain} in the background now.`]); await go('industry'); break; }
      case 'industry': f('industry', value); await go('size'); break;
      case 'size': f('size', value); await go('data'); break;
      case 'data': { const arr = value ? value.split(',') : []; upd({ data: arr }); for (const k of arr) if (NOTE.data[k]) { await note('data', k); break; } await go('records'); break; }
      case 'records': f('records', value); await go('storage'); break;
      case 'storage': f('storage', value); await go('hasPolicy'); break;
      case 'hasPolicy': case 'consentRecords': case 'breachPlan': case 'requestOwner': case 'training': case 'vendors': {
        upd({ [step]: value } as Partial<D>); await note(step, value);
        const order = ['hasPolicy', 'consentRecords', 'breachPlan', 'requestOwner', 'training', 'vendors', 'name'];
        await go(order[order.indexOf(step) + 1]); break; }
      case 'topic': f('topic', value); await go('time'); break;
      case 'time': if (dd.current.leadId) { await finishCall(value); } else { f('time', value); await go('name'); } break;
      case 'name': f('name', value); await go('phone'); break;
      case 'phone': f('phone', value); upd({ token: undefined }); await nextAfterPhone(); break;
      case 'otp':
        if (value === 'resend') { await sendCode(); break; }
        { setBusy(true); const r = await otpVerify(dd.current.phone ?? '', dd.current.challenge ?? '', value); setBusy(false);
          if (!r.ok) { await say([r.error]); if (r.expired) await sendCode(); else setStep('otp'); break; }
          upd({ token: r.token }); await say(['✓ Number verified.']); await go('email'); }
        break;
      case 'email': f('email', value.toLowerCase()); await go('consent'); break;
      case 'consent': if (value === 'yes') await submit(); else { await say(['I need your OK to contact you and save your details to show the result. You can agree below, or close the chat.']); await go('consent'); } break;
      case 'after': await callMe(value === 'yes'); break;
      default: break;
    }
  };

  const ui = UI[step];
  const submitText = (e: React.FormEvent) => {
    e.preventDefault(); const v = text.trim(); if (!v || !ui?.input) return;
    const t = ui.input.type;
    if (step === 'biz' && v.length < 2) return setErr('Please enter your business name');
    if (step === 'site' && !parseWebsite(v)) return setErr('Enter a valid website, for example yourcompany.com');
    if (step === 'name' && v.length < 2) return setErr('Please enter your name');
    if (t === 'tel') { const p = phoneProblem(v); if (p) return setErr(p); }
    if (t === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return setErr('Please enter a valid email');
    if (t === 'code' && v.replace(/\D/g, '').length !== 6) return setErr('Enter the 6-digit code');
    void answer(t === 'code' ? v.replace(/\D/g, '') : v, t === 'code' ? '• • • • • •' : v);
  };

  const steps = FLOW_STEPS[flow]; const pos = steps.indexOf(step); const pct = flow === 'learn' || pos < 0 ? (step === 'after' || step === 'done' || step === 'end' ? 100 : 0) : Math.round(((pos + 1) / steps.length) * 100);
  const waHref = whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent('Hi, I would like help with DPDP compliance (from the Privacy Saathi website).')}` : '';
  const telHref = call ? `tel:${call.replace(/[^\d+]/g, '')}` : '';
  const E = result?.sum.exposure;

  if (!open) return null;
  return (
    <section className="psb-panel" role="dialog" aria-label="DPDP assistant chat" aria-modal="false">
      <header className="psb-head">
        <span className="psb-av"><Logo variant="mark" height={30} className="psb-av-img" /></span>
        <div><b>Saathi</b><small><i aria-hidden /> DPDP assistant · replies instantly</small></div>
        <div className="psb-head-r">{waHref && <a className="psb-ic wa" href={waHref} target="_blank" rel="noopener" aria-label="Chat on WhatsApp" title="WhatsApp" onClick={() => track('dock_whatsapp')}><MessageCircle size={16} aria-hidden /></a>}{telHref && <a className="psb-ic" href={telHref} aria-label="Call us" title="Call" onClick={() => track('dock_call')}><Phone size={16} aria-hidden /></a>}<button type="button" onClick={restart} aria-label="Start over" title="Start over"><RotateCcw size={16} aria-hidden /></button><button type="button" onClick={onClose} aria-label="Close chat"><X size={18} aria-hidden /></button></div>
        <div className="psb-prog" aria-hidden><i style={{ width: `${pct}%` }} /></div>
      </header>

      <div className="psb-body" ref={box} role="log" aria-live="polite">
        {msgs.map((m) => <div key={m.id} className={`psb-m ${m.from}`}>{m.from === 'bot' && <span className="psb-mav"><MessageCircle size={13} aria-hidden /></span>}<p>{m.text}</p></div>)}
        {typing && <div className="psb-m bot"><span className="psb-mav"><MessageCircle size={13} aria-hidden /></span><p className="psb-dots" aria-label="Saathi is typing"><i /><i /><i /></p></div>}

        {result && E && (
          <div className="psb-card" aria-label="Your DPDP snapshot">
            <div className="psb-card-top">
              <div className={`psb-ring ${result.sum.score < 35 ? 'bad' : result.sum.score < 60 ? 'warn' : result.sum.score < 80 ? 'mid' : 'good'}`} style={{ ['--p' as string]: result.sum.score }}><div><b>{result.sum.score}</b><small>of 100</small></div></div>
              <div><b className="psb-band">{result.sum.band}</b><span>{E.level === 'none' ? 'No gaps found in what we could check' : `Fine exposure: up to ${crore(E.maxCr)}`}</span></div>
            </div>
            <ul className="psb-counts"><li className="gap"><b>{result.sum.counts.gap}</b>gaps</li><li className="review"><b>{result.sum.counts.review}</b>to review</li><li className="ok"><b>{result.sum.counts.ok}</b>no issues</li></ul>
            {result.sum.duties.filter((x) => x.status === 'gap' || x.status === 'review').slice(0, 3).map((x) => <p key={x.id} className={`psb-gap ${x.status}`}>{x.label}<em>{x.ref}</em></p>)}
            <div className="psb-card-act"><a className="psb-btn" href={`${base}/report/${result.id}`} target="_blank" rel="noopener">Open full report <ArrowRight size={15} aria-hidden /></a></div>
          </div>
        )}

        {!typing && (ui || step === 'end' || step === 'done') && step !== 'typing' && step !== 'working' && (
          <div className="psb-ui">
            {ui?.chips && <div className="psb-chips">{ui.chips.map(([v, l]) => <button key={v} type="button" className={`psb-chip${step === 'start' && v === 'check' ? ' primary' : ''}`} disabled={busy} onClick={() => answer(v, l)}>{l}{step === 'start' && v === 'check' ? ' \u2192' : ''}</button>)}</div>}
            {ui?.multi && (<>
              <div className="psb-chips">{ui.multi.map(([v, l]) => <button key={v} type="button" aria-pressed={sel.includes(v)} className={`psb-chip${sel.includes(v) ? ' on' : ''}`} onClick={() => setSel((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]))}>{sel.includes(v) ? '✓ ' : ''}{l}</button>)}</div>
              <button type="button" className="psb-btn psb-done" disabled={busy} onClick={() => answer(sel.join(','), sel.length ? ui!.multi!.filter(([v]) => sel.includes(v)).map(([, l]) => l).join(', ') : 'None of these')}>{sel.length ? `Continue (${sel.length})` : 'None of these'} <ArrowRight size={15} aria-hidden /></button>
            </>)}
            {step === 'end' && <div className="psb-chips">{waHref && <a className="psb-chip wa" href={waHref} target="_blank" rel="noopener">Chat on WhatsApp</a>}<a className="psb-chip" href={booking} target="_blank" rel="noopener" onClick={() => track('booking_clicked')}>Book a free review</a><button type="button" className="psb-chip" onClick={restart}>Start over</button></div>}
            {step === 'done' && waHref && <div className="psb-chips"><a className="psb-chip wa" href={waHref} target="_blank" rel="noopener">Chat on WhatsApp</a></div>}
          </div>
        )}
      </div>

      {ui?.input && !typing && step !== 'typing' && (
        <form className="psb-in" onSubmit={submitText} noValidate>
          {err && <span role="alert" className="psb-err">{err}</span>}
          <div>
            <input ref={inp} value={text} onChange={(e) => { setText(e.target.value); setErr(''); }} type={ui.input.type === 'code' ? 'text' : ui.input.type} inputMode={ui.input.type === 'tel' || ui.input.type === 'code' ? 'numeric' : undefined} autoComplete={ui.input.type === 'tel' ? 'tel' : ui.input.type === 'email' ? 'email' : step === 'name' ? 'name' : step === 'biz' ? 'organization' : ui.input.type === 'code' ? 'one-time-code' : 'off'} placeholder={ui.input.ph} maxLength={ui.input.type === 'code' ? 6 : 120} aria-label={ui.input.ph} disabled={busy} />
            <button type="submit" aria-label="Send" disabled={busy || !text.trim()}><Send size={18} aria-hidden /></button>
          </div>
        </form>
      )}
      <p className="psb-foot">Not legal advice. Your details are used only to share your result and contact you.</p>
    </section>
  );
}

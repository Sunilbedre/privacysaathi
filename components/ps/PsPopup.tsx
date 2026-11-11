'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowRight, CircleCheck, X } from 'lucide-react';
import { emailProblem, parseWebsite, phoneProblem } from '@/lib/lead-rules';
import { PS_CONSENT } from '@/lib/ps/config';
import { captureTags, track } from './PsTrack';
import { usePsBase } from './PsCtx';
import { useOtp } from './useOtp';

/** Pages where the popup never appears: the funnel pages themselves, legal pages and the DPDP page (it has its own assessment). */
const SKIP = /^\/(scan|report|thanks|sign-in|portal|privacy|terms|dpdp)(\/|$)/;
const DAY = 86400_000;
const get = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const set = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } };

export default function PsPopup() {
  const router = useRouter(), base = usePsBase(), path = usePathname() ?? '/';
  const rel = path.startsWith(base) ? path.slice(base.length) || '/' : path;
  const [open, setOpen] = useState(false), [mode, setMode] = useState<'site' | 'nosite'>('site');
  const [f, setF] = useState({ site: '', company: '', name: '', phone: '', email: '', consent: false, hp: '' });
  const otp = useOtp(f.phone);
  const [errs, setErrs] = useState<Record<string, string>>({}), [state, setState] = useState<'form' | 'scanning' | 'done'>('form'), [pct, setPct] = useState(0);
  const dlg = useRef<HTMLDivElement>(null), opener = useRef<HTMLElement | null>(null), fired = useRef(false);
  const blocked = SKIP.test(rel);

  const show = useCallback((manual = false) => {
    if (fired.current && !manual) return;
    if (!manual && document.querySelector('.psb-panel')) return;
    if (!manual && (get('ps-lead-done') && Date.now() - Number(get('ps-lead-done')) < 7 * DAY)) return;
    if (!manual && (get('ps-popup-closed') && Date.now() - Number(get('ps-popup-closed')) < 3 * DAY)) return;
    fired.current = true; opener.current = document.activeElement as HTMLElement; setOpen(true); track('popup_shown', { manual });
  }, []);
  const close = useCallback(() => { setOpen(false); set('ps-popup-closed', String(Date.now())); opener.current?.focus?.(); }, []);

  // Triggers: time on page, scroll depth, exit intent (desktop). First one wins.
  useEffect(() => {
    if (blocked) return;
    const t = setTimeout(() => show(), 22_000);
    const onScroll = () => { const h = document.documentElement; if ((window.scrollY + innerHeight) / h.scrollHeight > 0.55) show(); };
    const onOut = (e: MouseEvent) => { if (e.clientY <= 0 && !e.relatedTarget && innerWidth > 1040) show(); };
    window.addEventListener('scroll', onScroll, { passive: true }); document.addEventListener('mouseout', onOut);
    return () => { clearTimeout(t); window.removeEventListener('scroll', onScroll); document.removeEventListener('mouseout', onOut); };
  }, [blocked, show]);
  // Manual openers: any element with data-ps-popup, or window.dispatchEvent(new Event('ps:popup')).
  useEffect(() => {
    const onClick = (e: MouseEvent) => { const el = (e.target as HTMLElement | null)?.closest('[data-ps-popup]'); if (el) { e.preventDefault(); show(true); } };
    const onEvt = () => show(true);
    document.addEventListener('click', onClick); window.addEventListener('ps:popup', onEvt);
    return () => { document.removeEventListener('click', onClick); window.removeEventListener('ps:popup', onEvt); };
  }, [show]);
  // Dialog behaviour: Escape, focus trap, scroll lock.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    setTimeout(() => dlg.current?.querySelector<HTMLElement>('input:not([tabindex="-1"])')?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab' && dlg.current) {
        const els = [...dlg.current.querySelectorAll<HTMLElement>('button,input:not([tabindex="-1"]),select,a[href]')].filter((x) => !x.hasAttribute('disabled'));
        if (!els.length) return; const a = els[0], z = els[els.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); };
  }, [open, close]);

  const up = (k: string, v: string | boolean) => { setF((p) => ({ ...p, [k]: v })); setErrs((e) => ({ ...e, [k]: '' })); };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const er: Record<string, string> = {};
    const s = parseWebsite(f.site);
    if (mode === 'site' && !s) er.site = 'Enter your website, for example yourcompany.com';
    if (mode === 'nosite' && f.company.trim().length < 2) er.company = 'Please enter your company name';
    if (f.name.trim().length < 2) er.name = 'Please enter your name';
    const pp = phoneProblem(f.phone) || otp.check(); if (pp) er.phone = pp;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) er.email = 'Please enter a valid email';
    if (!f.consent) er.consent = 'Please tick the consent box';
    setErrs(er); if (Object.keys(er).length) return;
    const free = !!emailProblem(f.email) && !/valid email/i.test(emailProblem(f.email) ?? '');
    const lead = (scanId?: string) => fetch('/api/ps/lead', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
      scanId, name: f.name, email: f.email, phone: f.phone, website: mode === 'site' ? s!.domain : '', noWebsite: mode === 'nosite', company: f.company, industry: 'other',
      officialEmail: free ? 'no' : 'yes', answers: {}, consent: true, authorised: true, hp: f.hp, otpToken: otp.token, tags: { ...captureTags(), form_page: location.pathname, lead_source: 'popup' },
    }) }).then(async (r) => ({ ok: r.ok, j: await r.json().catch(() => ({})) })).catch(() => ({ ok: false, j: {} as Record<string, string> }));

    if (mode === 'nosite') {
      const r = await lead(); if (!r.ok) { setErrs({ form: (r.j as { error?: string }).error ?? 'Something went wrong. Please try again.' }); return; }
      set('ps-lead-done', String(Date.now())); track('popup_lead', { mode }); setState('done'); return;
    }
    setState('scanning'); setPct(3);
    const sr = await fetch('/api/ps/scan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ website: s!.domain, authorised: false }) }).catch(() => null);
    const sj = sr ? await sr.json().catch(() => ({})) : {};
    if (!sr || !sr.ok) { setState('form'); setErrs({ form: sj.error ?? 'Could not start the scan. Please try again.' }); return; }
    for (let i = 0; i < 70; i++) {
      await new Promise((ok) => setTimeout(ok, 900));
      const p = await fetch(`/api/ps/scan/${sj.id}`, { cache: 'no-store' }).then((x) => x.json()).catch(() => null);
      if (!p) continue; setPct(p.pct ?? 0);
      if (p.status === 'error') { setState('form'); setErrs({ form: p.error ?? 'We could not scan that website.' }); return; }
      if (p.status === 'done') {
        const r = await lead(sj.id);
        if (!r.ok) { setState('form'); setErrs({ form: (r.j as { error?: string }).error ?? 'Something went wrong. Please try again.' }); return; }
        set('ps-lead-done', String(Date.now())); track('popup_lead', { mode }); setOpen(false); router.push(`${base}/report/${sj.id}`); return;
      }
    }
    setState('form'); setErrs({ form: 'The scan took too long. Please try again.' });
  }

  if (!open) return null;
  const err = (k: string) => (errs[k] ? <span role="alert" className="ps-pu-err">{errs[k]}</span> : null);
  return (
    <div className="ps-pu" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="ps-pu-box" role="dialog" aria-modal="true" aria-labelledby="pu-h" ref={dlg}>
        <button type="button" className="ps-pu-x" onClick={close} aria-label="Close"><X size={18} /></button>
        <aside className="ps-pu-l">
          <span className="ps-rh-pill">Free DPDP check</span>
          <h2 id="pu-h">Is your website DPDP-ready?</h2>
          <p>See what is missing and the fines at stake, in under a minute.</p>
          <ul><li>Gaps mapped to the eight DPDP duties</li><li>Maximum fine per duty, up to ₹250 crore</li><li>Fix steps in your private report</li></ul>
          <small>Technology check, not legal advice. Read-only.</small>
        </aside>
        <div className="ps-pu-r">
          {state === 'done' ? (
            <div className="ps-pu-done" role="status"><CircleCheck size={40} aria-hidden /><h3>Thank you</h3><p>A Bedre consultant will be in touch. Want an instant result now?</p>
              <a className="ps-pu-btn" href={`${base}/dpdp#top`} onClick={() => setOpen(false)}>Take the 2-minute assessment <ArrowRight size={18} aria-hidden /></a></div>
          ) : state === 'scanning' ? (
            <div className="ps-pu-scan" role="status" aria-live="polite"><h3>Scanning {parseWebsite(f.site)?.domain}</h3><p>Reading public information only. Your report opens automatically.</p><div className="ps-dc-bar" aria-hidden><i style={{ width: `${pct}%` }} /></div></div>
          ) : (
            <form onSubmit={submit} noValidate>
              <div className="ps-pu-tabs" role="tablist"><button type="button" role="tab" aria-selected={mode === 'site'} className={mode === 'site' ? 'on' : ''} onClick={() => setMode('site')}>I have a website</button><button type="button" role="tab" aria-selected={mode === 'nosite'} className={mode === 'nosite' ? 'on' : ''} onClick={() => setMode('nosite')}>No website</button></div>
              <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.hp} onChange={(e) => up('hp', e.target.value)} style={{ position: 'absolute', left: -9999 }} />
              {mode === 'site' ? <label>Company website<input value={f.site} onChange={(e) => up('site', e.target.value)} inputMode="url" autoComplete="url" placeholder="yourcompany.com" />{err('site')}</label>
                : <label>Company name<input value={f.company} onChange={(e) => up('company', e.target.value)} autoComplete="organization" />{err('company')}</label>}
              <label>Your name<input value={f.name} onChange={(e) => up('name', e.target.value)} autoComplete="name" />{err('name')}</label>
              <div className="ps-pu-two">
                <label>Mobile number<input type="tel" value={f.phone} onChange={(e) => up('phone', e.target.value)} autoComplete="tel" placeholder="+91 98765 43210" />{err('phone')}</label>
                <label>Work email<input type="email" value={f.email} onChange={(e) => up('email', e.target.value)} autoComplete="email" placeholder="you@company.com" />{err('email')}</label>
              </div>
              {otp.node}
              <label className="ps-pu-chk"><input type="checkbox" checked={f.consent} onChange={(e) => up('consent', e.target.checked)} /><span>{PS_CONSENT.replace(' I confirm I am authorised to assess the website I entered.', '')}</span></label>{err('consent')}
              {errs.form && <p role="alert" className="ps-pu-err">{errs.form}</p>}
              <button className="ps-pu-btn">{mode === 'site' ? 'Scan and send me the report' : 'Request my DPDP review'} <ArrowRight size={18} aria-hidden /></button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';
import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Globe2, Lock } from 'lucide-react';
import { submitDpdpLead, type LpState } from '@/app/lp/dpdp/actions';
import { emailDomain, emailProblem, parseWebsite, phoneProblem, sameCompany } from '@/lib/lead-rules';

const init: LpState = { ok: false };
const TRACK = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid'] as const;

declare global { interface Window { gtag?: (...a: unknown[]) => void; dataLayer?: unknown[] } }

export default function LpForm({ thanksHref, id = 'lead-form' }: { thanksHref: string; id?: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(submitDpdpLead, init);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [email, setEmail] = useState('');
  const [site, setSite] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [track, setTrack] = useState<Record<string, string>>({});
  const fired = useRef(false);
  const e = state.errors ?? {};
  const v = state.values ?? {};

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const t: Record<string, string> = { ref: document.referrer.slice(0, 300) };
    for (const k of TRACK) t[k] = q.get(k) ?? '';
    setTrack(t);
  }, []);
  useEffect(() => { if (v.email) setEmail(v.email); if (v.website) setSite(v.website); if (v.name) setName(v.name); if (v.phone) setPhone(v.phone); }, [v.email, v.website, v.name, v.phone]);

  useEffect(() => {
    if (!state.ok || fired.current) return;
    fired.current = true;
    try {
      window.gtag?.('event', 'generate_lead', { event_category: 'dpdp_landing', value: 1 });
      window.dataLayer?.push({ event: 'dpdp_lead' });
    } catch { /* analytics unavailable */ }
    router.push(thanksHref);
  }, [state.ok, router, thanksHref]);

  const parsed = useMemo(() => parseWebsite(site), [site]);
  const emailMsg = touched.email && email ? emailProblem(email) : null;
  const siteMsg = touched.website && site && !parsed ? 'Enter a valid website, for example yourcompany.com' : null;
  const phoneMsg = touched.phone && phone ? phoneProblem(phone) : null;
  const mismatch = !!parsed && !emailProblem(email) && !sameCompany(emailDomain(email), parsed.domain);
  const err = (k: string, local?: string | null) => { const m = e[k] || local; return m ? <span role="alert" className="ct-err">{m}</span> : null; };

  return (
    <form id={id} className="lp-form" action={action} noValidate>
      <div className="lp-form-h"><b>Get your free DPDP readiness review</b><span>Takes 30 seconds. No payment.</span></div>
      {TRACK.map((k) => <input key={k} type="hidden" name={k} value={track[k] ?? ''} />)}
      <input type="hidden" name="ref" value={track.ref ?? ''} />
      <input type="text" name="website_confirm" tabIndex={-1} autoComplete="off" aria-hidden="true" className="lp-hp" />

      <label className="f">Your name
        <input type="text" name="name" value={name} onChange={(x) => setName(x.target.value)} autoComplete="name" placeholder="Jane Doe" required aria-invalid={!!e.name} />{err('name')}
      </label>
      <label className="f">Official work email
        <input type="email" name="email" value={email} onChange={(x) => setEmail(x.target.value)} onBlur={() => setTouched((t) => ({ ...t, email: true }))} autoComplete="email" placeholder="jane@yourcompany.com" required aria-invalid={!!(e.email || emailMsg)} inputMode="email" />
        {err('email', emailMsg)}
      </label>
      <label className="f">Company website
        <input type="text" name="website" value={site} onChange={(x) => setSite(x.target.value)} onBlur={() => setTouched((t) => ({ ...t, website: true }))} autoComplete="url" placeholder="yourcompany.com" required aria-invalid={!!(e.website || siteMsg)} inputMode="url" />
        {err('website', siteMsg)}
        {parsed ? <span className="lp-dom"><Globe2 size={14} /> Domain: <b>{parsed.domain}</b>{mismatch ? <em> · your email uses a different domain; that is fine, we will check</em> : <Check size={14} />}</span> : null}
      </label>
      <label className="f">Phone number
        <input type="tel" name="phone" value={phone} onChange={(x) => setPhone(x.target.value)} onBlur={() => setTouched((t) => ({ ...t, phone: true }))} autoComplete="tel" placeholder="+91 98765 43210" required aria-invalid={!!(e.phone || phoneMsg)} inputMode="tel" />
        {err('phone', phoneMsg)}
      </label>
      <label className="ct-consent">
        <input type="checkbox" name="consent" checked={consent} onChange={(x) => setConsent(x.target.checked)} aria-invalid={!!e.consent} />
        <span>I agree that Bedre may contact me about this request. See the <a className="lnk" href="/privacy" target="_blank">privacy notice</a>.</span>
      </label>
      {err('consent')}
      {state.message ? <p role="alert" className="ct-err">{state.message}</p> : null}
      <button className="btn pri lp-go" disabled={pending || state.ok}>{pending || state.ok ? 'Sending…' : <>Get my free review <ArrowRight size={18} /></>}</button>
      <p className="lp-fine"><Lock size={13} /> Your details are used only to reply to you. A consultant replies within one working day.</p>
    </form>
  );
}

'use client';
import { useEffect, useRef, useState } from 'react';
import { phoneProblem } from '@/lib/lead-rules';

/**
 * Mobile verification by WhatsApp code. Used by every form that asks for a phone number.
 * `node` goes under the phone field. `token` goes to the server with the form. `check()` returns an error text when the form must not be sent yet.
 * When verification is switched off on the server, `required` is false and `node` is empty, so the forms behave as before.
 */
const digitsOf = (p: string) => { const d = p.replace(/\D/g, ''); return d.length === 10 ? '91' + d : d.length === 11 && d.startsWith('0') ? '91' + d.slice(1) : d; };

export function useOtp(phone: string) {
  const [required, setRequired] = useState(false);
  const [challenge, setChallenge] = useState(''), [code, setCode] = useState('');
  const [verified, setVerified] = useState<{ num: string; token: string } | null>(null);
  const [msg, setMsg] = useState(''), [busy, setBusy] = useState(false), [wait, setWait] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const num = digitsOf(phone);

  useEffect(() => {
    fetch('/api/ps/otp', { cache: 'no-store' }).then((r) => r.json()).then((j) => setRequired(!!j.required)).catch(() => { /* leave off */ });
    try { const s = JSON.parse(sessionStorage.getItem('ps-otp') || 'null'); if (s?.num && s?.token) setVerified(s); } catch { /* storage unavailable */ }
    return () => { if (timer.current) clearInterval(timer.current); };
  }, []);

  const ok = !!verified && verified.num === num;
  const startWait = () => { setWait(45); if (timer.current) clearInterval(timer.current); timer.current = setInterval(() => setWait((w) => { if (w <= 1 && timer.current) clearInterval(timer.current); return Math.max(0, w - 1); }), 1000); };

  async function send() {
    const pp = phoneProblem(phone); if (pp) { setMsg(pp); return; }
    setBusy(true); setMsg('');
    const r = await fetch('/api/ps/otp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'send', phone }) }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    setBusy(false);
    if (!r || !r.ok) { setMsg(j.error ?? 'Could not send the code. Please try again.'); return; }
    setChallenge(j.challenge); setCode(''); startWait(); setMsg('We sent a 6-digit code to your WhatsApp.');
  }
  async function verify() {
    if (code.replace(/\D/g, '').length !== 6) { setMsg('Enter the 6-digit code.'); return; }
    setBusy(true); setMsg('');
    const r = await fetch('/api/ps/otp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'verify', phone, challenge, code }) }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    setBusy(false);
    if (!r || !r.ok) { setMsg(j.error ?? 'Could not check the code. Please try again.'); if (j.expired) setChallenge(''); return; }
    const v = { num, token: j.token as string }; setVerified(v); setChallenge(''); setMsg('');
    try { sessionStorage.setItem('ps-otp', JSON.stringify(v)); } catch { /* ignore */ }
  }

  const node = !required ? null : ok ? (
    <div className="ps-otp ok" role="status">✓ Mobile number verified</div>
  ) : (
    <div className="ps-otp">
      {!challenge ? (
        <button type="button" className="ps-otp-btn" onClick={send} disabled={busy}>{busy ? 'Sending…' : 'Verify with WhatsApp code'}</button>
      ) : (
        <div className="ps-otp-row">
          <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="6-digit code" aria-label="WhatsApp verification code" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void verify(); } }} />
          <button type="button" className="ps-otp-btn" onClick={verify} disabled={busy}>{busy ? 'Checking…' : 'Verify'}</button>
          <button type="button" className="ps-otp-link" onClick={send} disabled={busy || wait > 0}>{wait > 0 ? `Resend in ${wait}s` : 'Resend code'}</button>
        </div>
      )}
      {msg && <span role="status" className="ps-otp-msg">{msg}</span>}
      {!challenge && !msg && <span className="ps-otp-msg">We will send a one-time code to this number on WhatsApp.</span>}
    </div>
  );

  return { required, verified: ok, token: ok ? verified!.token : '', node, check: () => (required && !ok ? 'Please verify your mobile number with the WhatsApp code' : '') };
}

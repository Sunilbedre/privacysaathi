'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { parseWebsite } from '@/lib/lead-rules';
import type { Quick, QuickNode } from '@/lib/scan/nodes';
import { PsLink } from './PsCtx';
import { track } from './PsTrack';

type Phase = 'idle' | 'scanning' | 'done' | 'error';
const COLORS: Record<string, string> = { pass: '#3DDC97', warn: '#FFB84D', fail: '#FF5C6C', unknown: '#7C8AA8', idle: '#5B6B8C' };
const IDLE: QuickNode[] = ['Notice', 'Consent', 'Trackers', 'Security', 'Email', 'Processes'].map((l) => ({ id: l.toLowerCase(), label: l, status: 'unknown', issues: 0 }));
const ang = (i: number) => (-90 + i * 60) * (Math.PI / 180);
const RAD = 0.37; // node ring radius as a fraction of the stage size

declare global { interface Window { turnstile?: { render: (el: HTMLElement, o: Record<string, unknown>) => void } } }

export default function RadarHero({ pill = 'Live website check · free · read-only', title, lead = 'Type your website. Watch Privacy Saathi check it for security and privacy, live.' }: { pill?: string; title?: React.ReactNode; lead?: string }) {
  const [v, setV] = useState(''), [err, setErr] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [pct, setPct] = useState(0), [step, setStep] = useState('');
  const [quick, setQuick] = useState<Quick | null>(null);
  const [shown, setShown] = useState(0);          // nodes revealed so far
  const [score, setScore] = useState(0);
  const [domain, setDomain] = useState('');
  const [ts, setTs] = useState<string | null>(null);
  const tsRef = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const live = useRef({ phase: 'idle' as Phase, pct: 0, shown: 0, nodes: IDLE, t0: 0 });
  const tsKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => { live.current.phase = phase; live.current.pct = pct; live.current.shown = shown; live.current.nodes = quick?.nodes ?? IDLE; }, [phase, pct, shown, quick]);

  // Cloudflare Turnstile, only when configured
  useEffect(() => {
    if (!tsKey || !tsRef.current) return;
    const mount = () => window.turnstile && tsRef.current && !tsRef.current.hasChildNodes() && window.turnstile.render(tsRef.current, { sitekey: tsKey, callback: (t: string) => setTs(t) });
    if (window.turnstile) mount(); else if (!document.getElementById('cf-ts')) { const s = document.createElement('script'); s.id = 'cf-ts'; s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'; s.async = true; s.onload = mount; document.head.appendChild(s); }
  }, [tsKey]);

  // The radar: rings, sweeping beam, links and glows. Labels are real HTML on top (accessible).
  useEffect(() => {
    const c = cv.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, S = 0;
    const fit = () => { const r = c.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2); S = r.width; c.width = r.width * d; c.height = r.height * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    fit(); const ro = new ResizeObserver(() => { fit(); if (reduce) draw(0); }); ro.observe(c);
    const draw = (ms: number) => {
      const L = live.current, t = ms / 1000, cx = S / 2, cy = S / 2;
      ctx.clearRect(0, 0, S, S);
      for (const [i, f] of [0.12, 0.25, 0.37, 0.49].entries()) { ctx.beginPath(); ctx.arc(cx, cy, S * f, 0, 7); ctx.strokeStyle = `rgba(140,170,255,${i === 2 ? 0.22 : 0.1})`; ctx.setLineDash(i === 3 ? [3, 7] : []); ctx.lineWidth = 1; ctx.stroke(); }
      ctx.setLineDash([]);
      const sweep = (t * (L.phase === 'scanning' ? 2.4 : 0.7)) % (Math.PI * 2);
      for (let k = 0; k < 44; k++) { // beam with a fading trail
        const a0 = sweep - k * 0.026; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, S * 0.49, a0 - 0.027, a0); ctx.closePath();
        ctx.fillStyle = `rgba(110,168,255,${(L.phase === 'done' ? 0.04 : 0.2) * (1 - k / 44)})`; ctx.fill();
      }
      const active = L.phase === 'scanning' ? Math.min(5, Math.floor((L.pct / 100) * 6)) : -1;
      L.nodes.forEach((n, i) => {
        const a = ang(i), x = cx + Math.cos(a) * S * RAD, y = cy + Math.sin(a) * S * RAD;
        const revealed = L.phase === 'done' ? i < L.shown : false;
        const col = revealed ? COLORS[n.status] : i === active ? '#6EA8FF' : COLORS.idle;
        let da = Math.abs(((sweep - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI); da = Math.PI - da; // distance from beam
        const flash = L.phase !== 'done' ? Math.max(0, 1 - da * 3) : 0;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.strokeStyle = revealed ? col + '66' : `rgba(140,170,255,${0.1 + flash * 0.35})`; ctx.lineWidth = revealed ? 1.5 : 1; ctx.stroke();
        if (i === active) { const p = (t * 1.4) % 1; ctx.beginPath(); ctx.arc(cx + (x - cx) * p, cy + (y - cy) * p, 3, 0, 7); ctx.fillStyle = '#9CC4FF'; ctx.fill(); }
        const g = ctx.createRadialGradient(x, y, 0, x, y, S * 0.07); g.addColorStop(0, col + (revealed ? 'AA' : i === active ? '99' : String(Math.round(40 + flash * 90).toString(16).padStart(2, '0')))); g.addColorStop(1, col + '00');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, S * 0.07, 0, 7); ctx.fill();
      });
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    if (reduce) draw(0); else raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  const start = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const s = parseWebsite(v);
    if (!s) { setErr('Enter your website, for example yourcompany.com'); return; }
    setErr(''); setQuick(null); setShown(0); setScore(0); setPct(2); setStep('Starting'); setDomain(s.domain); setPhase('scanning');
    const r = await fetch('/api/ps/scan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ website: s.domain, authorised: false, turnstile: ts }) }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    if (!r || !r.ok) { setErr(j.error ?? 'Could not start the scan. Please try again.'); setPhase('error'); return; }
    track('scan_started', { quick: true });
    const id = j.id as string;
    for (let i = 0; i < 70; i++) {
      await new Promise((ok) => setTimeout(ok, 900));
      const p = await fetch(`/api/ps/scan/${id}?s=1`, { cache: 'no-store' }).then((x) => x.json()).catch(() => null);
      if (!p) continue;
      setPct(p.pct ?? 0); setStep(p.step ?? '');
      if (p.status === 'error') { setErr(p.error ?? 'We could not scan that website.'); setPhase('error'); return; }
      if (p.status === 'done' && p.quick) { setQuick(p.quick); setPct(100); setPhase('done'); track('scan_completed', { quick: true }); return; }
    }
    setErr('The scan took too long. Please try again.'); setPhase('error');
  }, [v, ts]);

  // reveal nodes one by one, then count the score up
  useEffect(() => {
    if (phase !== 'done' || !quick) return;
    let n = 0; const timer = setInterval(() => { n++; setShown(n); if (n >= 6) clearInterval(timer); }, 320);
    return () => clearInterval(timer);
  }, [phase, quick]);
  useEffect(() => {
    if (shown < 6 || !quick) return;
    let cur = 0; const target = quick.score; const timer = setInterval(() => { cur = Math.min(target, cur + Math.max(1, Math.round(target / 22))); setScore(cur); if (cur >= target) clearInterval(timer); }, 35);
    return () => clearInterval(timer);
  }, [shown, quick]);

  const busy = phase === 'scanning';
  const nodes = quick?.nodes ?? IDLE;
  const finished = phase === 'done' && shown >= 6;
  const label = (n: QuickNode, i: number) => (phase === 'done' && i < shown ? (n.status === 'unknown' ? 'In full report' : n.issues ? `${n.issues} to review` : 'No issues seen') : busy && i === Math.min(5, Math.floor((pct / 100) * 6)) ? 'Scanning…' : '');

  return (
    <section className="ps-rh" aria-labelledby="rh-h">
      <div className="ps-wrap ps-rh-grid">
        <div className="ps-rh-copy">
          <span className="ps-rh-pill"><ShieldCheck size={14} aria-hidden /> {pill}</span>
          <h1 id="rh-h">{title ?? <>Is your business <em>DPDP-ready?</em></>}</h1>
          {!finished ? (
            <>
              <p className="ps-rh-lead">{lead}</p>
              <form className="ps-rh-form" onSubmit={start} noValidate>
                <label htmlFor="rh-in" className="ps-rh-sr">Your company website</label>
                <input id="rh-in" value={v} onChange={(e) => { setV(e.target.value); setErr(''); }} inputMode="url" autoComplete="url" placeholder="yourcompany.com" disabled={busy} aria-invalid={!!err} aria-describedby="rh-note" />
                <button className="ps-rh-btn" disabled={busy}>{busy ? 'Scanning…' : 'Scan my website'} {!busy && <ArrowRight size={18} aria-hidden />}</button>
              </form>
              {tsKey && <div ref={tsRef} style={{ marginTop: 10 }} />}
              <p id="rh-note" className="ps-rh-note" role={err ? 'alert' : undefined} style={err ? { color: '#FF8A94' } : undefined}>{err || 'Home page only, read-only. By scanning you confirm you may check this website.'}</p>
              {busy && <p className="ps-rh-status" role="status" aria-live="polite"><span className="ps-rh-dot" aria-hidden />{step} · {pct}%</p>}
            </>
          ) : (
            <div className="ps-rh-result" role="status" aria-live="polite">
              <p className="ps-rh-lead">Quick check of <b>{domain}</b> ({quick!.pages} page, home page only). Here is what stood out:</p>
              <ul className="ps-rh-top">{quick!.top.length ? quick!.top.map((t) => <li key={t.title}><span className={`ps-rh-chip ${t.status}`}>{t.status === 'fail' ? 'Fix needed' : 'Attention'}</span>{t.title}</li>) : <li><span className="ps-rh-chip pass">No issues seen</span>Nothing urgent on the home page.</li>}</ul>
              <div className="ps-rh-ctas">
                <PsLink href={`/scan?site=${encodeURIComponent(domain)}`} className="ps-rh-btn">Get the full report <ArrowRight size={18} aria-hidden /></PsLink>
                <button type="button" className="ps-rh-ghost" onClick={() => { setPhase('idle'); setQuick(null); setShown(0); setScore(0); setPct(0); }}>Check another site</button>
              </div>
              <p className="ps-rh-note">The full report adds every page, your forms, your processes and a free review with a Bedre consultant. Quick score is for the home page only.</p>
            </div>
          )}
        </div>

        <div className="ps-rh-stage" aria-label="Live radar of your website check">
          <canvas ref={cv} aria-hidden="true" />
          <div className="ps-rh-core" aria-live="polite">
            {finished ? <><b>{score}</b><small>quick score</small></> : busy ? <><b>{pct}%</b><small>scanning</small></> : <><b className={domain.length > 10 ? 'sm' : undefined}>{domain || 'your site'}</b><small>ready to scan</small></>}
          </div>
          <ul className="ps-rh-nodes">
            {nodes.map((n, i) => { const a = ang(i), on = phase === 'done' && i < shown; return (
              <li key={n.id} data-s={on ? n.status : 'idle'} data-on={on || (busy && i === Math.min(5, Math.floor((pct / 100) * 6))) ? '1' : '0'} style={{ left: `${50 + Math.cos(a) * RAD * 100}%`, top: `${50 + Math.sin(a) * RAD * 100}%` }}>
                <i aria-hidden /><b>{n.label}</b><span>{label(n, i)}</span>
              </li>); })}
          </ul>
        </div>
      </div>
    </section>
  );
}

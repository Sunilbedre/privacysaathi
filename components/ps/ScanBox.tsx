'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { parseWebsite } from '@/lib/lead-rules';
import { usePsBase } from './PsCtx';

export default function ScanBox({ id = 'scan-box', cta = 'Scan free' }: { id?: string; cta?: string }) {
  const router = useRouter(), base = usePsBase();
  const [v, setV] = useState(''), [err, setErr] = useState('');
  const go = (e: React.FormEvent) => {
    e.preventDefault();
    const s = parseWebsite(v);
    if (!s) { setErr('Enter your website, for example yourcompany.com'); return; }
    router.push(`${base}/scan?site=${encodeURIComponent(s.domain)}${location.search ? '&' + location.search.slice(1) : ''}`);
  };
  return (
    <form onSubmit={go} noValidate id={id}>
      <div className="ps-scanbox">
        <label htmlFor={`${id}-in`} className="skip" style={{ position: 'absolute', left: -9999 }}>Your company website</label>
        <input id={`${id}-in`} value={v} onChange={(e) => { setV(e.target.value); setErr(''); }} inputMode="url" autoComplete="url" placeholder="yourcompany.com" aria-invalid={!!err} aria-describedby={`${id}-h`} />
        <button className="ps-btn" type="submit">{cta} <ArrowRight size={18} aria-hidden /></button>
      </div>
      <p className="ps-hint" id={`${id}-h`} role={err ? 'alert' : undefined} style={err ? { color: 'var(--ps-fail)' } : undefined}>{err || 'Read-only check of public information. We never change your site.'}</p>
    </form>
  );
}

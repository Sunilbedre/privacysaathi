'use client';
import { useEffect, useState } from 'react';
import { usePsBase } from './PsCtx';
import Link from 'next/link';

/** Rotating one-line messages in the top strip. Facts only (deadline countdown, the Act's top fine, how the scan works). Pauses on hover, calm for reduced-motion users. */
export default function TopTicker({ days }: { days: number }) {
  const base = usePsBase();
  const lines: [string, string, string, string][] = [
    ['⏳', `${days} days to the main DPDP deadline. Is your business ready?`, `${days} days to the DPDP deadline. Ready?`, '/dpdp'],
    ['⚠️', 'DPDP fines go up to ₹250 crore. Find your gaps in 2 minutes, free.', 'Fines up to ₹250 crore. Check free.', '/scan'],
    ['🔒', 'Read-only scan: we look at public pages, we never touch your website.', 'Read-only. We never touch your site.', '/scan'],
    ['🎯', 'Know your DPDP score before the Data Protection Board does.', 'Know your DPDP score first.', '/dpdp'],
    ['✨', 'Free check. No login. No installation. Result in minutes.', 'Free. No login. No install.', '/scan'],
  ];
  const [i, setI] = useState(0), [hold, setHold] = useState(false);
  useEffect(() => {
    if (hold || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % lines.length), 4200);
    return () => clearInterval(t);
  }, [hold, lines.length]);
  return (
    <div className="ps-tick" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)} onFocus={() => setHold(true)} onBlur={() => setHold(false)}>
      {lines.map(([ico, text, short, href], n) => (
        <Link key={text} href={base + href} className={`ps-tick-i${n === i ? ' on' : ''}`} tabIndex={n === i ? 0 : -1} aria-hidden={n === i ? undefined : true}><span aria-hidden>{ico}</span> <span className="tl">{text}</span><span className="ts">{short}</span><b> &rarr;</b></Link>
      ))}
      <span className="ps-tick-dots" aria-hidden>{lines.map((_, n) => <i key={n} className={n === i ? 'on' : ''} />)}</span>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';

/** Ticking countdown to the DPDP main-duties date (about, per published summaries). */
export default function LiveCountdown({ date }: { date: string }) {
  const [ms, setMs] = useState<number | null>(null);
  useEffect(() => { const end = new Date(date + 'T00:00:00+05:30').getTime(); const f = () => setMs(Math.max(0, end - Date.now())); f(); const t = setInterval(f, 1000); return () => clearInterval(t); }, [date]);
  const p = (n: number) => String(n).padStart(2, '0');
  const d = ms === null ? '--' : String(Math.floor(ms / 86400000)), h = ms === null ? '--' : p(Math.floor(ms / 3600000) % 24), m = ms === null ? '--' : p(Math.floor(ms / 60000) % 60), s = ms === null ? '--' : p(Math.floor(ms / 1000) % 60);
  return (
    <div className="ps-live-cd" role="timer" aria-label={`${d} days remaining`}>
      <div><b>{d}</b><small>days</small></div><div><b>{h}</b><small>hours</small></div><div><b>{m}</b><small>min</small></div><div><b>{s}</b><small>sec</small></div>
    </div>
  );
}

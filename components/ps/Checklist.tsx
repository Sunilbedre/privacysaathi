'use client';
import { useEffect, useState } from 'react';

export default function Checklist({ items }: { items: readonly string[] }) {
  const [done, setDone] = useState<boolean[]>(() => items.map(() => false));
  useEffect(() => { try { const s = JSON.parse(localStorage.getItem('ps-checklist') || '[]'); if (Array.isArray(s)) setDone(items.map((_, i) => !!s[i])); } catch { /* no storage */ } }, [items]);
  const toggle = (i: number) => setDone((d) => { const n = d.map((v, j) => (j === i ? !v : v)); try { localStorage.setItem('ps-checklist', JSON.stringify(n)); } catch { /* ignore */ } return n; });
  const n = done.filter(Boolean).length;
  return (
    <div>
      <div className="ps-cl-top"><b>{n} of {items.length} in place</b><div className="ps-meter" role="progressbar" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={n}><i style={{ width: `${(n / items.length) * 100}%` }} /></div></div>
      <ul className="ps-cl">{items.map((t, i) => <li key={t}><label><input type="checkbox" checked={done[i]} onChange={() => toggle(i)} /><span>{t}</span></label></li>)}</ul>
      <p className="ps-note" style={{ marginTop: 12 }}>Your ticks stay in this browser only. This is a self-check, not an audit.</p>
    </div>
  );
}

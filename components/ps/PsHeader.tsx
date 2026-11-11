'use client';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { PsLink, usePsBase } from './PsCtx';
import { usePathname } from 'next/navigation';
import Logo from './Logo';

const NAV: [string, string][] = [['/cybersecurity', 'Cyber security'], ['/maintenance', 'Website care'], ['/dpdp', 'DPDP'], ['/resources', 'Resources']];

export default function PsHeader() {
  const [open, setOpen] = useState(false), [scrolled, setScrolled] = useState(false);
  const base = usePsBase(), path = usePathname() ?? '';
  const rel = path.startsWith(base) ? path.slice(base.length) || '/' : path;
  useEffect(() => { const f = () => setScrolled(window.scrollY > 8); f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f); }, []);
  useEffect(() => { setOpen(false); }, [path]);
  return (
    <header className={`ps-top${scrolled || open ? ' is-s' : ''}`}>
      <div className="ps-wrap ps-top-in">
        <PsLink href="/" className="ps-brand" aria-label="Privacy Saathi home"><Logo height={42} /></PsLink>
        <nav className="ps-nav" aria-label="Main">
          {NAV.map(([h, l]) => <PsLink key={h} href={h} aria-current={rel === h ? 'page' : undefined}>{l}</PsLink>)}
          <PsLink href="/scan" className="ps-btn ps-btn-sm">Scan free</PsLink>
        </nav>
        <button type="button" className="ps-burger" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? <X size={22} /> : <Menu size={22} />}</button>
      </div>
      {open && <nav className="ps-drawer" aria-label="Mobile">{NAV.map(([h, l]) => <PsLink key={h} href={h}>{l}</PsLink>)}<PsLink href="/sign-in">Client sign in</PsLink><PsLink href="/scan" className="ps-btn">Scan your website free</PsLink></nav>}
    </header>
  );
}

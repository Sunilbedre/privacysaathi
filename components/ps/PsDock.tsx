'use client';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ScanSearch, X } from 'lucide-react';
import { usePsBase } from './PsCtx';
import { track } from './PsTrack';
import './psbot.css';

const Bot = dynamic(() => import('./DpdpBot'), { ssr: false });
const get = (k: string) => { try { return sessionStorage.getItem(k); } catch { return null; } };
const set = (k: string, v: string) => { try { sessionStorage.setItem(k, v); } catch { /* ignore */ } };

/**
 * One floating button, shown on the DPDP page only, that opens the DPDP chat and leads the visitor into the scan.
 * WhatsApp and Call live inside the chat header (shown only when their numbers are set in the admin). Other buttons can open the chat with data-ps-bot or window event "ps:bot".
 */
export default function PsDock({ whatsapp, call, booking }: { whatsapp?: string; call?: string; booking: string }) {
  const base = usePsBase(), path = usePathname() ?? '';
  const rel = path.startsWith(base) ? path.slice(base.length) || '/' : path;
  const on = rel === '/dpdp' || rel.startsWith('/dpdp/'); // the chat lives on the DPDP page only
  const [open, setOpen] = useState(false), [teaser, setTeaser] = useState(false);
  const show = useCallback(() => { setOpen(true); setTeaser(false); set('ps-teaser', '1'); }, []);
  useEffect(() => {
    if (!on) { setOpen(false); setTeaser(false); return; }
    const onClick = (e: MouseEvent) => { const el = (e.target as HTMLElement | null)?.closest('[data-ps-bot]'); if (el) { e.preventDefault(); show(); } };
    document.addEventListener('click', onClick); window.addEventListener('ps:bot', show);
    if (new URLSearchParams(location.search).get('chat') === '1') show();
    const t = setTimeout(() => { if (!get('ps-teaser') && !document.querySelector('.psb-panel')) setTeaser(true); }, 12_000);
    return () => { document.removeEventListener('click', onClick); window.removeEventListener('ps:bot', show); clearTimeout(t); };
  }, [show, on]);

  if (!on) return null;
  return (
    <>
      {teaser && !open && (
        <div className="psd-teaser" role="status">
          <button type="button" className="psd-teaser-b" onClick={() => { track('dock_scan'); show(); }}><span aria-hidden>{'👋'}</span> Is your business DPDP-ready? <b>Check in 2 minutes</b></button>
          <button type="button" className="psd-teaser-x" aria-label="Dismiss" onClick={() => { setTeaser(false); set('ps-teaser', '1'); }}><X size={14} aria-hidden /></button>
        </div>
      )}
      <div className={`psd${open ? ' is-open' : ''}`}>
        <button type="button" className="psd-b main" onClick={() => { track('dock_scan'); show(); }} aria-haspopup="dialog" aria-label="Start your free DPDP scan"><ScanSearch size={21} aria-hidden /><span>Free DPDP scan</span><i aria-hidden /></button>
      </div>
      <Bot open={open} onClose={() => setOpen(false)} whatsapp={whatsapp?.replace(/\D/g, '')} call={call} booking={booking} />
    </>
  );
}

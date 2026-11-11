'use client';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import { MessageCircle, Phone, ScanSearch, X } from 'lucide-react';
import { track } from './PsTrack';
import './psbot.css';

const Bot = dynamic(() => import('./DpdpBot'), { ssr: false });
const get = (k: string) => { try { return sessionStorage.getItem(k); } catch { return null; } };
const set = (k: string, v: string) => { try { sessionStorage.setItem(k, v); } catch { /* ignore */ } };

/**
 * The floating bar at the bottom of every page: WhatsApp, the DPDP check (opens the chat) and Call.
 * Buttons whose number is not set in the admin are left out. Other buttons can open the chat with data-ps-bot or window event "ps:bot".
 */
export default function PsDock({ whatsapp, call, booking }: { whatsapp?: string; call?: string; booking: string }) {
  const [open, setOpen] = useState(false), [teaser, setTeaser] = useState(false), [path, setPath] = useState('/');
  const show = useCallback(() => { setOpen(true); setTeaser(false); set('ps-teaser', '1'); }, []);
  useEffect(() => {
    const onClick = (e: MouseEvent) => { const el = (e.target as HTMLElement | null)?.closest('[data-ps-bot]'); if (el) { e.preventDefault(); show(); } };
    setPath(location.pathname);
    document.addEventListener('click', onClick); window.addEventListener('ps:bot', show);
    if (new URLSearchParams(location.search).get('chat') === '1') show();
    const t = setTimeout(() => { if (!get('ps-teaser') && !document.querySelector('.psb-panel')) setTeaser(true); }, 12_000);
    return () => { document.removeEventListener('click', onClick); window.removeEventListener('ps:bot', show); clearTimeout(t); };
  }, [show]);

  const wa = whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, I would like help with DPDP compliance. (from ${path === '/' || path === '/ps' ? 'home page' : path})`)}` : '';
  const tel = call ? `tel:${call.replace(/[^\d+]/g, '')}` : '';
  return (
    <>
      {teaser && !open && (
        <div className="psd-teaser" role="status">
          <button type="button" className="psd-teaser-b" onClick={() => { track('dock_scan'); show(); }}><span aria-hidden>{'👋'}</span> Is your business DPDP-ready? <b>Check in 2 minutes</b></button>
          <button type="button" className="psd-teaser-x" aria-label="Dismiss" onClick={() => { setTeaser(false); set('ps-teaser', '1'); }}><X size={14} aria-hidden /></button>
        </div>
      )}
      <nav className={`psd${open ? ' is-open' : ''}`} aria-label="Quick contact">
        {wa && <a className="psd-b wa" href={wa} target="_blank" rel="noopener" onClick={() => track('dock_whatsapp')}><MessageCircle size={20} aria-hidden /><span>WhatsApp</span></a>}
        <button type="button" className="psd-b main" onClick={() => { track('dock_scan'); show(); }}><ScanSearch size={20} aria-hidden /><span><em className="psd-long">Free </em>DPDP check</span><i aria-hidden /></button>
        {tel && <a className="psd-b call" href={tel} onClick={() => track('dock_call')}><Phone size={20} aria-hidden /><span>Call</span></a>}
      </nav>
      <Bot open={open} onClose={() => setOpen(false)} whatsapp={whatsapp?.replace(/\D/g, '')} booking={booking} />
    </>
  );
}

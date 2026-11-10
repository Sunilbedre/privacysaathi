'use client';
import { useEffect } from 'react';

const TRACK = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'] as const;
/** Remember campaign tags for this visit, so they survive the move from the home page to the scan. */
export function captureTags(): Record<string, string> {
  try {
    const q = new URLSearchParams(location.search);
    const saved = JSON.parse(sessionStorage.getItem('ps-tags') || '{}') as Record<string, string>;
    const t: Record<string, string> = { ...saved };
    for (const k of TRACK) { const v = q.get(k); if (v) t[k] = v.slice(0, 200); }
    if (!t.ref) t.ref = document.referrer.slice(0, 300);
    t.landing_host = location.host;
    sessionStorage.setItem('ps-tags', JSON.stringify(t));
    return t;
  } catch { return { landing_host: location.host }; }
}
export function track(event: string, extra: Record<string, unknown> = {}) {
  try {
    const w = window as unknown as { gtag?: (...a: unknown[]) => void };
    w.gtag?.('event', event, extra); // only exists after cookie consent
    void fetch('/api/ps/event', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ event, tags: captureTags(), ...extra }), keepalive: true });
  } catch { /* ignore */ }
}
export default function PsTrack() {
  useEffect(() => { captureTags(); track('visit', { path: location.pathname }); }, []);
  return null;
}

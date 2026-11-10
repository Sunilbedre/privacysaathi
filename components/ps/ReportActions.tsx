'use client';
import { useEffect } from 'react';
import { Printer } from 'lucide-react';
import { track } from './PsTrack';

export function ReportTrack({ sid }: { sid: string }) { useEffect(() => { track('report_viewed', { sid: sid.slice(0, 8) }); }, [sid]); return null; }
export function PrintBtn() { return <button type="button" className="ps-btn ps-btn-ghost ps-btn-sm ps-noprint" onClick={() => window.print()}><Printer size={16} aria-hidden /> Save as PDF</button>; }
export function BookBtn({ href, label = 'Book a free 30-minute review' }: { href: string; label?: string }) {
  return <a className="ps-btn" href={href} target="_blank" rel="noopener" onClick={() => track('booking_clicked')}>{label}</a>;
}

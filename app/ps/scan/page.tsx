import type { Metadata } from 'next';
import { Suspense } from 'react';
import ScanFlow from '@/components/ps/ScanFlow';

export const metadata: Metadata = { title: 'Scan your website', robots: { index: false, follow: true } };
export default function ScanPage() { return <Suspense fallback={<div className="ps-wrap" style={{ padding: 40 }}>Loading…</div>}><ScanFlow /></Suspense>; }

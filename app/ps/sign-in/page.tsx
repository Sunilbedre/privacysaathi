import type { Metadata } from 'next';
import { LockKeyhole } from 'lucide-react';
import { PsLink } from '@/components/ps/PsCtx';
export const metadata: Metadata = { title: 'Sign in', robots: { index: false } };
export default function SignIn() {
  return (
    <div className="ps-wrap"><div className="ps-center-card">
      <span className="ps-ico"><LockKeyhole size={30} aria-hidden /></span>
      <h1>Client portal, coming soon</h1>
      <p>Checklists, monthly re-scans with change alerts and your report history will live here. For now you can run a free scan.</p>
      <p style={{ marginTop: 24 }}><PsLink href="/scan" className="ps-btn">Run a free scan</PsLink></p>
    </div></div>
  );
}

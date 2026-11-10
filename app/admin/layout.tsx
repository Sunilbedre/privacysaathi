import type { Metadata } from 'next';
import './adm.css';

export const metadata: Metadata = { title: 'Privacy Saathi admin', robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="cms-root">{children}</div>;
}

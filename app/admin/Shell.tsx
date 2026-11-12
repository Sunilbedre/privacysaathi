import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LayoutDashboard, Inbox, ScanSearch, Settings, LogOut, ExternalLink, Users } from 'lucide-react';
import { cmsEnabled, isCmsAuthed } from '@/lib/cms/auth';
import { logoutAction } from './actions';
import ThemeToggle from '@/components/ps/ThemeToggle';

export type AdminTab = 'dashboard' | 'visitors' | 'crm' | 'scans' | 'settings';
const NAV: { id: AdminTab; href: string; label: string; Icon: typeof Inbox }[] = [
  { id: 'dashboard', href: '/qwedsa', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'visitors', href: '/qwedsa/visitors', label: 'Visitors', Icon: Users },
  { id: 'crm', href: '/qwedsa/crm', label: 'Enquiries', Icon: Inbox },
  { id: 'scans', href: '/qwedsa/scans', label: 'Scans', Icon: ScanSearch },
  { id: 'settings', href: '/qwedsa/settings', label: 'Settings', Icon: Settings },
];

/** Signed-in frame for every admin page: sidebar (top bar on phones), page title and sign out. Sends visitors who are not signed in to the login page. */
export default async function Shell({ active, title, sub, actions, children }: { active: AdminTab; title: string; sub?: string; actions?: React.ReactNode; children: React.ReactNode }) {
  if (!cmsEnabled() || !(await isCmsAuthed())) redirect('/qwedsa/login');
  return (
    <div className="adm">
      <aside className="adm-side">
        <Link href="/qwedsa" className="adm-brand"><span><img src="/brand/privacy-saathi-mark-sm.png" alt="" width={30} height={30} /></span><b>Privacy Saathi</b><em>Admin</em></Link>
        <nav aria-label="Admin">
          {NAV.map(({ id, href, label, Icon }) => (
            <Link key={id} href={href} className={id === active ? 'on' : ''} aria-current={id === active ? 'page' : undefined}><Icon size={18} aria-hidden /><span>{label}</span></Link>
          ))}
        </nav>
        <div className="adm-side-foot">
          <a href="/" target="_blank" rel="noopener"><ExternalLink size={16} aria-hidden /><span>View website</span></a>
          <ThemeToggle className="adm-theme" label />
          <form action={logoutAction}><button type="submit"><LogOut size={16} aria-hidden /><span>Sign out</span></button></form>
        </div>
      </aside>
      <div className="adm-main">
        <header className="adm-head">
          <div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>
          {actions && <div className="adm-head-actions">{actions}</div>}
        </header>
        <main className="adm-body">{children}</main>
      </div>
    </div>
  );
}

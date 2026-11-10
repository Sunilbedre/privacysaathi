import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cmsEnabled, isCmsAuthed } from '@/lib/cms/auth';
import { logoutAction } from './actions';

export default async function AdminHomePage() {
  if (!cmsEnabled()) redirect('/qwedsa/login');
  if (!(await isCmsAuthed())) redirect('/qwedsa/login');
  return (
    <>
      <header className="cms-top">
        <b>Privacy Saathi admin</b>
        <nav>
          <Link href="/">View site</Link>
          <form action={logoutAction} style={{ display: 'inline' }}>
            <button type="submit" className="cms-btn secondary" style={{ height: 32, padding: '0 14px', fontSize: '0.82rem' }}>Sign out</button>
          </form>
        </nav>
      </header>
      <div className="cms-shell">
        <aside className="cms-side">
          <h2>Admin</h2>
          <ul><li><Link href="/qwedsa/crm">Enquiries (CRM)</Link></li><li><Link href="/qwedsa/settings">Settings and API keys</Link></li></ul>
        </aside>
        <main className="cms-main">
          <h1>Welcome</h1>
          <p>Open the CRM to see scan and solution enquiries, or Settings to connect email, WhatsApp and SMS.</p>
        </main>
      </div>
    </>
  );
}

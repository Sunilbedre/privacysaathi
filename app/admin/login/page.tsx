import { Inbox, BellRing, ScanSearch } from 'lucide-react';
import { cmsEnabled } from '@/lib/cms/auth';
import { loginAction } from '../actions';
import ThemeToggle from '@/components/ps/ThemeToggle';

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const enabled = cmsEnabled();
  return (
    <div className="adm-login">
      <section className="adm-login-art">
        <div className="adm-brand"><span><img src="/brand/privacy-saathi-mark-sm.png" alt="" width={30} height={30} /></span><b>Privacy Saathi</b></div>
        <div>
          <h2>Every lead, every alert, one place.</h2>
          <p>Follow up on scan and solution enquiries, check your alert channels and see how the scanner is performing.</p>
        </div>
        <ul>
          <li><Inbox size={18} aria-hidden /> Enquiry CRM with pipeline</li><li><BellRing size={18} aria-hidden /> WhatsApp, SMS and email alerts</li><li><ScanSearch size={18} aria-hidden /> Scan activity at a glance</li>
        </ul>
      </section>
      <section className="adm-login-form">
        <ThemeToggle className="adm-theme float" label />
        <div className="adm-login-box">
          <img className="adm-login-logo" src="/brand/privacy-saathi-logo-sm.png" alt="Privacy Saathi" width={220} height={54} />
          <h1>Sign in</h1>
          <p>Admin access for the Privacy Saathi team.</p>
          {!enabled ? (
            <div className="adm-msg bad">The admin password is not set on the server. Add <code>CMS_ADMIN_PASSWORD</code> and restart.</div>
          ) : (
            <form action={loginAction}>
              <div className="adm-field"><label htmlFor="password">Admin password</label><input id="password" name="password" type="password" autoComplete="current-password" required autoFocus /></div>
              {sp.error === 'auth' && <div className="adm-msg bad" role="alert" style={{ marginBottom: 14 }}>That password is not right.</div>}
              {sp.error === 'wait' && <div className="adm-msg bad" role="alert" style={{ marginBottom: 14 }}>Too many attempts. Please wait ten minutes and try again.</div>}
              <button type="submit" className="adm-btn" style={{ width: '100%' }}>Sign in</button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

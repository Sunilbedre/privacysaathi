import Link from 'next/link';
import { cmsEnabled } from '@/lib/cms/auth';
import { loginAction } from '../actions';

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const enabled = cmsEnabled();

  return (
    <>
      <header className="cms-top">
        <b>Bedre CMS</b>
        <nav><Link href="/">← Website</Link></nav>
      </header>
      <div className="cms-card cms-login">
        <h1 style={{ marginTop: 0 }}>Sign in</h1>
        {!enabled ? (
          <p className="cms-err">
            Add <code>CMS_ADMIN_PASSWORD=your-secret</code> to <code>.env.local</code>, restart <code>npm run dev</code>, then sign in.
          </p>
        ) : (
          <form action={loginAction}>
            <div className="cms-field">
              <label htmlFor="password">Admin password</label>
              <input id="password" name="password" type="password" autoComplete="current-password" required />
            </div>
            {sp.error === 'auth' ? <p className="cms-err">Incorrect password.</p> : null}
            {sp.error === 'wait' ? <p className="cms-err">Too many attempts. Please wait ten minutes and try again.</p> : null}
            <button type="submit" className="cms-btn">Sign in</button>
          </form>
        )}
      </div>
    </>
  );
}

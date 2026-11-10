import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cmsEnabled, isCmsAuthed } from '@/lib/cms/auth';
import { settingsEnabled, settingsStatus } from '@/lib/settings';
import { WA_TEMPLATES, SMS_TEMPLATES } from '@/lib/ps/enquiry';
import { logoutAction, saveSettingsAction, testSettingAction } from '../actions';

const MSG: Record<string, [string, boolean]> = {
  saved: ['Saved. The site uses the new values straight away.', true],
  disabled: ['Settings cannot be saved yet: set SETTINGS_SECRET (or CMS_ADMIN_PASSWORD) on the server.', false],
  error: ['Could not save. Check that the server can write to its data folder.', false],
  'ai-ok': ['AI test passed: a real AI answered.', true],
  'ai-basic': ['AI test: no working key, so the basic keyword mode answered. Check the Anthropic key.', false],
  'voice-ok': ['Voice test passed: audio came back.', true],
  'voice-none': ['Voice test: no voice key is set.', false],
  'voice-fail': ['Voice test failed. Check the key and region.', false],
  'smtp-ok': ['Email test sent to your alert inbox. Check it arrived.', true],
  'smtp-none': ['Email test: SMTP is not fully set (host, username, password and from address).', false],
  'smtp-noto': ['Email test: set “Send lead alerts to” first.', false],
  'smtp-fail': ['Email test failed. Check the host, port, username, password and that the from-address domain is allowed.', false],
  'wa-ok': ['WhatsApp test sent using the scan template. Check your phone.', true],
  'wa-none': ['WhatsApp test: set the phone number ID, token, your number and the scan template name first.', false],
  'wa-fail': ['WhatsApp test failed. The template may not be approved yet, or the token or number ID is wrong.', false],
  'sms-ok': ['SMS test sent. Check your phone.', true],
  'sms-none': ['SMS test: set the SMSAlert API key, sender ID and your number first.', false],
  'sms-fail': ['SMS test failed. Check the auth key and that the template is approved.', false],
  'test-error': ['The test could not run.', false],
};

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<{ msg?: string; d?: string }> }) {
  if (!cmsEnabled() || !(await isCmsAuthed())) redirect('/qwedsa/login');
  const { items, unreadable } = settingsStatus();
  const sp = await searchParams;
  const m = MSG[sp.msg ?? ''];
  const detail = String(sp.d ?? '').replace(/[^\w .:-]/g, '').slice(0, 60);
  const groups = ['Leads', 'Email (SMTP)', 'WhatsApp alerts', 'SMS alerts'] as const;

  return (
    <>
      <header className="cms-top">
        <b>Bedre CMS</b>
        <nav>
          <Link href="/qwedsa">Admin home</Link>
          <Link href="/">View site</Link>
          <form action={logoutAction} style={{ display: 'inline' }}>
            <button type="submit" className="cms-btn secondary" style={{ height: 32, padding: '0 14px', fontSize: '0.82rem' }}>Sign out</button>
          </form>
        </nav>
      </header>
      <div className="cms-card" style={{ maxWidth: 820, margin: '24px auto' }}>
        <h1 style={{ marginTop: 0 }}>Settings and API keys</h1>
        <p style={{ color: '#5a6283', maxWidth: '64ch' }}>
          Paste your keys here instead of in files. They are saved <b>encrypted on the server</b> and are never shown again, only the last four characters.
          Leave a box empty to keep what is saved. A value saved here is used before any server setting.
        </p>
        {!settingsEnabled() ? <p className="cms-err">Saving is switched off: the server has no CMS_ADMIN_PASSWORD or SETTINGS_SECRET to encrypt with.</p> : null}
        {unreadable ? <p className="cms-err">Saved values could not be read, because the encryption secret changed. Enter the keys again.</p> : null}
        {m ? <p className={m[1] ? 'cms-ok' : 'cms-err'} role="status">{m[0]}{detail ? ` (${detail}. 401 = wrong key, 404 or a network error = wrong region.)` : ''}</p> : null}

        <form action={saveSettingsAction}>
          {groups.map((g) => (
            <fieldset key={g} style={{ border: '1px solid #d6dcef', borderRadius: 12, padding: '14px 18px', margin: '18px 0' }}>
              <legend style={{ fontWeight: 700, padding: '0 8px' }}>{g}</legend>
              {items.filter((i) => i.group === g).map((i) => (
                <div className="cms-field" key={i.key} style={{ marginBottom: 16 }}>
                  <label htmlFor={i.key}>{i.label} <small style={{ color: '#5a6283', fontWeight: 400 }}>
                    {i.source === 'admin' ? ' · saved here' : i.source === 'env' ? ' · set on the server' : ' · not set'}{i.hint ? ` · ${i.hint}` : ''}
                  </small></label>
                  <input id={i.key} name={i.key} type={i.secret ? 'password' : 'text'} autoComplete="off" spellCheck={false}
                    placeholder={i.secret ? (i.source === 'none' ? i.placeholder ?? 'Paste key' : 'Saved. Paste a new key to replace it') : i.value || i.placeholder || ''} defaultValue="" />
                  <small style={{ color: '#5a6283' }}>{i.help}</small>
                  {i.source === 'admin' ? <label style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4, fontWeight: 400 }}><input type="checkbox" name={`remove_${i.key}`} /> Remove the saved value</label> : null}
                </div>
              ))}
            </fieldset>
          ))}
          <button type="submit" className="cms-btn">Save settings</button>
        </form>

        <h2 style={{ marginTop: 32 }}>Test</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <form action={testSettingAction}><input type="hidden" name="which" value="smtp" /><button className="cms-btn secondary" type="submit">Test email (SMTP)</button></form>
          <form action={testSettingAction}><input type="hidden" name="which" value="whatsapp" /><button className="cms-btn secondary" type="submit">Test WhatsApp</button></form>
          <form action={testSettingAction}><input type="hidden" name="which" value="sms" /><button className="cms-btn secondary" type="submit">Test SMS</button></form>
        </div>
        <p style={{ marginTop: 10 }}><Link href="/qwedsa/crm">Open the CRM →</Link></p>

        <h2 style={{ marginTop: 32 }}>WhatsApp template text</h2>
        <p style={{ color: '#5a6283', maxWidth: '64ch' }}>In Meta WhatsApp Manager → Message templates → Create template: choose category <b>Utility</b>, language English, paste the name and body exactly, and add the sample values. Once approved, type the same names in the boxes above.</p>
        {Object.values(WA_TEMPLATES).map((t) => (
          <div key={t.name} style={{ border: '1px solid #d6dcef', borderRadius: 12, padding: '12px 16px', margin: '12px 0' }}>
            <b>Name:</b> <code>{t.name}</code> · <b>Category:</b> {t.category}
            <pre style={{ whiteSpace: 'pre-wrap', background: '#f4f6fd', padding: 12, borderRadius: 8, margin: '8px 0' }}>{t.body}</pre>
            <small style={{ color: '#5a6283' }}>Samples: {t.sample.map((x, i) => `{{${i + 1}}} = ${x}`).join(' · ')}</small>
          </div>
        ))}
        <h2 style={{ marginTop: 24 }}>SMS template text (DLT)</h2>
        <p style={{ color: '#5a6283', maxWidth: '64ch' }}>Register these two texts as DLT templates (Transactional) and get them approved in SMSAlert. The {'{#var#}'} slots are filled in automatically, in order: name, phone, topic, CRM id. The text sent must match the approved template exactly.</p>
        {Object.entries(SMS_TEMPLATES).map(([k, v]) => <pre key={k} style={{ whiteSpace: 'pre-wrap', background: '#f4f6fd', padding: 12, borderRadius: 8 }}>{k === 'scan' ? 'Scan enquiry' : 'Solution enquiry'}: {v}</pre>)}
        <p style={{ color: '#5a6283', fontSize: '.85rem', marginTop: 18 }}>
          On the live site, set <code>SETTINGS_DIR</code> to a folder outside the website files (so a redeploy does not erase saved keys) and set <code>SETTINGS_SECRET</code> to a long random phrase.
        </p>
      </div>
    </>
  );
}

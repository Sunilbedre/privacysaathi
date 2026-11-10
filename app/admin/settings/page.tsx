import Link from 'next/link';
import { BellRing, Mail, MessageCircle, Smartphone, FileText } from 'lucide-react';
import { settingsEnabled, settingsStatus, type SettingStatus } from '@/lib/settings';
import { WA_TEMPLATES, SMS_TEMPLATES, WA_CLIENT_TEMPLATES, SMS_CLIENT_TEMPLATES } from '@/lib/ps/enquiry';
import Shell from '../Shell';
import { saveSettingsAction, testSettingAction } from '../actions';

export const dynamic = 'force-dynamic';
const MSG: Record<string, [string, boolean]> = {
  saved: ['Saved. The site uses the new values straight away.', true],
  disabled: ['Settings cannot be saved yet: set SETTINGS_SECRET (or CMS_ADMIN_PASSWORD) on the server.', false],
  error: ['Could not save. Check that the server can write to its settings folder.', false],
  'smtp-ok': ['Test email sent to your alert inbox. Check that it arrived.', true],
  'smtp-none': ['Email test: SMTP is not fully set (host, username, password and from address).', false],
  'smtp-noto': ['Email test: set “Send lead alerts to” on the Alerts tab first.', false],
  'smtp-fail': ['Email test failed. Check the host, port, username, password, and that the from-address domain is allowed.', false],
  'wa-ok': ['WhatsApp test sent using the scan template. Check your phone.', true],
  'wa-none': ['WhatsApp test: set the phone number ID, token, your number and the scan template name first.', false],
  'wa-fail': ['WhatsApp test failed. The template may not be approved yet, or the token or number ID is wrong.', false],
  'sms-ok': ['SMS test sent. Check your phone.', true],
  'sms-none': ['SMS test: set the SMSAlert API key, sender ID and your number first.', false],
  'sms-fail': ['SMS test failed. Check the API key and that the DLT template is approved.', false],
  'test-error': ['The test could not run.', false],
};

const TABS = [
  { id: 'alerts', label: 'Alerts', group: 'Leads', Icon: BellRing, need: ['LEAD_TO_EMAIL'], test: null },
  { id: 'email', label: 'Email (SMTP)', group: 'Email (SMTP)', Icon: Mail, need: ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'], test: 'smtp' },
  { id: 'whatsapp', label: 'WhatsApp', group: 'WhatsApp alerts', Icon: MessageCircle, need: ['WA_PHONE_NUMBER_ID', 'WA_TOKEN', 'WA_OWNER_NUMBERS', 'WA_TEMPLATE_SCAN'], test: 'whatsapp' },
  { id: 'sms', label: 'SMS', group: 'SMS alerts', Icon: Smartphone, need: ['SMS_API_KEY', 'SMS_SENDER_ID', 'SMS_OWNER_NUMBERS'], test: 'sms' },
  { id: 'templates', label: 'Message templates', group: '', Icon: FileText, need: [], test: null },
] as const;

const GUIDE: Record<string, string[]> = {
  alerts: ['Enter the inbox (or inboxes, separated by commas) that should get every new enquiry.', 'Enter the address of this admin, for example https://privacysaathi.in, so alert links open the right enquiry.'],
  email: ['Log in to Mail Baby and copy the SMTP server, port, username and password.', 'Use a From address on a domain Mail Baby allows, for example Privacy Saathi <hello@privacysaathi.in>.', 'Save, then press “Send test email”.'],
  whatsapp: ['In Meta for Developers open WhatsApp, then API Setup. Copy the Phone number ID and the WhatsApp Business Account ID.', 'Create a permanent token with a system user and paste it here. It is stored encrypted.', 'Create the two message templates (see the Message templates tab), wait for approval, then type their names below.', 'Enter your own number with country code and no plus sign, for example 919876543210.', 'To make every visitor verify their mobile number first, create the verification template (Message templates tab), then set “Verify visitors’ mobile numbers” to on.', 'To also confirm to each visitor on WhatsApp, create the two visitor templates, wait for approval, type their names, then set “Also message the visitor” to on.'],
  sms: ['In SMSAlert copy your API key and your approved 6-letter sender ID.', 'Register the two SMS texts (see the Message templates tab) as DLT templates.', 'Enter your mobile number with country code, for example 919876543210.', 'To also text each visitor, register the two visitor templates, then set “Also text the visitor” to on.'],
};

const srcLabel = (i: SettingStatus) => (i.source === 'admin' ? <span className="src" style={{ color: 'var(--ok)' }}>Saved here</span> : i.source === 'env' ? <span className="src" style={{ color: 'var(--info)' }}>Set on server</span> : <span className="src" style={{ color: 'var(--mut)' }}>Not set</span>);

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string; msg?: string }> }) {
  const sp = await searchParams;
  const { items, unreadable } = settingsStatus();
  const tab = TABS.find((t) => t.id === sp.tab) ?? TABS[0];
  const m = MSG[sp.msg ?? ''];
  const ready = (t: (typeof TABS)[number]) => t.need.length > 0 && t.need.every((k) => items.find((i) => i.key === k)?.source !== 'none');
  const fields = items.filter((i) => i.group === tab.group);

  return (
    <Shell active="settings" title="Settings" sub="Connect email, WhatsApp and SMS. Keys are saved encrypted on the server and never shown again.">
      {!settingsEnabled() && <div className="adm-msg bad">Saving is switched off: the server has no CMS_ADMIN_PASSWORD or SETTINGS_SECRET to encrypt with.</div>}
      {unreadable && <div className="adm-msg bad">Saved values could not be read because the encryption secret changed. Please enter the keys again.</div>}
      {m && <div className={`adm-msg ${m[1] ? 'ok' : 'bad'}`} role="status">{m[0]}</div>}

      <nav className="adm-tabs" aria-label="Settings sections">
        {TABS.map((t) => (
          <Link key={t.id} href={`/qwedsa/settings?tab=${t.id}`} className={t.id === tab.id ? 'on' : ''}><t.Icon size={16} aria-hidden />{t.label}
            {t.need.length > 0 && <span className={`adm-badge ${ready(t) ? 'ok' : 'off'}`}><i />{ready(t) ? 'On' : 'Off'}</span>}</Link>))}
      </nav>

      {tab.id !== 'templates' ? (
        <div className="adm-two">
          <form action={saveSettingsAction} className="adm-card">
            <input type="hidden" name="tab" value={tab.id} />
            <div className="adm-card-h"><h2>{tab.label}</h2><span>Leave a box empty to keep what is saved.</span></div>
            {fields.map((i) => (
              <div className="adm-field adm-keyrow" key={i.key}>
                <label htmlFor={i.key}>{i.label}{srcLabel(i)}{i.hint && <span className="src" style={{ color: 'var(--mut)' }}>{i.hint}</span>}</label>
                <input id={i.key} name={i.key} type={i.secret ? 'password' : 'text'} autoComplete="off" spellCheck={false}
                  placeholder={i.secret ? (i.source === 'none' ? i.placeholder ?? 'Paste it here' : 'Saved. Paste a new one to replace it') : i.value || i.placeholder || ''} />
                <small>{i.help}</small>
                {i.source === 'admin' && <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 500, fontSize: '.82rem' }}><input type="checkbox" name={`remove_${i.key}`} /> Remove the saved value</label>}
              </div>))}
            <div className="adm-testrow"><button type="submit" className="adm-btn">Save changes</button></div>
          </form>

          <div style={{ display: 'grid', gap: 20, alignContent: 'start' }}>
            <div className="adm-card">
              <div className="adm-card-h"><h2>How to set this up</h2></div>
              <ol className="adm-steps">{GUIDE[tab.id].map((g) => <li key={g}>{g}</li>)}</ol>
            </div>
            {tab.test && (
              <div className="adm-card">
                <div className="adm-card-h"><h2>Check that it works</h2></div>
                <p className="adm-sub" style={{ marginBottom: 12 }}>Save first, then send yourself a test message.</p>
                <form action={testSettingAction}><input type="hidden" name="which" value={tab.test} /><input type="hidden" name="tab" value={tab.id} />
                  <button className="adm-btn ghost" type="submit">{tab.test === 'smtp' ? 'Send test email' : tab.test === 'whatsapp' ? 'Send test WhatsApp' : 'Send test SMS'}</button></form>
              </div>)}
          </div>
        </div>
      ) : (
        <div className="adm-two">
          <div className="adm-card">
            <div className="adm-card-h"><h2>WhatsApp templates</h2><span>Meta WhatsApp Manager, Message templates, Create</span></div>
            <p className="adm-sub">Choose category <b>Utility</b>, language English. Paste the name and text exactly and add the sample values. After approval, type the names on the WhatsApp tab.</p>
            <div style={{ marginTop: 14 }}>
              <b>ps_otp_mobile_verification</b> <span className="adm-badge off">Authentication</span>
              <p className="adm-sub" style={{ margin: '6px 0' }}>Category <b>Authentication</b>, language English. Choose “Copy code” as the button and tick “Add security recommendation”. Meta writes the text itself, for example: <i>123456 is your verification code. For your security, do not share this code.</i> Visitors get a 6-digit code, valid for 10 minutes.</p>
            </div>
            {Object.values(WA_TEMPLATES).map((t) => (
              <div key={t.name} style={{ marginTop: 14 }}>
                <b>{t.name}</b> <span className="adm-badge off">{t.category}</span>
                <pre className="adm-code">{t.body}</pre>
                <small className="adm-sub">Samples: {t.sample.map((x, i) => `{{${i + 1}}} = ${x}`).join(' · ')}</small>
              </div>))}
            <div className="adm-h3">To the visitor (their confirmation)</div>
            <p className="adm-sub">Create these two as well. Turn them on with “Also message the visitor on WhatsApp” on the WhatsApp tab once both are approved.</p>
            {Object.values(WA_CLIENT_TEMPLATES).map((t) => (
              <div key={t.name} style={{ marginTop: 14 }}>
                <b>{t.name}</b> <span className="adm-badge off">{t.category}</span>
                <pre className="adm-code">{t.body}</pre>
                <small className="adm-sub">Samples: {t.sample.map((x, i) => `{{${i + 1}}} = ${x}`).join(' · ')}</small>
              </div>))}
          </div>
          <div className="adm-card" style={{ alignSelf: 'start' }}>
            <div className="adm-card-h"><h2>SMS templates (DLT)</h2></div>
            <p className="adm-sub">Register these as Transactional DLT templates and get them approved in SMSAlert. The slots are filled automatically, in order. The text sent must match exactly.</p>
            {Object.entries(SMS_TEMPLATES).map(([k, v]) => <div key={k} style={{ marginTop: 14 }}><b>{k === 'scan' ? 'Scan enquiry' : 'Solution enquiry'}</b><pre className="adm-code">{v}</pre></div>)}
            <div className="adm-h3">To the visitor (their confirmation)</div>
            <p className="adm-sub">Register these two as well. The report link in the first one needs your domain approved (whitelisted) in DLT. Turn them on with “Also text the visitor” on the SMS tab.</p>
            {Object.entries(SMS_CLIENT_TEMPLATES).map(([k, v]) => <div key={k} style={{ marginTop: 14 }}><b>{k === 'scan' ? 'After a scan' : 'After asking for help'}</b><pre className="adm-code">{v}</pre></div>)}
          </div>
        </div>
      )}
    </Shell>
  );
}

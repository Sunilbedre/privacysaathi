'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { SETTING_DEFS, settingsEnabled, updateSettings } from '@/lib/settings';
import { clearCmsSession, isCmsAuthed, setCmsSession, verifyPassword, cmsEnabled } from '@/lib/cms/auth';
import { patchEnquiry, STATUSES, type EnquiryStatus } from '@/lib/ps/crm';
import { fillSms, sendSmtp, sendSms, sendWhatsApp } from '@/lib/ps/channels';
import { SMS_TEMPLATES } from '@/lib/ps/enquiry';
import { getSetting } from '@/lib/settings';

const tab = (f: FormData) => { const t = String(f.get('tab') ?? ''); return ['alerts', 'email', 'whatsapp', 'sms', 'templates'].includes(t) ? t : 'alerts'; };
const fails = new Map<string, number[]>();
const tooMany = (ip: string) => (fails.get(ip) ?? []).filter((t) => Date.now() - t < 10 * 60_000).length >= 6;
const noteFail = (ip: string) => fails.set(ip, [...(fails.get(ip) ?? []).filter((t) => Date.now() - t < 10 * 60_000), Date.now()]);

export async function loginAction(formData: FormData) {
  if (!cmsEnabled()) redirect('/qwedsa/login?error=config');
  const ip = ((await headers()).get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  if (tooMany(ip)) redirect('/qwedsa/login?error=wait');
  const password = String(formData.get('password') ?? '');
  if (!verifyPassword(password)) { noteFail(ip); redirect('/qwedsa/login?error=auth'); }
  await setCmsSession();
  redirect('/qwedsa');
}

export async function logoutAction() {
  await clearCmsSession();
  redirect('/qwedsa/login');
}

/** Save keys and switches from /qwedsa/settings. Empty field = keep what is saved. "Remove" = delete it. */
export async function saveSettingsAction(formData: FormData) {
  if (!(await isCmsAuthed())) redirect('/qwedsa/login');
  if (!settingsEnabled()) redirect(`/qwedsa/settings?tab=${tab(formData)}&msg=disabled`);
  const patch: Record<string, string | null> = {};
  for (const d of SETTING_DEFS) {
    if (formData.get(`remove_${d.key}`) === 'on') { patch[d.key] = null; continue; }
    const v = String(formData.get(d.key) ?? '').trim();
    if (v) patch[d.key] = v;
  }
  try { updateSettings(patch); } catch { redirect(`/qwedsa/settings?tab=${tab(formData)}&msg=error`); }
  redirect(`/qwedsa/settings?tab=${tab(formData)}&msg=saved`);
}

/** Try the saved keys. Reports only success or failure, never a key. */
export async function testSettingAction(formData: FormData) {
  if (!(await isCmsAuthed())) redirect('/qwedsa/login');
  const which = String(formData.get('which') ?? '');
  let msg = 'test-error';
  try {
    if (which === 'smtp' || which === 'mail') {
      const to = (getSetting('LEAD_TO_EMAIL') ?? '').split(/[,;]/).map((x) => x.trim()).filter(Boolean);
      const r = to.length ? await sendSmtp({ to, subject: 'Privacy Saathi test email', text: 'Your SMTP settings work.', html: '<p>Your SMTP settings work.</p>' }) : 'noto';
      msg = r === 'sent' ? 'smtp-ok' : r === null ? 'smtp-none' : r === 'noto' ? 'smtp-noto' : 'smtp-fail';
    } else if (which === 'whatsapp') {
      const r = await sendWhatsApp(getSetting('WA_TEMPLATE_SCAN'), ['Test Person', '+91 90000 00000', 'example.com', 'score 40/100', 'https://example.com/crm']);
      msg = r === 'sent' ? 'wa-ok' : r === 'skipped' ? 'wa-none' : 'wa-fail';
    } else if (which === 'sms') {
      const r = await sendSms(fillSms(SMS_TEMPLATES.scan, ['Test Person', '9000000000', 'test', 'TEST']));
      msg = r === 'sent' ? 'sms-ok' : r === 'skipped' ? 'sms-none' : 'sms-fail';
    }
  } catch { msg = 'test-error'; }
  redirect(`/qwedsa/settings?tab=${tab(formData)}&msg=${msg}`);
}


/** CRM: change an enquiry's stage and/or add a note. */
export async function updateEnquiryAction(formData: FormData) {
  if (!(await isCmsAuthed())) redirect('/qwedsa/login');
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '');
  const note = String(formData.get('note') ?? '');
  await patchEnquiry(id, { status: (STATUSES as readonly string[]).includes(status) ? (status as EnquiryStatus) : undefined, note });
  const back = String(formData.get('back') ?? '');
  const keep = /^[\w=&%.\-]*$/.test(back) ? back.split('&').filter((x) => x && !x.startsWith('e=')).join('&') : '';
  redirect(`/qwedsa/crm?${keep ? keep + '&' : ''}e=${encodeURIComponent(id)}`);
}

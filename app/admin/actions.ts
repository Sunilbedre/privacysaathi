'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { SETTING_DEFS, settingsEnabled, updateSettings } from '@/lib/settings';
import { clearCmsSession, isCmsAuthed, setCmsSession, verifyPassword, cmsEnabled } from '@/lib/cms/auth';
import { createEnquiry, deleteEnquiry, patchEnquiry, STATUSES, updateEnquiryFields, type EnquiryFields, type EnquiryStatus } from '@/lib/ps/crm';
import { phoneProblem } from '@/lib/lead-rules';
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


/* ---------- CRM: add, edit, delete (one or many) ---------- */
const keepQuery = (back: string) => (/^[\w=&%.\-]*$/.test(back) ? back.split('&').filter((x) => x && !/^(e|new|edit|msg|err|n|op)=/.test(x)).join('&') : '');
const crmUrl = (keep: string, extra: Record<string, string>) => `/qwedsa/crm?${[keep, ...Object.entries(extra).map(([k, v]) => `${k}=${encodeURIComponent(v)}`)].filter(Boolean).join('&')}`;
const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim();

/** Reads and checks the lead form. Returns the fields, or an error message in plain words. */
function readLead(f: FormData): { ok: true; v: EnquiryFields } | { ok: false; error: string } {
  const name = str(f, 'name'), phone = str(f, 'phone'), email = str(f, 'email');
  if (name.length < 2) return { ok: false, error: 'Please enter a name.' };
  const pp = phoneProblem(phone); if (pp) return { ok: false, error: pp };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, error: 'That email address does not look right.' };
  const kind = str(f, 'sourceKind'), other = str(f, 'sourceOther');
  const source = kind === 'Other' ? `Manual: ${other || 'Other'}` : kind ? `Manual: ${kind}` : str(f, 'source');
  const status = str(f, 'status'), priority = str(f, 'priority'), type = str(f, 'type');
  return { ok: true, v: {
    type: type === 'solution' ? 'solution' : 'scan', name, phone, email, company: str(f, 'company'), website: str(f, 'website'), topic: str(f, 'topic'), message: str(f, 'message'), preferredTime: str(f, 'preferredTime'),
    priority: priority === 'hot' ? 'hot' : 'warm', status: (STATUSES as readonly string[]).includes(status) ? (status as EnquiryStatus) : 'new', ...(source ? { source } : {}),
  } };
}

export async function createEnquiryAction(formData: FormData) {
  if (!(await isCmsAuthed())) redirect('/qwedsa/login');
  const keep = keepQuery(str(formData, 'back'));
  const r = readLead(formData);
  if (!r.ok) redirect(crmUrl(keep, { new: '1', err: r.error }));
  const v = r.v;
  const e = await createEnquiry({ type: v.type ?? 'scan', name: v.name ?? '', phone: v.phone ?? '', email: v.email ?? '', company: v.company ?? '', website: v.website ?? '', scanId: '', score: null, band: '', priority: v.priority ?? 'warm',
    exposureCr: 0, gaps: 0, topic: v.topic ?? '', message: v.message ?? '', preferredTime: v.preferredTime ?? '', source: v.source ?? 'Manual', utm: '' });
  const note = str(formData, 'note');
  await patchEnquiry(e.id, { status: v.status && v.status !== 'new' ? v.status : undefined, note: note || 'Added by hand in the admin' });
  redirect(crmUrl(keep, { e: e.id, msg: 'created' }));
}

export async function updateEnquiryFieldsAction(formData: FormData) {
  if (!(await isCmsAuthed())) redirect('/qwedsa/login');
  const id = str(formData, 'id'), keep = keepQuery(str(formData, 'back'));
  const r = readLead(formData);
  if (!r.ok) redirect(crmUrl(keep, { e: id, edit: '1', err: r.error }));
  const saved = await updateEnquiryFields(id, r.v);
  redirect(crmUrl(keep, saved ? { e: id, msg: 'saved' } : { msg: 'gone' }));
}

export async function deleteEnquiryAction(formData: FormData) {
  if (!(await isCmsAuthed())) redirect('/qwedsa/login');
  const id = str(formData, 'id'), keep = keepQuery(str(formData, 'back'));
  const done = await deleteEnquiry(id);
  redirect(crmUrl(keep, { msg: done ? 'deleted' : 'gone' }));
}

/** Delete or move several enquiries at once (the checkboxes in the list). */
export async function bulkEnquiryAction(formData: FormData) {
  if (!(await isCmsAuthed())) redirect('/qwedsa/login');
  const keep = keepQuery(str(formData, 'back'));
  const ids = formData.getAll('ids').map(String).slice(0, 300);
  const op = str(formData, 'op'), status = str(formData, 'status');
  if (!ids.length) redirect(crmUrl(keep, { msg: 'none' }));
  let n = 0;
  if (op === 'delete') { for (const id of ids) if (await deleteEnquiry(id)) n++; redirect(crmUrl(keep, { msg: 'bulk-deleted', n: String(n) })); }
  if (op === 'stage' && (STATUSES as readonly string[]).includes(status)) { for (const id of ids) if (await patchEnquiry(id, { status: status as EnquiryStatus })) n++; redirect(crmUrl(keep, { msg: 'bulk-moved', n: String(n) })); }
  redirect(crmUrl(keep, { msg: 'none' }));
}

import 'server-only';
import { getSetting } from '@/lib/settings';
import { esc, type Mail } from './mail';
import { patchEnquiry, type Enquiry } from './crm';
import { fillSms, sendSms, sendWhatsApp, type ChannelResult } from './channels';
import { ownerRecipients, postWebhook, sendMail } from './notify';
import { crore } from './dpdp-map';

export const crmLink = (id: string) => `${(getSetting('CRM_BASE_URL') || process.env.NEXT_PUBLIC_SITE_URL || 'https://bedreweb.com').replace(/\/$/, '')}/qwedsa/crm?e=${id}`;
const who = (e: Enquiry) => e.company || e.website || e.name;
const gist = (e: Enquiry) => `score ${e.score ?? '-'}/100${e.exposureCr ? `, up to ${crore(e.exposureCr)}` : ''}`;

/** The exact message texts to register as templates (shown on the settings page). {{n}} are the variables we fill in. */
export const WA_TEMPLATES = {
  scan: { name: 'ps_scan_enquiry', category: 'Utility', body: 'New Privacy Saathi scan enquiry.\nName: {{1}}\nPhone: {{2}}\nBusiness: {{3}}\nResult: {{4}}\nOpen in CRM: {{5}}', sample: ['Asha Rao', '+91 98765 43210', 'example.com', 'score 38/100, up to ₹250 crore', 'https://bedreweb.com/admin/crm?e=abc123'] },
  solution: { name: 'ps_solution_enquiry', category: 'Utility', body: 'New Privacy Saathi SOLUTION enquiry.\nName: {{1}}\nPhone: {{2}}\nBusiness: {{3}}\nWants help with: {{4}}\nOpen in CRM: {{5}}', sample: ['Asha Rao', '+91 98765 43210', 'example.com', 'Security safeguards', 'https://bedreweb.com/admin/crm?e=abc123'] },
} as const;
/** Register these exactly in SMSAlert / DLT. {#var#} slots are filled in order. */
export const SMS_TEMPLATES = {
  scan: 'Privacy Saathi: new scan enquiry from {#var#} ({#var#}), {#var#}. CRM id {#var#}.',
  solution: 'Privacy Saathi: SOLUTION enquiry from {#var#} ({#var#}) for {#var#}. CRM id {#var#}.',
} as const;

function ownerMail(e: Enquiry): Mail {
  const kind = e.type === 'solution' ? 'SOLUTION enquiry' : 'Scan enquiry';
  const subject = `[${e.priority === 'hot' ? 'HOT' : 'NEW'}] ${kind}: ${who(e)}${e.topic ? ` · ${e.topic}` : ''}`;
  const row = (k: string, v: string) => `<tr><td style="padding:5px 14px 5px 0;color:#6B6B7B">${esc(k)}</td><td style="padding:5px 0">${v}</td></tr>`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111"><h2 style="margin:0 0 12px">${esc(kind)}</h2><table>${row('Name', esc(e.name))}${row('Phone', esc(e.phone))}${row('Email', esc(e.email))}${row('Business', esc(who(e)))}${row('Result', esc(gist(e)))}${e.topic ? row('Wants help with', esc(e.topic)) : ''}${e.message ? row('Message', esc(e.message)) : ''}${e.preferredTime ? row('Best time', esc(e.preferredTime)) : ''}${row('Source', esc(e.source || '-'))}</table><p><a href="${esc(crmLink(e.id))}" style="background:#4F4FD9;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Open in CRM</a></p></div>`;
  const text = `${kind}\nName: ${e.name}\nPhone: ${e.phone}\nEmail: ${e.email}\nBusiness: ${who(e)}\nResult: ${gist(e)}\n${e.topic ? `Wants help with: ${e.topic}\n` : ''}${e.message ? `Message: ${e.message}\n` : ''}${e.preferredTime ? `Best time: ${e.preferredTime}\n` : ''}CRM: ${crmLink(e.id)}`;
  return { subject, html, text };
}

export function solutionVisitorMail(e: Enquiry): Mail {
  const first = e.name.trim().split(/\s+/)[0];
  const subject = `We received your request: ${e.topic || 'DPDP help'}`;
  const text = `Hi ${first},\n\nThanks for asking Bedre to help with ${e.topic || 'your DPDP readiness'}. A consultant will review your result and contact you on ${e.phone}.\n\nReference: ${e.id}\n\nPrivacy Saathi by Bedre Web Technologies\nThis is a technology assessment, not legal advice.`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#111;max-width:560px"><p>Hi ${esc(first)},</p><p>Thanks for asking Bedre to help with <b>${esc(e.topic || 'your DPDP readiness')}</b>. A consultant will review your result and contact you on ${esc(e.phone)}.</p><p style="color:#6B6B7B;font-size:13px">Reference: ${esc(e.id)}<br>Privacy Saathi by Bedre Web Technologies. A technology assessment, not legal advice.</p></div>`;
  return { subject, html, text };
}

/**
 * Tells you about an enquiry on every channel you set up: WhatsApp, SMS, email and chat webhook. One failing channel never blocks the others.
 * `skipOwnerMail`: the scan route already sends its richer owner email.
 */
export async function alertEnquiry(e: Enquiry, opts: { skipOwnerMail?: boolean; visitorMail?: Mail | null } = {}): Promise<Record<string, ChannelResult | string>> {
  const t = e.type === 'solution';
  const topic = t ? e.topic : gist(e);
  const owners = ownerRecipients();
  const [wa, sms, mail, hook, vis] = await Promise.allSettled([
    sendWhatsApp(getSetting(t ? 'WA_TEMPLATE_SOLUTION' : 'WA_TEMPLATE_SCAN'), [e.name, e.phone, who(e), topic, crmLink(e.id)]),
    sendSms(fillSms(SMS_TEMPLATES[t ? 'solution' : 'scan'], [e.name, e.phone, topic, e.id])),
    opts.skipOwnerMail || !owners.length ? Promise.resolve('skipped' as const) : sendMail({ to: owners, mail: ownerMail(e), replyTo: e.email, kind: 'owner' }),
    postWebhook(`${t ? ':bulb: *SOLUTION enquiry*' : ':mag: *Scan enquiry*'}: ${who(e)} · ${e.name} · ${e.phone}${e.topic ? ` · ${e.topic}` : ''}\n${crmLink(e.id)}`),
    opts.visitorMail ? sendMail({ to: e.email, mail: opts.visitorMail, replyTo: owners[0], kind: 'visitor' }) : Promise.resolve('skipped' as const),
  ]);
  const v = <T,>(r: PromiseSettledResult<T>) => (r.status === 'fulfilled' ? String(r.value) : 'failed');
  const alerts = { whatsapp: v(wa), sms: v(sms), ownerEmail: v(mail), webhook: hook.status === 'fulfilled' ? (hook.value ? 'sent' : 'skipped') : 'failed', visitorEmail: v(vis) };
  await patchEnquiry(e.id, { alerts });
  return alerts;
}

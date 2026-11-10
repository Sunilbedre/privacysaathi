import 'server-only';
import { getSetting } from '@/lib/settings';
import { esc, type Mail } from './mail';
import { patchEnquiry, type Enquiry } from './crm';
import { fillSms, isOn, sendSms, sendWhatsApp, type ChannelResult } from './channels';
import { PS_SITE } from './config';
import { ownerRecipients, postWebhook, sendMail } from './notify';
import { crore } from './dpdp-map';

export const crmLink = (id: string) => `${(getSetting('CRM_BASE_URL') || process.env.NEXT_PUBLIC_SITE_URL || 'https://bedreweb.com').replace(/\/$/, '')}/qwedsa/crm?e=${id}`;
const who = (e: Enquiry) => e.company || e.website || e.name;
const gist = (e: Enquiry) => `score ${e.score ?? '-'}/100${e.exposureCr ? `, up to ${crore(e.exposureCr)}` : ''}`;

/** The exact message texts to register as templates (shown on the settings page). {{n}} are the variables we fill in. */
export const WA_TEMPLATES = {
  scan: { name: 'ps_scan_enquiry', category: 'Utility', body: 'New Privacy Saathi scan enquiry.\nName: {{1}}\nPhone: {{2}}\nBusiness: {{3}}\nResult: {{4}}\nOpen in CRM: {{5}}', sample: ['Asha Rao', '+91 98765 43210', 'example.com', 'score 38/100, up to ₹250 crore', 'https://privacysaathi.in/qwedsa/crm?e=abc123'] },
  solution: { name: 'ps_solution_enquiry', category: 'Utility', body: 'New Privacy Saathi SOLUTION enquiry.\nName: {{1}}\nPhone: {{2}}\nBusiness: {{3}}\nWants help with: {{4}}\nOpen in CRM: {{5}}', sample: ['Asha Rao', '+91 98765 43210', 'example.com', 'Security safeguards', 'https://privacysaathi.in/qwedsa/crm?e=abc123'] },
} as const;
/** Messages to the visitor (client). Same rules: register exactly, then switch on in Settings. */
export const WA_CLIENT_TEMPLATES = {
  scan: { name: 'ps_client_scan', category: 'Utility', body: 'Hi {{1}}, thanks for checking {{2}} with Privacy Saathi. Your DPDP readiness result: {{3}}. Your report: {{4}}\nA Bedre consultant may contact you to explain the next steps.', sample: ['Asha', 'example.com', 'score 38/100', 'https://privacysaathi.in/report/abc123'] },
  solution: { name: 'ps_client_solution', category: 'Utility', body: 'Hi {{1}}, we received your request for help with {{2}}. A Bedre consultant will call you on {{3}}. Reference: {{4}}\nPrivacy Saathi by Bedre Web Technologies.', sample: ['Asha', 'Security safeguards', '+91 98765 43210', 'abc123'] },
} as const;
export const SMS_CLIENT_TEMPLATES = {
  scan: 'Hi {#var#}, thanks for using Privacy Saathi. Your DPDP report: {#var#} - Bedre Web Technologies',
  solution: 'Hi {#var#}, we received your request for {#var#}. A Bedre consultant will call you soon. Ref {#var#}. - Privacy Saathi',
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
  const first = e.name.trim().split(/\s+/)[0] || 'there';
  const reportUrl = e.scanId ? `${PS_SITE}/report/${e.scanId}` : PS_SITE;
  const [wa, sms, mail, hook, vis, cwa, csms] = await Promise.allSettled([
    sendWhatsApp(getSetting(t ? 'WA_TEMPLATE_SOLUTION' : 'WA_TEMPLATE_SCAN'), [e.name, e.phone, who(e), topic, crmLink(e.id)]),
    sendSms(fillSms(SMS_TEMPLATES[t ? 'solution' : 'scan'], [e.name, e.phone, topic, e.id])),
    opts.skipOwnerMail || !owners.length ? Promise.resolve('skipped' as const) : sendMail({ to: owners, mail: ownerMail(e), replyTo: e.email, kind: 'owner' }),
    postWebhook(`${t ? ':bulb: *SOLUTION enquiry*' : ':mag: *Scan enquiry*'}: ${who(e)} · ${e.name} · ${e.phone}${e.topic ? ` · ${e.topic}` : ''}\n${crmLink(e.id)}`),
    opts.visitorMail ? sendMail({ to: e.email, mail: opts.visitorMail, replyTo: owners[0], kind: 'visitor' }) : Promise.resolve('skipped' as const),
    // Confirmation to the visitor on their own phone. Off until switched on in Settings (templates must be approved first).
    isOn('WA_CLIENT_SEND') && e.phone
      ? sendWhatsApp(getSetting(t ? 'WA_TEMPLATE_CLIENT_SOLUTION' : 'WA_TEMPLATE_CLIENT_SCAN'), t ? [first, e.topic || 'DPDP readiness', e.phone, e.id] : [first, who(e), gist(e).split(',')[0], reportUrl], [e.phone])
      : Promise.resolve('skipped' as const),
    isOn('SMS_CLIENT_SEND') && e.phone
      ? sendSms(fillSms(SMS_CLIENT_TEMPLATES[t ? 'solution' : 'scan'], t ? [first, e.topic || 'DPDP readiness', e.id] : [first, reportUrl]), [e.phone])
      : Promise.resolve('skipped' as const),
  ]);
  const v = <T,>(r: PromiseSettledResult<T>) => (r.status === 'fulfilled' ? String(r.value) : 'failed');
  const alerts = { whatsapp: v(wa), sms: v(sms), ownerEmail: v(mail), webhook: hook.status === 'fulfilled' ? (hook.value ? 'sent' : 'skipped') : 'failed', visitorEmail: v(vis), clientWhatsapp: v(cwa), clientSms: v(csms) };
  await patchEnquiry(e.id, { alerts });
  return alerts;
}

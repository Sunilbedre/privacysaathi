import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { crore } from './dpdp-map';

/** Email and notification content. Pure functions: no network, no storage, so they are easy to test. Every value that came from a visitor is HTML-escaped. */
export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

const C = { ink: '#0A0A0A', muted: '#5F5F5F', line: '#E5E7EB', accent: '#4F4FD9', bg: '#F4F6FB', fail: '#C0262D', warn: '#A35C00', ok: '#0B7F5B' };
const FONT = "Geist,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export type Priority = 'hot' | 'warm';
/** Hot: a low score, or a gap in a duty with a fine tier of ₹200 crore or more. Hot leads are worth a same-day call. */
export function priorityOf(score: number, exposure: { level: 'gap' | 'review' | 'none'; maxCr: number }): Priority {
  return score < 40 || (exposure.level === 'gap' && exposure.maxCr >= 200) ? 'hot' : 'warm';
}

const secret = () => process.env.PS_SECRET || 'dev-only-secret';
export const unsubToken = (email: string) => createHmac('sha256', secret()).update('unsub:' + email.trim().toLowerCase()).digest('hex').slice(0, 32);
export function verifyUnsub(email: string, token: string): boolean {
  const a = Buffer.from(unsubToken(email)), b = Buffer.from(String(token));
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Emails are stored hashed in the suppression and follow-up logs, so those files hold no addresses. */
export const emailHash = (email: string) => createHash('sha256').update(secret() + email.trim().toLowerCase()).digest('hex').slice(0, 24);

export interface MailCtx {
  first: string; who: string; score: number; band: string; exposureCr: number; exposureLevel: 'gap' | 'review' | 'none'; exposureDuty: string;
  gaps: number; top: { title: string; fix?: string }[]; reportUrl: string; bookingUrl: string; unsubUrl?: string; retentionDays: number;
}
export interface Mail { subject: string; html: string; text: string }

const btn = (url: string, label: string, dark = true) => `<a href="${esc(url)}" style="display:inline-block;background:${dark ? C.ink : '#fff'};color:${dark ? '#fff' : C.ink} !important;border:1px solid ${C.ink};padding:13px 22px;border-radius:8px;font-weight:600;font-size:15px;text-decoration:none;margin:0 8px 8px 0">${esc(label)}</a>`;

function shell(pre: string, inner: string, unsubUrl?: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Privacy Saathi</title></head><body style="margin:0;padding:0;background:${C.bg};font-family:${FONT};color:${C.ink}">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(pre)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border:1px solid ${C.line};border-radius:12px;overflow:hidden">
<tr><td style="background:#070B16;padding:20px 28px;color:#fff;font-size:18px;font-weight:700;letter-spacing:-.02em">Privacy Saathi <span style="font-weight:400;color:#9FB0D3;font-size:13px">by Bedre</span></td></tr>
<tr><td style="padding:28px;font-size:15px;line-height:1.6">${inner}</td></tr>
<tr><td style="padding:18px 28px;border-top:1px solid ${C.line};font-size:12px;line-height:1.6;color:${C.muted}">Automated technical check, not legal advice, an audit or a certification. Bedre Web Technologies Pvt. Ltd., JP Nagar, Bengaluru, India.${unsubUrl ? ` <a href="${esc(unsubUrl)}" style="color:${C.muted}">Unsubscribe</a>` : ''}</td></tr>
</table></td></tr></table></body></html>`;
}

const fineLine = (c: MailCtx) => c.exposureLevel === 'none'
  ? 'We found no gaps in what we could check from outside. Some duties need your own input.'
  : `${c.exposureLevel === 'gap' ? 'Highest fine tier touched' : 'Possible fine tier'}: up to ${crore(c.exposureCr)} (${c.exposureDuty}). These are the maximum penalties the Act allows. Actual penalties are decided by the Data Protection Board.`;
const topHtml = (c: MailCtx, withFix: boolean) => c.top.length ? `<ol style="padding-left:20px;margin:8px 0 18px">${c.top.map((t) => `<li style="margin-bottom:8px"><b>${esc(t.title)}</b>${withFix && t.fix ? `<br><span style="color:${C.muted}">${esc(t.fix)}</span>` : ''}</li>`).join('')}</ol>` : '';
const topText = (c: MailCtx, withFix: boolean) => c.top.map((t, i) => `${i + 1}. ${t.title}${withFix && t.fix ? `\n   ${t.fix}` : ''}`).join('\n');
const foot = (c: MailCtx) => (c.unsubUrl ? `\nUnsubscribe: ${c.unsubUrl}` : '');

export function renderVisitor(c: MailCtx): Mail {
  const html = shell(`Your DPDP readiness report: ${c.score} out of 100`, `
<p style="margin:0 0 14px">Hi ${esc(c.first)},</p>
<p style="margin:0 0 18px">Your automated DPDP readiness report for <b>${esc(c.who)}</b> is ready.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px"><tr><td style="font-size:44px;font-weight:700;letter-spacing:-.04em;padding-right:16px">${c.score}<span style="font-size:16px;color:${C.muted}"> / 100</span></td><td style="font-size:16px;font-weight:600">${esc(c.band)}<br><span style="font-weight:400;color:${C.muted};font-size:13px">${c.gaps} duty ${c.gaps === 1 ? 'gap' : 'gaps'} found</span></td></tr></table>
<p style="margin:0 0 18px;padding:14px 16px;border:1px solid ${c.exposureLevel === 'gap' ? C.fail : C.line};border-radius:8px;background:${c.exposureLevel === 'gap' ? '#FDECEC' : '#F8F9FB'};font-size:14px">${esc(fineLine(c))}</p>
${c.top.length ? `<p style="margin:0 0 4px"><b>Gaps to close first</b></p>${topHtml(c, true)}` : ''}
<p style="margin:0 0 6px">${btn(c.reportUrl, 'Open your private report')}${btn(c.bookingUrl, 'Book a free 30-minute review', false)}</p>
<p style="margin:14px 0 0;color:${C.muted};font-size:13px">A Bedre consultant will be in touch. If you would rather not be contacted, just reply to this email. Your report link is private to you and is deleted after ${c.retentionDays} days.</p>`, c.unsubUrl);
  const text = `Hi ${c.first},\n\nYour automated DPDP readiness report for ${c.who} is ready.\n\nScore: ${c.score} of 100 (${c.band}). ${c.gaps} duty ${c.gaps === 1 ? 'gap' : 'gaps'} found.\n\n${fineLine(c)}\n\n${c.top.length ? `Gaps to close first:\n${topText(c, true)}\n\n` : ''}Open your private report: ${c.reportUrl}\nBook a free 30-minute review: ${c.bookingUrl}\n\nA Bedre consultant will be in touch. If you would rather not be contacted, reply to this email. The report link is private and deleted after ${c.retentionDays} days.\n\nAutomated technical check, not legal advice, an audit or a certification.\nBedre Web Technologies Pvt. Ltd., JP Nagar, Bengaluru, India.${foot(c)}\n`;
  return { subject: `Your DPDP readiness report for ${c.who}: ${c.score}/100`, html, text };
}

export function renderFollowup(step: 1 | 2, c: MailCtx): Mail {
  if (step === 1) {
    const html = shell('Three fixes to start with', `
<p style="margin:0 0 14px">Hi ${esc(c.first)},</p>
<p style="margin:0 0 14px">A day ago we ran a DPDP check on <b>${esc(c.who)}</b> (score ${c.score}/100). Here is where we would start:</p>
${topHtml(c, true)}
<p style="margin:0 0 6px">${btn(c.reportUrl, 'Open your private report')}${btn(c.bookingUrl, 'Book a free 30-minute review', false)}</p>
<p style="margin:14px 0 0;color:${C.muted};font-size:13px">Reply to this email with any question. We are a technology partner, not a law firm.</p>`, c.unsubUrl);
    return { subject: `${c.who}: three DPDP fixes to start with`, html, text: `Hi ${c.first},\n\nA day ago we ran a DPDP check on ${c.who} (score ${c.score}/100). Here is where we would start:\n\n${topText(c, true)}\n\nYour report: ${c.reportUrl}\nBook a free 30-minute review: ${c.bookingUrl}\n\nReply with any question. We are a technology partner, not a law firm.${foot(c)}\n` };
  }
  const html = shell('Want a hand with these?', `
<p style="margin:0 0 14px">Hi ${esc(c.first)},</p>
<p style="margin:0 0 14px">Fixing DPDP gaps is quicker with someone who has done it before. A Bedre consultant can walk through your report with you in 30 minutes, free, and tell you what is worth doing first.</p>
<p style="margin:0 0 6px">${btn(c.bookingUrl, 'Book a free 30-minute review')}${btn(c.reportUrl, 'Open your report', false)}</p>
<p style="margin:14px 0 0;color:${C.muted};font-size:13px">This is our last reminder. We are a technology partner, not a law firm.</p>`, c.unsubUrl);
  return { subject: `Want a hand with ${c.who}'s DPDP gaps?`, html, text: `Hi ${c.first},\n\nFixing DPDP gaps is quicker with someone who has done it before. A Bedre consultant can walk through your report with you in 30 minutes, free, and tell you what to do first.\n\nBook a free review: ${c.bookingUrl}\nYour report: ${c.reportUrl}\n\nThis is our last reminder. We are a technology partner, not a law firm.${foot(c)}\n` };
}

export interface OwnerLead {
  name: string; email: string; phone: string; company: string; website: string; domain: string; industry: string; size: string; source: string;
  utm_source: string; utm_medium: string; utm_campaign: string; utm_term: string; gclid: string; landing_host: string; receivedAt: string;
  no_official_email: boolean; email_domain_matches_website: boolean; no_website: boolean; priority: Priority;
}
const who = (l: OwnerLead) => l.company || l.domain || l.name;
const srcLabel = (s: string) => (s === 'popup' ? 'popup' : s === 'dpdp_check' ? 'DPDP check' : s || 'scan');

export function renderOwner(l: OwnerLead, c: MailCtx): Mail {
  const tag = l.priority === 'hot' ? 'HOT' : 'NEW';
  const subject = `[${tag}] DPDP lead: ${who(l)} · ${c.score}/100${c.exposureLevel !== 'none' ? ` · up to ${crore(c.exposureCr)}` : ''} · ${srcLabel(l.source)}`;
  const warn = [l.no_official_email ? 'Free or personal email: the emailed report was NOT sent. Call first.' : '', !l.no_website && l.domain && !l.email_domain_matches_website ? 'Email domain differs from the website. Confirm they own it before sharing detail.' : '', l.no_website ? 'No website: assessed from questionnaire answers only.' : ''].filter(Boolean);
  const row = (k: string, v: string) => `<tr><td style="padding:6px 14px 6px 0;color:${C.muted};white-space:nowrap;vertical-align:top">${esc(k)}</td><td style="padding:6px 0">${v}</td></tr>`;
  const html = shell(subject, `
<p style="margin:0 0 14px"><span style="display:inline-block;background:${l.priority === 'hot' ? C.fail : C.accent};color:#fff;border-radius:6px;padding:3px 10px;font-size:12px;font-weight:700;letter-spacing:.06em">${tag}</span> <b style="font-size:17px">${esc(who(l))}</b></p>
${warn.length ? `<p style="margin:0 0 16px;padding:12px 14px;border:1px solid ${C.warn};background:#FFF3DC;border-radius:8px;font-size:13px;color:#7A4A00">${warn.map(esc).join('<br>')}</p>` : ''}
<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px">
${row('Name', esc(l.name))}${row('Phone', `<a href="tel:${esc(l.phone.replace(/[^\d+]/g, ''))}" style="color:${C.accent}">${esc(l.phone)}</a>`)}${row('Email', `<a href="mailto:${esc(l.email)}" style="color:${C.accent}">${esc(l.email)}</a>`)}${row('Company', esc(l.company || '-'))}${row('Website', l.website ? `<a href="${esc(l.website)}" style="color:${C.accent}">${esc(l.domain)}</a>` : '-')}${row('Industry / size', `${esc(l.industry)} / ${esc(l.size || '-')}`)}
${row('Score', `<b>${c.score}/100</b> (${esc(c.band)}), ${c.gaps} duty ${c.gaps === 1 ? 'gap' : 'gaps'}`)}${row('Fine exposure', c.exposureLevel === 'none' ? 'None found' : `Up to ${esc(crore(c.exposureCr))} (${esc(c.exposureDuty)})`)}
${row('Source', `${esc(srcLabel(l.source))} on ${esc(l.landing_host || '-')}`)}${row('Campaign', `${esc(l.utm_source || '-')} / ${esc(l.utm_medium || '-')} / ${esc(l.utm_campaign || '-')}${l.utm_term ? ` / ${esc(l.utm_term)}` : ''}${l.gclid ? ' · gclid yes' : ''}`)}${row('Received', esc(new Date(l.receivedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST'))}
</table>
${c.top.length ? `<p style="margin:18px 0 4px"><b>Top gaps</b></p>${topHtml(c, false)}` : ''}
<p style="margin:12px 0 0">${btn(c.reportUrl, 'Open their report')}</p>`);
  const text = `${tag} DPDP lead: ${who(l)}\n${warn.length ? `\n! ${warn.join('\n! ')}\n` : ''}\nName: ${l.name}\nPhone: ${l.phone}\nEmail: ${l.email}\nCompany: ${l.company || '-'}\nWebsite: ${l.website || '-'}\nIndustry/size: ${l.industry} / ${l.size || '-'}\nScore: ${c.score}/100 (${c.band}), ${c.gaps} gaps\nFine exposure: ${c.exposureLevel === 'none' ? 'none found' : `up to ${crore(c.exposureCr)} (${c.exposureDuty})`}\nSource: ${srcLabel(l.source)} on ${l.landing_host || '-'}\nCampaign: ${l.utm_source || '-'} / ${l.utm_medium || '-'} / ${l.utm_campaign || '-'}${l.gclid ? ' (gclid yes)' : ''}\n\nTop gaps:\n${topText(c, false)}\n\nReport: ${c.reportUrl}\n`;
  return { subject, html, text };
}

/** Slack-compatible text (also works with most incoming-webhook tools). */
export function webhookText(l: OwnerLead, c: MailCtx): string {
  return `${l.priority === 'hot' ? ':fire: *HOT*' : ':new:'} DPDP lead: *${who(l)}* · ${c.score}/100${c.exposureLevel !== 'none' ? ` · up to ${crore(c.exposureCr)}` : ''} · ${srcLabel(l.source)}\n${l.name} · ${l.phone} · ${l.email}${l.no_official_email ? ' (free email, call first)' : ''}\n${c.reportUrl}`;
}

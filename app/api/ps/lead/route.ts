import { NextResponse } from 'next/server';
import { z } from 'zod';
import { saveLead } from '@/lib/leads';
import { emailDomain, emailProblem, parseWebsite, phoneProblem, sameCompany } from '@/lib/lead-rules';
import { buildReport, type Answers } from '@/lib/scan/score';
import { ipLimited } from '@/lib/ps/guard';
import { appendLine, getScan, hashIp, newId, putScan, retentionDays, updateScan } from '@/lib/ps/store';
import { PS_CONSENT, PS_SITE } from '@/lib/ps/config';
import { summariseDpdp } from '@/lib/ps/dpdp-map';
import { priorityOf, renderOwner, renderVisitor, unsubToken, type MailCtx, type OwnerLead } from '@/lib/ps/mail';
import { ownerRecipients, sendMail } from '@/lib/ps/notify';
import { createEnquiry } from '@/lib/ps/crm';
import { alertEnquiry } from '@/lib/ps/enquiry';
import { originFromTags, sourceLabel } from '@/lib/ps/origin';

const INDUSTRIES = ['retail', 'education', 'healthcare', 'fintech', 'manufacturing', 'realestate', 'hospitality', 'professional', 'saas', 'agency', 'other'];

const schema = z.object({
  path: z.enum(['scan', 'email_help']).default('scan'),
  scanId: z.string().max(64).optional(), name: z.string().trim().min(2).max(120), email: z.string().trim().toLowerCase().max(200), phone: z.string().trim().max(30),
  website: z.string().trim().max(300).optional().default(''), noWebsite: z.boolean().optional().default(false), company: z.string().trim().max(150).optional().default(''),
  industry: z.string().max(30).optional().default('other'), size: z.string().max(20).optional().default(''), officialEmail: z.enum(['yes', 'no']).optional().default('yes'),
  channels: z.array(z.string().max(40)).max(10).optional().default([]),
  answers: z.record(z.string(), z.unknown()).optional().default({}), consent: z.literal(true, { message: 'Please tick the consent box' }),
  authorised: z.boolean().optional().default(false), hp: z.string().max(0).optional(), tags: z.record(z.string(), z.string().max(300)).optional().default({}),
});

export async function POST(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  if (ipLimited(`ld:${ip}`, 10)) return NextResponse.json({ error: 'Too many requests. Please try again in a while.' }, { status: 429 });
  const p = schema.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message ?? 'Please check the form', field: String(p.error.issues[0]?.path[0] ?? '') }, { status: 400 });
  const d = p.data;
  if (d.hp) return NextResponse.json({ id: newId() });
  const errors: Record<string, string> = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) errors.email = 'Please enter a valid email';
  const pp = phoneProblem(d.phone); if (pp) errors.phone = pp;
  const site = d.website ? parseWebsite(d.website) : null;
  const needsSite = d.path === 'scan' && !d.noWebsite;
  if (needsSite && !site) errors.website = 'Please enter a valid website, for example yourcompany.com';
  if (needsSite && !d.authorised) errors.authorised = 'Please confirm you are authorised to assess this website';
  if (d.path === 'email_help' && !d.company) errors.company = 'Please enter your business name';
  if (Object.keys(errors).length) return NextResponse.json({ error: Object.values(errors)[0], errors }, { status: 400 });

  // Official email: detected from the address, and also what the visitor told us.
  const noOfficialEmail = d.path === 'email_help' || !!emailProblem(d.email) || d.officialEmail === 'no';
  const matches = site ? sameCompany(emailDomain(d.email), site.domain) : false;

  let id = d.scanId ?? '';
  let rec = id ? await getScan(id) : null;
  if (id && !rec) return NextResponse.json({ error: 'Your scan has expired. Please start again.' }, { status: 410 });
  if (!rec) {
    // No-website path, or email-help request: a record without a scan.
    id = newId(); const now = new Date();
    rec = { id, domain: site?.domain ?? '', url: site?.url ?? '', deep: false, status: 'done', step: 'Done', pct: 100, createdAt: now.toISOString(), expiresAt: new Date(now.getTime() + retentionDays() * 86400_000).toISOString(), ipHash: hashIp(ip), websiteless: true };
    await putScan(rec);
  }
  const answers = { ...d.answers, ...(d.channels.length ? { channels: d.channels } : {}) } as Answers;
  const industry = INDUSTRIES.includes(d.industry) ? d.industry : 'other';
  await updateScan(id, { answers, industry, size: d.size, noOfficialEmail, company: d.company || rec.company, leadCaptured: true, origin: originFromTags(d.tags), expiresAt: new Date(Date.now() + retentionDays() * 86400_000).toISOString() });
  const rep = buildReport(rec.result ?? null, answers);
  const dp = summariseDpdp(rep.checks, { score: rep.headline, band: rep.band, mode: rec.result?.mode ?? 'questions', pages: rec.result?.pagesScanned ?? 0 });
  const priority = priorityOf(rep.headline, dp.exposure);
  const reportUrl = `${PS_SITE}/report/${id}`;

  const lead = {
    receivedAt: new Date().toISOString(), path: d.path, scanId: id, name: d.name, email: d.email, phone: d.phone, company: d.company || rec.company || '', website: site?.url ?? '', domain: site?.domain ?? '',
    industry, size: d.size, no_official_email: noOfficialEmail, email_domain_matches_website: matches, no_website: d.noWebsite, answers, score: rep.headline, scoreBand: rep.band,
    scoreDpdp: rep.dpdp, scoreSecurity: rep.security, scanMode: rec.result?.mode ?? null, priority, exposureCr: dp.exposure.maxCr, exposureLevel: dp.exposure.level, gaps: dp.exposure.gaps,
    utm_source: d.tags.utm_source ?? '', utm_medium: d.tags.utm_medium ?? '', utm_campaign: d.tags.utm_campaign ?? '', utm_term: d.tags.utm_term ?? '', utm_content: d.tags.utm_content ?? '',
    gclid: d.tags.gclid ?? '', lead_source: d.tags.lead_source ?? '', fbclid: d.tags.fbclid ?? '', referrer: d.tags.ref ?? '', landing_host: d.tags.landing_host ?? '', consentText: PS_CONSENT, ipHash: hashIp(ip),
  };
  await appendLine('leads', lead);

  // Keep the shared Bedre lead file in step (no plain email: the richer alert below replaces it).
  const stored = await saveLead({ name: d.name, email: d.email, organisation: lead.company || site?.domain || '', interest: 'Privacy Saathi', message: `${priority.toUpperCase()} lead, score ${rep.headline}, ${reportUrl}`, receivedAt: lead.receivedAt, consentText: PS_CONSENT, ip: lead.ipHash }, { skipEmail: true });

  const booking = process.env.NEXT_PUBLIC_BOOKING_URL || 'https://bedreweb.com/contact';
  const ctx: MailCtx = {
    first: d.name.trim().split(/\s+/)[0], who: site?.domain || lead.company || 'your business', score: rep.headline, band: rep.band, exposureCr: dp.exposure.maxCr, exposureLevel: dp.exposure.level, exposureDuty: dp.exposure.dutyLabel,
    gaps: dp.exposure.gaps, top: rep.priorities.slice(0, 3).map((c) => ({ title: c.title, fix: c.fix })), reportUrl, bookingUrl: booking, retentionDays: retentionDays(),
    unsubUrl: `${PS_SITE}/api/ps/unsubscribe?e=${encodeURIComponent(d.email)}&t=${unsubToken(d.email)}`,
  };
  const ownerLead: OwnerLead = { name: d.name, email: d.email, phone: d.phone, company: lead.company, website: lead.website, domain: lead.domain, industry, size: d.size, source: sourceLabel(originFromTags(d.tags), lead.lead_source), utm_source: lead.utm_source, utm_medium: lead.utm_medium, utm_campaign: lead.utm_campaign, utm_term: lead.utm_term, gclid: lead.gclid, landing_host: lead.landing_host, receivedAt: lead.receivedAt, no_official_email: noOfficialEmail, email_domain_matches_website: matches, no_website: d.noWebsite, priority };

  // Owner alert, visitor email and chat alert run together; a failure in one never blocks the others or the response.
  const owners = ownerRecipients();
  const [visitor] = await Promise.allSettled([
    // Free or personal addresses never receive the emailed report (see the official-email rule).
    noOfficialEmail ? Promise.resolve('skipped' as const) : sendMail({ to: d.email, mail: renderVisitor(ctx), replyTo: owners[0], headers: { 'List-Unsubscribe': `<${ctx.unsubUrl}>` }, kind: 'visitor' }),
    owners.length ? sendMail({ to: owners, mail: renderOwner(ownerLead, ctx), replyTo: d.email, kind: 'owner' }) : Promise.resolve('skipped' as const),
  ]);
  // CRM record + WhatsApp / SMS / chat alerts (type 1: someone scanned and gave details to see the result).
  const enq = await createEnquiry({ type: 'scan', name: d.name, phone: d.phone, email: d.email, company: lead.company, website: lead.domain || lead.website, scanId: id, score: rep.headline, band: rep.band, priority, exposureCr: dp.exposure.maxCr, gaps: dp.exposure.gaps, topic: '', message: '', preferredTime: '', source: sourceLabel(originFromTags(d.tags), lead.lead_source || 'scan'), origin: originFromTags(d.tags), utm: [lead.utm_source, lead.utm_medium, lead.utm_campaign].filter(Boolean).join(' / ') }).catch(() => null);
  if (enq) await alertEnquiry(enq, { skipOwnerMail: true }).catch(() => null);
  const emailed = visitor.status === 'fulfilled' && (visitor.value === 'sent' || visitor.value === 'outbox');
  return NextResponse.json({ id, emailed, gated: noOfficialEmail, stored });
}

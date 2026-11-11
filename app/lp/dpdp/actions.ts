'use server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { CONSENT_TEXT, saveLead, sendToVisitor } from '@/lib/leads';
import { emailDomain, emailProblem, parseWebsite, phoneProblem, sameCompany } from '@/lib/lead-rules';
import { checkToken, otpEnabled } from '@/lib/ps/otp';

export interface LpState { ok: boolean; message?: string; errors?: Record<string, string>; values?: Record<string, string> }

const schema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(120),
  email: z.string().trim().toLowerCase().max(200),
  website: z.string().trim().max(300),
  phone: z.string().trim().max(30).optional().default(''),
  consent: z.literal('on', { message: 'Please tick the consent box' }),
  website_confirm: z.string().max(0).optional(), // honeypot
  utm_source: z.string().max(100).optional().default(''), utm_medium: z.string().max(100).optional().default(''),
  utm_campaign: z.string().max(150).optional().default(''), utm_term: z.string().max(150).optional().default(''),
  utm_content: z.string().max(150).optional().default(''), gclid: z.string().max(200).optional().default(''), ref: z.string().max(300).optional().default(''),
});

const hits = new Map<string, number[]>();
const limited = (ip: string) => {
  const now = Date.now();
  const r = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  r.push(now); hits.set(ip, r);
  return r.length > 6;
};

export async function submitDpdpLead(_prev: LpState, form: FormData): Promise<LpState> {
  const ip = ((await headers()).get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) return { ok: false, message: 'Too many requests. Please try again in a few minutes.' };
  const values: Record<string, string> = {};
  for (const k of ['name', 'email', 'website', 'phone']) values[k] = String(form.get(k) ?? '');

  const parsed = schema.safeParse(Object.fromEntries(form));
  const errors: Record<string, string> = {};
  if (!parsed.success) for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
  if (errors.website_confirm) return { ok: true }; // bot: pretend success
  const email = (parsed.success ? parsed.data.email : values.email).trim().toLowerCase();
  const site = parseWebsite(values.website);
  const ep = emailProblem(email);
  if (ep) errors.email = ep;
  const pp = phoneProblem(values.phone);
  if (pp) errors.phone = pp;
  if (!pp && otpEnabled() && !checkToken(String(form.get('otpToken') ?? ''), values.phone)) errors.phone = 'Please verify your mobile number with the WhatsApp code';
  if (!values.website.trim()) errors.website = 'Please enter your company website';
  else if (!site) errors.website = 'Please enter a valid website, for example yourcompany.com';
  if (Object.keys(errors).length || !parsed.success || !site) return { ok: false, errors, values };

  const d = parsed.data;
  const match = sameCompany(emailDomain(email), site.domain);
  const message = [
    'DPDP LANDING PAGE LEAD (ad campaign)',
    `Website: ${site.url}`, `Domain: ${site.domain}`, `Email domain matches website: ${match ? 'yes' : 'NO, check before calling'}`,
    `Phone: ${d.phone}`, '',
    `Source: ${d.utm_source || '-'} / ${d.utm_medium || '-'} / ${d.utm_campaign || '-'}`,
    `Term: ${d.utm_term || '-'}  Content: ${d.utm_content || '-'}`, `GCLID: ${d.gclid || '-'}`, `Referrer: ${d.ref || '-'}`,
  ].join('\n');

  const stored = await saveLead({
    name: d.name, email, organisation: site.domain, interest: 'DPDP readiness (ad lead)', message,
    receivedAt: new Date().toISOString(), consentText: CONSENT_TEXT, ip,
  });
  if (!stored) return { ok: false, message: 'We could not record your request right now. Please try again in a moment.', values };
  void sendToVisitor(email, 'We received your DPDP readiness request', `Hi ${d.name.split(' ')[0]},\n\nThanks for asking for a DPDP readiness review of ${site.domain}. A Bedre consultant will reply within one working day with a few questions and a time to talk.\n\nBedre Web Technologies\n`);
  return { ok: true };
}

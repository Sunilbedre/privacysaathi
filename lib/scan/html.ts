import type { FormInfo } from './types';

/** Light HTML helpers (regex based; we only read structure, never store bodies). */
export const clean = (s: string, max = 120) => s.replace(/[\u0000-\u001f<>"'`]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

export function extractLinks(html: string, base: string): string[] {
  const out = new Set<string>();
  for (const m of html.matchAll(/<a\s[^>]*href\s*=\s*["']([^"'#]+)["']/gi)) {
    try { const u = new URL(m[1], base); if (/^https?:$/.test(u.protocol)) { u.hash = ''; out.add(u.toString()); } } catch { /* skip */ }
  }
  return [...out];
}
export function anchorsWithText(html: string): { href: string; text: string }[] {
  return [...html.matchAll(/<a\s[^>]*href\s*=\s*["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)].map((m) => ({ href: m[1], text: m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase() }));
}
/** A script a consent tool holds back until the visitor agrees (inert type, or a consent-category marker). */
const GATED = /type\s*=\s*["'](text\/plain|text\/blocked|javascript\/blocked)["']|data-cookieconsent|data-cookie-?category|data-category\s*=|data-consent/i;
export function extractScripts(html: string, base: string): { src: string; sri: boolean; gated: boolean }[] {
  const out: { src: string; sri: boolean; gated: boolean }[] = [];
  for (const m of html.matchAll(/<script\b([^>]*)>/gi)) {
    const src = m[1].match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!src) continue;
    try { out.push({ src: new URL(src, base).toString(), sri: /\bintegrity\s*=/i.test(m[1]), gated: GATED.test(m[1]) }); } catch { /* skip */ }
  }
  return out;
}
export function metaContent(html: string, name: string): string | null {
  for (const m of html.matchAll(/<meta\b([^>]*)>/gi)) {
    if (new RegExp(`name\\s*=\\s*["']${name}["']`, 'i').test(m[1])) return m[1].match(/content\s*=\s*["']([^"']*)["']/i)?.[1] ?? null;
  }
  return null;
}
export function extractMixed(html: string): number {
  return [...html.matchAll(/\b(?:src|href|action)\s*=\s*["']http:\/\/[^"']+["']/gi)].filter((m) => !/<a\s/i.test(m[0])).length;
}

const PERSONAL: [string, RegExp][] = [
  ['email', /e-?mail/i], ['phone', /phone|mobile|tel\b|whatsapp/i], ['name', /(^|[^a-z])(full|first|last)?[_ -]?name\b/i],
  ['address', /address|pincode|zip|postal|city/i], ['id number', /aadhaar|aadhar|pan\b|passport|\bid[_ -]?(no|number)/i], ['date of birth', /dob|birth/i],
];
export function extractForms(html: string, page: string): FormInfo[] {
  const forms: FormInfo[] = [];
  for (const m of html.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi)) {
    const attrs = m[1], inner = m[2];
    const fields: string[] = [];
    for (const i of inner.matchAll(/<(input|textarea|select)\b([^>]*)>/gi)) {
      const type = i[2].match(/type\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase() ?? (i[1].toLowerCase() === 'input' ? 'text' : i[1].toLowerCase());
      if (['hidden', 'submit', 'button', 'checkbox', 'radio'].includes(type)) continue;
      const nm = i[2].match(/(?:name|id|placeholder|aria-label)\s*=\s*["']([^"']+)["']/i)?.[1] ?? type;
      fields.push(`${type}:${clean(nm, 30)}`);
    }
    if (!fields.length) continue;
    const joined = fields.join(' ');
    const personal = PERSONAL.filter(([, re]) => re.test(joined)).map(([n]) => n);
    const hasType = (t: string) => fields.some((f) => f.startsWith(t + ':'));
    if (hasType('email') && !personal.includes('email')) personal.push('email');
    if (hasType('tel') && !personal.includes('phone')) personal.push('phone');
    if (!personal.length) continue;
    const ctx = m[0].toLowerCase();
    const consentNearby = (/type\s*=\s*["']checkbox["']/i.test(inner) && /consent|agree|accept|privacy|terms/i.test(ctx)) || /privacy (policy|notice)|by (submitting|continuing)/i.test(ctx);
    const action = attrs.match(/action\s*=\s*["']([^"']*)["']/i)?.[1] ?? '';
    let httpsPost = page.startsWith('https:');
    try { httpsPost = new URL(action || page, page).protocol === 'https:'; } catch { /* keep */ }
    forms.push({ page, fields: fields.slice(0, 12), personal: [...new Set(personal)], consentNearby, httpsPost, method: (attrs.match(/method\s*=\s*["']([^"']+)["']/i)?.[1] ?? 'get').toLowerCase() });
  }
  return forms;
}

export const TRACKERS: [string, RegExp][] = [
  ['Google Analytics', /googletagmanager\.com\/gtag|google-analytics\.com|\/analytics\.js/i], ['Google Tag Manager', /googletagmanager\.com\/gtm\.js/i],
  ['Meta Pixel', /connect\.facebook\.net|fbevents\.js/i], ['LinkedIn Insight', /snap\.licdn\.com|linkedin\.com\/px/i], ['Hotjar', /hotjar\.com/i],
  ['Microsoft Clarity', /clarity\.ms/i], ['Google Ads', /googleadservices\.com|googlesyndication\.com|doubleclick\.net/i], ['TikTok Pixel', /analytics\.tiktok\.com/i],
  ['Twitter/X Pixel', /static\.ads-twitter\.com/i], ['Chat widget', /tawk\.to|intercom\.io|crisp\.chat|drift\.com|livechatinc\.com|zopim|tidio|freshchat|wati\.io/i],
];
export const CONSENT_BANNER = /cookiebot|onetrust|cookieyes|cookie-?consent|cookie-?law|osano|iubenda|termly|complianz|cmplz|cc-window|cookie[-_ ]?banner|accept (all )?cookies/i;

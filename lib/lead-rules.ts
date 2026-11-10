/** Rules for ad-lead forms: official (non-free) email and a real website. Client-safe: no server imports. */
const FREE = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.in', 'yahoo.co.in', 'ymail.com', 'rocketmail.com', 'outlook.com', 'hotmail.com', 'hotmail.co.uk', 'live.com', 'msn.com',
  'icloud.com', 'me.com', 'mac.com', 'aol.com', 'proton.me', 'protonmail.com', 'pm.me', 'gmx.com', 'gmx.net', 'mail.com', 'rediffmail.com', 'zohomail.com', 'zohomail.in',
  'yandex.com', 'yandex.ru', 'inbox.com', 'fastmail.com', 'tutanota.com', 'hey.com', 'qq.com', '163.com', '126.com',
]);
const DISPOSABLE = new Set(['mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com', 'temp-mail.org', 'yopmail.com', 'trashmail.com', 'sharklasers.com', 'getnada.com', 'dispostable.com', 'maildrop.cc', 'throwawaymail.com']);

export const emailDomain = (email: string) => email.trim().toLowerCase().split('@')[1] ?? '';

export function emailProblem(email: string): string | null {
  const d = emailDomain(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return 'Please enter a valid email';
  if (FREE.has(d)) return 'Please use your official company email (not Gmail, Yahoo or similar)';
  if (DISPOSABLE.has(d)) return 'Please use your official company email';
  return null;
}

/** Turns "acme.com", "www.acme.com/page" or "https://acme.com" into { url, domain }, or null when it is not a real website. */
export function parseWebsite(input: string): { url: string; domain: string } | null {
  const raw = input.trim();
  if (!raw || /\s/.test(raw)) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    const host = u.hostname.toLowerCase().replace(/^www\./, '');
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) || /^\d+(\.\d+){3}$/.test(host) || host === 'localhost') return null;
    return { url: `${u.protocol}//${u.hostname}`, domain: host };
  } catch { return null; }
}

/** Compares registrable-ish domains: acme.com matches mail.acme.com. Good enough as a hint for the sales team. */
export function sameCompany(emailDom: string, siteDom: string): boolean {
  const strip = (d: string) => d.split('.').slice(-3).join('.');
  const a = emailDom.toLowerCase(), b = siteDom.toLowerCase();
  return a === b || a.endsWith('.' + b) || b.endsWith('.' + a) || strip(a).endsWith(b.split('.').slice(-2).join('.')) && b.split('.').slice(-2).join('.') === a.split('.').slice(-2).join('.');
}

/** Phone numbers: 8 to 15 digits, with an optional leading + and common separators. */
export function phoneProblem(phone: string): string | null {
  const p = phone.trim();
  if (!p) return 'Please enter your phone number';
  if (!/^\+?[\d\s().-]+$/.test(p)) return 'Please enter a valid phone number, for example +91 98765 43210';
  const digits = p.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) return 'Please enter a valid phone number, for example +91 98765 43210';
  return null;
}

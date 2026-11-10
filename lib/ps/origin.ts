/**
 * Where a visitor came from. Collected silently by the browser (never asked in a form) and saved with the scan and the enquiry,
 * so the CRM can show the landing page, the referring site, the campaign and the device.
 */
export interface Origin {
  landingUrl?: string; referrer?: string; formPage?: string; device?: string; lang?: string; host?: string;
  utm_source?: string; utm_medium?: string; utm_campaign?: string; utm_term?: string; utm_content?: string; gclid?: string; fbclid?: string;
}

const KEYS: (keyof Origin)[] = ['landingUrl', 'referrer', 'formPage', 'device', 'lang', 'host', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];
const clean = (v: unknown, n = 300) => String(v ?? '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, n);

/** Turns the browser's tag bag into a tidy Origin (only known fields, trimmed). */
export function originFromTags(t: Record<string, string> | undefined | null): Origin {
  const x = t ?? {}; const o: Origin = {};
  const src: Record<keyof Origin, string | undefined> = {
    landingUrl: x.landing_url, referrer: x.ref, formPage: x.form_page, device: x.device, lang: x.lang, host: x.landing_host,
    utm_source: x.utm_source, utm_medium: x.utm_medium, utm_campaign: x.utm_campaign, utm_term: x.utm_term, utm_content: x.utm_content, gclid: x.gclid, fbclid: x.fbclid,
  };
  for (const k of KEYS) { const v = clean(src[k]); if (v) o[k] = v; }
  return o;
}

const hostOf = (u?: string) => { try { return new URL(u ?? '').host.replace(/^www\./, '').toLowerCase(); } catch { return ''; } };
export const referrerHost = (o?: Origin) => { const h = hostOf(o?.referrer); const own = (o?.host ?? '').replace(/^www\./, '').toLowerCase(); return h && h !== own ? h : ''; };

/** One readable label: "Google Ads", "Google (search)", "LinkedIn", "Direct" and so on. */
export function sourceLabel(o?: Origin | null, fallback = ''): string {
  if (!o || !Object.keys(o).length) return fallback || 'Not recorded';
  const s = (o.utm_source ?? '').toLowerCase(), m = (o.utm_medium ?? '').toLowerCase();
  if (o.gclid || /google/.test(s) && /cpc|ppc|paid/.test(m)) return 'Google Ads';
  if (o.fbclid || /(facebook|meta|instagram|fb|ig)/.test(s)) return /cpc|paid|ppc/.test(m) || o.fbclid ? 'Meta Ads' : 'Facebook / Instagram';
  if (s) return /cpc|ppc|paid/.test(m) ? `${o.utm_source} (paid)` : String(o.utm_source);
  const h = referrerHost(o);
  if (!h) return 'Direct';
  if (/(^|\.)google\./.test(h)) return 'Google (search)';
  if (/bing\.com$/.test(h)) return 'Bing (search)';
  if (/duckduckgo\.com$/.test(h)) return 'DuckDuckGo (search)';
  if (/linkedin\.com$|lnkd\.in$/.test(h)) return 'LinkedIn';
  if (/(facebook|instagram)\.com$/.test(h)) return 'Facebook / Instagram';
  if (/(^|\.)(x|twitter)\.com$|^t\.co$/.test(h)) return 'X (Twitter)';
  if (/whatsapp\.com$|wa\.me$/.test(h)) return 'WhatsApp';
  if (/youtube\.com$/.test(h)) return 'YouTube';
  return h;
}

/** The landing page as "path (host)" for compact display. */
export function landingPath(o?: Origin | null): string { try { const u = new URL(o?.landingUrl ?? ''); return u.pathname + (u.search ? '?…' : ''); } catch { return ''; } }

/** Privacy Saathi host config. Safe for proxy, server and client (no server-only imports). */
const list = (v: string | undefined, d: string[]) => (v ? v.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean) : d);
export const PS_PRIMARY = (process.env.NEXT_PUBLIC_PS_PRIMARY_HOST || process.env.PS_PRIMARY_HOST || 'privacysaathi.in').toLowerCase();
export const PS_ALIASES = list(process.env.PS_ALIAS_HOSTS, ['privacysathi.in', 'privacysaathi.com', 'privacysathi.com']);
export const PS_SITE = `https://${PS_PRIMARY}`;
export const stripHost = (h: string | null | undefined) => (h ?? '').toLowerCase().replace(/:\d+$/, '').replace(/^www\./, '');
export const isPsPrimary = (h: string | null | undefined) => stripHost(h) === PS_PRIMARY;
export const isPsAlias = (h: string | null | undefined) => PS_ALIASES.includes(stripHost(h));
/** Adds utm_source from a host map (source_by_host), e.g. PS_SOURCE_BY_HOST="privacysaathi.in=google,privacysathi.in=meta". */
export function sourceForHost(h: string | null | undefined): string | null {
  const m = Object.fromEntries((process.env.PS_SOURCE_BY_HOST ?? '').split(',').map((p) => p.split('=').map((s) => s.trim().toLowerCase())).filter((p) => p.length === 2));
  return m[stripHost(h)] ?? null;
}

export const PS_CONSENT = 'I agree that Bedre Web Technologies may contact me about this assessment and store my details and scan summary for up to 90 days. I confirm I am authorised to assess the website I entered.';

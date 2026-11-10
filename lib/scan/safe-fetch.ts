import dns from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';
import { assertScannableUrl, isBlockedIp, ScanBlocked } from './ssrf';

export const SCAN_UA = 'PrivacySaathiScanner/1.0 (+https://privacysaathi.in/scanner; read-only compliance check)';

export interface FetchResult {
  url: string;            // final URL after redirects
  status: number;
  headers: Record<string, string | string[] | undefined>;
  body: string;           // truncated to maxBytes; callers must not store or echo it
  truncated: boolean;
  redirects: string[];    // every hop URL
  ip: string;             // validated IP actually connected to
  tls?: { protocol?: string; validTo?: string; authorized: boolean; error?: string };
}

export interface FetchOpts {
  method?: 'GET' | 'HEAD';
  maxBytes?: number;
  timeoutMs?: number;
  maxRedirects?: number;
  /** Do not follow redirects (used for the http to https check). */
  noRedirect?: boolean;
  /** Read no body (status and headers only), used for sensitive-path probes. */
  noBody?: boolean;
  /** Test hook. */
  resolver?: (host: string) => Promise<string[]>;
}

export async function resolvePublic(host: string, resolver?: FetchOpts['resolver']): Promise<string> {
  const ips = resolver
    ? await resolver(host)
    : (await dns.lookup(host, { all: true, verbatim: true }).catch(() => { throw new ScanBlocked('We could not find that website (DNS lookup failed)'); })).map((a) => a.address);
  if (!ips.length) throw new ScanBlocked('We could not find that website (DNS lookup failed)');
  // Every returned address must be public; one private answer poisons the host (rebinding defence).
  if (ips.some(isBlockedIp)) throw new ScanBlocked('That address points to a private or internal network');
  return ips[0];
}

function once(u: URL, ip: string, o: Required<Pick<FetchOpts, 'maxBytes' | 'timeoutMs'>> & FetchOpts): Promise<Omit<FetchResult, 'redirects'>> {
  return new Promise((resolve, reject) => {
    const isHttps = u.protocol === 'https:';
    const lib = isHttps ? https : http;
    const family = ip.includes(':') ? 6 : 4;
    const req = lib.request(
      {
        host: u.hostname, port: u.port || (isHttps ? 443 : 80), path: u.pathname + u.search, method: o.method ?? 'GET',
        servername: isHttps ? u.hostname : undefined,
        // Connect to the IP we validated; never let the OS resolve again.
        lookup: (_h: string, lo: { all?: boolean }, cb: (e: Error | null, a: unknown, f?: number) => void) =>
          (lo && lo.all ? cb(null, [{ address: ip, family }]) : cb(null, ip, family)),
        headers: { 'User-Agent': SCAN_UA, Accept: 'text/html,application/xhtml+xml,*/*;q=0.5', 'Accept-Encoding': 'identity' },
        rejectUnauthorized: false, // we record certificate problems as findings instead of failing
        timeout: o.timeoutMs,
      } as https.RequestOptions,
      (res) => {
        const chunks: Buffer[] = [];
        let size = 0, truncated = false;
        const sock = res.socket as import('node:tls').TLSSocket;
        const cert = isHttps && sock.getPeerCertificate ? sock.getPeerCertificate() : undefined;
        const tls = isHttps ? { protocol: sock.getProtocol?.() ?? undefined, validTo: cert?.valid_to, authorized: !!sock.authorized, error: sock.authorizationError ? String(sock.authorizationError) : undefined } : undefined;
        const done = () => resolve({ url: u.toString(), status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks).toString('utf8'), truncated, ip, tls });
        if (o.noBody || o.method === 'HEAD') { res.destroy(); done(); return; }
        res.on('data', (c: Buffer) => {
          size += c.length;
          if (size > o.maxBytes) { truncated = true; chunks.push(c.subarray(0, c.length - (size - o.maxBytes))); res.destroy(); done(); return; }
          chunks.push(c);
        });
        res.on('end', done);
        res.on('error', () => done());
      },
    );
    req.on('timeout', () => { req.destroy(new ScanBlocked('The website took too long to respond')); });
    req.on('error', (e) => reject(e instanceof ScanBlocked ? e : new ScanBlocked(`Could not connect (${(e as NodeJS.ErrnoException).code ?? 'network error'})`)));
    req.end();
  });
}

/** The only function the scanner uses to touch the network for web pages. Validates DNS on every hop. */
export async function safeFetch(input: string, opts: FetchOpts = {}): Promise<FetchResult> {
  const o = { maxBytes: 2 * 1024 * 1024, timeoutMs: 10_000, maxRedirects: 5, ...opts };
  let u = assertScannableUrl(input);
  const hops: string[] = [];
  for (let i = 0; i <= o.maxRedirects; i++) {
    const ip = await resolvePublic(u.hostname, o.resolver);
    const r = await once(u, ip, o);
    const loc = r.headers.location;
    if (!o.noRedirect && r.status >= 300 && r.status < 400 && typeof loc === 'string') {
      if (i === o.maxRedirects) throw new ScanBlocked('Too many redirects');
      u = assertScannableUrl(new URL(loc, u)); // re-validated: scheme, port, host, blocklist
      hops.push(u.toString());
      continue;
    }
    return { ...r, redirects: hops };
  }
  throw new ScanBlocked('Too many redirects');
}

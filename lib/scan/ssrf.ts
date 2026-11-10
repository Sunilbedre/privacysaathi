import net from 'node:net';

/** SSRF guard: pure helpers, no network. Used by safe-fetch before every request and redirect hop. */

export class ScanBlocked extends Error {
  constructor(public reason: string) { super(reason); this.name = 'ScanBlocked'; }
}

/** Own hosts the public scanner must never touch. Extend with PS_BLOCKED_HOSTS (comma separated). */
function blockedHosts(): string[] {
  const env = (process.env.PS_BLOCKED_HOSTS ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  const own = [process.env.PS_PRIMARY_HOST, ...(process.env.PS_ALIAS_HOSTS ?? '').split(','), 'bedreweb.com']
    .map((s) => (s ?? '').trim().toLowerCase()).filter(Boolean);
  return [...env, ...own];
}

function v4ToInt(ip: string): number {
  return ip.split('.').reduce((n, p) => (n << 8) + Number(p), 0) >>> 0;
}
const V4_BLOCKS: [string, number][] = [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12],
  ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.88.99.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24],
  ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
];
function v4Private(ip: string): boolean {
  const n = v4ToInt(ip);
  return V4_BLOCKS.some(([base, bits]) => {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (n & mask) >>> 0 === (v4ToInt(base) & mask) >>> 0;
  });
}

/** Expands an IPv6 string into eight 16-bit groups. */
function v6Groups(ip: string): number[] | null {
  let s = ip.toLowerCase().split('%')[0];
  // embedded IPv4 tail (::ffff:1.2.3.4)
  const m = s.match(/^(.*:)(\d+\.\d+\.\d+\.\d+)$/);
  if (m) {
    const n = v4ToInt(m[2]);
    s = `${m[1]}${((n >>> 16) & 0xffff).toString(16)}:${(n & 0xffff).toString(16)}`;
  }
  const halves = s.split('::');
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const fill = halves.length === 2 ? 8 - head.length - tail.length : 0;
  if (fill < 0 || (halves.length === 1 && head.length !== 8)) return null;
  const all = [...head, ...Array(fill).fill('0'), ...tail].map((h) => parseInt(h, 16));
  return all.length === 8 && all.every((x) => Number.isInteger(x) && x >= 0 && x <= 0xffff) ? all : null;
}

/** True when the address is not a normal public internet address (or cannot be parsed: fail closed). */
export function isBlockedIp(ip: string): boolean {
  const kind = net.isIP(ip);
  if (kind === 4) return v4Private(ip);
  if (kind === 6) {
    const g = v6Groups(ip);
    if (!g) return true;
    if (g.every((x) => x === 0)) return true; // ::
    if (g.slice(0, 7).every((x) => x === 0) && g[7] === 1) return true; // ::1
    // IPv4-mapped (::ffff:a.b.c.d), IPv4-compatible and NAT64 (64:ff9b::/96): judge the embedded v4
    const embedded = `${g[6] >> 8}.${g[6] & 255}.${g[7] >> 8}.${g[7] & 255}`;
    if (g.slice(0, 5).every((x) => x === 0) && (g[5] === 0xffff || g[5] === 0)) return v4Private(embedded);
    if (g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0)) return v4Private(embedded);
    if ((g[0] & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
    if ((g[0] & 0xffc0) === 0xfe80) return true; // fe80::/10 link local
    if ((g[0] & 0xffc0) === 0xfec0) return true; // fec0::/10 site local
    if ((g[0] & 0xff00) === 0xff00) return true; // multicast
    if (g[0] === 0x2001 && g[1] === 0x0db8) return true; // documentation
    if (g[0] === 0x2002) return v4Private(`${g[1] >> 8}.${g[1] & 255}.${g[2] >> 8}.${g[2] & 255}`); // 6to4
    return false;
  }
  return true;
}

/** Validates a user-supplied or redirect URL. Throws ScanBlocked with a plain reason. */
export function assertScannableUrl(input: string | URL): URL {
  let u: URL;
  try { u = typeof input === 'string' ? new URL(input) : input; } catch { throw new ScanBlocked('That is not a valid web address'); }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new ScanBlocked('Only http and https addresses can be checked');
  if (u.username || u.password) throw new ScanBlocked('Addresses with a username or password are not allowed');
  const port = u.port;
  if (port && port !== '80' && port !== '443') throw new ScanBlocked('Only the standard web ports (80 and 443) can be checked');
  const host = u.hostname.toLowerCase().replace(/\.$/, '');
  if (!host) throw new ScanBlocked('That is not a valid web address');
  if (host.startsWith('[') || net.isIP(host) || /^[\d.]+$/.test(host) || /^0x[0-9a-f]+$/i.test(host)) throw new ScanBlocked('Please enter a website name, not an IP address');
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host)) throw new ScanBlocked('Use a normal website name (letters, numbers and hyphens). International names must be in punycode');
  if (host === 'localhost' || /\.(localhost|local|internal|lan|home|corp|test|invalid|example)$/.test(host)) throw new ScanBlocked('That address is not a public website');
  if (blockedHosts().some((b) => host === b || host.endsWith('.' + b))) throw new ScanBlocked('This site cannot be scanned here');
  return u;
}

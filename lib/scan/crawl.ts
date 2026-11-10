import { safeFetch, type FetchResult } from './safe-fetch';
import { extractLinks } from './html';

export interface Page { url: string; res: FetchResult }
export interface Robots { disallow: string[]; sitemaps: string[]; found: boolean }

export function parseRobots(txt: string): Robots {
  const disallow: string[] = [], sitemaps: string[] = [];
  let applies = false;
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === 'user-agent') applies = v === '*' || /privacysaathi/i.test(v);
    else if (k === 'disallow' && applies && v) disallow.push(v);
    else if (k === 'sitemap') sitemaps.push(v);
  }
  return { disallow, sitemaps, found: true };
}
export function allowed(r: Robots, path: string): boolean {
  return !r.disallow.some((d) => {
    const re = new RegExp('^' + d.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'));
    return re.test(path);
  });
}

const sameSite = (a: string, b: string) => new URL(a).hostname.replace(/^www\./, '') === new URL(b).hostname.replace(/^www\./, '');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const SKIP_EXT = /\.(jpe?g|png|gif|webp|svg|ico|pdf|zip|mp4|mp3|css|js|woff2?|ttf|xml|docx?|xlsx?)(\?|$)/i;

export interface CrawlOpts { maxPages: number; maxDepth: number; deadline: number; useSitemap: boolean; onPage?: (n: number, url: string) => void }

export async function crawl(home: Page, robots: Robots, opts: CrawlOpts): Promise<Page[]> {
  const pages: Page[] = [home];
  const seen = new Set<string>([home.res.url]);
  let queue: { url: string; depth: number }[] = [];
  const add = (links: string[], depth: number) => {
    for (const l of links) {
      if (seen.has(l) || SKIP_EXT.test(l)) continue;
      try { if (!sameSite(l, home.res.url) || !allowed(robots, new URL(l).pathname)) continue; } catch { continue; }
      seen.add(l); queue.push({ url: l, depth });
    }
  };
  add(extractLinks(home.res.body, home.res.url), 1);
  if (opts.useSitemap) {
    for (const sm of robots.sitemaps.slice(0, 1).concat(new URL('/sitemap.xml', home.res.url).toString()).slice(0, 2)) {
      try {
        const r = await safeFetch(sm, { maxBytes: 500_000, timeoutMs: 8000 });
        if (r.status === 200) add([...r.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]).filter((u) => !/\.xml$/i.test(u)).slice(0, 40), 1);
      } catch { /* sitemap optional */ }
    }
  }
  while (queue.length && pages.length < opts.maxPages && Date.now() < opts.deadline) {
    const batch = queue.splice(0, 3).slice(0, opts.maxPages - pages.length);
    const got = await Promise.all(batch.map(async (b) => {
      try {
        const res = await safeFetch(b.url, { timeoutMs: 10_000 });
        if (res.status >= 400 || !/html/i.test(String(res.headers['content-type'] ?? ''))) return null;
        return { page: { url: res.url, res } as Page, depth: b.depth };
      } catch { return null; }
    }));
    for (const g of got) {
      if (!g) continue;
      pages.push(g.page);
      opts.onPage?.(pages.length, g.page.url);
      if (g.depth < opts.maxDepth) add(extractLinks(g.page.res.body, g.page.res.url), g.depth + 1);
    }
    await sleep(250); // polite delay
  }
  return pages;
}

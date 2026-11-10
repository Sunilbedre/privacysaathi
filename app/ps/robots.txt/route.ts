import { PS_SITE } from '@/lib/ps/config';
export function GET() {
  return new Response(`User-agent: *\nAllow: /\nDisallow: /report/\nDisallow: /scan\nDisallow: /api/\nDisallow: /lp/\nDisallow: /thanks\n\nSitemap: ${PS_SITE}/sitemap.xml\n`, { headers: { 'content-type': 'text/plain' } });
}

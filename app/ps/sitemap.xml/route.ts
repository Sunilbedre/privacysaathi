import { PS_SITE } from '@/lib/ps/config';
export function GET() {
  const paths = ['', '/cybersecurity', '/maintenance', '/dpdp', '/resources', '/privacy', '/terms'];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((p) => `<url><loc>${PS_SITE}${p}</loc></url>`).join('')}</urlset>`, { headers: { 'content-type': 'application/xml' } });
}

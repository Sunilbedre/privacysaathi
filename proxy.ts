import { NextResponse, type NextRequest } from 'next/server';
import { isPsAlias, isPsPrimary, PS_PRIMARY, sourceForHost, stripHost } from '@/lib/ps/config';

/** Host routing: alias domains 301 to the primary Privacy Saathi domain; the primary domain is served from /ps. */
export function proxy(req: NextRequest) {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  const { pathname, search } = req.nextUrl;

  // The admin lives at /qwedsa on every host. It is served from the internal /admin folder; /admin itself is hidden.
  if (pathname === '/qwedsa' || pathname.startsWith('/qwedsa/')) {
    const url = req.nextUrl.clone(); url.pathname = '/admin' + pathname.slice('/qwedsa'.length);
    return NextResponse.rewrite(url);
  }
  if (pathname === '/admin' || pathname.startsWith('/admin/')) { const url = req.nextUrl.clone(); url.pathname = '/404'; return NextResponse.rewrite(url, { status: 404 }); }

  if (isPsAlias(host)) {
    // Same path and query, so UTM tags and gclid survive.
    return NextResponse.redirect(`https://${PS_PRIMARY}${pathname}${search}`, 301);
  }
  if (isPsPrimary(host)) {
    // Pages that live outside /ps keep working on this host: API, ad landing pages, Next internals.
    if (pathname.startsWith('/api/') || pathname.startsWith('/lp/') || pathname.startsWith('/_next/')) return NextResponse.next();
    if (pathname === '/ps' || pathname.startsWith('/ps/')) return NextResponse.redirect(`https://${PS_PRIMARY}${pathname.replace(/^\/ps/, '') || '/'}${search}`, 308);
    const url = req.nextUrl.clone();
    url.pathname = `/ps${pathname === '/' ? '' : pathname}`;
    // Tag the source when the visit has none (per-host ad platform split).
    const src = sourceForHost(host);
    if (src && !url.searchParams.has('utm_source')) url.searchParams.set('utm_source', src);
    return NextResponse.rewrite(url);
  }
  // Any other host (bedreweb.com): the Privacy Saathi pages are not served there in production.
  if ((pathname === '/ps' || pathname.startsWith('/ps/')) && process.env.NODE_ENV === 'production' && !['localhost', '127.0.0.1'].includes(stripHost(host))) {
    return NextResponse.redirect(`https://${PS_PRIMARY}${pathname.replace(/^\/ps/, '') || '/'}${search}`, 308);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|woff2?)$).*)'] };

import { domains, services, servicesByDomain, type Domain, type Service } from '@/content';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bedreweb.com';

/** Domains shown in menus (all 12 in the prototype mega menu minus Industries and the Products hub). */
export const serviceDomains = domains.filter((d) => !['ind', 'prod'].includes(d.id));
/** The six shown on the home page, in order. */
export const trendingDomainIds = ['ai', 'cloud', 'sec', 'eng', 'auto', 'growth'] as const;

export const domainHref = (d: Domain | string) => {
  const dom = typeof d === 'string' ? domains.find((x) => x.id === d) : d;
  return `/services/${dom?.slug}`;
};
export const serviceHref = (s: Service) => {
  const dom = domains.find((d) => d.id === s.domain)!;
  return `/services/${dom.slug}/${s.slug}`;
};
export const domainBySlug = (slug: string) => domains.find((d) => d.slug === slug);
export const serviceBySlug = (domainSlug: string, slug: string) => {
  const d = domainBySlug(domainSlug);
  return d ? services.find((s) => s.domain === d.id && s.slug === slug) : undefined;
};
export const domainOf = (s: Service) => domains.find((d) => d.id === s.domain)!;
export { servicesByDomain };

export interface SearchItem { href: string; title: string; kind: string }
export function searchIndex(): SearchItem[] {
  const pages: SearchItem[] = [
    ['/', 'Home'], ['/services', 'All services'], ['/solutions', 'Our solutions'], ['/products', 'Products'],
    ['/industries', 'Industries'], ['/case-studies', 'Case studies'], ['/blog', 'Blog'], ['/partners', 'Partners'],
    ['/about', 'Company'], ['/contact', 'Contact us'], ['/assessment', 'Technology assessment'], ['/advisor', 'AI advisor'],
  ].map(([href, title]) => ({ href, title, kind: 'Page' }));
  return [
    ...pages,
    ...domains.map((d) => ({ href: domainHref(d), title: d.name, kind: 'Domain' })),
    ...services.map((s) => ({ href: serviceHref(s), title: s.name, kind: domainOf(s).name })),
  ];
}

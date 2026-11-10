'use client';
import Link from 'next/link';
import { createContext, useContext, type ComponentProps } from 'react';

/** base is '' on privacysaathi.in and '/ps' when browsing the same pages locally. */
const Ctx = createContext('/ps');
export const PsBase = Ctx.Provider;
export const usePsBase = () => useContext(Ctx);
export function PsLink({ href, ...p }: ComponentProps<typeof Link>) {
  const base = usePsBase();
  const h = typeof href === 'string' && href.startsWith('/') && !href.startsWith('//') ? base + (href === '/' && base ? '' : href) : href;
  return <Link href={h} {...p} />;
}

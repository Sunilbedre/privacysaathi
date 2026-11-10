'use client';
import { useEffect, type RefObject } from 'react';

/** Accessible modal behaviour: Escape closes, Tab stays inside, the page behind does not scroll, focus returns to the opener. */
export function useDialog(open: boolean, onClose: () => void, ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const t = setTimeout(() => ref.current?.querySelector<HTMLElement>('input:not([tabindex="-1"]),button.ps-sm-focus,a[href]')?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
      if (e.key === 'Tab' && ref.current) {
        const els = [...ref.current.querySelectorAll<HTMLElement>('button,input:not([tabindex="-1"]),select,a[href]')].filter((x) => !x.hasAttribute('disabled') && x.offsetParent !== null);
        if (!els.length) return; const a = els[0], z = els[els.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { clearTimeout(t); document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); opener?.focus?.(); };
  }, [open, onClose, ref]);
}

'use client';
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

/** Fades and lifts its children in when scrolled into view. Respects reduced motion. */
export default function Reveal({ children, delay = 0, as: Tag = 'div', className = '', style }: {
  children: ReactNode; delay?: number; as?: 'div' | 'li' | 'section' | 'article'; className?: string; style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const show = () => el.classList.add('in');

    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      show();
      return;
    }

    const visibleNow = () => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight * 0.92 && r.bottom > window.innerHeight * 0.04;
    };

    if (visibleNow()) {
      show();
      return;
    }

    const io = new IntersectionObserver(
      (es) => es.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      }),
      { threshold: 0.08, rootMargin: '0px 0px 4% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const Comp = Tag as 'div';
  return <Comp ref={ref as React.RefObject<HTMLDivElement>} className={'rv ' + className} style={{ ['--d' as string]: `${delay}ms`, ...style }}>{children}</Comp>;
}

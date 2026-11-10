'use client';
import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';

export default function FaqAccordion({ faqs }: { faqs: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="sp-acc">
      {faqs.map((f, i) => {
        const on = open === i;
        return (
          <div key={f.q} className={'sp-acc-item' + (on ? ' on' : '')}>
            <h3>
              <button type="button" aria-expanded={on} aria-controls={`faq-${i}`} id={`faq-h-${i}`} onClick={() => setOpen(on ? null : i)}>
                <span className="sp-acc-n">{String(i + 1).padStart(2, '0')}</span>
                <span className="sp-acc-q">{f.q}</span>
                <span className="sp-acc-i">{on ? <Minus size={18} /> : <Plus size={18} />}</span>
              </button>
            </h3>
            <div className="sp-acc-body" id={`faq-${i}`} role="region" aria-labelledby={`faq-h-${i}`}>
              <div><p>{f.a}</p></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

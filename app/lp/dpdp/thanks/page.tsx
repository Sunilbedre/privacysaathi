import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarCheck, CheckCircle2, ClipboardCheck, FileSearch, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: { absolute: 'Thank you | Bedre Web Technologies' },
  robots: { index: false, follow: false },
};

const NEXT = [
  [Mail, 'Check your inbox', 'If email is on, you will get a confirmation from us shortly.'],
  [FileSearch, 'We review your website', 'A consultant looks at how your site collects and handles personal data.'],
  [CalendarCheck, 'We reply within one working day', 'With a short list of questions and a time for your 30-minute call.'],
] as const;

export default function ThanksPage() {
  const booking = process.env.NEXT_PUBLIC_BOOKING_URL;
  return (
    <div className="lp-root">
      <header className="lp-top"><div className="wrap lp-top-in"><Link href="/" className="lp-logo"><span /><b>Bedre</b></Link></div></header>
      <section className="lp-thanks">
        <div className="wrap">
          <span className="lp-ok"><CheckCircle2 size={40} /></span>
          <h1>Thank you. Your request is in.</h1>
          <p>A Bedre consultant will review your website and reply within one working day.</p>
          <ol className="lp-next">
            {NEXT.map(([Ic, h, p]) => <li key={h}><span><Ic size={22} /></span><b>{h}</b><p>{p}</p></li>)}
          </ol>
          <div className="lp-thanks-btns">
            {booking ? <a className="btn pri lp-big" href={booking} target="_blank" rel="noopener noreferrer"><CalendarCheck size={18} /> Pick a time for your call now</a> : null}
            <Link className="btn lp-big" href="/dpdp"><ClipboardCheck size={18} /> Read the DPDP guide while you wait</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

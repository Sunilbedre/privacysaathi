import type { Metadata } from 'next';
import { CircleCheck } from 'lucide-react';
import { PsLink } from '@/components/ps/PsCtx';

export const metadata: Metadata = { title: 'Thank you', robots: { index: false, follow: false } };
/** Google Ads conversion page for Privacy Saathi: use https://privacysaathi.in/thanks */
export default async function Thanks({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  return (
    <div className="ps-wrap"><div className="ps-center-card">
      <span className="ps-ico"><CircleCheck size={30} aria-hidden /></span>
      <h1>{type === 'email' ? 'We will help you set up official email' : 'Thank you'}</h1>
      <p>{type === 'email' ? 'A Bedre consultant will contact you on the phone number you gave. No website is needed.' : 'We have your details. A Bedre consultant will be in touch about your report.'}</p>
      <p style={{ marginTop: 24 }}><PsLink href="/" className="ps-btn">Back to Privacy Saathi</PsLink></p>
    </div></div>
  );
}

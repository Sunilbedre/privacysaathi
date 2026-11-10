import type { Metadata } from 'next';
import PageHero from '@/components/ps/PageHero';
import { PS_SITE } from '@/lib/ps/config';
export const metadata: Metadata = { title: 'Terms', alternates: { canonical: PS_SITE + '/terms' } };
export default function Terms() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Terms of use" sub="The ground rules for using the scan."><p className="ps-draft">Draft for legal review. Not final.</p></PageHero>
      <div className="ps-legal">
        <ul>
          <li>The scan is read-only. It fetches public pages, looks up DNS and checks TLS. It does not log in, change anything or attack your site.</li>
          <li>You confirm you are authorised to assess the website you enter.</li>
          <li>Results are an automated technical check. They are not legal advice, an audit or a certification, and carry no warranty.</li>
          <li>Bedre Web Technologies is a technology company, not a law firm.</li>
          <li>We may limit or block scans to protect the service and other websites.</li>
        </ul>
      </div>
    </>
  );
}

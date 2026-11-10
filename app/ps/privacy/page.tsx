import type { Metadata } from 'next';
import PageHero from '@/components/ps/PageHero';
import { PS_SITE } from '@/lib/ps/config';
export const metadata: Metadata = { title: 'Privacy notice', alternates: { canonical: PS_SITE + '/privacy' } };
export default function Privacy() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy notice" sub="What Privacy Saathi collects, why, and for how long."><p className="ps-draft">Draft for legal review. Not final.</p></PageHero>
      <div className="ps-legal">
        <p>Privacy Saathi is a service of Bedre Web Technologies Pvt. Ltd., JP Nagar, Bengaluru, India.</p>
        <h2>What we collect</h2>
        <ul><li>Your name, work email, phone number, business name, industry and size, and your answers to the questions.</li><li>Your website address and a summary of findings from a read-only scan of public information. We do not store page content or cookie values.</li><li>Campaign details (such as the ad that brought you here) and a short hashed network identifier for abuse control.</li></ul>
        <h2>Why</h2>
        <p>To run the scan, build your report, contact you about it, and keep the service safe. We contact you only because you asked and agreed.</p>
        <h2>How long</h2>
        <p>Scan results and reports are deleted after 90 days. Contact records are kept while we are in touch with you, or until you ask us to delete them.</p>
        <h2>Your choices</h2>
        <p>Email <a href="mailto:privacy@bedreweb.com" style={{ textDecoration: 'underline' }}>privacy@bedreweb.com</a> to see, correct or delete your data. Analytics runs only if you accept cookies.</p>
      </div>
    </>
  );
}

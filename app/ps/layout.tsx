import type { Metadata } from 'next';
import { Geist, Geist_Mono, Mona_Sans } from 'next/font/google';
import { headers } from 'next/headers';
import { PsBase, PsLink } from '@/components/ps/PsCtx';
import PsTrack from '@/components/ps/PsTrack';
import PsHeader from '@/components/ps/PsHeader';
import PsPopup from '@/components/ps/PsPopup';
import PsDock from '@/components/ps/PsDock';
import { getSetting } from '@/lib/settings';
import Mark from '@/components/ps/Mark';
import { ArrowUpRight } from 'lucide-react';
import { services } from '@/content';
import { serviceHref } from '@/lib/catalog';
import { isPsPrimary, PS_SITE } from '@/lib/ps/config';

const mona = Mona_Sans({ subsets: ['latin'], display: 'swap', variable: '--ps-display' });
const geist = Geist({ subsets: ['latin'], display: 'swap', variable: '--ps-body' });
const geistMono = Geist_Mono({ subsets: ['latin'], display: 'swap', variable: '--ps-mono' });

export const metadata: Metadata = {
  metadataBase: new URL(PS_SITE),
  title: { default: 'Privacy Saathi | Cyber security, privacy and website care', template: '%s | Privacy Saathi' },
  description: 'Cyber security, privacy compliance and managed website care from Bedre Web Technologies. Check your website free, live. Not legal advice.',
  openGraph: { siteName: 'Privacy Saathi', type: 'website' },
};

/** Links to the real Bedre service pages (names match the catalogue exactly). */
const svc = (name: string) => { const x = services.find((v) => v.name === name); return x ? { name, href: `https://bedreweb.com${serviceHref(x)}` } : null; };
const col = (names: string[]) => names.map(svc).filter((x): x is { name: string; href: string } => !!x);
const SECURITY = col(['Security Consulting', 'Vulnerability Assessment', 'Zero Trust & MFA', 'Email Security', 'Cloud & Server Security', 'Application Security']);
const CARE = col(['Managed Cloud Hosting', 'Backup & Disaster Recovery', 'Infrastructure Monitoring']);

export default async function PsLayout({ children }: { children: React.ReactNode }) {
  const onPs = isPsPrimary((await headers()).get('host'));
  const base = onPs ? '' : '/ps';
  return (
    <PsBase value={base}>
      <div className={`ps ${mona.variable} ${geist.variable} ${geistMono.variable}`}>
        <div className="ps-top0"><div className="ps-wrap ps-top0-in"><span>100% free scan · Read-only · Bengaluru, India</span><span>A service of Bedre Web Technologies · <a href="https://bedreweb.com/contact" rel="noopener">Talk to Bedre</a></span></div></div>
        <PsHeader />
        <main id="ps-main" tabIndex={-1}>{children}</main>
        <footer className="ps-foot">
          <div className="ps-wrap">
            <div className="ps-foot-top">
              <div className="ps-foot-brand">
                <PsLink href="/" className="ps-brand" aria-label="Privacy Saathi home"><Mark /><b>Privacy Saathi</b><span>by Bedre</span></PsLink>
                <p>Cyber security, privacy compliance and website care from Bedre Web Technologies. We are a technology company, not a law firm, and not a government service.</p>
                <a className="ps-foot-cta" href="https://bedreweb.com/contact" rel="noopener">Talk to Bedre <ArrowUpRight size={16} aria-hidden /></a>
              </div>
              <nav aria-label="Cyber security"><h4>Cyber security</h4>{SECURITY.map((l) => <a key={l.name} href={l.href} rel="noopener">{l.name}</a>)}<PsLink href="/cybersecurity" className="all">All security services</PsLink></nav>
              <nav aria-label="Website care"><h4>Website care</h4><PsLink href="/maintenance">Plans and what is included</PsLink><PsLink href="/scan">Free security scan</PsLink>{CARE.map((l) => <a key={l.name} href={l.href} rel="noopener">{l.name}</a>)}</nav>
              <nav aria-label="Privacy"><h4>Privacy</h4><PsLink href="/dpdp">DPDP Act readiness</PsLink><PsLink href="/resources">Guides and checklist</PsLink><PsLink href="/privacy">Privacy notice</PsLink><PsLink href="/terms">Terms of use</PsLink></nav>
              <nav aria-label="Company"><h4>Company</h4><a href="https://bedreweb.com/about" rel="noopener">About Bedre</a><a href="https://bedreweb.com/contact" rel="noopener">Contact</a><a href="https://bedreweb.com" rel="noopener">bedreweb.com</a><PsLink href="/sign-in">Client sign in</PsLink></nav>
            </div>
            <ul className="ps-foot-trust" aria-label="How we handle your data">
              <li>Read-only scans</li><li>Findings kept, never page content</li><li>Reports deleted after 90 days</li><li>Technology partner, not a law firm</li>
            </ul>
            <div className="ps-foot-bar">
              <span>&copy; {new Date().getFullYear()} Bedre Web Technologies Pvt. Ltd. &middot; JP Nagar, Bengaluru, India</span>
              <span className="ps-foot-disc">Results are an automated technical check, not legal advice, an audit or a certification.</span>
            </div>
          </div>
          <div className="ps-foot-mark" aria-hidden="true">Privacy Saathi</div>
        </footer>
        <PsTrack />
        <PsPopup />
        <PsDock whatsapp={(getSetting('PS_WHATSAPP_NUMBER') || process.env.NEXT_PUBLIC_WHATSAPP || '').replace(/\D/g, '') || undefined} call={getSetting('PS_CALL_NUMBER') || process.env.NEXT_PUBLIC_CALL_NUMBER || undefined} booking={process.env.NEXT_PUBLIC_BOOKING_URL || 'https://bedreweb.com/contact'} />
      </div>
    </PsBase>
  );
}

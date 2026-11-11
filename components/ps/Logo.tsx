/* eslint-disable @next/next/no-img-element */
/**
 * The Privacy Saathi logo. "full" renders the light-background and the dark-background versions; CSS shows the right one for the theme
 * (the footer and other always-dark areas force the dark one). "mark" is the shield alone.
 */
export default function Logo({ variant = 'full', height = 40, className }: { variant?: 'full' | 'mark'; height?: number; className?: string }) {
  if (variant === 'mark') return <img className={className ?? 'ps-logo-mark'} src="/brand/privacy-saathi-mark-sm.png" alt="" width={height} height={height} decoding="async" />;
  return (
    <>
      <img className="ps-logo ps-logo-l" src="/brand/privacy-saathi-logo-sm.png" srcSet="/brand/privacy-saathi-logo-sm.png 1x, /brand/privacy-saathi-logo.png 3x" alt="Privacy Saathi: security, privacy, compliance" width={Math.round(height * 4.06)} height={height} decoding="async" />
      <img className="ps-logo ps-logo-d" src="/brand/privacy-saathi-logo-dark-sm.png" srcSet="/brand/privacy-saathi-logo-dark-sm.png 1x, /brand/privacy-saathi-logo-dark.png 4x" alt="" aria-hidden="true" width={Math.round(height * 3.9)} height={Math.round(height * 1.26)} decoding="async" />
    </>
  );
}

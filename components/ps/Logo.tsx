/* eslint-disable @next/next/no-img-element */
/** The Privacy Saathi logo. "full" is the wordmark with the shield (for light backgrounds); "mark" is the shield alone (for dark ones). */
export default function Logo({ variant = 'full', height = 40, className }: { variant?: 'full' | 'mark'; height?: number; className?: string }) {
  return variant === 'mark'
    ? <img className={className ?? 'ps-logo-mark'} src="/brand/privacy-saathi-mark-sm.png" alt="" width={height} height={height} decoding="async" />
    : <img className={className ?? 'ps-logo'} src="/brand/privacy-saathi-logo-sm.png" srcSet="/brand/privacy-saathi-logo-sm.png 1x, /brand/privacy-saathi-logo.png 3x" alt="Privacy Saathi: security, privacy, compliance" width={Math.round(height * 4.06)} height={height} decoding="async" />;
}

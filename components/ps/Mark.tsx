export default function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 2 4 7v8c0 7.5 5 13 12 15 7-2 12-7.5 12-15V7L16 2Z" fill="var(--p-ink)" />
      <path d="m10.5 16.5 4 4 7.5-8.5" fill="none" stroke="var(--p-teal)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

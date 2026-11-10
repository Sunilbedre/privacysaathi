export default function PageHero({ eyebrow, title, sub, children }: { eyebrow: string; title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <section className="ps-phero"><div className="ps-wrap">
      <span className="ps-eyebrow ps-eyebrow-on">{eyebrow}</span>
      <h1>{title}</h1>
      {sub && <p>{sub}</p>}
      {children}
    </div></section>
  );
}

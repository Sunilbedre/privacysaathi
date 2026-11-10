import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PsLink } from '@/components/ps/PsCtx';
import { BookBtn, PrintBtn, ReportTrack } from '@/components/ps/ReportActions';
import { getScan } from '@/lib/ps/store';
import { buildReport, confidenceOf, CONFIDENCE_LABEL } from '@/lib/scan/score';
import { crore, summariseDpdp } from '@/lib/ps/dpdp-map';
import { dpdpDeadline, dpdpDuties } from '@/content/dpdp';
import { services } from '@/content';
import { serviceHref } from '@/lib/catalog';
import type { Check, Duty } from '@/lib/scan/types';

export const metadata: Metadata = { title: 'Your readiness report', robots: { index: false, follow: false, nocache: true } };
export const dynamic = 'force-dynamic';

const DUTY_IDX: Record<Duty, number> = { notice: 0, consent: 1, purpose: 2, security: 3, breach: 4, children: 5, rights: 6, logs: 7 };
const FINE: Partial<Record<Duty, string>> = { security: 'up to ₹250 crore', breach: 'up to ₹200 crore', children: 'up to ₹200 crore' };
const LABEL = { pass: 'Pass', warn: 'Needs attention', fail: 'Fix needed', unknown: 'Could not check' } as const;
const AREAS: [Check['area'], string][] = [['dpdp', 'DPDP readiness'], ['security', 'Website security'], ['email', 'Email security']];

const svc = (name?: string) => { const s = name ? services.find((x) => x.name === name) : null; return s ? { name: s.name, href: `https://bedreweb.com${serviceHref(s)}` } : null; };
const Chip = ({ s }: { s: Check['status'] }) => <span className={`ps-chip ${s}`}>{LABEL[s]}</span>;

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rec = await getScan(id);
  if (!rec) notFound();
  const rep = buildReport(rec.result ?? null, rec.answers ?? {});
  const dp = summariseDpdp(rep.checks, { score: rep.headline, band: rep.band, mode: rec.result?.mode ?? 'questions', pages: rec.result?.pagesScanned ?? 0 });
  const ex = dp.exposure;
  const r = rec.result;
  const days = Math.max(0, Math.ceil((Date.parse(dpdpDeadline + 'T00:00:00+05:30') - Date.now()) / 86400000));
  const booking = process.env.NEXT_PUBLIC_BOOKING_URL || 'https://bedreweb.com/contact';
  const scanned = new Date(r?.finishedAt ?? rec.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' });
  const gated = !!rec.noOfficialEmail;
  const emailRisk = gated ? 'Business mail on a free provider cannot be secured or audited.' : null;
  const dutyLine = (c: Check) => (c.duty ? `${dpdpDuties[DUTY_IDX[c.duty]].title}${FINE[c.duty] ? `, fines ${FINE[c.duty]}` : ''}` : null);

  return (
    <article className="ps-rep">
      <ReportTrack sid={id} />
      <div className="ps-noprint" style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}><PsLink href="/" className="ps-link">&larr; Privacy Saathi</PsLink><PrintBtn /></div>
      <h1>{rec.websiteless ? 'Your DPDP readiness report' : `Readiness report for ${rec.domain}`}</h1>
      <p className="ps-note">Automated technical check on {scanned} IST{r ? ` · ${r.pagesScanned} page${r.pagesScanned === 1 ? '' : 's'} read (${r.mode === 'deep' ? 'full scan' : 'home page only'})` : ''}{rec.status === 'error' ? ' · the website scan could not be completed' : ''}</p>

      <section className="ps-head" aria-label="Score">
        <div className="ps-ring" style={{ '--p': rep.headline } as React.CSSProperties} role="img" aria-label={`Score ${rep.headline} out of 100`}><div><span><b>{rep.headline}</b><small>out of 100</small></span></div></div>
        <div>
          <div className="ps-band-t">{rep.band}</div>
          <div className="ps-subs"><span><b>{rep.dpdp ?? 'n/a'}</b>DPDP readiness</span><span><b>{rep.security ?? 'n/a'}</b>Security hygiene</span></div>
          <p className="ps-note" style={{ margin: 0 }}>About <b>{days}</b> days until most DPDP duties apply (around 13 May 2027, to be confirmed by your legal adviser).</p>
          {emailRisk && <p className="ps-chip fail" style={{ marginTop: 10, whiteSpace: 'normal' }}>{emailRisk}</p>}
        </div>
      </section>

      <section className="ps-rx" aria-label="DPDP fine exposure">
        <div className={`ps-rx-fine ${ex.level}`}>
          <small>{ex.level === 'none' ? 'DPDP fine exposure' : ex.level === 'gap' ? 'Maximum DPDP fine exposure' : 'Possible DPDP fine exposure'}</small>
          <b>{ex.level === 'none' ? 'None found' : `Up to ${crore(ex.maxCr)}`}</b>
          <span>{ex.level === 'none' ? 'No gaps in what we could check from outside.' : `Highest tier touched: ${ex.dutyLabel}.`}</span>
        </div>
        <div className="ps-tablewrap"><table className="ps-table"><thead><tr><th>DPDP duty</th><th>Act reference</th><th>Status</th><th>Maximum fine</th></tr></thead>
          <tbody>{dp.duties.map((d) => <tr key={d.id}><td><b>{d.label}</b><br /><span className="ps-note">{d.importance}</span></td><td>{d.ref}</td><td><span className={`ps-chip ${d.status === 'gap' ? 'fail' : d.status === 'review' ? 'warn' : d.status === 'ok' ? 'pass' : 'unknown'}`}>{d.status === 'gap' ? 'Gap found' : d.status === 'review' ? 'Needs review' : d.status === 'ok' ? 'No issues seen' : 'Not assessed'}</span></td><td>{crore(d.fineCr)}</td></tr>)}</tbody></table></div>
        <p className="ps-note">Maximum penalties the Act allows, per published summaries. Actual penalties are decided by the Data Protection Board. Confirm with your legal adviser.</p>
      </section>

      <h2 className="ps-h3x">Your top {Math.min(5, rep.priorities.length) || ''} priorities</h2>
      {rep.priorities.length === 0 ? <p>Nothing urgent stood out in what we could check. Review the full list below.</p> : (
        <ol className="ps-prio">
          {rep.priorities.map((c) => { const s = svc(c.relatedService), dl = dutyLine(c); return (
            <li key={c.id}><b>{c.title}</b><p>{c.whyItMatters} <b style={{ color: 'var(--p-ink)' }}>Fix:</b> {c.fix}</p>
              <div className="ps-meta"><Chip s={c.status} /><span className="ps-chip">Effort: {c.effort}</span>{dl && <span className="ps-chip">{dl}</span>}{s && <a className="ps-chip" href={s.href} target="_blank" rel="noopener">Bedre: {s.name}</a>}</div></li>
          ); })}
        </ol>
      )}

      <h2 className="ps-h3x">All findings</h2>
      {AREAS.map(([area, title]) => { const items = rep.checks.filter((c) => c.area === area); return items.length ? (
        <div className="ps-list" key={area}><h3>{title}</h3>
          {items.map((c) => <details key={c.id}><summary><span>{c.title}</span><Chip s={c.status} /><span className={`ps-conf ${confidenceOf(c)}`}>{CONFIDENCE_LABEL[confidenceOf(c)]}</span></summary><div><p style={{ margin: '0 0 6px' }}><b>What we saw:</b> {c.evidence}</p><p style={{ margin: '0 0 6px' }}><b>Why it matters:</b> {c.whyItMatters}</p><p style={{ margin: 0 }}><b>What to do:</b> {c.fix}</p></div></details>)}
        </div>) : null; })}

      {r && r.trackers.length > 0 && (<><h2 className="ps-h3x">Trackers and cookies</h2>
        <div className="ps-tablewrap"><table className="ps-table"><thead><tr><th>Tracker</th><th>Loaded from</th></tr></thead><tbody>{r.trackers.map((t) => <tr key={t.name}><td>{t.name}</td><td>{t.host}</td></tr>)}</tbody></table></div></>)}
      {r && r.cookies.length > 0 && (<div className="ps-tablewrap" style={{ marginTop: 10 }}><table className="ps-table"><thead><tr><th>Cookie (name only)</th><th>Secure</th><th>HttpOnly</th><th>SameSite</th><th>Lifetime</th></tr></thead><tbody>{r.cookies.map((c) => <tr key={c.name}><td>{c.name}</td><td>{c.secure ? 'Yes' : 'No'}</td><td>{c.httpOnly ? 'Yes' : 'No'}</td><td>{c.sameSite}</td><td>{c.lifetimeDays === null ? 'Session' : `${c.lifetimeDays} days`}</td></tr>)}</tbody></table></div>)}
      {r && r.forms.length > 0 && (<><h2 className="ps-h3x">Forms that collect personal data</h2>
        <div className="ps-tablewrap"><table className="ps-table"><thead><tr><th>Page</th><th>Collects</th><th>Consent shown</th><th>HTTPS</th></tr></thead><tbody>{r.forms.map((f, i) => <tr key={i}><td>{new URL(f.page).pathname}</td><td>{f.personal.join(', ')}</td><td>{f.consentNearby ? 'Yes' : 'No'}</td><td>{f.httpsPost ? 'Yes' : 'No'}</td></tr>)}</tbody></table></div></>)}

      {r && (<><h2 className="ps-h3x">Email security, in plain words</h2>
        <div className="ps-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
          {[['SPF', r.email.spf ? 'Found' : 'Missing', 'Lists who may send email as your company.'], ['DKIM', r.email.dkim.length ? 'Found' : 'Not seen', 'A signature that proves mail was not changed.'], ['DMARC', r.email.dmarcPolicy ? `Policy: ${r.email.dmarcPolicy}` : 'Missing', 'Tells receivers to reject fake mail from your name.'], ['Mail provider', r.email.provider, 'Business suites are easier to secure than shared hosting.']].map(([t, v, b]) => <div className="ps-card" key={t}><h3>{t}: {v}</h3><p>{b}</p></div>)}
        </div></>)}

      <h2 className="ps-h3x">What we could not check</h2>
      <ul>{(r?.notChecked ?? ['Your website (none was scanned)', 'Your internal systems, devices and vendors', 'What your privacy notice actually says']).map((n) => <li key={n}>{n}</li>)}</ul>

      <section className="ps-cta ps-noprint">
        {gated ? (
          <><div><h2>Set up official email first</h2><p>The emailed report and consultant call need a company email address. We can help you set one up, even without a website.</p></div><PsLink className="ps-btn" href="/scan">Help me set up official email</PsLink></>
        ) : (
          <><div><h2>Talk to a Bedre consultant</h2><p>A free 30-minute review of this report. We are a technology partner, not a law firm.</p></div><BookBtn href={booking} /></>
        )}
      </section>
      <p className="ps-note ps-noprint">Re-scanning every month with change alerts is coming with client login. <PsLink href="/maintenance" style={{ textDecoration: 'underline' }}>See maintenance plans</PsLink></p>

      <details className="ps-note" style={{ marginTop: 14 }}><summary>How we score</summary>
        <p>Each check is worth 3 (high), 2 (medium) or 1 (low) points. A pass earns all of them, a warning earns half, a fix-needed earns none. Checks we could not see are left out, so you are never marked down for them. DPDP readiness uses the privacy checks plus your answers. Security hygiene uses website and email checks. The headline score is the average of the two. Bands: under 35 Just starting, 35 to 59 Some foundations, 60 to 79 Well on your way, 80 and above Strong position.</p></details>

      <p className="ps-disc"><b>Please read.</b> This is an automated technical check of public information at the time shown. It is not legal advice, not an audit and not a certification, and it does not say your business is or is not compliant. Bedre Web Technologies Pvt. Ltd. is a technology company, not a law firm. Confirm legal requirements with your own adviser. Your report link is private to you and is deleted after {process.env.PS_RETENTION_DAYS || 90} days.</p>
    </article>
  );
}

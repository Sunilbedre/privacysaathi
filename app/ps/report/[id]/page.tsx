import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowRight, CalendarClock, CircleAlert, CircleCheck, CircleHelp, ShieldAlert, ShieldCheck, TriangleAlert } from 'lucide-react';
import { PsLink } from '@/components/ps/PsCtx';
import { BookBtn, PrintBtn, ReportTrack } from '@/components/ps/ReportActions';
import { getScan } from '@/lib/ps/store';
import { buildReport, confidenceOf, CONFIDENCE_LABEL } from '@/lib/scan/score';
import { crore, summariseDpdp } from '@/lib/ps/dpdp-map';
import { dpdpDeadline, dpdpDuties } from '@/content/dpdp';
import { services } from '@/content';
import { serviceHref } from '@/lib/catalog';
import type { Check, Duty } from '@/lib/scan/types';
import './report.css';

export const metadata: Metadata = { title: 'Your readiness report', robots: { index: false, follow: false, nocache: true } };
export const dynamic = 'force-dynamic';

const DUTY_IDX: Record<Duty, number> = { notice: 0, consent: 1, purpose: 2, security: 3, breach: 4, children: 5, rights: 6, logs: 7 };
const STATUS_LABEL = { pass: 'Pass', warn: 'Needs attention', fail: 'Fix needed', unknown: 'Could not check' } as const;
const DUTY_LABEL = { gap: 'Gap found', review: 'Needs review', ok: 'No issues seen', unknown: 'Not assessed' } as const;
const AREAS: [Check['area'], string, string][] = [['dpdp', 'DPDP readiness', 'Notice, consent and how personal data is collected on your site.'], ['security', 'Website security', 'The technical safeguards visitors never see, but regulators expect.'], ['email', 'Email security', 'Whether someone can send fake mail in your company’s name.']];
const SEV: Record<Check['severity'], string> = { high: 'High impact', medium: 'Medium impact', low: 'Low impact' };

const svc = (name?: string) => { const s = name ? services.find((x) => x.name === name) : null; return s ? { name: s.name, href: `https://bedreweb.com${serviceHref(s)}` } : null; };
const tone = (n: number) => (n < 35 ? 'bad' : n < 60 ? 'warn' : n < 80 ? 'mid' : 'good');
const Icon = ({ s, size = 18 }: { s: Check['status']; size?: number }) => (s === 'pass' ? <CircleCheck size={size} aria-hidden /> : s === 'fail' ? <ShieldAlert size={size} aria-hidden /> : s === 'warn' ? <TriangleAlert size={size} aria-hidden /> : <CircleHelp size={size} aria-hidden />);
const Pill = ({ s }: { s: Check['status'] }) => <span className={`rp-pill ${s}`}>{STATUS_LABEL[s]}</span>;

function Ring({ value, label = 'out of 100' }: { value: number; label?: string }) {
  const r = 54, c = 2 * Math.PI * r;
  return (
    <div className={`rp-ring ${tone(value)}`} role="img" aria-label={`Score ${value} out of 100`}>
      <svg viewBox="0 0 128 128" aria-hidden><circle cx="64" cy="64" r={r} className="t" /><circle cx="64" cy="64" r={r} className="v" strokeDasharray={`${(value / 100) * c} ${c}`} transform="rotate(-90 64 64)" /></svg>
      <div><b>{value}</b><small>{label}</small></div>
    </div>
  );
}

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
  const scanned = new Date(r?.finishedAt ?? rec.createdAt).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Kolkata' });
  const gated = !!rec.noOfficialEmail;
  const subject = rec.websiteless ? rec.company || 'Your business' : rec.domain;
  const issues = rep.checks.filter((c) => c.status === 'fail' || c.status === 'warn');
  const passes = rep.checks.filter((c) => c.status === 'pass').length;
  const summary = ex.level === 'none'
    ? 'We found no gaps in what could be checked from outside. Some duties depend on your internal processes, which a website scan cannot see.'
    : `We found ${dp.counts.gap} DPDP ${dp.counts.gap === 1 ? 'gap' : 'gaps'} and ${dp.counts.review} ${dp.counts.review === 1 ? 'area' : 'areas'} to review. The highest penalty tier touched is ${ex.dutyLabel.toLowerCase()}, with fines of up to ${crore(ex.maxCr)} under the Act.`;
  const dutyLine = (c: Check) => (c.duty ? dpdpDuties[DUTY_IDX[c.duty]].title : null);

  return (
    <article className="rp">
      <ReportTrack sid={id} />

      <div className="rp-wrap">
        <div className="rp-bar rp-noprint">
          <PsLink href="/" className="rp-back">&larr; Privacy Saathi</PsLink>
          <div className="rp-bar-r"><PrintBtn />{!gated && <BookBtn href={booking} label="Book a review" />}</div>
        </div>

        {/* Cover */}
        <header className="rp-cover">
          <div className="rp-cover-top"><span className="rp-logo"><ShieldCheck size={16} aria-hidden /> Privacy Saathi</span><span className="rp-tag">DPDP &amp; cyber readiness report</span></div>
          <div className="rp-cover-body">
            <div className="rp-cover-l">
              <p className="rp-eyebrow">Prepared for</p>
              <h1>{subject}</h1>
              <p className="rp-meta">{scanned} IST{r ? ` · ${r.pagesScanned} page${r.pagesScanned === 1 ? '' : 's'} read (${r.mode === 'deep' ? 'full scan' : 'home page only'})` : ' · based on your answers'}{rec.status === 'error' ? ' · website scan could not be completed' : ''}</p>
              <div className="rp-stats">
                <div><b>{rep.dpdp ?? 'n/a'}</b><span>DPDP readiness</span></div>
                <div><b>{rep.security ?? 'n/a'}</b><span>Security hygiene</span></div>
                <div><b>{days}</b><span>days to the main DPDP deadline</span></div>
              </div>
            </div>
            <div className="rp-cover-r"><Ring value={rep.headline} /><div className={`rp-band ${tone(rep.headline)}`}>{rep.band}</div></div>
          </div>
        </header>

        {/* Executive summary */}
        <section className="rp-sec" aria-labelledby="rp-sum">
          <h2 id="rp-sum" className="rp-h2"><span>01</span> Executive summary</h2>
          <div className="rp-sum">
            <div className={`rp-fine ${ex.level}`}>
              <small>{ex.level === 'none' ? 'DPDP fine exposure' : ex.level === 'gap' ? 'Maximum fine exposure' : 'Possible fine exposure'}</small>
              <b>{ex.level === 'none' ? 'None found' : `Up to ${crore(ex.maxCr)}`}</b>
              <span>{ex.level === 'none' ? 'Nothing flagged in what we could see.' : `Highest tier touched: ${ex.dutyLabel}`}</span>
            </div>
            <div className="rp-sum-r">
              <p className="rp-lead">{summary}</p>
              <ul className="rp-counts" aria-label="Summary of results">
                <li className="gap"><b>{dp.counts.gap}</b>gaps</li><li className="review"><b>{dp.counts.review}</b>to review</li><li className="ok"><b>{dp.counts.ok}</b>no issues seen</li><li className="unknown"><b>{dp.counts.unknown}</b>not assessed</li>
              </ul>
              {gated && <p className="rp-callout"><CircleAlert size={16} aria-hidden /> You used a free email address. Business mail on a free provider cannot be secured or audited, so we have not emailed this report.</p>}
            </div>
          </div>
        </section>

        {/* Duties */}
        <section className="rp-sec" aria-labelledby="rp-duty">
          <h2 id="rp-duty" className="rp-h2"><span>02</span> The eight DPDP duties</h2>
          <p className="rp-sub">Each duty, the section of the Act behind it, and the most you could be fined for failing it.</p>
          <div className="rp-duties">
            {dp.duties.map((d) => (
              <div key={d.id} className={`rp-duty ${d.status}`}>
                <div className="rp-duty-top"><span className="rp-duty-ref">{d.ref}</span><span className={`rp-dpill ${d.status}`}>{DUTY_LABEL[d.status]}</span></div>
                <h3>{d.label}</h3>
                <p>{d.importance}</p>
                <div className="rp-duty-fine"><small>Maximum fine</small><b>{crore(d.fineCr)}</b></div>
              </div>))}
          </div>
          <p className="rp-note">Maximum penalties the Act allows, per published summaries. Actual penalties are decided by the Data Protection Board. Confirm with your legal adviser.</p>
        </section>

        {/* Priorities */}
        <section className="rp-sec" aria-labelledby="rp-prio">
          <h2 id="rp-prio" className="rp-h2"><span>03</span> Your top {Math.min(5, rep.priorities.length) || ''} priorities</h2>
          <p className="rp-sub">Fix these first. They carry the most risk for the least effort.</p>
          {rep.priorities.length === 0 ? <p className="rp-lead">Nothing urgent stood out in what we could check. Review the full list below.</p> : (
            <ol className="rp-prio">
              {rep.priorities.map((c) => { const s = svc(c.relatedService), dl = dutyLine(c); return (
                <li key={c.id} className={c.status}>
                  <div className="rp-prio-h"><h3>{c.title}</h3><Pill s={c.status} /></div>
                  <p className="rp-why">{c.whyItMatters}</p>
                  <div className="rp-fix"><b>How to fix</b><span>{c.fix}</span></div>
                  <div className="rp-chips"><span className="rp-chip">Effort: {c.effort}</span><span className="rp-chip">{SEV[c.severity]}</span>{dl && <span className="rp-chip">{dl}</span>}{s && <a className="rp-chip link" href={s.href} target="_blank" rel="noopener">Bedre can help: {s.name} <ArrowRight size={12} aria-hidden /></a>}</div>
                </li>); })}
            </ol>
          )}
        </section>

        {/* Findings */}
        <section className="rp-sec" aria-labelledby="rp-find">
          <h2 id="rp-find" className="rp-h2"><span>04</span> All findings</h2>
          <p className="rp-sub">{issues.length} {issues.length === 1 ? 'item needs' : 'items need'} attention, {passes} passed. Each finding shows how sure we are: <i>{CONFIDENCE_LABEL.confirmed}</i>, <i>{CONFIDENCE_LABEL.likely}</i> or <i>{CONFIDENCE_LABEL.self}</i>.</p>
          {AREAS.map(([area, title, blurb]) => { const items = rep.checks.filter((c) => c.area === area); if (!items.length) return null;
            const bad = items.filter((c) => c.status === 'fail' || c.status === 'warn'), ok = items.filter((c) => c.status === 'pass'), unk = items.filter((c) => c.status === 'unknown');
            return (
              <div className="rp-area" key={area}>
                <div className="rp-area-h"><h3>{title}</h3><span>{ok.length} of {items.length} passed{unk.length ? ` · ${unk.length} not visible from outside` : ''}</span></div>
                <p className="rp-sub" style={{ margin: '0 0 12px' }}>{blurb}</p>
                {bad.map((c) => (
                  <div key={c.id} className={`rp-find ${c.status}`}>
                    <div className="rp-find-h"><span className="rp-find-i"><Icon s={c.status} /></span><h4>{c.title}</h4><Pill s={c.status} /><span className={`rp-conf ${confidenceOf(c)}`}>{CONFIDENCE_LABEL[confidenceOf(c)]}</span></div>
                    <dl>
                      <div><dt>What we saw</dt><dd>{c.evidence}</dd></div>
                      <div><dt>Why it matters</dt><dd>{c.whyItMatters}</dd></div>
                      <div><dt>How to fix</dt><dd>{c.fix}</dd></div>
                    </dl>
                  </div>))}
                {ok.length > 0 && <><p className="rp-mini">Passed</p><ul className="rp-passes">{ok.map((c) => <li key={c.id}><CircleCheck size={15} aria-hidden />{c.title}</li>)}</ul></>}
                {unk.length > 0 && <><p className="rp-mini">Could not be checked from outside</p><ul className="rp-passes unk">{unk.map((c) => <li key={c.id}><CircleHelp size={15} aria-hidden />{c.title}</li>)}</ul></>}
              </div>); })}
        </section>

        {/* Technical appendix */}
        {r && (
          <section className="rp-sec" aria-labelledby="rp-tech">
            <h2 id="rp-tech" className="rp-h2"><span>05</span> Technical detail</h2>
            <div className="rp-tech">
              <div className="rp-card">
                <h3>Email security, in plain words</h3>
                <ul className="rp-kv">
                  {[['SPF', r.email.spf ? 'Found' : 'Missing', 'Lists who may send email as your company.'], ['DKIM', r.email.dkim.length ? 'Found' : 'Not seen', 'A signature that proves mail was not changed.'], ['DMARC', r.email.dmarcPolicy ? `Policy: ${r.email.dmarcPolicy}` : 'Missing', 'Tells receivers to reject fake mail from your name.'], ['Mail provider', (r.email.provider && r.email.provider.toLowerCase() !== 'none') ? r.email.provider : 'Not detected', 'Business suites are easier to secure than shared hosting.']].map(([t, v, b]) => (
                    <li key={t}><div><b>{t}</b><small>{b}</small></div><span className={`rp-val ${/Missing|Not seen|Not detected/i.test(v) ? 'bad' : 'ok'}`}>{v}</span></li>))}
                </ul>
              </div>
              {r.trackers.length > 0 && (
                <div className="rp-card">
                  <h3>Trackers on your site</h3>
                  <table className="rp-table"><thead><tr><th>Tracker</th><th>Loaded from</th></tr></thead><tbody>{r.trackers.map((t) => <tr key={t.name + t.host}><td>{t.name}</td><td>{t.host}</td></tr>)}</tbody></table>
                </div>)}
              {r.forms.length > 0 && (
                <div className="rp-card wide">
                  <h3>Forms that collect personal data</h3>
                  <div className="rp-tablewrap"><table className="rp-table"><thead><tr><th>Page</th><th>Collects</th><th>Consent shown</th><th>HTTPS</th></tr></thead><tbody>{r.forms.map((f, i) => <tr key={i}><td>{new URL(f.page).pathname}</td><td>{f.personal.join(', ')}</td><td><span className={`rp-val ${f.consentNearby ? 'ok' : 'bad'}`}>{f.consentNearby ? 'Yes' : 'No'}</span></td><td><span className={`rp-val ${f.httpsPost ? 'ok' : 'bad'}`}>{f.httpsPost ? 'Yes' : 'No'}</span></td></tr>)}</tbody></table></div>
                </div>)}
              {r.cookies.length > 0 && (
                <div className="rp-card wide">
                  <h3>Cookies set (names only)</h3>
                  <div className="rp-tablewrap"><table className="rp-table"><thead><tr><th>Cookie</th><th>Secure</th><th>HttpOnly</th><th>SameSite</th><th>Lifetime</th></tr></thead><tbody>{r.cookies.map((c) => <tr key={c.name}><td>{c.name}</td><td>{c.secure ? 'Yes' : 'No'}</td><td>{c.httpOnly ? 'Yes' : 'No'}</td><td>{c.sameSite}</td><td>{c.lifetimeDays === null ? 'Session' : `${c.lifetimeDays} days`}</td></tr>)}</tbody></table></div>
                </div>)}
            </div>
          </section>)}

        {/* Not checked */}
        <section className="rp-sec" aria-labelledby="rp-nc">
          <h2 id="rp-nc" className="rp-h2"><span>{r ? '06' : '05'}</span> What we could not check</h2>
          <ul className="rp-nc">{(r?.notChecked ?? ['Your website (none was scanned)', 'Your internal systems, devices and vendors', 'What your privacy notice actually says']).map((n) => <li key={n}><CircleHelp size={16} aria-hidden />{n}</li>)}</ul>
        </section>

        {/* Next steps */}
        <section className="rp-cta rp-noprint">
          <div className="rp-cta-l">
            <span className="rp-cta-i"><CalendarClock size={22} aria-hidden /></span>
            {gated
              ? <div><h2>Set up official email first</h2><p>The emailed report and a consultant call need a company email address. We can help you set one up, even without a website.</p></div>
              : <div><h2>Turn this report into a plan</h2><p>A free 30-minute review with a Bedre consultant: what to fix first, who does it, and what it costs. We are a technology partner, not a law firm.</p></div>}
          </div>
          {gated ? <PsLink className="rp-btn light" href="/scan">Help me set up official email</PsLink> : <BookBtn href={booking} className="rp-btn light" />}
        </section>
        <p className="rp-note rp-noprint">Monthly re-scans with change alerts are coming with client login. <PsLink href="/maintenance" className="rp-u">See website care plans</PsLink></p>

        <div className="rp-foot">
          <details className="rp-how rp-noprint"><summary>How we score</summary>
            <p>Each check is worth 3 (high), 2 (medium) or 1 (low) points. A pass earns all of them, a warning earns half, a fix-needed earns none. Checks we could not see are left out, so you are never marked down for them. DPDP readiness uses the privacy checks plus your answers. Security hygiene uses website and email checks. The headline score is the average of the two. Bands: under 35 Just starting, 35 to 59 Some foundations, 60 to 79 Well on your way, 80 and above Strong position.</p>
          </details>
          <p className="rp-disc"><b>Please read.</b> This is an automated technical check of public information at the time shown. It is not legal advice, not an audit and not a certification, and it does not say your business is or is not compliant. Bedre Web Technologies Pvt. Ltd. is a technology company, not a law firm. Confirm legal requirements with your own adviser. Your report link is private to you and is deleted after {process.env.PS_RETENTION_DAYS || 90} days.</p>
          <p className="rp-id">Privacy Saathi · Bedre Web Technologies Pvt. Ltd. · Report {id.slice(0, 8).toUpperCase()} · {scanned} IST</p>
        </div>
      </div>
    </article>
  );
}

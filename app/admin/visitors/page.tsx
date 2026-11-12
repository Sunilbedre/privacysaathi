import Link from 'next/link';
import { visitorStats } from '@/lib/ps/visitors';
import Shell from '../Shell';

export const dynamic = 'force-dynamic';
const RANGES = [7, 30, 90];
const pct = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : null);

export default async function VisitorsPage({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const sp = await searchParams;
  const days = RANGES.includes(Number(sp.r)) ? Number(sp.r) : 30;
  const s = await visitorStats(days);
  const max = Math.max(1, ...s.series.map((d) => d.visitors || d.views));
  const useUnique = s.hasUnique;
  const diff = s.yesterdayVisitors >= 3 ? pct(s.today.visitors, s.yesterdayVisitors) : null;
  const rows = [...s.series].reverse();
  const bars = days > 30 ? 'adm-bars dense' : 'adm-bars';
  const tick = Math.ceil(days / 7);

  return (
    <Shell active="visitors" title="Visitors" sub="Anonymous daily visits to privacysaathi.in. No names, no IP addresses, and bots are left out."
      actions={<div className="adm-seg" role="group" aria-label="Date range">{RANGES.map((r) => <Link key={r} href={`/qwedsa/visitors?r=${r}`} className={r === days ? 'on' : ''}>{r} days</Link>)}</div>}>

      {!useUnique && (
        <div className="adm-msg info" role="status">
          {s.range.views ? 'Older visits were recorded before visitor counting started, so only page views are shown for them. Visitor numbers fill in from today.' : 'No visits recorded yet. Numbers appear as soon as people open the website.'}
        </div>
      )}

      <section className="adm-kpis" aria-label="Key numbers">
        <div className="adm-kpi"><small>Visitors today</small><b>{s.today.visitors}</b><span>{diff === null ? `Yesterday ${s.yesterdayVisitors} · ${s.today.views} page views` : <><span className={diff >= 0 ? 'up' : 'down'}>{diff >= 0 ? '▲' : '▼'} {Math.abs(diff)}%</span> vs yesterday · {s.today.views} views</>}</span></div>
        <div className="adm-kpi"><small>Visitors, last {days} days</small><b>{s.range.visitors}</b><span>About {s.range.perDay} a day · {s.range.views} page views</span></div>
        <div className="adm-kpi"><small>Scans started</small><b>{s.range.scans}</b><span>{s.range.visitors ? `${Math.round((s.range.scans / s.range.visitors) * 100)}% of visitors` : 'Nobody yet'}</span></div>
        <div className="adm-kpi"><small>Leads from visitors</small><b>{s.range.leads}</b><span>{s.range.conversion}% of visitors became a lead</span></div>
      </section>

      <section className="adm-card">
        <div className="adm-card-h"><h2>{useUnique ? 'Visitors' : 'Page views'} per day</h2><span>Last {days} days</span></div>
        <div className="adm-bars-wrap">
          <div className={bars} style={{ gridTemplateColumns: `repeat(${days}, minmax(0,1fr))` }} role="img" aria-label={`${useUnique ? 'Visitors' : 'Page views'} per day for the last ${days} days`}>
            {s.series.map((d, i) => { const v = useUnique ? d.visitors : d.views; return (
              <div key={d.key} title={`${d.weekday} ${d.label}: ${d.visitors} visitors, ${d.views} page views, ${d.leads} leads`}>
                <i className="s" style={{ height: `${(v / max) * 100}%`, minHeight: v ? 3 : 0 }} />
                {(i % tick === 0 || i === days - 1) && <em>{d.label}</em>}
              </div>); })}
          </div>
        </div>
        <div className="adm-legend"><span><i style={{ background: 'var(--a)' }} />{useUnique ? 'Distinct visitors' : 'Page views'} (hover a bar for the day&apos;s details)</span></div>
      </section>

      <section className="adm-three">
        <div className="adm-card">
          <div className="adm-card-h"><h2>Where visitors come from</h2></div>
          {s.sources.length ? <div className="adm-rows">{s.sources.map((x) => <div key={x.label} className="adm-bar-row"><span>{x.label}</span><div><b style={{ width: `${(x.visitors / s.sources[0].visitors) * 100}%` }} /></div><em>{x.visitors}</em></div>)}</div> : <div className="adm-sub">Appears once visitors arrive.</div>}
        </div>
        <div className="adm-card">
          <div className="adm-card-h"><h2>Most visited pages</h2></div>
          {s.pages.length ? <div className="adm-rows">{s.pages.map((x) => <div key={x.path} className="adm-bar-row"><span title={x.path}>{x.path}</span><div><b style={{ width: `${(x.views / s.pages[0].views) * 100}%` }} /></div><em>{x.views}</em></div>)}</div> : <div className="adm-sub">Appears once visitors arrive.</div>}
        </div>
        <div className="adm-card">
          <div className="adm-card-h"><h2>Devices</h2></div>
          {s.devices.length ? <div className="adm-rows">{s.devices.map((x) => <div key={x.label} className="adm-bar-row"><span>{x.label}</span><div><b style={{ width: `${(x.visitors / s.devices[0].visitors) * 100}%`, background: 'linear-gradient(90deg,#0A74EE,#7828F0)' }} /></div><em>{x.visitors}</em></div>)}</div> : <div className="adm-sub">Appears once visitors arrive.</div>}
        </div>
      </section>

      <section className="adm-card">
        <div className="adm-card-h"><h2>Day by day</h2><span>Newest first</span></div>
        <div className="adm-tablewrap">
          <table className="adm-table">
            <thead><tr><th>Day</th><th>Visitors</th><th>Page views</th><th>Scans started</th><th>Leads</th><th>Visitors to leads</th></tr></thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.key}>
                  <td className="adm-cell"><b>{d.weekday}, {d.label}</b></td>
                  <td>{useUnique ? d.visitors : <span className="adm-sub">n/a</span>}</td>
                  <td>{d.views}</td><td>{d.scans}</td><td>{d.leads}</td>
                  <td>{useUnique && d.visitors ? `${Math.round((d.leads / d.visitors) * 1000) / 10}%` : '-'}</td>
                </tr>))}
            </tbody>
          </table>
        </div>
        <p className="adm-sub" style={{ marginTop: 12 }}>How it is counted: each browser gets a random id that the server turns into a one-day code, so a visitor is counted once per day and cannot be followed from day to day. Times are India time. Visitors who block scripts are not counted, so real numbers are a little higher.</p>
      </section>
    </Shell>
  );
}

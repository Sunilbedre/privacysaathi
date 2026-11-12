import Link from 'next/link';
import { ArrowRight, BellRing, Flame, Gauge, Inbox, ScanSearch, Trophy } from 'lucide-react';
import { dashboard } from '@/lib/ps/admin-stats';
import { visitorStats } from '@/lib/ps/visitors';
import { STATUSES } from '@/lib/ps/crm';
import { getSetting } from '@/lib/settings';
import Shell from './Shell';

export const dynamic = 'force-dynamic';
const ago = (iso: string) => { const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000)); return m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };
const initials = (n: string) => n.trim().split(/\s+/).slice(0, 2).map((x) => x[0]?.toUpperCase() ?? '').join('') || '?';

export default async function AdminHome() {
  const [d, vis] = await Promise.all([dashboard(), visitorStats(7)]);
  const maxBar = Math.max(1, ...d.series.map((s) => s.scan + s.solution));
  const trend = d.weekPrev ? Math.round(((d.week - d.weekPrev) / d.weekPrev) * 100) : null;
  const maxStage = Math.max(1, ...Object.values(d.byStatus));
  const set = (k: string) => !!getSetting(k);
  const setup = [
    { label: 'Email alerts', on: set('LEAD_TO_EMAIL') && (set('SMTP_HOST') || set('RESEND_API_KEY')) },
    { label: 'WhatsApp alerts', on: set('WA_TOKEN') && set('WA_PHONE_NUMBER_ID') && set('WA_OWNER_NUMBERS') },
    { label: 'SMS alerts', on: set('SMS_API_KEY') && set('SMS_SENDER_ID') && set('SMS_OWNER_NUMBERS') },
    { label: 'Admin link in alerts', on: set('CRM_BASE_URL') },
  ];
  const todo = setup.filter((s) => !s.on).length;

  return (
    <Shell active="dashboard" title="Dashboard" sub="What is coming in, what needs a call, and whether your alerts are working."
      actions={<><Link href="/qwedsa/crm" className="adm-btn ghost"><Inbox size={16} aria-hidden /> All enquiries</Link><Link href="/qwedsa/settings" className="adm-btn">Settings</Link></>}>

      {todo > 0 && (
        <div className="adm-msg info" role="status">
          {todo} of 4 alert channels are not connected yet, so you may miss new enquiries. <Link href="/qwedsa/settings" style={{ textDecoration: 'underline' }}>Connect them in Settings</Link>.
        </div>
      )}

      <section className="adm-kpis" aria-label="Key numbers">
        <div className="adm-kpi"><small>New today</small><b>{d.today}</b><span>{d.total} enquiries in total</span></div>
        <div className="adm-kpi"><small>Last 7 days</small><b>{d.week}</b><span>{trend === null ? 'No earlier week to compare' : <><span className={trend >= 0 ? 'up' : 'down'}>{trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%</span> vs the week before</>}</span></div>
        <div className={`adm-kpi${d.hot ? ' alert' : ''}`}><small><Flame size={13} aria-hidden style={{ verticalAlign: '-2px' }} /> Hot, not yet won</small><b>{d.hot}</b><span>High exposure or low score</span></div>
        <div className="adm-kpi"><small>Open pipeline</small><b>{d.open}</b><span>{d.wonCount} won{d.winRate ? ` · ${d.winRate}% win rate` : ''}</span></div>
      </section>

      <section className="adm-two">
        <div className="adm-card">
          <div className="adm-card-h"><h2>Enquiries, last 14 days</h2><span>{d.month} in the last 30 days</span></div>
          <div className="adm-bars-wrap">
            <div className="adm-bars" role="img" aria-label="Enquiries per day for the last 14 days">
              {d.series.map((s, i) => (
                <div key={s.key} title={`${s.label}: ${s.scan} scan, ${s.solution} solution`}>
                  <i className="o" style={{ height: `${(s.solution / maxBar) * 100}%` }} /><i className="s" style={{ height: `${(s.scan / maxBar) * 100}%` }} />
                  {i % 2 === 0 && <em>{s.label}</em>}
                </div>))}
            </div>
          </div>
          <div className="adm-legend"><span><i style={{ background: 'var(--a)' }} />Scan enquiries ({d.byType.scan})</span><span><i style={{ background: '#F2A93B' }} />Solution enquiries ({d.byType.solution})</span></div>
        </div>

        <div className="adm-card">
          <div className="adm-card-h"><h2>Pipeline</h2><Link href="/qwedsa/crm?v=board" className="adm-sub">Board view →</Link></div>
          <div className="adm-funnel">
            {STATUSES.map((s) => (
              <Link key={s} href={`/qwedsa/crm?s=${s}`}><span>{s}</span><div><b style={{ width: `${(d.byStatus[s] / maxStage) * 100}%`, background: s === 'won' ? 'var(--ok)' : s === 'lost' ? '#C9CEE3' : undefined }} /></div><em>{d.byStatus[s]}</em></Link>))}
          </div>
        </div>
      </section>

      <section className="adm-two">
        <div className="adm-card">
          <div className="adm-card-h"><h2>Latest enquiries</h2><Link href="/qwedsa/crm" className="adm-sub">View all <ArrowRight size={13} aria-hidden style={{ verticalAlign: '-2px' }} /></Link></div>
          {d.latest.length ? (
            <ul className="adm-list">
              {d.latest.map((e) => (
                <li key={e.id}>
                  <span className="adm-av" aria-hidden>{initials(e.name)}</span>
                  <Link href={`/qwedsa/crm?e=${e.id}`} className="grow"><b>{e.name}{e.company ? ` · ${e.company}` : ''}</b><small>{e.type === 'solution' ? `Wants help: ${e.topic || 'DPDP'}` : `Scanned ${e.website || 'a business'}${e.score != null ? `, ${e.score}/100` : ''}`} · {ago(e.createdAt)}</small></Link>
                  {e.priority === 'hot' && <span className="adm-badge hot">Hot</span>}
                  <span className={`adm-badge ${e.type}`}>{e.type === 'solution' ? 'Solution' : 'Scan'}</span>
                  <span className={`adm-badge ${e.status}`}>{e.status}</span>
                </li>))}
            </ul>
          ) : <div className="adm-empty"><b>No enquiries yet</b>They appear here the moment someone scans a site or asks for help.</div>}
        </div>

        <div style={{ display: 'grid', gap: 20, alignContent: 'start' }}>
          <div className="adm-card">
            <div className="adm-card-h"><h2>Visitors</h2><Link href="/qwedsa/visitors" className="adm-sub">Open →</Link></div>
            <div className="adm-health">
              <div><span>Today</span><b>{vis.hasUnique ? vis.today.visitors : vis.today.views}</b></div>
              <div><span>Yesterday</span><b>{vis.hasUnique ? vis.yesterdayVisitors : '-'}</b></div>
              <div><span>Last 7 days</span><b>{vis.hasUnique ? vis.range.visitors : vis.range.views}</b></div>
              <div><span>Became a lead</span><b>{vis.range.conversion}%</b></div>
            </div>
          </div>
          <div className="adm-card">
            <div className="adm-card-h"><h2><BellRing size={16} aria-hidden style={{ verticalAlign: '-3px' }} /> Alert channels</h2></div>
            <div className="adm-health">
              {setup.map((s) => <div key={s.label}><span>{s.label}</span><span className={`adm-badge ${s.on ? 'ok' : 'off'}`}><i />{s.on ? 'Connected' : 'Not set'}</span></div>)}
              {d.alerts.some((a) => a.failed) && <div style={{ color: 'var(--bad)', fontWeight: 600 }}>{d.alerts.filter((a) => a.failed).map((a) => `${a.label}: ${a.failed} failed`).join(' · ')}</div>}
            </div>
          </div>
          <div className="adm-card">
            <div className="adm-card-h"><h2>Where leads come from</h2></div>
            {d.sources.length ? <div className="adm-funnel">{d.sources.map((x) => <div key={x.label} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 34px', alignItems: 'center', gap: 10, fontSize: '.88rem' }}><span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.label}</span><div><b style={{ width: `${(x.count / d.sources[0].count) * 100}%` }} /></div><em>{x.count}</em></div>)}</div> : <div className="adm-sub">Appears once leads arrive.</div>}
          </div>
          <div className="adm-card">
            <div className="adm-card-h"><h2><ScanSearch size={16} aria-hidden style={{ verticalAlign: '-3px' }} /> Scans</h2><Link href="/qwedsa/scans" className="adm-sub">Open →</Link></div>
            <div className="adm-health">
              <div><span>Total scans</span><b>{d.scans.total}</b></div>
              <div><span>Last 7 days</span><b>{d.scans.week}</b></div>
              <div><span>Gave details to see result</span><b>{d.scans.leadRate}%</b></div>
              <div><span>Failed scans</span><b>{d.scans.failed}</b></div>
              <div><span><Gauge size={14} aria-hidden style={{ verticalAlign: '-2px' }} /> Average score</span><b>{d.avgScore ?? '-'}</b></div>
            </div>
          </div>
        </div>
      </section>

      {d.needFollowUp.length > 0 && (
        <section className="adm-card">
          <div className="adm-card-h"><h2><Trophy size={16} aria-hidden style={{ verticalAlign: '-3px' }} /> Waiting for a first call</h2><span>New for over 12 hours</span></div>
          <ul className="adm-list">
            {d.needFollowUp.map((e) => (
              <li key={e.id}><span className="adm-av" aria-hidden>{initials(e.name)}</span><div className="grow"><b>{e.name}</b><small>{e.phone} · {ago(e.createdAt)}</small></div>
                <a className="adm-btn ghost sm" href={`tel:${e.phone.replace(/[^\d+]/g, '')}`}>Call</a><Link className="adm-btn sm" href={`/qwedsa/crm?e=${e.id}`}>Open</Link></li>))}
          </ul>
        </section>
      )}
    </Shell>
  );
}

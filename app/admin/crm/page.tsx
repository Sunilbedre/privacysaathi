import Link from 'next/link';
import { Download, Mail, MessageCircle, Phone, X, ExternalLink } from 'lucide-react';
import { getEnquiry, listEnquiries, STATUSES, type Enquiry } from '@/lib/ps/crm';
import { filterEnquiries } from '@/lib/ps/admin-stats';
import { crore } from '@/lib/ps/dpdp-map';
import { landingPath, referrerHost, sourceLabel } from '@/lib/ps/origin';
import Shell from '../Shell';
import { updateEnquiryAction } from '../actions';

export const dynamic = 'force-dynamic';
type SP = { t?: string; s?: string; p?: string; q?: string; sort?: string; v?: string; page?: string; e?: string };
const PER = 20;
const when = (iso: string) => new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' });
const short = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });
const href = (sp: SP, over: Partial<SP>) => { const m = { ...sp, ...over } as Record<string, string | undefined>; const q = Object.entries(m).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&'); return `/qwedsa/crm${q ? '?' + q : ''}`; };
const digits = (p: string) => { const d = p.replace(/\D/g, ''); return d.length === 10 ? '91' + d : d; };
const scoreCls = (n: number | null) => (n == null ? '' : n < 40 ? 'lo' : n < 70 ? 'mid' : 'hi');
const ALERT_LABEL: Record<string, string> = { whatsapp: 'WhatsApp', sms: 'SMS', ownerEmail: 'Email to you', visitorEmail: 'Email to visitor', clientWhatsapp: 'WhatsApp to visitor', clientSms: 'SMS to visitor', webhook: 'Chat webhook' };
const initials = (n: string) => n.trim().split(/\s+/).slice(0, 2).map((x) => x[0]?.toUpperCase() ?? '').join('') || '?';

function Detail({ e, sp }: { e: Enquiry; sp: SP }) {
  const back = href(sp, { e: undefined }).split('?')[1] ?? '';
  const timeline = [{ at: e.createdAt, text: e.type === 'solution' ? 'Asked for help' : 'Scanned and gave details', note: false }, ...e.notes.map((n) => ({ at: n.at, text: n.text, note: true }))].sort((a, b) => b.at.localeCompare(a.at));
  return (
    <aside className="adm-card adm-detail" aria-label="Enquiry details">
      <div className="adm-d-top">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><span className="adm-av" aria-hidden>{initials(e.name)}</span><div><h2>{e.name}</h2><span className="adm-sub">{e.company || e.website || 'No business given'}</span></div></div>
        <Link href={href(sp, { e: undefined })} className="adm-btn ghost sm" aria-label="Close details"><X size={16} aria-hidden /></Link>
      </div>
      <div className="adm-d-badges">
        <span className={`adm-badge ${e.type}`}>{e.type === 'solution' ? 'Solution enquiry' : 'Scan enquiry'}</span>
        <span className={`adm-badge ${e.priority}`}>{e.priority === 'hot' ? 'Hot' : 'Warm'}</span>
        <span className={`adm-badge ${e.status}`}>{e.status}</span>
      </div>
      <div className="adm-actions">
        <a href={`tel:${e.phone.replace(/[^\d+]/g, '')}`}><Phone size={18} aria-hidden />Call</a>
        <a href={`https://wa.me/${digits(e.phone)}`} target="_blank" rel="noopener"><MessageCircle size={18} aria-hidden />WhatsApp</a>
        <a href={`mailto:${e.email}`}><Mail size={18} aria-hidden />Email</a>
      </div>
      <dl className="adm-dl">
        <dt>Phone</dt><dd>{e.phone} {e.phoneVerified ? <span className="adm-badge ok"><i />Verified by WhatsApp</span> : null}</dd>
        <dt>Email</dt><dd>{e.email}</dd>
        <dt>Website</dt><dd>{e.website || 'No website'}</dd>
        {e.type === 'scan' ? (<><dt>Result</dt><dd>{e.score != null ? <span className={`adm-score ${scoreCls(e.score)}`}>{e.score}</span> : '-'} {e.band}{e.exposureCr ? ` · up to ${crore(e.exposureCr)} fine exposure` : ''}{e.gaps ? ` · ${e.gaps} gaps` : ''}</dd></>)
          : (<><dt>Wants help with</dt><dd>{e.topic || '-'}</dd></>)}
        {e.type === 'scan' && e.topic && <><dt>Request</dt><dd>{e.topic}</dd></>}
        {e.message && <><dt>Message</dt><dd>{e.message}</dd></>}
        {e.preferredTime && <><dt>Best time</dt><dd>{e.preferredTime}</dd></>}
        <dt>Received</dt><dd>{when(e.createdAt)}</dd>
        <dt>Reference</dt><dd><code>{e.id}</code></dd>
      </dl>
      <div className="adm-h3">Where they came from</div>
      <dl className="adm-dl">
        <dt>Source</dt><dd><b>{sourceLabel(e.origin, e.source)}</b></dd>
        {e.origin?.landingUrl && <><dt>Landing page</dt><dd><a href={e.origin.landingUrl} target="_blank" rel="noopener" style={{ color: 'var(--a)', textDecoration: 'underline' }}>{landingPath(e.origin) || e.origin.landingUrl}</a><small className="adm-sub" style={{ display: 'block' }}>{e.origin.host}</small></dd></>}
        {e.origin?.referrer ? <><dt>Came from</dt><dd><a href={e.origin.referrer} target="_blank" rel="noopener" style={{ color: 'var(--a)', textDecoration: 'underline' }}>{referrerHost(e.origin) || e.origin.referrer}</a></dd></> : <><dt>Came from</dt><dd>Typed the address or used a bookmark</dd></>}
        {(e.origin?.utm_campaign || e.origin?.utm_source || e.utm) && <><dt>Campaign</dt><dd>{[e.origin?.utm_source, e.origin?.utm_medium, e.origin?.utm_campaign].filter(Boolean).join(' / ') || e.utm}{e.origin?.utm_term ? <small className="adm-sub" style={{ display: 'block' }}>Keyword: {e.origin.utm_term}</small> : null}</dd></>}
        {(e.origin?.gclid || e.origin?.fbclid) && <><dt>Ad click</dt><dd>{e.origin?.gclid ? 'Google Ads click id recorded' : 'Meta Ads click id recorded'}</dd></>}
        {e.origin?.formPage && <><dt>Form on page</dt><dd>{e.origin.formPage}</dd></>}
        {(e.origin?.device || e.origin?.lang) && <><dt>Device</dt><dd>{[e.origin?.device, e.origin?.lang].filter(Boolean).join(' · ')}</dd></>}
      </dl>
      {e.scanId && <p style={{ marginBottom: 14 }}><Link href={`/ps/report/${e.scanId}`} target="_blank" className="adm-btn ghost sm"><ExternalLink size={14} aria-hidden /> Open their report</Link></p>}

      <form action={updateEnquiryAction}>
        <input type="hidden" name="id" value={e.id} /><input type="hidden" name="back" value={back} />
        <div className="adm-h3" style={{ marginTop: 4 }}>Stage</div>
        <div className="adm-stage">{STATUSES.map((s) => <button key={s} name="status" value={s} className={s === e.status ? 'on' : ''}>{s}</button>)}</div>
        <div className="adm-field"><label htmlFor="note">Add a note</label><textarea id="note" name="note" rows={2} placeholder="Called, will revert on Monday…" /></div>
        <button className="adm-btn sm" type="submit">Save note</button>
      </form>

      <div className="adm-h3">Activity</div>
      <ul className="adm-time">{timeline.map((t) => <li key={t.at + t.text}><small>{short(t.at)}</small>{t.note ? t.text : <b>{t.text}</b>}</li>)}</ul>

      <div className="adm-h3">Messages sent</div>
      <div className="adm-health">{Object.keys(ALERT_LABEL).map((k) => { const v = e.alerts?.[k]; const good = v === 'sent' || v === 'outbox'; return <div key={k}><span>{ALERT_LABEL[k]}</span><span className={`adm-badge ${v === 'failed' ? 'bad' : good ? 'ok' : 'off'}`}>{v === 'outbox' ? 'saved (test)' : v ?? 'not sent'}</span></div>; })}</div>
    </aside>
  );
}

export default async function CrmPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const all = await listEnquiries();
  const rows = filterEnquiries(all, sp);
  const page = Math.max(1, Number(sp.page) || 1), pages = Math.max(1, Math.ceil(rows.length / PER));
  const shown = sp.v === 'board' ? rows : rows.slice((page - 1) * PER, page * PER);
  const open = sp.e ? await getEnquiry(sp.e) : null;
  const n = (f: (e: Enquiry) => boolean) => all.filter(f).length;
  const exportHref = `/qwedsa/crm/export${href(sp, { e: undefined, page: undefined, v: undefined }).split('crm')[1] ?? ''}`;

  return (
    <Shell active="crm" title="Enquiries" sub="Scan enquiries (checked a site, shared details) and solution enquiries (asked Bedre to fix a gap)."
      actions={<a href={exportHref} className="adm-btn ghost"><Download size={16} aria-hidden /> Export CSV</a>}>

      <div className="adm-bar">
        <form action="/qwedsa/crm" method="get">
          <input className="search" type="search" name="q" defaultValue={sp.q ?? ''} placeholder="Search name, phone, email, business…" aria-label="Search enquiries" />
          {sp.t && <input type="hidden" name="t" value={sp.t} />}{sp.s && <input type="hidden" name="s" value={sp.s} />}{sp.v && <input type="hidden" name="v" value={sp.v} />}
          <select name="p" defaultValue={sp.p ?? ''} aria-label="Priority"><option value="">Any priority</option><option value="hot">Hot</option><option value="warm">Warm</option></select>
          <select name="sort" defaultValue={sp.sort ?? ''} aria-label="Sort"><option value="">Newest first</option><option value="old">Oldest first</option><option value="score">Lowest score first</option><option value="exposure">Highest fine first</option></select>
          <button className="adm-btn ghost" type="submit">Apply</button>
        </form>
        <div className="adm-seg" role="group" aria-label="View"><Link href={href(sp, { v: undefined, page: undefined })} className={sp.v !== 'board' ? 'on' : ''}>List</Link><Link href={href(sp, { v: 'board', e: undefined })} className={sp.v === 'board' ? 'on' : ''}>Board</Link></div>
      </div>

      <div className="adm-chips" aria-label="Filter by type and stage">
        {[['', 'All', all.length], ['scan', 'Scan', n((e) => e.type === 'scan')], ['solution', 'Solution', n((e) => e.type === 'solution')]].map(([k, l, c]) => <Link key={String(k)} href={href(sp, { t: String(k) || undefined, page: undefined })} className={(sp.t ?? '') === k ? 'on' : ''}>{l}<b>{c}</b></Link>)}
        <span style={{ width: 10 }} />
        {['', ...STATUSES].map((k) => <Link key={k} href={href(sp, { s: k || undefined, page: undefined })} className={(sp.s ?? '') === k ? 'on' : ''}>{k || 'Any stage'}{k && <b>{n((e) => e.status === k)}</b>}</Link>)}
      </div>

      {sp.v === 'board' ? (
        <div className="adm-board">
          {STATUSES.map((s) => { const col = shown.filter((e) => e.status === s); return (
            <section key={s} className="adm-col"><h3>{s}<span>{col.length}</span></h3>
              {col.map((e) => <Link key={e.id} href={href(sp, { e: e.id })} className="adm-cardlet"><b>{e.name}</b><small>{e.company || e.website || e.phone}</small><small>via {sourceLabel(e.origin, e.source)}</small><span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}><span className={`adm-badge ${e.type}`}>{e.type === 'solution' ? 'Solution' : 'Scan'}</span>{e.priority === 'hot' && <span className="adm-badge hot">Hot</span>}{e.score != null && <span className={`adm-score ${scoreCls(e.score)}`}>{e.score}</span>}</span></Link>)}
            </section>); })}
        </div>
      ) : null}

      <div className={open ? 'adm-split' : undefined}>
        {sp.v !== 'board' && (
          <div style={{ display: 'grid', gap: 14, minWidth: 0 }}>
            <div className="adm-tablewrap">
              <table className="adm-table">
                <thead><tr><th>Received</th><th>Name</th><th>Type</th><th>Came from</th><th>Result / wants</th><th>Stage</th><th><span className="sr-only">Details</span></th></tr></thead>
                <tbody>
                  {shown.map((e) => (
                    <tr key={e.id} className={e.id === sp.e ? 'sel' : undefined}>
                      <td className="adm-cell"><Link className="row" href={href(sp, { e: e.id })}>{short(e.createdAt)}</Link></td>
                      <td className="adm-cell"><Link className="row" href={href(sp, { e: e.id })}>{e.name}</Link> {e.priority === 'hot' && <span className="adm-badge hot">Hot</span>}<small>{e.company || e.website || e.phone}</small></td>
                      <td><span className={`adm-badge ${e.type}`}>{e.type === 'solution' ? 'Solution' : 'Scan'}</span></td>
                      <td className="adm-cell">{sourceLabel(e.origin, e.source)}{e.origin?.landingUrl ? <small>{landingPath(e.origin)}</small> : null}</td>
                      <td className="adm-cell">{e.type === 'solution' ? e.topic || '-' : e.score == null ? e.topic || '-' : e.score != null ? <span className={`adm-score ${scoreCls(e.score)}`}>{e.score}</span> : '-'}{e.type === 'scan' && e.exposureCr ? <small>up to {crore(e.exposureCr)}</small> : null}</td>
                      <td><span className={`adm-badge ${e.status}`}>{e.status}</span></td>
                      <td><Link className="adm-btn ghost sm" href={href(sp, { e: e.id })}>View</Link></td>
                    </tr>))}
                </tbody>
              </table>
              {!shown.length && <div className="adm-empty"><b>{all.length ? 'Nothing matches those filters' : 'No enquiries yet'}</b>{all.length ? 'Try clearing the search or filters.' : 'They appear here as soon as someone scans a site or asks for help.'}</div>}
            </div>
            {rows.length > PER && (
              <div className="adm-pager"><span>Showing {(page - 1) * PER + 1} to {Math.min(page * PER, rows.length)} of {rows.length}</span>
                <div>{page > 1 && <Link className="adm-btn ghost sm" href={href(sp, { page: String(page - 1) })}>Previous</Link>}{page < pages && <Link className="adm-btn ghost sm" href={href(sp, { page: String(page + 1) })}>Next</Link>}</div></div>)}
          </div>
        )}
        {open && <Detail e={open} sp={sp} />}
      </div>
    </Shell>
  );
}

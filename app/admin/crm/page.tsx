import Link from 'next/link';
import { Download, Mail, MessageCircle, Pencil, Phone, Plus, Trash2, X, ExternalLink } from 'lucide-react';
import { getEnquiry, listEnquiries, STATUSES, type Enquiry } from '@/lib/ps/crm';
import { filterEnquiries } from '@/lib/ps/admin-stats';
import { crore } from '@/lib/ps/dpdp-map';
import { landingPath, referrerHost, sourceLabel } from '@/lib/ps/origin';
import Shell from '../Shell';
import { bulkEnquiryAction, createEnquiryAction, deleteEnquiryAction, updateEnquiryAction, updateEnquiryFieldsAction } from '../actions';
import { ConfirmButton, SelectAll } from '../Confirm';

export const dynamic = 'force-dynamic';
type SP = { t?: string; s?: string; p?: string; q?: string; sort?: string; v?: string; page?: string; e?: string; new?: string; edit?: string; msg?: string; err?: string; n?: string };
const PER = 20;
const when = (iso: string) => new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' });
const short = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });
const href = (sp: SP, over: Partial<SP>) => { const m = { ...sp, ...over } as Record<string, string | undefined>; const q = Object.entries(m).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&'); return `/qwedsa/crm${q ? '?' + q : ''}`; };
const digits = (p: string) => { const d = p.replace(/\D/g, ''); return d.length === 10 ? '91' + d : d; };
const scoreCls = (n: number | null) => (n == null ? '' : n < 40 ? 'lo' : n < 70 ? 'mid' : 'hi');
const ALERT_LABEL: Record<string, string> = { whatsapp: 'WhatsApp', sms: 'SMS', ownerEmail: 'Email to you', visitorEmail: 'Email to visitor', clientWhatsapp: 'WhatsApp to visitor', clientSms: 'SMS to visitor', webhook: 'Chat webhook' };
const initials = (n: string) => n.trim().split(/\s+/).slice(0, 2).map((x) => x[0]?.toUpperCase() ?? '').join('') || '?';
const SOURCES = ['Phone call', 'WhatsApp', 'Email', 'Referral', 'Event or walk-in', 'Social media', 'Other'];
const MSG: Record<string, string> = { created: 'Lead added.', saved: 'Changes saved.', deleted: 'Lead deleted.', gone: 'That lead no longer exists.', none: 'Tick at least one lead first.' };

/** Add or edit a lead by hand. The same fields both ways. */
function LeadForm({ e, sp, back }: { e?: Enquiry; sp: SP; back: string }) {
  const edit = !!e;
  return (
    <aside className="adm-card adm-detail" aria-label={edit ? 'Edit lead' : 'Add a lead'}>
      <div className="adm-d-top"><h2>{edit ? 'Edit lead' : 'Add a lead'}</h2><Link href={href(sp, { new: undefined, edit: undefined })} className="adm-btn ghost sm" aria-label="Close form"><X size={16} aria-hidden /></Link></div>
      <p className="adm-sub" style={{ margin: '6px 0 16px' }}>{edit ? 'Fix a detail or update what they asked for.' : 'For a call, WhatsApp, referral or walk-in you want to track here.'}</p>
      <form action={edit ? updateEnquiryFieldsAction : createEnquiryAction} className="adm-form">
        {edit && <input type="hidden" name="id" value={e.id} />}<input type="hidden" name="back" value={back} />
        <div className="adm-field"><label htmlFor="f-type">Type</label>
          <select id="f-type" name="type" defaultValue={e?.type ?? 'scan'}><option value="scan">Scan enquiry (checked a site, shared details)</option><option value="solution">Solution enquiry (wants Bedre to fix something)</option></select></div>
        <div className="adm-two-f">
          <div className="adm-field"><label htmlFor="f-name">Name *</label><input id="f-name" name="name" type="text" defaultValue={e?.name} required minLength={2} maxLength={120} autoComplete="off" /></div>
          <div className="adm-field"><label htmlFor="f-phone">Phone *</label><input id="f-phone" name="phone" type="text" defaultValue={e?.phone} required maxLength={30} placeholder="+91 98765 43210" autoComplete="off" /></div>
        </div>
        <div className="adm-two-f">
          <div className="adm-field"><label htmlFor="f-email">Email</label><input id="f-email" name="email" type="text" defaultValue={e?.email} maxLength={200} placeholder="name@company.com" autoComplete="off" /></div>
          <div className="adm-field"><label htmlFor="f-co">Business</label><input id="f-co" name="company" type="text" defaultValue={e?.company} maxLength={150} autoComplete="off" /></div>
        </div>
        <div className="adm-field"><label htmlFor="f-web">Website</label><input id="f-web" name="website" type="text" defaultValue={e?.website} maxLength={300} placeholder="company.com" autoComplete="off" /></div>
        <div className="adm-field"><label htmlFor="f-topic">Wants help with</label><input id="f-topic" name="topic" type="text" defaultValue={e?.topic} maxLength={160} placeholder="For example: breach response plan" autoComplete="off" /></div>
        <div className="adm-field"><label htmlFor="f-msg">Message or details</label><textarea id="f-msg" name="message" rows={3} defaultValue={e?.message} maxLength={900} /></div>
        <div className="adm-two-f">
          <div className="adm-field"><label htmlFor="f-time">Best time to call</label><select id="f-time" name="preferredTime" defaultValue={e?.preferredTime ?? ''}><option value="">Any time</option><option>Morning</option><option>Afternoon</option><option>Evening</option></select></div>
          <div className="adm-field"><label htmlFor="f-pri">Priority</label><select id="f-pri" name="priority" defaultValue={e?.priority ?? 'warm'}><option value="warm">Warm</option><option value="hot">Hot</option></select></div>
        </div>
        <div className="adm-two-f">
          <div className="adm-field"><label htmlFor="f-st">Stage</label><select id="f-st" name="status" defaultValue={e?.status ?? 'new'}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          {edit
            ? <div className="adm-field"><label htmlFor="f-src">Source</label><input id="f-src" name="source" type="text" defaultValue={e.source} maxLength={80} autoComplete="off" /></div>
            : <div className="adm-field"><label htmlFor="f-skind">Where did this lead come from?</label><select id="f-skind" name="sourceKind" defaultValue="Phone call">{SOURCES.map((s) => <option key={s}>{s}</option>)}</select></div>}
        </div>
        {!edit && <div className="adm-field"><label htmlFor="f-sother">If “Other”, say where</label><input id="f-sother" name="sourceOther" type="text" maxLength={60} autoComplete="off" /></div>}
        {!edit && <div className="adm-field"><label htmlFor="f-note">First note (optional)</label><textarea id="f-note" name="note" rows={2} maxLength={500} placeholder="Spoke on the phone, wants a call on Monday…" /></div>}
        <div className="adm-testrow"><button className="adm-btn" type="submit">{edit ? 'Save changes' : 'Add lead'}</button><Link className="adm-btn ghost" href={href(sp, { new: undefined, edit: undefined })}>Cancel</Link></div>
      </form>
    </aside>
  );
}

function Detail({ e, sp }: { e: Enquiry; sp: SP }) {
  const back = href(sp, { e: undefined, edit: undefined, new: undefined }).split('?')[1] ?? '';
  const timeline = [{ at: e.createdAt, text: e.type === 'solution' ? 'Asked for help' : e.source?.startsWith('Manual') ? 'Added by hand' : 'Scanned and gave details', note: false }, ...e.notes.map((n) => ({ at: n.at, text: n.text, note: true }))].sort((a, b) => b.at.localeCompare(a.at));
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
      <div className="adm-testrow" style={{ marginBottom: 14 }}>
        <Link className="adm-btn ghost sm" href={href(sp, { e: e.id, edit: '1', new: undefined })}><Pencil size={14} aria-hidden /> Edit</Link>
        <form action={deleteEnquiryAction}><input type="hidden" name="id" value={e.id} /><input type="hidden" name="back" value={back} />
          <ConfirmButton className="adm-btn danger sm" message={`Delete ${e.name}? This cannot be undone.`}><Trash2 size={14} aria-hidden /> Delete</ConfirmButton></form>
      </div>
      <dl className="adm-dl">
        <dt>Phone</dt><dd>{e.phone} {e.phoneVerified ? <span className="adm-badge ok"><i />Verified by WhatsApp</span> : null}</dd>
        <dt>Email</dt><dd>{e.email || '-'}</dd>
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
        {e.origin?.referrer ? <><dt>Came from</dt><dd><a href={e.origin.referrer} target="_blank" rel="noopener" style={{ color: 'var(--a)', textDecoration: 'underline' }}>{referrerHost(e.origin) || e.origin.referrer}</a></dd></> : e.origin?.landingUrl ? <><dt>Came from</dt><dd>Typed the address or used a bookmark</dd></> : null}
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
  const raw = await searchParams;
  const sp: SP = { ...raw, msg: undefined, err: undefined, n: undefined }; // notices are shown once, not carried into links
  const all = await listEnquiries();
  const rows = filterEnquiries(all, sp);
  const page = Math.max(1, Number(sp.page) || 1), pages = Math.max(1, Math.ceil(rows.length / PER));
  const shown = sp.v === 'board' ? rows : rows.slice((page - 1) * PER, page * PER);
  const open = sp.e ? await getEnquiry(sp.e) : null;
  const n = (f: (e: Enquiry) => boolean) => all.filter(f).length;
  const exportHref = `/qwedsa/crm/export${href(sp, { e: undefined, page: undefined, v: undefined, new: undefined, edit: undefined }).split('crm')[1] ?? ''}`;
  const back = href(sp, { e: undefined, new: undefined, edit: undefined }).split('?')[1] ?? '';
  const panel = sp.new ? <LeadForm sp={sp} back={back} /> : open && sp.edit ? <LeadForm e={open} sp={sp} back={back} /> : open ? <Detail e={open} sp={sp} /> : null;
  const notice = raw.err ? { ok: false, text: raw.err } : raw.msg === 'bulk-deleted' ? { ok: true, text: `${Number(raw.n) || 0} lead${Number(raw.n) === 1 ? '' : 's'} deleted.` } : raw.msg === 'bulk-moved' ? { ok: true, text: `${Number(raw.n) || 0} lead${Number(raw.n) === 1 ? '' : 's'} moved.` } : raw.msg && MSG[raw.msg] ? { ok: raw.msg !== 'gone' && raw.msg !== 'none', text: MSG[raw.msg] } : null;

  return (
    <Shell active="crm" title="Enquiries" sub="Scan enquiries (checked a site, shared details) and solution enquiries (asked Bedre to fix a gap)."
      actions={<><Link href={href(sp, { new: '1', e: undefined, edit: undefined })} className="adm-btn"><Plus size={16} aria-hidden /> Add lead</Link><a href={exportHref} className="adm-btn ghost"><Download size={16} aria-hidden /> Export CSV</a></>}>

      {notice && <div className={`adm-msg ${notice.ok ? 'ok' : 'bad'}`} role="status">{notice.text}</div>}

      <div className="adm-bar">
        <form action="/qwedsa/crm" method="get">
          <input className="search" type="search" name="q" defaultValue={sp.q ?? ''} placeholder="Search name, phone, email, business…" aria-label="Search enquiries" />
          {sp.t && <input type="hidden" name="t" value={sp.t} />}{sp.s && <input type="hidden" name="s" value={sp.s} />}{sp.v && <input type="hidden" name="v" value={sp.v} />}
          <select name="p" defaultValue={sp.p ?? ''} aria-label="Priority"><option value="">Any priority</option><option value="hot">Hot</option><option value="warm">Warm</option></select>
          <select name="sort" defaultValue={sp.sort ?? ''} aria-label="Sort"><option value="">Newest first</option><option value="old">Oldest first</option><option value="score">Lowest score first</option><option value="exposure">Highest fine first</option></select>
          <button className="adm-btn ghost" type="submit">Apply</button>
        </form>
        <div className="adm-seg" role="group" aria-label="View"><Link href={href(sp, { v: undefined, page: undefined })} className={sp.v !== 'board' ? 'on' : ''}>List</Link><Link href={href(sp, { v: 'board', e: undefined, new: undefined, edit: undefined })} className={sp.v === 'board' ? 'on' : ''}>Board</Link></div>
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

      <div className={panel ? 'adm-split' : undefined}>
        {sp.v !== 'board' && (
          <form action={bulkEnquiryAction} style={{ display: 'grid', gap: 14, minWidth: 0 }}>
            <input type="hidden" name="back" value={back} />
            <div className="adm-bulk">
              <span className="adm-sub">With the ticked leads:</span>
              <select name="status" aria-label="Move to stage" defaultValue="contacted">{STATUSES.map((s) => <option key={s} value={s}>Move to {s}</option>)}</select>
              <button type="submit" name="op" value="stage" className="adm-btn ghost sm">Apply</button>
              <ConfirmButton name="op" value="delete" className="adm-btn danger sm" message="Delete all the ticked leads? This cannot be undone."><Trash2 size={14} aria-hidden /> Delete ticked</ConfirmButton>
            </div>
            <div className="adm-tablewrap">
              <table className="adm-table">
                <thead><tr><th style={{ width: 36 }}><SelectAll /></th><th>Received</th><th>Name</th><th>Type</th><th>Came from</th><th>Result / wants</th><th>Stage</th><th><span className="sr-only">Details</span></th></tr></thead>
                <tbody>
                  {shown.map((e) => (
                    <tr key={e.id} className={e.id === sp.e ? 'sel' : undefined}>
                      <td><input type="checkbox" name="ids" value={e.id} aria-label={`Select ${e.name}`} /></td>
                      <td className="adm-cell"><Link className="row" href={href(sp, { e: e.id, edit: undefined, new: undefined })}>{short(e.createdAt)}</Link></td>
                      <td className="adm-cell"><Link className="row" href={href(sp, { e: e.id, edit: undefined, new: undefined })}>{e.name}</Link> {e.priority === 'hot' && <span className="adm-badge hot">Hot</span>}<small>{e.company || e.website || e.phone}</small></td>
                      <td><span className={`adm-badge ${e.type}`}>{e.type === 'solution' ? 'Solution' : 'Scan'}</span></td>
                      <td className="adm-cell">{sourceLabel(e.origin, e.source)}{e.origin?.landingUrl ? <small>{landingPath(e.origin)}</small> : null}</td>
                      <td className="adm-cell">{e.type === 'solution' ? e.topic || '-' : e.score == null ? e.topic || '-' : <span className={`adm-score ${scoreCls(e.score)}`}>{e.score}</span>}{e.type === 'scan' && e.exposureCr ? <small>up to {crore(e.exposureCr)}</small> : null}</td>
                      <td><span className={`adm-badge ${e.status}`}>{e.status}</span></td>
                      <td style={{ whiteSpace: 'nowrap' }}><Link className="adm-btn ghost sm" href={href(sp, { e: e.id, edit: undefined, new: undefined })}>View</Link> <Link className="adm-btn ghost sm" href={href(sp, { e: e.id, edit: '1', new: undefined })} aria-label={`Edit ${e.name}`}><Pencil size={14} aria-hidden /></Link></td>
                    </tr>))}
                </tbody>
              </table>
              {!shown.length && <div className="adm-empty"><b>{all.length ? 'Nothing matches those filters' : 'No enquiries yet'}</b>{all.length ? 'Try clearing the search or filters.' : 'They appear here as soon as someone scans a site or asks for help. You can also add one by hand.'}</div>}
            </div>
            {rows.length > PER && (
              <div className="adm-pager"><span>Showing {(page - 1) * PER + 1} to {Math.min(page * PER, rows.length)} of {rows.length}</span>
                <div>{page > 1 && <Link className="adm-btn ghost sm" href={href(sp, { page: String(page - 1) })}>Previous</Link>}{page < pages && <Link className="adm-btn ghost sm" href={href(sp, { page: String(page + 1) })}>Next</Link>}</div></div>)}
          </form>
        )}
        {panel}
      </div>
    </Shell>
  );
}

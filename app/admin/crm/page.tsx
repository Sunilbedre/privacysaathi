import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cmsEnabled, isCmsAuthed } from '@/lib/cms/auth';
import { getEnquiry, listEnquiries, STATUSES, type Enquiry } from '@/lib/ps/crm';
import { crore } from '@/lib/ps/dpdp-map';
import { logoutAction, updateEnquiryAction } from '../actions';

export const dynamic = 'force-dynamic';
const TYPE: Record<string, string> = { scan: 'Scan enquiry', solution: 'Solution enquiry' };
const when = (iso: string) => new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
const q = (o: Record<string, string | undefined>) => '?' + Object.entries(o).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&');
const chip = (bg: string, fg: string): React.CSSProperties => ({ background: bg, color: fg, borderRadius: 999, padding: '2px 10px', fontSize: '.75rem', fontWeight: 700, whiteSpace: 'nowrap' });

export default async function CrmPage({ searchParams }: { searchParams: Promise<{ t?: string; s?: string; e?: string }> }) {
  if (!cmsEnabled() || !(await isCmsAuthed())) redirect('/qwedsa/login');
  const sp = await searchParams;
  const all = await listEnquiries();
  const rows = all.filter((e) => (!sp.t || e.type === sp.t) && (!sp.s || e.status === sp.s));
  const open: Enquiry | null = sp.e ? await getEnquiry(sp.e) : null;
  const n = (t?: string) => all.filter((e) => !t || e.type === t).length;

  return (
    <>
      <header className="cms-top"><b>Privacy Saathi CRM</b><nav><Link href="/qwedsa">Admin home</Link><Link href="/qwedsa/settings">Settings</Link>
        <form action={logoutAction} style={{ display: 'inline' }}><button type="submit" className="cms-btn secondary" style={{ height: 32, padding: '0 14px', fontSize: '.82rem' }}>Sign out</button></form></nav></header>
      <div className="cms-card" style={{ maxWidth: 1100, margin: '24px auto' }}>
        <h1 style={{ marginTop: 0 }}>Enquiries</h1>
        <p style={{ color: '#5a6283' }}>Two kinds: <b>Scan enquiry</b> (someone checked a site and shared details to see the result) and <b>Solution enquiry</b> (someone asked Bedre to help with a specific gap).</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '14px 0' }}>
          {[['', `All (${n()})`], ['scan', `Scan enquiries (${n('scan')})`], ['solution', `Solution enquiries (${n('solution')})`]].map(([k, l]) => <Link key={k} href={`/qwedsa/crm${q({ t: k, s: sp.s })}`} className={`cms-btn${(sp.t ?? '') === k ? '' : ' secondary'}`} style={{ height: 34, padding: '0 14px', fontSize: '.85rem' }}>{l}</Link>)}
          <span style={{ width: 16 }} />
          {['', ...STATUSES].map((k) => <Link key={k} href={`/qwedsa/crm${q({ t: sp.t, s: k })}`} className={`cms-btn${(sp.s ?? '') === k ? '' : ' secondary'}`} style={{ height: 34, padding: '0 12px', fontSize: '.82rem', textTransform: 'capitalize' }}>{k || 'Any stage'}</Link>)}
        </div>

        {open && (
          <div style={{ border: '2px solid #4F4FD9', borderRadius: 12, padding: 18, margin: '16px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0 }}>{open.name} <span style={chip(open.type === 'solution' ? '#FFF0D6' : '#E6E6FB', open.type === 'solution' ? '#7A4B00' : '#3030A8')}>{TYPE[open.type]}</span> {open.priority === 'hot' && <span style={chip('#FDE3E3', '#A11')}>HOT</span>}</h2>
              <Link href={`/qwedsa/crm${q({ t: sp.t, s: sp.s })}`}>Close</Link>
            </div>
            <table style={{ margin: '12px 0', fontSize: '.92rem' }}><tbody>
              {([['Phone', <a key="p" href={`tel:${open.phone.replace(/[^\d+]/g, '')}`}>{open.phone}</a>], ['Email', <a key="e" href={`mailto:${open.email}`}>{open.email}</a>], ['Business', open.company || open.website || '-'], ['Website', open.website || 'none'],
                ['Result', `${open.score ?? '-'}/100 · ${open.band}${open.exposureCr ? ` · up to ${crore(open.exposureCr)}` : ''}`], ['Wants help with', open.topic || '-'], ['Message', open.message || '-'], ['Best time', open.preferredTime || '-'],
                ['Source', `${open.source}${open.utm ? ` · ${open.utm}` : ''}`], ['Received', when(open.createdAt)], ['Alerts', Object.entries(open.alerts).map(([k, v]) => `${k}: ${v}`).join(' · ') || '-'],
              ] as [string, React.ReactNode][]).map(([k, v]) => <tr key={k}><td style={{ padding: '4px 18px 4px 0', color: '#5a6283', verticalAlign: 'top' }}>{k}</td><td>{v}</td></tr>)}
            </tbody></table>
            {open.scanId && <p><Link href={`/report/${open.scanId}`} target="_blank">Open their report ↗</Link></p>}
            <form action={updateEnquiryAction} style={{ display: 'grid', gap: 10, maxWidth: 520 }}>
              <input type="hidden" name="id" value={open.id} />
              <label>Stage <select name="status" defaultValue={open.status} style={{ marginLeft: 8 }}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
              <label>Add a note<textarea name="note" rows={2} placeholder="Called, will revert Monday…" style={{ width: '100%' }} /></label>
              <button className="cms-btn" type="submit" style={{ justifySelf: 'start' }}>Save</button>
            </form>
            {open.notes.length > 0 && <ul style={{ marginTop: 14 }}>{[...open.notes].reverse().map((x) => <li key={x.at}><small style={{ color: '#5a6283' }}>{when(x.at)}</small> {x.text}</li>)}</ul>}
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.9rem' }}>
            <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #d6dcef' }}>{['When', 'Type', 'Name', 'Phone', 'Business', 'Result / wants', 'Stage'].map((h) => <th key={h} style={{ padding: '8px 10px' }}>{h}</th>)}</tr></thead>
            <tbody>{rows.map((e) => (
              <tr key={e.id} style={{ borderBottom: '1px solid #e8ecf7', background: e.id === sp.e ? '#F1F1FE' : undefined }}>
                <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}><Link href={`/qwedsa/crm${q({ t: sp.t, s: sp.s, e: e.id })}`}>{when(e.createdAt)}</Link></td>
                <td style={{ padding: '8px 10px' }}><span style={chip(e.type === 'solution' ? '#FFF0D6' : '#E6E6FB', e.type === 'solution' ? '#7A4B00' : '#3030A8')}>{TYPE[e.type]}</span></td>
                <td style={{ padding: '8px 10px' }}>{e.name} {e.priority === 'hot' && <span style={chip('#FDE3E3', '#A11')}>HOT</span>}</td>
                <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{e.phone}</td>
                <td style={{ padding: '8px 10px' }}>{e.company || e.website || '-'}</td>
                <td style={{ padding: '8px 10px' }}>{e.type === 'solution' ? e.topic : `${e.score ?? '-'}/100`}</td>
                <td style={{ padding: '8px 10px', textTransform: 'capitalize' }}>{e.status}</td>
              </tr>))}</tbody>
          </table>
          {!rows.length && <p style={{ color: '#5a6283', padding: 16 }}>No enquiries here yet.</p>}
        </div>
      </div>
    </>
  );
}

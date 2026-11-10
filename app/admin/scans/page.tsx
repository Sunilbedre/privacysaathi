import Link from 'next/link';
import { listScans } from '@/lib/ps/store';
import Shell from '../Shell';

export const dynamic = 'force-dynamic';
const short = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });
const cls = (n: number) => (n < 40 ? 'lo' : n < 70 ? 'mid' : 'hi');
const PER = 30;

export default async function ScansPage({ searchParams }: { searchParams: Promise<{ page?: string; f?: string }> }) {
  const sp = await searchParams;
  const all = (await listScans()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const f = sp.f ?? '';
  const rows = all.filter((s) => (f === 'lead' ? s.leadCaptured : f === 'nolead' ? s.status === 'done' && !s.leadCaptured : f === 'error' ? s.status === 'error' : true));
  const page = Math.max(1, Number(sp.page) || 1), pages = Math.max(1, Math.ceil(rows.length / PER));
  const link = (o: Record<string, string | undefined>) => { const m = { f: sp.f, ...o } as Record<string, string | undefined>; const q = Object.entries(m).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join('&'); return `/qwedsa/scans${q ? '?' + q : ''}`; };
  const chips: [string, string, number][] = [['', 'All', all.length], ['lead', 'Gave details', all.filter((s) => s.leadCaptured).length], ['nolead', 'Left before details', all.filter((s) => s.status === 'done' && !s.leadCaptured).length], ['error', 'Failed', all.filter((s) => s.status === 'error').length]];

  return (
    <Shell active="scans" title="Scans" sub="Every website check run on the public site. Reports are kept for the retention period, then removed.">
      <div className="adm-chips">{chips.map(([k, l, c]) => <Link key={k} href={link({ f: k || undefined, page: undefined })} className={f === k ? 'on' : ''}>{l}<b>{c}</b></Link>)}</div>
      <div className="adm-tablewrap">
        <table className="adm-table">
          <thead><tr><th>Started</th><th>Website</th><th>Score</th><th>Details given</th><th>Status</th><th /></tr></thead>
          <tbody>
            {rows.slice((page - 1) * PER, page * PER).map((s) => {
              return (
                <tr key={s.id}>
                  <td className="adm-cell">{short(s.createdAt)}</td>
                  <td className="adm-cell"><b>{s.websiteless ? s.company || 'No website' : s.domain}</b>{s.industry && <small>{s.industry}</small>}</td>
                  <td>{s.result ? <span className="adm-score">{s.result.pagesScanned} pg</span> : '-'}</td>
                  <td><span className={`adm-badge ${s.leadCaptured ? 'ok' : 'off'}`}>{s.leadCaptured ? 'Yes' : 'No'}</span></td>
                  <td><span className={`adm-badge ${s.status === 'done' ? 'ok' : s.status === 'error' ? 'bad' : 'contacted'}`}>{s.status}</span>{s.error && <small style={{ display: 'block', color: 'var(--bad)' }}>{s.error.slice(0, 60)}</small>}</td>
                  <td><Link className="adm-btn ghost sm" href={`/ps/report/${s.id}`} target="_blank">Report</Link></td>
                </tr>);
            })}
          </tbody>
        </table>
        {!rows.length && <div className="adm-empty"><b>No scans here yet</b>Scans appear as visitors use the checker.</div>}
      </div>
      {rows.length > PER && <div className="adm-pager"><span>Page {page} of {pages}</span><div>{page > 1 && <Link className="adm-btn ghost sm" href={link({ page: String(page - 1) })}>Previous</Link>}{page < pages && <Link className="adm-btn ghost sm" href={link({ page: String(page + 1) })}>Next</Link>}</div></div>}
    </Shell>
  );
}

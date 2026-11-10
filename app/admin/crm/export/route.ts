import { isCmsAuthed } from '@/lib/cms/auth';
import { listEnquiries } from '@/lib/ps/crm';
import { filterEnquiries, toCsv } from '@/lib/ps/admin-stats';

export const dynamic = 'force-dynamic';

/** CSV of the enquiries that match the current filters. Signed-in admin only. */
export async function GET(req: Request) {
  if (!(await isCmsAuthed())) return new Response('Not found', { status: 404 });
  const u = new URL(req.url).searchParams;
  const rows = filterEnquiries(await listEnquiries(), { t: u.get('t') ?? undefined, s: u.get('s') ?? undefined, p: u.get('p') ?? undefined, q: u.get('q') ?? undefined, sort: u.get('sort') ?? undefined });
  return new Response(toCsv(rows), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="privacy-saathi-enquiries-${new Date().toISOString().slice(0, 10)}.csv"`, 'cache-control': 'no-store' } });
}

import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import type { Origin } from '@/lib/ps/origin';

/**
 * The Privacy Saathi CRM. One file per enquiry (atomic writes) under <data dir>/crm.
 * Two kinds of enquiry:
 *  - scan:     someone searched / scanned and gave their details to see the result
 *  - solution: someone asked for help with a specific gap ("View solution" then "Request help")
 */
export type EnquiryType = 'scan' | 'solution';
export const STATUSES = ['new', 'contacted', 'qualified', 'won', 'lost'] as const;
export type EnquiryStatus = (typeof STATUSES)[number];
export interface Enquiry {
  id: string; type: EnquiryType; createdAt: string; updatedAt: string; status: EnquiryStatus;
  name: string; phone: string; email: string; company: string; website: string; scanId: string;
  score: number | null; band: string; priority: 'hot' | 'warm'; exposureCr: number; gaps: number;
  topic: string; message: string; preferredTime: string; source: string; utm: string;
  notes: { at: string; text: string }[];
  phoneVerified?: boolean; // mobile confirmed with a WhatsApp code
  origin?: Origin; // where the visitor came from, collected silently
  alerts: Record<string, string>; // channel -> sent | failed | skipped | outbox
}

const dir = () => path.join(process.env.PS_DATA_DIR || path.join(process.env.LEADS_DIR || path.join(process.cwd(), '.data'), 'ps'), 'crm');
const ok = (id: string) => /^[A-Za-z0-9_-]{8,40}$/.test(id);
const f = (id: string) => path.join(dir(), `${id}.json`);
export const newEnquiryId = () => randomBytes(6).toString('base64url');

async function write(e: Enquiry) {
  await fs.mkdir(dir(), { recursive: true });
  const tmp = `${f(e.id)}.${randomBytes(3).toString('hex')}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(e)); await fs.rename(tmp, f(e.id));
}
export async function createEnquiry(x: Omit<Enquiry, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'notes' | 'alerts'>): Promise<Enquiry> {
  const now = new Date().toISOString();
  const e: Enquiry = { ...x, id: newEnquiryId(), createdAt: now, updatedAt: now, status: 'new', notes: [], alerts: {} };
  await write(e); return e;
}
export async function getEnquiry(id: string): Promise<Enquiry | null> {
  if (!ok(id)) return null;
  try { return JSON.parse(await fs.readFile(f(id), 'utf8')) as Enquiry; } catch { return null; }
}
export async function listEnquiries(): Promise<Enquiry[]> {
  try {
    const out: Enquiry[] = [];
    for (const n of (await fs.readdir(dir())).filter((x) => x.endsWith('.json'))) { const e = await getEnquiry(n.slice(0, -5)); if (e) out.push(e); }
    return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch { return []; }
}
export async function patchEnquiry(id: string, patch: { status?: EnquiryStatus; note?: string; alerts?: Record<string, string> }): Promise<Enquiry | null> {
  const e = await getEnquiry(id); if (!e) return null;
  if (patch.status && (STATUSES as readonly string[]).includes(patch.status)) e.status = patch.status;
  if (patch.note?.trim()) e.notes.push({ at: new Date().toISOString(), text: patch.note.trim().slice(0, 1000) });
  if (patch.alerts) e.alerts = { ...e.alerts, ...patch.alerts };
  e.updatedAt = new Date().toISOString();
  await write(e); return e;
}

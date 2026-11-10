import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomBytes, createHash } from 'node:crypto';
import type { ScanResult } from '@/lib/scan/types';
import type { Answers } from '@/lib/scan/score';
import type { Origin } from '@/lib/ps/origin';

export interface ScanRecord {
  id: string; domain: string; url: string; deep: boolean; status: 'running' | 'done' | 'error';
  step: string; pct: number; createdAt: string; expiresAt: string; ipHash: string; error?: string;
  result?: ScanResult; answers?: Answers; noOfficialEmail?: boolean; company?: string; leadCaptured?: boolean; industry?: string; size?: string; websiteless?: boolean; origin?: Origin;
}

/** Repository layer. Today: JSON files on disk (PS_DATA_DIR). Swap this file for Postgres or SQLite later. */
const dir = () => process.env.PS_DATA_DIR || path.join(process.env.LEADS_DIR || path.join(process.cwd(), '.data'), 'ps');
const file = (id: string) => path.join(dir(), 'scans', `${id}.json`);
export const retentionDays = () => Math.max(1, Number(process.env.PS_RETENTION_DAYS) || 90);

export const newId = () => randomBytes(24).toString('base64url');
const validId = (id: string) => /^[A-Za-z0-9_-]{32}$/.test(id);
export const hashIp = (ip: string) => createHash('sha256').update(ip + (process.env.PS_SECRET ?? 'dev')).digest('hex').slice(0, 16);

export async function putScan(r: ScanRecord) {
  await fs.mkdir(path.join(dir(), 'scans'), { recursive: true });
  const tmp = `${file(r.id)}.${randomBytes(4).toString('hex')}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(r));
  await fs.rename(tmp, file(r.id)); // atomic: readers never see a half-written file
}
export async function getScan(id: string): Promise<ScanRecord | null> {
  if (!validId(id)) return null;
  try {
    const r = JSON.parse(await fs.readFile(file(id), 'utf8')) as ScanRecord;
    if (Date.parse(r.expiresAt) < Date.now()) { await fs.rm(file(id), { force: true }); return null; }
    return r;
  } catch { return null; }
}
const chains = new Map<string, Promise<unknown>>();
/** Updates for one scan run one after another so progress ticks cannot overwrite the final result. */
export function updateScan(id: string, patch: Partial<ScanRecord>): Promise<void> {
  const next = (chains.get(id) ?? Promise.resolve()).then(async () => {
    const r = await getScan(id);
    if (r) await putScan({ ...r, ...patch });
  }).catch(() => {});
  chains.set(id, next);
  void next.then(() => { if (chains.get(id) === next) chains.delete(id); });
  return next;
}
export async function deleteScan(id: string) { if (validId(id)) await fs.rm(file(id), { force: true }); }

export async function listScans(): Promise<ScanRecord[]> {
  try {
    const names = await fs.readdir(path.join(dir(), 'scans'));
    const out: ScanRecord[] = [];
    for (const n of names.filter((x) => x.endsWith('.json'))) { const r = await getScan(n.replace(/\.json$/, '')); if (r) out.push(r); }
    return out;
  } catch { return []; }
}

/** Append-only JSON lines (leads, events). Swap for tables when the database is chosen. */
export type LineFile = 'leads' | 'events' | 'outbox' | 'followups' | 'suppress';
export async function appendLine(name: LineFile, obj: unknown) {
  await fs.mkdir(dir(), { recursive: true });
  await fs.appendFile(path.join(dir(), `${name}.jsonl`), JSON.stringify(obj) + '\n');
}
export async function readLines<T = Record<string, unknown>>(name: LineFile): Promise<T[]> {
  try { return (await fs.readFile(path.join(dir(), `${name}.jsonl`), 'utf8')).split('\n').filter(Boolean).map((l) => JSON.parse(l) as T); } catch { return []; }
}

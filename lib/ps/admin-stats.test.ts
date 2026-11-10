// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { filterEnquiries, toCsv } from './admin-stats';
import type { Enquiry } from './crm';

const mk = (o: Partial<Enquiry>): Enquiry => ({ id: 'id' + Math.random().toString(36).slice(2, 10), type: 'scan', createdAt: '2026-11-10T05:00:00.000Z', updatedAt: '', status: 'new', name: 'A', phone: '9876500000', email: 'a@x.in', company: '', website: '', scanId: '', score: 50, band: 'ok', priority: 'warm', exposureCr: 50, gaps: 1, topic: '', message: '', preferredTime: '', source: '', utm: '', notes: [], alerts: {}, ...o });

describe('filterEnquiries', () => {
  const rows = [mk({ name: 'Anita Rao', company: 'Rao Textiles', score: 20, priority: 'hot' }), mk({ name: 'Rohit', type: 'solution', status: 'won', topic: 'Breach plan', score: null }), mk({ name: 'Meera', phone: '+91 98111 22222' })];
  it('filters by type, stage and priority', () => {
    expect(filterEnquiries(rows, { t: 'solution' })).toHaveLength(1);
    expect(filterEnquiries(rows, { s: 'won' })[0].name).toBe('Rohit');
    expect(filterEnquiries(rows, { p: 'hot' })[0].name).toBe('Anita Rao');
  });
  it('searches name, phone, business and topic', () => {
    expect(filterEnquiries(rows, { q: 'textiles' })).toHaveLength(1);
    expect(filterEnquiries(rows, { q: '98111' })[0].name).toBe('Meera');
    expect(filterEnquiries(rows, { q: 'breach' })[0].name).toBe('Rohit');
  });
  it('sorts lowest score first', () => { expect(filterEnquiries(rows, { sort: 'score' })[0].name).toBe('Anita Rao'); });
});

describe('toCsv', () => {
  it('quotes commas, quotes and new lines so Excel keeps the columns', () => {
    const csv = toCsv([mk({ name: 'Rao, "Anita"', message: 'line1\nline2' })]);
    expect(csv).toContain('"Rao, ""Anita"""');
    expect(csv).toContain('"line1\nline2"');
    expect(csv.split('\n')[0]).toContain('Received,Type,Stage');
  });
});

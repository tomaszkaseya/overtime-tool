import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

const createSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hours: z.number().positive().max(24),
  note: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  const user = await requireAuth();
  const json = await req.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const db = getDb();
  // Prevent duplicate entries per user per date
  const dup = db.prepare('SELECT id FROM overtime_entries WHERE user_id = ? AND entry_date = ?').get(user.id, parsed.data.date) as any;
  if (dup) return NextResponse.json({ error: 'Entry already exists for date' }, { status: 409 });
  const info = db.prepare('INSERT INTO overtime_entries (user_id, entry_date, hours, note) VALUES (?, ?, ?, ?)')
    .run(user.id, parsed.data.date, parsed.data.hours, parsed.data.note || null);
  return NextResponse.json({ id: Number(info.lastInsertRowid) });
}

export async function GET(req: Request) {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month'); // YYYY-MM
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: 'month=YYYY-MM is required' }, { status: 400 });
  }
  const start = `${month}-01`;
  const end = `${month}-31`;
  const db = getDb();
  const rows = db.prepare(`
    SELECT id, entry_date as date, hours, note, status
    FROM overtime_entries
    WHERE user_id = ? AND entry_date BETWEEN ? AND ?
    ORDER BY entry_date ASC
  `).all(user.id, start, end) as any[];
  return NextResponse.json({ entries: rows });
}



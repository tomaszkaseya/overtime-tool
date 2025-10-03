import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb, userHasOpenPeriod } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { computeOvertimeSplit, isValidDateYmd, isValidTimeHm } from '@/lib/overtime';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  date: z.string().refine(isValidDateYmd),
  startTime: z.string().refine(isValidTimeHm),
  endTime: z.string().refine(isValidTimeHm),
  isPublicHoliday: z.boolean().optional(),
  isDesignatedDayOff: z.boolean().optional(),
  note: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }
  const json = await req.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  // Enforce open period
  if (!userHasOpenPeriod(user.id, parsed.data.date)) {
    return NextResponse.json({ error: 'OVERTIME_PERIOD_NOT_OPEN' }, { status: 403 });
  }
  const split = computeOvertimeSplit({
    date: parsed.data.date,
    startTime: parsed.data.startTime,
    endTime: parsed.data.endTime,
    isPublicHoliday: parsed.data.isPublicHoliday,
    isDesignatedDayOff: parsed.data.isDesignatedDayOff,
  });

  const db = getDb();
  // Prevent duplicate entries per user per date
  const dup = db.prepare('SELECT id FROM overtime_entries WHERE user_id = ? AND entry_date = ?').get(user.id, parsed.data.date) as any;
  if (dup) return NextResponse.json({ error: 'Entry already exists for date' }, { status: 409 });
  const hours = split.totalMinutes / 60;
  const info = db.prepare(`
    INSERT INTO overtime_entries (user_id, entry_date, hours, start_time, end_time, minutes_150, minutes_200, is_public_holiday, is_designated_day_off, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .run(
      user.id,
      parsed.data.date,
      hours,
      parsed.data.startTime,
      parsed.data.endTime,
      split.minutes150,
      split.minutes200,
      parsed.data.isPublicHoliday ? 1 : 0,
      parsed.data.isDesignatedDayOff ? 1 : 0,
      parsed.data.note || null
    );
  return NextResponse.json({ id: Number(info.lastInsertRowid) });
}

export async function GET(req: Request) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month'); // YYYY-MM
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: 'month=YYYY-MM is required' }, { status: 400 });
  }
  const start = `${month}-01`;
  const end = `${month}-31`;
  const db = getDb();
  const rows = db.prepare(`
    SELECT id, entry_date as date, hours, start_time as startTime, end_time as endTime,
      minutes_150 as minutes150, minutes_200 as minutes200,
      is_public_holiday as isPublicHoliday, is_designated_day_off as isDesignatedDayOff,
      note, status
    FROM overtime_entries
    WHERE user_id = ? AND entry_date BETWEEN ? AND ?
    ORDER BY entry_date ASC
  `).all(user.id, start, end) as any[];
  return NextResponse.json({ entries: rows });
}

export async function DELETE(req: Request) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const idParam = searchParams.get('id');
  const id = idParam ? Number(idParam) : NaN;
  if (!id || !Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }
  const db = getDb();
  const row = db.prepare('SELECT id FROM overtime_entries WHERE id = ? AND user_id = ?').get(id, user.id) as any;
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  db.prepare('DELETE FROM overtime_entries WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}



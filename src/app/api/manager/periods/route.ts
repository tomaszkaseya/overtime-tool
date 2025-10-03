import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb, getOrCreateManagersTeam } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

const createSchema = z.object({
  userId: z.number().int().positive(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(req: Request) {
  const user = await requireAuth();
  if (user.role !== 'manager') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const json = await req.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { userId, startDate, endDate } = parsed.data;
  if (endDate < startDate) return NextResponse.json({ error: 'endDate must be >= startDate' }, { status: 400 });

  const db = getDb();
  const team = getOrCreateManagersTeam(user.id);
  const member = db.prepare(`
    SELECT u.id FROM users u
    JOIN team_members tm ON tm.user_id = u.id
    WHERE tm.team_id = ? AND u.id = ?
  `).get(team.id, userId) as any;
  if (!member) return NextResponse.json({ error: 'Not a team member' }, { status: 404 });

  // Optional: prevent overlapping periods by merging or rejecting
  const overlap = db.prepare(`
    SELECT 1 FROM overtime_periods
    WHERE user_id = ? AND NOT (end_date < ? OR start_date > ?)
    LIMIT 1
  `).get(userId, startDate, endDate) as any;
  if (overlap) return NextResponse.json({ error: 'Overlapping period exists' }, { status: 409 });

  const info = db.prepare(`
    INSERT INTO overtime_periods (user_id, start_date, end_date, opened_by_manager_id)
    VALUES (?, ?, ?, ?)
  `).run(userId, startDate, endDate, user.id);

  return NextResponse.json({ id: Number(info.lastInsertRowid) });
}



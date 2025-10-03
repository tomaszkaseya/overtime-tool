import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb, getOrCreateManagersTeam } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

const createSchema = z.object({
  userId: z.number().int().positive(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().max(300).optional(),
});

export async function POST(req: Request) {
  const user = await requireAuth();
  if (user.role !== 'manager') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const json = await req.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { userId, startDate, endDate, reason } = parsed.data;
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
    INSERT INTO overtime_periods (user_id, start_date, end_date, opened_by_manager_id, reason)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, startDate, endDate, user.id, reason || null);

  return NextResponse.json({ id: Number(info.lastInsertRowid) });
}

export async function GET(req: Request) {
  const user = await requireAuth();
  if (user.role !== 'manager') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const memberIdStr = searchParams.get('userId');
  const memberId = memberIdStr ? Number(memberIdStr) : NaN;
  if (!memberId || !Number.isInteger(memberId) || memberId <= 0) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }
  const db = getDb();
  const team = getOrCreateManagersTeam(user.id);
  const member = db.prepare(`
    SELECT u.id FROM users u
    JOIN team_members tm ON tm.user_id = u.id
    WHERE tm.team_id = ? AND u.id = ?
  `).get(team.id, memberId) as any;
  if (!member) return NextResponse.json({ error: 'Not a team member' }, { status: 404 });

  const rows = db.prepare(`
    SELECT id, start_date as startDate, end_date as endDate, reason, created_at as createdAt
    FROM overtime_periods
    WHERE user_id = ?
    ORDER BY start_date DESC, id DESC
  `).all(memberId) as any[];
  return NextResponse.json({ periods: rows });
}

export async function DELETE(req: Request) {
  const user = await requireAuth();
  if (user.role !== 'manager') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const idStr = searchParams.get('id');
  const id = idStr ? Number(idStr) : NaN;
  if (!id || !Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }
  const db = getDb();
  const team = getOrCreateManagersTeam(user.id);
  // Ensure period belongs to a member of this manager's team
  const row = db.prepare(`
    SELECT p.id
    FROM overtime_periods p
    JOIN team_members tm ON tm.user_id = p.user_id
    WHERE p.id = ? AND tm.team_id = ?
  `).get(id, team.id) as any;
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  db.prepare('DELETE FROM overtime_periods WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}



import { NextResponse } from 'next/server';
import { getDb, getOrCreateManagersTeam } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await requireAuth();
  if (user.role !== 'manager') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month'); // YYYY-MM
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: 'month required' }, { status: 400 });
  const start = `${month}-01`;
  const end = `${month}-31`;
  const db = getDb();
  const team = getOrCreateManagersTeam(user.id);
  const rows = db.prepare(`
    SELECT u.id as user_id, u.name as user_name,
      SUM(CASE WHEN e.status = 'approved' THEN e.hours ELSE 0 END) as approved_hours,
      SUM(CASE WHEN e.status = 'pending' THEN e.hours ELSE 0 END) as pending_hours
    FROM team_members tm
    JOIN users u ON u.id = tm.user_id
    LEFT JOIN overtime_entries e ON e.user_id = u.id AND e.entry_date BETWEEN ? AND ?
    WHERE tm.team_id = ?
    GROUP BY u.id, u.name
    ORDER BY u.name ASC
  `).all(start, end, team.id) as any[];
  return NextResponse.json({ totals: rows });
}



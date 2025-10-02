import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb, getOrCreateManagersTeam } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

const updateSchema = z.object({
  entryId: z.number().int().positive(),
  action: z.enum(['approve', 'reject']),
});

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
    SELECT e.id, e.user_id, u.name as user_name, e.entry_date as date, e.hours, e.note, e.status
    FROM overtime_entries e
    JOIN team_members tm ON tm.user_id = e.user_id
    JOIN users u ON u.id = e.user_id
    WHERE tm.team_id = ? AND e.entry_date BETWEEN ? AND ?
    ORDER BY e.entry_date ASC
  `).all(team.id, start, end) as any[];
  return NextResponse.json({ entries: rows });
}

export async function POST(req: Request) {
  const user = await requireAuth();
  if (user.role !== 'manager') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const json = await req.json();
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const db = getDb();
  // Ensure the entry belongs to manager's team
  const team = getOrCreateManagersTeam(user.id);
  const entry = db.prepare(`
    SELECT e.id, e.user_id
    FROM overtime_entries e
    JOIN team_members tm ON tm.user_id = e.user_id
    WHERE e.id = ? AND tm.team_id = ?
  `).get(parsed.data.entryId, team.id) as any;
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const status = parsed.data.action === 'approve' ? 'approved' : 'rejected';
  db.prepare('UPDATE overtime_entries SET status = ? WHERE id = ?').run(status, parsed.data.entryId);
  return NextResponse.json({ ok: true });
}



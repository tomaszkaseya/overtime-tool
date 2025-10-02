import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getDb, getOrCreateManagersTeam } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  tempPassword: z.string().min(6),
});

export async function POST(req: Request) {
  const user = await requireAuth();
  if (user.role !== 'manager') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const json = await req.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const db = getDb();
  const team = getOrCreateManagersTeam(user.id);

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(parsed.data.email) as any;
  if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 409 });

  const passwordHash = await bcrypt.hash(parsed.data.tempPassword, 10);
  const insertUser = db.prepare(`INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, 'member')`);
  const info = insertUser.run(parsed.data.email, parsed.data.name, passwordHash);
  const memberId = Number(info.lastInsertRowid);
  db.prepare(`INSERT INTO team_members (team_id, user_id) VALUES (?, ?)`).run(team.id, memberId);

  return NextResponse.json({ id: memberId, email: parsed.data.email, name: parsed.data.name });
}

export async function GET() {
  const user = await requireAuth();
  if (user.role !== 'manager') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const db = getDb();
  const team = getOrCreateManagersTeam(user.id);
  const members = db.prepare(`
    SELECT u.id, u.email, u.name
    FROM team_members tm
    JOIN users u ON u.id = tm.user_id
    WHERE tm.team_id = ?
    ORDER BY u.name ASC
  `).all(team.id) as any[];
  return NextResponse.json({ members });
}



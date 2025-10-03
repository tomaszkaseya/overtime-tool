import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getDb, getOrCreateManagersTeam } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  tempPassword: z.string().min(6),
  role: z.enum(['admin','manager','member']),
  managerId: z.number().int().positive().optional(),
});

async function checkAdminAuth(req: Request): Promise<boolean> {
  const adminToken = process.env.ADMIN_TOKEN;
  const provided = req.headers.get('x-admin-token') || '';
  if (adminToken && provided === adminToken) return true;
  try {
    const user = await requireAuth();
    if (user && user.role === 'admin') return true;
  } catch {}
  return false;
}

export async function GET(req: Request) {
  if (!(await checkAdminAuth(req))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const db = getDb();
  const users = db.prepare(`
    SELECT u.id, u.email, u.name, u.role, u.created_at,
      mgr.id as manager_id, mgr.name as manager_name
    FROM users u
    LEFT JOIN team_members tm ON tm.user_id = u.id
    LEFT JOIN teams t ON t.id = tm.team_id
    LEFT JOIN users mgr ON mgr.id = t.manager_id
    ORDER BY u.created_at DESC
  `).all() as any[];
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  if (!(await checkAdminAuth(req))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const json = await req.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(parsed.data.email) as any;
  if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
  const passwordHash = await bcrypt.hash(parsed.data.tempPassword, 10);
  const info = db.prepare(`INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?)`)
    .run(parsed.data.email, parsed.data.name, passwordHash, parsed.data.role);
  const userId = Number(info.lastInsertRowid);
  if (parsed.data.role === 'manager') {
    // Every manager gets their own team
    getOrCreateManagersTeam(userId);
    // If a managerId is provided, also assign this manager as a member of another manager's team
    if (parsed.data.managerId) {
      const team = getOrCreateManagersTeam(parsed.data.managerId);
      db.prepare(`INSERT INTO team_members (team_id, user_id) VALUES (?, ?)`).run(team.id, userId);
    }
  } else if (parsed.data.role === 'member' && parsed.data.managerId) {
    const team = getOrCreateManagersTeam(parsed.data.managerId);
    db.prepare(`INSERT INTO team_members (team_id, user_id) VALUES (?, ?)`).run(team.id, userId);
  }
  return NextResponse.json({ id: userId });
}

export async function DELETE(req: Request) {
  if (!(await checkAdminAuth(req))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id') || '');
  if (!id || id <= 0) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const db = getDb();
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}



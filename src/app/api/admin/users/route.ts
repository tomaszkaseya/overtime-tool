import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getDb, getOrCreateManagersTeam } from '@/lib/db';

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  tempPassword: z.string().min(6),
  role: z.enum(['admin','manager','member']),
});

function checkAdminAuth(req: Request): boolean {
  const adminToken = process.env.ADMIN_TOKEN;
  const provided = req.headers.get('x-admin-token') || '';
  return Boolean(adminToken && provided === adminToken);
}

export async function GET(req: Request) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const db = getDb();
  const users = db.prepare(`SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC`).all() as any[];
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
    getOrCreateManagersTeam(userId);
  }
  return NextResponse.json({ id: userId });
}

export async function DELETE(req: Request) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id') || '');
  if (!id || id <= 0) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const db = getDb();
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}



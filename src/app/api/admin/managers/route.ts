import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getDb, getOrCreateManagersTeam } from '@/lib/db';

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  tempPassword: z.string().min(6),
});

export async function POST(req: Request) {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    return NextResponse.json({ error: 'ADMIN_TOKEN not configured' }, { status: 500 });
  }
  const provided = req.headers.get('x-admin-token') || '';
  if (provided !== adminToken) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const json = await req.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(parsed.data.email) as any;
  if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 409 });

  const passwordHash = await bcrypt.hash(parsed.data.tempPassword, 10);
  const info = db.prepare(`INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, 'manager')`)
    .run(parsed.data.email, parsed.data.name, passwordHash);
  const managerId = Number(info.lastInsertRowid);
  getOrCreateManagersTeam(managerId);

  return NextResponse.json({ id: managerId, email: parsed.data.email, name: parsed.data.name });
}



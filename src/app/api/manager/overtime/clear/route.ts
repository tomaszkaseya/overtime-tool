import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST() {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }
  if (user.role !== 'manager') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const db = getDb();
  db.exec('DELETE FROM overtime_entries;');
  return NextResponse.json({ ok: true });
}



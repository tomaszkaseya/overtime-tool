import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateByEmailPassword, issueJwt, setAuthCookie } from '@/lib/auth';

const schema = z.object({ email: z.string().email(), password: z.string().min(6) });

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  const user = await authenticateByEmailPassword(parsed.data.email, parsed.data.password);
  if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  const token = issueJwt(user);
  const res = NextResponse.json({ user });
  setAuthCookie(res, token);
  return res;
}



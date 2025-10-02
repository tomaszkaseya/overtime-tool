import jwt from 'jsonwebtoken';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { parse as parseCookie } from 'cookie';
import { findUserByEmail, getUserById, DbUser } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const COOKIE_NAME = 'ot_jwt';

export type AuthUser = DbUser;

export async function authenticateByEmailPassword(email: string, password: string): Promise<AuthUser | null> {
  const user = findUserByEmail(email);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return null;
  const { password_hash, ...safe } = user as any;
  return safe;
}

export function issueJwt(user: AuthUser): string {
  return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

export function setAuthCookie(res: NextResponse, token: string) {
  res.cookies.set(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax', path: '/' });
}

export function clearAuthCookie(res: NextResponse) {
  res.cookies.set(COOKIE_NAME, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const hdrs = await headers();
  const cookieHeader = hdrs.get('cookie') || '';
  const jar = parseCookie(cookieHeader);
  const token = jar[COOKIE_NAME];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const user = getUserById(Number(payload.sub));
    return user;
  } catch (e) {
    return null;
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) {
    throw new Error('UNAUTHENTICATED');
  }
  return user;
}



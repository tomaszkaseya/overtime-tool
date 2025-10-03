import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST(req: Request) {
  const url = new URL('/login', req.url);
  const res = NextResponse.redirect(url, 303);
  clearAuthCookie(res);
  return res;
}



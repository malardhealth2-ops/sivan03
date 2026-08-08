import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get('username');
    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return NextResponse.json({ available: false, reason: 'too_short' });
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(username.trim())) {
      return NextResponse.json({ available: false, reason: 'invalid_chars' });
    }

    const existing = await db.user.findUnique({ where: { username: username.trim() } });
    return NextResponse.json({ available: !existing });
  } catch {
    return NextResponse.json({ available: false, reason: 'error' }, { status: 500 });
  }
}

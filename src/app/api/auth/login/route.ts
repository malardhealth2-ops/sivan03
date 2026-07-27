import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'نام کاربری و رمز عبور الزامی است' }, { status: 400 });
    }

    // Hardcoded admin credentials (default)
    if (username === 'admin' && password === 'sivan2024') {
      return NextResponse.json({
        success: true,
        user: { id: 'admin-default', fullName: 'مدیر سیستم', username: 'admin', role: 'admin' },
      });
    }

    // Look up by username first (primary registration method), fall back to
    // phone for any legacy users who registered with phone-only.
    let user = await db.user.findUnique({ where: { username } });
    if (!user) {
      user = await db.user.findUnique({ where: { phone: username } });
    }

    if (user && user.password && user.password === password) {
      // Update lastLoginAt
      try {
        await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
      } catch {
        /* best-effort */
      }
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          fullName: user.fullName,
          username: user.username || user.phone,
          role: user.role,
        },
      });
    }

    return NextResponse.json({ error: 'نام کاربری یا رمز عبور اشتباه است' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'خطا در ورود به سیستم' }, { status: 500 });
  }
}

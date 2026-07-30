import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { username, fullName, password, phone, email } = await request.json();

    // Validation
    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'نام کاربری الزامی است' }, { status: 400 });
    }
    if (username.trim().length < 3 || username.trim().length > 30) {
      return NextResponse.json({ error: 'نام کاربری باید بین ۳ تا ۳۰ کاراکتر باشد' }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(username.trim())) {
      return NextResponse.json({ error: 'نام کاربری فقط می‌تواند شامل حروف انگلیسی، اعداد و _ . - باشد' }, { status: 400 });
    }
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return NextResponse.json({ error: 'نام و نام خانوادگی الزامی است' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 4) {
      return NextResponse.json({ error: 'رمز عبور باید حداقل ۴ کاراکتر باشد' }, { status: 400 });
    }

    // Check if username already exists
    const existingByUsername = await db.user.findUnique({ where: { username: username.trim() } });
    if (existingByUsername) {
      return NextResponse.json({ error: 'این نام کاربری قبلاً گرفته شده است' }, { status: 400 });
    }

    // If phone provided, check uniqueness
    if (phone) {
      const existingPhone = await db.user.findUnique({ where: { phone } });
      if (existingPhone) {
        return NextResponse.json({ error: 'این شماره موبایل قبلاً ثبت شده است' }, { status: 400 });
      }
    }

    // Create user (passenger only)
    const user = await db.user.create({
      data: {
        username: username.trim(),
        fullName: fullName.trim(),
        password,
        phone: phone || null,
        email: email || null,
        role: 'passenger',
        isVerified: true,
        lastLoginAt: new Date(),
      },
    });

    // Create passenger profile with referral code
    const referralCode = 'REF-' + user.id.slice(-6).toUpperCase();
    await db.passenger.create({
      data: {
        userId: user.id,
        referralCode,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'ثبت نام با موفقیت انجام شد',
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error: unknown) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'خطا در ثبت نام' }, { status: 500 });
  }
}

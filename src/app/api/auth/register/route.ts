import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_.-]+$/, {
    message: 'نام کاربری فقط می‌تواند شامل حروف انگلیسی، اعداد و _ . - باشد',
  }),
  fullName: z.string().min(2).max(100),
  password: z.string().min(4).max(100),
  phone: z.string().regex(/^09[0-9]{9}$/).optional(),
  email: z.string().email().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    // Check if username already exists
    const existingByUsername = await db.user.findUnique({ where: { username: data.username } });
    if (existingByUsername) {
      return NextResponse.json({ error: 'این نام کاربری قبلاً گرفته شده است' }, { status: 400 });
    }

    // If phone provided, check uniqueness
    if (data.phone) {
      const existingPhone = await db.user.findUnique({ where: { phone: data.phone } });
      if (existingPhone) {
        return NextResponse.json({ error: 'این شماره موبایل قبلاً ثبت شده است' }, { status: 400 });
      }
    }

    // Create user (with password so they can log back in via /api/auth/login)
    const user = await db.user.create({
      data: {
        username: data.username,
        fullName: data.fullName,
        password: data.password,
        phone: data.phone || null,
        email: data.email,
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
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return NextResponse.json(
        { error: firstError?.message || 'اطلاعات نامعتبر', details: error.errors },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: 'خطا در ثبت نام' }, { status: 500 });
  }
}

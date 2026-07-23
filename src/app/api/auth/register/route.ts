import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const registerSchema = z.object({
  phone: z.string().regex(/^09[0-9]{9}$/),
  fullName: z.string().min(2).max(100),
  role: z.enum(['passenger', 'driver']).default('passenger'),
  email: z.string().email().optional(),
  nationalId: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    // Check if user already exists
    const existing = await db.user.findUnique({ where: { phone: data.phone } });
    if (existing) {
      return NextResponse.json({ error: 'این شماره قبلاً ثبت شده است' }, { status: 400 });
    }

    // Create user
    const user = await db.user.create({
      data: {
        phone: data.phone,
        fullName: data.fullName,
        email: data.email,
        role: data.role,
        isVerified: true,
        lastLoginAt: new Date()
      }
    });

    // Create role-specific profile
    if (data.role === 'passenger') {
      const referralCode = 'REF-' + user.id.slice(-6).toUpperCase();
      await db.passenger.create({
        data: {
          userId: user.id,
          referralCode
        }
      });
    } else if (data.role === 'driver') {
      await db.driver.create({
        data: {
          userId: user.id,
          nationalId: data.nationalId || '',
          verificationStatus: 'pending'
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'ثبت نام با موفقیت انجام شد',
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'اطلاعات نامعتبر', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'خطا در ثبت نام' }, { status: 500 });
  }
}

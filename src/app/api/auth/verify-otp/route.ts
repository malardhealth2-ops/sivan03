import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { verifyOTP } from '@/lib/papi';

const verifySchema = z.object({
  phone: z.string().regex(/^09[0-9]{9}$/),
  code: z.string().length(6),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, code } = verifySchema.parse(body);

    // Verify OTP via p.api.ir (falls back to demo)
    const result = await verifyOTP(phone, code);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { phone },
      include: {
        passenger: true,
        driver: true,
      },
    });

    if (user) {
      // Update last login and mark verified
      await db.user.update({
        where: { id: user.id },
        data: { isVerified: true, lastLoginAt: new Date() },
      });

      return NextResponse.json({
        success: true,
        isNewUser: false,
        isDemo: result.isDemo,
        user: {
          id: user.id,
          phone: user.phone,
          fullName: user.fullName,
          username: user.username,
          role: user.role,
          isVerified: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      isNewUser: true,
      isDemo: result.isDemo,
      message: 'کاربر جدید. لطفاً اطلاعات خود را تکمیل کنید.',
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'اطلاعات نامعتبر' }, { status: 400 });
    }
    return NextResponse.json({ error: 'خطا در تأیید کد' }, { status: 500 });
  }
}

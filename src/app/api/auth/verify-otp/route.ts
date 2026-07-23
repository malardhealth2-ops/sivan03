import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const verifySchema = z.object({
  phone: z.string().regex(/^09[0-9]{9}$/),
  code: z.string().length(6)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, code } = verifySchema.parse(body);

    // Demo: accept any 6-digit code
    if (code.length !== 6) {
      return NextResponse.json({ error: 'کد نامعتبر' }, { status: 400 });
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { phone },
      include: {
        passenger: true,
        driver: true
      }
    });

    if (user) {
      return NextResponse.json({
        success: true,
        isNewUser: false,
        user: {
          id: user.id,
          phone: user.phone,
          fullName: user.fullName,
          role: user.role,
          isVerified: user.isVerified
        }
      });
    }

    return NextResponse.json({
      success: true,
      isNewUser: true,
      message: 'کاربر جدید. لطفاً اطلاعات خود را تکمیل کنید.'
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'اطلاعات نامعتبر' }, { status: 400 });
    }
    return NextResponse.json({ error: 'خطا در تأیید کد' }, { status: 500 });
  }
}

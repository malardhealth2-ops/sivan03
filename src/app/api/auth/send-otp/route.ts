import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const otpSchema = z.object({
  phone: z.string().regex(/^09[0-9]{9}$/, 'شماره موبایل نامعتبر است')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = otpSchema.parse(body);

    // Demo: generate random OTP and return it
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    return NextResponse.json({
      success: true,
      message: 'کد تأیید ارسال شد',
      expiresIn: 120,
      // In production, this would be sent via SMS
      // For demo purposes, we return the code
      otp
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'شماره موبایل نامعتبر است' }, { status: 400 });
    }
    return NextResponse.json({ error: 'خطا در ارسال کد تأیید' }, { status: 500 });
  }
}

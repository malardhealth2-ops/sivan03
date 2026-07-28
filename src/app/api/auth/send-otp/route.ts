import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendOTP } from '@/lib/papi';

const otpSchema = z.object({
  phone: z.string().regex(/^09[0-9]{9}$/, 'شماره موبایل نامعتبر است'),
});

// Rate limiter (in-memory): max 3 OTP per phone per 10 min
const rateLimit = new Map<string, { count: number; firstAt: number }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = otpSchema.parse(body);

    // Rate limit check
    const entry = rateLimit.get(phone);
    const now = Date.now();
    if (entry && now - entry.firstAt < 600_000 && entry.count >= 3) {
      return NextResponse.json(
        { error: 'تعداد درخواست کد تأیید بیش از حد مجاز است. لطفاً ۱۰ دقیقه صبر کنید.' },
        { status: 429 },
      );
    }
    if (entry) {
      if (now - entry.firstAt > 600_000) {
        rateLimit.set(phone, { count: 1, firstAt: now });
      } else {
        entry.count++;
      }
    } else {
      rateLimit.set(phone, { count: 1, firstAt: now });
    }

    // Send OTP via p.api.ir (falls back to demo if all providers fail)
    const result = await sendOTP(phone);

    // Log the result for debugging
    if (result.isDemo) {
      console.log(`[OTP Route] DEMO mode for ${phone} — OTP: ${result.otp}`);
    } else {
      console.log(`[OTP Route] REAL SMS sent to ${phone} (provider: p.api.ir)`);
    }

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    const response: Record<string, unknown> = {
      success: true,
      message: result.message,
      expiresIn: result.expiresIn || 120,
      isDemo: result.isDemo,
    };

    // Only return OTP in demo mode for testing
    if (result.isDemo && result.otp) {
      response.otp = result.otp;
    }

    return NextResponse.json(response);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'شماره موبایل نامعتبر است' }, { status: 400 });
    }
    return NextResponse.json({ error: 'خطا در ارسال کد تأیید' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyShahkar } from '@/lib/papi';

const shahkarSchema = z.object({
  nationalId: z.string().regex(/^[0-9]{10}$/, 'کد ملی باید ۱۰ رقم باشد'),
  phone: z.string().regex(/^09[0-9]{9}$/, 'شماره موبایل نامعتبر است'),
  birthDate: z.string().optional(), // Format: YYYY/MM/DD (Persian) or YYYY-MM-DD
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nationalId, phone, birthDate } = shahkarSchema.parse(body);

    // Verify via p.api.ir Shahkar service (falls back to demo)
    const result = await verifyShahkar(nationalId, phone, birthDate);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      verified: result.verified,
      message: result.message,
      isDemo: result.isDemo,
      personInfo: result.personInfo,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const msg = error.errors[0]?.message || 'اطلاعات نامعتبر';
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: 'خطا در تأیید شاهکار' }, { status: 500 });
  }
}

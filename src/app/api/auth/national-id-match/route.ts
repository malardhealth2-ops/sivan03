import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { matchNationalIdWithPhone, verifyNationalId } from '@/lib/papi';

const matchSchema = z.object({
  nationalId: z.string().regex(/^[0-9]{10}$/, 'کد ملی باید ۱۰ رقم باشد'),
  phone: z.string().regex(/^09[0-9]{9}$/, 'شماره موبایل نامعتبر است'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nationalId, phone } = matchSchema.parse(body);

    // First validate the national ID
    const idCheck = await verifyNationalId(nationalId);
    if (!idCheck.success || !idCheck.valid) {
      return NextResponse.json({
        success: false,
        matched: false,
        error: idCheck.message,
        isDemo: idCheck.isDemo,
      }, { status: 400 });
    }

    // Then match with phone
    const result = await matchNationalIdWithPhone(nationalId, phone);

    return NextResponse.json({
      success: true,
      matched: result.matched,
      message: result.message,
      isDemo: result.isDemo,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const msg = error.errors[0]?.message || 'اطلاعات نامعتبر';
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: 'خطا در تطبیق کد ملی' }, { status: 500 });
  }
}

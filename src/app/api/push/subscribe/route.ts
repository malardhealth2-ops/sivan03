import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { saveSubscription } from '@/lib/push';

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  label: z.string().optional(),
  userAgent: z.string().optional(),
});

/**
 * POST /api/push/subscribe
 * Body: { endpoint, keys: { p256dh, auth }, label?, userAgent? }
 * Saves the browser's push subscription so the server can send it notifications.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = subscribeSchema.parse(body);

    const sub = await saveSubscription(
      data.endpoint,
      data.keys.p256dh,
      data.keys.auth,
      data.label,
      data.userAgent
    );

    return NextResponse.json({
      success: true,
      id: sub.id,
      message: 'دستگاه با موفقیت برای دریافت نوتیفیکیشن ثبت شد',
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'اطلاعات اشتراک نامعتبر', details: error.errors },
        { status: 400 }
      );
    }
    console.error('[push/subscribe] error:', error);
    return NextResponse.json({ error: 'خطا در ثبت اشتراک' }, { status: 500 });
  }
}

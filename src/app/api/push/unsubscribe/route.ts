import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { removeSubscription } from '@/lib/push';

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

/**
 * POST /api/push/unsubscribe
 * Body: { endpoint }
 * Removes the browser's push subscription (no more notifications to this device).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = unsubscribeSchema.parse(body);
    await removeSubscription(data.endpoint);
    return NextResponse.json({ success: true, message: 'اشتراک نوتیفیکیشن حذف شد' });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'ورودی نامعتبر' }, { status: 400 });
    }
    console.error('[push/unsubscribe] error:', error);
    return NextResponse.json({ error: 'خطا در حذف اشتراک' }, { status: 500 });
  }
}

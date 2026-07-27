import { NextResponse } from 'next/server';
import { listSubscriptions } from '@/lib/push';

/**
 * GET /api/push/subscriptions
 * Lists all devices subscribed to push notifications (for the admin UI).
 */
export async function GET() {
  try {
    const subs = await listSubscriptions();
    // Truncate endpoint for display privacy + brevity
    const masked = subs.map((s) => ({
      id: s.id,
      label: s.label || 'دستگاه بدون نام',
      endpoint: s.endpoint.slice(0, 60) + '…',
      userAgent: s.userAgent?.slice(0, 80) || null,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
    return NextResponse.json({ subscriptions: masked, count: subs.length });
  } catch (error: unknown) {
    console.error('[push/subscriptions] error:', error);
    return NextResponse.json({ error: 'خطا در دریافت لیست دستگاه‌ها' }, { status: 500 });
  }
}

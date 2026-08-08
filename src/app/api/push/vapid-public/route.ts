import { NextResponse } from 'next/server';
import { getVapidPublicKey } from '@/lib/push';

/**
 * GET /api/push/vapid-public
 * Returns the VAPID public key (safe to expose to browser).
 */
export async function GET() {
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return NextResponse.json(
      { error: 'کلید VAPID پیکربندی نشده است', configured: false },
      { status: 500 }
    );
  }
  return NextResponse.json({ publicKey, configured: true });
}

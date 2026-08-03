import { NextResponse } from 'next/server';
import { triggerGenerate, getStatus } from '@/lib/blog-scheduler';

/**
 * POST /api/blog-generator/generate
 *
 * Triggers immediate article generation using the integrated scheduler.
 * No longer proxies to port 3005.
 */
export async function POST() {
  try {
    const status = getStatus();
    if (status.running) {
      return NextResponse.json({ started: false, message: 'تولید دیگری در حال انجام است' });
    }
    // Fire-and-forget: start generation but return immediately
    triggerGenerate().catch(e => console.error('[api/generate] error:', e));
    return NextResponse.json({ started: true });
  } catch (err) {
    return NextResponse.json(
      { started: false, message: err instanceof Error ? err.message : 'خطای ناشناخته' },
      { status: 500 }
    );
  }
}

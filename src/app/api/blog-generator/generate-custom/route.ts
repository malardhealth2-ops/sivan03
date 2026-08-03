import { NextRequest, NextResponse } from 'next/server';
import { triggerGenerate, getStatus } from '@/lib/blog-scheduler';

/**
 * POST /api/blog-generator/generate-custom
 * Body: { "topic": "موضوع دلخواه" }
 *
 * Generates an article on a custom admin-supplied topic.
 * Uses the integrated scheduler — no mini-service dependency.
 */
export async function POST(req: NextRequest) {
  try {
    let body: unknown = null;
    try { body = await req.json(); } catch {
      return NextResponse.json({ started: false, message: 'بدنه درخواست نامعتبر است' }, { status: 400 });
    }
    const topic = typeof (body as { topic?: unknown })?.topic === 'string'
      ? ((body as { topic: string }).topic).trim() : '';
    if (!topic || topic.length < 3) {
      return NextResponse.json({ started: false, message: 'موضوع مقاله باید حداقل ۳ کاراکتر باشد' }, { status: 400 });
    }
    if (topic.length > 200) {
      return NextResponse.json({ started: false, message: 'موضوع مقاله نباید بیشتر از ۲۰۰ کاراکتر باشد' }, { status: 400 });
    }

    const status = getStatus();
    if (status.running) {
      return NextResponse.json({ started: false, message: 'تولید دیگری در حال انجام است؛ لطفاً صبر کنید' });
    }

    triggerGenerate(topic).catch(e => console.error('[api/generate-custom] error:', e));
    return NextResponse.json({ started: true, custom: true, topic });
  } catch (err) {
    return NextResponse.json(
      { started: false, message: err instanceof Error ? err.message : 'خطای ناشناخته' },
      { status: 500 }
    );
  }
}

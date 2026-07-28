import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy route for the blog-generator mini-service /generate-custom endpoint.
 *
 * Generates an article on a custom topic provided by the admin. This is
 * completely independent of the 6-hour automatic schedule — it does NOT
 * advance the topic rotation, so the next scheduled generation still picks
 * the next topic in the auto-rotation as if nothing happened.
 *
 * Route: POST /api/blog-generator/generate-custom
 * Body: { "topic": "موضوع دلخواه به فارسی" }
 * Forwards to: http://localhost:3005/generate-custom
 */
export async function POST(req: NextRequest) {
  try {
    let body: unknown = null;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { started: false, message: 'بدنه درخواست نامعتبر است' },
        { status: 400 }
      );
    }
    const topic =
      typeof (body as { topic?: unknown })?.topic === 'string'
        ? ((body as { topic: string }).topic).trim()
        : '';
    if (!topic || topic.length < 3) {
      return NextResponse.json(
        { started: false, message: 'موضوع مقاله باید حداقل ۳ کاراکتر باشد' },
        { status: 400 }
      );
    }
    if (topic.length > 200) {
      return NextResponse.json(
        { started: false, message: 'موضوع مقاله نباید بیشتر از ۲۰۰ کاراکتر باشد' },
        { status: 400 }
      );
    }

    const res = await fetch('http://localhost:3005/generate-custom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      {
        started: false,
        message: err instanceof Error ? err.message : 'سرویس تولید مقاله در دسترس نیست',
      },
      { status: 503 }
    );
  }
}

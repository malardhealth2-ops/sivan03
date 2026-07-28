import { NextResponse } from 'next/server';

/**
 * Proxy route for the blog-generator mini-service /status endpoint.
 *
 * In the cloud-sandbox preview (through the *.space-z.ai gateway), the admin
 * frontend could call /status?XTransformPort=3005 directly. But for local dev
 * (localhost:3000) and for robustness, we proxy through this Next.js route so
 * the same frontend code works everywhere.
 *
 * Route: GET /api/blog-generator/status
 * Forwards to: http://localhost:3005/status
 */
export async function GET() {
  try {
    const res = await fetch('http://localhost:3005/status', {
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        running: false,
        lastGeneratedAt: null,
        lastError: 'سرویس تولید مقاله در دسترس نیست',
        totalPosts: 0,
        service: 'blog-generator',
        message: err instanceof Error ? err.message : 'connection failed',
      },
      { status: 503 }
    );
  }
}

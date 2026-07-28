import { NextResponse } from 'next/server';

/**
 * Proxy route for the blog-generator mini-service /generate endpoint.
 *
 * Triggers immediate AI article generation (fire-and-forget on the service
 * side). The admin UI then polls /api/blog-generator/status to see progress.
 *
 * Route: POST /api/blog-generator/generate
 * Forwards to: http://localhost:3005/generate
 */
export async function POST() {
  try {
    const res = await fetch('http://localhost:3005/generate', {
      method: 'POST',
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

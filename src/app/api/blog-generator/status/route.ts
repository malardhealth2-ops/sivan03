import { NextResponse } from 'next/server';
import { getStatus } from '@/lib/blog-scheduler';
import { db } from '@/lib/db';

/**
 * GET /api/blog-generator/status
 *
 * Returns the status of the integrated blog scheduler.
 * No longer depends on the separate mini-service (port 3005).
 */
export async function GET() {
  try {
    const totalPosts = await db.blogPost.count({ where: { status: 'published' } });
    const status = getStatus();
    return NextResponse.json({ ...status, totalPosts });
  } catch (err) {
    return NextResponse.json(
      { ok: false, running: false, lastGeneratedAt: null, lastError: err instanceof Error ? err.message : 'unknown', totalPosts: 0 },
      { status: 500 }
    );
  }
}

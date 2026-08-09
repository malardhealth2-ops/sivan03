import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/blog-generator/status
 *
 * Returns the status of the blog scheduler.
 * Currently disabled for Vercel Edge compatibility.
 */
export async function GET() {
  try {
    const totalPosts = await db.blogPost.count({ where: { status: 'published' } });
    
    // Blog scheduler is temporarily disabled
    return NextResponse.json({
      ok: true,
      running: false,
      lastGeneratedAt: null,
      lastError: null,
      totalPosts,
      message: 'Blog scheduler is disabled for Vercel compatibility'
    });
  } catch (err) {
    return NextResponse.json(
      { 
        ok: false, 
        running: false, 
        lastGeneratedAt: null, 
        lastError: err instanceof Error ? err.message : 'unknown', 
        totalPosts: 0 
      },
      { status: 500 }
    );
  }
}
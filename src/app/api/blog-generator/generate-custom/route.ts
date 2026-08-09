import { NextResponse } from 'next/server';

/**
 * POST /api/blog-generator/generate-custom
 * 
 * Blog generator is temporarily disabled for Vercel compatibility.
 */
export async function POST() {
  return NextResponse.json(
    { 
      ok: false, 
      message: 'Blog generator is temporarily disabled for Vercel deployment' 
    },
    { status: 503 }
  );
}
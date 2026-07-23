import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'published';
    const limit = parseInt(searchParams.get('limit') || '10');

    const posts = await db.blogPost.findMany({
      where: { status },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      include: {
        category: true,
        author: { select: { fullName: true } }
      }
    });

    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json({ error: 'خطا در دریافت مقالات' }, { status: 500 });
  }
}

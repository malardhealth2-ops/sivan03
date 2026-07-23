import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const post = await db.blogPost.findUnique({
      where: { slug },
      include: {
        category: true,
        author: { select: { fullName: true } }
      }
    });

    if (!post) {
      return NextResponse.json({ error: 'مقاله یافت نشد' }, { status: 404 });
    }

    // Increment view count
    await db.blogPost.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } }
    });

    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json({ error: 'خطا در دریافت مقاله' }, { status: 500 });
  }
}

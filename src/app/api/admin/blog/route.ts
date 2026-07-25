import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    const posts = await db.blogPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        category: { select: { name: true } },
        author: { select: { fullName: true } },
      },
    });

    return NextResponse.json(posts);
  } catch {
    return NextResponse.json({ error: 'خطا در دریافت مقالات' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, slug, excerpt, content, featuredImageUrl, status, tags, categoryId } = body;

    if (!title || !slug || !content) {
      return NextResponse.json({ error: 'عنوان، slug و محتوا الزامی است' }, { status: 400 });
    }

    const existing = await db.blogPost.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: 'این slug قبلاً استفاده شده است' }, { status: 409 });
    }

    const post = await db.blogPost.create({
      data: {
        title,
        slug,
        excerpt: excerpt || '',
        content,
        featuredImageUrl: featuredImageUrl || null,
        status: status || 'draft',
        tags: JSON.stringify(tags || []),
        categoryId: categoryId || null,
        publishedAt: status === 'published' ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'خطا در ایجاد مقاله' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, slug, excerpt, content, featuredImageUrl, status, tags, categoryId } = body;

    if (!id) {
      return NextResponse.json({ error: 'شناسه مقاله الزامی است' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (content !== undefined) updateData.content = content;
    if (featuredImageUrl !== undefined) updateData.featuredImageUrl = featuredImageUrl;
    if (tags !== undefined) updateData.tags = JSON.stringify(tags);
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'published') updateData.publishedAt = new Date();
    }

    const post = await db.blogPost.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, post });
  } catch {
    return NextResponse.json({ error: 'خطا در ویرایش مقاله' }, { status: 500 });
  }
}

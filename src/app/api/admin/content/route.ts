import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const contents = await db.siteContent.findMany();
    const map: Record<string, { title: string; subtitle: string; body: string }> = {};
    for (const c of contents) {
      map[c.section] = { title: c.title, subtitle: c.subtitle, body: c.body };
    }
    return NextResponse.json(map);
  } catch {
    return NextResponse.json({ error: 'خطا در دریافت محتوا' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { sections } = await request.json();

    if (!sections || typeof sections !== 'object') {
      return NextResponse.json({ error: 'داده نامعتبر' }, { status: 400 });
    }

    const results = [];
    for (const [section, data] of Object.entries(sections)) {
      const d = data as { title?: string; subtitle?: string; body?: string };
      const upserted = await db.siteContent.upsert({
        where: { section },
        create: {
          section,
          title: d.title || '',
          subtitle: d.subtitle || '',
          body: d.body || '',
        },
        update: {
          title: d.title || '',
          subtitle: d.subtitle || '',
          body: d.body || '',
        },
      });
      results.push(upserted);
    }

    return NextResponse.json({ success: true, updated: results.length });
  } catch {
    return NextResponse.json({ error: 'خطا در ذخیره محتوا' }, { status: 500 });
  }
}

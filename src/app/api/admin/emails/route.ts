import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/admin/emails
 *   ?status=sent|failed|sending|queued   (optional filter)
 *   ?q=subject-or-recipient              (optional search)
 *   ?page=1&pageSize=20                  (pagination)
 *
 * POST /api/admin/emails
 *   body: { to, toName?, subject, html, source? }
 *   Forwards the request to the internal mail-service on port 3004, which
 *   records the message in EmailMessage and attempts delivery.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const q = searchParams.get('q') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));

    const where: Record<string, unknown> = {};
    if (status && status !== 'all') where.status = status;
    if (q) {
      where.OR = [
        { subject: { contains: q } },
        { toEmail: { contains: q } },
        { toName: { contains: q } },
      ];
    }

    const [items, total] = await Promise.all([
      db.emailMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.emailMessage.count({ where }),
    ]);

    // Quick stats for the admin dashboard card
    const stats = await db.emailMessage.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    const statsMap: Record<string, number> = {};
    for (const s of stats) statsMap[s.status] = s._count._all;

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      stats: statsMap,
    });
  } catch (err) {
    console.error('[emails] GET failed:', err);
    return NextResponse.json({ error: 'خطا در دریافت لیست ایمیل‌ها' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, toName, subject, html, source } = body;

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'فیلدهای to، subject و html الزامی هستند.' },
        { status: 400 },
      );
    }

    // Forward to internal mail-service on port 3004 (via the gateway pattern, but
    // since we're on the server side we can call it directly).
    const res = await fetch('http://localhost:3004/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        toName: toName || undefined,
        subject,
        html,
        source: source || 'manual',
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      return NextResponse.json(
        { error: data.error || 'ارسال ایمیل ناموفق بود' },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, id: data.id, status: data.status });
  } catch (err) {
    console.error('[emails] POST failed:', err);
    return NextResponse.json({ error: 'خطا در ارسال ایمیل' }, { status: 500 });
  }
}

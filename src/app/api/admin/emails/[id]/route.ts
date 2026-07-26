import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/admin/emails/[id]
 *   Returns full email record (including html body) for viewing in admin.
 *
 * POST /api/admin/emails/[id]   (action=retry)
 *   Retries delivery of a failed email by forwarding to the mail-service.
 *
 * DELETE /api/admin/emails/[id]
 *   Deletes an email record from the local archive (does not un-send it).
 */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const email = await db.emailMessage.findUnique({ where: { id } });
    if (!email) {
      return NextResponse.json({ error: 'ایمیل یافت نشد' }, { status: 404 });
    }
    return NextResponse.json(email);
  } catch (err) {
    console.error('[emails/[id]] GET failed:', err);
    return NextResponse.json({ error: 'خطا در دریافت ایمیل' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'retry') {
      // Forward to internal mail-service retry endpoint
      const res = await fetch(`http://localhost:3004/retry/${id}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        return NextResponse.json(
          { error: data.error || 'تلاش مجدد ناموفق بود' },
          { status: 500 },
        );
      }
      return NextResponse.json({ ok: true, id: data.id, status: data.status });
    }

    return NextResponse.json({ error: 'action نامعتبر' }, { status: 400 });
  } catch (err) {
    console.error('[emails/[id]] POST failed:', err);
    return NextResponse.json({ error: 'خطا در پردازش' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await db.emailMessage.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[emails/[id]] DELETE failed:', err);
    return NextResponse.json({ error: 'خطا در حذف ایمیل' }, { status: 500 });
  }
}

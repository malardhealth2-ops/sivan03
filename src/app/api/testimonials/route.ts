import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const submitSchema = z.object({
  userId: z.string().min(1),
  fullName: z.string().min(2).max(100),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(1000),
  tripRoute: z.string().max(200).optional(),
});

export async function GET() {
  try {
    const testimonials = await db.testimonial.findMany({
      where: { isApproved: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(testimonials);
  } catch {
    return NextResponse.json({ error: 'خطا در دریافت نظرات' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = submitSchema.parse(body);

    // Verify the user exists
    const user = await db.user.findUnique({ where: { id: data.userId } });
    if (!user) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    // Create the testimonial — auto-approved so the passenger sees it
    // immediately, but admins can still moderate later via the admin panel.
    const testimonial = await db.testimonial.create({
      data: {
        name: data.fullName,
        rating: data.rating,
        comment: data.comment,
        tripRoute: data.tripRoute || null,
        isApproved: true,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true, testimonial });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return NextResponse.json(
        { error: firstError?.message || 'اطلاعات نامعتبر' },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: 'خطا در ثبت نظر' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const testimonials = await db.testimonial.findMany({
      where: { isApproved: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(testimonials);
  } catch (error) {
    return NextResponse.json({ error: 'خطا در دریافت نظرات' }, { status: 500 });
  }
}

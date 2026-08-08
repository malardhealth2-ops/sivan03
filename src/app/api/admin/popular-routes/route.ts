import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// List all popular routes (admin view — includes non-popular too)
export async function GET() {
  try {
    const routes = await db.popularRoute.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json(routes);
  } catch {
    return NextResponse.json({ error: 'خطا در دریافت مسیرها' }, { status: 500 });
  }
}

// Create a new popular route
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origin, destination, distanceKm, duration, tripType, sortOrder, isPopular, image } = body;

    if (!origin || !destination) {
      return NextResponse.json({ error: 'مبدأ و مقصد الزامی است' }, { status: 400 });
    }

    const route = await db.popularRoute.create({
      data: {
        origin,
        destination,
        distanceKm: Number(distanceKm) || 0,
        duration: duration || '',
        tripType: tripType || 'vip',
        price: 0,
        sortOrder: Number(sortOrder) || 0,
        isPopular: isPopular !== false,
        image: image || null,
      },
    });

    return NextResponse.json({ success: true, route }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'خطا در ایجاد مسیر' }, { status: 500 });
  }
}

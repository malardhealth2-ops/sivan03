import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/user/trips?userId=...  — list the passenger's trips
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId الزامی است' }, { status: 400 });
    }

    // Find the passenger profile to get passengerId
    const passenger = await db.passenger.findUnique({ where: { userId } });
    if (!passenger) {
      return NextResponse.json({ trips: [] });
    }

    const trips = await db.trip.findMany({
      where: { passengerId: passenger.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      trips: trips.map((t) => ({
        id: t.id,
        originAddress: t.originAddress,
        destAddress: t.destAddress,
        tripType: t.tripType,
        status: t.status,
        scheduledFor: t.scheduledAt?.toISOString() ?? null,
        totalFare: t.totalFare,
        distanceKm: t.distanceKm,
        passengerCount: t.passengerCount,
        paymentMethod: t.paymentMethod,
        paymentStatus: t.paymentStatus,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ error: 'خطا در دریافت سفرها' }, { status: 500 });
  }
}

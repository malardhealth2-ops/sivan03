import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const bookingSchema = z.object({
  originAddress: z.string().min(1),
  destAddress: z.string().min(1),
  distanceKm: z.number().optional().default(0),
  tripType: z.enum(['economy', 'vip', 'luxury', 'van', 'electric']),
  roundTrip: z.boolean().optional().default(false),
  passengerCount: z.number().min(1).max(8).default(1),
  date: z.string().optional(),
  time: z.string().optional(),
  fullName: z.string().min(1),
  phone: z.string().min(10),
  notes: z.string().optional().default(''),
  paymentMethod: z.enum(['cash', 'online', 'wallet']).default('cash'),
  totalAmount: z.number().optional(),
});

const RATES: Record<string, number> = {
  economy: 2000,
  vip: 3000,
  luxury: 5000,
  van: 2500,
  electric: 3500,
};

const BASE_FARE = 500000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = bookingSchema.parse(body);

    // Use provided totalAmount or calculate it
    const distanceKm = data.distanceKm || 0;
    const rate = RATES[data.tripType] || 3000;
    const calculatedFare = BASE_FARE + distanceKm * rate;
    const totalFare = data.totalAmount || calculatedFare;
    const durationMin = distanceKm > 0 ? Math.round((distanceKm / 80) * 60) : 0;

    // Generate booking code
    const bookingCode = 'SV-' + Date.now().toString(36).toUpperCase().slice(-6);

    // Create trip
    const trip = await db.trip.create({
      data: {
        passengerId: 'guest',
        originAddress: data.originAddress,
        destAddress: data.destAddress,
        tripType: data.tripType,
        passengerCount: data.passengerCount,
        scheduledFor: data.date ? new Date(data.date) : null,
        notes: data.notes,
        totalFare: Math.round(totalFare),
        baseFare: BASE_FARE,
        distanceFare: Math.round(distanceKm * rate),
        distanceKm: Math.round(distanceKm * 10) / 10,
        durationMin,
        paymentMethod: data.paymentMethod,
        status: 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      bookingCode,
      trip: {
        id: trip.id,
        totalFare: trip.totalFare,
        distanceKm: trip.distanceKm,
        durationMin: trip.durationMin,
      },
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'اطلاعات نامعتبر', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'خطا در ثبت رزرو' }, { status: 500 });
  }
}

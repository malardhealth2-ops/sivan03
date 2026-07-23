import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const bookingSchema = z.object({
  origin: z.string().min(1),
  destination: z.string().min(1),
  originLat: z.number(),
  originLng: z.number(),
  destLat: z.number(),
  destLng: z.number(),
  tripType: z.enum(['economy', 'vip', 'luxury', 'van', 'electric']),
  passengerCount: z.number().min(1).max(8),
  scheduledFor: z.string().optional(),
  notes: z.string().optional(),
  passengerName: z.string().min(2),
  passengerPhone: z.string().regex(/^09[0-9]{9}$/),
  paymentMethod: z.enum(['cash', 'online', 'wallet']).default('cash')
});

const RATES: Record<string, number> = {
  economy: 2000,
  vip: 3000,
  luxury: 5000,
  van: 2500,
  electric: 3500
};

const BASE_FARE = 500000;

function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = bookingSchema.parse(body);

    // Calculate distance and price
    const distanceKm = calcDistance(data.originLat, data.originLng, data.destLat, data.destLng);
    const rate = RATES[data.tripType] || 3000;
    const totalFare = BASE_FARE + (distanceKm * rate);
    const durationMin = Math.round((distanceKm / 80) * 60);

    // Generate booking code
    const bookingCode = 'SV-' + Date.now().toString(36).toUpperCase().slice(-6);

    // Create trip
    const trip = await db.trip.create({
      data: {
        passengerId: 'guest',
        originAddress: data.origin,
        destAddress: data.destination,
        originLat: data.originLat,
        originLng: data.originLng,
        destLat: data.destLat,
        destLng: data.destLng,
        tripType: data.tripType,
        passengerCount: data.passengerCount,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
        notes: data.notes,
        totalFare: Math.round(totalFare),
        baseFare: BASE_FARE,
        distanceFare: Math.round(distanceKm * rate),
        distanceKm: Math.round(distanceKm * 10) / 10,
        durationMin,
        paymentMethod: data.paymentMethod,
        status: 'pending'
      }
    });

    return NextResponse.json({
      success: true,
      bookingCode,
      trip: {
        id: trip.id,
        totalFare: trip.totalFare,
        distanceKm: trip.distanceKm,
        durationMin: trip.durationMin
      }
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'اطلاعات نامعتبر', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'خطا در ثبت رزرو' }, { status: 500 });
  }
}

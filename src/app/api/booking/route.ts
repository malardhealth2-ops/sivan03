import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { getPricingConfig, calculateFare, TRIP_TYPE_LABELS } from '@/lib/pricing';
import { sendPushToAll } from '@/lib/push';

// GET /api/booking — list all trips for the admin panel (newest first)
export async function GET() {
  try {
    const trips = await db.trip.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return NextResponse.json(trips);
  } catch {
    return NextResponse.json([]);
  }
}

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

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'نقدی',
  online: 'آنلاین',
  wallet: 'کیف پول',
};

function formatPrice(n: number): string {
  return new Intl.NumberFormat('fa-IR').format(n);
}

async function sendBookingNotification(trip: {
  bookingCode: string;
  origin: string;
  destination: string;
  fullName: string;
  phone: string;
  tripType: string;
  passengerCount: number;
  date: string | undefined;
  time: string | undefined;
  totalFare: number;
  distanceKm: number;
  paymentMethod: string;
  notes: string;
}) {
  try {
    const settings = await db.siteSettings.findUnique({ where: { id: 'main' } });
    const notifyEmail = settings?.notifyEmail;
    if (!notifyEmail) return;

    const htmlBody = `
      <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; padding: 20px; background: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="background: #1a1a1a; padding: 20px; text-align: center;">
            <h1 style="color: #D4AF37; margin: 0; font-size: 24px;">🚕 رزرو جدید - تاکسی سیوان</h1>
          </div>
          <div style="padding: 24px;">
            <h2 style="color: #333; margin-top: 0;">جزئیات رزرو</h2>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr style="background: #f9f9f9;">
                <td style="padding: 10px; border: 1px solid #eee; color: #666; font-weight: bold;">کد رهگیری</td>
                <td style="padding: 10px; border: 1px solid #eee; color: #D4AF37; font-weight: bold; font-size: 18px;">${trip.bookingCode}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #eee; color: #666; font-weight: bold;">نام مسافر</td>
                <td style="padding: 10px; border: 1px solid #eee;">${trip.fullName}</td>
              </tr>
              <tr style="background: #f9f9f9;">
                <td style="padding: 10px; border: 1px solid #eee; color: #666; font-weight: bold;">شماره تماس</td>
                <td style="padding: 10px; border: 1px solid #eee;" dir="ltr">${trip.phone}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #eee; color: #666; font-weight: bold;">مسیر</td>
                <td style="padding: 10px; border: 1px solid #eee;">${trip.origin} ← ${trip.destination}</td>
              </tr>
              <tr style="background: #f9f9f9;">
                <td style="padding: 10px; border: 1px solid #eee; color: #666; font-weight: bold;">فاصله</td>
                <td style="padding: 10px; border: 1px solid #eee;">${trip.distanceKm} کیلومتر</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #eee; color: #666; font-weight: bold;">نوع خودرو</td>
                <td style="padding: 10px; border: 1px solid #eee;">${TRIP_TYPE_LABELS[trip.tripType] || trip.tripType}</td>
              </tr>
              <tr style="background: #f9f9f9;">
                <td style="padding: 10px; border: 1px solid #eee; color: #666; font-weight: bold;">تعداد مسافران</td>
                <td style="padding: 10px; border: 1px solid #eee;">${trip.passengerCount} نفر</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #eee; color: #666; font-weight: bold;">تاریخ</td>
                <td style="padding: 10px; border: 1px solid #eee;">${trip.date || '---'}</td>
              </tr>
              <tr style="background: #f9f9f9;">
                <td style="padding: 10px; border: 1px solid #eee; color: #666; font-weight: bold;">ساعت</td>
                <td style="padding: 10px; border: 1px solid #eee;">${trip.time || '---'}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #eee; color: #666; font-weight: bold;">روش پرداخت</td>
                <td style="padding: 10px; border: 1px solid #eee;">${PAYMENT_LABELS[trip.paymentMethod] || trip.paymentMethod}</td>
              </tr>
              ${trip.notes ? `<tr style="background: #f9f9f9;">
                <td style="padding: 10px; border: 1px solid #eee; color: #666; font-weight: bold;">توضیحات</td>
                <td style="padding: 10px; border: 1px solid #eee;">${trip.notes}</td>
              </tr>` : ''}
            </table>
            <div style="background: #D4AF37; color: #0a0a0a; padding: 16px; border-radius: 8px; text-align: center;">
              <div style="font-size: 14px; color: rgba(0,0,0,0.6);">مبلغ کل سفر</div>
              <div style="font-size: 28px; font-weight: bold;">${formatPrice(trip.totalFare)} تومان</div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Fire-and-forget to the internal mail-service (mini-service on port 3004).
    // The mail-service records the message in EmailMessage table and attempts
    // direct MX delivery (or via configured relay) asynchronously.
    // We deliberately don't await this so the booking response is not delayed
    // by email delivery (which can take 10-30 seconds in some cases).
    void fetch('http://localhost:3004/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: notifyEmail,
        subject: `🚕 رزرو جدید: ${trip.bookingCode} - ${trip.fullName}`,
        html: htmlBody,
        source: 'booking',
        refId: trip.bookingCode,
      }),
    }).catch(() => { /* silent — booking must not fail because of email */ });
  } catch {
    // Email sending failed silently - don't block booking
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = bookingSchema.parse(body);

    const distanceKm = data.distanceKm || 0;
    const config = await getPricingConfig();
    const fare = calculateFare(config, data.tripType, distanceKm, data.roundTrip);
    // If the client supplied a totalAmount (already quoted via /api/pricing), trust it;
    // otherwise use the server-calculated fare.
    const totalFare = data.totalAmount || fare.price;
    const durationMin = distanceKm > 0 ? Math.round((distanceKm / 80) * 60) : 0;

    const bookingCode = 'SV-' + Date.now().toString(36).toUpperCase().slice(-6);

    const trip = await db.trip.create({
      data: {
        bookingCode,
        passengerId: null,
        passengerName: data.fullName,
        passengerPhone: data.phone,
        originAddress: data.originAddress,
        originLat: null,
        originLng: null,
        destAddress: data.destAddress,
        destLat: null,
        destLng: null,
        tripType: data.tripType,
        passengerCount: data.passengerCount,
        scheduledFor: data.date ? new Date(data.date) : null,
        notes: data.notes,
        totalFare: Math.round(totalFare),
        baseFare: fare.baseFare,
        distanceFare: fare.distanceFare,
        distanceKm: Math.round(distanceKm * 10) / 10,
        durationMin,
        paymentMethod: data.paymentMethod,
        status: 'pending',
      },
    });

    // Send email notification (non-blocking)
    sendBookingNotification({
      bookingCode,
      origin: data.originAddress,
      destination: data.destAddress,
      fullName: data.fullName,
      phone: data.phone,
      tripType: data.tripType,
      passengerCount: data.passengerCount,
      date: data.date,
      time: data.time,
      totalFare: Math.round(totalFare),
      distanceKm: Math.round(distanceKm * 10) / 10,
      paymentMethod: data.paymentMethod,
      notes: data.notes || '',
    });

    // Send push notification to all subscribed admin devices (non-blocking)
    void sendPushToAll({
      title: `🚕 رزرو جدید: ${bookingCode}`,
      body: `${data.fullName} | ${data.originAddress} ← ${data.destAddress} | ${formatPrice(Math.round(totalFare))} تومان`,
      tag: `booking-${bookingCode}`,
      url: '/',
      renotify: true,
    }).catch(() => { /* silent */ });

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
    console.error('Booking error:', error);
    return NextResponse.json({ error: 'خطا در ثبت رزرو' }, { status: 500 });
  }
}

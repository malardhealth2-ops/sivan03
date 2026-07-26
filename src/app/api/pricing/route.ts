import { NextRequest, NextResponse } from 'next/server';
import { getPricingConfig, calculateFare, TRIP_TYPE_LABELS } from '@/lib/pricing';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const tripType = searchParams.get('tripType') || 'vip';
    const distanceKm = parseFloat(searchParams.get('distanceKm') || '0');
    const roundTrip = searchParams.get('roundTrip') === 'true';

    if (distanceKm <= 0) {
      return NextResponse.json({ error: 'مسافت باید بزرگتر از صفر باشد' }, { status: 400 });
    }

    const config = await getPricingConfig();
    const fare = calculateFare(config, tripType, distanceKm, roundTrip);

    const durationHours = distanceKm / 80;
    const durationMin = Math.round(durationHours * 60);
    const hours = Math.floor(durationMin / 60);
    const mins = durationMin % 60;
    const durationStr = hours > 0 ? `${hours} ساعت ${mins > 0 ? `و ${mins} دقیقه` : ''}` : `${mins} دقیقه`;

    return NextResponse.json({
      tripType,
      tripTypeLabel: TRIP_TYPE_LABELS[tripType] || tripType,
      distanceKm,
      price: fare.price,
      duration: durationStr,
      durationMin,
      baseFare: fare.baseFare,
      ratePerKm: fare.ratePerKm,
      distanceFare: fare.distanceFare,
      minFare: config.minFare,
      roundTripDiscount: config.roundTripDiscount,
    });
  } catch {
    return NextResponse.json({ error: 'خطا در محاسبه قیمت' }, { status: 500 });
  }
}

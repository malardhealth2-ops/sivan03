import { NextRequest, NextResponse } from 'next/server';

const RATES: Record<string, number> = {
  economy: 2000,
  vip: 3000,
  luxury: 5000,
  van: 2500,
  electric: 3500
};

const BASE_FARE = 500000;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const tripType = searchParams.get('tripType') || 'vip';
    const distanceKm = parseFloat(searchParams.get('distanceKm') || '0');

    if (distanceKm <= 0) {
      return NextResponse.json({ error: 'مسافت باید بزرگتر از صفر باشد' }, { status: 400 });
    }

    const rate = RATES[tripType] || 3000;
    const price = BASE_FARE + (distanceKm * rate);
    const durationHours = distanceKm / 80;
    const durationMin = Math.round(durationHours * 60);

    const hours = Math.floor(durationMin / 60);
    const mins = durationMin % 60;
    const durationStr = hours > 0 ? `${hours} ساعت ${mins > 0 ? `و ${mins} دقیقه` : ''}` : `${mins} دقیقه`;

    return NextResponse.json({
      tripType,
      distanceKm,
      price: Math.round(price),
      duration: durationStr,
      durationMin,
      baseFare: BASE_FARE,
      distanceFare: Math.round(distanceKm * rate)
    });
  } catch (error) {
    return NextResponse.json({ error: 'خطا در محاسبه قیمت' }, { status: 500 });
  }
}

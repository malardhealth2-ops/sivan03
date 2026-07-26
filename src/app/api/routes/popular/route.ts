import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPricingConfig, calculateFare, TRIP_TYPE_LABELS } from '@/lib/pricing';

// Converts a number to Persian-digit string with thousands separators
function toPersianPrice(n: number): string {
  return new Intl.NumberFormat('fa-IR').format(Math.round(n));
}

export async function GET() {
  try {
    const routes = await db.popularRoute.findMany({
      where: { isPopular: true },
      orderBy: { sortOrder: 'asc' },
    });

    // Compute live price for each route from the admin-configured per-km rates.
    // This guarantees the homepage popular-route prices always reflect what
    // the admin entered in the Pricing tab (PricingConfig).
    const config = await getPricingConfig();

    const withPrices = routes.map((r) => {
      const tripType = r.tripType || 'vip';
      const distance = r.distanceKm || 0;
      let price = r.price;
      if (distance > 0) {
        const fare = calculateFare(config, tripType, distance, false);
        price = fare.price;
      }
      return {
        id: r.id,
        origin: r.origin,
        destination: r.destination,
        distanceKm: distance,
        duration: r.duration,
        tripType,
        tripTypeLabel: TRIP_TYPE_LABELS[tripType] || tripType,
        price,
        priceLabel: toPersianPrice(price),
        image: r.image,
        isPopular: r.isPopular,
        sortOrder: r.sortOrder,
      };
    });

    return NextResponse.json(withPrices);
  } catch (error) {
    console.error('popular routes error', error);
    return NextResponse.json({ error: 'خطا در دریافت مسیرها' }, { status: 500 });
  }
}

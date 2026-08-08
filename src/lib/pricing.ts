import { db } from '@/lib/db';

export interface PricingConfig {
  baseFare: number;
  minFare: number;
  economyPerKm: number;
  vipPerKm: number;
  luxuryPerKm: number;
  vanPerKm: number;
  electricPerKm: number;
  roundTripDiscount: number;
}

const DEFAULT_PRICING: PricingConfig = {
  baseFare: 50000,
  minFare: 100000,
  economyPerKm: 2000,
  vipPerKm: 3000,
  luxuryPerKm: 5000,
  vanPerKm: 2500,
  electricPerKm: 3500,
  roundTripDiscount: 0,
};

export const TRIP_TYPE_LABELS: Record<string, string> = {
  economy: 'اقتصادی',
  vip: 'ویژه',
  luxury: 'لوکس',
  electric: 'سوپر لوکس',
  van: 'خانوادگی',
};

// Default trip type used when computing popular-route preview prices
export const DEFAULT_PREVIEW_TRIP_TYPE = 'vip';

export function rateForTripType(config: PricingConfig, tripType: string): number {
  switch (tripType) {
    case 'economy': return config.economyPerKm;
    case 'vip': return config.vipPerKm;
    case 'luxury': return config.luxuryPerKm;
    case 'van': return config.vanPerKm;
    case 'electric': return config.electricPerKm;
    default: return config.vipPerKm;
  }
}

export async function getPricingConfig(): Promise<PricingConfig> {
  try {
    const row = await db.pricingConfig.findUnique({ where: { id: 'main' } });
    if (!row) return { ...DEFAULT_PRICING };
    return {
      baseFare: row.baseFare,
      minFare: row.minFare,
      economyPerKm: row.economyPerKm,
      vipPerKm: row.vipPerKm,
      luxuryPerKm: row.luxuryPerKm,
      vanPerKm: row.vanPerKm,
      electricPerKm: row.electricPerKm,
      roundTripDiscount: row.roundTripDiscount,
    };
  } catch {
    return { ...DEFAULT_PRICING };
  }
}

export function calculateFare(
  config: PricingConfig,
  tripType: string,
  distanceKm: number,
  roundTrip = false
): { price: number; baseFare: number; distanceFare: number; ratePerKm: number } {
  const ratePerKm = rateForTripType(config, tripType);
  const distanceFare = Math.round(distanceKm * ratePerKm);
  let price = config.baseFare + distanceFare;
  if (roundTrip) {
    price = price * 2;
    if (config.roundTripDiscount > 0) {
      price = Math.round(price * (1 - config.roundTripDiscount / 100));
    }
  }
  if (price < config.minFare) price = config.minFare;
  return { price: Math.round(price), baseFare: config.baseFare, distanceFare, ratePerKm };
}

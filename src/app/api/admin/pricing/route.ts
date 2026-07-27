import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPricingConfig, type PricingConfig } from '@/lib/pricing';

export async function GET() {
  const config = await getPricingConfig();
  return NextResponse.json(config);
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json() as Partial<PricingConfig>;

    const data = {
      baseFare: Number(body.baseFare) || 0,
      minFare: Number(body.minFare) || 0,
      economyPerKm: Number(body.economyPerKm) || 0,
      vipPerKm: Number(body.vipPerKm) || 0,
      luxuryPerKm: Number(body.luxuryPerKm) || 0,
      vanPerKm: Number(body.vanPerKm) || 0,
      electricPerKm: Number(body.electricPerKm) || 0,
      roundTripDiscount: Math.min(100, Math.max(0, Number(body.roundTripDiscount) || 0)),
    };

    const pricing = await db.pricingConfig.upsert({
      where: { id: 'main' },
      create: { id: 'main', ...data },
      update: data,
    });

    return NextResponse.json({ success: true, pricing });
  } catch {
    return NextResponse.json({ error: 'خطا در ذخیره قیمت‌گذاری' }, { status: 500 });
  }
}

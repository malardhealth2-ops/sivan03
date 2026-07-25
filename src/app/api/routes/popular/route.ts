import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const routes = await db.popularRoute.findMany({
      where: { isPopular: true },
      orderBy: { sortOrder: 'asc' }
    });
    return NextResponse.json(routes);
  } catch (error) {
    return NextResponse.json({ error: 'خطا در دریافت مسیرها' }, { status: 500 });
  }
}

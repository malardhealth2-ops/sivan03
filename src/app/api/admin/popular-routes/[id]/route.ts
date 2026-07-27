import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { origin, destination, distanceKm, duration, tripType, sortOrder, isPopular, image } = body;

    const updateData: Record<string, unknown> = {};
    if (origin !== undefined) updateData.origin = origin;
    if (destination !== undefined) updateData.destination = destination;
    if (distanceKm !== undefined) updateData.distanceKm = Number(distanceKm);
    if (duration !== undefined) updateData.duration = duration;
    if (tripType !== undefined) updateData.tripType = tripType;
    if (sortOrder !== undefined) updateData.sortOrder = Number(sortOrder);
    if (isPopular !== undefined) updateData.isPopular = isPopular;
    if (image !== undefined) updateData.image = image;

    const route = await db.popularRoute.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, route });
  } catch {
    return NextResponse.json({ error: 'خطا در ویرایش مسیر' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.popularRoute.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'خطا در حذف مسیر' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/user/profile?userId=...  — fetch the logged-in passenger's profile
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId الزامی است' }, { status: 400 });
    }
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { passenger: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }
    return NextResponse.json({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      passenger: user.passenger
        ? {
            walletBalance: user.passenger.walletBalance,
            rating: user.passenger.rating,
            totalTrips: user.passenger.totalTrips,
            referralCode: user.passenger.referralCode,
          }
        : null,
    });
  } catch {
    return NextResponse.json({ error: 'خطا در دریافت پروفایل' }, { status: 500 });
  }
}

// PATCH /api/user/profile — update fullName (and optionally phone/email)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, fullName, phone, email } = body;
    if (!userId) {
      return NextResponse.json({ error: 'userId الزامی است' }, { status: 400 });
    }
    const data: { fullName?: string; phone?: string | null; email?: string | null } = {};
    if (typeof fullName === 'string' && fullName.trim().length >= 2) {
      data.fullName = fullName.trim();
    }
    if (typeof phone === 'string') data.phone = phone.trim() || null;
    if (typeof email === 'string') data.email = email.trim() || null;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'داده‌ای برای به‌روزرسانی ارسال نشده' }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id: userId },
      include: { passenger: true },
      data,
    });
    return NextResponse.json({
      id: updated.id,
      username: updated.username,
      fullName: updated.fullName,
      phone: updated.phone,
      email: updated.email,
      role: updated.role,
      createdAt: updated.createdAt,
      passenger: updated.passenger
        ? {
            walletBalance: updated.passenger.walletBalance,
            rating: updated.passenger.rating,
            totalTrips: updated.passenger.totalTrips,
            referralCode: updated.passenger.referralCode,
          }
        : null,
    });
  } catch {
    return NextResponse.json({ error: 'خطا در به‌روزرسانی پروفایل' }, { status: 500 });
  }
}

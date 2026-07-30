import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, nationalId, fullName, fatherName, birthDate, licenseNumber, shebaNumber, vehicle } = body;

    if (!phone || !/^09[0-9]{9}$/.test(phone)) {
      return NextResponse.json({ error: 'شماره موبایل نامعتبر است' }, { status: 400 });
    }
    if (!nationalId || !/^[0-9]{10}$/.test(nationalId)) {
      return NextResponse.json({ error: 'کد ملی نامعتبر است' }, { status: 400 });
    }
    if (!fullName || fullName.trim().length < 2) {
      return NextResponse.json({ error: 'نام و نام خانوادگی الزامی است' }, { status: 400 });
    }
    if (!vehicle || !vehicle.plateNumber) {
      return NextResponse.json({ error: 'اطلاعات خودرو الزامی است' }, { status: 400 });
    }

    // Check if phone already registered as driver
    const existingPhone = await db.user.findUnique({ where: { phone } });
    if (existingPhone && existingPhone.role === 'driver') {
      return NextResponse.json({ error: 'این شماره موبایل قبلا به عنوان راننده ثبت شده است' }, { status: 400 });
    }

    // Check if national ID already registered
    const existingDriver = await db.driver.findUnique({ where: { nationalId } });
    if (existingDriver) {
      return NextResponse.json({ error: 'این کد ملی قبلا در سیستم ثبت شده است' }, { status: 400 });
    }

    // Check if plate number already registered
    const existingPlate = await db.vehicle.findUnique({ where: { plateNumber: vehicle.plateNumber } });
    if (existingPlate) {
      return NextResponse.json({ error: 'این پلاک قبلا در سیستم ثبت شده است' }, { status: 400 });
    }

    // Create or update user
    const user = await db.user.upsert({
      where: { phone },
      create: {
        phone,
        username: `driver_${phone}`,
        fullName: fullName.trim(),
        password: null,
        role: 'driver',
        isVerified: true,
        lastLoginAt: new Date(),
      },
      update: {
        fullName: fullName.trim(),
        role: 'driver',
        isVerified: true,
      },
    });

    // Create driver profile
    const driver = await db.driver.create({
      data: {
        userId: user.id,
        nationalId,
        fatherName: fatherName || null,
        licenseNumber: licenseNumber || null,
        shebaNumber: shebaNumber || null,
        verificationStatus: 'pending',
      },
    });

    // Create vehicle
    await db.vehicle.create({
      data: {
        driverId: driver.id,
        type: vehicle.type || 'sedan',
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color || '',
        plateNumber: vehicle.plateNumber,
        status: 'active',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'درخواست ثبتنام راننده با موفقیت ثبت شد',
      driverId: driver.id,
    });
  } catch (error: unknown) {
    console.error('Register driver error:', error);
    return NextResponse.json({ error: 'خطا در ثبت درخواست' }, { status: 500 });
  }
}

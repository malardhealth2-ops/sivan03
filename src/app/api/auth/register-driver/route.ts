import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const driverRegisterSchema = z.object({
  phone: z.string().regex(/^09[0-9]{9}$/),
  nationalId: z.string().regex(/^[0-9]{10}$/),
  fullName: z.string().min(2).max(100),
  fatherName: z.string().optional(),
  birthDate: z.string().optional(),
  licenseNumber: z.string().optional(),
  shebaNumber: z.string().optional(),
  vehicle: z.object({
    type: z.string(),
    brand: z.string().min(1),
    model: z.string().min(1),
    year: z.number(),
    color: z.string().optional(),
    plateNumber: z.string().min(1),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = driverRegisterSchema.parse(body);

    // Check if phone already registered as driver
    const existingPhone = await db.user.findUnique({ where: { phone: data.phone } });
    if (existingPhone && existingPhone.role === 'driver') {
      return NextResponse.json({ error: 'این شماره موبایل قبلاً به عنوان راننده ثبت شده است' }, { status: 400 });
    }

    // Check if national ID already registered
    const existingDriver = await db.driver.findUnique({ where: { nationalId: data.nationalId } });
    if (existingDriver) {
      return NextResponse.json({ error: 'این کد ملی قبلاً در سیستم ثبت شده است' }, { status: 400 });
    }

    // Check if plate number already registered
    const existingPlate = await db.vehicle.findUnique({ where: { plateNumber: data.vehicle.plateNumber } });
    if (existingPlate) {
      return NextResponse.json({ error: 'این پلاک قبلاً در سیستم ثبت شده است' }, { status: 400 });
    }

    // Create or update user
    const user = await db.user.upsert({
      where: { phone: data.phone },
      create: {
        phone: data.phone,
        username: `driver_${data.phone}`,
        fullName: data.fullName,
        password: null, // No password — OTP only
        role: 'driver',
        isVerified: true,
        lastLoginAt: new Date(),
      },
      update: {
        fullName: data.fullName,
        role: 'driver',
        isVerified: true,
      },
    });

    // Create driver profile
    const driver = await db.driver.create({
      data: {
        userId: user.id,
        nationalId: data.nationalId,
        fatherName: data.fatherName,
        licenseNumber: data.licenseNumber,
        shebaNumber: data.shebaNumber,
        verificationStatus: 'pending',
      },
    });

    // Create vehicle
    await db.vehicle.create({
      data: {
        driverId: driver.id,
        type: data.vehicle.type,
        brand: data.vehicle.brand,
        model: data.vehicle.model,
        year: data.vehicle.year,
        color: data.vehicle.color || '',
        plateNumber: data.vehicle.plateNumber,
        status: 'active',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'درخواست ثبت‌نام راننده با موفقیت ثبت شد',
      driverId: driver.id,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const msg = error.errors[0]?.message || 'اطلاعات نامعتبر';
      return NextResponse.json({ error: msg, details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'خطا در ثبت درخواست' }, { status: 500 });
  }
}

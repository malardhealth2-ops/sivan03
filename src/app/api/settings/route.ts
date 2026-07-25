import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const settings = await db.siteSettings.findUnique({
      where: { id: 'main' }
    });

    if (!settings) {
      return NextResponse.json({
        siteName: 'تاکسی ویژه سیوان',
        phone1: '09109419743',
        phone2: '09368816807',
        email: 'info@sivantaxi.com',
        address: '',
        aboutText: '',
        commissionRate: 10.0,
        minWithdrawal: 500000,
        workingHours: '۲۴ ساعته - ۷ روز هفته'
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: 'خطا در دریافت اطلاعات' }, { status: 500 });
  }
}

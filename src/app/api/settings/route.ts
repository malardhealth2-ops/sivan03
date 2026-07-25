import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    let settings = await db.siteSettings.findUnique({
      where: { id: 'main' }
    });

    if (!settings) {
      settings = await db.siteSettings.create({
        data: {
          id: 'main',
          siteName: 'تاکسی ویژه سیوان',
          phone1: '09109419743',
          phone2: '09368816807',
          email: 'info@sivantaxi.com',
          address: '',
          aboutText: '',
          commissionRate: 10.0,
          minWithdrawal: 500000,
          workingHours: '۲۴ ساعته - ۷ روز هفته',
        }
      });
    }

    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: 'خطا در دریافت اطلاعات' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Upsert settings
    const settings = await db.siteSettings.upsert({
      where: { id: 'main' },
      create: {
        id: 'main',
        siteName: body.siteName || 'تاکسی ویژه سیوان',
        phone1: body.phone1 || '',
        phone2: body.phone2 || '',
        email: body.email || '',
        address: body.address || '',
        aboutText: body.aboutText || '',
        commissionRate: parseFloat(body.commission) || 10,
        minWithdrawal: parseInt(body.minWithdrawal) || 500000,
        workingHours: body.workingHours || '',
        notifyEmail: body.notifyEmail || '',
        smtpHost: body.smtpHost || '',
        smtpPort: body.smtpPort || '587',
        smtpUser: body.smtpUser || '',
        smtpPass: body.smtpPass || '',
      },
      update: {
        siteName: body.siteName,
        phone1: body.phone1,
        phone2: body.phone2,
        email: body.email,
        address: body.address,
        commissionRate: parseFloat(body.commission) || 10,
        minWithdrawal: parseInt(body.minWithdrawal) || 500000,
        workingHours: body.workingHours,
        notifyEmail: body.notifyEmail || '',
        smtpHost: body.smtpHost || '',
        smtpPort: body.smtpPort || '587',
        smtpUser: body.smtpUser || '',
        smtpPass: body.smtpPass || '',
      }
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json({ error: 'خطا در ذخیره تنظیمات' }, { status: 500 });
  }
}

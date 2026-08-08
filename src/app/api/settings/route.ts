import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const MAIL_FIELDS = [
  'mailSenderName',
  'mailSenderEmail',
  'mailReplyTo',
  'notifyEmail',
  'relayHost',
  'relayPort',
  'relayUser',
  'relayPass',
] as const;

export async function GET() {
  try {
    let settings = await db.siteSettings.findUnique({
      where: { id: 'main' },
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
        },
      });
    }

    // Mask relayPass in GET response (defense-in-depth)
    const safe: Record<string, unknown> = { ...settings };
    if (settings.relayPass) safe.relayPass = '__SET__';
    return NextResponse.json(safe);
  } catch {
    return NextResponse.json({ error: 'خطا در دریافت اطلاعات' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const existing = await db.siteSettings.findUnique({ where: { id: 'main' } });

    // relayPass uses sentinel: __SET__ or empty → keep existing
    const resolvePass = () => {
      const incoming = body.relayPass;
      if (incoming === '__SET__' || incoming === undefined || incoming === '') {
        return existing?.relayPass ?? '';
      }
      return String(incoming);
    };

    const mailValues: Record<string, string> = {
      mailSenderName: body.mailSenderName ?? existing?.mailSenderName ?? '',
      mailSenderEmail: body.mailSenderEmail ?? existing?.mailSenderEmail ?? '',
      mailReplyTo: body.mailReplyTo ?? existing?.mailReplyTo ?? '',
      notifyEmail: body.notifyEmail ?? existing?.notifyEmail ?? '',
      relayHost: body.relayHost ?? existing?.relayHost ?? '',
      relayPort: body.relayPort ?? existing?.relayPort ?? '587',
      relayUser: body.relayUser ?? existing?.relayUser ?? '',
      relayPass: resolvePass(),
    };

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
        ...mailValues,
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
        ...mailValues,
      },
    });

    const safe: Record<string, unknown> = { ...settings };
    if (settings.relayPass) safe.relayPass = '__SET__';
    return NextResponse.json({ success: true, settings: safe });
  } catch (error) {
    console.error('[settings] PUT failed:', error);
    return NextResponse.json({ error: 'خطا در ذخیره تنظیمات' }, { status: 500 });
  }
}

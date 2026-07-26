import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Only these OAuth2 fields are persisted as the "secret" set.
// We deliberately do NOT echo oauthClientSecret / oauthRefreshToken back to the
// browser on GET for defense-in-depth (admin UI shows a masked placeholder instead).
const OAUTH_FIELDS = [
  'oauthUserEmail',
  'oauthClientId',
  'oauthClientSecret',
  'oauthRefreshToken',
  'oauthAccessToken',
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

    // Build a safe view: keep all fields, but mask secrets when they're set.
    const safe: Record<string, unknown> = { ...settings };
    if (settings.oauthClientSecret) safe.oauthClientSecret = '__SET__';
    if (settings.oauthRefreshToken) safe.oauthRefreshToken = '__SET__';
    if (settings.oauthAccessToken) safe.oauthAccessToken = '__SET__';
    return NextResponse.json(safe);
  } catch {
    return NextResponse.json({ error: 'خطا در دریافت اطلاعات' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Resolve OAuth2 field values. Secrets use a sentinel: if the admin sent
    // the placeholder "__SET__" (or empty), keep the existing DB value.
    const existing = await db.siteSettings.findUnique({ where: { id: 'main' } });

    const resolveSecret = (field: (typeof OAUTH_FIELDS)[number]) => {
      const incoming = body[field];
      if (incoming === '__SET__' || incoming === undefined || incoming === '') {
        // Keep the existing value
        return existing?.[field] ?? '';
      }
      return String(incoming);
    };

    const oauthValues: Record<string, string> = {
      oauthUserEmail: body.oauthUserEmail ?? existing?.oauthUserEmail ?? '',
      oauthClientId: body.oauthClientId ?? existing?.oauthClientId ?? '',
      oauthClientSecret: resolveSecret('oauthClientSecret'),
      oauthRefreshToken: resolveSecret('oauthRefreshToken'),
      oauthAccessToken: resolveSecret('oauthAccessToken'),
    };

    // If refresh token or client credentials changed, clear the cached
    // access token + expiry so the email helper will re-refresh from scratch.
    const credentialsChanged =
      oauthValues.oauthClientId !== (existing?.oauthClientId ?? '') ||
      oauthValues.oauthClientSecret !== (existing?.oauthClientSecret ?? '') ||
      oauthValues.oauthRefreshToken !== (existing?.oauthRefreshToken ?? '');

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
        ...oauthValues,
        oauthTokenExpiry: credentialsChanged ? null : existing?.oauthTokenExpiry ?? null,
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
        ...oauthValues,
        oauthTokenExpiry: credentialsChanged ? null : existing?.oauthTokenExpiry ?? null,
      },
    });

    // Don't echo secrets back
    const safe: Record<string, unknown> = { ...settings };
    if (settings.oauthClientSecret) safe.oauthClientSecret = '__SET__';
    if (settings.oauthRefreshToken) safe.oauthRefreshToken = '__SET__';
    if (settings.oauthAccessToken) safe.oauthAccessToken = '__SET__';
    return NextResponse.json({ success: true, settings: safe });
  } catch (error) {
    console.error('[settings] PUT failed:', error);
    return NextResponse.json({ error: 'خطا در ذخیره تنظیمات' }, { status: 500 });
  }
}

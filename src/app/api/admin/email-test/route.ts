import { NextResponse } from 'next/server';
import { sendMail, verifyOAuth2, loadOAuth2Config } from '@/lib/email';

/**
 * POST /api/admin/email-test
 * Verifies the stored OAuth2 credentials can authenticate and sends a small
 * test email to the configured notifyEmail address.
 */
export async function POST() {
  try {
    const cfg = await loadOAuth2Config();
    if (!cfg) {
      return NextResponse.json(
        { ok: false, error: 'ابتدا اطلاعات OAuth2 را در تنظیمات وارد کنید.' },
        { status: 400 },
      );
    }

    // 1) Verify the transporter can authenticate (refreshes access token)
    const verify = await verifyOAuth2();
    if (!verify.ok) {
      return NextResponse.json(
        { ok: false, error: `احراز هویت OAuth2 ناموفق بود: ${verify.error}` },
        { status: 400 },
      );
    }

    // 2) Pull notifyEmail target from the same settings
    const { db } = await import('@/lib/db');
    const s = await db.siteSettings.findUnique({ where: { id: 'main' } });
    const to = s?.notifyEmail;
    if (!to) {
      return NextResponse.json(
        { ok: false, error: 'ایمیل مقصد اعلان (notifyEmail) تنظیم نشده است.' },
        { status: 400 },
      );
    }

    // 3) Send a small HTML test email
    const html = `
      <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; padding: 20px; background: #f5f5f5;">
        <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="background: #1a1a1a; padding: 18px; text-align: center;">
            <h1 style="color: #D4AF37; margin: 0; font-size: 20px;">🚕 تاکسی ویژه سیوان</h1>
          </div>
          <div style="padding: 24px;">
            <h2 style="color: #333; margin-top: 0;">ایمیل آزمایشی</h2>
            <p style="color: #555; line-height: 1.8;">این یک پیام آزمایشی از طرف سیستم اعلان ایمیلی سایت است.</p>
            <p style="color: #555; line-height: 1.8;">اگر این ایمیل را دریافت کردید، تنظیمات OAuth2 به درستی انجام شده است.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
            <p style="color: #888; font-size: 12px;">زمان ارسال: ${new Date().toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' })}</p>
            <p style="color: #888; font-size: 12px;">ارسال از: ${cfg.userEmail}</p>
          </div>
        </div>
      </div>
    `;

    const result = await sendMail({
      to,
      subject: '🧪 ایمیل آزمایشی - تاکسی سیوان',
      html,
      fromName: 'تاکسی ویژه سیوان',
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: `ارسال ایمیل ناموفق بود: ${result.error}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, sentTo: to });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[email-test] failed:', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

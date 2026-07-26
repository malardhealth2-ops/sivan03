import nodemailer from 'nodemailer';
import { db } from '@/lib/db';

/**
 * Email helper using Google OAuth2 (XOAUTH2) instead of SMTP plain auth.
 *
 * Setup required in Google Cloud Console:
 *  1. Create an OAuth2 project → enable Gmail API
 *  2. Create credentials → OAuth2 Web/App client → note Client ID + Client Secret
 *  3. Add the OAuth Playground (https://developers.google.com/oauthplayground/) as a redirect URI
 *  4. In OAuth Playground, configure your own client ID/secret, then authorize
 *     scope `https://mail.google.com/` offline → exchange authorization code → copy refresh token
 *  5. Enter all four values in admin → Settings → تنظیمات اعلان ایمیلی (OAuth2)
 *
 * Nodemailer's built-in XOAUTH2 flow handles access-token refresh automatically using
 * the refresh token + client credentials, so we don't need to manage expiry manually.
 */

export interface OAuth2Config {
  userEmail: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  accessToken?: string;
  expires?: Date | null;
}

let cachedTransport: nodemailer.Transporter | null = null;
let cachedKey = '';

function configKey(c: OAuth2Config): string {
  return `${c.userEmail}|${c.clientId}|${c.refreshToken}`;
}

/**
 * Build (or reuse) a nodemailer transporter bound to Gmail OAuth2.
 * The transporter is recreated when any of the key OAuth2 fields change.
 */
function getTransporter(c: OAuth2Config): nodemailer.Transporter {
  const key = configKey(c);
  if (cachedTransport && cachedKey === key) return cachedTransport;

  cachedTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: c.userEmail,
      clientId: c.clientId,
      clientSecret: c.clientSecret,
      refreshToken: c.refreshToken,
      // If we have a cached access token + expiry, hand it to nodemailer
      // so it can use it until it expires, then auto-refresh via refreshToken.
      accessToken: c.accessToken || undefined,
      accessUrl: 'https://oauth2.googleapis.com/token',
    },
  });
  cachedKey = key;
  return cachedTransport;
}

/**
 * Load OAuth2 config from the SiteSettings table.
 * Returns null if the required fields are missing/incomplete.
 */
export async function loadOAuth2Config(): Promise<OAuth2Config | null> {
  const s = await db.siteSettings.findUnique({ where: { id: 'main' } });
  if (!s) return null;

  const c: OAuth2Config = {
    userEmail: s.oauthUserEmail,
    clientId: s.oauthClientId,
    clientSecret: s.oauthClientSecret,
    refreshToken: s.oauthRefreshToken,
    accessToken: s.oauthAccessToken || undefined,
    expires: s.oauthTokenExpiry,
  };

  if (!c.userEmail || !c.clientId || !c.clientSecret || !c.refreshToken) {
    return null;
  }
  return c;
}

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
}

/**
 * Send an email using the stored OAuth2 credentials.
 * Returns { ok: true } on success or { ok: false, error } on failure.
 * Never throws — caller can ignore the result safely for non-critical notifications.
 */
export async function sendMail(
  input: SendMailInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const cfg = await loadOAuth2Config();
    if (!cfg) {
      return { ok: false, error: 'OAuth2 credentials not configured' };
    }

    const transporter = getTransporter(cfg);
    await transporter.sendMail({
      from: `"${input.fromName ?? 'تاکسی ویژه سیوان'}" <${cfg.userEmail}>`,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[email] sendMail failed:', msg);
    return { ok: false, error: msg };
  }
}

/**
 * Verify that the configured OAuth2 credentials can actually authenticate.
 * Used by the admin "Test email" button.
 */
export async function verifyOAuth2(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const cfg = await loadOAuth2Config();
    if (!cfg) return { ok: false, error: 'OAuth2 credentials not configured' };
    const transporter = getTransporter(cfg);
    await transporter.verify();
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

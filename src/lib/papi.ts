/**
 * SMS & Identity Verification Library
 * 
 * SMS Providers:
 *   1. Kavenegar (primary) - configure KAVENEGAR_API_KEY in .env
 *   2. Fallback: in-memory OTP storage (for development/testing)
 * 
 * Identity:
 *   - Shahkar verification (کد ملی + شماره موبایل)
 *   - National ID validation (checksum algorithm)
 *   - National ID + Phone matching
 * 
 * Environment Variables:
 *   KAVENEGAR_API_KEY   - Kavenegar SMS API key
 *   SMS_PROVIDER        - 'kavenegar' | 'memory' (default: 'kavenegar')
 */

// ─── In-memory OTP storage ─────────────────────────────────────
const otpStore = new Map<string, { code: string; expiresAt: number; phone: string }>();

function generateOTP(phone: string): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(phone, {
    code,
    expiresAt: Date.now() + 120_000, // 2 min
    phone,
  });
  return code;
}

function verifyStoredOTP(phone: string, code: string): boolean {
  const entry = otpStore.get(phone);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(phone);
    return false;
  }
  return entry.code === code;
}

// ─── SMS Provider Configuration ──────────────────────────────

type SMSProvider = 'kavenegar' | 'memory';

function getSMSProvider(): SMSProvider {
  return (process.env.SMS_PROVIDER as SMSProvider) || 'kavenegar';
}

function getKavenegarAPIKey(): string {
  return process.env.KAVENEGAR_API_KEY || '';
}

// ─── 1. Kavenegar SMS Send ────────────────────────────────────

async function sendViaKavenegar(phone: string, code: string): Promise<{
  success: boolean;
  message: string;
}> {
  const apiKey = getKavenegarAPIKey();
  if (!apiKey) {
    return {
      success: false,
      message: 'کلید API کاوه‌نگار تنظیم نشده است. لطفاً KAVENEGAR_API_KEY را در تنظیمات وارد کنید.',
    };
  }

  try {
    // Kavenegar verify/lookup API for OTP
    const res = await fetch(
      `https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          receptor: phone,
          token: code,
          template: 'sivan-otp',
        }),
        signal: AbortSignal.timeout(10000),
      }
    );

    if (res.ok) {
      const data = await res.json();
      if (data.return?.status === 200 || data.return?.code === 200) {
        return { success: true, message: 'کد تأیید پیامک شد' };
      }
      return { success: false, message: data.return?.message || 'خطا در ارسال پیامک' };
    }

    const errData = await res.json().catch(() => ({}));
    return {
      success: false,
      message: errData?.return?.message || `خطا در ارسال پیامک (${res.status})`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'خطای ناشناخته';
    return { success: false, message: `خطا در ارتباط با کاوه‌نگار: ${msg}` };
  }
}

// ─── 2. OTP Send (Main Entry) ─────────────────────────────────

export async function sendOTP(phone: string): Promise<{
  success: boolean;
  message: string;
  otp?: string;
  isDemo: boolean;
  expiresIn?: number;
}> {
  if (!/^09[0-9]{9}$/.test(phone)) {
    return { success: false, message: 'شماره موبایل نامعتبر است', isDemo: false };
  }

  const code = generateOTP(phone); // Always store in memory for verification
  const provider = getSMSProvider();

  if (provider === 'kavenegar') {
    const result = await sendViaKavenegar(phone, code);

    if (result.success) {
      return {
        success: true,
        message: 'کد تأیید ارسال شد',
        isDemo: false,
        expiresIn: 120,
      };
    }

    // Kavenegar failed - if API key is missing, use memory fallback with visible code
    if (!getKavenegarAPIKey()) {
      console.warn('[SMS] KAVENEGAR_API_KEY not set, using memory fallback');
      return {
        success: true,
        message: 'کد تأیید تولید شد (حالت توسعه - پیامک ارسال نمی‌شود)',
        otp: code,
        isDemo: true,
        expiresIn: 120,
      };
    }

    // Kavenegar has a key but failed - return the actual error
    return {
      success: false,
      message: result.message,
      isDemo: false,
    };
  }

  // Memory provider (for testing)
  return {
    success: true,
    message: 'کد تأیید تولید شد',
    otp: code,
    isDemo: true,
    expiresIn: 120,
  };
}

// ─── 3. OTP Verify ────────────────────────────────────────────

export async function verifyOTP(phone: string, code: string): Promise<{
  success: boolean;
  message: string;
  isDemo: boolean;
}> {
  if (!code || code.length !== 6) {
    return { success: false, message: 'کد تأیید باید ۶ رقم باشد', isDemo: false };
  }

  const valid = verifyStoredOTP(phone, code);
  if (valid) {
    return {
      success: true,
      message: 'شماره تأیید شد',
      isDemo: !getKavenegarAPIKey(),
    };
  }

  return {
    success: false,
    message: 'کد تأیید نامعتبر یا منقضی شده است',
    isDemo: false,
  };
}

// ─── 4. Shahkar Verification ──────────────────────────────────
// Shahkar matches a mobile phone number with a person's national ID
// Requires p.api.ir Shahkar service (separate from SMS)

export async function verifyShahkar(
  nationalId: string,
  phone: string,
  birthDate?: string
): Promise<{
  success: boolean;
  verified: boolean;
  message: string;
  isDemo: boolean;
  personInfo?: {
    firstName?: string;
    lastName?: string;
    fatherName?: string;
    nationalId?: string;
    birthDate?: string;
    gender?: string;
  };
}> {
  if (!nationalId || !/^[0-9]{10}$/.test(nationalId)) {
    return { success: false, verified: false, message: 'کد ملی باید ۱۰ رقم باشد', isDemo: false };
  }
  if (!phone || !/^09[0-9]{9}$/.test(phone)) {
    return { success: false, verified: false, message: 'شماره موبایل نامعتبر است', isDemo: false };
  }
  if (!validateNationalIdCheckDigit(nationalId)) {
    return { success: false, verified: false, message: 'کد ملی نامعتبر است', isDemo: false };
  }

  // Try p.api.ir Shahkar API if token available
  const token = process.env.PAPI_TOKEN;
  if (token) {
    try {
      const res = await fetch('https://p.api.ir/api/v1/shahkar/check', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nationalId, mobile: phone, birthDate }),
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          verified: data.verified || data.matched || data.status === 'matched',
          message: data.message || (data.verified ? 'تأیید شاهکار موفق بود' : 'شماره موبایل با کد ملی مطابقت ندارد'),
          isDemo: false,
          personInfo: data.personInfo || data.data,
        };
      }
      console.warn('[Shahkar] API check failed:', res.status);
    } catch (err) {
      console.warn('[Shahkar] API unreachable:', err);
    }
  }

  // Format validation passed but API not available
  return {
    success: true,
    verified: true,
    message: 'اعتبارسنجی کد ملی انجام شد. سرویس شاهکار هنوز فعال نشده است.',
    isDemo: true,
    personInfo: {
      nationalId,
      gender: 'unknown',
    },
  };
}

// ─── 5. National ID + Phone Matching ───────────────────────────

export async function matchNationalIdWithPhone(
  nationalId: string,
  phone: string
): Promise<{
  success: boolean;
  matched: boolean;
  message: string;
  isDemo: boolean;
}> {
  if (!nationalId || !/^[0-9]{10}$/.test(nationalId)) {
    return { success: false, matched: false, message: 'کد ملی باید ۱۰ رقم باشد', isDemo: false };
  }
  if (!phone || !/^09[0-9]{9}$/.test(phone)) {
    return { success: false, matched: false, message: 'شماره موبایل نامعتبر است', isDemo: false };
  }
  if (!validateNationalIdCheckDigit(nationalId)) {
    return { success: false, matched: false, message: 'کد ملی نامعتبر است', isDemo: false };
  }

  const token = process.env.PAPI_TOKEN;
  if (token) {
    try {
      const res = await fetch('https://p.api.ir/api/v1/national-id/match', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nationalId, mobile: phone }),
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          matched: data.matched || data.status === 'matched',
          message: data.message || (data.matched ? 'کد ملی با شماره موبایل مطابقت دارد' : 'کد ملی با شماره موبایل مطابقت ندارد'),
          isDemo: false,
        };
      }
    } catch {
      // API unavailable
    }
  }

  return {
    success: true,
    matched: true,
    message: 'اعتبارسنجی کد ملی انجام شد. سرویس تطبیق هنوز فعال نشده است.',
    isDemo: true,
  };
}

// ─── 6. National ID Validation ────────────────────────────────

export async function verifyNationalId(nationalId: string): Promise<{
  success: boolean;
  valid: boolean;
  message: string;
  isDemo: boolean;
}> {
  if (!nationalId || !/^[0-9]{10}$/.test(nationalId)) {
    return { success: false, valid: false, message: 'کد ملی باید ۱۰ رقم باشد', isDemo: false };
  }
  if (!validateNationalIdCheckDigit(nationalId)) {
    return { success: false, valid: false, message: 'کد ملی نامعتبر است', isDemo: false };
  }

  return {
    success: true,
    valid: true,
    message: 'کد ملی معتبر است',
    isDemo: false,
  };
}

// ─── Helper: Iranian National ID check digit ─────────────────

export function validateNationalIdCheckDigit(nationalId: string): boolean {
  if (!/^[0-9]{10}$/.test(nationalId)) return false;

  const digits = nationalId.split('').map(Number);
  if (digits.every(d => d === digits[0])) return false;

  const check = digits[9];
  const sum = digits.slice(0, 9).reduce((acc, d, i) => acc + d * (10 - i), 0);
  const remainder = sum % 11;

  return remainder < 2 ? check === remainder : check === 11 - remainder;
}

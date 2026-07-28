/**
 * p.api.ir Integration Library
 * 
 * Provides:
 * 1. OTP (SMS) verification - send & verify codes
 * 2. Shahkar verification - match mobile number with national identity
 * 3. National ID verification - validate national ID
 * 4. National ID + Mobile number matching
 * 
 * Bearer token is stored as environment variable PAPI_TOKEN.
 * Falls back to demo mode when API is unavailable.
 */

const PAPI_BASE_URL = 'https://p.api.ir/api/v1';

function getToken(): string {
  // Primary: env variable, Fallback: hardcoded token from user
  return process.env.PAPI_TOKEN || '2cuJ5AqeowlnEKlfY1XOCM4VAuvbN7ETtfxHQLft79n1RvO8hmsWYk+1belZvu4PSvG/M3Ckdn7WAaImEkx25VsLjk4tvLTnGXAfZVLypTs=';
}

// ─── In-memory OTP storage for demo mode ──────────────────────────
const otpStore = new Map<string, { code: string; expiresAt: number; phone: string }>();

function generateDemoOTP(phone: string): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(phone, {
    code,
    expiresAt: Date.now() + 120_000, // 2 min
    phone,
  });
  return code;
}

function verifyDemoOTP(phone: string, code: string): boolean {
  const entry = otpStore.get(phone);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(phone);
    return false;
  }
  return entry.code === code;
}

// ─── 1. OTP Send ────────────────────────────────────────────────

export async function sendOTP(phone: string): Promise<{
  success: boolean;
  message: string;
  otp?: string;       // Only returned in demo mode
  isDemo: boolean;
  expiresIn?: number;
}> {
  // Validate phone
  if (!/^09[0-9]{9}$/.test(phone)) {
    return { success: false, message: 'شماره موبایل نامعتبر است', isDemo: false };
  }

  const token = getToken();

  try {
    const res = await fetch(`${PAPI_BASE_URL}/otp/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, template: 'sivan-verify' }),
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        message: data.message || 'کد تأیید ارسال شد',
        isDemo: false,
        expiresIn: data.expiresIn || 120,
      };
    }

    // API returned error — fall back to demo
    console.warn('[p.api.ir] OTP send failed, falling back to demo mode:', res.status);
  } catch (err) {
    console.warn('[p.api.ir] OTP send unreachable, falling back to demo mode:', err);
  }

  // Demo fallback
  const otp = generateDemoOTP(phone);
  return {
    success: true,
    message: 'کد تأیید ارسال شد (حالت آزمایشی)',
    otp,
    isDemo: true,
    expiresIn: 120,
  };
}

// ─── 2. OTP Verify ──────────────────────────────────────────────

export async function verifyOTP(phone: string, code: string): Promise<{
  success: boolean;
  message: string;
  isDemo: boolean;
}> {
  if (!code || code.length !== 6) {
    return { success: false, message: 'کد تأیید باید ۶ رقم باشد', isDemo: false };
  }

  const token = getToken();

  try {
    const res = await fetch(`${PAPI_BASE_URL}/otp/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, code }),
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        message: data.message || 'شماره تأیید شد',
        isDemo: false,
      };
    }

    console.warn('[p.api.ir] OTP verify failed, trying demo fallback:', res.status);
  } catch (err) {
    console.warn('[p.api.ir] OTP verify unreachable, trying demo fallback:', err);
  }

  // Demo fallback
  const valid = verifyDemoOTP(phone, code);
  return {
    success: valid,
    message: valid ? 'شماره تأیید شد' : 'کد تأیید نامعتبر یا منقضی شده است',
    isDemo: true,
  };
}

// ─── 3. Shahkar Verification ────────────────────────────────────
// Shahkar is the official Iranian identity verification system
// that matches a mobile phone number with a person's national ID

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
  // Validate inputs
  if (!nationalId || !/^[0-9]{10}$/.test(nationalId)) {
    return { success: false, verified: false, message: 'کد ملی باید ۱۰ رقم باشد', isDemo: false };
  }
  if (!phone || !/^09[0-9]{9}$/.test(phone)) {
    return { success: false, verified: false, message: 'شماره موبایل نامعتبر است', isDemo: false };
  }

  // Validate national ID check digit
  if (!validateNationalIdCheckDigit(nationalId)) {
    return { success: false, verified: false, message: 'کد ملی نامعتبر است', isDemo: false };
  }

  const token = getToken();

  try {
    const res = await fetch(`${PAPI_BASE_URL}/shahkar/check`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nationalId,
        mobile: phone,
        birthDate: birthDate || undefined,
      }),
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

    console.warn('[p.api.ir] Shahkar check failed, trying demo:', res.status);
  } catch (err) {
    console.warn('[p.api.ir] Shahkar unreachable, using demo:', err);
  }

  // Demo fallback — always passes in demo mode
  return {
    success: true,
    verified: true,
    message: 'تأیید شاهکار موفق بود (حالت آزمایشی)',
    isDemo: true,
    personInfo: {
      firstName: 'تست',
      lastName: 'تستی',
      fatherName: 'تست‌پدر',
      nationalId,
      gender: 'male',
    },
  };
}

// ─── 4. National ID + Mobile Matching ───────────────────────────

export async function matchNationalIdWithPhone(
  nationalId: string,
  phone: string
): Promise<{
  success: boolean;
  matched: boolean;
  message: string;
  isDemo: boolean;
}> {
  // Validate inputs
  if (!nationalId || !/^[0-9]{10}$/.test(nationalId)) {
    return { success: false, matched: false, message: 'کد ملی باید ۱۰ رقم باشد', isDemo: false };
  }
  if (!phone || !/^09[0-9]{9}$/.test(phone)) {
    return { success: false, matched: false, message: 'شماره موبایل نامعتبر است', isDemo: false };
  }
  if (!validateNationalIdCheckDigit(nationalId)) {
    return { success: false, matched: false, message: 'کد ملی نامعتبر است', isDemo: false };
  }

  const token = getToken();

  try {
    const res = await fetch(`${PAPI_BASE_URL}/national-id/match`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nationalId,
        mobile: phone,
      }),
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

    console.warn('[p.api.ir] National ID match failed, trying demo:', res.status);
  } catch (err) {
    console.warn('[p.api.ir] National ID match unreachable, using demo:', err);
  }

  // Demo fallback
  return {
    success: true,
    matched: true,
    message: 'کد ملی با شماره موبایل مطابقت دارد (حالت آزمایشی)',
    isDemo: true,
  };
}

// ─── 5. National ID Validation ─────────────────────────────────

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

  const token = getToken();

  try {
    const res = await fetch(`${PAPI_BASE_URL}/national-id/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nationalId }),
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        valid: data.valid || data.status === 'valid',
        message: data.message || 'کد ملی معتبر است',
        isDemo: false,
      };
    }

    console.warn('[p.api.ir] National ID verify failed, trying demo:', res.status);
  } catch (err) {
    console.warn('[p.api.ir] National ID verify unreachable, using demo:', err);
  }

  return {
    success: true,
    valid: true,
    message: 'کد ملی معتبر است (حالت آزمایشی)',
    isDemo: true,
  };
}

// ─── Helper: Validate Iranian National ID check digit ───────────

function validateNationalIdCheckDigit(nationalId: string): boolean {
  if (!/^[0-9]{10}$/.test(nationalId)) return false;

  const digits = nationalId.split('').map(Number);

  // Check all digits same (e.g., 0000000000, 1111111111)
  if (digits.every(d => d === digits[0])) return false;

  // Check digit calculation
  const check = digits[9];
  const sum = digits.slice(0, 9).reduce((acc, d, i) => acc + d * (10 - i), 0);
  const remainder = sum % 11;

  return remainder < 2 ? check === remainder : check === 11 - remainder;
}

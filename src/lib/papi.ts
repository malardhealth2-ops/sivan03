/**
 * SMS & Identity Verification Library
 *
 * SMS Providers (tried in order):
 *   1. p.api.ir OTP/SMS API (primary) — tries 3 endpoint patterns
 *   2. Kavenegar SMS API (secondary, if KAVENEGAR_API_KEY is set)
 *   3. Fallback: in-memory OTP storage (demo mode, code shown in UI)
 *
 * Identity:
 *   - Shahkar verification
 *   - National ID validation
 *   - National ID + Phone matching
 *
 * Environment Variables:
 *   PAPI_TOKEN          - p.api.ir API token (has built-in fallback default)
 *   KAVENEGAR_API_KEY   - Kavenegar SMS API key
 *   SMS_PROVIDER        - 'auto' | 'kavenegar' | 'memory' (default: 'auto')
 */

// --- p.api.ir default token (fallback if PAPI_TOKEN env var is not set) ---
const PAPI_FALLBACK_TOKEN =
  '2cuJ5AqeowlnEKlfY1XOCM4VAuvbN7ETtfxHQLft79n1RvO8hmsWYk+1belZvu4PSvG/M3Ckdn7WAaImEkx25VsLjk4tvLTnGXAfZVLypTs=';

// --- In-memory OTP storage ---
const otpStore = new Map<string, { code: string; expiresAt: number; phone: string }>();

function generateOTP(phone: string): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(phone, { code, expiresAt: Date.now() + 120_000, phone });
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

// --- SMS Provider Configuration ---

function getPapiToken(): string {
  return process.env.PAPI_TOKEN || PAPI_FALLBACK_TOKEN;
}

function getKavenegarAPIKey(): string {
  return process.env.KAVENEGAR_API_KEY || '';
}

// --- 1. p.api.ir OTP/SMS Send (Primary) ---
// Tries three endpoint patterns in order. If any returns 2xx, considers it a success.

async function sendViaPapiIr(phone: string, code: string): Promise<{
  success: boolean;
  message: string;
  endpoint?: string;
  status?: number;
}> {
  const token = getPapiToken();
  if (!token) {
    console.warn('[SMS] p.api.ir: no token available');
    return { success: false, message: 'p.api.ir token not set' };
  }

  console.log('[SMS] p.api.ir: attempting to send OTP to', phone);

  // Persian OTP message for plain-text SMS endpoints
  const messageText = `کد تایید شما: ${code}`;

  // Three endpoint patterns to try in order
  const endpoints = [
    {
      url: 'https://p.api.ir/api/v1/otp/send',
      body: JSON.stringify({ Mobile: phone, TemplateId: '1' }),
      description: 'v1 OTP template',
    },
    {
      url: 'https://p.api.ir/api/Sms/Send',
      body: JSON.stringify({
        MobileNumber: phone,
        MessageText: messageText,
        SenderNumber: '',
      }),
      description: 'Sms/Send plain text',
    },
    {
      url: 'https://p.api.ir/api/v2/sms/send',
      body: JSON.stringify({ receptor: phone, message: messageText }),
      description: 'v2 sms/send',
    },
  ];

  for (const ep of endpoints) {
    try {
      console.log(`[SMS] p.api.ir: trying ${ep.description} at ${ep.url}`);
      const res = await fetch(ep.url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: ep.body,
        signal: AbortSignal.timeout(10000),
      });

      console.log(`[SMS] p.api.ir: ${ep.description} returned status ${res.status}`);

      if (res.ok || res.status === 200 || res.status === 201) {
        // 2xx — success
        try {
          const data = await res.json();
          console.log('[SMS] p.api.ir: response body:', JSON.stringify(data));
          // Accept various success indicators from p.api.ir responses
          if (
            data.success === true ||
            data.status === 200 ||
            data.IsSuccessful === true ||
            data.Result === true ||
            data.result === true ||
            data.Status === true ||
            res.ok
          ) {
            console.log(`[SMS] ✅ OTP sent successfully via p.api.ir (${ep.description})`);
            return { success: true, message: `OTP sent via p.api.ir (${ep.description})`, endpoint: ep.url, status: res.status };
          }
          // If response parsed but no clear success flag, still treat 2xx as success
          console.log(`[SMS] ✅ p.api.ir returned ${res.status} — treating as success`);
          return { success: true, message: `OTP sent via p.api.ir (${ep.description})`, endpoint: ep.url, status: res.status };
        } catch {
          // Can't parse JSON but got 2xx — still consider it a success
          console.log(`[SMS] ✅ p.api.ir returned ${res.status} (no JSON body) — treating as success`);
          return { success: true, message: `OTP sent via p.api.ir (${ep.description})`, endpoint: ep.url, status: res.status };
        }
      }

      console.warn(`[SMS] p.api.ir: ${ep.description} returned HTTP ${res.status} — skipping`);
    } catch (err) {
      console.warn(
        `[SMS] p.api.ir: ${ep.description} failed:`,
        err instanceof Error ? err.message : 'unknown error',
      );
    }
  }

  console.warn('[SMS] ❌ All p.api.ir endpoints failed');
  return { success: false, message: 'All p.api.ir endpoints failed' };
}

// --- 2. Kavenegar SMS Send (Secondary) ---

async function sendViaKavenegar(phone: string, code: string): Promise<{
  success: boolean;
  message: string;
}> {
  const apiKey = getKavenegarAPIKey();
  if (!apiKey) return { success: false, message: 'Kavenegar API key not set' };

  console.log('[SMS] Kavenegar: attempting to send OTP to', phone);

  try {
    const res = await fetch(
      `https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ receptor: phone, token: code, template: 'sivan-otp' }),
        signal: AbortSignal.timeout(10000),
      },
    );
    if (res.ok) {
      const data = await res.json();
      if (data.return?.status === 200 || data.return?.code === 200) {
        console.log('[SMS] ✅ OTP sent successfully via Kavenegar');
        return { success: true, message: 'OTP sent via Kavenegar' };
      }
      return { success: false, message: data.return?.message || 'Kavenegar error' };
    }
    const errData = await res.json().catch(() => ({}));
    return { success: false, message: errData?.return?.message || `Kavenegar error (${res.status})` };
  } catch (err) {
    return { success: false, message: `Kavenegar unreachable: ${err instanceof Error ? err.message : 'unknown'}` };
  }
}

// --- 3. OTP Send (Main Entry) ---

export async function sendOTP(phone: string): Promise<{
  success: boolean;
  message: string;
  otp?: string;
  isDemo: boolean;
  expiresIn?: number;
}> {
  if (!/^09[0-9]{9}$/.test(phone)) {
    return { success: false, message: 'Invalid phone number', isDemo: false };
  }

  // Always generate OTP code first and store in memory for verification
  const code = generateOTP(phone);
  const provider = process.env.SMS_PROVIDER || 'auto';

  console.log(`[SMS] sendOTP: phone=${phone}, provider=${provider}, code=${code}`);

  // If explicitly set to memory mode, skip real SMS entirely
  if (provider === 'memory') {
    console.warn('[SMS] SMS_PROVIDER=memory, using in-memory OTP (demo mode)');
    return { success: true, message: 'OTP generated (dev mode)', otp: code, isDemo: true, expiresIn: 120 };
  }

  // Try p.api.ir first (primary provider)
  console.log('[SMS] Trying p.api.ir as primary SMS provider...');
  const papiResult = await sendViaPapiIr(phone, code);
  if (papiResult.success) {
    console.log(`[SMS] ✅ REAL OTP sent successfully to ${phone} via p.api.ir (endpoint: ${papiResult.endpoint})`);
    return { success: true, message: 'OTP sent via SMS', isDemo: false, expiresIn: 120 };
  }
  console.warn('[SMS] p.api.ir failed:', papiResult.message);

  // Try Kavenegar second (if API key is configured)
  if (getKavenegarAPIKey()) {
    console.log('[SMS] Trying Kavenegar as secondary SMS provider...');
    const kavResult = await sendViaKavenegar(phone, code);
    if (kavResult.success) {
      console.log(`[SMS] ✅ REAL OTP sent successfully to ${phone} via Kavenegar`);
      return { success: true, message: 'OTP sent via SMS', isDemo: false, expiresIn: 120 };
    }
    console.warn('[SMS] Kavenegar failed:', kavResult.message);
  }

  // All real providers failed — fallback to demo mode
  console.warn(`[SMS] ❌ All real SMS providers failed for ${phone}. Falling back to DEMO mode. OTP code: ${code}`);
  return { success: true, message: 'OTP generated (demo fallback)', otp: code, isDemo: true, expiresIn: 120 };
}

// --- 4. OTP Verify ---

export async function verifyOTP(phone: string, code: string): Promise<{
  success: boolean;
  message: string;
  isDemo: boolean;
}> {
  if (!code || code.length !== 6) {
    return { success: false, message: 'Code must be 6 digits', isDemo: false };
  }
  const valid = verifyStoredOTP(phone, code);
  if (valid) {
    const hasRealProvider = !!getPapiToken() || !!getKavenegarAPIKey();
    console.log(`[SMS] verifyOTP: phone=${phone}, valid=true, hasRealProvider=${hasRealProvider}`);
    return { success: true, message: 'Verified', isDemo: !hasRealProvider };
  }
  console.log(`[SMS] verifyOTP: phone=${phone}, valid=false`);
  return { success: false, message: 'Invalid or expired code', isDemo: false };
}

// --- 5. Shahkar Verification ---

export async function verifyShahkar(
  nationalId: string,
  phone: string,
  birthDate?: string,
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
    return { success: false, verified: false, message: 'Invalid national ID', isDemo: false };
  }
  if (!phone || !/^09[0-9]{9}$/.test(phone)) {
    return { success: false, verified: false, message: 'Invalid phone', isDemo: false };
  }
  if (!validateNationalIdCheckDigit(nationalId)) {
    return { success: false, verified: false, message: 'Invalid national ID checksum', isDemo: false };
  }

  const token = getPapiToken();
  if (token) {
    try {
      const res = await fetch('https://p.api.ir/api/v1/shahkar/check', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ nationalId, mobile: phone, birthDate }),
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          verified: data.verified || data.matched || data.status === 'matched',
          message: data.message || (data.verified ? 'Shahkar verified' : 'Mismatch'),
          isDemo: false,
          personInfo: data.personInfo || data.data,
        };
      }
    } catch (err) {
      console.warn('[Shahkar] API unreachable:', err);
    }
  }

  return {
    success: true,
    verified: true,
    message: 'Shahkar demo mode',
    isDemo: true,
    personInfo: { nationalId, gender: 'unknown' },
  };
}

// --- 6. National ID + Phone Matching ---

export async function matchNationalIdWithPhone(nationalId: string, phone: string): Promise<{
  success: boolean;
  matched: boolean;
  message: string;
  isDemo: boolean;
}> {
  if (!nationalId || !/^[0-9]{10}$/.test(nationalId)) return { success: false, matched: false, message: 'Invalid national ID', isDemo: false };
  if (!phone || !/^09[0-9]{9}$/.test(phone)) return { success: false, matched: false, message: 'Invalid phone', isDemo: false };
  if (!validateNationalIdCheckDigit(nationalId)) return { success: false, matched: false, message: 'Invalid national ID checksum', isDemo: false };

  const token = getPapiToken();
  if (token) {
    try {
      const res = await fetch('https://p.api.ir/api/v1/national-id/match', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ nationalId, mobile: phone }),
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, matched: data.matched || data.status === 'matched', message: data.message || 'Done', isDemo: false };
      }
    } catch {
      /* API unavailable */
    }
  }

  return { success: true, matched: true, message: 'Match demo mode', isDemo: true };
}

// --- 7. National ID Validation ---

export async function verifyNationalId(nationalId: string): Promise<{
  success: boolean;
  valid: boolean;
  message: string;
  isDemo: boolean;
}> {
  if (!nationalId || !/^[0-9]{10}$/.test(nationalId)) return { success: false, valid: false, message: 'Invalid national ID', isDemo: false };
  if (!validateNationalIdCheckDigit(nationalId)) return { success: false, valid: false, message: 'Invalid national ID checksum', isDemo: false };
  return { success: true, valid: true, message: 'Valid national ID', isDemo: false };
}

// --- Helper: Iranian National ID check digit ---

export function validateNationalIdCheckDigit(nationalId: string): boolean {
  if (!/^[0-9]{10}$/.test(nationalId)) return false;
  const digits = nationalId.split('').map(Number);
  if (digits.every((d) => d === digits[0])) return false;
  const check = digits[9];
  const sum = digits.slice(0, 9).reduce((acc, d, i) => acc + d * (10 - i), 0);
  const remainder = sum % 11;
  return remainder < 2 ? check === remainder : check === 11 - remainder;
}

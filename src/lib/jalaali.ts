import { toJalaali, toGregorian, isLeapJalaaliYear, jalaaliMonthLength } from 'jalaali-js';

const persianMonths = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

const persianWeekDays = [
  'ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'
];

const persianWeekDaysFull = [
  'شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'
];

export function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/\d/g, (d) => persianDigits[parseInt(d)]);
}

/**
 * Get Gregorian year/month/day in Asia/Tehran timezone, timezone-independent.
 * Works correctly regardless of the user's or server's local timezone.
 */
function getTehranDateParts(date: Date = new Date()): { gy: number; gm: number; gd: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const gy = parseInt(parts.find(p => p.type === 'year')?.value || '0');
  const gm = parseInt(parts.find(p => p.type === 'month')?.value || '0');
  const gd = parseInt(parts.find(p => p.type === 'day')?.value || '0');
  return { gy, gm, gd };
}

/**
 * Get current Jalali date based on Tehran timezone (timezone-independent).
 * Uses Intl API to ensure correctness regardless of server/client timezone.
 */
export function getTodayJalaali(): { jy: number; jm: number; jd: number } {
  const { gy, gm, gd } = getTehranDateParts();
  return toJalaali(gy, gm, gd);
}

/**
 * Convert a Date or ISO string to Jalali date.
 * NOTE: Uses the local timezone of the runtime to interpret the date.
 * For timezone-independent Tehran-based conversion, use getTodayJalaali() or getTehranJalaaliDate().
 */
export function toJalaaliDate(date: Date | string): { jy: number; jm: number; jd: number } {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  return toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

/**
 * Convert a Jalali date to Gregorian Date object (UTC midnight).
 */
export function toGregorianDate(jy: number, jm: number, jd: number): Date {
  const { gy, gm, gd } = toGregorian(jy, jm, jd);
  return new Date(gy, gm - 1, gd);
}

/**
 * Format a date as Jalali string (e.g. "۳ مرداد ۱۴۰۵")
 * Uses Tehran timezone for current dates, local timezone for ISO string inputs.
 */
export function formatJalaaliDate(date: Date | string): string {
  const { jy, jm, jd } = toJalaaliDate(date);
  return `${toPersianDigits(jd)} ${persianMonths[jm - 1]} ${toPersianDigits(jy)}`;
}

/**
 * Format as short Jalali date (e.g. "۰۳/۰۵/۱۴۰۵")
 */
export function formatJalaaliShort(date: Date | string): string {
  const { jy, jm, jd } = toJalaaliDate(date);
  return `${toPersianDigits(jd)}/${toPersianDigits(jm)}/${toPersianDigits(jy)}`;
}

/**
 * Get Tehran current time string with Persian digits (e.g. "۱۲:۳۰")
 * Timezone-independent - always shows Asia/Tehran time.
 */
export function getTehranTimeString(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tehran',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const h = parts.find(p => p.type === 'hour')?.value || '00';
  const m = parts.find(p => p.type === 'minute')?.value || '00';
  return toPersianDigits(`${h}:${m}`);
}

/**
 * Legacy function - returns a Date-like string for Tehran time.
 * Kept for backward compatibility.
 */
export function getTehranTime(): Date {
  const { gy, gm, gd } = getTehranDateParts();
  return new Date(gy, gm - 1, gd);
}

export function getJalaaliMonthName(jm: number): string {
  return persianMonths[jm - 1];
}

export function getPersianWeekDays(): string[] {
  return persianWeekDays;
}

export function getPersianWeekDaysFull(): string[] {
  return persianWeekDaysFull;
}

export function isLeapJalaaliYearFn(jy: number): boolean {
  return isLeapJalaaliYear(jy);
}

export function jalaaliMonthLengthFn(jy: number, jm: number): number {
  return jalaaliMonthLength(jy, jm);
}

/**
 * Build a 7-column grid for a Jalali month.
 * First column is Saturday (شنبه).
 * null entries for empty cells before/after the month.
 */
export function getMonthDaysArray(jy: number, jm: number): (number | null)[] {
  const firstDay = toGregorianDate(jy, jm, 1);
  const dayOfWeek = (firstDay.getDay() + 1) % 7; // Saturday = 0
  const daysInMonth = jalaaliMonthLength(jy, jm);

  const days: (number | null)[] = [];

  for (let i = 0; i < dayOfWeek; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

/**
 * Convert Jalali date to ISO date string (YYYY-MM-DD) in UTC.
 */
export function jalaliToIsoString(jy: number, jm: number, jd: number): string {
  const greg = toGregorianDate(jy, jm, jd);
  const y = greg.getFullYear();
  const m = String(greg.getMonth() + 1).padStart(2, '0');
  const d = String(greg.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export { persianMonths, persianWeekDays, persianWeekDaysFull };

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

export function toJalaaliDate(date: Date | string): { jy: number; jm: number; jd: number } {
  const d = typeof date === 'string' ? new Date(date) : date;
  return toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

export function toGregorianDate(jy: number, jm: number, jd: number): Date {
  const { gy, gm, gd } = toGregorian(jy, jm, jd);
  return new Date(gy, gm - 1, gd);
}

export function formatJalaaliDate(date: Date | string): string {
  const { jy, jm, jd } = toJalaaliDate(date);
  return `${toPersianDigits(jd)} ${persianMonths[jm - 1]} ${toPersianDigits(jy)}`;
}

export function formatJalaaliShort(date: Date | string): string {
  const { jy, jm, jd } = toJalaaliDate(date);
  return `${toPersianDigits(jd)}/${toPersianDigits(jm)}/${toPersianDigits(jy)}`;
}

export function getTodayJalaali(): { jy: number; jm: number; jd: number } {
  const now = getTehranTime();
  return toJalaaliDate(now);
}

export function getTehranTime(): Date {
  const now = new Date();
  const tehranOffset = 3.5 * 60; // UTC+3:30
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + tehranOffset * 60000);
}

export function getTehranTimeString(): string {
  const tehran = getTehranTime();
  return tehran.toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Tehran'
  });
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

export function jalaliToIsoString(jy: number, jm: number, jd: number): string {
  const greg = toGregorianDate(jy, jm, jd);
  const y = greg.getFullYear();
  const m = String(greg.getMonth() + 1).padStart(2, '0');
  const d = String(greg.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export { persianMonths, persianWeekDays, persianWeekDaysFull };

'use client';

import { useState, useMemo } from 'react';
import { ChevronRight, ChevronLeft, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getTodayJalaali,
  getMonthDaysArray,
  getJalaaliMonthName,
  getPersianWeekDays,
  toPersianDigits,
  jalaliToIsoString,
  toJalaaliDate,
  isLeapJalaaliYearFn,
} from '@/lib/jalaali';

interface JalaliDatePickerProps {
  value: string;
  onChange: (isoDate: string) => void;
  className?: string;
  placeholder?: string;
  minDate?: string;
  label?: string;
  id?: string;
}

export function JalaliDatePicker({
  value,
  onChange,
  className = '',
  placeholder = 'انتخاب تاریخ',
  minDate,
  label,
  id,
}: JalaliDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Initialize to today's Jalali date if no value provided
  const todayJalaali = useMemo(() => getTodayJalaali(), []);
  let initialJy = todayJalaali.jy;
  let initialJm = todayJalaali.jm;
  let initialJd = todayJalaali.jd;
  if (value) {
    const parts = value.split('-');
    if (parts.length === 3) {
      try {
        const greg = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        const j = toJalaaliDate(greg);
        initialJy = j.jy;
        initialJm = j.jm;
        initialJd = j.jd;
      } catch {
        // keep today's date as default
      }
    }
  }

  const [currentYear, setCurrentYear] = useState(initialJy);
  const [currentMonth, setCurrentMonth] = useState(initialJm);
  const [selectedDay, setSelectedDay] = useState(initialJd);

  const today = todayJalaali;

  const monthDays = useMemo(
    () => getMonthDaysArray(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const weekDays = useMemo(() => getPersianWeekDays(), []);

  const monthName = getJalaaliMonthName(currentMonth);

  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const selectDay = (day: number | null) => {
    if (!day) return;
    setSelectedDay(day);
    const isoDate = jalaliToIsoString(currentYear, currentMonth, day);
    onChange(isoDate);
    setIsOpen(false);
  };

  const handleToday = () => {
    setCurrentYear(today.jy);
    setCurrentMonth(today.jm);
    setSelectedDay(today.jd);
    const isoDate = jalaliToIsoString(today.jy, today.jm, today.jd);
    onChange(isoDate);
    setIsOpen(false);
  };

  const displayValue = value
    ? `${toPersianDigits(selectedDay)} ${monthName} ${toPersianDigits(currentYear)}`
    : '';

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label htmlFor={id} className="text-[#a1a1aa] text-sm mb-2 block">
          <Calendar className="h-3.5 w-3.5 ml-1.5 text-[#D4AF37] inline" />
          {label}
        </label>
      )}
      <button
        type="button"
        id={id}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-[#0a0a0a] border border-[#333] text-[#fafafa] rounded-lg px-4 py-2.5 text-sm h-11 hover:border-[#D4AF37]/50 focus:border-[#D4AF37]/50 transition-colors"
      >
        <span className={displayValue ? 'text-[#fafafa]' : 'text-[#888]'}>
          {displayValue || placeholder}
        </span>
        <Calendar className="h-4 w-4 text-[#D4AF37] opacity-60" />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 z-50 w-72 bg-[#1a1a1a] border border-[#333] rounded-xl shadow-2xl shadow-black/60 p-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-[#2d2d2d] text-[#fafafa] transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="text-center">
              <span className="text-[#fafafa] font-bold text-sm">
                {monthName} {toPersianDigits(currentYear)}
              </span>
              {isLeapJalaaliYearFn(currentYear) && (
                <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 text-[10px] mr-1.5 px-1">
                  کبیسه
                </Badge>
              )}
            </div>
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-[#2d2d2d] text-[#fafafa] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-[#a1a1aa] text-xs font-medium py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((day, idx) => {
              const isDayToday = day === today.jd && currentMonth === today.jm && currentYear === today.jy;
              const isDaySelected = day === selectedDay;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectDay(day)}
                  disabled={!day}
                  className={`
                    relative w-9 h-9 rounded-lg text-sm font-medium transition-all
                    ${!day ? 'pointer-events-none' : 'hover:bg-[#2d2d2d] cursor-pointer'}
                    ${day && isDaySelected ? 'bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B]' : ''}
                    ${day && isDayToday && !isDaySelected ? 'text-[#D4AF37] ring-1 ring-[#D4AF37]/30' : ''}
                    ${day && !isDaySelected && !isDayToday ? 'text-[#fafafa]' : ''}
                  `}
                >
                  {day ? toPersianDigits(day) : ''}
                </button>
              );
            })}
          </div>

          {/* Today button */}
          <div className="mt-3 pt-3 border-t border-[#333]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleToday}
              className="w-full text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]"
            >
              <Calendar className="h-3.5 w-3.5 ml-1.5" />
              امروز ({toPersianDigits(today.jd)} {getJalaaliMonthName(today.jm)})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

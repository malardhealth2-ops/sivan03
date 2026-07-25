'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Calendar,
  Clock,
  Car,
  User,
  CreditCard,
  Check,
  ArrowLeft,
  ArrowRight,
  Users,
  Loader2,
  Phone,
  Route,
  Navigation,
  AlertCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAppStore } from '@/lib/store';
import { JalaliDatePicker } from '@/components/sivan/JalaliDatePicker';
import { CitySelector } from '@/components/sivan/CitySelector';
import { toast } from 'sonner';

const steps = [
  { id: 0, title: 'مسیر', icon: MapPin },
  { id: 1, title: 'زمان', icon: Calendar },
  { id: 2, title: 'خودرو', icon: Car },
  { id: 3, title: 'اطلاعات و پرداخت', icon: User },
];

const carOptions = [
  { value: 'vip', label: 'VIP لوکس', desc: 'هیوندای سوناتا - لوکس و راحت', price: 'پایه + ۲۰٪' },
  { value: 'economy', label: 'اقتصادی', desc: 'خودرو معمولی - قیمت مناسب', price: 'پایه' },
  { value: 'luxury', label: 'دربستی ویژه', desc: 'مرسدس بنز - اختصاصی و لوکس', price: 'پایه + ۴۰٪' },
  { value: 'van', label: 'ون', desc: 'ون ۸ نفره - مناسب گروهی', price: 'پایه + ۳۰٪' },
  { value: 'electric', label: 'برقی', desc: 'خودرو برقی - دوستدار محیط زیست', price: 'پایه + ۱۵٪' },
];

const paymentMethods = [
  { value: 'online', label: 'پرداخت آنلاین', icon: CreditCard },
  { value: 'cash', label: 'پرداخت نقدی', icon: BanknoteIcon },
  { value: 'wallet', label: 'کیف پول', icon: WalletIcon },
];

function BanknoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="12" x="2" y="6" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}

function getCityDisplayName(city: { province: string; city: string; district?: string; neighborhood?: string }): string {
  if (city.neighborhood) {
    return `${city.neighborhood}، ${city.district}، ${city.province}`;
  }
  if (city.district) {
    return `${city.district}، ${city.province}`;
  }
  if (city.city) {
    return `${city.city}، ${city.province}`;
  }
  return city.province;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
}

export function BookingModal() {
  const {
    booking,
    setBookingStep,
    updateBookingForm,
    setEstimatedPrice,
    setBookingCode,
    setBookingSubmitting,
    resetBooking,
  } = useAppStore();

  const [open, setOpen] = useState(false);
  const [distanceLoading, setDistanceLoading] = useState(false);
  const [distanceError, setDistanceError] = useState('');

  const shouldOpen = booking.currentStep >= 0 && booking.currentStep <= 3;
  const dialogOpen = open || shouldOpen;

  const handleClose = (val: boolean) => {
    if (!val) {
      setOpen(false);
      resetBooking();
    }
  };

  const nextStep = () => {
    if (booking.currentStep < 3) {
      setBookingStep(booking.currentStep + 1);
    }
  };

  const prevStep = () => {
    if (booking.currentStep > 0) {
      setBookingStep(booking.currentStep - 1);
    }
  };

  // Fetch distance when both cities are selected
  const fetchDistance = useCallback(async () => {
    const { originCity, destCity } = booking.formData;
    if (!originCity.city || !destCity.city || originCity.city === destCity.city) {
      updateBookingForm({ distanceKm: null, durationMin: null });
      setDistanceError('');
      return;
    }

    setDistanceLoading(true);
    setDistanceError('');

    try {
      const originQuery = originCity.neighborhood || originCity.district || originCity.city;
      const destQuery = destCity.neighborhood || destCity.district || destCity.city;

      const res = await fetch(
        `/api/distance?origin=${encodeURIComponent(originQuery)}&destination=${encodeURIComponent(destQuery)}`
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'خطا در محاسبه فاصله');
      }

      const data = await res.json();
      updateBookingForm({
        distanceKm: data.distanceKm,
        durationMin: data.durationMin,
      });
    } catch (err) {
      setDistanceError(err instanceof Error ? err.message : 'خطا در محاسبه فاصله');
      updateBookingForm({ distanceKm: null, durationMin: null });
    } finally {
      setDistanceLoading(false);
    }
  }, [booking.formData.originCity, booking.formData.destCity, updateBookingForm]);

  useEffect(() => {
    const { originCity, destCity } = booking.formData;
    if (originCity.city && destCity.city && originCity.city !== destCity.city) {
      const timer = setTimeout(fetchDistance, 500);
      return () => clearTimeout(timer);
    }
  }, [booking.formData.originCity.city, booking.formData.destCity.city, fetchDistance]);

  const handleSubmit = async () => {
    setBookingSubmitting(true);
    try {
      const { originCity, destCity, distanceKm, tripType, roundTrip } = booking.formData;
      const originDisplay = getCityDisplayName(originCity);
      const destDisplay = getCityDisplayName(destCity);

      // Fetch price
      let price = 500000; // fallback base
      let duration = '';
      if (distanceKm) {
        try {
          const res = await fetch(
            `/api/pricing?tripType=${tripType}&distanceKm=${distanceKm}`
          );
          if (res.ok) {
            const data = await res.json();
            price = roundTrip ? data.price * 2 : data.price;
            duration = data.duration;
          }
        } catch {
          // use fallback
        }
      }

      // Call booking API
      const bookingRes = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originAddress: originDisplay,
          destAddress: destDisplay,
          distanceKm: distanceKm || 0,
          tripType,
          roundTrip,
          passengerCount: booking.formData.passengerCount,
          date: booking.formData.date,
          time: booking.formData.time,
          fullName: booking.formData.fullName,
          phone: booking.formData.phone,
          notes: booking.formData.notes,
          paymentMethod: booking.formData.paymentMethod,
          totalAmount: price,
        }),
      });

      if (!bookingRes.ok) {
        const errData = await bookingRes.json().catch(() => ({ error: 'خطا در ثبت رزرو' }));
        throw new Error(errData.error || 'خطا در ثبت رزرو');
      }

      const result = await bookingRes.json();
      const code = result.bookingCode || 'SV-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      setBookingCode(code);
      setEstimatedPrice(price, duration || `~${booking.formData.durationMin || 60} دقیقه`);

      // Close modal immediately after success
      setOpen(false);
      resetBooking();

      // Show success toast for 3 seconds
      toast.success(
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
            <Check className="h-4 w-4" />
            رزرو با موفقیت ثبت شد!
          </div>
          <div className="text-muted-foreground text-xs">
            کد رهگیری: <span className="font-bold text-foreground" dir="ltr">{code}</span>
          </div>
          {distanceKm && (
            <div className="text-muted-foreground text-xs">
              هزینه: <span className="font-bold text-foreground">{formatPrice(price)}</span>
            </div>
          )}
        </div>,
        {
          duration: 3000,
          className: 'toast-success-custom',
        }
      );
    } catch {
      toast.error('خطا در ثبت رزرو. لطفاً دوباره تلاش کنید.', { duration: 3000 });
    } finally {
      setBookingSubmitting(false);
    }
  };

  const isStepValid = (): boolean => {
    switch (booking.currentStep) {
      case 0:
        return booking.formData.originCity.city.length > 0 && booking.formData.destCity.city.length > 0;
      case 1:
        return booking.formData.date.length > 0 && booking.formData.time.length > 0;
      case 2:
        return true;
      case 3:
        return booking.formData.fullName.length > 1 && booking.formData.phone.length >= 10;
      default:
        return false;
    }
  };

  const canGoNext = (): boolean => {
    if (!isStepValid()) return false;
    if (booking.currentStep === 0 && distanceLoading) return false;
    return true;
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1a1a1a] border-[#333] max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Steps indicator */}
        <div className="bg-[#0a0a0a] border-b border-[#333] p-4 sticky top-0 z-10">
          <DialogHeader className="p-0 mb-3">
            <DialogTitle className="text-right text-[#fafafa] text-lg">
              رزرو تاکسی
            </DialogTitle>
            <DialogDescription className="text-right text-[#a1a1aa] text-xs mt-1">
              مراحل رزرو سفر خود را تکمیل کنید
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex-1 flex items-center gap-2">
                <div
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    idx === booking.currentStep
                      ? 'bg-[#D4AF37] text-[#0a0a0a]'
                      : idx < booking.currentStep
                        ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                        : 'bg-[#2d2d2d] text-[#a1a1aa]'
                  }`}
                >
                  {idx < booking.currentStep ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <step.icon className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">{step.title}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`w-6 h-0.5 rounded-full ${
                      idx < booking.currentStep ? 'bg-[#D4AF37]' : 'bg-[#333]'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Step 0: Route */}
            {booking.currentStep === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <CitySelector
                  label="شهر مبدأ"
                  iconColor="#D4AF37"
                  value={booking.formData.originCity}
                  onChange={(val) => {
                    updateBookingForm({
                      originCity: val,
                      origin: val.neighborhood || val.district || val.city,
                    });
                  }}
                  placeholder="استان و شهر مبدأ را انتخاب کنید"
                />

                <CitySelector
                  label="شهر مقصد"
                  iconColor="#E5C76B"
                  value={booking.formData.destCity}
                  onChange={(val) => {
                    updateBookingForm({
                      destCity: val,
                      destination: val.neighborhood || val.district || val.city,
                    });
                  }}
                  placeholder="استان و شهر مقصد را انتخاب کنید"
                />

                {/* Distance info */}
                {(distanceLoading || booking.formData.distanceKm || distanceError) && (
                  <div className="p-4 bg-[#0a0a0a] rounded-xl border border-[#333]">
                    {distanceLoading && (
                      <div className="flex items-center gap-3 text-[#D4AF37]">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="text-sm">در حال محاسبه فاصله از نقشه...</span>
                      </div>
                    )}
                    {booking.formData.distanceKm && !distanceLoading && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[#fafafa]">
                          <Route className="h-5 w-5 text-[#D4AF37]" />
                          <span className="font-bold">
                            {new Intl.NumberFormat('fa-IR').format(booking.formData.distanceKm)} کیلومتر
                          </span>
                        </div>
                        {booking.formData.durationMin && (
                          <div className="flex items-center gap-2 text-[#a1a1aa]">
                            <Navigation className="h-4 w-4" />
                            <span className="text-sm">
                              زمان تقریبی:{' '}
                              {booking.formData.durationMin >= 60
                                ? `${Math.floor(booking.formData.durationMin / 60)} ساعت و ${booking.formData.durationMin % 60} دقیقه`
                                : `${booking.formData.durationMin} دقیقه`}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    {distanceError && !distanceLoading && (
                      <div className="flex items-start gap-2 text-red-400">
                        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{distanceError}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3 p-4 bg-[#0a0a0a] rounded-xl border border-[#333]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={booking.formData.roundTrip}
                      onChange={(e) => updateBookingForm({ roundTrip: e.target.checked })}
                      className="rounded border-[#D4AF37] text-[#D4AF37] focus:ring-[#D4AF37]"
                    />
                    <span className="text-sm text-[#a1a1aa]">سفر رفت و برگشت</span>
                  </label>
                </div>
              </motion.div>
            )}

            {/* Step 1: Time */}
            {booking.currentStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <JalaliDatePicker
                    value={booking.formData.date}
                    onChange={(val) => updateBookingForm({ date: val })}
                    placeholder="انتخاب تاریخ سفر"
                    label="تاریخ سفر"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#fafafa]">
                    <Clock className="h-3.5 w-3.5 ml-1.5 text-[#D4AF37]" />
                    ساعت حرکت
                  </Label>
                  <Input
                    type="time"
                    value={booking.formData.time}
                    onChange={(e) => updateBookingForm({ time: e.target.value })}
                    className="bg-[#0a0a0a] border-[#333] text-[#fafafa]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#fafafa]">
                    <Users className="h-3.5 w-3.5 ml-1.5 text-[#D4AF37]" />
                    تعداد مسافران
                  </Label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        updateBookingForm({
                          passengerCount: Math.max(1, booking.formData.passengerCount - 1),
                        })
                      }
                      className="border-[#333] text-[#fafafa]"
                    >
                      -
                    </Button>
                    <span className="text-[#fafafa] text-lg font-bold w-8 text-center">
                      {booking.formData.passengerCount}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        updateBookingForm({
                          passengerCount: Math.min(8, booking.formData.passengerCount + 1),
                        })
                      }
                      className="border-[#333] text-[#fafafa]"
                    >
                      +
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Vehicle */}
            {booking.currentStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                <RadioGroup
                  value={booking.formData.tripType}
                  onValueChange={(val) =>
                    updateBookingForm({ tripType: val as 'economy' | 'vip' | 'luxury' | 'van' | 'electric' })
                  }
                  className="space-y-3"
                >
                  {carOptions.map((car) => (
                    <label
                      key={car.value}
                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                        booking.formData.tripType === car.value
                          ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                          : 'border-[#333] bg-[#0a0a0a] hover:border-[#D4AF37]/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={car.value} className="border-[#D4AF37] text-[#D4AF37]" />
                        <div>
                          <div className="text-[#fafafa] font-medium text-sm">{car.label}</div>
                          <div className="text-[#a1a1aa] text-xs">{car.desc}</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-[#D4AF37]/30 text-[#D4AF37] text-xs">
                        {car.price}
                      </Badge>
                    </label>
                  ))}
                </RadioGroup>
              </motion.div>
            )}

            {/* Step 3: Passenger Info + Payment + Submit */}
            {booking.currentStep === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                {/* Trip Summary Card */}
                <div className="bg-[#0a0a0a] rounded-xl border border-[#333] p-4 space-y-2">
                  <h4 className="text-[#fafafa] font-bold text-sm mb-3">خلاصه سفر</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-[#a1a1aa]">
                      <span>مسیر:</span>
                      <span className="text-[#fafafa] text-left max-w-[60%]">
                        {getCityDisplayName(booking.formData.originCity)} → {getCityDisplayName(booking.formData.destCity)}
                      </span>
                    </div>
                    {booking.formData.distanceKm && (
                      <div className="flex justify-between text-[#a1a1aa]">
                        <span>فاصله:</span>
                        <span className="text-[#fafafa]">
                          {new Intl.NumberFormat('fa-IR').format(booking.formData.distanceKm)} کیلومتر
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-[#a1a1aa]">
                      <span>تاریخ:</span>
                      <span className="text-[#fafafa]">{booking.formData.date || '---'}</span>
                    </div>
                    <div className="flex justify-between text-[#a1a1aa]">
                      <span>ساعت:</span>
                      <span className="text-[#fafafa]">{booking.formData.time || '---'}</span>
                    </div>
                    <div className="flex justify-between text-[#a1a1aa]">
                      <span>خودرو:</span>
                      <span className="text-[#fafafa]">
                        {carOptions.find((c) => c.value === booking.formData.tripType)?.label || '---'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#a1a1aa]">
                      <span>مسافران:</span>
                      <span className="text-[#fafafa]">{booking.formData.passengerCount} نفر</span>
                    </div>
                    {booking.formData.roundTrip && (
                      <div className="flex justify-between text-[#a1a1aa]">
                        <span>نوع سفر:</span>
                        <span className="text-[#D4AF37]">رفت و برگشت</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Passenger Info */}
                <div className="space-y-2">
                  <Label className="text-[#fafafa]">
                    <User className="h-3.5 w-3.5 ml-1.5 text-[#D4AF37]" />
                    نام و نام خانوادگی
                  </Label>
                  <Input
                    placeholder="نام خود را وارد کنید"
                    value={booking.formData.fullName}
                    onChange={(e) => updateBookingForm({ fullName: e.target.value })}
                    className="bg-[#0a0a0a] border-[#333] text-[#fafafa]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#fafafa]">
                    <Phone className="h-3.5 w-3.5 ml-1.5 text-[#D4AF37]" />
                    شماره موبایل
                  </Label>
                  <Input
                    placeholder="۰۹۱۲XXXXXXX"
                    value={booking.formData.phone}
                    onChange={(e) => updateBookingForm({ phone: e.target.value })}
                    className="bg-[#0a0a0a] border-[#333] text-[#fafafa]"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#fafafa]">توضیحات (اختیاری)</Label>
                  <textarea
                    placeholder="نکات خاصی وجود دارد؟"
                    value={booking.formData.notes}
                    onChange={(e) => updateBookingForm({ notes: e.target.value })}
                    className="bg-[#0a0a0a] border-[#333] text-[#fafafa] rounded-md border px-3 py-2 text-sm min-h-[80px] w-full focus-visible:border-[#D4AF37]/50 focus-visible:ring-[#D4AF37]/50 focus-visible:ring-[3px] outline-none resize-none"
                  />
                </div>

                {/* Payment Method */}
                <div className="space-y-3">
                  <Label className="text-[#fafafa]">روش پرداخت</Label>
                  <RadioGroup
                    value={booking.formData.paymentMethod}
                    onValueChange={(val) =>
                      updateBookingForm({ paymentMethod: val as 'cash' | 'online' | 'wallet' })
                    }
                    className="space-y-2"
                  >
                    {paymentMethods.map((pm) => (
                      <label
                        key={pm.value}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          booking.formData.paymentMethod === pm.value
                            ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                            : 'border-[#333] bg-[#0a0a0a] hover:border-[#D4AF37]/30'
                        }`}
                      >
                        <RadioGroupItem value={pm.value} className="border-[#D4AF37] text-[#D4AF37]" />
                        <pm.icon className="h-4 w-4 text-[#D4AF37]" />
                        <span className="text-[#fafafa] text-sm">{pm.label}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          {booking.currentStep >= 0 && booking.currentStep <= 3 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#333]">
              <Button
                variant="ghost"
                onClick={prevStep}
                disabled={booking.currentStep === 0}
                className="text-[#a1a1aa] hover:text-[#fafafa]"
              >
                <ArrowRight className="h-4 w-4 mr-1" />
                مرحله قبل
              </Button>
              <Button
                onClick={booking.currentStep === 3 ? handleSubmit : nextStep}
                disabled={!canGoNext() || booking.isSubmitting}
                className="bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B]"
              >
                {booking.isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    در حال ثبت...
                  </>
                ) : booking.currentStep === 3 ? (
                  <>
                    <Check className="h-4 w-4 mr-1.5" />
                    ثبت نهایی
                  </>
                ) : (
                  <>
                    مرحله بعد
                    <ArrowLeft className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

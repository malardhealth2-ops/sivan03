'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
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
  Copy,
  Loader2,
  Phone,
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

const steps = [
  { id: 0, title: 'مسیر', icon: MapPin },
  { id: 1, title: 'زمان', icon: Calendar },
  { id: 2, title: 'خودرو', icon: Car },
  { id: 3, title: 'اطلاعات', icon: User },
  { id: 4, title: 'خلاصه', icon: CreditCard },
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

  // Derive open state from booking step
  const shouldOpen = booking.currentStep >= 0 && booking.currentStep <= 4;
  const dialogOpen = open || shouldOpen;

  const handleClose = (val: boolean) => {
    if (!val) {
      setOpen(false);
      resetBooking();
    }
  };

  const nextStep = () => {
    if (booking.currentStep < 4) {
      setBookingStep(booking.currentStep + 1);
    }
  };

  const prevStep = () => {
    if (booking.currentStep > 0) {
      setBookingStep(booking.currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setBookingSubmitting(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 2000));
    const code = 'SV-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    setBookingCode(code);
    setEstimatedPrice(1200000, '~۶ ساعت');
    setBookingSubmitting(false);
  };

  const isStepValid = (): boolean => {
    switch (booking.currentStep) {
      case 0:
        return booking.formData.origin.length > 0 && booking.formData.destination.length > 0;
      case 1:
        return booking.formData.date.length > 0 && booking.formData.time.length > 0;
      case 2:
        return true;
      case 3:
        return booking.formData.fullName.length > 1 && booking.formData.phone.length >= 10;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1a1a1a] border-[#333] max-w-2xl max-h-[90vh] overflow-y-auto p-0" showCloseButton={booking.bookingCode === null}>
        {/* Steps indicator */}
        <div className="bg-[#0a0a0a] border-b border-[#333] p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-3">
            <DialogHeader className="p-0">
              <DialogTitle className="text-right text-[#fafafa] text-lg">
                رزرو تاکسی
              </DialogTitle>
              <DialogDescription className="text-right text-[#a1a1aa] text-xs mt-1">
                مراحل رزرو سفر خود را تکمیل کنید
              </DialogDescription>
            </DialogHeader>
            {booking.bookingCode && (
              <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                <Check className="h-3 w-3 ml-1" />
                ثبت شد
              </Badge>
            )}
          </div>
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
                <div className="space-y-2">
                  <Label className="text-[#fafafa]">
                    <MapPin className="h-3.5 w-3.5 ml-1.5 text-[#D4AF37]" />
                    شهر مبدأ
                  </Label>
                  <Input
                    placeholder="مثلاً: تهران"
                    value={booking.formData.origin}
                    onChange={(e) => updateBookingForm({ origin: e.target.value })}
                    className="bg-[#0a0a0a] border-[#333] text-[#fafafa]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#fafafa]">
                    <MapPin className="h-3.5 w-3.5 ml-1.5 text-[#E5C76B]" />
                    شهر مقصد
                  </Label>
                  <Input
                    placeholder="مثلاً: اصفهان"
                    value={booking.formData.destination}
                    onChange={(e) => updateBookingForm({ destination: e.target.value })}
                    className="bg-[#0a0a0a] border-[#333] text-[#fafafa]"
                  />
                </div>
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

            {/* Step 3: Passenger Info */}
            {booking.currentStep === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
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
              </motion.div>
            )}

            {/* Step 4: Summary */}
            {booking.currentStep === 4 && !booking.bookingCode && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                {/* Summary Card */}
                <div className="bg-[#0a0a0a] rounded-xl border border-[#333] p-5 space-y-4">
                  <h4 className="text-[#fafafa] font-bold">خلاصه رزرو</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-[#a1a1aa]">
                      <span>مسیر:</span>
                      <span className="text-[#fafafa]">
                        {booking.formData.origin} → {booking.formData.destination}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#a1a1aa]">
                      <span>تاریخ:</span>
                      <span className="text-[#fafafa]">{booking.formData.date || '---'}</span>
                    </div>
                    <div className="flex justify-between text-[#a1a1aa]">
                      <span>ساعت:</span>
                      <span className="text-[#fafafa]">{booking.formData.time || '---'}</span>
                    </div>
                    <div className="flex justify-between text-[#a1a1aa]">
                      <span>نوع خودرو:</span>
                      <span className="text-[#fafafa]">
                        {carOptions.find((c) => c.value === booking.formData.tripType)?.label || '---'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#a1a1aa]">
                      <span>تعداد مسافران:</span>
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

                {/* Coupon */}
                <div className="space-y-2">
                  <Label className="text-[#fafafa]">کد تخفیف</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="کد تخفیف"
                      value={booking.formData.couponCode}
                      onChange={(e) => updateBookingForm({ couponCode: e.target.value })}
                      className="bg-[#0a0a0a] border-[#333] text-[#fafafa]"
                      dir="ltr"
                    />
                  </div>
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

            {/* Success */}
            {booking.currentStep === 4 && booking.bookingCode && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 space-y-5"
              >
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                  <Check className="h-10 w-10 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-[#fafafa]">رزرو با موفقیت ثبت شد!</h3>
                <p className="text-[#a1a1aa]">
                  کد رهگیری شما:
                </p>
                <div className="inline-flex items-center gap-2 bg-[#0a0a0a] border border-[#D4AF37]/30 rounded-xl px-6 py-3">
                  <span className="text-[#D4AF37] font-bold text-xl tracking-wider" dir="ltr">
                    {booking.bookingCode}
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(booking.bookingCode || '')}
                    className="text-[#a1a1aa] hover:text-[#D4AF37] transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-[#a1a1aa] text-sm">
                  این کد را یادداشت کنید. از طریق پیامک نیز ارسال خواهد شد.
                </p>
                <Button
                  onClick={() => {
                    resetBooking();
                  }}
                  className="bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B]"
                >
                  بستن
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          {booking.bookingCode === null && booking.currentStep >= 0 && booking.currentStep < 4 && (
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
                disabled={!isStepValid() || booking.isSubmitting}
                className="bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B]"
              >
                {booking.isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    در حال ثبت...
                  </>
                ) : booking.currentStep === 3 ? (
                  'ثبت نهایی'
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

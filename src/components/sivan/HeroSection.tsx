'use client';

import { motion } from 'framer-motion';
import { MapPin, Calendar, Car, ArrowLeft, Clock, ShieldCheck, Star, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { JalaliDatePicker } from '@/components/sivan/JalaliDatePicker';

const carTypes = [
  { value: 'vip', label: 'VIP - لوکس' },
  { value: 'economy', label: 'اقتصادی' },
  { value: 'luxury', label: 'دربستی' },
  { value: 'van', label: 'ون' },
  { value: 'electric', label: 'برقی' },
];

const trustBadges = [
  { icon: Clock, label: 'پشتیبانی ۲۴/۷' },
  { icon: ShieldCheck, label: 'بیمه مسافری' },
  { icon: Star, label: 'امتیاز ۴.۹' },
];

export function HeroSection() {
  const { openAuth, updateBookingForm, setBookingStep } = useAppStore();

  const handleQuickBook = () => {
    setBookingStep(0);
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="/images/hero-bg.png"
          alt="پس‌زمینه"
          className="w-full h-full object-cover"
        />
        <div className="hero-overlay absolute inset-0" />
      </div>

      {/* Gold accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-l from-transparent via-[#D4AF37] to-transparent opacity-60" />

      <div className="relative container mx-auto px-4 sm:px-6 pt-24 pb-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center lg:text-right"
          >
            <Badge className="bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30 mb-6 px-4 py-1.5 text-sm">
              <CrownIcon className="h-3.5 w-3.5 ml-1.5" />
              تاکسی VIP بین شهری
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              <span className="text-[#fafafa]">سفری </span>
              <span className="text-gold-gradient">لوکس</span>
              <span className="text-[#fafafa]">، راحت و </span>
              <span className="text-gold-gradient">ایمن</span>
              <br />
              <span className="text-[#fafafa]">با </span>
              <span className="text-gold-shimmer text-4xl sm:text-5xl md:text-6xl lg:text-7xl">سیوان</span>
            </h1>
            <p className="text-[#a1a1aa] text-base sm:text-lg max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
              با ناوگان لوکس و رانندگان حرفه‌ای، تجربه‌ای بی‌نظیر از سفر بین شهری را با سیوان داشته باشید.
              رزرو آنلاین، قیمت شفاف و پشتیبانی ۲۴ ساعته.
            </p>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 sm:gap-6">
              {trustBadges.map((badge, index) => (
                <motion.div
                  key={badge.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                  className="flex items-center gap-2 text-[#a1a1aa]"
                >
                  <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                    <badge.icon className="h-5 w-5 text-[#D4AF37]" />
                  </div>
                  <span className="text-sm">{badge.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick Booking Form */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="bg-[#1a1a1a]/90 backdrop-blur-xl rounded-2xl border border-[#D4AF37]/20 p-6 sm:p-8 shadow-2xl shadow-black/40">
              <h2 className="text-xl sm:text-2xl font-bold text-[#fafafa] mb-1">
                رزرو سریع
              </h2>
              <p className="text-[#a1a1aa] text-sm mb-6">
                در کمترین زمان سفر خود را رزرو کنید
              </p>

              <div className="space-y-4">
                {/* Origin */}
                <div className="space-y-2">
                  <Label htmlFor="origin" className="text-[#a1a1aa] text-sm">
                    <MapPin className="h-3.5 w-3.5 ml-1.5 text-[#D4AF37]" />
                    مبدأ
                  </Label>
                  <Input
                    id="origin"
                    placeholder="شهر مبدا را وارد کنید"
                    className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-11 focus:border-[#D4AF37]/50"
                    onChange={(e) => updateBookingForm({ origin: e.target.value })}
                  />
                </div>

                {/* Destination */}
                <div className="space-y-2">
                  <Label htmlFor="destination" className="text-[#a1a1aa] text-sm">
                    <MapPin className="h-3.5 w-3.5 ml-1.5 text-[#E5C76B]" />
                    مقصد
                  </Label>
                  <Input
                    id="destination"
                    placeholder="شهر مقصد را وارد کنید"
                    className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-11 focus:border-[#D4AF37]/50"
                    onChange={(e) => updateBookingForm({ destination: e.target.value })}
                  />
                </div>

                {/* Date & Car Type */}
                <div className="grid grid-cols-2 gap-3">
                  <JalaliDatePicker
                    value={useAppStore.getState().booking.formData.date}
                    onChange={(val) => updateBookingForm({ date: val })}
                    placeholder="انتخاب تاریخ"
                  />
                  <div className="space-y-2">
                    <Label className="text-[#a1a1aa] text-sm">
                      <Car className="h-3.5 w-3.5 ml-1.5 text-[#D4AF37]" />
                      نوع خودرو
                    </Label>
                    <Select
                      onValueChange={(val) => updateBookingForm({ tripType: val as 'economy' | 'vip' | 'luxury' | 'van' | 'electric' })}
                      defaultValue="vip"
                    >
                      <SelectTrigger className="w-full bg-[#0a0a0a] border-[#333] text-[#fafafa] h-11 focus:border-[#D4AF37]/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-[#333]">
                        {carTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value} className="text-[#fafafa]">
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Submit */}
                <Button
                  onClick={handleQuickBook}
                  className="w-full h-12 bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] font-bold text-base rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-[#D4AF37]/20"
                >
                  ثبت درخواست رزرو
                  <ArrowLeft className="h-5 w-5 mr-2" />
                </Button>

                {/* Phone CTA */}
                <div className="text-center">
                  <span className="text-[#a1a1aa] text-xs">یا تماس مستقیم: </span>
                  <a
                    href="tel:09109419743"
                    className="text-[#D4AF37] text-sm font-medium hover:underline"
                    dir="ltr"
                  >
                    0910-941-9743
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
    </section>
  );
}

function CrownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  );
}

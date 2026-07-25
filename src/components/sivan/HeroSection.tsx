'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  ArrowLeft,
  Clock,
  ShieldCheck,
  Star,
  Phone,
  Route,
  Navigation,
  Loader2,
  AlertCircle,
  Car,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { JalaliDatePicker } from '@/components/sivan/JalaliDatePicker';
import { CitySelector } from '@/components/sivan/CitySelector';

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

const RATES: Record<string, number> = {
  economy: 2000,
  vip: 3000,
  luxury: 5000,
  van: 2500,
  electric: 3500,
};
const BASE_FARE = 500000;

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fa-IR').format(price);
}

function getCityDisplayName(city: { province: string; city: string; district?: string; neighborhood?: string }): string {
  if (city.neighborhood) return `${city.neighborhood}، ${city.district}، ${city.province}`;
  if (city.district) return `${city.district}، ${city.province}`;
  if (city.city) return `${city.city}، ${city.province}`;
  return city.province;
}

export function HeroSection() {
  const {
    booking,
    updateBookingForm,
    setBookingStep,
    setEstimatedPrice,
  } = useAppStore();

  const [heroOrigin, setHeroOrigin] = useState({ province: '', city: '' });
  const [heroDest, setHeroDest] = useState({ province: '', city: '' });
  const [heroCarType, setHeroCarType] = useState<'economy' | 'vip' | 'luxury' | 'van' | 'electric'>('vip');
  const [heroDate, setHeroDate] = useState('');
  const [distanceLoading, setDistanceLoading] = useState(false);
  const [distanceData, setDistanceData] = useState<{ distanceKm: number; durationMin: number; durationFormatted: string } | null>(null);
  const [distanceError, setDistanceError] = useState('');
  const [price, setPrice] = useState<number | null>(null);

  // Calculate distance when both cities selected
  const fetchDistance = useCallback(async () => {
    if (!heroOrigin.city || !heroDest.city || heroOrigin.city === heroDest.city) {
      setDistanceData(null);
      setPrice(null);
      setDistanceError('');
      return;
    }

    setDistanceLoading(true);
    setDistanceError('');

    try {
      const originQuery = heroOrigin.neighborhood || heroOrigin.district || heroOrigin.city;
      const destQuery = heroDest.neighborhood || heroDest.district || heroDest.city;

      const res = await fetch(
        `/api/distance?origin=${encodeURIComponent(originQuery)}&destination=${encodeURIComponent(destQuery)}`
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'خطا در محاسبه فاصله' }));
        throw new Error(err.error || 'خطا');
      }

      const data = await res.json();
      setDistanceData({
        distanceKm: data.distanceKm,
        durationMin: data.durationMin,
        durationFormatted: data.durationFormatted,
      });
    } catch (err) {
      setDistanceError(err instanceof Error ? err.message : 'خطا در محاسبه فاصله');
      setDistanceData(null);
    } finally {
      setDistanceLoading(false);
    }
  }, [heroOrigin, heroDest]);

  useEffect(() => {
    if (heroOrigin.city && heroDest.city && heroOrigin.city !== heroDest.city) {
      const timer = setTimeout(fetchDistance, 600);
      return () => clearTimeout(timer);
    }
  }, [heroOrigin.city, heroDest.city, fetchDistance]);

  // Calculate price when distance or car type changes
  useEffect(() => {
    if (distanceData) {
      const rate = RATES[heroCarType] || 3000;
      const calcPrice = Math.round(BASE_FARE + distanceData.distanceKm * rate);
      setPrice(calcPrice);
    } else {
      setPrice(null);
    }
  }, [distanceData, heroCarType]);

  const handleQuickBook = () => {
    // Copy hero selections to booking form and open modal at step 1 (time selection)
    updateBookingForm({
      originCity: heroOrigin,
      destCity: heroDest,
      origin: heroOrigin.neighborhood || heroOrigin.district || heroOrigin.city,
      destination: heroDest.neighborhood || heroDest.district || heroDest.city,
      distanceKm: distanceData?.distanceKm,
      durationMin: distanceData?.durationMin,
      date: heroDate,
      tripType: heroCarType,
    });
    // Open booking modal starting from step 1 (time)
    setBookingStep(1);
  };

  const canBook = heroOrigin.city.length > 0 && heroDest.city.length > 0 && !distanceLoading;

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
                {/* Origin City Selector */}
                <CitySelector
                  label="شهر مبدأ"
                  iconColor="#D4AF37"
                  value={heroOrigin}
                  onChange={setHeroOrigin}
                  placeholder="استان و شهر مبدأ را انتخاب کنید"
                />

                {/* Destination City Selector */}
                <CitySelector
                  label="شهر مقصد"
                  iconColor="#E5C76B"
                  value={heroDest}
                  onChange={setHeroDest}
                  placeholder="استان و شهر مقصد را انتخاب کنید"
                />

                {/* Distance & Price Info */}
                <AnimatePresence mode="wait">
                  {(distanceLoading || distanceData || distanceError) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 bg-[#0a0a0a]/80 rounded-xl border border-[#333]">
                        {distanceLoading && (
                          <div className="flex items-center gap-2 text-[#D4AF37] py-1">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-xs">در حال محاسبه مسیر...</span>
                          </div>
                        )}
                        {!distanceLoading && distanceData && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5 text-[#fafafa]">
                                <Route className="h-4 w-4 text-[#D4AF37]" />
                                <span className="text-sm font-bold">
                                  {new Intl.NumberFormat('fa-IR').format(distanceData.distanceKm)} km
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[#a1a1aa]">
                                <Navigation className="h-3.5 w-3.5" />
                                <span className="text-xs">{distanceData.durationFormatted}</span>
                              </div>
                            </div>
                            {price !== null && (
                              <div className="text-[#D4AF37] font-bold text-sm">
                                {formatPrice(price)} تومان
                              </div>
                            )}
                          </div>
                        )}
                        {!distanceLoading && distanceError && (
                          <div className="flex items-center gap-2 text-red-400">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            <span className="text-xs">{distanceError}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Date & Car Type */}
                <div className="grid grid-cols-2 gap-3">
                  <JalaliDatePicker
                    value={heroDate}
                    onChange={setHeroDate}
                    placeholder="انتخاب تاریخ"
                  />
                  <div className="space-y-2">
                    <Label className="text-[#a1a1aa] text-sm">
                      <Car className="h-3.5 w-3.5 ml-1.5 text-[#D4AF37]" />
                      نوع خودرو
                    </Label>
                    <Select
                      onValueChange={(val) => setHeroCarType(val as 'economy' | 'vip' | 'luxury' | 'van' | 'electric')}
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
                  disabled={!canBook}
                  className="w-full h-12 bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] font-bold text-base rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-[#D4AF37]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {distanceLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                      در حال محاسبه...
                    </>
                  ) : (
                    <>
                      ثبت درخواست رزرو
                      <ArrowLeft className="h-5 w-5 mr-2" />
                    </>
                  )}
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

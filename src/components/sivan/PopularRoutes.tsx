'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, ArrowLeft, Clock, Route } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { toPersianDigits } from '@/lib/jalaali';

type PopularRoute = {
  id: number;
  origin: string;
  destination: string;
  distanceKm: number;
  duration: string;
  tripType: string;
  tripTypeLabel: string;
  price: number;
  priceLabel: string;
  image: string | null;
  isPopular: boolean;
  sortOrder: number;
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function RouteCardSkeleton() {
  return (
    <Card className="bg-[#1a1a1a] border-[#333] overflow-hidden">
      <CardContent className="p-5 sm:p-6 animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-4 w-16 bg-[#333] rounded" />
            <div className="h-4 w-4 bg-[#333] rounded" />
            <div className="h-4 w-16 bg-[#333] rounded" />
          </div>
          <div className="h-5 w-14 bg-[#333] rounded-full" />
        </div>
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-4">
            <div className="h-3.5 w-20 bg-[#333] rounded" />
            <div className="h-3.5 w-20 bg-[#333] rounded" />
          </div>
          <div className="text-left">
            <div className="h-3 w-12 bg-[#333] rounded mb-1.5" />
            <div className="h-5 w-24 bg-[#333] rounded" />
          </div>
        </div>
        <div className="h-9 w-full mt-4 bg-[#333] rounded-md" />
      </CardContent>
    </Card>
  );
}

export function PopularRoutes() {
  const { updateBookingForm, setBookingStep } = useAppStore();
  const [routes, setRoutes] = useState<PopularRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(false);
        const res = await fetch('/api/routes/popular', { cache: 'no-store' });
        if (!res.ok) throw new Error('failed');
        const data = (await res.json()) as PopularRoute[];
        if (cancelled) return;
        setRoutes(Array.isArray(data) ? data : []);
      } catch {
        if (cancelled) return;
        setError(true);
        setRoutes([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRouteClick = (origin: string, destination: string) => {
    updateBookingForm({ origin, destination });
    setBookingStep(1);
    const el = document.querySelector('#hero');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="routes" className="py-20 sm:py-24 bg-[#0a0a0a] relative">
      {/* Decorative */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-l from-transparent via-[#D4AF37] to-transparent rounded-full" />

      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <Badge className="bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30 mb-4 px-4 py-1.5">
            <Route className="h-3.5 w-3.5 ml-1.5" />
            محبوب‌ترین مسیرها
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#fafafa] mb-4">
            مسیرهای <span className="text-gold-gradient">پرطرفدار</span>
          </h2>
          <p className="text-[#a1a1aa] max-w-2xl mx-auto">
            پرترددترین مسیرهای بین شهری را با بهترین قیمت و بالاترین کیفیت سفر کنید
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <RouteCardSkeleton key={i} />
            ))}
          </div>
        ) : error || routes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#a1a1aa] text-lg">
              {error ? 'در حال بارگذاری مسیرها...' : 'مسیری یافت نشد'}
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            {routes.map((route) => (
              <motion.div key={route.id} variants={itemVariants}>
                <Card
                  className="bg-[#1a1a1a] border-[#333] hover:border-[#D4AF37]/30 card-gold-glow group cursor-pointer overflow-hidden"
                  onClick={() => handleRouteClick(route.origin, route.destination)}
                >
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center text-[#D4AF37]">
                          <MapPin className="h-4 w-4 ml-1" />
                          <span className="font-bold text-[#fafafa]">{route.origin}</span>
                        </div>
                        <ArrowLeft className="h-4 w-4 text-[#a1a1aa]" />
                        <div className="flex items-center text-[#E5C76B]">
                          <span className="font-bold text-[#fafafa]">{route.destination}</span>
                          <MapPin className="h-4 w-4 mr-1" />
                        </div>
                      </div>
                      <Badge className="bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30 text-xs">
                        {route.tripTypeLabel}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-[#a1a1aa]">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {route.duration}
                        </span>
                        <span className="hidden sm:flex items-center gap-1">
                          <Route className="h-3.5 w-3.5" />
                          {toPersianDigits(route.distanceKm)} کیلومتر
                        </span>
                      </div>
                      <div className="text-left">
                        <span className="text-xs text-[#a1a1aa]">شروع از</span>
                        <div className="text-[#D4AF37] font-bold text-lg">
                          {route.priceLabel}
                          <span className="text-xs text-[#a1a1aa] mr-1">تومان</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      className="w-full mt-4 text-[#D4AF37] hover:bg-[#D4AF37]/10 group-hover:translate-x-1 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRouteClick(route.origin, route.destination);
                      }}
                    >
                      رزرو این مسیر
                      <ArrowLeft className="h-4 w-4 mr-1" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}

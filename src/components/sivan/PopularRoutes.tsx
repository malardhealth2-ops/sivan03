'use client';

import { motion } from 'framer-motion';
import { MapPin, ArrowLeft, Clock, Route } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';

const routes = [
  {
    id: 1,
    origin: 'تهران',
    destination: 'تبریز',
    price: '۱,۲۰۰,۰۰۰',
    duration: '~۶ ساعت',
    distance: '۶۲۸ کیلومتر',
    popular: true,
  },
  {
    id: 2,
    origin: 'تهران',
    destination: 'اصفهان',
    price: '۸۰۰,۰۰۰',
    duration: '~۴ ساعت',
    distance: '۴۳۶ کیلومتر',
    popular: true,
  },
  {
    id: 3,
    origin: 'تهران',
    destination: 'شیراز',
    price: '۱,۵۰۰,۰۰۰',
    duration: '~۸ ساعت',
    distance: '۹۳۴ کیلومتر',
    popular: false,
  },
  {
    id: 4,
    origin: 'تهران',
    destination: 'مشهد',
    price: '۱,۸۰۰,۰۰۰',
    duration: '~۹ ساعت',
    distance: '۹۰۰ کیلومتر',
    popular: true,
  },
  {
    id: 5,
    origin: 'تهران',
    destination: 'رشت',
    price: '۹۰۰,۰۰۰',
    duration: '~۵ ساعت',
    distance: '۳۷۵ کیلومتر',
    popular: false,
  },
  {
    id: 6,
    origin: 'تهران',
    destination: 'کرمانشاه',
    price: '۱,۱۰۰,۰۰۰',
    duration: '~۶ ساعت',
    distance: '۵۲۵ کیلومتر',
    popular: false,
  },
];

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

export function PopularRoutes() {
  const { updateBookingForm, setBookingStep } = useAppStore();

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

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        >
          {routes.map((route) => (
            <motion.div key={route.id} variants={itemVariants}>
              <Card className="bg-[#1a1a1a] border-[#333] hover:border-[#D4AF37]/30 card-gold-glow group cursor-pointer overflow-hidden"
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
                    {route.popular && (
                      <Badge className="bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30 text-xs">
                        محبوب
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-[#a1a1aa]">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {route.duration}
                      </span>
                      <span className="hidden sm:flex items-center gap-1">
                        <Route className="h-3.5 w-3.5" />
                        {route.distance}
                      </span>
                    </div>
                    <div className="text-left">
                      <span className="text-xs text-[#a1a1aa]">شروع از</span>
                      <div className="text-[#D4AF37] font-bold text-lg">
                        {route.price}
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
      </div>
    </section>
  );
}

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Gauge, Snowflake, Wifi, Shield, Car as CarIcon, Zap, Fuel } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAppStore } from '@/lib/store';

const vehicles = [
  {
    id: 'sonata',
    name: 'هیوندای سوناتا',
    image: '/images/vip-car.png',
    capacity: '۴ نفر',
    features: ['صندلی چرم', 'تهویه اتوماتیک', 'روشنایی LED', 'صفحه نمایش'],
    specs: { engine: '۲۰۰۰ سی‌سی', fuel: 'بنزینی', auto: 'دنده اتوماتیک' },
    description: 'ترکیبی از راحتی و لوکس بودن برای سفرهای بین شهری',
  },
  {
    id: 'mercedes',
    name: 'مرسدس بنز',
    image: '/images/luxury-car.png',
    capacity: '۴ نفر',
    features: ['صندلی چرم گرمایشی', 'سقف پانوراما', 'صدای surround', 'بارجیو'],
    specs: { engine: '۲۵۰۰ سی‌سی', fuel: 'بنزینی', auto: 'دنده اتوماتیک' },
    description: 'بهترین تجربه لوکس سفر با مرسدس بنز',
  },
  {
    id: 'electric',
    name: 'خودرو برقی',
    image: '/images/electric-car.png',
    capacity: '۴ نفر',
    features: ['بدون صدای موتور', 'صندلی چرم', 'اتوپایلوت', 'شارژ سریع'],
    specs: { engine: 'الکتریکی', fuel: 'برقی', auto: 'دنده اتوماتیک' },
    description: 'سفر دوستدار محیط زیست با تکنولوژی برقی',
  },
  {
    id: 'van',
    name: 'ون مسافربری',
    image: '/images/van-car.png',
    capacity: '۸ نفر',
    features: ['فضای زیاد', 'صندلی تاشو', 'تهویه قوی', 'باربرداری'],
    specs: { engine: '۲۴۰۰ سی‌سی', fuel: 'دیزلی', auto: 'دنده دستی/اتوماتیک' },
    description: 'مناسب برای سفرهای خانوادگی و گروهی بزرگ',
  },
];

export function FleetSection() {
  const { updateBookingForm, setBookingStep } = useAppStore();

  const handleSelectVehicle = (id: string) => {
    const typeMap: Record<string, 'economy' | 'vip' | 'luxury' | 'van' | 'electric'> = {
      sonata: 'vip',
      mercedes: 'luxury',
      electric: 'electric',
      van: 'van',
    };
    updateBookingForm({ tripType: typeMap[id] || 'vip' });
    setBookingStep(1);
    const el = document.querySelector('#hero');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="fleet" className="py-20 sm:py-24 bg-[#0a0a0a] relative">
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
            <CarIcon className="h-3.5 w-3.5 ml-1.5" />
            ناوگان ما
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#fafafa] mb-4">
            ناوگان <span className="text-gold-gradient">لوکس</span> سیوان
          </h2>
          <p className="text-[#a1a1aa] max-w-2xl mx-auto">
            ناوگان متنوع از خودروهای لوکس و اقتصادی برای هر نوع سفر
          </p>
        </motion.div>

        <Tabs defaultValue="sonata" className="w-full">
          <TabsList className="mx-auto flex w-fit bg-[#1a1a1a] border border-[#333] p-1 rounded-xl mb-8 sm:mb-10">
            {vehicles.map((v) => (
              <TabsTrigger
                key={v.id}
                value={v.id}
                className="px-3 sm:px-5 py-2 text-sm text-[#a1a1aa] data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#0a0a0a] data-[state=active]:shadow-lg rounded-lg transition-all"
              >
                {v.name.split(' ').slice(-1)[0]}
              </TabsTrigger>
            ))}
          </TabsList>

          {vehicles.map((vehicle) => (
            <TabsContent key={vehicle.id} value={vehicle.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="bg-[#1a1a1a] border-[#333] overflow-hidden">
                  <div className="grid md:grid-cols-2 gap-0">
                    {/* Image */}
                    <div className="relative h-64 md:h-auto overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d]">
                      <img
                        src={vehicle.image}
                        alt={vehicle.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/60 to-transparent md:bg-gradient-to-l md:from-transparent md:to-[#1a1a1a]/60" />
                    </div>

                    {/* Details */}
                    <CardContent className="p-6 sm:p-8 flex flex-col justify-center">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl sm:text-2xl font-bold text-[#fafafa]">
                          {vehicle.name}
                        </h3>
                        <Badge className="bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30">
                          <Users className="h-3 w-3 ml-1" />
                          {vehicle.capacity}
                        </Badge>
                      </div>

                      <p className="text-[#a1a1aa] mb-6">{vehicle.description}</p>

                      {/* Specs */}
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="text-center p-3 bg-[#0a0a0a] rounded-lg">
                          <Gauge className="h-4 w-4 text-[#D4AF37] mx-auto mb-1" />
                          <span className="text-xs text-[#a1a1aa]">{vehicle.specs.engine}</span>
                        </div>
                        <div className="text-center p-3 bg-[#0a0a0a] rounded-lg">
                          <Fuel className="h-4 w-4 text-[#D4AF37] mx-auto mb-1" />
                          <span className="text-xs text-[#a1a1aa]">{vehicle.specs.fuel}</span>
                        </div>
                        <div className="text-center p-3 bg-[#0a0a0a] rounded-lg">
                          <Zap className="h-4 w-4 text-[#D4AF37] mx-auto mb-1" />
                          <span className="text-xs text-[#a1a1aa]">{vehicle.specs.auto}</span>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        {vehicle.features.map((feature) => (
                          <span
                            key={feature}
                            className="px-3 py-1.5 bg-[#2d2d2d] rounded-full text-xs text-[#a1a1aa]"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>

                      <Button
                        onClick={() => handleSelectVehicle(vehicle.id)}
                        className="bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] font-bold"
                      >
                        رزرو با {vehicle.name.split(' ').slice(-1)[0]}
                      </Button>
                    </CardContent>
                  </div>
                </Card>
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}

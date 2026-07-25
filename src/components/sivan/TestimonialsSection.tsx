'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';

const testimonials = [
  {
    id: 1,
    name: 'علی محمدی',
    role: 'مسافر دائمی',
    rating: 5,
    comment: 'سفر فوق‌العاده‌ای بود. راننده بسیار مؤدب و حرفه‌ای بود. خودرو تمیز و با امکانات کامل. قطعاً دوباره از سیوان استفاده می‌کنم.',
    trip: 'تهران → اصفهان',
  },
  {
    id: 2,
    name: 'سارا احمدی',
    role: 'کارمند شرکتی',
    rating: 5,
    comment: 'بهترین تجربه سفر بین شهری. خودرو تمیز و راحت. قیمت هم بسیار مناسب بود نسبت به کیفیت ارائه شده. پیشنهاد می‌کنم.',
    trip: 'تهران → شیراز',
  },
  {
    id: 3,
    name: 'رضا کریمی',
    role: 'دانشجو',
    rating: 5,
    comment: 'قیمت مناسب و کیفیت عالی. از رزرو آنلاین تا پایان سفر همه چیز عالی بود. پشتیبانی هم خیلی سریع جواب داد.',
    trip: 'تهران → مشهد',
  },
  {
    id: 4,
    name: 'مریم حسینی',
    role: 'مدیر فروش',
    rating: 4,
    comment: 'برای سفرهای کاری از تاکسی VIP سیوان استفاده می‌کنم. همیشه وقت‌شناس هستند و کیفیت خدمات یکدست و عالی است.',
    trip: 'تهران → تبریز',
  },
  {
    id: 5,
    name: 'حسین رضایی',
    role: 'مهندس',
    rating: 5,
    comment: 'با خانواده سفر کردیم و فوق‌العاده بود. ون بزرگ و راحت بود. راننده صبور و محترمانه رانندگی کرد. ممنون سیوان.',
    trip: 'تهران → رشت',
  },
  {
    id: 6,
    name: 'فاطمه عباسی',
    role: 'پزشک',
    rating: 5,
    comment: 'بعد از یک روز کاری طولانی، سفر با سیوان واقعاً آرامش‌بخش بود. خودرو تمیز، بوی خوش و فضای دلنشین. عالی بود.',
    trip: 'تهران → کرمانشاه',
  },
];

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-[#333]'}`}
        />
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section className="py-20 sm:py-24 bg-[#0a0a0a] relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-l from-transparent via-[#D4AF37] to-transparent rounded-full" />

      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#fafafa] mb-4">
            نظرات <span className="text-gold-gradient">مسافران</span>
          </h2>
          <p className="text-[#a1a1aa] max-w-2xl mx-auto">
            ببینید مسافران ما درباره سفر با سیوان چه می‌گویند
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Carousel
            opts={{
              align: 'start',
              loop: true,
              slidesToScroll: 1,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {testimonials.map((testimonial) => (
                <CarouselItem key={testimonial.id} className="pl-4 sm:basis-1/2 lg:basis-1/3">
                  <Card className="bg-[#1a1a1a] border-[#333] hover:border-[#D4AF37]/20 card-gold-glow h-full">
                    <CardContent className="p-5 sm:p-6 flex flex-col h-full">
                      {/* Quote icon */}
                      <Quote className="h-8 w-8 text-[#D4AF37]/20 mb-3 self-start" />

                      {/* Comment */}
                      <p className="text-[#a1a1aa] text-sm leading-relaxed flex-1 mb-4">
                        &ldquo;{testimonial.comment}&rdquo;
                      </p>

                      {/* Rating */}
                      <RatingStars rating={testimonial.rating} />

                      {/* Author */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#333]">
                        <div>
                          <div className="font-bold text-[#fafafa] text-sm">
                            {testimonial.name}
                          </div>
                          <div className="text-[#a1a1aa] text-xs">
                            {testimonial.role}
                          </div>
                        </div>
                        <span className="text-xs text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-1 rounded-full">
                          {testimonial.trip}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6"
        >
          {[
            { value: '+۱۵,۰۰۰', label: 'مسافر راضی' },
            { value: '۴.۹', label: 'امتیاز میانگین' },
            { value: '+۵۰', label: 'شهر تحت پوشش' },
            { value: '۹۹٪', label: 'رضایت مشتری' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center p-4 sm:p-6 bg-[#1a1a1a] border border-[#333] rounded-xl"
            >
              <div className="text-2xl sm:text-3xl font-bold text-[#D4AF37] mb-1">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-[#a1a1aa]">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

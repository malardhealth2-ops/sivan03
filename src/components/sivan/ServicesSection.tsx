'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';

type TripType = 'economy' | 'vip' | 'luxury' | 'van' | 'electric';

const services: {
  id: number;
  title: string;
  description: string;
  image: string;
  features: string[];
  badge: string;
  tripType: TripType;
}[] = [
  {
    id: 1,
    title: 'اقتصادی',
    description:
      'سفر با قیمت مناسب و کیفیت مطلوب. خودروهای تمیز و مرتب با رانندگان مجرب و رفتار حرفه‌ای.',
    image: '/images/economy-car.png',
    features: ['قیمت مناسب', 'خودرو تمیز', 'راننده مجرب', 'پرداخت آسان'],
    badge: 'اقتصادی',
    tripType: 'economy',
  },
  {
    id: 2,
    title: 'ویژه',
    description:
      'سفر با خودروهای لوکس و مجهز به امکانات رفاهی کامل. صندلی‌های چرم، سیستم تهویه پیشرفته و فضای اختصاصی.',
    image: '/images/vip-car.png',
    features: ['خودروهای لوکس', 'صندلی چرم', 'WiFi رایگان', 'آب معدنی'],
    badge: 'پرفروش',
    tripType: 'vip',
  },
  {
    id: 3,
    title: 'لوکس',
    description:
      'خودرو اختصاصی فقط برای شما و همراهانتان. بدون توقف اضافی و مسیر مستقیم به مقصد با بالاترین کیفیت.',
    image: '/images/luxury-car.png',
    features: ['خودرو اختصاصی', 'بدون توقف', 'مسیر مستقیم', 'حریم خصوصی'],
    badge: 'لوکس',
    tripType: 'luxury',
  },
  {
    id: 4,
    title: 'سوپر لوکس',
    description:
      'بالاترین تجربه سفر با خودروهای پریمیوم و امکانات ویژه. مناسب برای مهمانداری و سفرهای خاص.',
    image: '/images/electric-car.png',
    features: ['خودرو پریمیوم', 'امکانات ویژه', 'بارجیو', 'خدمات VIP'],
    badge: 'سوپر لوکس',
    tripType: 'electric',
  },
  {
    id: 5,
    title: 'خانوادگی',
    description:
      'خودرویی جادار و راحت برای سفرهای خانوادگی و گروهی. فضای کافی برای بار و راحتی کودکان.',
    image: '/images/van-car.png',
    features: ['فضای جادار', 'مناسب خانواده', 'باربرداری', 'صندلی راحت'],
    badge: 'خانوادگی',
    tripType: 'van',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export function ServicesSection() {
  const { updateBookingForm, setBookingStep } = useAppStore();

  const handleServiceClick = (tripType: TripType) => {
    updateBookingForm({ tripType });
    setBookingStep(1);
    const el = document.querySelector('#hero');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="services" className="py-20 sm:py-24 bg-[#111111] relative">
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
            <Sparkles className="h-3.5 w-3.5 ml-1.5" />
            خدمات ما
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#fafafa] mb-4">
            انواع <span className="text-gold-gradient">خدمات سفر</span>
          </h2>
          <p className="text-[#a1a1aa] max-w-2xl mx-auto">
            بر اساس نیاز و بودجه خود، بهترین نوع سفر را انتخاب کنید
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6"
        >
          {services.map((service) => (
            <motion.div key={service.id} variants={itemVariants}>
              <Card className="bg-[#1a1a1a] border-[#333] hover:border-[#D4AF37]/30 card-gold-glow group overflow-hidden h-full">
                {/* Image */}
                <div className="relative h-48 sm:h-56 overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d]">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] to-transparent" />
                  <Badge className="absolute top-3 right-3 bg-[#D4AF37] text-[#0a0a0a] border-0 font-medium">
                    {service.badge}
                  </Badge>
                </div>

                <CardContent className="p-5 sm:p-6 flex flex-col flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-[#fafafa] mb-3">
                    {service.title}
                  </h3>
                  <p className="text-[#a1a1aa] text-sm leading-relaxed mb-4 flex-1">
                    {service.description}
                  </p>

                  {/* Features */}
                  <div className="grid grid-cols-2 gap-2 mb-5">
                    {service.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center gap-1.5 text-sm text-[#a1a1aa]"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleServiceClick(service.tripType)}
                    className="w-full bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37] hover:text-[#0a0a0a] transition-all duration-300"
                  >
                    رزرو این خدمت
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

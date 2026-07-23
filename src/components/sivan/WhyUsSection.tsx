'use client';

import { motion } from 'framer-motion';
import {
  ShieldCheck,
  DollarSign,
  Headphones,
  Award,
  Gem,
  CreditCard,
} from 'lucide-react';

const reasons = [
  {
    icon: ShieldCheck,
    title: 'امنیت بالا',
    description: 'تمامی سفرها با بیمه مسافری کامل و رانندگان تایید شده انجام می‌شود.',
  },
  {
    icon: DollarSign,
    title: 'قیمت مناسب',
    description: 'قیمت‌گذاری شفاف و منصفانه بدون هزینه‌های پنهان و اضافی.',
  },
  {
    icon: Headphones,
    title: 'پشتیبانی ۲۴/۷',
    description: 'تیم پشتیبانی ما به صورت شبانه‌روزی آماده پاسخگویی به شماست.',
  },
  {
    icon: Award,
    title: 'رانندگان حرفه‌ای',
    description: 'رانندگان مجرب و خوش‌اخلاق با سال‌ها تجربه سفر بین شهری.',
  },
  {
    icon: Gem,
    title: 'کیفیت خدمات',
    description: 'خودروهای لوکس و تمیز با امکانات رفاهی کامل برای راحتی شما.',
  },
  {
    icon: CreditCard,
    title: 'پرداخت آسان',
    description: 'پرداخت آنلاین، کارت به کارت و نقدی - هر روشی که راحت‌ترید.',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function WhyUsSection() {
  return (
    <section id="why-us" className="py-20 sm:py-24 bg-[#111111] relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-[#D4AF37]/3 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#D4AF37]/2 rounded-full blur-3xl" />

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-l from-transparent via-[#D4AF37] to-transparent rounded-full" />

      <div className="container mx-auto px-4 sm:px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#fafafa] mb-4">
            چرا <span className="text-gold-gradient">سیوان</span>؟
          </h2>
          <p className="text-[#a1a1aa] max-w-2xl mx-auto">
            دلایلی که هزاران مسافر سیوان را برای سفرهای بین شهری انتخاب می‌کنند
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
        >
          {reasons.map((reason, index) => (
            <motion.div
              key={reason.title}
              variants={itemVariants}
              className="group relative bg-[#1a1a1a] border border-[#333] hover:border-[#D4AF37]/30 rounded-2xl p-6 sm:p-8 card-gold-glow transition-all duration-300"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center mb-5 group-hover:bg-[#D4AF37]/20 transition-colors">
                <reason.icon className="h-7 w-7 text-[#D4AF37]" />
              </div>

              <h3 className="text-lg font-bold text-[#fafafa] mb-3">
                {reason.title}
              </h3>
              <p className="text-[#a1a1aa] text-sm leading-relaxed">
                {reason.description}
              </p>

              {/* Number indicator */}
              <span className="absolute top-6 left-6 text-5xl font-bold text-[#D4AF37]/5 group-hover:text-[#D4AF37]/10 transition-colors">
                ۰{index + 1}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

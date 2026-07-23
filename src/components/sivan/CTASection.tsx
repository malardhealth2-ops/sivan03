'use client';

import { motion } from 'framer-motion';
import { Phone, ArrowLeft, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';

export function CTASection() {
  const { setContactOpen } = useAppStore();

  return (
    <section id="contact" className="py-20 sm:py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 via-[#0a0a0a] to-[#D4AF37]/5" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-l from-transparent via-[#D4AF37] to-transparent rounded-full" />

      {/* Decorative elements */}
      <div className="absolute top-10 right-20 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-20 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#fafafa] mb-6 leading-tight">
            آماده <span className="text-gold-shimmer">سفر</span> هستید؟
          </h2>
          <p className="text-[#a1a1aa] text-base sm:text-lg max-w-2xl mx-auto mb-10">
            همین حالا سفر خود را رزرو کنید یا با ما تماس بگیرید. تیم سیوان آماده خدمت‌رسانی به شماست.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <a href="tel:09109419743">
              <Button
                size="lg"
                className="bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] font-bold text-base px-8 h-13 rounded-xl shadow-lg shadow-[#D4AF37]/20 transition-all"
              >
                <Phone className="h-5 w-5 ml-2" />
                <span dir="ltr">0910-941-9743</span>
              </Button>
            </a>
            <Button
              onClick={() => setContactOpen(true)}
              size="lg"
              variant="outline"
              className="border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10 font-medium px-8 h-13 rounded-xl"
            >
              <MessageCircle className="h-5 w-5 ml-2" />
              ارسال پیام
            </Button>
          </div>

          {/* Phone numbers */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#a1a1aa]">
            <a href="tel:09109419743" className="hover:text-[#D4AF37] transition-colors" dir="ltr">
              0910-941-9743
            </a>
            <span className="text-[#333]">|</span>
            <a href="tel:09368816807" className="hover:text-[#D4AF37] transition-colors" dir="ltr">
              0936-881-6807
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

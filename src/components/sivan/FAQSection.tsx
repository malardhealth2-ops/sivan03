'use client';

import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  {
    id: 'faq-1',
    question: 'هزینه سفر چگونه محاسبه می‌شود؟',
    answer: 'هزینه سفر بر اساس مسافت، نوع خودرو انتخابی و زمان سفر محاسبه می‌شود. تمام هزینه‌ها قبل از سفر به شما اطلاع داده می‌شود و هیچ هزینه پنهانی وجود ندارد. قیمت‌گذاری ما کاملاً شفاف و منصفانه است.',
  },
  {
    id: 'faq-2',
    question: 'آیا امکان لغو رزرو وجود دارد؟',
    answer: 'بله، شما می‌توانید تا ۲ ساعت قبل از زمان سفر، رزرو خود را رایگان لغو کنید. در صورت لغو کمتر از ۲ ساعت قبل، مبلغی بابت جریمه کسر خواهد شد. جزئیات بیشتر در قوانین لغو رزرو موجود است.',
  },
  {
    id: 'faq-3',
    question: 'روش‌های پرداخت چیست؟',
    answer: 'شما می‌توانید از طریق پرداخت آنلاین (درگاه بانکی)، کارت به کارکت، کیف پول سیوان یا پرداخت نقدی به راننده، هزینه سفر را پرداخت کنید. پرداخت آنلاین امن و سریع از طریق درگاه‌های معتبر بانکی انجام می‌شود.',
  },
  {
    id: 'faq-4',
    question: 'آیا بیمه مسافری دارید؟',
    answer: 'بله، تمام سفرهای سیوان تحت پوشش بیمه مسافری کامل هستند. بیمه شامل حوادث ناشی از سفر، بار مسافر و مسئولیت مدنی می‌باشد. در صورت بروز هرگونه مشکل، تیم پشتیبانی ما در کنار شماست.',
  },
  {
    id: 'faq-5',
    question: 'چگونه می‌توانم راننده شوم؟',
    answer: 'برای پیوستن به تیم رانندگان سیوان، می‌توانید از طریق فرم ثبت‌نام در سایت اقدام کنید. شرایط شامل داشتن گواهینامه معتبر، سابقه رانندگی پاک و پاس کردن دوره آموزشی می‌باشد. پس از بررسی مدارک و انجام تست، می‌توانید شروع به کار کنید.',
  },
  {
    id: 'faq-6',
    question: 'ساعات کاری شما چگونه است؟',
    answer: 'سیوان به صورت ۲۴ ساعته و ۷ روز هفته فعال است. شما می‌توانید در هر ساعت از شبانه‌روز سفر خود را رزرو کنید. تیم پشتیبانی نیز به صورت شبانه‌روزی در دسترس شماست.',
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-20 sm:py-24 bg-[#0a0a0a] relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-l from-transparent via-[#D4AF37] to-transparent rounded-full" />

      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <Badge className="bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30 mb-4 px-4 py-1.5">
              <HelpCircle className="h-3.5 w-3.5 ml-1.5" />
              سوالات متداول
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#fafafa] mb-4">
              پرسش‌های <span className="text-gold-gradient">رایج</span>
            </h2>
            <p className="text-[#a1a1aa]">
              پاسخ سوالات متداول درباره خدمات سیوان
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq) => (
                <AccordionItem
                  key={faq.id}
                  value={faq.id}
                  className="bg-[#1a1a1a] border border-[#333] hover:border-[#D4AF37]/20 rounded-xl px-5 sm:px-6 data-[state=open]:border-[#D4AF37]/30 transition-colors"
                >
                  <AccordionTrigger className="text-right text-[#fafafa] hover:text-[#D4AF37] hover:no-underline py-4 text-sm sm:text-base">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-[#a1a1aa] text-sm leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

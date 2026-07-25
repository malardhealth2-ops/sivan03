'use client';

import { motion } from 'framer-motion';
import { Calendar, ArrowLeft, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const blogPosts = [
  {
    id: 1,
    title: 'تاکسی VIP چیست و چه تفاوتی با تاکسی معمولی دارد؟',
    excerpt: 'در این مقاله به بررسی تفاوت‌های تاکسی VIP با تاکسی معمولی می‌پردازیم و مزایای استفاده از خدمات تاکسی VIP را بررسی می‌کنیم...',
    date: '۲۵ آذر ۱۴۰۳',
    author: 'تیم سیوان',
    category: 'راهنما',
    readTime: '۵ دقیقه',
    image: '/images/vip-car.png',
  },
  {
    id: 2,
    title: 'چرا تاکسی ویژه سیوان بهترین انتخاب برای سفر است',
    excerpt: 'سیوان با ناوگان لوکس، رانندگان حرفه‌ای و قیمت شفاف، بهترین گزینه برای سفرهای بین شهری شماست...',
    date: '۲۰ آذر ۱۴۰۳',
    author: 'تیم سیوان',
    category: 'اخبار',
    readTime: '۳ دقیقه',
    image: '/images/luxury-car.png',
  },
  {
    id: 3,
    title: 'نکات مهم برای سفر ایمن بین شهری',
    excerpt: 'برای داشتن سفری ایمن و راحت، باید به چند نکته مهم توجه کنید. در این مقاله این نکات را مرور می‌کنیم...',
    date: '۱۵ آذر ۱۴۰۳',
    author: 'تیم سیوان',
    category: 'ایمنی',
    readTime: '۴ دقیقه',
    image: '/images/economy-car.png',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function BlogPreview() {
  return (
    <section id="blog" className="py-20 sm:py-24 bg-[#111111] relative">
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
            <span className="text-gold-gradient">بلاگ</span> سیوان
          </h2>
          <p className="text-[#a1a1aa] max-w-2xl mx-auto">
            جدیدترین مقالات و راهنمای سفر بین شهری
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
        >
          {blogPosts.map((post) => (
            <motion.div key={post.id} variants={itemVariants}>
              <Card className="bg-[#1a1a1a] border-[#333] hover:border-[#D4AF37]/30 card-gold-glow group overflow-hidden h-full cursor-pointer">
                {/* Image */}
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d]">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] to-transparent" />
                  <Badge className="absolute top-3 right-3 bg-[#D4AF37] text-[#0a0a0a] border-0 text-xs">
                    {post.category}
                  </Badge>
                </div>

                <CardContent className="p-5 sm:p-6 flex flex-col flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-[#fafafa] mb-3 line-clamp-2 group-hover:text-[#D4AF37] transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-[#a1a1aa] text-sm leading-relaxed mb-4 flex-1 line-clamp-3">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-[#333]">
                    <div className="flex items-center gap-3 text-xs text-[#a1a1aa]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {post.date}
                      </span>
                      <span>{post.readTime}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-[#D4AF37] hover:bg-[#D4AF37]/10 p-0 h-auto">
                      ادامه مطلب
                      <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

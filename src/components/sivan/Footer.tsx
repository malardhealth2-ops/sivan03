'use client';

import { motion } from 'framer-motion';
import { Crown, Phone, Mail, MapPin, Instagram, Send, MessageCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const quickLinks = [
  { label: 'خانه', href: '#hero' },
  { label: 'مسیرها', href: '#routes' },
  { label: 'خدمات', href: '#services' },
  { label: 'ناوگان', href: '#fleet' },
  { label: 'بلاگ', href: '#blog' },
  { label: 'سوالات متداول', href: '#faq' },
];

const services = [
  'تاکسی VIP لوکس',
  'تاکسی اقتصادی',
  'تاکسی دربستی',
  'ون مسافربری',
  'خودرو برقی',
  'سفر گروهی',
];

export function Footer() {
  const handleNavClick = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#111111] border-t border-[#333]">
      <div className="container mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="h-7 w-7 text-[#D4AF37]" />
              <span className="text-2xl font-bold text-gold-gradient">سیوان</span>
            </div>
            <p className="text-[#a1a1aa] text-sm leading-relaxed mb-6">
              تاکسی ویژه سیوان، ارائه‌دهنده خدمات حمل‌ونقل بین شهری VIP با ناوگان لوکس و رانندگان حرفه‌ای. سفری لوکس، راحت و ایمن را با ما تجربه کنید.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-[#a1a1aa] hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-[#a1a1aa] hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-colors"
              >
                <Send className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-[#a1a1aa] hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-[#fafafa] font-bold mb-4 text-base">دسترسی سریع</h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <button
                    onClick={() => handleNavClick(link.href)}
                    className="text-[#a1a1aa] text-sm hover:text-[#D4AF37] transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-[#fafafa] font-bold mb-4 text-base">خدمات ما</h3>
            <ul className="space-y-2.5">
              {services.map((service) => (
                <li key={service}>
                  <span className="text-[#a1a1aa] text-sm">{service}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-[#fafafa] font-bold mb-4 text-base">تماس با ما</h3>
            <div className="space-y-3">
              <a
                href="tel:09109419743"
                className="flex items-center gap-2 text-[#a1a1aa] text-sm hover:text-[#D4AF37] transition-colors"
                dir="ltr"
              >
                <Phone className="h-4 w-4 text-[#D4AF37] shrink-0" />
                0910-941-9743
              </a>
              <a
                href="tel:09368816807"
                className="flex items-center gap-2 text-[#a1a1aa] text-sm hover:text-[#D4AF37] transition-colors"
                dir="ltr"
              >
                <Phone className="h-4 w-4 text-[#D4AF37] shrink-0" />
                0936-881-6807
              </a>
              <a
                href="mailto:info@sivantaxi.ir"
                className="flex items-center gap-2 text-[#a1a1aa] text-sm hover:text-[#D4AF37] transition-colors"
              >
                <Mail className="h-4 w-4 text-[#D4AF37] shrink-0" />
                info@sivantaxi.ir
              </a>
              <div className="flex items-start gap-2 text-[#a1a1aa] text-sm">
                <MapPin className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
                تهران، ایران
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-[#333] my-8" />

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#a1a1aa]">
          <p>
            © {new Date().getFullYear()} تاکسی ویژه سیوان. تمامی حقوق محفوظ است.
          </p>
          <div className="flex items-center gap-4">
            <button className="hover:text-[#D4AF37] transition-colors">
              قوانین و مقررات
            </button>
            <button className="hover:text-[#D4AF37] transition-colors">
              حریم خصوصی
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

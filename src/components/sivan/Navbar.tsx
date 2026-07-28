'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Menu, X, ChevronDown, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { useAppStore } from '@/lib/store';
import { formatJalaaliDate, getTehranTimeString, getTehranTime, toPersianDigits } from '@/lib/jalaali';
import { Shield } from 'lucide-react';

type NavLink = { label: string; href: string; route?: string };

const navLinks: NavLink[] = [
  { label: 'خانه', href: '#hero' },
  { label: 'مسیرها', href: '#routes' },
  { label: 'خدمات', href: '#services' },
  { label: 'ناوگان', href: '#fleet' },
  { label: 'درباره ما', href: '#why-us' },
  { label: 'بلاگ', href: '#blog', route: '/blog' },
  { label: 'تماس', href: '#contact' },
];

export function Navbar() {
  const { openAuth, mobileMenuOpen, setMobileMenuOpen, setAdminOpen, auth, setUserPanelOpen } = useAppStore();
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [jalaliDateStr, setJalaliDateStr] = useState('');
  const [tehranTimeStr, setTehranTimeStr] = useState('');

  useEffect(() => {
    const updateClock = () => {
      setJalaliDateStr(formatJalaaliDate(getTehranTime()));
      setTehranTimeStr(getTehranTimeString());
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (link: NavLink) => {
    setMobileMenuOpen(false);
    // Links with a dedicated route (e.g. /blog) always navigate there
    // regardless of the current page.
    if (link.route) {
      window.location.href = link.route;
      return;
    }
    if (isHome) {
      // On the homepage, smooth-scroll to the target section.
      const el = document.querySelector(link.href);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Not on the homepage (e.g. /blog, /blog/[slug]) — navigate to the
      // homepage with the section hash so the browser loads home and jumps
      // to the requested section.
      window.location.href = '/' + link.href;
    }
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-[#D4AF37]/20 shadow-lg shadow-black/20'
            : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <a
              href={isHome ? '#hero' : '/'}
              onClick={(e) => {
                if (isHome) {
                  e.preventDefault();
                  handleNavClick({ label: 'خانه', href: '#hero' });
                }
              }}
              className="flex items-center gap-2.5 group cursor-pointer"
            >
              <img
                src="/logo.png"
                alt="تاکسی ویژه سیوان"
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover ring-2 ring-[#D4AF37]/40 group-hover:ring-[#D4AF37]/70 transition-all"
              />
              <span className="text-xl sm:text-2xl font-bold text-gold-gradient">
                سیوان
              </span>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link)}
                  className="px-3 py-2 text-sm text-[#a1a1aa] hover:text-[#D4AF37] transition-colors duration-200 rounded-md hover:bg-[#D4AF37]/5"
                >
                  {link.label}
                </button>
              ))}
            </nav>

            {/* Phone & Auth & Clock */}
            <div className="hidden sm:flex items-center gap-4">
              <div className="flex flex-col items-end text-xs text-[#a1a1aa]">
                <span className="text-[#D4AF37]/80">{tehranTimeStr}</span>
                <span className="text-[10px]">{jalaliDateStr}</span>
              </div>
              <div className="w-px h-8 bg-[#333]" />
              <a
                href="tel:09109419743"
                className="flex items-center gap-2 text-sm text-[#a1a1aa] hover:text-[#D4AF37] transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span className="hidden md:inline" dir="ltr">0910-941-9743</span>
              </a>
              {auth.user ? (
                <Button
                  onClick={() => setUserPanelOpen(true)}
                  className="bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] font-medium rounded-lg px-4 h-9 text-sm flex items-center gap-1.5"
                >
                  <UserCircle className="h-4 w-4" />
                  <span className="hidden md:inline">پنل کاربری</span>
                  <span className="md:hidden">حساب</span>
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => openAuth('register')}
                    className="text-[#a1a1aa] hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 font-medium rounded-lg px-3 h-9 text-sm"
                  >
                    ثبت‌نام
                  </Button>
                  <Button
                    onClick={() => openAuth('login')}
                    className="bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] font-medium rounded-lg px-4 h-9 text-sm"
                  >
                    ورود
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 text-[#a1a1aa] hover:text-[#D4AF37] transition-colors"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="bg-[#0a0a0a] border-[#D4AF37]/20 w-72">
          <SheetHeader className="text-right">
            <SheetTitle className="text-right text-[#D4AF37] flex items-center gap-2 justify-end">
              <img
                src="/logo.png"
                alt="سیوان"
                className="h-5 w-5 rounded-full object-cover"
              />
              منوی سیوان
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 mt-4">
            {navLinks.map((link) => (
              <SheetClose asChild key={link.href}>
                <button
                  onClick={() => handleNavClick(link)}
                  className="flex items-center px-4 py-3 text-[#a1a1aa] hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 rounded-lg transition-colors text-right"
                >
                  {link.label}
                </button>
              </SheetClose>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-[#333] flex flex-col gap-3">
            <a
              href="tel:09109419743"
              className="flex items-center gap-2 px-4 text-sm text-[#a1a1aa] hover:text-[#D4AF37]"
              dir="ltr"
            >
              <Phone className="h-4 w-4" />
              0910-941-9743
            </a>
            <a
              href="tel:09368816807"
              className="flex items-center gap-2 px-4 text-sm text-[#a1a1aa] hover:text-[#D4AF37]"
              dir="ltr"
            >
              <Phone className="h-4 w-4" />
              0936-881-6807
            </a>
            {auth.user ? (
              <SheetClose asChild>
                <Button
                  onClick={() => { setMobileMenuOpen(false); setUserPanelOpen(true); }}
                  className="bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] font-medium mx-4 mt-2 flex items-center gap-1.5"
                >
                  <UserCircle className="h-4 w-4" />
                  پنل کاربری
                </Button>
              </SheetClose>
            ) : (
              <>
                <SheetClose asChild>
                  <Button
                    onClick={() => { setMobileMenuOpen(false); openAuth('register'); }}
                    variant="outline"
                    className="border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] font-medium mx-4 mt-2"
                  >
                    ثبت‌نام
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button
                    onClick={() => { setMobileMenuOpen(false); openAuth('login'); }}
                    className="bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] font-medium mx-4 mt-2"
                  >
                    ورود
                  </Button>
                </SheetClose>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Admin Access Button */}
      <button
        onClick={() => setAdminOpen(true)}
        className="fixed bottom-6 left-6 z-40 w-12 h-12 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/10 transition-all shadow-lg shadow-black/40"
        title="پنل مدیریت"
      >
        <Shield className="h-5 w-5 text-[#a1a1aa]" />
      </button>
    </>
  );
}

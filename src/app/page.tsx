'use client';

import { useEffect } from 'react';
import { Navbar } from '@/components/sivan/Navbar';
import { HeroSection } from '@/components/sivan/HeroSection';
import { PopularRoutes } from '@/components/sivan/PopularRoutes';
import { ServicesSection } from '@/components/sivan/ServicesSection';
import { FleetSection } from '@/components/sivan/FleetSection';
import { WhyUsSection } from '@/components/sivan/WhyUsSection';
import { TestimonialsSection } from '@/components/sivan/TestimonialsSection';
import { BlogPreview } from '@/components/sivan/BlogPreview';
import { FAQSection } from '@/components/sivan/FAQSection';
import { CTASection } from '@/components/sivan/CTASection';
import { Footer } from '@/components/sivan/Footer';
import { BookingModal } from '@/components/sivan/BookingModal';
import { AuthModal } from '@/components/sivan/AuthModal';
import { ContactModal } from '@/components/sivan/ContactModal';
import { AdminPanel } from '@/components/sivan/AdminPanel';
import { UserPanel } from '@/components/sivan/UserPanel';
import { InteractiveMap } from '@/components/sivan/InteractiveMap';
import { useAppStore } from '@/lib/store';


export default function HomePage() {
  const restoreAuth = useAppStore((s) => s.restoreAuth);
  const restoreAdmin = useAppStore((s) => s.restoreAdmin);

  // Restore auth & admin state from localStorage on mount
  useEffect(() => {
    restoreAuth();
    restoreAdmin();
  }, [restoreAuth, restoreAdmin]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <InteractiveMap />
        <PopularRoutes />
        <ServicesSection />
        <FleetSection />
        <WhyUsSection />
        <TestimonialsSection />
        <BlogPreview />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
      <BookingModal />
      <AuthModal />
      <ContactModal />
      <AdminPanel />
      <UserPanel />
    </div>
  );
}

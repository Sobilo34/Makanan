import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from './components/HeroSection';
import BeforeAfterSection from './components/BeforeAfterSection';
import DeliverySection from './components/DeliverySection';
import ReservationSection from './components/ReservationSection';
import TestimonialsSection from './components/TestimonialsSection';
import EventsSection from './components/EventsSection';
import FoundersSection from './components/FoundersSection';
import WaitlistSection from './components/WaitlistSection';
import ContactSection from './components/ContactSection';
import FAQSection from './components/FAQSection';

export default function NoshPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroSection />
        <BeforeAfterSection />
        <DeliverySection />
        <ReservationSection />
        <TestimonialsSection />
        <EventsSection />
        <FoundersSection />
        <FAQSection />
        <WaitlistSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
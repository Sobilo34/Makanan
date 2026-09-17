'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md border-b border-border-light shadow-sm py-3'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-6xl mx-auto px-5 md:px-8 flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <Image
              src="/assets/images/makanan-symbol-removebg-preview-1787356773844.png"
              alt="Makanan symbol"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
            <span className="font-bold text-[#1A1A1A] text-lg tracking-tight">Makanan</span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: 'Meal Plans', href: '#plans' },
              { label: 'How It Works', href: '#how-it-works' },
              { label: 'Menu', href: '#menu' },
              { label: 'About', href: '#about' },
              { label: 'Waitlist', href: '#waitlist' },
            ]?.map((item) => (
              <a
                key={item?.label}
                href={item?.href}
                className="font-sans text-sm font-500 text-near-black/70 hover:text-near-black transition-colors duration-200"
                style={{ fontWeight: 500 }}
              >
                {item?.label}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="hidden md:inline-flex items-center gap-2 border border-near-black/20 text-near-black font-sans text-sm px-5 py-2.5 rounded-pill hover:border-near-black/40 transition-colors duration-200"
              style={{ fontWeight: 500 }}
            >
              Sign In
            </a>
            <a
              href="/signup"
              className="hidden md:inline-flex items-center gap-2 font-sans text-sm px-5 py-2.5 rounded-pill transition-colors duration-200"
              style={{ background: '#3ECBA0', color: '#1A1A1A', fontWeight: 600 }}
            >
              Get Started
            </a>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-1.5 text-near-black"
              aria-label="Toggle menu"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                {menuOpen ? (
                  <path
                    d="M5 5L17 17M17 5L5 17"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                ) : (
                  <path
                    d="M3 6h16M3 11h16M3 16h16"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 bg-white flex flex-col items-center justify-center transition-all duration-400 ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <nav className="flex flex-col gap-8 text-center">
          {[
            { label: 'Meal Plans', href: '#plans' },
            { label: 'How It Works', href: '#how-it-works' },
            { label: 'Menu', href: '#menu' },
            { label: 'About', href: '#about' },
            { label: 'Waitlist', href: '#waitlist' },
            { label: 'Get Started', href: '/signup' },
          ]?.map((item) => (
            <a
              key={item?.label}
              href={item?.href}
              onClick={() => setMenuOpen(false)}
              className="font-sans font-600 text-3xl text-near-black hover:text-primary-mint transition-colors"
              style={{ fontWeight: 600 }}
            >
              {item?.label}
            </a>
          ))}
        </nav>
        <p className="absolute bottom-10 font-sans text-xs text-muted-text tracking-widest uppercase">
          Eat with Ease · Makanan
        </p>
      </div>
    </>
  );
}

'use client';
import React from 'react';

const demoVideoUrl =
  'https://res.cloudinary.com/jt1x1oxc/video/upload/v1787900275/lv_0_20260828123714.mp4';

export default function HeroSection() {
  return (
    <section
      className="relative w-full overflow-hidden flex flex-col min-h-auto md:min-h-screen"
      id="hero"
      style={{
        background: 'linear-gradient(180deg, #E6F9F2 0%, #C8F0E4 60%, #B0E8D4 100%)',
      }}
    >
      {/* Hero Content — centered */}
      <div className="relative z-10 flex-none flex flex-col items-center text-center pt-10 md:pt-14 pb-0 px-5 md:px-8">
        {/* Main headline */}
        <h1
          className="hero-headline font-700 text-near-black tracking-tight mb-3 max-w-3xl text-[37px]"
          style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.2rem)',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            animationDelay: '0.1s',
          }}
        >
          A smarter way to <span style={{ color: '#3ECBA0' }}>eat on campus</span>
        </h1>

        {/* Subheadline */}
        <p
          className="hero-sub font-sans font-400 text-muted-text leading-relaxed max-w-lg mb-6"
          style={{ fontSize: 'clamp(0.95rem, 2vw, 1.05rem)', animationDelay: '0.3s' }}
        >
          Guaranteed meals for students. Guaranteed revenue for vendors
        </p>

        {/* CTA Buttons */}
        <div
          className="hero-cta flex flex-col sm:flex-row items-center gap-3 mb-8"
          style={{ animationDelay: '0.55s' }}
        >
          <a
            href="#plans"
            className="cta-primary inline-flex items-center justify-center gap-2.5 font-sans font-600 text-sm px-8 py-4 rounded-pill transition-all duration-200"
            style={{ background: '#3ECBA0', color: '#1A1A1A', fontWeight: 600 }}
          >
            Get a Meal Plan
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center gap-2.5 bg-white border border-border-light text-near-black font-sans font-500 text-sm px-8 py-4 rounded-pill hover:border-primary-mint hover:bg-very-light-mint transition-all duration-200"
            style={{ fontWeight: 500 }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M6.5 5.5L10.5 8L6.5 10.5V5.5Z" fill="currentColor" />
            </svg>
            See How It Works
          </a>
        </div>

        {/* ── App Showcase / Demo Video ── */}
        <div
          className="hero-showcase flex-1 flex items-end w-full"
          style={{ animationDelay: '0.85s' }}
        >
          <div
            className="relative mx-auto overflow-hidden w-[min(100%,980px)] h-[60vh] md:h-full rounded-t-[28px]"
            style={{ boxShadow: '0 28px 60px rgba(15,44,34,0.12)' }}
          >
            <video
              src={demoVideoUrl}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="h-full w-full object-cover"
              style={{ filter: 'saturate(1.05) contrast(1.04)' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

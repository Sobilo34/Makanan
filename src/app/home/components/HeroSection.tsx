'use client';
import React from 'react';

export default function HeroSection() {
  return (
    <section
      className="relative w-full overflow-hidden"
      id="hero"
      style={{ background: 'linear-gradient(180deg, #E6F9F2 0%, #C8F0E4 60%, #B0E8D4 100%)', minHeight: '100vh' }}
    >
      {/* Hero Content — centered */}
      <div className="relative z-10 flex flex-col items-center text-center pt-16 pb-0 px-5 md:px-8">

        {/* Eyebrow badge */}
        <div className="hero-headline inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-primary-mint/40 text-near-black font-sans text-xs font-600 px-5 py-2.5 rounded-pill mb-4 shadow-sm tracking-widest uppercase">
          <span className="w-2 h-2 rounded-full bg-primary-mint inline-block" />
          Student Meal Subscription · AIU Campus
        </div>

        {/* Main headline */}
        <h1
          className="hero-headline font-sans font-700 text-near-black leading-tight tracking-tight mb-3 max-w-3xl"
          style={{ fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', fontWeight: 700, letterSpacing: '-0.025em', animationDelay: '0.1s' }}
        >
          A smarter way to{' '}
          <span style={{ color: '#3ECBA0' }}>eat on campus</span>
        </h1>

        {/* Subheadline */}
        <p
          className="hero-sub font-sans font-400 text-muted-text leading-relaxed max-w-lg mb-6"
          style={{ fontSize: 'clamp(0.95rem, 2vw, 1.05rem)', animationDelay: '0.3s' }}
        >
          Affordable meal plans for AIU students — starting from just RM250/month.
        </p>

        {/* CTA Buttons */}
        <div className="hero-cta flex flex-col sm:flex-row items-center gap-3 mb-8" style={{ animationDelay: '0.55s' }}>
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

        {/* ── App Showcase / Video Placeholder ── */}
        <div
          className="hero-showcase relative w-full max-w-3xl mx-auto"
          style={{ animationDelay: '0.85s' }}
        >
          {/* Video placeholder container */}
          <div
            className="relative rounded-3xl overflow-hidden shadow-2xl"
            style={{
              background: 'linear-gradient(160deg, #3ECBA0 0%, #3ECBA0 40%, #2DAF87 100%)',
              aspectRatio: '16/10',
              minHeight: 340,
            }}
          >
            {/* Floating badge — top left */}
            <div className="absolute top-5 left-5 z-10">
              <div className="inline-flex items-center gap-2 bg-white rounded-pill px-4 py-2 shadow-md">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-mint inline-block" />
                <span className="font-sans font-500 text-near-black text-sm">Meal redeemed ✓</span>
              </div>
            </div>

            {/* Floating badge — top right */}
            <div className="absolute top-5 right-5 z-10">
              <div className="inline-flex items-center bg-white/90 rounded-pill px-4 py-2 shadow-md">
                <span className="font-sans font-600 text-near-black text-sm">38 credits left</span>
              </div>
            </div>

            {/* Center play button */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center placeholder-pulse"
                style={{ background: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)', border: '2px solid rgba(255,255,255,0.5)' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M8 5L19 12L8 19V5Z" fill="white" />
                </svg>
              </div>
              <p className="font-sans font-500 text-white/80 text-sm">App demo coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

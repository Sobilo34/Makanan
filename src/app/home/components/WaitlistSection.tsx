'use client';
import React from 'react';

const features = [
  { text: 'Meals at below-retail prices' },
  { text: 'Launching near your campus' },
  { text: 'Early access & priority spots' },
];

export default function WaitlistSection() {
  return (
    <section
      className="w-full py-20 px-5 md:px-8"
      style={{ background: '#1A1A1A' }}
      id="waitlist"
    >
      <div className="max-w-3xl mx-auto text-center">
        {/* Section label */}
        <p
          className="font-sans font-600 text-xs tracking-widest uppercase mb-5"
          style={{ color: '#3ECBA0', letterSpacing: '0.15em' }}
        >
          For Students
        </p>

        {/* Headline */}
        <h2
          className="font-sans font-700 leading-tight mb-5"
          style={{ fontSize: 'clamp(1.8rem, 4.5vw, 2.75rem)', fontWeight: 700, color: '#FFFFFF' }}
        >
          Coming to your uni.{' '}
          <span style={{ color: '#3ECBA0' }}>Be the first to know.</span>
        </h2>

        {/* Subheadline */}
        <p className="font-sans text-sm leading-relaxed max-w-md mx-auto mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
          We're expanding campus by campus. Join the student waitlist and we'll reach your university faster — and lock you in at our lowest prices.
        </p>

        {/* Feature badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {features?.map((f) => (
            <div
              key={f?.text}
              className="inline-flex items-center gap-2 rounded-pill px-4 py-2 text-xs font-sans font-500"
              style={{ background: 'rgba(62,203,160,0.12)', border: '1px solid rgba(62,203,160,0.3)', color: 'rgba(255,255,255,0.8)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#3ECBA0' }} />
              {f?.text}
            </div>
          ))}
        </div>

        {/* Waitlist card */}
        <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md mx-auto text-center">
          <p
            className="font-sans font-600 text-xs tracking-widest uppercase mb-3"
            style={{ color: '#3ECBA0', letterSpacing: '0.15em' }}
          >
            Student Waitlist
          </p>
          <h3 className="font-sans font-700 text-near-black text-xl mb-3" style={{ fontWeight: 700 }}>
            Join the Student Waitlist
          </h3>
          <p className="font-sans text-muted-text text-sm leading-relaxed mb-6">
            Tell us which university you're at. We'll prioritise campuses with the most demand — your sign-up literally moves us faster.
          </p>
          <a
            href="#"
            className="cta-primary inline-flex items-center justify-center gap-2 font-sans font-600 text-sm px-7 py-3.5 rounded-pill transition-all duration-200 w-full"
            style={{ background: '#3ECBA0', color: '#1A1A1A', fontWeight: 600 }}
          >
            Fill in the Waitlist Survey →
          </a>
          <p className="font-sans text-muted-text text-xs mt-4">
            No spam. Quick survey to help us reach your campus. 🎓
          </p>
        </div>
      </div>
    </section>
  );
}

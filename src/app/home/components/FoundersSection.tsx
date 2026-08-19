'use client';
import React from 'react';

const founders = [
  {
    name: 'Linath',
    role: 'Co-Founder & CFO',
    description: 'Building the financial backbone of Makanan from Germany.',
    initials: 'L',
  },
  {
    name: 'Raaj',
    role: 'Co-Founder & CEO',
    description: 'Driving the vision and product from the US.',
    initials: 'R',
  },
  {
    name: 'Daniel',
    role: 'Co-Founder & COO',
    description: 'On the ground in Sunway, making it all happen.',
    initials: 'D',
  },
];

export default function FoundersSection() {
  return (
    <section
      className="w-full py-20 px-5 md:px-8"
      style={{ background: '#F5F0EB' }}
      id="founders"
    >
      <div className="max-w-4xl mx-auto text-center">
        {/* Section label */}
        <p
          className="font-sans font-600 text-xs tracking-widest uppercase mb-4"
          style={{ color: '#3ECBA0', letterSpacing: '0.15em' }}
        >
          The Founders
        </p>

        {/* Headline */}
        <h2
          className="font-sans font-700 text-near-black leading-tight mb-4"
          style={{ fontSize: 'clamp(2rem, 5vw, 2.75rem)', fontWeight: 700 }}
        >
          Built across time zones.
        </h2>

        {/* Subheadline */}
        <p className="font-sans text-muted-text text-base leading-relaxed max-w-lg mx-auto mb-14">
          Three university students. One real problem. Built across Germany, the US, and on the ground in Sunway.
        </p>

        {/* Founder cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {founders?.map((founder) => (
            <div
              key={founder?.name}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 card-lift"
            >
              {/* Photo placeholder */}
              <div
                className="w-full flex items-center justify-center"
                style={{ height: 220, background: 'linear-gradient(160deg, #C8F0E4 0%, #3ECBA0 100%)' }}
              >
                <span
                  className="font-sans font-700 text-white"
                  style={{ fontSize: '4rem', fontWeight: 700, opacity: 0.6 }}
                >
                  {founder?.initials}
                </span>
              </div>

              {/* Info */}
              <div className="px-5 py-5 text-center">
                <h3 className="font-sans font-700 text-near-black text-lg mb-1" style={{ fontWeight: 700 }}>
                  {founder?.name}
                </h3>
                <p
                  className="font-sans font-600 text-sm mb-2"
                  style={{ color: '#3ECBA0', fontWeight: 600 }}
                >
                  {founder?.role}
                </p>
                <p className="font-sans text-muted-text text-sm leading-relaxed">
                  {founder?.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

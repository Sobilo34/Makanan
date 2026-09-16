'use client';
import React from 'react';

export default function ContactSection() {
  return (
    <section className="w-full py-10 px-5 md:px-8" style={{ background: '#1A1A1A' }} id="contact">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl p-8 shadow-xl text-center">
          {/* Label */}
          <p
            className="font-sans font-600 text-xs tracking-widest uppercase mb-5"
            style={{ color: '#3ECBA0', letterSpacing: '0.15em' }}
          >
            Follow Us!
          </p>

          {/* Social icons */}
          <div className="flex items-center justify-center gap-5 mb-6">
            {/* Instagram */}
            <a
              href="#"
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:opacity-70"
              style={{ background: '#F5F0EB' }}
              aria-label="Instagram"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1A1A1A"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.5" fill="#1A1A1A" />
              </svg>
            </a>
            {/* TikTok */}
            <a
              href="#"
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:opacity-70"
              style={{ background: '#F5F0EB' }}
              aria-label="TikTok"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#1A1A1A">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
              </svg>
            </a>
            {/* LinkedIn */}
            <a
              href="#"
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:opacity-70"
              style={{ background: '#F5F0EB' }}
              aria-label="LinkedIn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#1A1A1A">
                <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>
          </div>

          {/* CTA text */}
          <p
            className="font-sans font-600 text-near-black text-base mb-5"
            style={{ fontWeight: 600 }}
          >
            Want to partner or just say hi?
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="mailto:hello@makanan.com"
              className="inline-flex items-center gap-2 font-sans font-600 text-sm px-5 py-2.5 rounded-pill transition-all duration-200"
              style={{ background: '#3ECBA0', color: '#1A1A1A', fontWeight: 600 }}
            >
              📧 hello@makanan.com
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-2 bg-white border border-gray-200 text-near-black font-sans font-500 text-sm px-5 py-2.5 rounded-pill hover:border-primary-mint transition-all duration-200"
              style={{ fontWeight: 500 }}
            >
              Try the App →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

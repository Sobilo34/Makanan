import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-near-black border-t border-white/10 px-5 md:px-10 py-16">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
        {/* Left: Logo + tagline */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="16" fill="#3ECBA0" />
              <path d="M8 17C8 21.4183 11.5817 25 16 25C20.4183 25 24 21.4183 24 17H8Z" fill="white" />
              <path d="M10 17H22" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M13 13C13 13 13.5 11.5 13 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M16 12C16 12 16.5 10.5 16 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M19 13C19 13 19.5 11.5 19 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="font-sans font-700 text-white text-xl" style={{ fontWeight: 700 }}>Makanan</span>
          </div>
          <p className="font-sans text-white/40 text-sm leading-snug max-w-[220px]" style={{ fontStyle: 'italic' }}>
            · Eat with Ease ·
          </p>
          <p className="font-sans text-white/30 text-xs leading-relaxed max-w-[220px] mt-1">
            Student meal subscription platform. Nutritious, affordable, convenient.
          </p>
        </div>

        {/* Right: Links */}
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          {[
            { label: 'Meal Plans', href: '#plans' },
            { label: 'How It Works', href: '#how-it-works' },
            { label: 'Menu', href: '#menu' },
            { label: 'About', href: '#about' },
            { label: 'Privacy', href: '#' },
            { label: 'Terms', href: '#' },
          ]?.map((item) => (
            <a
              key={item?.label}
              href={item?.href}
              className="font-sans text-sm font-500 text-white/40 hover:text-white transition-colors"
              style={{ fontWeight: 500 }}
            >
              {item?.label}
            </a>
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="font-sans text-xs text-white/25 tracking-wide">
          © 2026 Makanan Sdn. Bhd. All rights reserved.
        </p>
        <div className="flex items-center gap-5">
          <a href="#" aria-label="Instagram" className="text-white/30 hover:text-white/70 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
          </a>
          <a href="#" className="font-sans text-xs text-white/25 hover:text-white/60 transition-colors tracking-wider uppercase">
            TikTok
          </a>
        </div>
      </div>
    </footer>
  );
}
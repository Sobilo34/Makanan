'use client';
import React, { useState, useEffect, useRef } from 'react';

interface Testimonial {
  id: number;
  quote: string;
  emphasis: string;
  name: string;
  role: string;
  location: string;
  img: string;
  imgAlt: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    quote: 'I used to skip lunch because the cafeteria queue was too long. With Makanan, I just tap and collect. My grades actually improved because I stopped skipping meals.',
    emphasis: 'My grades actually improved',
    name: 'Ahmad Faris',
    role: 'Year 2, Business Admin — AIU',
    location: 'Kuala Lumpur',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face',
    imgAlt: 'Ahmad Faris, AIU student',
    rating: 5,
  },
  {
    id: 2,
    quote: 'As a student on a tight budget, RM250 for 40 meals is genuinely the best deal I\'ve found. The food is fresh, the portions are generous, and I never go hungry.',
    emphasis: 'the best deal I\'ve found',
    name: 'Haziq Ramli',
    role: 'Final Year, Computer Science — AIU',
    location: 'Petaling Jaya',
    img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&crop=face',
    imgAlt: 'Haziq Ramli, AIU student',
    rating: 5,
  },
  {
    id: 3,
    quote: 'My parents were worried about me eating properly away from home. I showed them Makanan and they subscribed me to the Regular Plan immediately. Best decision ever.',
    emphasis: 'Best decision ever',
    name: 'Omar Khalid',
    role: 'Year 1, Engineering — AIU',
    location: 'Shah Alam',
    img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&crop=face',
    imgAlt: 'Omar Khalid, AIU student',
    rating: 5,
  },
  {
    id: 4,
    quote: 'The Flex plan is perfect for my schedule. I can order whenever I want and the food is always hot and fresh. Worth every ringgit — I recommend it to everyone in my block.',
    emphasis: 'Worth every ringgit',
    name: 'Yusuf Ibrahim',
    role: 'Year 3, Law — AIU',
    location: 'Subang Jaya',
    img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop&crop=face',
    imgAlt: 'Yusuf Ibrahim, AIU student',
    rating: 5,
  },
];

export default function TestimonialsSection() {
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.12 }
    );
    sectionRef.current?.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 md:py-28 px-5 md:px-10 overflow-hidden" style={{ background: '#F7F7F5' }} id="stories">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="reveal flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
          <div>
            <span className="section-label">Student Stories</span>
            <h2 className="font-sans font-700 text-near-black leading-tight" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700 }}>
              What students say<br />
              <span style={{ color: '#3ECBA0' }}>when they eat with ease</span>
            </h2>
          </div>
          {/* Navigation arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActive((active - 1 + testimonials.length) % testimonials.length)}
              className="w-11 h-11 border rounded-full flex items-center justify-center transition-all duration-200 hover:border-near-black"
              style={{ borderColor: '#D8D8D8' }}
              aria-label="Previous"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={() => setActive((active + 1) % testimonials.length)}
              className="w-11 h-11 border rounded-full flex items-center justify-center transition-all duration-200 hover:border-near-black"
              style={{ borderColor: '#D8D8D8' }}
              aria-label="Next"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Testimonial card — ALWAYS shows both image and text on all screen sizes */}
        <div className="reveal reveal-delay-1 relative" style={{ minHeight: 320 }}>
          {testimonials.map((item, i) => (
            <div
              key={item.id}
              className="absolute inset-0 transition-all duration-700 ease-in-out"
              style={{
                opacity: i === active ? 1 : 0,
                zIndex: i === active ? 10 : 0,
                pointerEvents: i === active ? 'auto' : 'none',
              }}
            >
              {/* Card — flex column on mobile, row on md+ */}
              <div
                className="flex flex-col sm:flex-row gap-0 rounded-2xl overflow-hidden"
                style={{ background: '#FFFFFF', border: '1px solid #EBEBEB' }}
              >
                {/* Photo — fixed height on mobile, fixed width on desktop */}
                <div
                  className="flex-shrink-0 relative"
                  style={{ width: '100%', height: 220 }}
                >
                  <div className="sm:hidden w-full h-full relative">
                    <img
                      src={item.img}
                      alt={item.imgAlt}
                      className="w-full h-full object-cover object-top"
                    />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.5) 100%)' }} />
                    <div className="absolute bottom-3 left-4">
                      <p className="font-sans font-700 text-white text-sm" style={{ fontWeight: 700 }}>{item.name}</p>
                      <p className="font-sans text-xs text-white/70">{item.role}</p>
                    </div>
                  </div>
                </div>

                {/* Desktop photo (hidden on mobile) */}
                <div
                  className="hidden sm:block flex-shrink-0 relative"
                  style={{ width: 200, minHeight: 320 }}
                >
                  <img
                    src={item.img}
                    alt={item.imgAlt}
                    className="w-full h-full object-cover object-top absolute inset-0"
                  />
                </div>

                {/* Quote content — always visible */}
                <div className="flex-1 flex flex-col justify-between p-6 sm:p-8">
                  {/* Stars */}
                  <div>
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: item.rating }).map((_, si) => (
                        <svg key={si} width="14" height="14" viewBox="0 0 14 14" fill="#3ECBA0">
                          <path d="M7 1l1.8 3.6L13 5.3l-3 2.9.7 4.1L7 10.4l-3.7 1.9.7-4.1-3-2.9 4.2-.7L7 1z" />
                        </svg>
                      ))}
                    </div>

                    <blockquote
                      className="font-sans text-near-black leading-relaxed mb-5"
                      style={{ fontSize: 'clamp(0.95rem, 2vw, 1.15rem)', fontWeight: 400 }}
                    >
                      {item.quote.split(item.emphasis).map((part, pi) => (
                        <React.Fragment key={pi}>
                          {part}
                          {pi < item.quote.split(item.emphasis).length - 1 && (
                            <em className="not-italic font-700" style={{ color: '#3ECBA0', fontWeight: 700 }}>{item.emphasis}</em>
                          )}
                        </React.Fragment>
                      ))}
                    </blockquote>
                  </div>

                  {/* Author — shown on desktop (mobile shows on photo) */}
                  <div className="hidden sm:flex items-center gap-3 pt-4" style={{ borderTop: '1px solid #F0F0F0' }}>
                    <div>
                      <p className="font-sans font-700 text-near-black text-sm" style={{ fontWeight: 700 }}>{item.name}</p>
                      <p className="font-sans text-xs text-muted-text">{item.role}</p>
                    </div>
                    <div className="ml-auto">
                      <span
                        className="font-sans text-[10px] font-600 px-2.5 py-1 rounded-full"
                        style={{ background: 'rgba(62,203,160,0.1)', color: '#2BB88A', fontWeight: 600 }}
                      >
                        {item.location}
                      </span>
                    </div>
                  </div>

                  {/* Mobile author (below quote, above border) */}
                  <div className="sm:hidden flex items-center justify-between pt-4 mt-2" style={{ borderTop: '1px solid #F0F0F0' }}>
                    <div>
                      <p className="font-sans font-700 text-near-black text-sm" style={{ fontWeight: 700 }}>{item.name}</p>
                      <p className="font-sans text-xs text-muted-text">{item.role}</p>
                    </div>
                    <span
                      className="font-sans text-[10px] font-600 px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(62,203,160,0.1)', color: '#2BB88A', fontWeight: 600 }}
                    >
                      {item.location}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dots */}
        <div className="reveal reveal-delay-2 flex items-center justify-center gap-2 mt-8">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === active ? 24 : 8,
                height: 8,
                background: i === active ? '#3ECBA0' : '#D8D8D8',
              }}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

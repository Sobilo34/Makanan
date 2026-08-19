'use client';
import React, { useState, useEffect, useRef } from 'react';

interface Testimonial {
  id: number;
  quote: string;
  emphasis: string;
  name: string;
  occasion: string;
  location: string;
  img: string;
  imgAlt: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    quote: 'I used to skip lunch because the cafeteria queue was too long. With Makanan, I just tap and collect. My grades actually improved because I stopped skipping meals.',
    emphasis: 'My grades actually improved',
    name: 'Amirah Zulkifli',
    occasion: 'Year 2 Student, UTM',
    location: 'Johor Bahru',
    img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    imgAlt: 'Amirah Zulkifli, smiling university student',
  },
  {
    id: 2,
    quote: 'As a student on a tight budget, RM250 for 40 meals is genuinely the best deal I\'ve found. The food is fresh, the portions are generous, and I never go hungry.',
    emphasis: 'the best deal I\'ve found',
    name: 'Haziq Ramli',
    occasion: 'Final Year Student, UiTM',
    location: 'Shah Alam',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
    imgAlt: 'Haziq Ramli, university student',
  },
  {
    id: 3,
    quote: 'My parents were worried about me eating properly away from home. I showed them Makanan and they subscribed me to the Premium Plan immediately. Best decision ever.',
    emphasis: 'they subscribed me immediately',
    name: 'Nurul Aina',
    occasion: 'Year 1 Student, UM',
    location: 'Kuala Lumpur',
    img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
    imgAlt: 'Nurul Aina, first year university student',
  },
  {
    id: 4,
    quote: 'I manage a student hostel and recommended Makanan to all 200 residents. The feedback has been overwhelmingly positive — students eat better and stress less.',
    emphasis: 'students eat better and stress less',
    name: 'Encik Faizal',
    occasion: 'Hostel Manager, UPM',
    location: 'Serdang',
    img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
    imgAlt: 'Encik Faizal, hostel manager',
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

  const t = testimonials[active];

  return (
    <section ref={sectionRef} className="bg-white py-20 md:py-28 px-5 md:px-10" id="stories">
      <div className="max-w-5xl mx-auto">
        <div className="reveal text-center mb-14">
          <span className="section-label">Student Stories</span>
          <h2 className="font-sans font-700 text-near-black leading-tight" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700 }}>
            What students say when<br />
            <span style={{ color: '#3ECBA0' }}>they eat with ease</span>
          </h2>
        </div>

        {/* Testimonial */}
        <div className="reveal reveal-delay-1 relative min-h-[320px] md:min-h-[280px]">
          {testimonials.map((item, i) => (
            <div
              key={item.id}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                i === active ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start">
                {/* Photo */}
                <div className="md:col-span-4">
                  <div className="aspect-[4/5] overflow-hidden rounded-xl2 border border-border-light relative">
                    <img
                      src={item.img}
                      alt={item.imgAlt}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-3 right-3 bg-near-black/80 backdrop-blur-sm px-2.5 py-1 rounded-pill">
                      <p className="font-sans text-[10px] text-white/70 tracking-wider uppercase">{item.occasion}</p>
                    </div>
                  </div>
                </div>

                {/* Quote */}
                <div className="md:col-span-8 flex flex-col justify-center">
                  <svg width="28" height="22" viewBox="0 0 28 22" fill="none" className="mb-5 opacity-15">
                    <path d="M0 22V14C0 9.6 1.4 5.9 4.2 2.9 7 0 10.5 0 14 0v4c-2.2 0-4 0.7-5.4 2.1C7.2 7.5 6.5 9.3 6.4 11.4H12V22H0zm16 0V14c0-4.4 1.4-8.1 4.2-11.1C23 0 26.5 0 30 0v4c-2.2 0-4 0.7-5.4 2.1C23.2 7.5 22.5 9.3 22.4 11.4H28V22H16z" fill="var(--near-black)" />
                  </svg>
                  <blockquote
                    className="font-sans text-near-black leading-relaxed mb-6"
                    style={{ fontSize: 'clamp(1rem, 2.2vw, 1.3rem)', fontWeight: 400 }}
                  >
                    {item.quote.split(item.emphasis).map((part, pi) => (
                      <React.Fragment key={pi}>
                        {part}
                        {pi < item.quote.split(item.emphasis).length - 1 && (
                          <em className="not-italic font-600" style={{ color: '#3ECBA0', fontWeight: 600 }}>{item.emphasis}</em>
                        )}
                      </React.Fragment>
                    ))}
                  </blockquote>
                  <div>
                    <p className="font-sans font-600 text-near-black text-sm" style={{ fontWeight: 600 }}>{item.name}</p>
                    <p className="font-sans text-xs text-muted-text tracking-wide">{item.location}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dots + nav */}
        <div className="reveal reveal-delay-2 flex items-center justify-center gap-4 mt-10">
          <button
            onClick={() => setActive((active - 1 + testimonials.length) % testimonials.length)}
            className="w-10 h-10 border border-border-light rounded-full flex items-center justify-center text-near-black hover:bg-light-bg transition-colors"
            aria-label="Previous"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="flex gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === active ? 'w-6 h-2 bg-primary-mint' : 'w-2 h-2 bg-border-light'
                }`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => setActive((active + 1) % testimonials.length)}
            className="w-10 h-10 border border-border-light rounded-full flex items-center justify-center text-near-black hover:bg-light-bg transition-colors"
            aria-label="Next"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

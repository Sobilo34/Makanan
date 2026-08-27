'use client';
import React, { useState, useRef, useEffect } from 'react';

const partnerTypes = [
  { id: 'university', label: 'University / College', emoji: '🎓', desc: 'Serve thousands of students with structured meal plans' },
  { id: 'hostel', label: 'Student Hostel', emoji: '🏠', desc: 'Provide residents with daily nutritious meals' },
  { id: 'canteen', label: 'Campus Canteen', emoji: '🍽️', desc: 'Expand your reach with our subscription model' },
  { id: 'corporate', label: 'Corporate Cafeteria', emoji: '🏢', desc: 'Affordable meals for your workforce' },
  { id: 'ngo', label: 'NGO / Welfare Body', emoji: '🤝', desc: 'Subsidised meals for communities in need' },
  { id: 'other', label: 'Other', emoji: '✨', desc: 'Tell us about your unique setup' },
];

const stats = [
  { value: '1', label: 'Campus live', sub: 'AIU, Kuala Lumpur' },
  { value: '24h', label: 'Response time', sub: 'Our team replies fast' },
  { value: '100%', label: 'Kitchen managed', sub: 'We handle operations' },
];

export default function EventsSection() {
  const [selectedType, setSelectedType] = useState('university');
  const [submitted, setSubmitted] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    sectionRef.current?.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const activePartner = partnerTypes.find((p) => p.id === selectedType) || partnerTypes[0];

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-20 md:py-28 px-5 md:px-10"
      style={{ background: '#0A0A0A' }}
      id="partners"
    >
      {/* Ambient glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-20%',
          right: '-10%',
          width: '50%',
          height: '70%',
          background: 'radial-gradient(ellipse, rgba(62,203,160,0.07) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '-10%',
          left: '-5%',
          width: '40%',
          height: '50%',
          background: 'radial-gradient(ellipse, rgba(62,203,160,0.04) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-6xl mx-auto relative">
        {/* Top section — headline + stats */}
        <div className="reveal mb-14 grid grid-cols-1 lg:grid-cols-2 gap-10 items-end">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-px" style={{ background: '#3ECBA0' }} />
              <span className="font-sans text-xs tracking-[0.2em] uppercase font-600" style={{ color: '#3ECBA0', fontWeight: 600 }}>Partner With Us</span>
            </div>
            <h2
              className="font-sans font-700 leading-[1.05]"
              style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 700, color: '#FFFFFF' }}
            >
              Bring Makanan<br />
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>to your campus.</span>
            </h2>
          </div>
          <div>
            <p className="font-sans text-base leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Partner with Makanan to provide affordable, nutritious meal subscriptions to your students or residents. We handle the kitchen — you focus on education.
            </p>
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="font-sans font-700 text-white text-xl mb-0.5" style={{ fontWeight: 700, color: '#3ECBA0' }}>{stat.value}</p>
                  <p className="font-sans text-[11px] font-600 text-white" style={{ fontWeight: 600 }}>{stat.label}</p>
                  <p className="font-sans text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{stat.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main content — partner type selector + form */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Partner type selector — 2 cols on lg */}
          <div className="reveal reveal-delay-1 lg:col-span-2">
            <p className="font-sans text-xs tracking-widest uppercase mb-4 font-600" style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
              I represent a...
            </p>
            <div className="flex flex-col gap-2">
              {partnerTypes.map((pt) => (
                <button
                  key={pt.id}
                  type="button"
                  onClick={() => setSelectedType(pt.id)}
                  className="text-left px-4 py-3.5 rounded-xl transition-all duration-200 flex items-center gap-3"
                  style={{
                    background: selectedType === pt.id ? 'rgba(62,203,160,0.1)' : 'rgba(255,255,255,0.03)',
                    border: selectedType === pt.id ? '1px solid rgba(62,203,160,0.4)' : '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <span className="text-lg flex-shrink-0">{pt.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-sans text-sm font-600 leading-snug"
                      style={{ fontWeight: 600, color: selectedType === pt.id ? '#3ECBA0' : 'rgba(255,255,255,0.6)' }}
                    >
                      {pt.label}
                    </p>
                    {selectedType === pt.id && (
                      <p className="font-sans text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{pt.desc}</p>
                    )}
                  </div>
                  {selectedType === pt.id && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
                      <path d="M3 7l3 3 5-6" stroke="#3ECBA0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Form — 3 cols on lg */}
          <div className="reveal reveal-delay-2 lg:col-span-3">
            {submitted ? (
              <div
                className="rounded-2xl p-10 text-center h-full flex flex-col items-center justify-center"
                style={{ background: 'rgba(62,203,160,0.06)', border: '1px solid rgba(62,203,160,0.2)', minHeight: 400 }}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ background: 'rgba(62,203,160,0.15)' }}
                >
                  <span className="text-3xl">🤝</span>
                </div>
                <h3 className="font-sans font-700 text-white text-2xl mb-3" style={{ fontWeight: 700 }}>
                  Partnership Request Sent!
                </h3>
                <p className="font-sans text-sm leading-relaxed max-w-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Our partnerships team will reach out within 24 hours to discuss how Makanan can serve your institution.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl p-7 md:p-8 flex flex-col gap-5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
              >
                {/* Selected type badge */}
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg self-start"
                  style={{ background: 'rgba(62,203,160,0.1)', border: '1px solid rgba(62,203,160,0.2)' }}
                >
                  <span className="text-sm">{activePartner.emoji}</span>
                  <span className="font-sans text-xs font-600" style={{ color: '#3ECBA0', fontWeight: 600 }}>{activePartner.label}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-sans text-xs uppercase tracking-widest block mb-2 font-600" style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
                      Institution Name
                    </label>
                    <input
                      type="text"
                      placeholder="Albukhary International University"
                      required
                      className="w-full px-4 py-3 rounded-xl text-sm font-sans outline-none"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                    />
                  </div>
                  <div>
                    <label className="font-sans text-xs uppercase tracking-widest block mb-2 font-600" style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
                      Contact Person
                    </label>
                    <input
                      type="text"
                      placeholder="Dr. Ahmad Rashid"
                      required
                      className="w-full px-4 py-3 rounded-xl text-sm font-sans outline-none"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-sans text-xs uppercase tracking-widest block mb-2 font-600" style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="contact@institution.edu.my"
                      required
                      className="w-full px-4 py-3 rounded-xl text-sm font-sans outline-none"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                    />
                  </div>
                  <div>
                    <label className="font-sans text-xs uppercase tracking-widest block mb-2 font-600" style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
                      Student Count
                    </label>
                    <select
                      className="w-full px-4 py-3 rounded-xl text-sm font-sans outline-none"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
                    >
                      {['Under 100', '100–500', '500–2,000', '2,000–5,000', '5,000+'].map((n) => (
                        <option key={n} style={{ background: '#1A1A1A' }}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-sans text-xs uppercase tracking-widest block mb-2 font-600" style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
                    Tell Us More (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Your campus setup, current meal situation, what you're looking for..."
                    className="w-full px-4 py-3 rounded-xl text-sm font-sans outline-none resize-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full font-sans font-700 text-sm py-4 rounded-xl transition-all duration-200"
                  style={{
                    background: 'linear-gradient(135deg, #3ECBA0 0%, #2BB88A 100%)',
                    color: '#0A0A0A',
                    fontWeight: 700,
                  }}
                >
                  Send Partnership Inquiry →
                </button>

                <p className="font-sans text-[10px] text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  We respond within 24 hours · Currently serving AIU, Kuala Lumpur
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
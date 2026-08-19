'use client';
import React, { useState, useRef, useEffect } from 'react';

const partnerTypes = [
  { id: 'university', label: 'University / College', emoji: '🎓' },
  { id: 'hostel', label: 'Student Hostel', emoji: '🏠' },
  { id: 'canteen', label: 'Campus Canteen', emoji: '🍽️' },
  { id: 'corporate', label: 'Corporate Cafeteria', emoji: '🏢' },
  { id: 'ngo', label: 'NGO / Welfare Body', emoji: '🤝' },
  { id: 'other', label: 'Other', emoji: '✨' },
];

export default function EventsSection() {
  const [selectedType, setSelectedType] = useState('');
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

  return (
    <section ref={sectionRef} className="bg-near-black py-20 md:py-28 px-5 md:px-10 relative overflow-hidden" id="partners">
      {/* Warm background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-primary-mint/10 blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
          {/* Left copy */}
          <div>
            <div className="reveal">
              <span className="section-label" style={{ color: '#ABC5C1', borderBottomColor: 'rgba(171,197,193,0.3)' }}>
                Partner With Us
              </span>
              <h2 className="font-sans font-700 text-white leading-tight mb-5" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700 }}>
                Bring Makanan<br />
                <span style={{ color: '#ABC5C1' }}>to your campus.</span>
              </h2>
              <p className="font-sans text-white/55 text-base leading-relaxed mb-10">
                Partner with Makanan to provide affordable, nutritious meal subscriptions to your students or residents. We handle the kitchen — you focus on education.
              </p>
            </div>

            {/* Partner type cards */}
            <div className="reveal reveal-delay-1 grid grid-cols-2 gap-3">
              {partnerTypes.map((pt) => (
                <button
                  key={pt.id}
                  type="button"
                  onClick={() => setSelectedType(pt.id)}
                  className={`text-left px-4 py-3.5 rounded-xl border transition-all duration-200 ${
                    selectedType === pt.id
                      ? 'border-primary-mint bg-primary-mint/15 text-white' :'border-white/10 text-white/50 hover:border-white/25 hover:text-white/75'
                  }`}
                >
                  <span className="block text-lg mb-1">{pt.emoji}</span>
                  <span className="font-sans text-sm font-500 leading-snug" style={{ fontWeight: 500 }}>{pt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Form */}
          <div className="reveal reveal-delay-2">
            {submitted ? (
              <div className="bg-white/5 rounded-xl2 p-10 text-center border border-primary-mint/20">
                <div className="text-4xl mb-4">🤝</div>
                <h3 className="font-sans font-700 text-white text-2xl mb-3" style={{ fontWeight: 700 }}>Partnership Request Sent!</h3>
                <p className="font-sans text-white/60 text-sm leading-relaxed">
                  Our partnerships team will reach out within 24 hours to discuss how Makanan can serve your institution.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-white/5 rounded-xl2 p-7 md:p-9 border border-white/10 flex flex-col gap-5"
              >
                <div>
                  <label className="font-sans text-xs text-white/50 uppercase tracking-widest block mb-2 font-600" style={{ fontWeight: 600 }}>
                    Institution Name
                  </label>
                  <input
                    type="text"
                    placeholder="Universiti Teknologi Malaysia"
                    required
                    className="nosh-input w-full px-4 py-3 rounded-xl text-sm"
                    style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.12)', color: 'white' }}
                  />
                </div>

                <div>
                  <label className="font-sans text-xs text-white/50 uppercase tracking-widest block mb-2 font-600" style={{ fontWeight: 600 }}>
                    Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="Dr. Siti Rahimah"
                    required
                    className="nosh-input w-full px-4 py-3 rounded-xl text-sm"
                    style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.12)', color: 'white' }}
                  />
                </div>

                <div>
                  <label className="font-sans text-xs text-white/50 uppercase tracking-widest block mb-2 font-600" style={{ fontWeight: 600 }}>
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="contact@utm.my"
                    required
                    className="nosh-input w-full px-4 py-3 rounded-xl text-sm"
                    style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.12)', color: 'white' }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-sans text-xs text-white/50 uppercase tracking-widest block mb-2 font-600" style={{ fontWeight: 600 }}>
                      Student Count
                    </label>
                    <select
                      className="nosh-input w-full px-4 py-3 rounded-xl text-sm"
                      style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.12)', color: 'white' }}
                    >
                      {['Under 100', '100–500', '500–2000', '2000–5000', '5000+'].map((n) => (
                        <option key={n} style={{ background: '#1A1A1A' }}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-sans text-xs text-white/50 uppercase tracking-widest block mb-2 font-600" style={{ fontWeight: 600 }}>
                      Partner Type
                    </label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="nosh-input w-full px-4 py-3 rounded-xl text-sm"
                      style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.12)', color: 'white' }}
                    >
                      <option value="" style={{ background: '#1A1A1A' }}>Select type...</option>
                      {partnerTypes.map((pt) => (
                        <option key={pt.id} value={pt.id} style={{ background: '#1A1A1A' }}>{pt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-sans text-xs text-white/50 uppercase tracking-widest block mb-2 font-600" style={{ fontWeight: 600 }}>
                    Tell Us More
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Your campus setup, current meal situation, goals..."
                    className="nosh-input w-full px-4 py-3 rounded-xl text-sm resize-none"
                    style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.12)', color: 'white' }}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary-mint text-near-black font-sans font-700 text-sm py-4 rounded-pill hover:bg-primary-mint-dark transition-colors duration-200 mt-1"
                  style={{ fontWeight: 700 }}
                >
                  Send Partnership Inquiry
                </button>

                <p className="font-sans text-[10px] text-white/25 text-center tracking-wide">
                  We respond within 24 hours · Serving 50+ campuses across Malaysia
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
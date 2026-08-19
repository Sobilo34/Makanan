'use client';
import React, { useState, useRef, useEffect } from 'react';

export default function ReservationSection() {
  const [planType, setPlanType] = useState<'student' | 'partner'>('student');
  const [meals, setMeals] = useState('40');
  const [startDate, setStartDate] = useState('');
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
    <section ref={sectionRef} className="bg-very-light-mint py-20 md:py-28 px-5 md:px-10 relative overflow-hidden" id="subscribe">
      {/* Decorative background */}
      <div
        className="absolute top-0 right-0 w-[40%] h-full opacity-20 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(ellipse at 100% 50%, #3ECBA0 0%, transparent 70%)' }}
      />

      <div className="max-w-5xl mx-auto relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-start">
          {/* Left: Copy */}
          <div>
            <div className="reveal">
              <span className="section-label">Subscribe Today</span>
              <h2 className="font-sans font-700 text-near-black leading-tight mb-5" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 700 }}>
                Your meals,<br />
                <span style={{ color: '#3ECBA0' }}>sorted for the semester.</span>
              </h2>
              <p className="font-sans text-muted-text text-base leading-relaxed mb-8">
                Subscribe in minutes. Choose your plan, set your start date, and we handle the rest. Fresh meals, every day.
              </p>
            </div>

            {/* Benefits */}
            <div className="reveal reveal-delay-1 flex flex-col gap-4">
              {[
                { icon: '🍱', text: 'Fresh, nutritious meals prepared daily by our kitchen partners' },
                { icon: '📱', text: 'Order via app — tap to collect, no queuing required' },
                { icon: '💳', text: 'Flexible plans from RM250/month, cancel anytime' },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-3">
                  <span className="text-lg mt-0.5">{item.icon}</span>
                  <p className="font-sans text-sm text-muted-text leading-snug">{item.text}</p>
                </div>
              ))}
            </div>

            {/* Social proof */}
            <div className="reveal reveal-delay-2 mt-8 inline-flex items-center gap-2.5 bg-primary-mint/20 border border-primary-mint/30 rounded-pill px-4 py-2">
              <div className="w-2 h-2 rounded-full bg-primary-mint animate-pulse" />
              <p className="font-sans text-xs text-soft-teal tracking-wide font-500" style={{ fontWeight: 500 }}>
                12,400+ students subscribed this semester
              </p>
            </div>
          </div>

          {/* Right: Form */}
          <div className="reveal reveal-delay-1">
            {submitted ? (
              <div className="bg-near-black rounded-xl2 p-10 text-center border border-primary-mint/20">
                <div className="text-4xl mb-4">🍱</div>
                <h3 className="font-sans font-700 text-white text-2xl mb-3" style={{ fontWeight: 700 }}>You're all set!</h3>
                <p className="font-sans text-white/60 text-sm leading-relaxed">
                  Your subscription request is received. We'll send your confirmation and app access link within the hour.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-xl2 p-7 md:p-9 border border-border-light shadow-card flex flex-col gap-5"
              >
                {/* Plan type toggle */}
                <div>
                  <label className="font-sans text-xs text-muted-text uppercase tracking-widest block mb-3 font-600" style={{ fontWeight: 600 }}>
                    Account Type
                  </label>
                  <div className="flex gap-3">
                    {(['student', 'partner'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setPlanType(type)}
                        className={`flex-1 py-2.5 rounded-pill font-sans text-sm font-600 transition-all duration-200 ${
                          planType === type
                            ? 'bg-near-black text-white' :'border border-border-light text-muted-text hover:border-primary-mint'
                        }`}
                        style={{ fontWeight: 600 }}
                      >
                        {type === 'student' ? '🎓 Student' : '🏢 Partner'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Start date */}
                <div>
                  <label className="font-sans text-xs text-muted-text uppercase tracking-widest block mb-2 font-600" style={{ fontWeight: 600 }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="makanan-input w-full px-4 py-3 rounded-xl text-sm"
                  />
                </div>

                {/* Meals per month */}
                <div>
                  <label className="font-sans text-xs text-muted-text uppercase tracking-widest block mb-2 font-600" style={{ fontWeight: 600 }}>
                    Meals per Month
                  </label>
                  <select
                    value={meals}
                    onChange={(e) => setMeals(e.target.value)}
                    className="makanan-input w-full px-4 py-3 rounded-xl text-sm"
                  >
                    {['40 meals — RM250', '60 meals — RM300', '80 meals — RM400', '300 meals — RM900 (Semester)'].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                {/* Name */}
                <div>
                  <label className="font-sans text-xs text-muted-text uppercase tracking-widest block mb-2 font-600" style={{ fontWeight: 600 }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Ahmad Faris"
                    required
                    className="makanan-input w-full px-4 py-3 rounded-xl text-sm"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="font-sans text-xs text-muted-text uppercase tracking-widest block mb-2 font-600" style={{ fontWeight: 600 }}>
                    University Email
                  </label>
                  <input
                    type="email"
                    placeholder="ahmad@student.utm.my"
                    required
                    className="makanan-input w-full px-4 py-3 rounded-xl text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="cta-primary w-full bg-near-black text-white font-sans font-700 text-sm py-4 rounded-pill hover:bg-near-black/80 transition-colors duration-200 mt-1"
                  style={{ fontWeight: 700 }}
                >
                  Start My Subscription
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
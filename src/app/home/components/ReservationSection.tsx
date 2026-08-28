'use client';
import React, { useState, useRef, useEffect } from 'react';

const plans = [
  { id: 'basic', label: 'Basic', price: 'RM250', tag: 'Starter', options: ['Normal', 'Extra'] },
  {
    id: 'standard',
    label: 'Standard',
    price: 'RM300',
    tag: 'Popular',
    options: ['Normal', 'Extra'],
  },
  {
    id: 'premium',
    label: 'Premium',
    price: 'RM400',
    tag: 'Best Value',
    options: ['Normal', 'Extra'],
  },
];

export default function ReservationSection() {
  const [selectedPlan, setSelectedPlan] = useState('standard');
  const [startDate, setStartDate] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('visible');
        }),
      { threshold: 0.1 }
    );
    sectionRef.current?.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const activePlan = plans.find((p) => p.id === selectedPlan) || plans[1];

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-20 md:py-28 px-5 md:px-10"
      style={{ background: '#0D0D0D' }}
      id="subscribe"
    >
      {/* Background texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 50%, rgba(62,203,160,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(62,203,160,0.05) 0%, transparent 40%)',
        }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(62,203,160,0.4), transparent)',
        }}
      />

      <div className="max-w-6xl mx-auto relative">
        {/* Top label */}
        <div className="reveal mb-12 flex items-center gap-4">
          <div className="w-8 h-px" style={{ background: '#3ECBA0' }} />
          <span
            className="font-sans text-xs tracking-[0.2em] uppercase font-600"
            style={{ color: '#3ECBA0', fontWeight: 600 }}
          >
            Subscribe Today
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left: Bold headline + plan selector */}
          <div>
            <div className="reveal mb-10">
              <h2
                className="font-sans font-700 leading-[1.05] mb-5"
                style={{
                  fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
                  fontWeight: 700,
                  color: '#FFFFFF',
                }}
              >
                Your meals,
                <br />
                <span
                  style={{
                    background: 'linear-gradient(135deg, #3ECBA0 0%, #2BB88A 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  sorted.
                </span>
              </h2>
              <p
                className="font-sans text-base leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                Pick your plan, set your start date. We handle everything else — fresh meals, every
                single day.
              </p>
            </div>

            {/* Plan selector grid */}
            <div className="reveal reveal-delay-1 mb-10">
              <p
                className="font-sans text-xs tracking-widest uppercase mb-4 font-600"
                style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}
              >
                Choose your plan
              </p>
              <div className="grid grid-cols-3 gap-2">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.id)}
                    className="relative text-left p-3 rounded-xl transition-all duration-200"
                    style={{
                      background:
                        selectedPlan === plan.id
                          ? 'rgba(62,203,160,0.12)'
                          : 'rgba(255,255,255,0.04)',
                      border:
                        selectedPlan === plan.id
                          ? '1px solid rgba(62,203,160,0.5)'
                          : '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    {plan.tag && (
                      <span
                        className="absolute -top-2 right-2 font-sans text-[9px] font-700 px-2 py-0.5 rounded-full"
                        style={{ background: '#3ECBA0', color: '#0D0D0D', fontWeight: 700 }}
                      >
                        {plan.tag}
                      </span>
                    )}
                    <p
                      className="font-sans text-[10px] font-600 mb-1"
                      style={{
                        color: selectedPlan === plan.id ? '#3ECBA0' : 'rgba(255,255,255,0.4)',
                        fontWeight: 600,
                      }}
                    >
                      {plan.label}
                    </p>
                    <div className="space-y-0.5">
                      {plan.options.map((option) => (
                        <p
                          key={option}
                          className="font-sans text-[10px] text-white/80 uppercase tracking-wide"
                        >
                          {option}
                        </p>
                      ))}
                    </div>
                    <p
                      className="font-sans text-xs font-600 mt-1"
                      style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}
                    >
                      {plan.price}/mo
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Benefit strips */}
            <div className="reveal reveal-delay-2 flex flex-col gap-3">
              {[
                {
                  icon: '🍱',
                  title: 'Kitchen-fresh daily',
                  sub: 'Prepared by our partner kitchens every morning',
                },
                {
                  icon: '📱',
                  title: 'Tap to collect',
                  sub: 'No queuing — order via app, pick up in seconds',
                },
                {
                  icon: '💳',
                  title: 'Cancel anytime',
                  sub: 'No lock-in. Pause or cancel with one tap',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-center gap-4 p-3.5 rounded-xl"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  <div>
                    <p
                      className="font-sans text-sm font-600 text-white"
                      style={{ fontWeight: 600 }}
                    >
                      {item.title}
                    </p>
                    <p className="font-sans text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {item.sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Form */}
          <div className="reveal reveal-delay-1">
            {submitted ? (
              <div
                className="rounded-2xl p-10 text-center"
                style={{
                  background: 'rgba(62,203,160,0.08)',
                  border: '1px solid rgba(62,203,160,0.25)',
                }}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ background: 'rgba(62,203,160,0.15)' }}
                >
                  <span className="text-3xl">🍱</span>
                </div>
                <h3
                  className="font-sans font-700 text-white text-2xl mb-3"
                  style={{ fontWeight: 700 }}
                >
                  You&apos;re all set!
                </h3>
                <p
                  className="font-sans text-sm leading-relaxed"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  Subscription request received. We&apos;ll send your confirmation and app access
                  link within the hour.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl p-7 md:p-8 flex flex-col gap-5"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {/* Selected plan summary */}
                <div
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{
                    background: 'rgba(62,203,160,0.1)',
                    border: '1px solid rgba(62,203,160,0.2)',
                  }}
                >
                  <div>
                    <p className="font-sans text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      Selected plan
                    </p>
                    <p
                      className="font-sans text-sm font-700 text-white"
                      style={{ fontWeight: 700 }}
                    >
                      {activePlan.label} — {activePlan.options.join(' / ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className="font-sans text-xl font-700"
                      style={{ color: '#3ECBA0', fontWeight: 700 }}
                    >
                      {activePlan.price}
                    </p>
                    <p
                      className="font-sans text-[10px]"
                      style={{ color: 'rgba(255,255,255,0.35)' }}
                    >
                      per month
                    </p>
                  </div>
                </div>

                {/* Start date */}
                <div>
                  <label
                    className="font-sans text-xs uppercase tracking-widest block mb-2 font-600"
                    style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}
                  >
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm font-sans outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: 'white',
                      colorScheme: 'dark',
                    }}
                  />
                </div>

                {/* Name */}
                <div>
                  <label
                    className="font-sans text-xs uppercase tracking-widest block mb-2 font-600"
                    style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Ahmad Faris"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm font-sans outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: 'white',
                    }}
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    className="font-sans text-xs uppercase tracking-widest block mb-2 font-600"
                    style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}
                  >
                    University Email
                  </label>
                  <input
                    type="email"
                    placeholder="ahmad@student.aiu.edu.my"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm font-sans outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: 'white',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full font-sans font-700 text-sm py-4 rounded-xl transition-all duration-200 mt-1"
                  style={{
                    background: 'linear-gradient(135deg, #3ECBA0 0%, #2BB88A 100%)',
                    color: '#0D0D0D',
                    fontWeight: 700,
                  }}
                >
                  Start My Subscription →
                </button>

                <div className="flex items-center justify-center gap-4">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((n) => (
                      <div
                        key={n}
                        className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[8px] font-700"
                        style={{
                          borderColor: '#0D0D0D',
                          background: `hsl(${n * 40 + 150}, 50%, 50%)`,
                          color: 'white',
                          fontWeight: 700,
                        }}
                      >
                        {n}
                      </div>
                    ))}
                  </div>
                  <p className="font-sans text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Join students already subscribed at AIU
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

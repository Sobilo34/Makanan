'use client';
import React, { useState, useRef, useEffect } from 'react';
import AppImage from '@/components/ui/AppImage';

interface MealPlan {
  id: string;
  name: string;
  description: string;
  options: { label: string; value: string }[];
  price: number;
  priceLabel: string;
  tag?: string;
  img: string;
  imgAlt: string;
  validity: string;
}

const mealPlans: MealPlan[] = [
  {
    id: 'lite-plan',
    name: 'Lite',
    description:
      'A lightweight option for students who want simple, reliable coverage without the full commitment.',
    options: [{ label: 'Normal', value: 'RM150/month' }],
    price: 150,
    priceLabel: 'RM150',
    tag: 'Entry',
    img: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80',
    imgAlt: 'Simple and fresh student meal with rice and vegetables',
    validity: 'Valid 30 days',
  },
  {
    id: 'basic-plan',
    name: 'Basic',
    description:
      'A balanced everyday option for students who want dependable meals without overcommitting.',
    options: [
      { label: 'Normal', value: 'RM250/month' },
      { label: 'Extra', value: 'RM250/month' },
    ],
    price: 250,
    priceLabel: 'RM250',
    tag: 'Starter',
    img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
    imgAlt: 'Healthy balanced meal bowl with rice, vegetables and protein',
    validity: 'Valid 30 days',
  },
  {
    id: 'standard-plan',
    name: 'Standard',
    description:
      'A reliable all-round plan designed for busy weeks, pickup routines, and steady student energy.',
    options: [
      { label: 'Normal', value: 'RM300/month' },
      { label: 'Extra', value: 'RM300/month' },
    ],
    price: 300,
    priceLabel: 'RM300',
    tag: 'Popular',
    img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
    imgAlt: 'Colorful nutritious meal spread with fresh vegetables and grains',
    validity: 'Valid 30 days',
  },
  {
    id: 'premium-plan',
    name: 'Premium',
    description:
      'A premium plan for students who want variety, flexibility, and a more elevated food experience.',
    options: [
      { label: 'Normal', value: 'RM400/month' },
      { label: 'Extra', value: 'RM400/month' },
    ],
    price: 400,
    priceLabel: 'RM400',
    tag: 'Best Value',
    img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
    imgAlt: 'Premium meal selection with diverse cuisines and fresh ingredients',
    validity: 'Valid 30 days',
  },
];

export default function DeliverySection() {
  const [cart, setCart] = useState<Record<string, number>>({});
  const sectionRef = useRef<HTMLDivElement>(null);

  const addToCart = (id: string) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const cartTotal = Object.entries(cart).reduce((sum, [id]) => {
    const p = mealPlans.find((pl) => pl.id === id);
    return sum + (p ? p.price : 0);
  }, 0);

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('visible');
        }),
      { threshold: 0.12 }
    );
    sectionRef.current?.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="bg-light-bg py-20 md:py-28 px-5 md:px-10 relative overflow-hidden"
      id="plans"
    >
      {/* Subtle background */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 80%, #3ECBA0 0%, transparent 50%), radial-gradient(circle at 80% 20%, #C8F0E4 0%, transparent 50%)',
        }}
      />

      <div className="max-w-6xl mx-auto relative">
        {/* Header row */}
        <div className="reveal flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="section-label">Meal Plans</span>
            <h2
              className="font-sans font-700 text-near-black leading-tight"
              style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700 }}
            >
              Choose your plan,
              <br />
              <span style={{ color: '#3ECBA0' }}>eat with ease.</span>
            </h2>
          </div>
          <p className="font-sans text-muted-text text-sm leading-relaxed max-w-xs">
            Flexible meal subscriptions starting from RM150/month. Cancel or upgrade anytime.
          </p>
        </div>

        {/* Plan Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {mealPlans.map((plan, i) => (
            <div
              key={plan.id}
              className={`reveal reveal-delay-${(i % 4) + 1} card-lift bg-white rounded-xl2 overflow-hidden border border-border-light`}
            >
              {/* Image */}
              <div className="relative h-44 overflow-hidden">
                <AppImage
                  src={plan.img}
                  alt={plan.imgAlt}
                  fill
                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-700"
                />
                {plan.tag && (
                  <div
                    className="absolute top-3 left-3 bg-primary-mint text-near-black font-sans text-[10px] font-600 uppercase tracking-widest px-2.5 py-1 rounded-pill"
                    style={{ fontWeight: 600 }}
                  >
                    {plan.tag}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3
                    className="font-sans font-600 text-near-black text-base leading-tight"
                    style={{ fontWeight: 600 }}
                  >
                    {plan.name}
                  </h3>
                  <span
                    className="font-sans font-700 text-primary-mint text-base whitespace-nowrap"
                    style={{ fontWeight: 700 }}
                  >
                    {plan.priceLabel}
                  </span>
                </div>
                <p className="font-sans text-muted-text text-sm leading-relaxed mb-3">
                  {plan.description}
                </p>

                <div className="space-y-2 mb-4">
                  {plan.options.map((option) => (
                    <div
                      key={option.label}
                      className="flex items-center justify-between rounded-lg bg-light-bg px-3 py-2 text-xs text-near-black"
                    >
                      <span
                        className="font-sans font-600 uppercase tracking-wide"
                        style={{ fontWeight: 600 }}
                      >
                        {option.label}
                      </span>
                      <span
                        className="font-sans font-700 text-primary-mint"
                        style={{ fontWeight: 700 }}
                      >
                        {option.value}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="font-sans text-xs text-muted-text tracking-wide mb-4">
                  {plan.validity}
                </p>

                <button
                  onClick={() => addToCart(plan.id)}
                  className="w-full bg-near-black text-white font-sans font-600 text-sm py-3 rounded-pill hover:bg-near-black/80 flex items-center justify-center gap-2 transition-colors"
                  style={{ fontWeight: 600 }}
                >
                  {cart[plan.id] ? (
                    <>
                      <span>Selected ✓</span>
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path
                          d="M7 2v10M2 7h10"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                      Subscribe Now
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Cart summary */}
        {cartCount > 0 && (
          <div className="reveal mt-10 bg-white rounded-xl2 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-primary-mint/30 shadow-card">
            <div>
              <p
                className="font-sans font-600 text-near-black text-base"
                style={{ fontWeight: 600 }}
              >
                {cartCount} plan{cartCount > 1 ? 's' : ''} selected
              </p>
              <p className="font-sans text-muted-text text-sm">Total: RM{cartTotal}/month</p>
            </div>
            <button
              className="bg-primary-mint text-near-black font-sans font-700 text-sm px-8 py-3.5 rounded-pill hover:bg-primary-mint-dark transition-colors"
              style={{ fontWeight: 700 }}
            >
              Proceed to Subscribe →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

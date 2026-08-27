'use client';
import React, { useState, useRef, useEffect } from 'react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    category: 'Plans & Pricing',
    question: 'What is the difference between 40 and 60 meal plans?',
    answer:
      '40 meals covers roughly 2 meals per weekday — ideal if you eat out or cook on weekends. 60 meals gives you 3 meals a day across the full week, so you never have to think about food. Both options are available across all three tiers: Value, Regular, and Flex.',
  },
  {
    category: 'Plans & Pricing',
    question: 'Can I switch my plan mid-semester?',
    answer:
      'Yes. You can upgrade or downgrade your plan at any time from your student dashboard. Changes take effect from the next billing cycle. If you upgrade, the prorated difference is charged immediately.',
  },
  {
    category: 'Plans & Pricing',
    question: 'What happens if I cancel my subscription?',
    answer:
      'You can cancel anytime with no penalty. When you cancel, unused meal credits are instantly refunded to your Makanan wallet. You can use those credits to resubscribe or redeem meals à la carte.',
  },
  {
    category: 'Meals & Delivery',
    question: 'How do I collect my meals?',
    answer:
      'Open the Makanan app, tap the meal you want to redeem, and show the QR code at the partner kitchen. No queuing, no cash — just tap and collect. Each redemption takes under 30 seconds.',
  },
  {
    category: 'Meals & Delivery',
    question: 'Are the meals freshly prepared every day?',
    answer:
      'Yes. All meals are prepared fresh daily by our verified campus kitchen partners. Menus rotate weekly so you get variety without repetition. Nutritional info for each meal is visible in the app before you order.',
  },
  {
    category: 'Meals & Delivery',
    question: 'What if I miss a meal on a given day?',
    answer:
      'Unused daily meals roll over within the same week — they do not expire overnight. At the end of each week, any remaining unredeeemed meals from that week are converted to wallet credits automatically.',
  },
  {
    category: 'Account & Payments',
    question: 'Which payment methods are accepted?',
    answer:
      'We accept all major credit and debit cards, FPX online banking, and e-wallets including Touch \'n Go and GrabPay. Payments are processed securely via Stripe. Your card details are never stored on our servers.',
  },
  {
    category: 'Account & Payments',
    question: 'Is my personal data safe with Makanan?',
    answer:
      'Absolutely. We are PDPA-compliant and do not sell or share your data with third parties. Your meal history, payment info, and personal details are encrypted and stored securely on our servers.',
  },
];

const categories = Array.from(new Set(faqs.map((f) => f.category)));

function AccordionItem({
  item,
  index,
  isOpen,
  onToggle,
}: {
  item: FAQItem;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (bodyRef.current) {
      setHeight(isOpen ? bodyRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  return (
    <div
      className="border-b border-gray-100 last:border-0"
      style={{ borderColor: 'rgba(0,0,0,0.06)' }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-4 py-5 text-left group"
        aria-expanded={isOpen}
      >
        <span
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 transition-all duration-300"
          style={{
            background: isOpen ? '#3ECBA0' : 'rgba(62,203,160,0.1)',
            color: isOpen ? '#fff' : '#3ECBA0',
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            style={{
              transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          >
            <path
              d="M6 1v10M1 6h10"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span
          className="font-sans text-base leading-snug transition-colors duration-200"
          style={{
            fontWeight: 600,
            color: isOpen ? '#1A1A1A' : '#2D2D2D',
          }}
        >
          {item.question}
        </span>
      </button>
      <div
        style={{
          height,
          overflow: 'hidden',
          transition: 'height 0.35s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <div ref={bodyRef} className="pl-11 pb-5 pr-2">
          <p className="font-sans text-sm leading-relaxed" style={{ color: '#6B7280' }}>
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.1 }
    );
    const reveals = sectionRef.current?.querySelectorAll('.reveal');
    reveals?.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const filtered = faqs.filter((f) => f.category === activeCategory);

  return (
    <section ref={sectionRef} className="py-20 md:py-28 px-5 md:px-10" style={{ background: '#F7FAF9' }} id="faq">
      <div className="max-w-5xl mx-auto">
        {/* Header row */}
        <div className="reveal grid md:grid-cols-2 gap-10 md:gap-16 items-start mb-14">
          {/* Left — headline */}
          <div>
            <span
              className="inline-block font-sans text-xs font-600 uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
              style={{ fontWeight: 600, background: 'rgba(62,203,160,0.12)', color: '#1A9E74' }}
            >
              FAQ
            </span>
            <h2
              className="font-sans font-700 text-near-black leading-tight mb-4"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700 }}
            >
              Everything you&apos;d want to{' '}
              <span style={{ color: '#3ECBA0' }}>know.</span>
            </h2>
            <p className="font-sans text-sm leading-relaxed" style={{ color: '#6B7280' }}>
              Can&apos;t find what you&apos;re looking for? Reach us at{' '}
              <a
                href="mailto:hello@makanan.my"
                className="underline underline-offset-2 transition-colors"
                style={{ color: '#3ECBA0' }}
              >
                hello@makanan.my
              </a>{' '}
              and we&apos;ll get back within 24 hours.
            </p>

            {/* Category pills */}
            <div className="flex flex-wrap gap-2 mt-8">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setOpenIndex(null);
                  }}
                  className="font-sans text-xs px-4 py-2 rounded-full transition-all duration-200"
                  style={{
                    fontWeight: 600,
                    background: activeCategory === cat ? '#1A1A1A' : 'white',
                    color: activeCategory === cat ? '#fff' : '#6B7280',
                    border: activeCategory === cat ? '1px solid #1A1A1A' : '1px solid rgba(0,0,0,0.1)',
                    boxShadow: activeCategory === cat ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Right — decorative stat card */}
          <div
            className="hidden md:flex flex-col justify-between rounded-2xl p-8 h-full min-h-[220px]"
            style={{ background: '#1A1A1A', color: '#fff' }}
          >
            <div>
              <p className="font-sans text-xs uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                Still have questions?
              </p>
              <p className="font-sans text-2xl font-700 leading-snug" style={{ fontWeight: 700 }}>
                Our support team replies in under{' '}
                <span style={{ color: '#3ECBA0' }}>2 hours.</span>
              </p>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <div className="flex -space-x-2">
                {[
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80',
                  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&q=80',
                  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&q=80',
                ].map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt="Support team member"
                    className="w-9 h-9 rounded-full object-cover border-2"
                    style={{ borderColor: '#1A1A1A' }}
                  />
                ))}
              </div>
              <p className="font-sans text-xs" style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>
                Real humans, not bots.
              </p>
            </div>
          </div>
        </div>

        {/* Accordion */}
        <div
          className="reveal reveal-delay-1 rounded-2xl overflow-hidden"
          style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.04)' }}
        >
          <div className="px-6 md:px-8">
            {filtered.map((item, i) => (
              <AccordionItem
                key={`${activeCategory}-${i}`}
                item={item}
                index={i}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

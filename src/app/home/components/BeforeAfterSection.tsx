'use client';
import React, { useRef, useState, useCallback, useEffect } from 'react';

interface PlanComparison {
  id: string;
  number: string;
  tier: string;
  price40: string;
  price60: string;
  label40: string;
  label60: string;
  desc40: string;
  desc60: string;
  img40: string;
  img40Alt: string;
  img60: string;
  img60Alt: string;
  accentColor: string;
  initialPosition: number;
}

const comparisons: PlanComparison[] = [
  {
    id: 'value',
    number: '01',
    tier: 'Value Tier',
    price40: 'RM250 / month',
    price60: 'RM300 / month',
    label40: '40 Meals',
    label60: '60 Meals',
    desc40: 'Perfect starter — covers your main meals on weekdays. Great for students who eat out on weekends.',
    desc60: 'Full coverage — breakfast, lunch and dinner across the week. Best value per meal in this tier.',
    img40: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=900&q=80',
    img40Alt: 'Value plan 40 meals — a neatly packed nasi lemak with sambal, egg and anchovies',
    img60: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=900&q=80',
    img60Alt: 'Value plan 60 meals — a generous spread of rice, curry and vegetables',
    accentColor: '#3ECBA0',
    initialPosition: 45,
  },
  {
    id: 'regular',
    number: '02',
    tier: 'Regular Tier',
    price40: 'RM300 / month',
    price60: 'RM400 / month',
    label40: '40 Meals',
    label60: '60 Meals',
    desc40: 'Upgraded portions and more variety. Ideal for students who want quality without going all-in.',
    desc60: 'Premium daily meals with wider menu rotation. The most popular plan among AIU students.',
    img40: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=900&q=80',
    img40Alt: 'Regular plan 40 meals — grilled chicken with steamed rice and fresh salad',
    img60: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=900&q=80',
    img60Alt: 'Regular plan 60 meals — a vibrant bowl of mixed grains, protein and greens',
    accentColor: '#2BB88A',
    initialPosition: 50,
  },
  {
    id: 'flex',
    number: '03',
    tier: 'Flex Tier',
    price40: 'RM400 / month',
    price60: 'RM500 / month',
    label40: '40 Meals',
    label60: '60 Meals',
    desc40: 'Maximum flexibility — choose your meals daily from a rotating premium menu. No commitments on timing.',
    desc60: 'Full semester coverage with the most diverse menu. Flex your schedule, never skip a meal.',
    img40: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&q=80',
    img40Alt: 'Flex plan 40 meals — premium plated meal with grilled protein and roasted vegetables',
    img60: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=900&q=80',
    img60Alt: 'Flex plan 60 meals — colourful fresh meal bowl with diverse ingredients',
    accentColor: '#1A9E74',
    initialPosition: 48,
  },
];

function PlanSlider({ comparison }: { comparison: PlanComparison }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(comparison.initialPosition);
  const [dragging, setDragging] = useState(false);
  const rafRef = useRef<number | null>(null);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.min(Math.max((clientX - rect.left) / rect.width * 100, 2), 98);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => setPosition(pct));
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    updatePosition(e.clientX);
  }, [updatePosition]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setDragging(true);
    updatePosition(e.touches[0].clientX);
  }, [updatePosition]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (dragging) updatePosition(e.clientX); };
    const onTouch = (e: TouchEvent) => { if (dragging) updatePosition(e.touches[0].clientX); };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouch);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('touchend', onUp);
    };
  }, [dragging, updatePosition]);

  return (
    <div
      ref={containerRef}
      className="ba-slider w-full rounded-xl2 overflow-hidden select-none cursor-col-resize"
      style={{ aspectRatio: '16/9', maxHeight: 480, position: 'relative' }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      {/* 40 Meals — base layer */}
      <div className="absolute inset-0">
        <img
          src={comparison.img40}
          alt={comparison.img40Alt}
          className="w-full h-full object-cover"
          draggable={false}
        />
        {/* 40 Meals label */}
        <div className="absolute top-4 left-4 flex flex-col gap-1">
          <div className="bg-near-black/85 backdrop-blur-sm px-3 py-1.5 rounded-lg">
            <p className="font-sans text-[10px] text-white/60 uppercase tracking-widest">40 Meals</p>
            <p className="font-sans text-sm text-white font-700" style={{ fontWeight: 700 }}>{comparison.price40}</p>
          </div>
        </div>
      </div>

      {/* 60 Meals — clipped overlay */}
      <div className="ba-after" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <img
          src={comparison.img60}
          alt={comparison.img60Alt}
          className="w-full h-full object-cover"
          draggable={false}
        />
        {/* 60 Meals label */}
        <div className="absolute top-4 right-4 flex flex-col gap-1 items-end">
          <div className="backdrop-blur-sm px-3 py-1.5 rounded-lg" style={{ background: `${comparison.accentColor}E6` }}>
            <p className="font-sans text-[10px] text-near-black/70 uppercase tracking-widest">60 Meals</p>
            <p className="font-sans text-sm text-near-black font-700" style={{ fontWeight: 700 }}>{comparison.price60}</p>
          </div>
        </div>
      </div>

      {/* Drag handle */}
      <div className="ba-handle" style={{ left: `${position}%` }} />

      {/* Center hint on first render */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{ opacity: dragging ? 0 : 0.7, transition: 'opacity 0.3s' }}
      >
        <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4 2L1 6l3 4M8 2l3 4-3 4" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="font-sans text-[10px] text-near-black font-600" style={{ fontWeight: 600 }}>Drag to compare</span>
        </div>
      </div>
    </div>
  );
}

export default function BeforeAfterSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.15 }
    );
    const reveals = sectionRef.current?.querySelectorAll('.reveal');
    reveals?.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="bg-white py-20 md:py-28 px-5 md:px-10" id="how-it-works">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="reveal mb-16 md:mb-20 text-center">
          <span className="section-label">Plan Comparison</span>
          <h2 className="font-sans font-700 text-near-black leading-tight mb-4" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700 }}>
            Student life, <span style={{ color: '#3ECBA0' }}>transformed.</span>
          </h2>
          <p className="font-sans text-base text-muted-text max-w-lg mx-auto leading-relaxed">
            Drag the handle. See what eating with Makanan actually looks like — compare 40 meals vs 60 meals across each plan tier.
          </p>
          {/* Plan legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            {[
              { label: '40 Meals', color: '#1A1A1A', bg: '#F5F5F5' },
              { label: '60 Meals', color: '#1A1A1A', bg: '#3ECBA0' },
            ].map((item) => (
              <div
                key={item.label}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-sans font-600"
                style={{ background: item.bg, color: item.color, fontWeight: 600 }}
              >
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: item.color === '#1A1A1A' && item.bg === '#F5F5F5' ? '#888' : item.color }} />
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* Comparisons */}
        <div className="flex flex-col gap-20 md:gap-28">
          {comparisons.map((comparison, i) => (
            <div key={comparison.id} className={`reveal reveal-delay-${i % 3 + 1}`}>
              {/* Tier label row */}
              <div className="flex items-center gap-4 mb-6">
                <span className="font-sans text-xs font-600 tracking-widest" style={{ fontWeight: 600, color: comparison.accentColor }}>{comparison.number}</span>
                <div className="h-px flex-1 bg-border-light" />
                <span className="font-sans text-xs text-muted-text tracking-widest uppercase font-500" style={{ fontWeight: 500 }}>{comparison.tier}</span>
              </div>

              {/* Slider */}
              <PlanSlider comparison={comparison} />

              {/* Plan descriptions */}
              <div className="grid grid-cols-2 gap-4 mt-5">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
                    <p className="font-sans text-xs font-700 text-near-black uppercase tracking-widest" style={{ fontWeight: 700 }}>40 Meals</p>
                    <span className="ml-auto font-sans text-xs font-600 text-muted-text" style={{ fontWeight: 600 }}>{comparison.price40}</span>
                  </div>
                  <p className="font-sans text-muted-text text-sm leading-snug">{comparison.desc40}</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: `${comparison.accentColor}15`, border: `1px solid ${comparison.accentColor}30` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: comparison.accentColor }} />
                    <p className="font-sans text-xs font-700 text-near-black uppercase tracking-widest" style={{ fontWeight: 700 }}>60 Meals</p>
                    <span className="ml-auto font-sans text-xs font-600" style={{ fontWeight: 600, color: comparison.accentColor }}>{comparison.price60}</span>
                  </div>
                  <p className="font-sans text-near-black text-sm leading-snug font-500" style={{ fontWeight: 500 }}>{comparison.desc60}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

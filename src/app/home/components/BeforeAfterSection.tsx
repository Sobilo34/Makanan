'use client';
import React, { useRef, useState, useCallback, useEffect } from 'react';

interface MealComparison {
  id: string;
  number: string;
  label: string;
  beforeTitle: string;
  beforeDesc: string;
  afterTitle: string;
  afterDesc: string;
  beforeImg: string;
  beforeAlt: string;
  afterImg: string;
  afterAlt: string;
  initialPosition: number;
}

const comparisons: MealComparison[] = [
  {
    id: 'breakfast',
    number: '01',
    label: 'Breakfast',
    beforeTitle: 'Skipped Again',
    beforeDesc: 'No time, no energy, no breakfast',
    afterTitle: 'Nasi Lemak Set',
    afterDesc: 'Warm, fresh, ready at 7am — just tap and collect',
    beforeImg: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
    beforeAlt: 'Empty coffee cup and rushed morning desk with no food',
    afterImg: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
    afterAlt: 'Fresh nasi lemak breakfast set with egg, sambal and cucumber',
    initialPosition: 45,
  },
  {
    id: 'lunch',
    number: '02',
    label: 'Lunch',
    beforeTitle: 'Instant Noodles',
    beforeDesc: 'Cheap, fast, and nutritionally empty',
    afterTitle: 'Rice + Protein Set',
    afterDesc: 'Balanced macros, fresh ingredients, cooked that morning',
    beforeImg: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841',
    beforeAlt: 'Cup of instant noodles on a student desk',
    afterImg: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
    afterAlt: 'Nutritious rice and protein meal set with vegetables',
    initialPosition: 50,
  },
  {
    id: 'dinner',
    number: '03',
    label: 'Dinner',
    beforeTitle: 'Mamak at Midnight',
    beforeDesc: 'Expensive, unhealthy, and you\'re still hungry at 2am',
    afterTitle: 'Wholesome Dinner Set',
    afterDesc: 'Hot meal waiting for you after evening class. Every night.',
    beforeImg: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
    beforeAlt: 'Late night mamak food spread on a plastic table',
    afterImg: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352',
    afterAlt: 'Wholesome dinner set with rice, vegetables and protein',
    initialPosition: 48,
  },
];

function BASlider({ comparison }: { comparison: MealComparison }) {
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
      className="ba-slider w-full rounded-xl2 overflow-hidden"
      style={{ aspectRatio: '16/9', maxHeight: 520 }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      {/* Before — full width */}
      <div className="absolute inset-0">
        <img
          src={comparison.beforeImg}
          alt={comparison.beforeAlt}
          className="w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute bottom-4 left-4 bg-near-black/80 backdrop-blur-sm px-3 py-1.5 rounded-pill">
          <p className="font-sans text-xs text-white/80 uppercase tracking-wider font-500" style={{ fontWeight: 500 }}>{comparison.beforeTitle}</p>
        </div>
      </div>

      {/* After — clipped */}
      <div className="ba-after" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <img
          src={comparison.afterImg}
          alt={comparison.afterAlt}
          className="w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute bottom-4 right-4 bg-primary-mint/90 backdrop-blur-sm px-3 py-1.5 rounded-pill">
          <p className="font-sans text-xs text-near-black font-600 uppercase tracking-wider" style={{ fontWeight: 600 }}>{comparison.afterTitle}</p>
        </div>
      </div>

      {/* Handle */}
      <div className="ba-handle" style={{ left: `${position}%` }} />
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
          <span className="section-label">Before vs After Makanan</span>
          <h2 className="font-sans font-700 text-near-black leading-tight mb-4" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700 }}>
            Student life, <span style={{ color: '#3ECBA0' }}>transformed.</span>
          </h2>
          <p className="font-sans text-base text-muted-text max-w-md mx-auto leading-relaxed">
            Drag the handle. See what eating with Makanan actually looks like.
          </p>
        </div>

        {/* Comparisons */}
        <div className="flex flex-col gap-20 md:gap-28">
          {comparisons.map((comparison, i) => (
            <div key={comparison.id} className={`reveal reveal-delay-${i % 3 + 1}`}>
              {/* Label */}
              <div className="flex items-center gap-4 mb-6">
                <span className="font-sans text-xs text-primary-mint font-600 tracking-widest" style={{ fontWeight: 600 }}>{comparison.number}</span>
                <div className="h-px flex-1 bg-border-light" />
                <span className="font-sans text-xs text-muted-text tracking-widest uppercase font-500" style={{ fontWeight: 500 }}>{comparison.label}</span>
              </div>

              {/* Slider */}
              <BASlider comparison={comparison} />

              {/* Descriptions */}
              <div className="grid grid-cols-2 gap-4 mt-5">
                <div>
                  <p className="font-sans text-xs font-600 text-muted-text uppercase tracking-widest mb-1" style={{ fontWeight: 600 }}>Without Makanan</p>
                  <p className="font-sans text-muted-text text-base leading-snug">{comparison.beforeDesc}</p>
                </div>
                <div className="text-right">
                  <p className="font-sans text-xs font-600 uppercase tracking-widest mb-1" style={{ fontWeight: 600, color: '#3ECBA0' }}>With Makanan</p>
                  <p className="font-sans text-near-black text-base leading-snug font-500" style={{ fontWeight: 500 }}>{comparison.afterDesc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

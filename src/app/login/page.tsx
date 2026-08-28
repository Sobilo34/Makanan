'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

const slides = [
  {
    id: 0,
    headline: 'Your meals,\nmade simple.',
    sub: 'Choose a plan that fits your budget and routine.',
    accent: '#3ECBA0',
    bg: 'linear-gradient(135deg, #0f2027 0%, #1a3a2e 50%, #0d2b22 100%)',
    visual: (
      <div className="w-full max-w-[340px] mx-auto space-y-3">
        {[
          { name: 'Value Regular', price: 'RM250', credits: '60 meals', pct: 45, color: '#6B7280' },
          { name: 'Standard Plan', price: 'RM300', credits: '60 meals', pct: 72, color: '#3ECBA0' },
          { name: 'Premium Flex', price: 'RM400', credits: '40 meals', pct: 88, color: '#F4B054' },
        ].map((p, i) => (
          <div key={i} className="bg-white/8 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-semibold text-sm">{p.name}</span>
                <span className="text-white/60 text-xs">{p.credits}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${p.pct}%`, background: p.color }} />
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-white font-bold text-base">{p.price}</div>
              <div className="text-white/40 text-xs">/mo</div>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 1,
    headline: 'Know what\nyou\'re eating.',
    sub: 'Browse available meals and see where they come from.',
    accent: '#3ECBA0',
    bg: 'linear-gradient(135deg, #0a1628 0%, #0d2b22 50%, #1a1a2e 100%)',
    visual: (
      <div className="w-full max-w-[340px] mx-auto">
        <div className="bg-white/8 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
              <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <span className="text-white/40 text-xs">Search meals...</span>
            </div>
          </div>
          {[
            { name: 'Nasi Lemak', loc: 'School Cafeteria', cat: 'Breakfast', badge: 'Available', badgeColor: '#3ECBA0' },
            { name: 'Chicken Rice', loc: 'School Cafeteria', cat: 'Lunch', badge: 'Low Stock', badgeColor: '#F4B054' },
            { name: 'Spicy Noodles', loc: 'Mamak Stall', cat: 'Dinner', badge: 'Available', badgeColor: '#3ECBA0' },
          ].map((m, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg flex-shrink-0">🍽️</div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-xs font-semibold truncate">{m.name}</div>
                <div className="text-white/40 text-xs">{m.loc}</div>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: `${m.badgeColor}22`, color: m.badgeColor }}>{m.badge}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 2,
    headline: 'Redeem with\na QR code.',
    sub: 'Show your code at the counter — no cash, no hassle.',
    accent: '#3ECBA0',
    bg: 'linear-gradient(135deg, #0d2b22 0%, #0f2027 50%, #1a2a1a 100%)',
    visual: (
      <div className="w-full max-w-[280px] mx-auto">
        <div className="bg-white rounded-3xl p-6 shadow-2xl text-center">
          <div className="w-12 h-12 bg-[#3ECBA0] rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <div className="text-[#1A1A1A] font-bold text-base mb-1">Meal Redeemed!</div>
          <div className="text-[#6B7280] text-xs mb-4">Show this at the cafeteria</div>
          <div className="bg-[#F8F8F8] rounded-2xl p-3 mb-3 inline-block">
            <div className="grid grid-cols-7 gap-0.5 w-24 h-24">
              {Array.from({ length: 49 }, (_, i) => (
                <div key={i} className={`aspect-square rounded-sm ${[0,1,7,8,14,2,9,4,11,6,13,42,43,49,50,56,44,51,48,55,20,27,34,22,29,36,24,31,38].includes(i) ? 'bg-[#1A1A1A]' : 'bg-transparent'}`} />
              ))}
            </div>
          </div>
          <div className="text-[#3ECBA0] font-mono text-xs font-bold">MKN-SALAD-32-VALID</div>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    headline: 'Eat with\nEase.',
    sub: 'Redeem your meals without worrying about daily payment.',
    accent: '#3ECBA0',
    bg: 'linear-gradient(135deg, #1a2a1a 0%, #0d2b22 50%, #0a1628 100%)',
    visual: (
      <div className="w-full max-w-[340px] mx-auto space-y-3">
        <div className="bg-white/8 backdrop-blur-md border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-white/60 text-xs mb-0.5">Standard Plan</div>
              <div className="text-white font-bold text-xl">32 meals left</div>
            </div>
            <div className="w-12 h-12 bg-[#3ECBA0]/20 rounded-2xl flex items-center justify-center">
              <span className="text-[#3ECBA0] font-bold text-lg">M</span>
            </div>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-1">
            <div className="h-full bg-[#3ECBA0] rounded-full" style={{ width: '80%' }} />
          </div>
          <div className="flex justify-between text-white/40 text-xs">
            <span>8 used</span><span>80% remaining</span>
          </div>
        </div>
        <div className="bg-white/8 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-lg flex-shrink-0">🍱</div>
          <div className="flex-1 min-w-0">
            <div className="text-white/60 text-xs">Today · Breakfast</div>
            <div className="text-white font-semibold text-sm">Nasi Lemak</div>
          </div>
          <div className="bg-[#3ECBA0] text-white text-xs font-bold px-3 py-1.5 rounded-xl flex-shrink-0">Redeem</div>
        </div>
      </div>
    ),
  },
];

export default function LoginPage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams?.get('next') || null;

  useEffect(() => {
    const timer = setInterval(() => setActiveSlide((p) => (p + 1) % slides.length), 4500);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      // If a next param is provided, navigate there after sign-in
      if (nextParam) {
        // decode if it was encoded
        const dest = decodeURIComponent(nextParam);
        router.push(dest);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const slide = slides[activeSlide];

  return (
    <div className="min-h-screen flex bg-white">
      {/* ── Left panel — Slideshow (desktop only) ── */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col relative overflow-hidden"
        style={{ background: slide.bg, transition: 'background 0.8s ease' }}
      >
        {/* Ambient glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: '#3ECBA0' }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: '#2DAF87' }} />

        {/* Logo */}
        <div className="relative z-10 p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/assets/images/makanan-app-icon-removebg-preview-1787356761493.png"
              alt="Makanan"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
          <div className="text-white/40 text-xs font-medium">Student Meal Network</div>
        </div>

        {/* Slide visual */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-10">
          <div className="mb-8 transition-all duration-500">
            {slide.visual}
          </div>
          <div className="space-y-2 mb-8">
            <h2 className="text-white font-bold text-4xl leading-tight whitespace-pre-line" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
              {slide.headline}
            </h2>
            <p className="text-white/60 text-base leading-relaxed">{slide.sub}</p>
          </div>
          {/* Dots */}
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className="h-1.5 rounded-full transition-all duration-400"
                style={{ width: i === activeSlide ? 28 : 8, background: i === activeSlide ? '#3ECBA0' : 'rgba(255,255,255,0.25)' }}
              />
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10 px-10 pb-8">
          <p className="text-white/25 text-xs">© 2026 Makanan · Albukhary International University</p>
        </div>
      </div>

      {/* ── Right panel — Form ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white overflow-y-auto">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <Image
              src="/assets/images/makanan-app-icon-removebg-preview-1787356761493.png"
              alt="Makanan"
              width={36}
              height={36}
              className="object-contain"
            />
            <span className="text-[#1A1A1A] font-bold text-lg tracking-tight">Makanan</span>
          </div>

          <div className="mb-8">
            <p className="text-[#3ECBA0] text-sm font-semibold mb-2 tracking-wide uppercase">Welcome back</p>
            <h1 className="text-[#1A1A1A] font-bold text-3xl leading-tight mb-2">Sign in to your account</h1>
            <p className="text-[#6B7280] text-sm">Access your meal plan and start redeeming</p>
          </div>

          {/* Demo hint */}
          <div className="bg-gradient-to-r from-[#E6F9F2] to-[#F2FBF7] border border-[#C8F0E4] rounded-2xl p-4 mb-7 flex items-start gap-3">
            <div className="w-8 h-8 bg-[#3ECBA0]/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-[#3ECBA0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-[#2DAF87] text-xs font-bold mb-0.5">Demo Account</p>
              <p className="text-[#1A1A1A] text-xs font-mono">demo@makanan.app · demo1234</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[#1A1A1A] text-sm font-semibold mb-2">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="makanan-input w-full px-4 py-3.5 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-[#1A1A1A] text-sm font-semibold mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="makanan-input w-full px-4 py-3.5 rounded-xl text-sm pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1A1A1A] transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-[#3ECBA0] text-sm font-medium hover:text-[#2DAF87] transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="cta-primary w-full bg-[#3ECBA0] text-white font-bold py-4 rounded-xl text-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Signing in...
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-[#6B7280] text-sm mt-7">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#3ECBA0] font-bold hover:text-[#2DAF87] transition-colors">
              Create one
            </Link>
          </p>

          <p className="text-center text-[#9CA3AF] text-xs mt-3">
            Partner Portal?{' '}
            <Link href="/partner-portal/login" className="text-[#9CA3AF] underline hover:text-[#6B7280] transition-colors">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const slides = [
  {
    headline: 'Join thousands of\nstudents eating smarter.',
    sub: 'Pick a plan, subscribe once, eat all month.',
    visual: (
      <div className="w-full max-w-[340px] mx-auto grid grid-cols-2 gap-3">
        {[
          { name: 'Value Regular', price: 'RM250', credits: '60 meals', tier: 'value' },
          { name: 'Standard Regular', price: 'RM300', credits: '60 meals', tier: 'standard' },
          { name: 'Premium Flex', price: 'RM400', credits: '40 meals', tier: 'premium' },
          { name: 'Standard Flex', price: 'RM300', credits: '40 meals', tier: 'standard' },
        ].map((p, i) => (
          <div key={i} className="bg-white/8 backdrop-blur-md border border-white/10 rounded-2xl p-4">
            <div className="text-white font-bold text-xl mb-0.5">{p.price}</div>
            <div className="text-white/70 text-xs font-semibold leading-tight">{p.name}</div>
            <div className="text-white/40 text-xs mt-1">{p.credits}</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    headline: 'No cash.\nNo queues. Just eat.',
    sub: 'Redeem meals instantly with your QR code at any partner cafeteria.',
    visual: (
      <div className="w-full max-w-[340px] mx-auto space-y-3">
        {[
          { step: '01', title: 'Choose your plan', desc: 'Pick from 6 flexible meal plans' },
          { step: '02', title: 'Browse meals', desc: 'See what\'s available today' },
          { step: '03', title: 'Redeem with QR', desc: 'Show code at the counter' },
        ].map((s, i) => (
          <div key={i} className="bg-white/8 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-[#3ECBA0]/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-[#3ECBA0] font-bold text-sm">{s.step}</span>
            </div>
            <div>
              <div className="text-white font-semibold text-sm">{s.title}</div>
              <div className="text-white/40 text-xs">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    headline: 'Six plans.\nEvery budget.',
    sub: 'From RM250 Value to RM400 Premium — find your perfect fit.',
    visual: (
      <div className="w-full max-w-[340px] mx-auto">
        <div className="bg-white/8 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
          <div className="bg-[#3ECBA0]/20 px-5 py-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-bold text-lg">Standard Plan</div>
                <div className="text-white/60 text-xs">Most popular choice</div>
              </div>
              <div className="text-right">
                <div className="text-[#3ECBA0] font-bold text-2xl">RM300</div>
                <div className="text-white/40 text-xs">/month</div>
              </div>
            </div>
          </div>
          <div className="px-5 py-4 space-y-2">
            {['60 meal credits', 'Breakfast + Lunch + Dinner', 'All partner cafeterias', 'QR redemption'].map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#3ECBA0]/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-2.5 h-2.5 text-[#3ECBA0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <span className="text-white/70 text-xs">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
];

export default function SignupPage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => setActiveSlide((p) => (p + 1) % slides.length), 4500);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await signUp(email, password, { fullName });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const slide = slides[activeSlide];

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f2027 0%, #1a3a2e 50%, #0d2b22 100%)' }}
      >
        <div className="absolute top-1/3 left-1/3 w-80 h-80 rounded-full opacity-15 blur-3xl pointer-events-none" style={{ background: '#3ECBA0' }} />
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: '#2DAF87' }} />

        <div className="relative z-10 p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#3ECBA0] rounded-xl flex items-center justify-center shadow-lg shadow-[#3ECBA0]/30">
              <span className="text-white font-bold text-base">M</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Makanan</span>
          </div>
          <div className="text-white/40 text-xs font-medium">Student Meal Network</div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center px-10">
          <div className="mb-8">{slide.visual}</div>
          <div className="space-y-2 mb-8">
            <h2 className="text-white font-bold text-4xl leading-tight whitespace-pre-line" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
              {slide.headline}
            </h2>
            <p className="text-white/60 text-base leading-relaxed">{slide.sub}</p>
          </div>
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

        <div className="relative z-10 px-10 pb-8">
          <p className="text-white/25 text-xs">© 2026 Makanan · Albukhary International University</p>
        </div>
      </div>

      {/* Right panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white overflow-y-auto">
        <div className="w-full max-w-[400px] py-8">
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 bg-[#3ECBA0] rounded-xl flex items-center justify-center shadow-lg shadow-[#3ECBA0]/30">
              <span className="text-white font-bold text-base">M</span>
            </div>
            <span className="text-[#1A1A1A] font-bold text-lg tracking-tight">Makanan</span>
          </div>

          <div className="mb-8">
            <p className="text-[#3ECBA0] text-sm font-semibold mb-2 tracking-wide uppercase">Get started</p>
            <h1 className="text-[#1A1A1A] font-bold text-3xl leading-tight mb-2">Create your account</h1>
            <p className="text-[#6B7280] text-sm">Start your student meal subscription today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#1A1A1A] text-sm font-semibold mb-2">Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ahmad Faiz"
                required
                className="makanan-input w-full px-4 py-3.5 rounded-xl text-sm"
              />
            </div>
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
                  placeholder="Min. 6 characters"
                  required
                  className="makanan-input w-full px-4 py-3.5 rounded-xl text-sm pr-12"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[#1A1A1A] text-sm font-semibold mb-2">Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="makanan-input w-full px-4 py-3.5 rounded-xl text-sm"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="cta-primary w-full bg-[#3ECBA0] text-white font-bold py-4 rounded-xl text-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Creating account...
                </span>
              ) : 'Create account'}
            </button>
          </form>

          <p className="text-center text-[#6B7280] text-sm mt-7">
            Already have an account?{' '}
            <Link href="/login" className="text-[#3ECBA0] font-bold hover:text-[#2DAF87] transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

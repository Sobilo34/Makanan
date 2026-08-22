'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

export default function PartnerLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      // Check if user has a partner record
      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select('id, name')
        .eq('user_id', data.user.id)
        .single();

      if (partnerError || !partner) {
        await supabase.auth.signOut();
        setError('No partner account found for this email. Please contact support.');
        return;
      }

      router.push('/partner-portal/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(145deg, #0d2b22 0%, #1a3a2e 40%, #0f2027 100%)' }}>
        {/* Decorative circles */}
        <div className="absolute top-[-80px] right-[-80px] w-[320px] h-[320px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #3ECBA0 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-60px] left-[-60px] w-[260px] h-[260px] rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, #3ECBA0 0%, transparent 70%)' }} />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <Image
            src="/assets/images/makanan-app-icon-removebg-preview-1787356761493.png"
            alt="Makanan logo"
            width={40}
            height={40}
            className="object-contain"
          />
          <span className="text-white text-xl font-bold tracking-tight">Makanan</span>
          <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#3ECBA0]/20 text-[#3ECBA0] border border-[#3ECBA0]/30">
            Partner
          </span>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Grow your<br />
              <span style={{ color: '#3ECBA0' }}>food business</span><br />
              with us.
            </h2>
            <p className="text-white/60 text-base leading-relaxed max-w-sm">
              Manage your meals, track redemptions, and get paid — all from one dashboard built for campus food partners.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Active Partners', value: '24+' },
              { label: 'Daily Meals', value: '1,200+' },
              { label: 'Avg. Earnings', value: 'RM 4,500' },
              { label: 'Students Served', value: '800+' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                <div className="text-[#3ECBA0] text-xl font-bold">{stat.value}</div>
                <div className="text-white/50 text-xs mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/30 text-xs relative z-10">
          © 2026 Makanan. Partner Portal v1.0
        </p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#F8FAF9]">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <Image
              src="/assets/images/makanan-app-icon-removebg-preview-1787356761493.png"
              alt="Makanan"
              width={32}
              height={32}
              className="object-contain"
            />
            <span className="text-[#1a3028] font-bold text-lg">Makanan</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#3ECBA0]/15 text-[#3ECBA0]">Partner</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#111827] mb-2">Partner Sign In</h1>
            <p className="text-[#6B7280] text-sm">Access your partner dashboard to manage meals and redemptions.</p>
          </div>

          {error && (
            <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
              <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="partner@example.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#111827] text-sm placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/30 focus:border-[#3ECBA0] transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-[#374151]">Password</label>
                <Link href="/partner-portal/forgot-password" className="text-xs text-[#3ECBA0] hover:text-[#2db88d] font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#111827] text-sm placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/30 focus:border-[#3ECBA0] transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: loading ? '#9CA3AF' : 'linear-gradient(135deg, #3ECBA0 0%, #2db88d 100%)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In to Partner Portal'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#E5E7EB] text-center">
            <p className="text-sm text-[#6B7280]">
              Not a partner yet?{' '}
              <Link href="/partner-portal/apply" className="text-[#3ECBA0] font-semibold hover:text-[#2db88d]">
                Apply to join
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link href="/login" className="text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
              ← Back to Student Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

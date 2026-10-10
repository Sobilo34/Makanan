'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!email.trim() || !email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      await api.forgotPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f2027 0%, #1a3a2e 50%, #0d2b22 100%)' }}
      >
        <div
          className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: '#3ECBA0' }}
        />

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
          {/* Visual */}
          <div className="w-full max-w-[300px] mx-auto mb-10">
            <div className="bg-white/8 backdrop-blur-md border border-white/10 rounded-3xl p-8 text-center">
              <div className="w-16 h-16 bg-[#3ECBA0]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-[#3ECBA0]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
              </div>
              <div className="text-white font-bold text-lg mb-2">Secure Reset</div>
              <div className="text-white/50 text-sm leading-relaxed">
                We&apos;ll send a secure link to your email to reset your password safely.
              </div>
            </div>
          </div>

          <h2
            className="text-white font-bold text-4xl leading-tight mb-3"
            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}
          >
            Forgot your
            <br />
            password?
          </h2>
          <p className="text-white/60 text-base leading-relaxed">
            No worries — we&apos;ll send you a reset link right away.
          </p>
        </div>

        <div className="relative z-10 px-10 pb-8">
          <p className="text-white/25 text-xs">
            © 2026 Makanan · Albukhary International University
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-[400px]">
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 bg-[#3ECBA0] rounded-xl flex items-center justify-center shadow-lg shadow-[#3ECBA0]/30">
              <span className="text-white font-bold text-base">M</span>
            </div>
            <span className="text-[#1A1A1A] font-bold text-lg tracking-tight">Makanan</span>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#E6F9F2] to-[#C8F0E4] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-[#3ECBA0]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h1 className="text-[#1A1A1A] font-bold text-2xl mb-3">Check your email</h1>
              <p className="text-[#6B7280] text-sm mb-2 leading-relaxed">
                We sent a password reset link to
              </p>
              <p className="text-[#1A1A1A] font-semibold text-sm mb-8">{email}</p>
              <div className="bg-[#F2FBF7] border border-[#D0F0E4] rounded-2xl p-4 mb-8 text-left">
                <p className="text-[#2DAF87] text-xs font-semibold mb-1">Didn&apos;t receive it?</p>
                <p className="text-[#6B7280] text-xs">
                  Check your spam folder or try again with a different email address.
                </p>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-[#3ECBA0] font-semibold text-sm hover:text-[#2DAF87] transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <p className="text-[#3ECBA0] text-sm font-semibold mb-2 tracking-wide uppercase">
                  Password reset
                </p>
                <h1 className="text-[#1A1A1A] font-bold text-3xl leading-tight mb-2">
                  Reset your password
                </h1>
                <p className="text-[#6B7280] text-sm">
                  Enter your email and we&apos;ll send you a reset link
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[#1A1A1A] text-sm font-semibold mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="makanan-input w-full px-4 py-3.5 rounded-xl text-sm"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm flex items-center gap-2">
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="cta-primary w-full bg-[#3ECBA0] text-white font-bold py-4 rounded-xl text-sm disabled:opacity-60 disabled:shadow-none"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    'Send reset link'
                  )}
                </button>
              </form>

              <p className="text-center text-[#6B7280] text-sm mt-7">
                Remember your password?{' '}
                <Link
                  href="/login"
                  className="text-[#3ECBA0] font-bold hover:text-[#2DAF87] transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

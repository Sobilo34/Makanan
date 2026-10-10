'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('admin@makanan.app');
  const [password, setPassword] = useState('admin1234');
  const [showPassword, setShowPassword] = useState(false);

  const DEMO_EMAIL = 'admin@makanan.app';
  const DEMO_PASSWORD = 'admin1234';

  const fillDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.login({ email, password });
      if (res.user?.role !== 'admin') {
        api.clearToken();
        setError('Access denied. This portal is for administrators only.');
        return;
      }

      router.push('/admin-portal/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        background: 'linear-gradient(135deg, #0a1628 0%, #0d2137 40%, #0a1f2e 100%)',
      }}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #3ECBA0 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-[-150px] left-[-150px] w-[500px] h-[500px] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #3ECBA0 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 left-1/4 w-[300px] h-[300px] rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #60a5fa 0%, transparent 70%)' }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(62,203,160,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(62,203,160,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-[480px] mx-4">
        {/* Card */}
        <div
          className="rounded-3xl p-8 shadow-2xl"
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* Logo + badge */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #1a3028 0%, #0d2b22 100%)',
                  border: '1px solid rgba(62,203,160,0.2)',
                }}
              >
                <Image
                  src="/assets/images/makanan-app-icon-removebg-preview-1787356761493.png"
                  alt="Makanan Admin"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <div
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #3ECBA0, #2db88d)' }}
              >
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Admin Portal</h1>
            <p className="text-white/40 text-sm">Makanan Management System</p>
          </div>

          {/* Demo credentials banner */}
          <button
            type="button"
            onClick={fillDemo}
            className="w-full mb-6 text-left rounded-2xl p-4 flex items-start gap-3 transition-all group"
            style={{
              background: 'rgba(62,203,160,0.08)',
              border: '1px solid rgba(62,203,160,0.2)',
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: 'rgba(62,203,160,0.15)' }}
            >
              <svg
                className="w-4 h-4 text-[#3ECBA0]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#3ECBA0] text-xs font-bold mb-0.5">Demo Admin Credentials</p>
              <p className="text-white/70 text-xs font-mono">
                {DEMO_EMAIL} · {DEMO_PASSWORD}
              </p>
              <p className="text-white/30 text-xs mt-1 group-hover:text-white/50 transition-colors">
                Click to auto-fill credentials
              </p>
            </div>
          </button>

          {/* Error */}
          {error && (
            <div
              className="mb-5 p-4 rounded-xl flex items-start gap-3"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <svg
                className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0"
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
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@makanan.app"
                required
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(62,203,160,0.5)';
                  e.target.style.background = 'rgba(255,255,255,0.07)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.target.style.background = 'rgba(255,255,255,0.05)';
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none transition-all pr-12"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(62,203,160,0.5)';
                    e.target.style.background = 'rgba(255,255,255,0.07)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.target.style.background = 'rgba(255,255,255,0.05)';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{
                background: loading
                  ? 'rgba(62,203,160,0.3)'
                  : 'linear-gradient(135deg, #3ECBA0 0%, #2db88d 100%)',
                color: loading ? 'rgba(255,255,255,0.5)' : '#0a1628',
                boxShadow: loading ? 'none' : '0 8px 24px rgba(62,203,160,0.3)',
              }}
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
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  Login as Admin
                </span>
              )}
            </button>
          </form>

          {/* Footer links */}
          <div
            className="mt-6 pt-6 flex items-center justify-between"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <a
              href="/login"
              className="text-xs text-white/30 hover:text-white/50 transition-colors"
            >
              ← Student Portal
            </a>
            <a
              href="/partner-portal/login"
              className="text-xs text-white/30 hover:text-white/50 transition-colors"
            >
              Partner Portal →
            </a>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">© 2026 Makanan · Admin Portal v1.0</p>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

type Step = 1 | 2 | 3;

interface FormData {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  location: string;
  address: string;
  openingTime: string;
  closingTime: string;
  operatingDays: string[];
  description: string;
  cuisineTypes: string[];
  seatingCapacity: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const CUISINE_OPTIONS = [
  'Malaysian',
  'Chinese',
  'Indian',
  'Western',
  'Japanese',
  'Korean',
  'Thai',
  'Indonesian',
  'Vegetarian',
  'Halal',
  'Fast Food',
  'Desserts & Drinks',
];

const initialForm: FormData = {
  businessName: '',
  ownerName: '',
  email: '',
  phone: '',
  password: '',
  location: '',
  address: '',
  openingTime: '07:00',
  closingTime: '22:00',
  operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  description: '',
  cuisineTypes: [],
  seatingCapacity: '',
};

export default function PartnerApplyPage() {
  const supabase = createClient();
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleDay = (day: string) => {
    setForm((prev) => ({
      ...prev,
      operatingDays: prev.operatingDays.includes(day)
        ? prev.operatingDays.filter((d) => d !== day)
        : [...prev.operatingDays, day],
    }));
  };

  const toggleCuisine = (cuisine: string) => {
    setForm((prev) => ({
      ...prev,
      cuisineTypes: prev.cuisineTypes.includes(cuisine)
        ? prev.cuisineTypes.filter((c) => c !== cuisine)
        : [...prev.cuisineTypes, cuisine],
    }));
  };

  const validateStep = (): boolean => {
    setError('');
    if (step === 1) {
      if (!form.businessName.trim()) {
        setError('Business name is required.');
        return false;
      }
      if (!form.ownerName.trim()) {
        setError('Owner name is required.');
        return false;
      }
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) {
        setError('A valid email address is required.');
        return false;
      }
      if (!form.phone.trim()) {
        setError('Phone number is required.');
        return false;
      }
      if (!form.password || form.password.length < 8) {
        setError('Password must be at least 8 characters.');
        return false;
      }
    }
    if (step === 2) {
      if (!form.location.trim()) {
        setError('Location / outlet name is required.');
        return false;
      }
      if (form.operatingDays.length === 0) {
        setError('Please select at least one operating day.');
        return false;
      }
    }
    if (step === 3) {
      if (!form.description.trim() || form.description.trim().length < 30) {
        setError('Please provide a description of at least 30 characters.');
        return false;
      }
      if (form.cuisineTypes.length === 0) {
        setError('Please select at least one cuisine type.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) setStep((s) => (s < 3 ? ((s + 1) as Step) : s));
  };

  const handleBack = () => {
    setError('');
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    setError('');

    try {
      // Step 1: Create auth user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          data: {
            full_name: form.ownerName.trim(),
            role: 'partner',
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error('Account creation failed. Please try again.');

      const userId = signUpData.user.id;

      // Step 2: Insert partner record linked to the new auth user
      const { error: partnerError } = await supabase.from('partners').insert({
        user_id: userId,
        name: form.businessName.trim(),
        location: form.location.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        description: form.description.trim(),
        is_active: true,
      });

      if (partnerError) throw partnerError;

      // Step 3: Also store full application details for records
      await supabase.from('partner_applications').insert({
        business_name: form.businessName.trim(),
        owner_name: form.ownerName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        location: form.location.trim(),
        address: form.address.trim() || null,
        opening_time: form.openingTime,
        closing_time: form.closingTime,
        operating_days: form.operatingDays,
        description: form.description.trim(),
        cuisine_types: form.cuisineTypes,
        seating_capacity: form.seatingCapacity ? parseInt(form.seatingCapacity, 10) : null,
        status: 'approved',
      });

      // Step 4: Sign in the new partner
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (signInError) throw signInError;

      // Step 5: Redirect to partner dashboard
      router.push('/partner-portal/dashboard');
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Application Form ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Left Panel */}
      <div
        className="hidden lg:flex lg:w-[42%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(145deg, #0d2b22 0%, #1a3a2e 40%, #0f2027 100%)' }}
      >
        <div
          className="absolute top-[-80px] right-[-80px] w-[320px] h-[320px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #3ECBA0 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-[-60px] left-[-60px] w-[260px] h-[260px] rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, #3ECBA0 0%, transparent 70%)' }}
        />

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
              Join our
              <br />
              <span style={{ color: '#3ECBA0' }}>food network</span>
              <br />
              today.
            </h2>
            <p className="text-white/60 text-base leading-relaxed max-w-sm">
              Partner with Makanan to reach hundreds of students daily. Manage your outlet, track
              orders, and grow your revenue — all in one place.
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            {[
              {
                icon: '🏪',
                title: 'Easy Onboarding',
                desc: 'Set up your outlet profile in minutes',
              },
              {
                icon: '📊',
                title: 'Real-time Analytics',
                desc: 'Track redemptions and earnings daily',
              },
              {
                icon: '💳',
                title: 'Guaranteed Payments',
                desc: 'Bi-weekly settlements, no delays',
              },
              {
                icon: '🎓',
                title: 'Campus Reach',
                desc: 'Access to 800+ active student subscribers',
              },
            ].map((b) => (
              <div key={b.title} className="flex items-start gap-3">
                <span className="text-xl">{b.icon}</span>
                <div>
                  <p className="text-white text-sm font-semibold">{b.title}</p>
                  <p className="text-white/50 text-xs">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/30 text-xs relative z-10">© 2026 Makanan. Partner Portal v1.0</p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-start justify-center p-6 bg-[#F8FAF9] overflow-y-auto">
        <div className="w-full max-w-[520px] py-8">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-6">
            <Image
              src="/assets/images/makanan-app-icon-removebg-preview-1787356761493.png"
              alt="Makanan"
              width={32}
              height={32}
              className="object-contain"
            />
            <span className="text-[#1a3028] font-bold text-lg">Makanan</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#3ECBA0]/15 text-[#3ECBA0]">
              Partner
            </span>
          </div>

          {/* Header */}
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-[#111827] mb-1">Partner Application</h1>
            <p className="text-[#6B7280] text-sm">
              Fill in your business details to create your partner account.
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-8">
            {([1, 2, 3] as Step[]).map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                    step === s
                      ? 'bg-[#3ECBA0] text-white shadow-md shadow-[#3ECBA0]/30'
                      : step > s
                        ? 'bg-[#3ECBA0]/20 text-[#3ECBA0]'
                        : 'bg-[#E5E7EB] text-[#9CA3AF]'
                  }`}
                >
                  {step > s ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    s
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={`text-xs font-semibold ${step >= s ? 'text-[#374151]' : 'text-[#9CA3AF]'}`}
                  >
                    {s === 1 ? 'Business Info' : s === 2 ? 'Operations' : 'About & Cuisine'}
                  </p>
                </div>
                {s < 3 && (
                  <div
                    className={`h-px flex-1 max-w-[24px] ${step > s ? 'bg-[#3ECBA0]' : 'bg-[#E5E7EB]'}`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
              <svg
                className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0"
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
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* ── Step 1: Business Info ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">
                    Cafeteria / Restaurant Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.businessName}
                    onChange={(e) => updateField('businessName', e.target.value)}
                    placeholder="e.g. Warung Pak Ali"
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#111827] text-sm placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/30 focus:border-[#3ECBA0] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">
                    Owner / Manager Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.ownerName}
                    onChange={(e) => updateField('ownerName', e.target.value)}
                    placeholder="Full name"
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#111827] text-sm placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/30 focus:border-[#3ECBA0] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="+60 12-345 6789"
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#111827] text-sm placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/30 focus:border-[#3ECBA0] transition-all"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">
                    Business Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="business@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#111827] text-sm placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/30 focus:border-[#3ECBA0] transition-all"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">
                    Create Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#111827] text-sm placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/30 focus:border-[#3ECBA0] transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
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
                  <p className="text-xs text-[#9CA3AF] mt-1.5">
                    You will use this password to sign in to your partner dashboard.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Operations ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">
                  Outlet Location / Block <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="e.g. Block A Cafeteria, Ground Floor"
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#111827] text-sm placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/30 focus:border-[#3ECBA0] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">
                  Full Address
                </label>
                <textarea
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="Street address, city, postcode..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#111827] text-sm placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/30 focus:border-[#3ECBA0] transition-all resize-none"
                />
              </div>

              {/* Operating Hours */}
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">
                  Operating Hours
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#9CA3AF] mb-1">Opening Time</label>
                    <input
                      type="time"
                      value={form.openingTime}
                      onChange={(e) => updateField('openingTime', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/30 focus:border-[#3ECBA0] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#9CA3AF] mb-1">Closing Time</label>
                    <input
                      type="time"
                      value={form.closingTime}
                      onChange={(e) => updateField('closingTime', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/30 focus:border-[#3ECBA0] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Operating Days */}
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">
                  Operating Days <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => {
                    const active = form.operatingDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          active
                            ? 'bg-[#3ECBA0] border-[#3ECBA0] text-white'
                            : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:border-[#3ECBA0]/50'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Seating Capacity */}
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">
                  Seating Capacity (optional)
                </label>
                <input
                  type="number"
                  value={form.seatingCapacity}
                  onChange={(e) => updateField('seatingCapacity', e.target.value)}
                  placeholder="e.g. 50"
                  min="1"
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#111827] text-sm placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/30 focus:border-[#3ECBA0] transition-all"
                />
              </div>
            </div>
          )}

          {/* ── Step 3: About & Cuisine ── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">
                  About Your Business <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Tell us about your cafeteria or restaurant — what makes it special, your signature dishes, your commitment to quality, etc."
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#111827] text-sm placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/30 focus:border-[#3ECBA0] transition-all resize-none"
                />
                <p className="text-xs text-[#9CA3AF] mt-1.5">
                  {form.description.length} / 30 characters minimum
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">
                  Cuisine Types <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-[#9CA3AF] mb-3">Select all that apply to your menu.</p>
                <div className="flex flex-wrap gap-2">
                  {CUISINE_OPTIONS.map((cuisine) => {
                    const active = form.cuisineTypes.includes(cuisine);
                    return (
                      <button
                        key={cuisine}
                        type="button"
                        onClick={() => toggleCuisine(cuisine)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          active
                            ? 'bg-[#3ECBA0] border-[#3ECBA0] text-white'
                            : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:border-[#3ECBA0]/50'
                        }`}
                      >
                        {cuisine}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Summary card */}
              <div className="bg-[#F0FBF7] rounded-2xl border border-[#3ECBA0]/20 p-4">
                <p className="text-xs font-semibold text-[#3ECBA0] uppercase tracking-wide mb-3">
                  Application Summary
                </p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Business</span>
                    <span className="font-medium text-[#111827] text-right max-w-[60%] truncate">
                      {form.businessName || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Owner</span>
                    <span className="font-medium text-[#111827]">{form.ownerName || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Email</span>
                    <span className="font-medium text-[#111827] text-right max-w-[60%] truncate">
                      {form.email || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Location</span>
                    <span className="font-medium text-[#111827] text-right max-w-[60%] truncate">
                      {form.location || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Hours</span>
                    <span className="font-medium text-[#111827]">
                      {form.openingTime} – {form.closingTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Days</span>
                    <span className="font-medium text-[#111827] text-right max-w-[60%]">
                      {form.operatingDays.map((d) => d.slice(0, 3)).join(', ') || '—'}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#9CA3AF] leading-relaxed">
                By submitting this application, you confirm that all information provided is
                accurate and that you agree to Makanan's partner terms and conditions. Your account
                will be created immediately upon submission.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#E5E7EB]">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#E5E7EB] text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] transition-all"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back
              </button>
            ) : (
              <Link
                href="/partner-portal/login"
                className="flex items-center gap-2 text-sm text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Login
              </Link>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #3ECBA0 0%, #2db88d 100%)' }}
              >
                Continue
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: loading
                    ? '#9CA3AF'
                    : 'linear-gradient(135deg, #3ECBA0 0%, #2db88d 100%)',
                }}
              >
                {loading ? (
                  <>
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
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Partner Account
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Sign in link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[#6B7280]">
              Already a partner?{' '}
              <Link
                href="/partner-portal/login"
                className="text-[#3ECBA0] font-semibold hover:text-[#2db88d]"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

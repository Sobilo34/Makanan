'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface MealPlan {
  id: string;
  name: string;
  tier: string;
  price_myr: number;
  credits: number;
  effective_rate: number;
  description: string;
}

interface Subscription {
  id: string;
  meal_plan_id: string;
  status: string;
  credits_total: number;
  credits_used: number;
  expires_at: string;
  meal_plans: { name: string; tier: string; price_myr: number };
}

const planMeta: Record<string, { badge?: string; highlight?: boolean; tagline: string; perMeal: (price: number, credits: number) => string }> = {
  default: {
    tagline: 'Flexible meals for your schedule',
    perMeal: (price, credits) => `RM${(price / credits).toFixed(2)} per meal`,
  },
};

const planDetails = [
  { tagline: 'Start light, eat right', badge: null, highlight: false },
  { tagline: 'Best value for daily eaters', badge: 'Most Popular', highlight: true },
  { tagline: 'Balanced coverage all month', badge: null, highlight: false },
  { tagline: 'Full month, every meal', badge: null, highlight: false },
  { tagline: 'Consistent routine, max savings', badge: null, highlight: false },
  { tagline: 'Daily eater, premium rate', badge: 'Best Rate', highlight: false },
  { tagline: 'Ultimate flexibility & value', badge: null, highlight: false },
];

const steps = [
  { num: '01', title: 'Pick a plan', desc: 'Choose the meal count that fits your appetite and budget.' },
  { num: '02', title: 'Pay securely', desc: 'Card, FPX bank transfer, or GrabPay — all encrypted.' },
  { num: '03', title: 'Credits loaded', desc: 'Meal credits appear in your wallet instantly.' },
  { num: '04', title: 'Scan & eat', desc: 'Show your QR code at any partner restaurant.' },
];

const paymentIcons = [
  { label: 'Visa / Mastercard', sub: 'Credit & debit cards', color: 'bg-[#1A1F71]/8 text-[#1A1F71]', icon: (
    <svg viewBox="0 0 38 24" className="w-8 h-5" fill="none">
      <rect width="38" height="24" rx="4" fill="#1A1F71" opacity="0.08"/>
      <text x="4" y="17" fontSize="11" fontWeight="700" fill="#1A1F71" fontFamily="sans-serif">VISA</text>
    </svg>
  )},
  { label: 'FPX Banking', sub: 'Maybank, CIMB, RHB & more', color: 'bg-[#E8F5E9] text-[#2E7D32]', icon: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
    </svg>
  )},
  { label: 'GrabPay', sub: 'GrabPay e-wallet', color: 'bg-[#00B14F]/10 text-[#00B14F]', icon: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <circle cx="12" cy="12" r="10" opacity="0.15"/>
      <circle cx="12" cy="12" r="5"/>
    </svg>
  )},
];

export default function PlansPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const supabase = createClient();
      try {
        const [plansRes, subRes] = await Promise.all([
          supabase.from('meal_plans').select('*').eq('is_active', true).order('price_myr'),
          supabase
            .from('subscriptions')
            .select('*, meal_plans(name, tier, price_myr)')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);
        setPlans(plansRes.data || []);
        setSubscription(subRes.data || null);
      } catch (err) {
        console.log('Plans fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleContinue = () => {
    if (!selectedPlan) return;
    router.push(
      `/dashboard/payment?planId=${selectedPlan.id}&price=${selectedPlan.price_myr}&credits=${selectedPlan.credits}&name=${encodeURIComponent(selectedPlan.name)}`
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] p-5 lg:p-10">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-10 bg-gray-200 rounded-lg w-56 animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-32 lg:pb-10">

      {/* ── TOP HEADER ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-5 lg:px-10 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-gray-900 font-bold text-lg lg:text-xl leading-tight">Choose Your Plan</h1>
            <p className="text-gray-400 text-xs hidden sm:block">Flexible meal subscriptions · Cancel anytime</p>
          </div>
          {subscription && (
            <div className="hidden sm:flex items-center gap-2 bg-[#EBF9F4] border border-[#C8F0E4] rounded-xl px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-[#3ECBA0] flex-shrink-0" />
              <span className="text-[#2DAF87] text-xs font-semibold truncate max-w-[140px]">
                Active: {subscription.meal_plans?.name}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 lg:px-10 pt-6 lg:pt-8">

        {/* ── DESKTOP LAYOUT: 3-col (plans wide + sidebar) ── */}
        <div className="hidden lg:grid lg:grid-cols-[1fr_300px] gap-8">

          {/* LEFT: Plans */}
          <div className="space-y-6">

            {/* Active plan notice */}
            {subscription && (
              <div className="flex items-center gap-3 bg-[#EBF9F4] border border-[#C8F0E4] rounded-2xl px-5 py-3.5">
                <svg className="w-5 h-5 text-[#3ECBA0] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-[#2DAF87] text-sm font-medium">
                  You have an active <strong>{subscription.meal_plans?.name}</strong>. Selecting a new plan will replace it.
                </p>
              </div>
            )}

            {/* Section label */}
            <div>
              <p className="text-xs font-semibold text-[#3ECBA0] uppercase tracking-widest mb-1">Meal Plans</p>
              <h2 className="text-2xl font-bold text-gray-900">Select the right plan for you</h2>
            </div>

            {/* Plans grid — desktop: 3 cols then wraps */}
            <div className="grid grid-cols-3 gap-4">
              {plans.map((plan, idx) => {
                const meta = planDetails[idx] || planDetails[0];
                const isSelected = selectedPlan?.id === plan.id;
                const isCurrentPlan = subscription?.meal_plan_id === plan.id;
                const perMeal = (plan.price_myr / plan.credits).toFixed(2);

                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={`relative text-left rounded-2xl p-5 border-2 transition-all duration-200 group ${
                      isSelected
                        ? 'border-[#3ECBA0] bg-white shadow-lg shadow-[#3ECBA0]/10'
                        : meta.highlight
                        ? 'border-[#3ECBA0]/30 bg-white hover:border-[#3ECBA0]/60 hover:shadow-md'
                        : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                    }`}
                  >
                    {/* Badge */}
                    {meta.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-[#3ECBA0] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full whitespace-nowrap">
                          {meta.badge}
                        </span>
                      </div>
                    )}

                    {/* Selected check */}
                    {isSelected && (
                      <div className="absolute top-4 right-4 w-6 h-6 bg-[#3ECBA0] rounded-full flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}

                    {/* Current plan tag */}
                    {isCurrentPlan && !isSelected && (
                      <div className="absolute top-4 right-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF9F4] text-[#2DAF87] uppercase tracking-wide">Active</span>
                      </div>
                    )}

                    {/* Plan name */}
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{plan.name}</p>

                    {/* Price */}
                    <div className="mb-1">
                      <span className={`text-3xl font-black ${isSelected ? 'text-[#3ECBA0]' : 'text-gray-900'}`}>
                        RM{plan.price_myr}
                      </span>
                    </div>

                    {/* Meals */}
                    <p className="text-sm font-bold text-gray-700 mb-1">{plan.credits} meals</p>
                    <p className="text-xs text-gray-400 mb-4">RM{perMeal} / meal</p>

                    {/* Divider */}
                    <div className="border-t border-gray-100 pt-4 mb-4">
                      <p className="text-xs text-gray-500 leading-relaxed">{meta.tagline}</p>
                    </div>

                    {/* CTA */}
                    <div className={`w-full py-2.5 rounded-xl text-sm font-bold text-center transition-all ${
                      isSelected
                        ? 'bg-[#3ECBA0] text-white'
                        : 'border border-gray-200 text-gray-600 group-hover:border-[#3ECBA0] group-hover:text-[#3ECBA0]'
                    }`}>
                      {isSelected ? 'Selected' : 'Select Plan'}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Trust bar */}
            <div className="flex items-center gap-6 py-4 border-t border-gray-100">
              {['Quality-assured meals', 'Trusted partner network', 'Instant credit loading', 'Cancel anytime'].map((f) => (
                <div key={f} className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[#3ECBA0] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-500 text-xs">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-5">

            {/* How it works */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">How it works</p>
              <div className="space-y-4">
                {steps.map((s) => (
                  <div key={s.num} className="flex gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#EBF9F4] flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-black text-[#3ECBA0]">{s.num}</span>
                    </div>
                    <div>
                      <p className="text-gray-800 font-semibold text-xs">{s.title}</p>
                      <p className="text-gray-400 text-xs leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment methods */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Secure Payments</p>
              </div>
              <div className="space-y-2.5">
                {paymentIcons.map((pm) => (
                  <div key={pm.label} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${pm.color}`}>
                    <div className="flex-shrink-0">{pm.icon}</div>
                    <div>
                      <p className="font-semibold text-xs">{pm.label}</p>
                      <p className="text-xs opacity-70">{pm.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-gray-400 text-[10px] mt-3 leading-relaxed">
                FPX: Maybank, CIMB, RHB, Public Bank, Hong Leong, AmBank, Bank Islam &amp; more
              </p>
            </div>

            {/* CTA — desktop */}
            <div className="bg-gray-900 rounded-2xl p-5">
              <p className="text-white font-bold text-sm mb-1">
                {selectedPlan ? selectedPlan.name : 'No plan selected'}
              </p>
              {selectedPlan ? (
                <>
                  <p className="text-gray-400 text-xs mb-4">
                    RM{selectedPlan.price_myr} · {selectedPlan.credits} meals · RM{(selectedPlan.price_myr / selectedPlan.credits).toFixed(2)}/meal
                  </p>
                  <button
                    onClick={handleContinue}
                    className="w-full bg-[#3ECBA0] text-white font-bold py-3 rounded-xl hover:bg-[#2DAF87] transition-colors text-sm"
                  >
                    Continue to Payment
                  </button>
                </>
              ) : (
                <p className="text-gray-500 text-xs mb-4">Select a plan from the grid to continue.</p>
              )}
              <p className="text-gray-600 text-[10px] text-center mt-3">Secured by Stripe · 256-bit SSL</p>
            </div>
          </div>
        </div>

        {/* ── TABLET LAYOUT (md only) ── */}
        <div className="hidden md:block lg:hidden space-y-6">

          {subscription && (
            <div className="flex items-center gap-3 bg-[#EBF9F4] border border-[#C8F0E4] rounded-2xl px-5 py-3">
              <span className="w-2 h-2 rounded-full bg-[#3ECBA0] flex-shrink-0" />
              <p className="text-[#2DAF87] text-sm font-medium">
                Active plan: <strong>{subscription.meal_plans?.name}</strong> — selecting a new plan will replace it
              </p>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-[#3ECBA0] uppercase tracking-widest mb-1">Meal Plans</p>
            <h2 className="text-2xl font-bold text-gray-900">Select the right plan for you</h2>
          </div>

          {/* Payment methods row */}
          <div className="grid grid-cols-3 gap-3">
            {paymentIcons.map((pm) => (
              <div key={pm.label} className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 border border-gray-100 bg-white`}>
                <div className="flex-shrink-0 text-gray-500">{pm.icon}</div>
                <div>
                  <p className="font-semibold text-xs text-gray-800">{pm.label}</p>
                  <p className="text-[10px] text-gray-400">{pm.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Plans: 2-col grid */}
          <div className="grid grid-cols-2 gap-4">
            {plans.map((plan, idx) => {
              const meta = planDetails[idx] || planDetails[0];
              const isSelected = selectedPlan?.id === plan.id;
              const isCurrentPlan = subscription?.meal_plan_id === plan.id;
              const perMeal = (plan.price_myr / plan.credits).toFixed(2);

              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`relative text-left rounded-2xl p-5 border-2 transition-all duration-200 ${
                    isSelected
                      ? 'border-[#3ECBA0] bg-white shadow-lg shadow-[#3ECBA0]/10'
                      : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                  }`}
                >
                  {meta.badge && (
                    <span className="inline-block mb-3 bg-[#3ECBA0] text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                      {meta.badge}
                    </span>
                  )}
                  {isCurrentPlan && !isSelected && (
                    <span className="absolute top-4 right-4 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#EBF9F4] text-[#2DAF87] uppercase">Active</span>
                  )}
                  {isSelected && (
                    <div className="absolute top-4 right-4 w-5 h-5 bg-[#3ECBA0] rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">{plan.name}</p>
                  <p className={`text-2xl font-black mb-0.5 ${isSelected ? 'text-[#3ECBA0]' : 'text-gray-900'}`}>RM{plan.price_myr}</p>
                  <p className="text-sm font-bold text-gray-700">{plan.credits} meals</p>
                  <p className="text-xs text-gray-400 mb-3">RM{perMeal} / meal</p>
                  <div className={`w-full py-2 rounded-xl text-xs font-bold text-center ${
                    isSelected ? 'bg-[#3ECBA0] text-white' : 'border border-gray-200 text-gray-500'
                  }`}>
                    {isSelected ? 'Selected' : 'Select'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* How it works — horizontal */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">How it works</p>
            <div className="grid grid-cols-4 gap-4">
              {steps.map((s) => (
                <div key={s.num} className="text-center">
                  <div className="w-8 h-8 rounded-xl bg-[#EBF9F4] flex items-center justify-center mx-auto mb-2">
                    <span className="text-[10px] font-black text-[#3ECBA0]">{s.num}</span>
                  </div>
                  <p className="text-gray-800 font-semibold text-xs mb-0.5">{s.title}</p>
                  <p className="text-gray-400 text-[10px] leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── MOBILE LAYOUT ── */}
        <div className="md:hidden space-y-5">

          {subscription && (
            <div className="flex items-center gap-2.5 bg-[#EBF9F4] border border-[#C8F0E4] rounded-xl px-4 py-3">
              <span className="w-2 h-2 rounded-full bg-[#3ECBA0] flex-shrink-0" />
              <p className="text-[#2DAF87] text-xs font-medium">
                Active: <strong>{subscription.meal_plans?.name}</strong>
              </p>
            </div>
          )}

          {/* Payment methods — compact horizontal scroll */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Secure Payments</p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {paymentIcons.map((pm) => (
                <div key={pm.label} className="flex-shrink-0 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                  <div className="text-gray-500 flex-shrink-0">{pm.icon}</div>
                  <p className="text-xs font-semibold text-gray-700 whitespace-nowrap">{pm.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Plans — single column cards */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Choose a plan</p>
            <div className="space-y-3">
              {plans.map((plan, idx) => {
                const meta = planDetails[idx] || planDetails[0];
                const isSelected = selectedPlan?.id === plan.id;
                const isCurrentPlan = subscription?.meal_plan_id === plan.id;
                const perMeal = (plan.price_myr / plan.credits).toFixed(2);

                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={`w-full text-left rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
                      isSelected
                        ? 'border-[#3ECBA0] shadow-md shadow-[#3ECBA0]/10'
                        : 'border-gray-100 bg-white'
                    }`}
                  >
                    <div className={`flex items-center justify-between px-4 py-4 ${isSelected ? 'bg-white' : 'bg-white'}`}>
                      {/* Left */}
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-[#3ECBA0]' : 'bg-gray-100'
                        }`}>
                          {isSelected ? (
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-gray-900 font-bold text-sm">{plan.name}</p>
                            {meta.badge && (
                              <span className="bg-[#3ECBA0] text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
                                {meta.badge}
                              </span>
                            )}
                            {isCurrentPlan && !isSelected && (
                              <span className="bg-[#EBF9F4] text-[#2DAF87] text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 text-xs">{plan.credits} meals · RM{perMeal}/meal</p>
                        </div>
                      </div>

                      {/* Right */}
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className={`text-xl font-black ${isSelected ? 'text-[#3ECBA0]' : 'text-gray-900'}`}>
                          RM{plan.price_myr}
                        </p>
                        <p className="text-gray-400 text-[10px]">/ month</p>
                      </div>
                    </div>

                    {/* Expanded detail when selected */}
                    {isSelected && (
                      <div className="px-4 pb-4 border-t border-[#3ECBA0]/10 pt-3">
                        <p className="text-gray-500 text-xs">{meta.tagline}</p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Trust signals */}
          <div className="grid grid-cols-2 gap-2">
            {['Quality-assured meals', 'Instant credit loading', 'Trusted partners', 'Cancel anytime'].map((f) => (
              <div key={f} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 border border-gray-100">
                <svg className="w-3.5 h-3.5 text-[#3ECBA0] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-600 text-xs">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── STICKY BOTTOM CTA (mobile + tablet) ── */}
      <div
        className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-20"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
      >
        {/* Selected plan summary strip */}
        {selectedPlan && (
          <div className="flex items-center justify-between px-5 pt-3 pb-1">
            <div>
              <p className="text-gray-900 font-bold text-sm">{selectedPlan.name}</p>
              <p className="text-gray-400 text-xs">{selectedPlan.credits} meals · RM{(selectedPlan.price_myr / selectedPlan.credits).toFixed(2)}/meal</p>
            </div>
            <p className="text-[#3ECBA0] font-black text-xl">RM{selectedPlan.price_myr}</p>
          </div>
        )}
        <div className="px-5 pt-2">
          <button
            onClick={handleContinue}
            disabled={!selectedPlan}
            className="w-full bg-[#3ECBA0] text-white font-bold py-4 rounded-2xl hover:bg-[#2DAF87] transition-colors disabled:opacity-30 text-sm tracking-wide"
          >
            {selectedPlan ? 'Continue to Payment' : 'Select a Plan to Continue'}
          </button>
          <p className="text-center text-gray-400 text-[10px] mt-2 pb-1">
            Secured by Stripe · 256-bit SSL encryption
          </p>
        </div>
      </div>
    </div>
  );
}

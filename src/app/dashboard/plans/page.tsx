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

const planMeta = [
  { tagline: 'Perfect for light eaters', badge: null, highlight: false, color: '#6B7280' },
  { tagline: 'Great for daily campus meals', badge: 'Popular', highlight: true, color: '#3ECBA0' },
  { tagline: 'Balanced for the whole month', badge: null, highlight: false, color: '#6B7280' },
  { tagline: 'Full coverage, every meal', badge: null, highlight: false, color: '#6B7280' },
  { tagline: 'Consistent routine, max savings', badge: null, highlight: false, color: '#6B7280' },
  { tagline: 'Daily eater, premium rate', badge: 'Best Rate', highlight: false, color: '#4F46E5' },
  { tagline: 'Ultimate flexibility & value', badge: null, highlight: false, color: '#6B7280' },
];

const steps = [
  { num: '01', title: 'Pick a plan', desc: 'Choose the meal count that fits your schedule.' },
  { num: '02', title: 'Pay securely', desc: 'Card, FPX, or GrabPay — all via Stripe.' },
  { num: '03', title: 'Credits loaded', desc: 'Meal credits appear in your wallet instantly.' },
  { num: '04', title: 'Scan & eat', desc: 'Show your QR at any partner restaurant.' },
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
          supabase.from('subscriptions').select('*, meal_plans(name, tier, price_myr)').eq('user_id', user.id).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle(),
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
    router.push(`/dashboard/payment?planId=${selectedPlan.id}&price=${selectedPlan.price_myr}&credits=${selectedPlan.credits}&name=${encodeURIComponent(selectedPlan.name)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] p-6 lg:p-10">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-10 bg-gray-200 rounded-xl w-56 animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-52 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-32 lg:pb-10" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
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
            <h1 className="text-[#111827] font-bold text-lg lg:text-xl">Choose Your Meal Plan</h1>
            <p className="text-[#9CA3AF] text-xs hidden sm:block">Flexible credits · No expiry · Cancel anytime</p>
          </div>
          {subscription && (
            <div className="hidden sm:flex items-center gap-2 bg-[#EBF9F4] border border-[#C8F0E4] rounded-xl px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-[#3ECBA0]" />
              <span className="text-[#2DAF87] text-xs font-semibold">Active: {subscription.meal_plans?.name}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 lg:px-10 pt-6 lg:pt-8">
        <div className="lg:grid lg:grid-cols-[1fr_280px] gap-8">
          {/* LEFT: Plans */}
          <div className="space-y-6">
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

            <div>
              <p className="text-xs font-bold text-[#3ECBA0] uppercase tracking-widest mb-1">Meal Plans</p>
              <h2 className="text-2xl font-bold text-[#111827]">Select the right plan for you</h2>
            </div>

            {/* Plans grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan, idx) => {
                const meta = planMeta[idx] || planMeta[0];
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
                        : meta.highlight
                        ? 'border-[#3ECBA0]/30 bg-white hover:border-[#3ECBA0]/60 hover:shadow-md'
                        : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                    }`}
                  >
                    {/* Badge */}
                    {meta.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className={`text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full whitespace-nowrap ${meta.badge === 'Best Rate' ? 'bg-[#4F46E5]' : 'bg-[#3ECBA0]'}`}>
                          {meta.badge}
                        </span>
                      </div>
                    )}

                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="absolute top-4 right-4 w-6 h-6 bg-[#3ECBA0] rounded-full flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}

                    {isCurrentPlan && !isSelected && (
                      <div className="absolute top-4 right-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF9F4] text-[#2DAF87] uppercase tracking-wide">Active</span>
                      </div>
                    )}

                    <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest mb-3">{plan.name}</p>
                    <div className="mb-1">
                      <span className={`text-3xl font-black ${isSelected ? 'text-[#3ECBA0]' : 'text-[#111827]'}`}>RM{plan.price_myr}</span>
                    </div>
                    <p className="text-sm font-bold text-[#374151] mb-0.5">{plan.credits} meals</p>
                    <p className="text-xs text-[#9CA3AF] mb-4">RM{perMeal} per meal</p>
                    <div className="border-t border-gray-100 pt-3">
                      <p className="text-xs text-[#6B7280] leading-relaxed">{meta.tagline}</p>
                    </div>
                    <div className={`mt-3 w-full py-2.5 rounded-xl text-sm font-bold text-center transition-all ${
                      isSelected
                        ? 'bg-[#3ECBA0] text-white'
                        : 'bg-gray-50 text-[#6B7280] group-hover:bg-gray-100'
                    }`}>
                      {isSelected ? 'Selected' : 'Select Plan'}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* How it works — mobile */}
            <div className="lg:hidden bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest mb-4">How It Works</p>
              <div className="grid grid-cols-2 gap-3">
                {steps.map((step) => (
                  <div key={step.num} className="flex items-start gap-3">
                    <span className="text-xs font-black text-[#3ECBA0] flex-shrink-0 mt-0.5">{step.num}</span>
                    <div>
                      <p className="text-[#111827] font-semibold text-xs">{step.title}</p>
                      <p className="text-[#9CA3AF] text-xs mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Sidebar */}
          <div className="hidden lg:block space-y-4">
            {/* How it works */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest mb-4">How It Works</p>
              <div className="space-y-4">
                {steps.map((step, i) => (
                  <div key={step.num} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#EBF9F4] flex items-center justify-center flex-shrink-0">
                      <span className="text-[#3ECBA0] text-xs font-black">{step.num}</span>
                    </div>
                    <div>
                      <p className="text-[#111827] font-semibold text-sm">{step.title}</p>
                      <p className="text-[#9CA3AF] text-xs mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment methods */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest mb-3">Accepted Payments</p>
              <div className="space-y-2">
                {[
                  { label: 'Visa / Mastercard', sub: 'Credit & debit cards' },
                  { label: 'FPX Banking', sub: 'Maybank, CIMB, RHB & more' },
                  { label: 'GrabPay', sub: 'GrabPay e-wallet' },
                ].map(({ label, sub }) => (
                  <div key={label} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-[#3ECBA0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[#111827] font-semibold text-xs">{label}</p>
                      <p className="text-[#9CA3AF] text-xs">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            {selectedPlan && (
              <div className="bg-gradient-to-br from-[#1a3028] to-[#0d2b22] rounded-2xl p-5">
                <p className="text-[#3ECBA0] text-xs font-bold uppercase tracking-widest mb-2">Selected Plan</p>
                <p className="text-white font-bold text-lg mb-0.5">{selectedPlan.name}</p>
                <p className="text-white/50 text-sm mb-4">{selectedPlan.credits} meals · RM{(selectedPlan.price_myr / selectedPlan.credits).toFixed(2)}/meal</p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white/60 text-sm">Total</span>
                  <span className="text-[#3ECBA0] font-black text-2xl">RM{selectedPlan.price_myr}</span>
                </div>
                <button
                  onClick={handleContinue}
                  className="w-full bg-[#3ECBA0] text-white font-bold py-3.5 rounded-xl hover:bg-[#2DAF87] transition-colors text-sm"
                >
                  Continue to Payment →
                </button>
              </div>
            )}

            {!selectedPlan && (
              <div className="bg-gray-50 border border-gray-200 border-dashed rounded-2xl p-5 text-center">
                <p className="text-[#9CA3AF] text-sm">Select a plan to continue</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      {selectedPlan && (
        <div
          className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 px-5 py-4 z-20 shadow-lg"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[#111827] font-bold text-sm">{selectedPlan.name}</p>
              <p className="text-[#9CA3AF] text-xs">{selectedPlan.credits} meals</p>
            </div>
            <p className="text-[#3ECBA0] font-black text-xl">RM{selectedPlan.price_myr}</p>
          </div>
          <button
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-[#3ECBA0] to-[#1a9e7a] text-white font-bold py-4 rounded-2xl text-base shadow-md"
          >
            Continue to Payment →
          </button>
        </div>
      )}
    </div>
  );
}

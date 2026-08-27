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

const featureIcons = ['🌱', '🎁', '⭐', '🏅', '❤️', '👑', '💎'];
const featureTexts = [
  'Great entry point for occasional eaters',
  'Best value for regular eaters',
  'Great balance of value and flexibility',
  'More meals for bigger appetite',
  'Perfect for consistent routines',
  'Max value for daily eaters',
  'Premium choice for your routine',
];

const paymentMethods = [
  {
    label: 'Cards',
    icons: ['💳'],
    desc: 'Visa, Mastercard, Amex',
    color: 'bg-blue-50 text-blue-700 border-blue-100',
  },
  {
    label: 'FPX',
    icons: ['🏦'],
    desc: 'All Malaysian banks',
    color: 'bg-green-50 text-green-700 border-green-100',
  },
  {
    label: 'GrabPay',
    icons: ['🟢'],
    desc: 'GrabPay e-wallet',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
];

export default function PlansPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);
  const [error, setError] = useState('');

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
      <div className="p-6 lg:p-8 space-y-4">
        <div className="h-8 bg-gray-100 rounded-xl w-48 animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-52 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F5F7F5] pb-32">
      {/* Header */}
      <div className="px-5 lg:px-8 pt-6 lg:pt-8 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <button
                onClick={() => router.back()}
                className="w-9 h-9 bg-white rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4 text-[#374151]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-[#1A1A1A] font-bold text-2xl lg:text-3xl">Choose Your Plan</h1>
            </div>
            <p className="text-[#6B7280] text-sm ml-12">Pick the plan that works best for your routine.</p>
          </div>
          <div className="hidden sm:flex w-20 h-20 bg-[#EBF9F4] rounded-full items-center justify-center flex-shrink-0 ml-4">
            <span className="text-4xl">🍲</span>
          </div>
        </div>
      </div>

      <div className="px-5 lg:px-8">
        {/* Payment methods banner */}
        <div className="mb-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-[#1A1A1A] font-bold text-sm mb-3 flex items-center gap-2">
            <span>🔒</span> Secure Payment Methods
          </p>
          <div className="grid grid-cols-3 gap-2">
            {paymentMethods.map((pm) => (
              <div key={pm.label} className={`rounded-xl border px-3 py-2 text-center ${pm.color}`}>
                <div className="text-lg mb-0.5">{pm.icons[0]}</div>
                <p className="font-bold text-xs">{pm.label}</p>
                <p className="text-xs opacity-75 leading-tight">{pm.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
            <span className="text-sm">🏦</span>
            <p className="text-[#6B7280] text-xs">
              FPX covers: Maybank, CIMB, RHB, Public Bank, Hong Leong, AmBank, Bank Islam &amp; more
            </p>
          </div>
        </div>

        {/* Active plan notice */}
        {subscription && (
          <div className="mb-5 bg-[#EBF9F4] border border-[#C8F0E4] rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-7 h-7 bg-[#3ECBA0] rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-[#2DAF87] font-semibold text-sm">Active: {subscription.meal_plans?.name}</p>
              <p className="text-[#2DAF87]/70 text-xs">Selecting a new plan will replace your current one</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-5 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Plans grid */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 gap-3 lg:gap-4">
              {plans.map((plan, idx) => {
                const isSelected = selectedPlan?.id === plan.id;
                const isCurrentPlan = subscription?.meal_plan_id === plan.id;
                const featureIcon = featureIcons[idx % featureIcons.length];
                const featureText = featureTexts[idx % featureTexts.length];

                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={`relative bg-white rounded-2xl p-4 text-left transition-all border-2 ${
                      isSelected
                        ? 'border-[#3ECBA0] shadow-lg shadow-[#3ECBA0]/10'
                        : 'border-gray-100 hover:border-[#3ECBA0]/40'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-7 h-7 bg-[#3ECBA0] rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    {isCurrentPlan && !isSelected && (
                      <div className="absolute top-3 right-3">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#EBF9F4] text-[#2DAF87]">Active</span>
                      </div>
                    )}
                    <p className={`font-bold text-2xl lg:text-3xl mb-0.5 ${isSelected ? 'text-[#3ECBA0]' : 'text-[#2DAF87]'}`}>
                      RM{plan.price_myr}
                    </p>
                    <p className="text-[#1A1A1A] font-semibold text-sm mb-3">{plan.credits} Meals</p>
                    <div className="border-t border-gray-100 pt-3 mb-3">
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 bg-[#EBF9F4] rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-base">{featureIcon}</span>
                        </div>
                        <p className="text-[#6B7280] text-xs leading-snug mt-1">{featureText}</p>
                      </div>
                    </div>
                    <div
                      className={`w-full py-2 rounded-xl text-sm font-semibold text-center transition-all ${
                        isSelected
                          ? 'bg-[#3ECBA0] text-white'
                          : 'border border-[#3ECBA0] text-[#3ECBA0] bg-white'
                      }`}
                    >
                      Select
                    </div>
                  </button>
                );
              })}
            </div>

            {/* All plans include */}
            <div className="mt-5 bg-[#EBF9F4] rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[#3ECBA0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-[#1A1A1A] font-bold text-sm">All plans include</p>
                <div className="flex items-center gap-3 mt-1">
                  {['Quality meals', 'Trusted partners', 'Hassle-free'].map((f) => (
                    <div key={f} className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-[#3ECBA0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-[#6B7280] text-xs">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right info panel — desktop */}
          <div className="hidden lg:flex flex-col gap-5">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="text-[#1A1A1A] font-bold text-sm mb-3">How it works</h3>
              <div className="space-y-3">
                {[
                  { icon: '📦', title: 'Choose a plan', desc: 'Select a package that fits your needs' },
                  { icon: '💳', title: 'Pay securely', desc: 'Card, FPX bank transfer, or GrabPay' },
                  { icon: '✨', title: 'Get credits', desc: 'Credits are instantly added to your wallet' },
                  { icon: '🍽️', title: 'Redeem meals', desc: 'Use QR code at partner restaurants' },
                ].map((step) => (
                  <div key={step.title} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-[#EBF9F4] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm">{step.icon}</span>
                    </div>
                    <div>
                      <p className="text-[#1A1A1A] font-semibold text-xs">{step.title}</p>
                      <p className="text-[#9CA3AF] text-xs">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="text-[#1A1A1A] font-bold text-sm mb-3">Payment Methods</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-xl">
                  <span className="text-lg">💳</span>
                  <div>
                    <p className="text-blue-700 font-semibold text-xs">Credit / Debit Cards</p>
                    <p className="text-blue-500 text-xs">Visa, Mastercard, Amex</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded-xl">
                  <span className="text-lg">🏦</span>
                  <div>
                    <p className="text-green-700 font-semibold text-xs">FPX Online Banking</p>
                    <p className="text-green-500 text-xs">All major Malaysian banks</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-xl">
                  <span className="text-lg">🟢</span>
                  <div>
                    <p className="text-emerald-700 font-semibold text-xs">GrabPay</p>
                    <p className="text-emerald-500 text-xs">GrabPay e-wallet</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky continue button */}
      <div
        className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 px-5 py-4 z-20"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
      >
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleContinue}
            disabled={!selectedPlan}
            className="w-full bg-[#3ECBA0] text-white font-bold py-4 rounded-2xl hover:bg-[#2DAF87] transition-colors disabled:opacity-40 text-base"
          >
            {selectedPlan
              ? `Continue — RM${selectedPlan.price_myr} for ${selectedPlan.credits} meals`
              : 'Select a Plan to Continue'}
          </button>
          <p className="text-center text-[#9CA3AF] text-xs mt-2">
            🔒 Secured by Stripe · Cards · FPX · GrabPay
          </p>
        </div>
      </div>
    </div>
  );
}

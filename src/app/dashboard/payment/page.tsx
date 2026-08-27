'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

const paymentMethods = [
  {
    id: 'card',
    label: 'Credit / Debit Card',
    desc: 'Visa, Mastercard, American Express',
    badge: null,
    accentColor: '#4F46E5',
    bgColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    selectedBg: '#EEF2FF',
    icon: (
      <svg viewBox="0 0 32 20" className="w-8 h-5" fill="none">
        <rect width="32" height="20" rx="3" fill="#1A1F71" opacity="0.08"/>
        <rect x="2" y="7" width="8" height="5" rx="1" fill="#FFD700"/>
        <rect x="2" y="7" width="4" height="5" rx="1" fill="#FF6B00"/>
      </svg>
    ),
  },
  {
    id: 'fpx',
    label: 'FPX Online Banking',
    desc: 'Maybank, CIMB, RHB, Public Bank & more',
    badge: 'Malaysian Banks',
    accentColor: '#059669',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    selectedBg: '#ECFDF5',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
      </svg>
    ),
  },
  {
    id: 'grabpay',
    label: 'GrabPay',
    desc: 'Pay with your GrabPay e-wallet balance',
    badge: 'e-Wallet',
    accentColor: '#00B14F',
    bgColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    selectedBg: '#F0FDF4',
    icon: (
      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#00B14F' }}>
        <span className="text-white font-black text-xs">G</span>
      </div>
    ),
  },
];

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const planId = searchParams.get('planId') || '';
  const price = searchParams.get('price') || '0';
  const credits = searchParams.get('credits') || '0';
  const planName = searchParams.get('name') || 'Meal Plan';

  const [selectedMethod, setSelectedMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    if (!user || !planId) return;
    setProcessing(true);
    setError('');

    try {
      const supabase = createClient();
      const appUrl = window.location.origin;

      const { data, error: fnErr } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          planId,
          planName,
          priceMyr: price,
          credits: parseInt(credits),
          userId: user.id,
          userEmail: user.email,
          successUrl: `${appUrl}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}&price=${price}&credits=${credits}&name=${encodeURIComponent(planName)}`,
          cancelUrl: `${appUrl}/dashboard/payment?planId=${planId}&price=${price}&credits=${credits}&name=${encodeURIComponent(planName)}`,
        },
      });

      if (fnErr) {
        const errMsg = (data as { error?: string } | null)?.error ?? fnErr.message ?? 'Payment setup failed';
        throw new Error(errMsg);
      }

      const result = data as { sessionId?: string; url?: string; error?: string } | null;
      if (result?.error) throw new Error(result.error);
      if (result?.url) {
        window.location.href = result.url;
      } else {
        throw new Error('No checkout URL returned from payment service');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Payment failed. Please try again.';
      console.error('Payment error:', err);
      setError(message);
      setProcessing(false);
    }
  };

  const selectedMethodData = paymentMethods.find((m) => m.id === selectedMethod);
  const perMeal = (parseFloat(price) / parseInt(credits)).toFixed(2);

  return (
    <div className="min-h-full bg-[#F0F2F5]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-lg mx-auto px-5 pt-6 pb-32 lg:pb-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 bg-white rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4 text-[#374151]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-[#111827] font-bold text-xl">Secure Checkout</h1>
            <p className="text-[#9CA3AF] text-xs mt-0.5">Powered by Stripe</p>
          </div>
          {/* Stripe badge */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm">
            <svg className="w-3 h-3 text-[#3ECBA0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-[10px] font-bold text-[#374151]">SSL</span>
          </div>
        </div>

        {/* Order summary card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
            <p className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-widest">Order Summary</p>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#3ECBA0] to-[#1a9e7a] rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <p className="text-[#111827] font-bold text-base">{planName}</p>
                  <p className="text-[#9CA3AF] text-xs">{credits} meal credits · RM{perMeal}/meal</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[#3ECBA0] font-black text-2xl">RM{price}</p>
                <p className="text-[#9CA3AF] text-xs">one-time</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-red-600 text-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Payment method */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
            <p className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-widest">Payment Method</p>
          </div>
          <div className="p-4 space-y-2.5">
            {paymentMethods.map((method) => {
              const isSelected = selectedMethod === method.id;
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? 'shadow-sm'
                      : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'
                  }`}
                  style={isSelected ? { borderColor: method.accentColor, background: method.selectedBg } : {}}
                >
                  <div className="flex-shrink-0">{method.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-[#111827]">{method.label}</p>
                      {method.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-[#6B7280]">
                          {method.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[#9CA3AF] text-xs mt-0.5">{method.desc}</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all`}
                    style={isSelected ? { borderColor: method.accentColor, background: method.accentColor } : { borderColor: '#D1D5DB', background: 'white' }}
                  >
                    {isSelected && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* FPX banks */}
        {selectedMethod === 'fpx' && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-5">
            <p className="text-emerald-700 font-bold text-xs uppercase tracking-wide mb-2">Supported Banks</p>
            <div className="grid grid-cols-3 gap-1.5">
              {['Maybank', 'CIMB', 'RHB', 'Public Bank', 'Hong Leong', 'AmBank', 'Bank Islam', 'BSN', 'Affin Bank'].map((bank) => (
                <div key={bank} className="bg-white rounded-lg px-2 py-1.5 text-center">
                  <span className="text-emerald-700 text-xs font-medium">{bank}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trust signals */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { icon: '🔒', label: '256-bit SSL' },
            { icon: '⚡', label: 'Instant Credits' },
            { icon: '↩️', label: 'Refund Policy' },
          ].map(({ icon, label }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
              <div className="text-lg mb-1">{icon}</div>
              <p className="text-[#6B7280] text-xs font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* Desktop pay button */}
        <div className="hidden lg:block">
          <button
            onClick={handlePay}
            disabled={processing}
            className="w-full text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-60 text-base shadow-lg"
            style={{ background: processing ? '#9CA3AF' : 'linear-gradient(135deg, #3ECBA0 0%, #1a9e7a 100%)' }}
          >
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Redirecting to Stripe...
              </span>
            ) : (
              `Pay RM${price} · ${selectedMethodData?.label}`
            )}
          </button>
          <p className="text-center text-[#9CA3AF] text-xs mt-2">
            Secured by Stripe · Your card details are never stored on our servers
          </p>
        </div>
      </div>

      {/* Mobile sticky pay button */}
      <div
        className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 px-5 py-4 z-20 shadow-lg"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
      >
        <button
          onClick={handlePay}
          disabled={processing}
          className="w-full text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-60 text-base shadow-md"
          style={{ background: processing ? '#9CA3AF' : 'linear-gradient(135deg, #3ECBA0 0%, #1a9e7a 100%)' }}
        >
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Redirecting to Stripe...
            </span>
          ) : (
            `Pay RM${price} · ${selectedMethodData?.label}`
          )}
        </button>
        <p className="text-center text-[#9CA3AF] text-xs mt-2">🔒 Secured by Stripe · 256-bit SSL</p>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[#3ECBA0] border-t-transparent animate-spin" /></div>}>
      <PaymentContent />
    </Suspense>
  );
}

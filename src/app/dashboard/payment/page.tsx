'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

const paymentMethodDetails = [
  {
    id: 'card',
    label: 'Credit / Debit Card',
    desc: 'Visa, Mastercard, American Express',
    icon: '💳',
    badge: null,
    color: 'border-blue-200 bg-blue-50',
    selectedColor: 'border-blue-400 bg-blue-50 shadow-blue-100',
    textColor: 'text-blue-700',
  },
  {
    id: 'fpx',
    label: 'FPX Online Banking',
    desc: 'Maybank, CIMB, RHB, Public Bank, Hong Leong, AmBank & more',
    icon: '🏦',
    badge: 'Malaysian Banks',
    color: 'border-green-200 bg-green-50',
    selectedColor: 'border-green-400 bg-green-50 shadow-green-100',
    textColor: 'text-green-700',
  },
  {
    id: 'grabpay',
    label: 'GrabPay',
    desc: 'Pay with your GrabPay e-wallet balance',
    icon: '🟢',
    badge: 'e-Wallet',
    color: 'border-emerald-200 bg-emerald-50',
    selectedColor: 'border-emerald-400 bg-emerald-50 shadow-emerald-100',
    textColor: 'text-emerald-700',
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

      const { data, error: fnErr } = await supabase.functions.invoke<{
        sessionId?: string;
        url?: string;
        error?: string;
      }>('create-checkout-session', {
        body: {
          planId,
          planName,
          priceMyr: parseFloat(price),
          credits: parseInt(credits),
          userId: user.id,
          userEmail: user.email,
          successUrl: `${appUrl}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}&price=${price}&credits=${credits}&name=${encodeURIComponent(planName)}`,
          cancelUrl: `${appUrl}/dashboard/payment?planId=${planId}&price=${price}&credits=${credits}&name=${encodeURIComponent(planName)}`,
        },
      });

      if (fnErr) {
        throw new Error((data as { error?: string })?.error ?? fnErr.message ?? 'Payment setup failed');
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Payment failed. Please try again.';
      console.error('Payment error:', err);
      setError(message);
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-full bg-white lg:bg-[#F5F7F5]">
      <div className="max-w-md mx-auto lg:max-w-2xl px-5 lg:px-8 pt-6 lg:pt-8 pb-32">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4 text-[#374151]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-[#1A1A1A] font-bold text-xl flex-1 text-center pr-9">Checkout</h1>
        </div>

        {/* Plan summary card */}
        <div className="bg-[#EBF9F4] border border-[#C8F0E4] rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#2DAF87] font-bold text-sm uppercase tracking-wide mb-1">Your Plan</p>
              <p className="text-[#1A1A1A] font-bold text-lg">{planName}</p>
              <p className="text-[#6B7280] text-sm">{credits} meal credits</p>
            </div>
            <div className="text-right">
              <p className="text-[#3ECBA0] font-bold text-3xl">RM{price}</p>
              <p className="text-[#9CA3AF] text-xs">one-time payment</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-red-600 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Payment method selection */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-5">
          <h3 className="text-[#1A1A1A] font-bold text-base mb-1">Select Payment Method</h3>
          <p className="text-[#9CA3AF] text-xs mb-4">You will be redirected to Stripe&apos;s secure checkout</p>

          <div className="space-y-3">
            {paymentMethodDetails.map((method) => {
              const isSelected = selectedMethod === method.id;
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left shadow-sm ${
                    isSelected ? `${method.selectedColor} shadow-md` : `${method.color} hover:shadow-md`
                  }`}
                >
                  <div className="text-2xl flex-shrink-0">{method.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`font-bold text-sm ${isSelected ? method.textColor : 'text-[#1A1A1A]'}`}>
                        {method.label}
                      </p>
                      {method.badge && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isSelected ? `${method.textColor} bg-white/60` : 'bg-white text-[#6B7280]'}`}>
                          {method.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[#9CA3AF] text-xs mt-0.5 leading-tight">{method.desc}</p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      isSelected ? 'border-current bg-current' : 'border-gray-300 bg-white'
                    } ${isSelected ? method.textColor : ''}`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* FPX banks info */}
        {selectedMethod === 'fpx' && (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-5">
            <p className="text-green-700 font-bold text-sm mb-2">🏦 Supported Banks</p>
            <div className="grid grid-cols-2 gap-1">
              {[
                'Maybank', 'CIMB Bank', 'RHB Bank', 'Public Bank',
                'Hong Leong Bank', 'AmBank', 'Bank Islam', 'Bank Rakyat',
                'BSN', 'Affin Bank', 'Alliance Bank', 'OCBC Bank',
              ].map((bank) => (
                <div key={bank} className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0" />
                  <span className="text-green-700 text-xs">{bank}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security note */}
        <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3">
          <svg className="w-5 h-5 text-[#3ECBA0] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <p className="text-[#6B7280] text-xs">
            Payments are processed securely by <span className="font-semibold text-[#1A1A1A]">Stripe</span>. Your card details are never stored on our servers.
          </p>
        </div>
      </div>

      {/* Sticky pay button */}
      <div
        className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 px-5 py-4 z-20"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
      >
        <div className="max-w-md mx-auto lg:max-w-2xl">
          <button
            onClick={handlePay}
            disabled={processing}
            className="w-full bg-[#3ECBA0] text-white font-bold py-4 rounded-2xl hover:bg-[#2DAF87] transition-colors disabled:opacity-60 text-base"
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
              `Pay RM${price} via ${paymentMethodDetails.find((m) => m.id === selectedMethod)?.label}`
            )}
          </button>
          <p className="text-center text-[#9CA3AF] text-xs mt-2">
            🔒 Secured by Stripe · 256-bit SSL encryption
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[#9CA3AF]">Loading...</div>}>
      <PaymentContent />
    </Suspense>
  );
}

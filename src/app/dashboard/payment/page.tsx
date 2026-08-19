'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type PaymentMethod = 'card' | 'online_banking' | 'other';

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const planId = searchParams.get('planId') || '';
  const price = searchParams.get('price') || '0';
  const credits = searchParams.get('credits') || '0';
  const planName = searchParams.get('name') || 'Meal Plan';

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card');
  const [processing, setProcessing] = useState(false);

  const handlePay = async () => {
    if (!user || !planId) return;
    setProcessing(true);
    try {
      const supabase = createClient();
      // Cancel existing subscription
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', user.id)
        .eq('status', 'active');

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      const startsAt = new Date();

      const { data: newSub, error: subErr } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          meal_plan_id: planId,
          status: 'active',
          credits_total: parseInt(credits),
          credits_used: 0,
          starts_at: startsAt.toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (subErr) throw subErr;

      await supabase.from('wallet_transactions').insert({
        user_id: user.id,
        subscription_id: newSub.id,
        description: `Subscribed to ${planName} — ${credits} credits issued`,
        credits_delta: parseInt(credits),
        balance_after: parseInt(credits),
      });

      router.push(`/dashboard/payment-success?price=${price}&credits=${credits}&name=${encodeURIComponent(planName)}`);
    } catch (err) {
      console.log('Payment error:', err);
      setProcessing(false);
    }
  };

  const methods: { id: PaymentMethod; label: string; sub?: string; icon: React.ReactNode }[] = [
    {
      id: 'card',
      label: 'Card',
      icon: (
        <div className="w-10 h-10 bg-[#EBF9F4] rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-[#3ECBA0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
      ),
    },
    {
      id: 'online_banking',
      label: 'Online banking',
      sub: 'Expires 08/28',
      icon: (
        <div className="w-10 h-10 bg-[#1A1F71] rounded-md flex items-center justify-center">
          <span className="text-white font-bold text-xs tracking-wider">VISA</span>
        </div>
      ),
    },
    {
      id: 'other',
      label: 'Other supported payment method',
      sub: 'Expires 11/27',
      icon: (
        <div className="w-10 h-10 bg-[#EBF9F4] rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-[#3ECBA0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-full bg-white lg:bg-[#F5F7F5]">
      {/* ── Mobile / centered layout ── */}
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
          <h1 className="text-[#1A1A1A] font-bold text-xl flex-1 text-center pr-9">Payment</h1>
        </div>

        {/* Plan summary */}
        <div className="text-center mb-8">
          <p className="text-[#3ECBA0] font-bold text-4xl">RM{price}</p>
          <p className="text-[#6B7280] text-base mt-1">{credits} Meals</p>
        </div>

        <div className="bg-gray-50 lg:bg-white rounded-2xl p-5 lg:border lg:border-gray-100 lg:shadow-sm">
          <h3 className="text-[#1A1A1A] font-bold text-base mb-4">Payment Method</h3>

          <div className="space-y-3">
            {methods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                  selectedMethod === method.id
                    ? 'border-[#3ECBA0] bg-white shadow-sm'
                    : 'border-gray-100 bg-white hover:border-[#3ECBA0]/40'
                }`}
              >
                {method.icon}
                <div className="flex-1">
                  <p className="text-[#1A1A1A] font-semibold text-sm">{method.label}</p>
                  {method.sub && <p className="text-[#9CA3AF] text-xs">{method.sub}</p>}
                </div>
                {selectedMethod === method.id && (
                  <div className="w-7 h-7 bg-[#3ECBA0] rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sticky pay button ── */}
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
            {processing ? 'Processing...' : `Pay RM${price}`}
          </button>
          <p className="text-center text-[#9CA3AF] text-xs mt-2">Your payment is securiely processed.</p>
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

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api, PaymentOrder } from '@/lib/api';

const paymentMethods = [
  {
    id: 'duitnow_qr',
    label: 'DuitNow QR',
    desc: 'Pay with ANY Malaysian Bank or e-Wallet (MAE, CIMB, TNG, Grab)',
    badge: 'National QR • Recommended',
    badgeColor: '#EC4899',
    accentColor: '#DB2777',
    bgColor: '#FDF2F8',
    borderColor: '#FBCFE8',
    icon: (
      <div className="w-9 h-9 rounded-xl bg-[#ED0278] flex items-center justify-center shadow-sm">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </div>
    ),
  },
  {
    id: 'tng_ewallet',
    label: "Touch 'n Go eWallet",
    desc: 'Scan QR or tap to open directly in Touch n Go app',
    badge: 'Direct e-Wallet',
    badgeColor: '#0284C7',
    accentColor: '#0284C7',
    bgColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    icon: (
      <div className="w-9 h-9 rounded-xl bg-[#005BAC] flex items-center justify-center shadow-sm">
        <span className="text-white font-black text-xs tracking-tighter">TNG</span>
      </div>
    ),
  },
  {
    id: 'grabpay',
    label: 'GrabPay',
    desc: 'Pay with your GrabPay e-wallet balance',
    badge: 'e-Wallet',
    badgeColor: '#059669',
    accentColor: '#00B14F',
    bgColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    icon: (
      <div className="w-9 h-9 rounded-xl bg-[#00B14F] flex items-center justify-center shadow-sm">
        <span className="text-white font-black text-xs">G</span>
      </div>
    ),
  },
  {
    id: 'shopeepay',
    label: 'ShopeePay',
    desc: 'Pay with your ShopeePay balance or Shopee app',
    badge: 'e-Wallet',
    badgeColor: '#EA580C',
    accentColor: '#EE4D2D',
    bgColor: '#FFF7ED',
    borderColor: '#FED7AA',
    icon: (
      <div className="w-9 h-9 rounded-xl bg-[#EE4D2D] flex items-center justify-center shadow-sm">
        <span className="text-white font-black text-xs">S</span>
      </div>
    ),
  },
];

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const planId = searchParams?.get('planId') || '';
  const price = searchParams?.get('price') || '0';
  const credits = searchParams?.get('credits') || '0';
  const planName = searchParams?.get('name') || 'Meal Plan';

  const [selectedMethod, setSelectedMethod] = useState('duitnow_qr');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // Active Payment Order Modal State (Octopus Cashless Experience)
  const [activeOrder, setActiveOrder] = useState<PaymentOrder | null>(null);
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins
  const [simulating, setSimulating] = useState(false);

  const handleInitiatePayment = async () => {
    if (!planId) {
      setError('Please select a valid meal plan to continue.');
      return;
    }
    setProcessing(true);
    setError('');

    try {
      if (!api.hasToken() && !user) {
        setError('Your session has expired. Please log in to complete your subscription.');
        router.push(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        return;
      }

      const order = await api.createPaymentOrder(planId, selectedMethod);
      setActiveOrder(order);
      setTimeLeft(900);
    } catch (err: any) {
      setError(err.message || 'Failed to initiate payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // 15-minute countdown timer
  useEffect(() => {
    if (!activeOrder) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setActiveOrder(null);
          setError('Payment session expired. Please try again.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeOrder]);

  // Real-time payment verification polling
  useEffect(() => {
    if (!activeOrder) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.getPaymentStatus(activeOrder.reference_code);
        if (res.status === 'completed') {
          clearInterval(interval);
          router.push(
            `/dashboard/payment-success?price=${activeOrder.amount_myr}&credits=${activeOrder.credits}&name=${encodeURIComponent(activeOrder.plan_name)}`
          );
        }
      } catch (err) {
        // silently ignore transient network hiccups
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [activeOrder, router]);

  const handleSimulateSuccess = async () => {
    if (!activeOrder) return;
    setSimulating(true);
    try {
      await api.simulatePaymentSuccess(activeOrder.reference_code);
      router.push(
        `/dashboard/payment-success?price=${activeOrder.amount_myr}&credits=${activeOrder.credits}&name=${encodeURIComponent(activeOrder.plan_name)}`
      );
    } catch (err: any) {
      setError(err.message || 'Simulation failed.');
      setSimulating(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const perMeal = (parseFloat(price) / (parseInt(credits) || 1)).toFixed(2);

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
            <h1 className="text-[#1A1A1A] font-bold text-xl">Checkout</h1>
            <p className="text-[#6B7280] text-xs">Fast & Secure Malaysian Payment</p>
          </div>
        </div>

        {/* Order Summary Card */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-[#9CA3AF] uppercase font-bold tracking-wider">Selected Plan</p>
              <h2 className="text-[#1A1A1A] font-bold text-lg">{planName}</h2>
            </div>
            <div className="text-right">
              <span className="text-[#3ECBA0] font-black text-2xl">RM{parseFloat(price).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-xs text-[#4B5563]">
              <span className="w-2 h-2 rounded-full bg-[#3ECBA0]" />
              <strong>{credits} Meals</strong> included
            </div>
            <span className="text-gray-300">•</span>
            <div className="text-xs text-[#4B5563]">
              <strong>RM{perMeal}</strong> per meal
            </div>
            <span className="text-gray-300">•</span>
            <div className="text-xs text-[#4B5563]">Valid 30 Days</div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[#1A1A1A] font-bold text-sm">Select Payment Method</h3>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              Zero Fees • Instant Credit
            </span>
          </div>

          <div className="space-y-3">
            {paymentMethods.map((m) => {
              const isSelected = selectedMethod === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMethod(m.id)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#3ECBA0] bg-white shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {m.icon}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[#1A1A1A] font-bold text-sm">{m.label}</span>
                        {m.badge && (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: m.bgColor, color: m.accentColor }}
                          >
                            {m.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[#6B7280] text-xs mt-0.5">{m.desc}</p>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected ? 'border-[#3ECBA0] bg-[#3ECBA0]' : 'border-gray-300'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3.5 text-xs mb-5 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleInitiatePayment}
          disabled={processing}
          className="w-full bg-[#3ECBA0] hover:bg-[#2DAF87] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#3ECBA0]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 text-base"
        >
          {processing ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Generating Secure QR...</span>
            </>
          ) : (
            <>
              <span>Pay RM{parseFloat(price).toFixed(2)} with {paymentMethods.find((m) => m.id === selectedMethod)?.label}</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 text-[#9CA3AF] text-xs mt-4">
          <svg className="w-3.5 h-3.5 text-[#3ECBA0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>End-to-End Encrypted • Bank Negara Malaysia Standard</span>
        </div>
      </div>

      {/* ── Seamless Remittance Modal (Octopus Laundry Cashless UX) ─────────── */}
      {activeOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3ECBA0] animate-pulse" />
                <span className="text-xs font-bold text-[#111827] uppercase tracking-wider">Awaiting Remittance</span>
              </div>
              <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-xs font-bold font-mono border border-amber-200">
                <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{timeFormatted}</span>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="bg-[#F9FAFB] rounded-2xl p-4 border border-gray-200 mb-4 inline-block">
              {activeOrder.qr_image_url ? (
                <img
                  src={activeOrder.qr_image_url}
                  alt="Payment QR"
                  className="w-48 h-48 mx-auto object-contain rounded-lg"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-gray-400">Loading QR...</div>
              )}
              <p className="text-[11px] font-mono text-[#6B7280] mt-2 font-medium">{activeOrder.reference_code}</p>
            </div>

            {/* Amount & Plan */}
            <div className="mb-4">
              <div className="text-2xl font-black text-[#111827]">RM{activeOrder.amount_myr.toFixed(2)}</div>
              <p className="text-xs text-[#6B7280] mt-0.5">
                {activeOrder.plan_name} • <span className="font-semibold text-[#3ECBA0]">{activeOrder.credits} Credits</span>
              </p>
            </div>

            {/* Instructions */}
            <p className="text-xs text-[#6B7280] bg-gray-50 rounded-xl p-3 border border-gray-100 mb-4 text-left leading-relaxed">
              {activeOrder.instructions}
            </p>

            {/* HitPay Malaysia Hosted Checkout Button */}
            {activeOrder.checkout_url && (
              <a
                href={activeOrder.checkout_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-[#111827] text-white font-bold py-3 rounded-xl text-xs mb-2 hover:bg-black transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>💳 Pay via HitPay Malaysia Checkout</span>
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}

            {/* Deep link button if mobile app available */}
            {activeOrder.deep_link_url && activeOrder.deep_link_url !== activeOrder.checkout_url && (
              <a
                href={activeOrder.deep_link_url}
                className="block w-full bg-[#005BAC] text-white font-bold py-2.5 rounded-xl text-xs mb-2 hover:bg-[#004B8D] transition-colors"
              >
                Open e-Wallet App Directly
              </a>
            )}


            {/* Sandbox Simulation Button */}
            <button
              onClick={handleSimulateSuccess}
              disabled={simulating}
              className="w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold py-2.5 rounded-xl text-xs mb-2 transition-colors flex items-center justify-center gap-1.5"
            >
              {simulating ? 'Processing...' : '⚡ Simulate Payment Scan (Test Mode)'}
            </button>

            {/* Cancel Button */}
            <button
              onClick={() => setActiveOrder(null)}
              className="w-full text-xs text-gray-400 hover:text-gray-600 font-semibold py-1.5 transition-colors"
            >
              Cancel Payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[#9CA3AF]">Loading payment options...</div>}>
      <PaymentContent />
    </Suspense>
  );
}

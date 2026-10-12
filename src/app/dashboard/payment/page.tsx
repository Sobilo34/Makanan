'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const planId = searchParams?.get('planId') || '';
  const price = searchParams?.get('price') || '150';
  const credits = searchParams?.get('credits') || '20';
  const planName = searchParams?.get('name') || 'Meal Plan';

  // Strictly TWO Launch Payment Methods: Touch 'n Go eWallet & DuitNow QR
  const [selectedMethod, setSelectedMethod] = useState<'tng_ewallet' | 'duitnow_qr'>('tng_ewallet');
  const [initiating, setInitiating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes live countdown

  // Formatted issue date
  const issueDateStr = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }, []);

  // Countdown timer (e.g. 09:50)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Execute Real-Time HitPay Sandbox Checkout
  const handleProceedToPayment = async () => {
    setInitiating(true);
    setErrorMessage('');

    try {
      if (!api.hasToken() && !user) {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        return;
      }

      // Dynamic redirect URL targeting the exact origin (localhost:4028 or production)
      const redirectUrl = `${window.location.origin}/dashboard/payment-success`;
      const order = await api.createPaymentOrder(planId, selectedMethod, redirectUrl);

      if (order && order.checkout_url) {
        // Direct navigation to official HitPay Sandbox Hosted Checkout (No Mocks)
        window.location.href = order.checkout_url;
      } else {
        throw new Error('Unable to generate HitPay checkout URL. Please try again.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to HitPay payment gateway.';
      setErrorMessage(msg);
      setInitiating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-16" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-md mx-auto px-4 pt-4">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-gray-900 font-extrabold text-lg">Secure Checkout</h1>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>HitPay 256-bit</span>
          </div>
        </div>

        {/* Brand Header & Price Display */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3 shadow-inner">
            <span className="text-3xl">🍲</span>
          </div>
          <h2 className="text-gray-900 font-black text-xs tracking-widest uppercase mb-1">MAKANAN STUDENT DINING</h2>
          <div className="text-gray-900 font-black text-4xl tracking-tight">
            RM {parseFloat(price).toFixed(2)}
          </div>
        </div>

        {/* Order Details Metadata Table */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-sm mb-6 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium">Plan</span>
            <span className="text-gray-900 font-bold text-right">{planName} ({credits} Meals)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium">Issue Date</span>
            <span className="text-gray-800 font-medium text-right">{issueDateStr}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium">Time Left</span>
            <span className="text-amber-600 font-mono font-bold text-right">{timeFormatted}</span>
          </div>
          <div className="flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="text-gray-400 font-medium">Pay to</span>
            <span className="text-gray-800 font-bold text-right">Makanan Dining Sdn Bhd</span>
          </div>
        </div>

        {/* Payment Methods Section (Strictly Touch 'n Go eWallet & DuitNow QR) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-900 font-bold text-sm">Select Payment Method</h3>
            <span className="text-[11px] font-medium text-gray-500">HitPay Malaysia Sandbox</span>
          </div>

          <div className="space-y-3">
            {/* Option 1: Touch 'n Go eWallet */}
            <div
              onClick={() => setSelectedMethod('tng_ewallet')}
              className={`bg-white rounded-2xl p-4 border-2 transition-all cursor-pointer flex items-center justify-between shadow-sm ${
                selectedMethod === 'tng_ewallet'
                  ? 'border-[#005BAC] ring-2 ring-[#005BAC]/15 shadow-[#005BAC]/10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#005BAC] flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-[#005BAC]/20">
                  <div className="text-center leading-none">
                    <span className="block text-white font-black text-[13px] tracking-tight">Touch</span>
                    <span className="block text-[#FDB913] font-black text-[9px] mt-0.5">&apos;n Go</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-gray-900">Touch &apos;n Go eWallet</p>
                    <span className="text-[10px] font-semibold bg-blue-50 text-[#005BAC] px-2 py-0.5 rounded-full border border-blue-100">
                      e-Wallet
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Pay instantly via Touch &apos;n Go eWallet on HitPay
                  </p>
                </div>
              </div>

              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedMethod === 'tng_ewallet'
                    ? 'border-[#005BAC] bg-[#005BAC]'
                    : 'border-gray-300 bg-white'
                }`}
              >
                {selectedMethod === 'tng_ewallet' && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
            </div>

            {/* Option 2: DuitNow QR */}
            <div
              onClick={() => setSelectedMethod('duitnow_qr')}
              className={`bg-white rounded-2xl p-4 border-2 transition-all cursor-pointer flex items-center justify-between shadow-sm ${
                selectedMethod === 'duitnow_qr'
                  ? 'border-[#ED0278] ring-2 ring-[#ED0278]/15 shadow-[#ED0278]/10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#ED0278] flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-[#ED0278]/20 font-black text-xl">
                  D
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-gray-900">DuitNow QR</p>
                    <span className="text-[10px] font-semibold bg-pink-50 text-[#ED0278] px-2 py-0.5 rounded-full border border-pink-100">
                      National QR
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Scan with Maybank MAE, CIMB, Bank Islam, or any bank
                  </p>
                </div>
              </div>

              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedMethod === 'duitnow_qr'
                    ? 'border-[#ED0278] bg-[#ED0278]'
                    : 'border-gray-300 bg-white'
                }`}
              >
                {selectedMethod === 'duitnow_qr' && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-3.5 text-xs mb-4 flex items-start gap-2.5">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Primary Action Button (Direct Navigation to HitPay) */}
        <button
          onClick={handleProceedToPayment}
          disabled={initiating}
          className={`w-full font-extrabold py-4 rounded-2xl shadow-lg text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 mb-4 active:scale-[0.99] text-white ${
            selectedMethod === 'tng_ewallet'
              ? 'bg-[#005BAC] hover:bg-[#004B8D] shadow-[#005BAC]/25'
              : 'bg-[#ED0278] hover:bg-[#D0026A] shadow-[#ED0278]/25'
          }`}
        >
          {initiating ? (
            <>
              <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Opening HitPay Sandbox Checkout...</span>
            </>
          ) : (
            <span>
              {selectedMethod === 'tng_ewallet'
                ? `Pay RM ${parseFloat(price).toFixed(2)} with Touch 'n Go`
                : `Pay RM ${parseFloat(price).toFixed(2)} with DuitNow QR`}
            </span>
          )}
        </button>

        {/* Real-time Sandbox Notice */}
        <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3.5 mb-6 flex items-start gap-3">
          <svg className="w-5 h-5 text-[#005BAC] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Real-time Sandbox: Clicking pay opens the authentic HitPay test gateway. Once authorized, your meal credits are verified and issued instantly.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-gray-400 space-x-3">
          <span>Powered by HitPay Malaysia</span>
          <span>&bull;</span>
          <span>Bank Negara Malaysia Compliant</span>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading checkout...</div>}>
      <PaymentContent />
    </Suspense>
  );
}

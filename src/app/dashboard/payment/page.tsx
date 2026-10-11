'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api, PaymentOrder } from '@/lib/api';

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const planId = searchParams?.get('planId') || '';
  const price = searchParams?.get('price') || '150';
  const credits = searchParams?.get('credits') || '20';
  const planName = searchParams?.get('name') || 'Meal Plan';

  // Screen View: 'checkout' | 'tng_confirm' | 'duitnow_qr'
  const [currentScreen, setCurrentScreen] = useState<'checkout' | 'tng_confirm' | 'duitnow_qr'>('checkout');
  const [selectedCategory, setSelectedCategory] = useState<'ewallet' | 'duitnow'>('ewallet');
  const [activeOrder, setActiveOrder] = useState<PaymentOrder | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes (600s) like Octopus countdown

  // Fixed Issue Date string for display
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

  // Initialize HitPay payment order
  const getOrCreateOrder = async (method: 'tng_ewallet' | 'duitnow_qr'): Promise<PaymentOrder | null> => {
    if (activeOrder && activeOrder.payment_method === method) {
      return activeOrder;
    }
    setLoadingOrder(true);
    setPayError('');
    try {
      if (!api.hasToken() && !user) {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        return null;
      }
      const order = await api.createPaymentOrder(planId, method);
      setActiveOrder(order);
      setTimeLeft(600);
      return order;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create payment order.';
      setPayError(msg);
      return null;
    } finally {
      setLoadingOrder(false);
    }
  };

  // Pre-load order on entry
  useEffect(() => {
    if (planId && !activeOrder) {
      getOrCreateOrder('tng_ewallet');
    }
  }, [planId]);

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

  // Real-time synchronization listener
  useEffect(() => {
    if (!activeOrder) return;
    const interval = setInterval(async () => {
      try {
        const res = await api.getPaymentStatus(activeOrder.reference_code);
        if (res.status === 'completed') {
          clearInterval(interval);
          router.push(
            `/dashboard/payment-success?price=${activeOrder.amount_myr}&credits=${activeOrder.credits}&name=${encodeURIComponent(
              activeOrder.plan_name
            )}&reference_code=${encodeURIComponent(activeOrder.reference_code)}&method=${encodeURIComponent(
              activeOrder.payment_method
            )}`
          );
        }
      } catch {
        // tolerate transient hiccups
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [activeOrder, router]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Handle proceed from Checkout screen
  const handleProceedToPayment = async () => {
    if (selectedCategory === 'ewallet') {
      const order = await getOrCreateOrder('tng_ewallet');
      if (order) setCurrentScreen('tng_confirm');
    } else {
      const order = await getOrCreateOrder('duitnow_qr');
      if (order) setCurrentScreen('duitnow_qr');
    }
  };

  // Execute payment authorization (Octopus Image 11 Pay button)
  const handleExecutePayment = async () => {
    if (!activeOrder) return;
    setPaying(true);
    setPayError('');

    try {
      await api.confirmTouchNGoPayment(activeOrder.reference_code);
      router.push(
        `/dashboard/payment-success?price=${activeOrder.amount_myr}&credits=${activeOrder.credits}&name=${encodeURIComponent(
          activeOrder.plan_name
        )}&reference_code=${encodeURIComponent(activeOrder.reference_code)}&method=${encodeURIComponent(
          activeOrder.payment_method
        )}`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment authorization failed. Please try again.';
      setPayError(msg);
      setPaying(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // SCREEN 2: Touch 'n Go eWallet Confirm Payment (Exact Octopus Image 11 Flow)
  // ─────────────────────────────────────────────────────────────────────────────
  if (currentScreen === 'tng_confirm') {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex flex-col justify-between" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {/* Top Header Bar */}
        <header className="bg-[#005BAC] text-white px-4 py-4 flex items-center justify-between shadow-md">
          <button
            onClick={() => setCurrentScreen('checkout')}
            className="flex items-center gap-1.5 text-white/90 hover:text-white transition-opacity font-medium text-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Confirm Payment</span>
          </button>
          <span className="text-xs font-mono bg-white/15 px-2.5 py-0.5 rounded-full border border-white/20">
            {timeFormatted}
          </span>
        </header>

        {/* Center Confirmation Card */}
        <div className="flex-1 max-w-md w-full mx-auto px-4 py-6 flex flex-col justify-center">
          <div className="bg-white rounded-3xl p-7 shadow-xl border border-gray-100 text-center">
            {/* Touch 'n Go Official Badge */}
            <div className="w-20 h-20 mx-auto rounded-3xl bg-[#005BAC] flex items-center justify-center shadow-lg shadow-[#005BAC]/25 mb-3 border-2 border-white">
              <div className="text-center">
                <span className="block text-white font-black text-2xl tracking-tighter leading-none">Touch</span>
                <span className="block text-[#FDB913] font-black text-xs tracking-wider leading-none mt-0.5">&apos;n Go</span>
                <span className="block text-white/80 font-bold text-[9px] uppercase tracking-widest mt-0.5">eWallet</span>
              </div>
            </div>

            {/* Masked User Account */}
            <p className="text-gray-500 font-mono text-xs tracking-wider mb-2">
              +60*****8961
            </p>

            {/* Total Amount Due */}
            <div className="text-gray-900 font-black text-4xl tracking-tight mb-6">
              RM {parseFloat(price).toFixed(2)}
            </div>

            {/* Line Item Breakdown */}
            <div className="border-t border-gray-100 pt-4 space-y-3 text-left text-xs mb-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-medium">Payment Details</span>
                <span className="text-gray-800 font-bold text-right">
                  {planName} ({credits} Tokens)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-medium">Merchant</span>
                <span className="text-gray-800 font-bold text-right">Makanan Dining Sdn Bhd</span>
              </div>
              {activeOrder && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-medium">Order ID</span>
                  <span className="text-gray-600 font-mono text-[11px] text-right">{activeOrder.reference_code}</span>
                </div>
              )}
            </div>

            {/* Error banner if payment clearance fails */}
            {payError && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-xs mb-4 text-left">
                {payError}
              </div>
            )}

            {/* Regulatory Consumer Protection Shield */}
            <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3.5 mb-6 flex items-start gap-3 text-left">
              <svg className="w-5 h-5 text-[#005BAC] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                As per regulations, your money is kept safe in a separate trust account and used only for transactions you authorise.
              </p>
            </div>

            {/* Big Blue "Pay" Action Button */}
            <button
              onClick={handleExecutePayment}
              disabled={paying}
              className="w-full bg-[#005BAC] hover:bg-[#004B8D] active:scale-[0.99] text-white font-extrabold py-4 rounded-full text-base transition-all shadow-lg shadow-[#005BAC]/30 disabled:opacity-70 flex items-center justify-center gap-2 mb-3"
            >
              {paying ? (
                <>
                  <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Processing Touch &apos;n Go Payment...</span>
                </>
              ) : (
                <span>Pay RM {parseFloat(price).toFixed(2)}</span>
              )}
            </button>

            {/* HitPay Hosted Gateway Option */}
            {activeOrder?.checkout_url && (
              <a
                href={activeOrder.checkout_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-xs text-gray-500 hover:text-gray-700 font-semibold py-1.5 transition-colors"
              >
                Inspect official HitPay Hosted Checkout &rarr;
              </a>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-4 text-[11px] text-gray-400">
          Powered by HitPay Malaysia &bull; Bank Negara Compliant
        </footer>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCREEN 3: DuitNow National QR Screen (Exact Octopus Image 8 & 9 Flow)
  // ─────────────────────────────────────────────────────────────────────────────
  if (currentScreen === 'duitnow_qr') {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex flex-col justify-between" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {/* Top Header Bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => setCurrentScreen('checkout')}
            className="flex items-center gap-1.5 text-gray-800 hover:text-black font-medium text-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span>DuitNow QR Checkout</span>
          </button>
          <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
            {timeFormatted}
          </span>
        </header>

        {/* National QR Container */}
        <div className="flex-1 max-w-md w-full mx-auto px-4 py-6 flex flex-col justify-center">
          <div className="bg-white rounded-3xl p-6 shadow-xl border-4 border-[#ED0278] text-center">
            {/* Amount */}
            <div className="text-gray-900 font-black text-3xl mb-3">
              RM {parseFloat(price).toFixed(2)}
            </div>

            {/* DuitNow Badge */}
            <div className="flex items-center justify-center gap-1.5 mb-3">
              <div className="w-7 h-7 rounded-full bg-[#ED0278] flex items-center justify-center text-white font-black text-sm">
                D
              </div>
              <span className="text-gray-900 font-extrabold text-sm tracking-tight">DuitNow QR</span>
            </div>

            {/* QR Image Frame */}
            <div className="bg-white p-3 rounded-2xl border-2 border-gray-100 inline-block mx-auto mb-3 shadow-inner">
              {activeOrder?.qr_image_url ? (
                <img
                  src={activeOrder.qr_image_url}
                  alt="DuitNow QR"
                  className="w-56 h-56 object-contain mx-auto"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-gray-400">Loading QR...</div>
              )}
            </div>

            {/* Pink National QR Banner */}
            <div className="bg-[#ED0278] text-white font-extrabold text-xs tracking-wider py-2.5 rounded-xl uppercase mb-4 shadow-md shadow-[#ED0278]/25">
              Malaysia National QR
            </div>

            <p className="text-xs text-gray-600 font-medium mb-5">
              Screenshot the QR code above and scan from gallery to make a payment
            </p>

            {/* Instant Clearance Button */}
            <button
              onClick={handleExecutePayment}
              disabled={paying}
              className="w-full bg-[#ED0278] hover:bg-[#D0026A] active:scale-[0.99] text-white font-extrabold py-3.5 rounded-2xl text-xs transition-all shadow-md shadow-[#ED0278]/25 disabled:opacity-70 flex items-center justify-center gap-2 mb-2"
            >
              {paying ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Verifying Bank Clearance...</span>
                </>
              ) : (
                <span>Confirm DuitNow Clearance</span>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-4 text-[11px] text-gray-400">
          PayNet &bull; DuitNow National Interoperability
        </footer>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCREEN 1: Main Checkout Hub (Exact Octopus Image 7 & 10 Flow)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-16" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-md mx-auto px-4 pt-4">
        {/* Top Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm text-gray-700 hover:bg-gray-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-gray-900 font-extrabold text-xl">Checkout</h1>
        </div>

        {/* Brand Header Icon & Price (Like Octopus Image 7) */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center mb-3 shadow-inner">
            <span className="text-3xl">🍲</span>
          </div>
          <h2 className="text-gray-900 font-black text-xl tracking-wider uppercase mb-1">MAKANAN</h2>
          <div className="text-gray-900 font-black text-4xl tracking-tight">
            RM {parseFloat(price).toFixed(2)}
          </div>
        </div>

        {/* Order Details Metadata Table (Like Octopus Image 7) */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-sm mb-6 space-y-3.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium">Title</span>
            <span className="text-gray-900 font-bold text-right">{planName} ({credits} Tokens)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium">Order ID</span>
            <span className="text-gray-700 font-mono text-[11px] text-right">
              {activeOrder ? activeOrder.reference_code : 'Connecting to HitPay...'}
            </span>
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

        {/* Payment Methods Section (Like Octopus Image 7 & 10) */}
        <div className="mb-6">
          <h3 className="text-gray-900 font-bold text-base mb-1">Payment Methods</h3>
          <p className="text-gray-500 text-xs mb-4">Choose your preferred payment methods</p>

          {/* Two Category Tabs (DuitNow vs e-Wallets) */}
          <div className="flex items-center gap-6 mb-5 px-2">
            {/* DuitNow Option */}
            <div
              onClick={() => setSelectedCategory('duitnow')}
              className="flex flex-col items-center gap-2 cursor-pointer group"
            >
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-md ${
                  selectedCategory === 'duitnow'
                    ? 'bg-[#1E3A8A] text-white ring-4 ring-[#1E3A8A]/20 scale-105'
                    : 'bg-white text-gray-500 border border-gray-200 group-hover:border-gray-300'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-[#ED0278] flex items-center justify-center text-white font-black text-sm">
                  D
                </div>
              </div>
              <span className={`text-xs font-bold ${selectedCategory === 'duitnow' ? 'text-gray-900' : 'text-gray-500'}`}>
                DuitNow
              </span>
            </div>

            {/* e-Wallets Option */}
            <div
              onClick={() => setSelectedCategory('ewallet')}
              className="flex flex-col items-center gap-2 cursor-pointer group"
            >
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-md ${
                  selectedCategory === 'ewallet'
                    ? 'bg-[#1E3A8A] text-white ring-4 ring-[#1E3A8A]/20 scale-105'
                    : 'bg-white text-gray-500 border border-gray-200 group-hover:border-gray-300'
                }`}
              >
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <span className={`text-xs font-bold ${selectedCategory === 'ewallet' ? 'text-gray-900' : 'text-gray-500'}`}>
                e-Wallets
              </span>
            </div>
          </div>

          {/* E-Wallets Grid (Like Octopus Image 10 - Showing Touch 'n Go eWallet) */}
          {selectedCategory === 'ewallet' ? (
            <div className="grid grid-cols-3 gap-3">
              {/* Touch 'n Go eWallet Active Card */}
              <div className="bg-white rounded-2xl p-3 border-2 border-[#005BAC] shadow-md flex flex-col items-center text-center cursor-pointer relative overflow-hidden ring-2 ring-[#005BAC]/15">
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500" />
                <div className="w-12 h-12 rounded-xl bg-[#005BAC] flex items-center justify-center text-white mb-2 shadow-sm">
                  <span className="font-black text-xs">TNG</span>
                </div>
                <span className="text-[11px] font-bold text-gray-900 leading-tight">Touch &apos;n Go eWallet</span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ED0278] flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                D
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">National DuitNow QR</p>
                <p className="text-[11px] text-gray-500">Scan via Maybank MAE, CIMB, Bank Islam, or e-Wallets</p>
              </div>
            </div>
          )}
        </div>

        {/* Primary Proceed CTA Button */}
        <button
          onClick={handleProceedToPayment}
          disabled={loadingOrder}
          className="w-full bg-[#1E3A8A] hover:bg-[#1E40AF] active:scale-[0.99] text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-blue-900/20 text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 mb-4"
        >
          {loadingOrder ? (
            <>
              <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Connecting to Gateway...</span>
            </>
          ) : (
            <span>
              {selectedCategory === 'ewallet'
                ? `Pay RM ${parseFloat(price).toFixed(2)} with Touch 'n Go`
                : `Pay RM ${parseFloat(price).toFixed(2)} with DuitNow QR`}
            </span>
          )}
        </button>

        {/* Terms & Privacy */}
        <div className="text-center text-[11px] text-gray-400 space-x-3">
          <span>Powered by HitPay</span>
          <span>&bull;</span>
          <span>Terms</span>
          <span>&bull;</span>
          <span>Privacy</span>
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

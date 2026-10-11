'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api, PaymentOrder } from '@/lib/api';

interface PaymentMethodItem {
  id: 'duitnow_qr' | 'tng_ewallet';
  label: string;
  tagline: string;
  desc: string;
  badge: string;
  badgeColor: string;
  accentColor: string;
  bgColor: string;
  borderColor: string;
  supportedApps: string[];
  icon: React.ReactNode;
}

const paymentMethods: PaymentMethodItem[] = [
  {
    id: 'duitnow_qr',
    label: 'DuitNow QR',
    tagline: 'National QR Standard',
    desc: 'Pay instantly using ANY Malaysian banking app (MAE Maybank, CIMB, Bank Islam, RHB, etc.) or supported e-wallets.',
    badge: 'National QR • Zero Fees',
    badgeColor: '#EC4899',
    accentColor: '#ED0278',
    bgColor: '#FDF2F8',
    borderColor: '#FBCFE8',
    supportedApps: ['Maybank MAE', 'CIMB Octo', 'Bank Islam', 'RHB Now', 'Public Bank', 'Hong Leong'],
    icon: (
      <div className="w-11 h-11 rounded-2xl bg-[#ED0278] flex items-center justify-center shadow-md shadow-[#ED0278]/25 flex-shrink-0">
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </div>
    ),
  },
  {
    id: 'tng_ewallet',
    label: "Touch 'n Go eWallet",
    tagline: "Malaysia's #1 e-Wallet",
    desc: 'Pay directly via your Touch \'n Go eWallet balance with instant mobile app redirection or dynamic QR scan.',
    badge: 'Direct e-Wallet • Instant',
    badgeColor: '#0284C7',
    accentColor: '#005BAC',
    bgColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    supportedApps: ['Touch \'n Go eWallet App', 'RFID / PayDirect', 'HitPay Checkout'],
    icon: (
      <div className="w-11 h-11 rounded-2xl bg-[#005BAC] flex items-center justify-center shadow-md shadow-[#005BAC]/25 flex-shrink-0">
        <span className="text-white font-black text-sm tracking-tight">TNG</span>
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

  const [selectedMethod, setSelectedMethod] = useState<'duitnow_qr' | 'tng_ewallet'>('duitnow_qr');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [copiedRef, setCopiedRef] = useState(false);

  // Active Payment Order State (Cashless Remittance Modal)
  const [activeOrder, setActiveOrder] = useState<PaymentOrder | null>(null);
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins (900 seconds)
  const [authorizing, setAuthorizing] = useState(false);
  const [authStep, setAuthStep] = useState<string>('');

  const handleAuthorizeSandboxPayment = async () => {
    if (!activeOrder) return;
    setAuthorizing(true);
    setError('');
    const isTng = activeOrder.payment_method === 'tng_ewallet';
    setAuthStep(
      isTng
        ? "Connecting to Touch 'n Go eWallet & Verifying PIN..."
        : "Authorizing bank transfer via DuitNow PayNet Rail..."
    );

    try {
      await new Promise((r) => setTimeout(r, 650));
      setAuthStep("Deducting eWallet balance & confirming transaction...");
      await api.sandboxCompletePayment(activeOrder.reference_code);
      setAuthStep("Payment Approved! Activating Meal Plan...");
      await new Promise((r) => setTimeout(r, 450));
      router.push(
        `/dashboard/payment-success?price=${activeOrder.amount_myr}&credits=${activeOrder.credits}&name=${encodeURIComponent(
          activeOrder.plan_name
        )}&reference_code=${encodeURIComponent(activeOrder.reference_code)}&method=${encodeURIComponent(
          activeOrder.payment_method
        )}`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment authorization failed. Please try again.';
      setError(msg);
      setAuthorizing(false);
      setAuthStep('');
    }
  };

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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to initiate payment. Please try again.';
      setError(msg);
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
          setError('Payment session timed out. Please initiate a fresh order.');
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
            `/dashboard/payment-success?price=${activeOrder.amount_myr}&credits=${activeOrder.credits}&name=${encodeURIComponent(
              activeOrder.plan_name
            )}&reference_code=${encodeURIComponent(activeOrder.reference_code)}&method=${encodeURIComponent(
              activeOrder.payment_method
            )}`
          );
        }
      } catch {
        // Silently tolerate transient polling connection hiccups
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [activeOrder, router]);

  const copyReferenceCode = () => {
    if (!activeOrder) return;
    navigator.clipboard.writeText(activeOrder.reference_code);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const perMeal = (parseFloat(price) / (parseInt(credits) || 1)).toFixed(2);
  const activeMethodObj = paymentMethods.find((m) => m.id === selectedMethod) || paymentMethods[0];

  return (
    <div className="min-h-full bg-[#F5F7F5] pb-24 lg:pb-12" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-xl mx-auto px-4 sm:px-6 pt-6">
        {/* Navigation & Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-white rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
            aria-label="Back to plans"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-gray-900 font-extrabold text-2xl tracking-tight">Checkout</h1>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-200">
                Sandbox Live
              </span>
            </div>
            <p className="text-gray-500 text-xs">Fast & Secure Malaysian Payment Powered by HitPay</p>
          </div>
        </div>

        {/* Selected Plan Summary Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-2xl -z-0 opacity-70" />
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-[11px] font-bold tracking-widest uppercase text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 inline-block mb-1.5">
                  Subscription Package
                </span>
                <h2 className="text-gray-900 font-extrabold text-xl">{planName}</h2>
              </div>
              <div className="text-right">
                <span className="text-gray-900 font-black text-3xl tracking-tight">
                  RM{parseFloat(price).toFixed(2)}
                </span>
                <p className="text-[11px] text-gray-400 font-medium">Billed monthly</p>
              </div>
            </div>

            {/* Plan Perks Pill Grid */}
            <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-gray-100">
              <div className="bg-gray-50/80 rounded-2xl p-2.5 text-center border border-gray-100">
                <p className="text-[11px] text-gray-400 font-medium">Allowance</p>
                <p className="text-sm font-bold text-gray-800">{credits} Meals</p>
              </div>
              <div className="bg-gray-50/80 rounded-2xl p-2.5 text-center border border-gray-100">
                <p className="text-[11px] text-gray-400 font-medium">Rate / Meal</p>
                <p className="text-sm font-bold text-gray-800">RM{perMeal}</p>
              </div>
              <div className="bg-gray-50/80 rounded-2xl p-2.5 text-center border border-gray-100">
                <p className="text-[11px] text-gray-400 font-medium">Validity</p>
                <p className="text-sm font-bold text-gray-800">30 Days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods Section (STRICTLY TWO OPTIONS: DuitNow QR & Touch 'n Go eWallet) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h3 className="text-gray-900 font-bold text-base">Select Payment Method</h3>
              <p className="text-xs text-gray-500">Choose between Malaysia&apos;s two most popular payment rails</p>
            </div>
            <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
              2 Methods Available
            </span>
          </div>

          <div className="space-y-3.5">
            {paymentMethods.map((m) => {
              const isSelected = selectedMethod === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMethod(m.id)}
                  role="button"
                  tabIndex={0}
                  className={`p-5 rounded-3xl border-2 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-[#3ECBA0] bg-white shadow-lg shadow-emerald-500/5 ring-4 ring-[#3ECBA0]/10'
                      : 'border-gray-200/90 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {m.icon}

                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-gray-900 font-bold text-base">{m.label}</span>
                        {m.badge && (
                          <span
                            className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border"
                            style={{
                              background: m.bgColor,
                              color: m.accentColor,
                              borderColor: m.borderColor,
                            }}
                          >
                            {m.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-xs leading-relaxed mb-3">{m.desc}</p>

                      {/* Supported Bank / App Pills */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-gray-400 font-semibold mr-1">Supported:</span>
                        {m.supportedApps.map((app) => (
                          <span
                            key={app}
                            className="text-[10px] font-medium text-gray-600 bg-gray-100/80 px-2 py-0.5 rounded-md border border-gray-200/60"
                          >
                            {app}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Radio Checkmark */}
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all mt-0.5 flex-shrink-0 ${
                        isSelected ? 'border-[#3ECBA0] bg-[#3ECBA0]' : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pricing Breakdown Card */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-sm mb-6 space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Meal Plan Subscription ({planName})</span>
            <span className="font-semibold text-gray-800">RM{parseFloat(price).toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <span>HitPay Gateway & Remittance Fee</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold">100% Free</span>
            </span>
            <span className="font-semibold text-emerald-600">RM 0.00</span>
          </div>
          <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium">Total Amount Due</p>
              <p className="text-gray-900 font-extrabold text-xl tracking-tight">RM{parseFloat(price).toFixed(2)}</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-xl border border-gray-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Selected: <strong className="text-gray-800">{activeMethodObj.label}</strong>
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 text-xs mb-5 flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="leading-relaxed font-medium">{error}</span>
          </div>
        )}

        {/* Primary Checkout CTA */}
        <button
          onClick={handleInitiatePayment}
          disabled={processing}
          className="w-full bg-[#3ECBA0] hover:bg-[#2DAF87] active:scale-[0.99] text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-[#3ECBA0]/25 transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 text-base"
        >
          {processing ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Generating Secure Payment Request...</span>
            </>
          ) : (
            <>
              <span>
                Pay RM{parseFloat(price).toFixed(2)} with {activeMethodObj.label}
              </span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>

        {/* Security & Regulatory Standard Badges */}
        <div className="mt-6 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="font-medium text-gray-500">256-Bit SSL Encrypted • Bank Negara Malaysia Interoperable</span>
          </div>
          <p className="text-[11px] text-gray-400">
            Compliant with PayNet Malaysia DuitNow standard & HitPay Malaysia Payment Gateway
          </p>
        </div>
      </div>

      {/* ── Seamless Remittance Overlay (Cashless QR & Checkout Experience) ─── */}
      {activeOrder && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 sm:p-7 text-center animate-in fade-in zoom-in-95 duration-200 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">Awaiting Payment</span>
              </div>
              <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold font-mono border border-amber-200">
                <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{timeFormatted}</span>
              </div>
            </div>

            {/* Method Banner Badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold mb-4"
              style={{
                backgroundColor: activeOrder.payment_method === 'tng_ewallet' ? '#F0F9FF' : '#FDF2F8',
                borderColor: activeOrder.payment_method === 'tng_ewallet' ? '#BAE6FD' : '#FBCFE8',
                color: activeOrder.payment_method === 'tng_ewallet' ? '#005BAC' : '#ED0278',
              }}
            >
              <span>{activeOrder.payment_method === 'tng_ewallet' ? "Touch 'n Go eWallet" : "DuitNow QR"}</span>
              <span className="text-[10px] bg-white/80 px-1.5 py-0.5 rounded">HitPay Secure Rail</span>
            </div>

            {/* QR Code Card */}
            <div className="bg-[#FAFAFA] rounded-3xl p-5 border border-gray-200/90 shadow-inner mb-4 inline-block w-full">
              {activeOrder.qr_image_url ? (
                <div className="relative inline-block bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm">
                  <img
                    src={activeOrder.qr_image_url}
                    alt="Payment QR"
                    className="w-52 h-52 mx-auto object-contain rounded-lg"
                  />
                  {/* Watermark in center of QR */}
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center shadow-md border-2 border-white"
                    style={{
                      backgroundColor: activeOrder.payment_method === 'tng_ewallet' ? '#005BAC' : '#ED0278',
                    }}
                  >
                    {activeOrder.payment_method === 'tng_ewallet' ? (
                      <span className="text-white font-black text-[10px]">TNG</span>
                    ) : (
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-52 h-52 mx-auto flex items-center justify-center text-gray-400 bg-white rounded-2xl border border-gray-200">
                  Loading QR Code...
                </div>
              )}

              {/* Reference Number with 1-click Copy */}
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="text-[11px] font-mono text-gray-600 bg-white px-2.5 py-1 rounded-lg border border-gray-200 font-medium">
                  Ref: {activeOrder.reference_code}
                </span>
                <button
                  onClick={copyReferenceCode}
                  className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
                >
                  {copiedRef ? 'Copied!' : 'Copy Ref'}
                </button>
              </div>
            </div>

            {/* Amount & Plan Details */}
            <div className="mb-4">
              <div className="text-3xl font-black text-gray-900 tracking-tight">
                RM{activeOrder.amount_myr.toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {activeOrder.plan_name} • <span className="font-bold text-emerald-600">{activeOrder.credits} Meal Credits</span>
              </p>
            </div>

            {/* Real-time Polling Listener Notice */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 mb-4 flex items-center gap-2.5 text-left text-xs text-emerald-800">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping flex-shrink-0" />
              <p className="text-[11px] leading-relaxed">
                Listening for your payment confirmation in real time. Do not close this window.
              </p>
            </div>

            {/* Authentic Sandbox Clearance Card */}
            {activeOrder.payment_method === 'tng_ewallet' ? (
              <div className="bg-[#005BAC]/5 border border-[#005BAC]/20 rounded-2xl p-4 mb-3 text-left">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#005BAC] flex items-center justify-center text-white font-black text-xs">
                      TNG
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 leading-tight">Touch &apos;n Go Express Checkout</p>
                      <p className="text-[10px] text-gray-500">HitPay Sandbox Test Mode</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#005BAC] bg-[#005BAC]/10 px-2 py-0.5 rounded-full">
                    Ready to Authorize
                  </span>
                </div>
                
                <div className="bg-white rounded-xl p-2.5 border border-gray-100 mb-3 space-y-1 text-[11px] text-gray-600">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Merchant</span>
                    <span className="font-semibold text-gray-800">Makanan Campus Dining</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Deduction</span>
                    <span className="font-extrabold text-[#005BAC]">RM{activeOrder.amount_myr.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Account</span>
                    <span className="font-medium text-gray-600">eWallet Balance (+60 1X-*** 8892)</span>
                  </div>
                </div>

                <button
                  onClick={handleAuthorizeSandboxPayment}
                  disabled={authorizing}
                  className="w-full bg-[#005BAC] hover:bg-[#004B8D] active:scale-[0.99] text-white font-bold py-3.5 rounded-xl text-xs transition-all shadow-md shadow-[#005BAC]/20 flex items-center justify-center gap-2 disabled:opacity-75"
                >
                  {authorizing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="font-semibold">{authStep}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Authorize RM{activeOrder.amount_myr.toFixed(2)} with Touch &apos;n Go eWallet</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="bg-[#ED0278]/5 border border-[#ED0278]/20 rounded-2xl p-4 mb-3 text-left">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#ED0278] flex items-center justify-center text-white">
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 leading-tight">DuitNow Bank Clearance</p>
                      <p className="text-[10px] text-gray-500">National PayNet Rail (Sandbox)</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#ED0278] bg-[#ED0278]/10 px-2 py-0.5 rounded-full">
                    Scan &amp; Pay Ready
                  </span>
                </div>

                <button
                  onClick={handleAuthorizeSandboxPayment}
                  disabled={authorizing}
                  className="w-full bg-[#ED0278] hover:bg-[#D0026A] active:scale-[0.99] text-white font-bold py-3.5 rounded-xl text-xs transition-all shadow-md shadow-[#ED0278]/20 flex items-center justify-center gap-2 disabled:opacity-75"
                >
                  {authorizing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="font-semibold">{authStep}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Authorize RM{activeOrder.amount_myr.toFixed(2)} via DuitNow (MAE/CIMB)</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* HitPay Hosted Checkout Link */}
            {activeOrder.checkout_url && (
              <a
                href={activeOrder.checkout_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-white hover:bg-gray-50 text-gray-600 font-medium py-2.5 rounded-xl text-xs border border-gray-200 transition-all flex items-center justify-center gap-1.5 mb-1.5"
              >
                <span>Open HitPay Hosted Checkout</span>
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}

            {/* Cancel Button */}
            <button
              onClick={() => {
                setActiveOrder(null);
                setAuthorizing(false);
                setAuthStep('');
              }}
              disabled={authorizing}
              className="w-full text-xs text-gray-400 hover:text-gray-600 font-semibold py-1.5 transition-colors"
            >
              Cancel and change payment method
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading payment options...</div>}>
      <PaymentContent />
    </Suspense>
  );
}

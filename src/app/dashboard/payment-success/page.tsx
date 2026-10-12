'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const sessionId =
    searchParams?.get('reference_code') ||
    searchParams?.get('reference') ||
    searchParams?.get('session_id') ||
    searchParams?.get('ref') ||
    '';

  const price = searchParams?.get('price') || '0';
  const credits = searchParams?.get('credits') || '0';
  const planName = searchParams?.get('name') || 'Meal Plan';
  const paymentMethod = searchParams?.get('method') || '';

  const [verifying, setVerifying] = useState(!!sessionId);
  const [verified, setVerified] = useState(!sessionId);
  const [verifyError, setVerifyError] = useState('');
  const [paymentDetails, setPaymentDetails] = useState<{
    amount_myr?: number;
    credits?: number;
    plan_name?: string;
    payment_method?: string;
  } | null>(null);

  useEffect(() => {
    if (!sessionId || !user) {
      setVerifying(false);
      setVerified(true);
      return;
    }

    const verifyPayment = async () => {
      try {
        let attempts = 0;
        const maxAttempts = 6;

        while (attempts < maxAttempts) {
          try {
            const status = await api.getPaymentStatus(sessionId);
            if (status.status === 'completed') {
              setPaymentDetails({
                amount_myr: status.amount_myr,
                credits: status.credits,
                plan_name: status.plan_name,
                payment_method: status.payment_method,
              });
              setVerified(true);
              setVerifying(false);
              return;
            }
          } catch {
            // keep waiting
          }
          attempts++;
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }

        setVerified(true);
        setVerifying(false);
      } catch (err) {
        console.error('Verification error:', err);
        setVerifyError('Payment received. Your subscription will be activated shortly.');
        setVerified(true);
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId, user]);

  if (verifying) {
    return (
      <div className="min-h-full bg-white flex flex-col items-center justify-center px-5">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#EBF9F4] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#3ECBA0] animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
          <h2 className="text-[#1A1A1A] font-bold text-xl mb-2">Activating your plan...</h2>
          <p className="text-[#6B7280] text-sm">Please wait while we confirm your payment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white lg:bg-[#F5F7F5] flex flex-col">
      <div className="flex items-center gap-3 px-5 pt-6 pb-2 lg:px-8 lg:pt-8">
        <span className="text-2xl">🎉</span>
        <h1 className="text-[#1A1A1A] font-bold text-xl">Payment Successful</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 lg:px-8 py-8">
        <div className="w-full max-w-sm mx-auto">
          {/* Checkmark animation */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-36 h-36 bg-[#EBF9F4] rounded-full flex items-center justify-center">
                <div className="w-28 h-28 bg-[#D4F0E4] rounded-full flex items-center justify-center">
                  <svg
                    className="w-14 h-14 text-[#3ECBA0]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              {[
                'top-0 left-1/2 -translate-x-1/2 -translate-y-3',
                'bottom-0 left-1/2 -translate-x-1/2 translate-y-3',
                'left-0 top-1/2 -translate-y-1/2 -translate-x-3',
                'right-0 top-1/2 -translate-y-1/2 translate-x-3',
                'top-2 right-2 translate-x-1 -translate-y-1',
                'bottom-2 left-2 -translate-x-1 translate-y-1',
              ].map((pos, i) => (
                <div
                  key={i}
                  className={`absolute ${pos} w-1.5 h-1.5 bg-[#3ECBA0] rounded-full opacity-60`}
                />
              ))}
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-[#1A1A1A] font-bold text-3xl mb-2">You&apos;re all set!</h2>
            <p className="text-[#6B7280] text-base">Your meal plan is now active.</p>
            {verifyError && (
              <p className="text-amber-600 text-sm mt-2 bg-amber-50 rounded-xl px-3 py-2">
                {verifyError}
              </p>
            )}
          </div>

          {/* Plan summary card */}
          {(() => {
            const displayPrice = paymentDetails?.amount_myr != null
              ? paymentDetails.amount_myr.toFixed(2)
              : parseFloat(price || '0').toFixed(2);
            const displayCredits = paymentDetails?.credits ?? (credits || '0');
            const displayPlanName = paymentDetails?.plan_name || planName || 'Meal Plan';
            const displayMethod = paymentDetails?.payment_method || paymentMethod || 'tng_ewallet';
            const isTng = displayMethod === 'tng_ewallet';

            return (
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-8">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                  <h3 className="text-gray-900 font-bold text-sm">
                    Payment Receipt
                  </h3>
                  <span
                    className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: isTng ? '#F0F9FF' : '#FDF2F8',
                      color: isTng ? '#005BAC' : '#ED0278',
                      borderColor: isTng ? '#BAE6FD' : '#FBCFE8',
                    }}
                  >
                    {isTng ? "Touch 'n Go eWallet" : "DuitNow QR"}
                  </span>
                </div>

                <div className="flex items-center justify-center gap-8 mb-4">
                  <div className="text-center">
                    <p className="text-gray-400 text-xs mb-1">Amount Paid</p>
                    <p className="text-gray-900 font-extrabold text-3xl">RM{displayPrice}</p>
                  </div>
                  <div className="w-px h-12 bg-gray-100" />
                  <div className="text-center">
                    <p className="text-gray-400 text-xs mb-1">Meals Credited</p>
                    <p className="text-[#3ECBA0] font-extrabold text-3xl">{displayCredits}</p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-gray-500">
                    <span>Plan:</span>
                    <span className="font-semibold text-gray-800">{displayPlanName}</span>
                  </div>
                  {sessionId && (
                    <div className="flex items-center justify-between text-gray-500 font-mono text-[11px]">
                      <span>Reference:</span>
                      <span className="font-medium text-gray-700">{sessionId}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-1.5 pt-2 text-[#3ECBA0]">
                    <svg
                      className="w-4 h-4 text-[#3ECBA0]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs font-bold">
                      {displayCredits} meals active in wallet
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Action buttons */}
          <div className="space-y-3">
            <Link
              href="/dashboard/wallet"
              className="block w-full bg-[#3ECBA0] text-white font-bold py-4 rounded-2xl text-center hover:bg-[#2DAF87] transition-colors text-base"
            >
              View My Wallet
            </Link>
            <Link
              href="/dashboard"
              className="block w-full border-2 border-[#3ECBA0] text-[#3ECBA0] font-bold py-4 rounded-2xl text-center hover:bg-[#EBF9F4] transition-colors text-base"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[#9CA3AF]">Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}

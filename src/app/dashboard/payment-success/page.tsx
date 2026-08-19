'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const price = searchParams?.get('price') || '0';
  const credits = searchParams?.get('credits') || '0';
  const planName = searchParams?.get('name') || 'Meal Plan';

  return (
    <div className="min-h-full bg-white lg:bg-[#F5F7F5] flex flex-col">
      {/* ── Mobile header ── */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-2 lg:px-8 lg:pt-8">
        <span className="text-2xl">👋</span>
        <h1 className="text-[#1A1A1A] font-bold text-xl">Payment Success</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 lg:px-8 py-8">
        <div className="w-full max-w-sm mx-auto">
          {/* Checkmark animation */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              {/* Outer glow ring */}
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
              {/* Sparkle lines */}
              {[
                'top-0 left-1/2 -translate-x-1/2 -translate-y-3',
                'bottom-0 left-1/2 -translate-x-1/2 translate-y-3',
                'left-0 top-1/2 -translate-y-1/2 -translate-x-3',
                'right-0 top-1/2 -translate-y-1/2 translate-x-3',
                'top-2 right-2 translate-x-1 -translate-y-1',
                'bottom-2 left-2 -translate-x-1 translate-y-1',
              ]?.map((pos, i) => (
                <div
                  key={i}
                  className={`absolute ${pos} w-1.5 h-1.5 bg-[#3ECBA0] rounded-full opacity-60`}
                />
              ))}
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h2 className="text-[#1A1A1A] font-bold text-3xl mb-2">You&apos;re all set!</h2>
            <p className="text-[#6B7280] text-base">Your meal plan is now active.</p>
          </div>

          {/* Plan summary card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-8">
            <h3 className="text-[#1A1A1A] font-bold text-base text-center mb-4">Meal Plan Summary</h3>
            <div className="flex items-center justify-center gap-8 mb-4">
              <div className="text-center">
                <p className="text-[#1A1A1A] font-bold text-3xl">RM{price}</p>
              </div>
              <div className="text-center">
                <p className="text-[#1A1A1A] font-bold text-3xl">{credits} Meals</p>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4 text-center">
              <p className="text-[#6B7280] text-sm">{credits} meals available</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Link
              href="/dashboard/wallet"
              className="block w-full bg-[#3ECBA0] text-white font-bold py-4 rounded-2xl text-center hover:bg-[#2DAF87] transition-colors text-base"
            >
              View My Plan
            </Link>
            <Link
              href="/dashboard"
              className="block w-full border-2 border-[#3ECBA0] text-[#3ECBA0] font-bold py-4 rounded-2xl text-center hover:bg-[#EBF9F4] transition-colors text-base"
            >
              Go to Home
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

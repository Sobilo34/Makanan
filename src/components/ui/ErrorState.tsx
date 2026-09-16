'use client';

import React from 'react';

interface ErrorStateProps {
  variant:
    | 'network-unavailable'
    | 'payment-failed'
    | 'redemption-failed'
    | 'session-expired'
    | 'server-error';
  title?: string;
  description?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  className?: string;
}

const variants: Record<
  ErrorStateProps['variant'],
  {
    icon: React.ReactNode;
    title: string;
    description: string;
    primaryLabel: string;
    secondaryLabel: string;
  }
> = {
  'network-unavailable': {
    icon: (
      <svg
        className="w-8 h-8 text-[#E57373]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M12 12h.01M3 3l18 18"
        />
      </svg>
    ),
    title: 'No internet connection',
    description: 'Please check your network settings and try again.',
    primaryLabel: 'Try Again',
    secondaryLabel: 'Go Back',
  },
  'payment-failed': {
    icon: (
      <svg
        className="w-8 h-8 text-[#E57373]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
        />
      </svg>
    ),
    title: 'Payment failed',
    description: "We couldn't process your payment. Please check your details and try again.",
    primaryLabel: 'Try Again',
    secondaryLabel: 'Go Back',
  },
  'redemption-failed': {
    icon: (
      <svg
        className="w-8 h-8 text-[#E57373]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
        />
      </svg>
    ),
    title: 'Something went wrong',
    description: "We couldn't complete your redemption. Please try again or contact support.",
    primaryLabel: 'Try Again',
    secondaryLabel: 'Go Back',
  },
  'session-expired': {
    icon: (
      <svg
        className="w-8 h-8 text-[#E57373]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    title: 'Session expired',
    description: 'Your session has timed out for security. Please sign in again to continue.',
    primaryLabel: 'Sign In Again',
    secondaryLabel: '',
  },
  'server-error': {
    icon: (
      <svg
        className="w-8 h-8 text-[#E57373]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
        />
      </svg>
    ),
    title: 'Something went wrong',
    description: "We're having trouble connecting to our servers. Please try again in a moment.",
    primaryLabel: 'Try Again',
    secondaryLabel: 'Go Back',
  },
};

export default function ErrorState({
  variant,
  title,
  description,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  className = '',
}: ErrorStateProps) {
  const config = variants[variant];
  const displayTitle = title ?? config.title;
  const displayDesc = description ?? config.description;
  const displayPrimary = primaryLabel !== undefined ? primaryLabel : config.primaryLabel;
  const displaySecondary = secondaryLabel !== undefined ? secondaryLabel : config.secondaryLabel;

  return (
    <div
      className={`flex flex-col items-center justify-center py-14 px-6 text-center ${className}`}
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* Icon container — subtle warm tint, not alarming */}
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
        {config.icon}
      </div>

      {/* Text */}
      <h3 className="text-base font-semibold text-[#111827] mb-1.5">{displayTitle}</h3>
      <p className="text-sm text-[#6B7280] max-w-xs leading-relaxed">{displayDesc}</p>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-5 flex-wrap justify-center">
        {displayPrimary && onPrimary && (
          <button
            onClick={onPrimary}
            className="px-5 py-2.5 rounded-xl bg-[#3ECBA0] text-white text-sm font-semibold hover:bg-[#2DAF87] transition-colors shadow-sm"
          >
            {displayPrimary}
          </button>
        )}
        {displaySecondary && onSecondary && (
          <button
            onClick={onSecondary}
            className="px-5 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors"
          >
            {displaySecondary}
          </button>
        )}
      </div>
    </div>
  );
}

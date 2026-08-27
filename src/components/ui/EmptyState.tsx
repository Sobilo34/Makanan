'use client';

import React from 'react';

interface EmptyStateProps {
  variant:
    | 'no-meals' |'no-orders' |'no-notifications' |'no-payment-history' |'no-redemption-history' |'no-search-results' |'no-active-meal-plan';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const variants: Record<
  EmptyStateProps['variant'],
  { icon: React.ReactNode; title: string; description: string; actionLabel: string }
> = {
  'no-meals': {
    icon: (
      <svg className="w-8 h-8 text-[#3ECBA0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    title: 'No meals available',
    description: 'There are no meals to display right now. Check back later or explore other partners.',
    actionLabel: 'Browse Partners',
  },
  'no-orders': {
    icon: (
      <svg className="w-8 h-8 text-[#3ECBA0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    title: 'No orders yet',
    description: 'You haven\'t placed any orders. Start by choosing a meal plan that works for you.',
    actionLabel: 'View Meal Plans',
  },
  'no-notifications': {
    icon: (
      <svg className="w-8 h-8 text-[#3ECBA0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    title: 'No notifications',
    description: 'You\'re all caught up. New notifications about your meals and orders will appear here.',
    actionLabel: '',
  },
  'no-payment-history': {
    icon: (
      <svg className="w-8 h-8 text-[#3ECBA0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    title: 'No payment history',
    description: 'Your payment records will appear here once you subscribe to a meal plan.',
    actionLabel: 'Get a Meal Plan',
  },
  'no-redemption-history': {
    icon: (
      <svg className="w-8 h-8 text-[#3ECBA0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    title: 'No redemption history',
    description: 'You haven\'t redeemed any meals yet. Use your meal plan to redeem meals at partner restaurants.',
    actionLabel: 'Redeem a Meal',
  },
  'no-search-results': {
    icon: (
      <svg className="w-8 h-8 text-[#3ECBA0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    title: 'No meals found',
    description: 'Try changing your search or filter to find what you\'re looking for.',
    actionLabel: 'Clear Filters',
  },
  'no-active-meal-plan': {
    icon: (
      <svg className="w-8 h-8 text-[#3ECBA0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    title: 'No active meal plan',
    description: 'You don\'t have an active meal plan. Choose a plan to start enjoying meals at partner restaurants.',
    actionLabel: 'View Plans',
  },
};

export default function EmptyState({
  variant,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  const config = variants[variant];
  const displayTitle = title ?? config.title;
  const displayDesc = description ?? config.description;
  const displayAction = actionLabel !== undefined ? actionLabel : config.actionLabel;

  return (
    <div
      className={`flex flex-col items-center justify-center py-14 px-6 text-center ${className}`}
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* Icon container */}
      <div className="w-16 h-16 rounded-2xl bg-[#E8F7EF] flex items-center justify-center mb-4">
        {config.icon}
      </div>

      {/* Text */}
      <h3 className="text-base font-semibold text-[#111827] mb-1.5">{displayTitle}</h3>
      <p className="text-sm text-[#6B7280] max-w-xs leading-relaxed">{displayDesc}</p>

      {/* Optional action */}
      {displayAction && onAction && (
        <button
          onClick={onAction}
          className="mt-5 px-5 py-2.5 rounded-xl bg-[#3ECBA0] text-white text-sm font-semibold hover:bg-[#2DAF87] transition-colors shadow-sm"
        >
          {displayAction}
        </button>
      )}
    </div>
  );
}

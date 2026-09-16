'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Subscription {
  id: string;
  credits_total: number;
  credits_used: number;
  status: string;
  starts_at: string;
  expires_at: string;
  meal_plans: { name: string; tier: string; price_myr: number };
}

interface Transaction {
  id: string;
  description: string;
  credits_delta: number;
  balance_after: number;
  created_at: string;
}

const txnIcon = (desc: string, delta: number) => {
  if (desc.toLowerCase().includes('subscription') || desc.toLowerCase().includes('subscribed'))
    return '📋';
  if (desc.toLowerCase().includes('cancelled') || desc.toLowerCase().includes('refund'))
    return '↩️';
  if (delta < 0) return '🍽️';
  if (desc.toLowerCase().includes('top') || desc.toLowerCase().includes('balance')) return '💳';
  return '✨';
};

const txnIconBg = (delta: number) => (delta < 0 ? 'bg-red-50' : 'bg-[#EBF9F4]');

// ── Cancel Confirmation Modal ──────────────────────────────────────────────
interface CancelModalProps {
  subscription: Subscription;
  creditsRemaining: number;
  onConfirm: () => void;
  onClose: () => void;
  cancelling: boolean;
  cancelError: string;
}

function CancelModal({
  subscription,
  creditsRemaining,
  onConfirm,
  onClose,
  cancelling,
  cancelError,
}: CancelModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={!cancelling ? onClose : undefined}
      />
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
        {/* Icon */}
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-7 h-7 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
        </div>

        <h2 className="text-[#1A1A1A] font-bold text-lg text-center mb-1">Cancel Subscription?</h2>
        <p className="text-[#6B7280] text-sm text-center mb-5 leading-relaxed">
          You are about to cancel your{' '}
          <span className="font-semibold text-[#1A1A1A]">{subscription.meal_plans?.name}</span>{' '}
          plan.
        </p>

        {/* Refund info */}
        <div
          className={`rounded-xl p-4 mb-5 border ${creditsRemaining > 0 ? 'bg-[#EBF9F4] border-[#C8F0E4]' : 'bg-gray-50 border-gray-200'}`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{creditsRemaining > 0 ? '💰' : 'ℹ️'}</span>
            <div>
              {creditsRemaining > 0 ? (
                <>
                  <p className="text-[#2DAF87] font-bold text-sm">Instant Wallet Refund</p>
                  <p className="text-[#5A7A6A] text-xs mt-0.5">
                    <span className="font-bold text-[#1A1A1A]">
                      {creditsRemaining} unused meal credit{creditsRemaining !== 1 ? 's' : ''}
                    </span>{' '}
                    will be credited to your wallet immediately.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[#6B7280] font-bold text-sm">No Credits to Refund</p>
                  <p className="text-[#9CA3AF] text-xs mt-0.5">
                    All meal credits have already been used.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {cancelError && (
          <div className="mb-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm flex items-center gap-2">
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {cancelError}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={cancelling}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-[#374151] font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Keep Plan
          </button>
          <button
            onClick={onConfirm}
            disabled={cancelling}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {cancelling ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
                Cancelling...
              </>
            ) : (
              'Yes, Cancel'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Success Toast ──────────────────────────────────────────────────────────
function SuccessToast({
  creditsRefunded,
  onClose,
}: {
  creditsRefunded: number;
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed top-5 inset-x-0 flex justify-center z-50 px-4">
      <div className="bg-[#1A1A1A] text-white rounded-2xl px-5 py-3.5 flex items-center gap-3 shadow-xl max-w-sm w-full">
        <div className="w-8 h-8 bg-[#3ECBA0] rounded-full flex items-center justify-center flex-shrink-0">
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm">Subscription Cancelled</p>
          {creditsRefunded > 0 && (
            <p className="text-[#9CA3AF] text-xs mt-0.5">
              {creditsRefunded} credit{creditsRefunded !== 1 ? 's' : ''} refunded to your wallet
            </p>
          )}
        </div>
        <button onClick={onClose} className="text-[#9CA3AF] hover:text-white transition-colors">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function WalletPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [successRefund, setSuccessRefund] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const supabase = createClient();
      try {
        const [subRes, txnRes] = await Promise.all([
          supabase
            .from('subscriptions')
            .select('*, meal_plans(name, tier, price_myr)')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('wallet_transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20),
        ]);
        setSubscription(subRes?.data || null);
        setTransactions(txnRes?.data || []);
      } catch (err) {
        console.log('Wallet fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Real-time: update wallet when subscription or transactions change
    const supabase = createClient();
    const channel = supabase
      .channel(`student-wallet-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && (payload.new as any).status !== 'active') {
            // Subscription was cancelled/expired — remove from state
            setSubscription(null);
          } else if (payload.new) {
            setSubscription((prev) => (prev ? { ...prev, ...(payload.new as any) } : null));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wallet_transactions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setTransactions((prev) => [payload.new as any, ...prev.slice(0, 19)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const creditsRemaining = subscription
    ? subscription.credits_total - subscription.credits_used
    : 0;
  const progressPct = subscription
    ? Math.round((creditsRemaining / subscription.credits_total) * 100)
    : 0;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const formatTxnDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) +
    ' • ' +
    new Date(dateStr).toLocaleTimeString('en-MY', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const handleCancelConfirm = async () => {
    if (!user || !subscription) return;
    setCancelling(true);
    setCancelError('');

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('cancel_subscription_with_refund', {
        p_subscription_id: subscription.id,
        p_user_id: user.id,
      });

      if (error) {
        setCancelError(error.message || 'Cancellation failed. Please try again.');
        setCancelling(false);
        return;
      }

      const result = data as { success: boolean; error?: string; credits_refunded?: number };
      if (!result?.success) {
        setCancelError(result?.error || 'Cancellation failed. Please try again.');
        setCancelling(false);
        return;
      }

      // Success — update local state immediately (real-time will also fire)
      setSubscription(null);
      setShowCancelModal(false);
      setSuccessRefund(result.credits_refunded ?? 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cancellation failed. Please try again.';
      setCancelError(msg);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F5F7F5] pb-8">
      {/* Success toast */}
      {successRefund !== null && (
        <SuccessToast creditsRefunded={successRefund} onClose={() => setSuccessRefund(null)} />
      )}

      {/* Cancel confirmation modal */}
      {showCancelModal && subscription && (
        <CancelModal
          subscription={subscription}
          creditsRemaining={creditsRemaining}
          onConfirm={handleCancelConfirm}
          onClose={() => {
            setShowCancelModal(false);
            setCancelError('');
          }}
          cancelling={cancelling}
          cancelError={cancelError}
        />
      )}

      {/* ── Mobile header ── */}
      <div className="lg:hidden flex items-center justify-between px-5 pt-6 pb-4">
        <h1 className="text-[#1A1A1A] font-bold text-2xl">Wallet</h1>
        <button className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center relative shadow-sm">
          <svg
            className="w-5 h-5 text-[#6B7280]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#3ECBA0] rounded-full border-2 border-white" />
        </button>
      </div>

      {/* ── Desktop header ── */}
      <div className="hidden lg:flex items-center justify-between px-8 pt-8 pb-6">
        <div>
          <h1 className="text-[#1A1A1A] font-bold text-2xl">Wallet</h1>
          <p className="text-[#9CA3AF] text-sm mt-0.5">Manage your balance and meal plan</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/plans')}
          className="flex items-center gap-2 bg-[#3ECBA0] text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-[#2DAF87] transition-colors shadow-sm"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Balance
        </button>
      </div>

      <div className="px-5 lg:px-8">
        {/* ── Desktop: 3-col layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Left + Center (main content) ── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Available Balance Card */}
            <div className="bg-[#EBF9F4] rounded-2xl p-5 flex items-center justify-between overflow-hidden relative">
              <div className="absolute right-0 top-0 bottom-0 w-36 opacity-30 pointer-events-none select-none flex items-center justify-center">
                <div className="text-8xl">💰</div>
              </div>
              <div className="relative z-10">
                <p className="text-[#5A7A6A] text-sm font-medium mb-1">Available Balance</p>
                <p className="text-[#2DAF87] font-bold text-4xl leading-none mb-2">
                  RM<span className="text-2xl">0.00</span>
                </p>
                <p className="text-[#5A7A6A] text-xs mb-4">
                  Add balance to pay for meal plans and more.
                </p>
                <button
                  onClick={() => router.push('/dashboard/plans')}
                  className="flex items-center gap-2 bg-[#3ECBA0] text-white font-semibold text-sm px-4 py-2 rounded-xl hover:bg-[#2DAF87] transition-colors"
                >
                  Add Balance
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
              <div className="relative z-10 hidden sm:block">
                <div className="w-24 h-24 bg-[#3ECBA0]/20 rounded-2xl flex items-center justify-center">
                  <span className="text-5xl">👛</span>
                </div>
              </div>
            </div>

            {/* Meal Plan Card */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#1A1A1A] font-bold text-base">Meal Plan</h3>
                <Link
                  href="/dashboard/plans"
                  className="text-[#3ECBA0] text-sm font-medium flex items-center gap-1 hover:text-[#2DAF87]"
                >
                  View Plan Details
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {subscription ? (
                <div className="bg-[#F7FDF9] rounded-xl p-4 border border-[#D4F0E4]">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="inline-block bg-[#3ECBA0] text-white text-xs font-bold px-2.5 py-0.5 rounded-full mb-2">
                        Current Plan
                      </span>
                      <h4 className="text-[#1A1A1A] font-bold text-xl leading-tight">
                        {subscription.meal_plans?.name}
                      </h4>
                      <p className="text-[#6B7280] text-sm">{subscription.credits_total} Meals</p>
                    </div>
                    <div className="w-14 h-14 bg-[#EBF9F4] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">🍜</span>
                    </div>
                  </div>

                  <p className="text-[#3ECBA0] font-semibold text-sm mb-2">
                    {creditsRemaining} meals remaining
                  </p>
                  <div className="bg-gray-200 rounded-full h-2.5 mb-1 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#3ECBA0] transition-all duration-700"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="flex justify-end mb-4">
                    <span className="text-[#6B7280] text-xs">{progressPct}%</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#D4F0E4]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-[#EBF9F4] rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-3.5 h-3.5 text-[#3ECBA0]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[#9CA3AF] text-xs">Start Date</p>
                        <p className="text-[#1A1A1A] font-semibold text-xs">
                          {subscription.starts_at ? formatDate(subscription.starts_at) : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-[#EBF9F4] rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-3.5 h-3.5 text-[#3ECBA0]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[#9CA3AF] text-xs">End Date</p>
                        <p className="text-[#1A1A1A] font-semibold text-xs">
                          {formatDate(subscription.expires_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-[#EBF9F4] rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-3.5 h-3.5 text-[#3ECBA0]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[#9CA3AF] text-xs">Daily Limit</p>
                        <p className="text-[#1A1A1A] font-semibold text-xs">1 meal/day</p>
                      </div>
                    </div>
                  </div>

                  {/* Cancel subscription button */}
                  <div className="mt-4 pt-4 border-t border-[#D4F0E4]">
                    <button
                      onClick={() => {
                        setCancelError('');
                        setShowCancelModal(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-red-500 font-semibold text-sm hover:bg-red-50 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Cancel Subscription
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#F7FDF9] rounded-xl p-6 text-center border border-[#D4F0E4]">
                  <div className="w-12 h-12 bg-[#EBF9F4] rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🍜</span>
                  </div>
                  <p className="text-[#1A1A1A] font-bold mb-1">No active plan</p>
                  <p className="text-[#9CA3AF] text-sm mb-4">
                    Subscribe to a meal plan to get started
                  </p>
                  <Link
                    href="/dashboard/plans"
                    className="inline-flex items-center gap-2 bg-[#3ECBA0] text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-[#2DAF87] transition-colors"
                  >
                    Browse Plans
                  </Link>
                </div>
              )}
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#1A1A1A] font-bold text-base">Transaction History</h3>
                <button className="text-[#3ECBA0] text-sm font-medium hover:text-[#2DAF87]">
                  View All
                </button>
              </div>

              {transactions.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-[#9CA3AF] text-sm">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((txn) => (
                    <div key={txn.id} className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${txnIconBg(txn.credits_delta)}`}
                      >
                        <span className="text-lg">
                          {txnIcon(txn.description, txn.credits_delta)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#1A1A1A] text-sm font-semibold truncate">
                          {txn.description}
                        </p>
                        <p className="text-[#9CA3AF] text-xs">{formatTxnDate(txn.created_at)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p
                          className={`font-bold text-sm ${txn.credits_delta < 0 ? 'text-[#DC2626]' : 'text-[#3ECBA0]'}`}
                        >
                          {txn.credits_delta > 0 ? '+' : ''}
                          {txn.credits_delta} credits
                        </p>
                        <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-[#EBF9F4] text-[#2DAF87]">
                          Completed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#1A1A1A] font-bold text-base">Payment Methods</h3>
                <button className="text-[#3ECBA0] text-sm font-medium hover:text-[#2DAF87]">
                  Manage
                </button>
              </div>

              <div className="space-y-3">
                {/* Visa */}
                <div className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-[#3ECBA0]/30 transition-colors cursor-pointer">
                  <div className="w-12 h-8 bg-[#1A1F71] rounded-md flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xs tracking-wider">VISA</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[#1A1A1A] font-semibold text-sm">Visa •••• 4242</p>
                    <p className="text-[#9CA3AF] text-xs">Expires 08/28</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#EBF9F4] text-[#2DAF87]">
                      Default
                    </span>
                    <svg
                      className="w-4 h-4 text-[#9CA3AF]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* Mastercard */}
                <div className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-[#3ECBA0]/30 transition-colors cursor-pointer">
                  <div className="w-12 h-8 rounded-md flex items-center justify-center flex-shrink-0 bg-gray-50">
                    <div className="flex">
                      <div className="w-5 h-5 bg-[#EB001B] rounded-full opacity-90" />
                      <div className="w-5 h-5 bg-[#F79E1B] rounded-full -ml-2.5 opacity-90" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-[#1A1A1A] font-semibold text-sm">Mastercard •••• 8787</p>
                    <p className="text-[#9CA3AF] text-xs">Expires 11/27</p>
                  </div>
                  <svg
                    className="w-4 h-4 text-[#9CA3AF]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Add New */}
                <button className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-dashed border-[#3ECBA0]/50 hover:border-[#3ECBA0] hover:bg-[#F7FDF9] transition-colors">
                  <div className="w-8 h-8 rounded-full border-2 border-[#3ECBA0] flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-[#3ECBA0]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="text-[#3ECBA0] font-semibold text-sm">
                    Add New Payment Method
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Right panel — desktop only ── */}
          <div className="hidden lg:flex flex-col gap-5">
            {/* Quick stats */}
            {subscription && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="text-[#1A1A1A] font-bold text-sm mb-4">Credit Summary</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Total Credits', value: subscription.credits_total, color: '#6B7280' },
                    { label: 'Used', value: subscription.credits_used, color: '#F4B054' },
                    { label: 'Remaining', value: creditsRemaining, color: '#3ECBA0' },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center justify-between">
                      <span className="text-[#6B7280] text-sm">{s.label}</span>
                      <span className="font-bold text-sm" style={{ color: s.color }}>
                        {s.value}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-100">
                    <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#3ECBA0] transition-all duration-700"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <p className="text-[#9CA3AF] text-xs mt-1.5 text-right">
                      {progressPct}% remaining
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="text-[#1A1A1A] font-bold text-sm mb-3">Quick Actions</h3>
              <div className="space-y-1.5">
                <Link
                  href="/dashboard/plans"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F7FDF9] transition-colors"
                >
                  <span className="text-lg">📦</span>
                  <span className="text-[#374151] text-sm font-medium flex-1">Browse Plans</span>
                  <svg
                    className="w-4 h-4 text-[#D0D0D0]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  href="/dashboard/meals"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F7FDF9] transition-colors"
                >
                  <span className="text-lg">🍽️</span>
                  <span className="text-[#374151] text-sm font-medium flex-1">Redeem Meal</span>
                  <svg
                    className="w-4 h-4 text-[#D0D0D0]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  href="/dashboard/orders"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F7FDF9] transition-colors"
                >
                  <span className="text-lg">📋</span>
                  <span className="text-[#374151] text-sm font-medium flex-1">View Orders</span>
                  <svg
                    className="w-4 h-4 text-[#D0D0D0]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Tip */}
            <div className="bg-[#EBF9F4] rounded-2xl p-5 border border-[#C8F0E4]">
              <p className="text-[#2DAF87] font-bold text-sm mb-1">💡 Tip</p>
              <p className="text-[#2DAF87]/80 text-xs leading-relaxed">
                Your meal credits never expire within the plan period. Use them at any partner
                cafeteria.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

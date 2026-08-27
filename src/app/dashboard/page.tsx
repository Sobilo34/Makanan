'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import RedemptionModal from './components/RedemptionModal';

interface Subscription {
  id: string;
  credits_total: number;
  credits_used: number;
  status: string;
  expires_at: string;
  meal_plans: { name: string; tier: string };
}

interface Meal {
  id: string;
  name: string;
  category: string;
  tier: string;
  calories: number;
  rating: number;
  image_url: string;
  availability: string;
  partners: { name: string };
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  meals: { name: string; category: string };
  partners: { name: string };
}

export default function DashboardHome() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [todayMeals, setTodayMeals] = useState<Meal[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [showModal, setShowModal] = useState(false);

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Student';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const greetingEmoji = hour < 12 ? '👋' : hour < 17 ? '☀️' : '🌙';

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const supabase = createClient();
      try {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('*, meal_plans(name, tier)')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        setSubscription(sub);

        const { data: meals } = await supabase
          .from('meals')
          .select('*, partners(id, name)')
          .eq('is_active', true)
          .neq('availability', 'unavailable')
          .limit(4);
        setTodayMeals(meals || []);

        const { data: orders } = await supabase
          .from('redemptions')
          .select('*, meals(name, category), partners(name)')
          .eq('user_id', user.id)
          .order('redeemed_at', { ascending: false })
          .limit(5);
        setRecentOrders(orders || []);
      } catch (err) {
        console.log('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Real-time: update subscription credits when redemption happens
    const supabase = createClient();
    const channel = supabase
      .channel(`student-dashboard-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'subscriptions',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.new) {
          setSubscription((prev) => prev ? { ...prev, ...(payload.new as any) } : null);
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'redemptions',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        // Refresh orders
        supabase
          .from('redemptions')
          .select('*, meals(name, category), partners(name)')
          .eq('user_id', user.id)
          .order('redeemed_at', { ascending: false })
          .limit(5)
          .then(({ data }) => setRecentOrders(data || []));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const creditsRemaining = subscription ? subscription.credits_total - subscription.credits_used : 0;
  const progressPct = subscription ? Math.round((creditsRemaining / subscription.credits_total) * 100) : 0;

  const handleRedeem = (meal: Meal) => {
    setSelectedMeal(meal);
    setShowModal(true);
  };

  const handleRedeemSuccess = () => {
    if (subscription) {
      setSubscription({ ...subscription, credits_used: subscription.credits_used + 1 });
    }
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return { date, time };
  };

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-8 bg-gray-100 rounded-xl w-56 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-48 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  // Fallback meal cards for when no DB data
  const fallbackMeals = [
    { id: 'f1', name: 'Nasi Lemak', category: 'breakfast', image_url: '', partners: { name: 'School Cafeteria' }, tier: '', calories: 0, rating: 0, availability: 'available' },
    { id: 'f2', name: 'Chicken Rice', category: 'lunch', image_url: '', partners: { name: 'School Cafeteria' }, tier: '', calories: 0, rating: 0, availability: 'available' },
    { id: 'f3', name: 'Grilled Chicken Salad', category: 'lunch', image_url: '', partners: { name: 'School Cafeteria' }, tier: '', calories: 0, rating: 0, availability: 'available' },
    { id: 'f4', name: 'Mixed Curry Rice', category: 'dinner', image_url: '', partners: { name: 'School Cafeteria' }, tier: '', calories: 0, rating: 0, availability: 'available' },
  ];
  const displayMeals = todayMeals.length > 0 ? todayMeals.slice(0, 4) : fallbackMeals;

  return (
    <div className="min-h-full bg-[#F5F6FA]">
      <div className="p-6 lg:p-8">
        {/* Header row */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[#6B7280] text-sm mb-0.5">{greeting}, {firstName} {greetingEmoji}</p>
            <h1 className="text-[#1A1A1A] font-bold text-3xl">Dashboard</h1>
          </div>
          {/* Bowl illustration */}
          <div className="hidden lg:block">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="40" cy="58" rx="28" ry="10" fill="#D1F5E8" />
              <path d="M14 44C14 57.255 25.745 68 40 68C54.255 68 66 57.255 66 44H14Z" fill="#3ECBA0" opacity="0.3" />
              <path d="M16 44H64" stroke="#3ECBA0" strokeWidth="2" strokeLinecap="round" />
              <path d="M40 44V20" stroke="#3ECBA0" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M40 20L36 28" stroke="#3ECBA0" strokeWidth="2" strokeLinecap="round" />
              <path d="M40 20L44 28" stroke="#3ECBA0" strokeWidth="2" strokeLinecap="round" />
              <path d="M28 38C28 38 29 32 28 28" stroke="#3ECBA0" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
              <path d="M40 36C40 36 41 30 40 26" stroke="#3ECBA0" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
              <path d="M52 38C52 38 53 32 52 28" stroke="#3ECBA0" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
            </svg>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ── Left / Main column ── */}
          <div className="xl:col-span-2 space-y-6">

            {/* Active Plan Card */}
            {subscription ? (
              <div className="relative overflow-hidden rounded-2xl p-6" style={{ background: '#1a3028' }}>
                {/* Subtle glow */}
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: '#3ECBA0' }} />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-[#3ECBA0] text-xs font-semibold uppercase tracking-widest mb-2">ACTIVE PLAN</p>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-white font-bold text-2xl">{subscription.meal_plans?.name || 'Standard Regular'}</h3>
                        <span className="bg-[#2a4a38] text-[#3ECBA0] text-xs font-semibold px-3 py-1 rounded-full border border-[#3ECBA0]/30">Active</span>
                      </div>
                      <p className="text-white/40 text-sm">{subscription.credits_total} meals total</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#3ECBA0] font-bold leading-none" style={{ fontSize: '3.5rem' }}>{creditsRemaining}</p>
                      <p className="text-white/40 text-sm mt-1">meals left</p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="bg-white/10 rounded-full h-2.5 overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #3ECBA0, #2DAF87)' }}
                    />
                  </div>
                  <div className="flex justify-between text-sm mb-5">
                    <span className="text-white/40">{subscription.credits_used} meals used</span>
                    <span className="text-[#3ECBA0] font-semibold">{progressPct}% remaining</span>
                  </div>
                  <Link
                    href="/dashboard/wallet"
                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold text-sm px-5 py-2.5 rounded-xl border border-white/15 transition-colors"
                  >
                    View Plan Details
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-2xl p-6" style={{ background: '#1a3028' }}>
                <div className="relative z-10">
                  <p className="text-[#3ECBA0] text-xs font-semibold uppercase tracking-widest mb-2">NO ACTIVE PLAN</p>
                  <h3 className="text-white font-bold text-2xl mb-1">Get Started</h3>
                  <p className="text-white/40 text-sm mb-5">Subscribe to start redeeming meals</p>
                  <Link
                    href="/dashboard/plans"
                    className="inline-flex items-center gap-2 bg-[#3ECBA0] hover:bg-[#2DAF87] text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
                  >
                    Browse Plans →
                  </Link>
                </div>
              </div>
            )}

            {/* Today's Meals */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[#1A1A1A] font-bold text-lg">Today&apos;s Meals</h2>
                <Link href="/dashboard/meals" className="text-[#3ECBA0] text-sm font-semibold hover:text-[#2DAF87] transition-colors flex items-center gap-1">
                  See all
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {displayMeals.map((meal) => (
                  <div key={meal.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow flex flex-col">
                    {/* Meal image */}
                    <div className="relative w-full" style={{ paddingTop: '70%' }}>
                      {meal.image_url ? (
                        <img
                          src={meal.image_url}
                          alt={meal.name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#EBF9F4] to-[#C8F0E4] flex items-center justify-center">
                          <svg className="w-10 h-10 text-[#3ECBA0] opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {/* Meal info */}
                    <div className="p-3 flex flex-col flex-1">
                      <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1.5 self-start bg-[#EBF9F4] text-[#3ECBA0]">
                        Meal
                      </span>
                      <p className="text-[#1A1A1A] font-bold text-sm leading-tight mb-0.5">{meal.name}</p>
                      <p className="text-[#9CA3AF] text-xs mb-3">{meal.partners?.name}</p>
                      <button
                        onClick={() => handleRedeem(meal as Meal)}
                        disabled={!subscription || creditsRemaining === 0}
                        className="mt-auto w-full bg-[#3ECBA0] hover:bg-[#2DAF87] text-white font-semibold text-sm py-2 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Redeem
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Orders */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[#1A1A1A] font-bold text-lg">Recent Orders</h2>
                <Link href="/dashboard/orders" className="text-[#3ECBA0] text-sm font-semibold hover:text-[#2DAF87] transition-colors flex items-center gap-1">
                  View all
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {recentOrders.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-[#9CA3AF] text-sm">No orders yet</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left text-xs font-semibold text-[#9CA3AF] px-5 py-3.5">Order</th>
                        <th className="text-left text-xs font-semibold text-[#9CA3AF] px-5 py-3.5">Meal</th>
                        <th className="text-left text-xs font-semibold text-[#9CA3AF] px-5 py-3.5 hidden sm:table-cell">Date &amp; Time</th>
                        <th className="text-left text-xs font-semibold text-[#9CA3AF] px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order, idx) => {
                        const dt = formatDateTime(order.created_at);
                        return (
                          <tr key={order.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${idx === recentOrders.length - 1 ? 'border-b-0' : ''}`}>
                            <td className="px-5 py-4">
                              <div className="w-10 h-10 rounded-xl bg-[#EBF9F4] flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-[#3ECBA0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-[#1A1A1A] font-semibold text-sm">{order.meals?.name || 'Meal'}</p>
                              <p className="text-[#9CA3AF] text-xs">{order.partners?.name || ''}</p>
                            </td>
                            <td className="px-5 py-4 hidden sm:table-cell">
                              <p className="text-[#374151] text-sm">{dt.date}</p>
                              <p className="text-[#9CA3AF] text-xs">{dt.time}</p>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                order.status === 'redeemed' || order.status === 'completed'
                                  ? 'bg-[#EBF9F4] text-[#2DAF87]'
                                  : order.status === 'pending' ?'bg-yellow-50 text-yellow-600' :'bg-gray-100 text-gray-600'
                              }`}>
                                {order.status === 'redeemed' || order.status === 'completed' ? 'Redeemed' : order.status || 'Pending'}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <svg className="w-4 h-4 text-[#D0D0D0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                              </svg>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* ── Right column ── */}
          <div className="space-y-5">
            {/* Quick Stats */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-[#1A1A1A] font-bold text-base mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
                      </svg>
                    </div>
                    <span className="text-[#374151] text-sm">Total Credits</span>
                  </div>
                  <span className="font-bold text-sm text-[#374151]">{subscription?.credits_total ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#3ECBA0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-[#374151] text-sm">Used</span>
                  </div>
                  <span className="font-bold text-sm text-[#F4B054]">{subscription?.credits_used ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-yellow-50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="text-[#374151] text-sm">Remaining</span>
                  </div>
                  <span className="font-bold text-sm text-[#3ECBA0]">{creditsRemaining}</span>
                </div>
              </div>
            </div>

            {/* Quick Access */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-[#1A1A1A] font-bold text-base mb-3">Quick Access</h3>
              <div className="space-y-1">
                {[
                  {
                    href: '/dashboard/meals',
                    label: 'Browse Meals',
                    icon: (
                      <svg className="w-5 h-5 text-[#3ECBA0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    ),
                    bg: 'bg-green-50',
                  },
                  {
                    href: '/dashboard/orders',
                    label: 'Order History',
                    icon: (
                      <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    ),
                    bg: 'bg-orange-50',
                  },
                  {
                    href: '/dashboard/plans',
                    label: 'Upgrade Plan',
                    icon: (
                      <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    ),
                    bg: 'bg-yellow-50',
                  },
                  {
                    href: '/dashboard/support',
                    label: 'Get Support',
                    icon: (
                      <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    ),
                    bg: 'bg-blue-50',
                  },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className={`w-9 h-9 rounded-xl ${link.bg} flex items-center justify-center flex-shrink-0`}>
                      {link.icon}
                    </div>
                    <span className="text-[#374151] text-sm font-medium flex-1">{link.label}</span>
                    <svg className="w-4 h-4 text-[#D0D0D0] group-hover:text-[#9CA3AF] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>

            {/* Upgrade promo banner */}
            <div className="relative overflow-hidden rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #2DAF87 0%, #3ECBA0 100%)' }}>
              <div className="relative z-10">
                <h4 className="text-white font-bold text-base mb-1">Upgrade for more variety</h4>
                <p className="text-white/80 text-xs mb-4 leading-relaxed">Explore premium meals and more partner cafeterias.</p>
                <Link
                  href="/dashboard/plans"
                  className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors border border-white/20"
                >
                  Upgrade Plan →
                </Link>
              </div>
              {/* Decorative food image placeholder */}
              <div className="absolute right-0 bottom-0 w-24 h-24 opacity-30">
                <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <circle cx="40" cy="40" r="35" fill="white" opacity="0.3" />
                  <path d="M20 45C20 55.493 29.507 64 40 64C50.493 64 60 55.493 60 45H20Z" fill="white" opacity="0.5" />
                  <path d="M22 45H58" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Search bar */}
            <Link
              href="/dashboard/meals"
              className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 border border-gray-100 hover:border-[#3ECBA0]/40 transition-colors"
            >
              <svg className="w-4 h-4 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-[#9CA3AF] text-sm flex-1">Search meals, cafeterias...</span>
              <svg className="w-4 h-4 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {showModal && selectedMeal && (
        <RedemptionModal
          meal={selectedMeal as any}
          subscription={subscription as any}
          onClose={() => setShowModal(false)}
          onSuccess={handleRedeemSuccess}
        />
      )}
    </div>
  );
}

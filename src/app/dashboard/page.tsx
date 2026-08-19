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

const categoryEmoji: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
};

export default function DashboardHome() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [todayMeals, setTodayMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [showModal, setShowModal] = useState(false);

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Student';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

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
          .select('*, partners(name)')
          .eq('is_active', true)
          .neq('availability', 'unavailable')
          .limit(6);
        setTodayMeals(meals || []);
      } catch (err) {
        console.log('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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

  return (
    <div className="min-h-full bg-[#F5F6FA] p-8">
      {/* Page title */}
      <div className="mb-8">
        <p className="text-[#9CA3AF] text-sm mb-1">{greeting}, {firstName} 👋</p>
        <h1 className="text-[#1A1A1A] font-bold text-2xl">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Left / Main column ── */}
        <div className="xl:col-span-2 space-y-6">
          {/* Plan card */}
          {subscription ? (
            <div className="relative overflow-hidden rounded-2xl bg-[#1a2e24] p-6">
              <div className="absolute top-0 right-0 w-56 h-56 rounded-full opacity-20 blur-3xl bg-[#3ECBA0]" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="text-white/50 text-xs font-medium uppercase tracking-wide mb-1">Active Plan</p>
                    <h3 className="text-white font-bold text-xl">{subscription.meal_plans?.name}</h3>
                    <p className="text-white/40 text-xs mt-0.5">{subscription.credits_total} meals total</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#3ECBA0] font-bold text-4xl leading-none">{creditsRemaining}</p>
                    <p className="text-white/40 text-xs mt-1">meals left</p>
                  </div>
                </div>
                <div className="bg-white/10 rounded-full h-2 overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #3ECBA0, #2DAF87)' }}
                  />
                </div>
                <div className="flex justify-between text-xs mb-5">
                  <span className="text-white/40">{subscription.credits_used} used</span>
                  <span className="text-[#3ECBA0] font-semibold">{progressPct}% remaining</span>
                </div>
                <Link
                  href="/dashboard/wallet"
                  className="inline-block bg-white/10 hover:bg-white/15 text-white font-semibold text-sm px-5 py-2.5 rounded-xl border border-white/10 transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">🍽️</div>
              <p className="text-[#1A1A1A] font-bold mb-1">No active plan</p>
              <p className="text-[#9CA3AF] text-sm mb-4">Subscribe to start redeeming meals</p>
              <Link href="/dashboard/plans" className="inline-block bg-[#3ECBA0] text-white font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-[#2DAF87] transition-colors">
                Browse Plans
              </Link>
            </div>
          )}

          {/* Today's Meals */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[#1A1A1A] font-bold text-lg">Today&apos;s Meals</h2>
              <Link href="/dashboard/meals" className="text-[#3ECBA0] text-sm font-semibold hover:text-[#2DAF87] transition-colors">See all →</Link>
            </div>

            {todayMeals.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                <p className="text-[#9CA3AF] text-sm">No meals available right now</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {todayMeals.map((meal) => (
                  <div key={meal.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow">
                    <div className="flex items-stretch">
                      <div className="w-20 flex-shrink-0 bg-gray-50 relative overflow-hidden">
                        {meal.image_url ? (
                          <img src={meal.image_url} alt={meal.name} className="w-full h-full object-cover absolute inset-0" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl absolute inset-0">
                            {categoryEmoji[meal.category] || '🍽️'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-3 min-w-0">
                        <span className="inline-block bg-[#EBF9F4] text-[#2DAF87] text-xs font-semibold px-2 py-0.5 rounded-full capitalize mb-1">{meal.category}</span>
                        <p className="text-[#1A1A1A] font-bold text-sm truncate">{meal.name}</p>
                        <p className="text-[#9CA3AF] text-xs mb-2">{meal.partners?.name}</p>
                        <button
                          onClick={() => handleRedeem(meal)}
                          disabled={!subscription || creditsRemaining === 0}
                          className="w-full bg-[#3ECBA0] text-white font-semibold text-xs py-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#2DAF87] transition-colors"
                        >
                          Redeem
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-5">
          {/* Quick stats */}
          {subscription && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-[#1A1A1A] font-bold text-sm mb-4">Quick Stats</h3>
              <div className="space-y-3">
                {[
                  { label: 'Total Credits', value: subscription.credits_total, color: '#6B7280', icon: '🎯' },
                  { label: 'Used', value: subscription.credits_used, color: '#F4B054', icon: '✅' },
                  { label: 'Remaining', value: creditsRemaining, color: '#3ECBA0', icon: '⚡' },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{stat.icon}</span>
                      <span className="text-[#6B7280] text-sm">{stat.label}</span>
                    </div>
                    <span className="font-bold text-sm" style={{ color: stat.color }}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-[#1A1A1A] font-bold text-sm mb-4">Quick Access</h3>
            <div className="space-y-2">
              {[
                { href: '/dashboard/meals', label: 'Browse Meals', icon: '🍽️' },
                { href: '/dashboard/orders', label: 'Order History', icon: '📋' },
                { href: '/dashboard/plans', label: 'Upgrade Plan', icon: '⭐' },
                { href: '/dashboard/support', label: 'Get Support', icon: '💬' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <span className="text-base">{link.icon}</span>
                  <span className="text-[#374151] text-sm font-medium flex-1">{link.label}</span>
                  <svg className="w-4 h-4 text-[#D0D0D0] group-hover:text-[#9CA3AF] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <Link href="/dashboard/meals" className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 border border-gray-100 hover:border-[#3ECBA0]/40 transition-colors">
            <svg className="w-4 h-4 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-[#9CA3AF] text-sm">Search meals, cafeterias...</span>
          </Link>
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

'use client';

import { useState, useEffect } from 'react';
import PartnerLayout from '../components/PartnerLayout';
import { createClient } from '@/lib/supabase/client';

interface Stats {
  todayMeals: number;
  mealsRedeemed: number;
  pending: number;
  estimatedEarnings: number;
}

interface MealScheduleItem {
  id: string;
  name: string;
  servingQuantity: number;
  redemptions: number;
  availability: string;
}

interface RecentRedemption {
  id: string;
  studentName: string;
  mealName: string;
  time: string;
  status: string;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function AvailabilityBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    available: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Available' },
    low_stock: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Low Stock' },
    unavailable: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500', label: 'Unavailable' },
    coming_soon: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', label: 'Coming Soon' },
  };
  const s = map[status] || map.available;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export default function PartnerDashboardPage() {
  const supabase = createClient();
  const [partnerName, setPartnerName] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [stats, setStats] = useState<Stats>({ todayMeals: 0, mealsRedeemed: 0, pending: 0, estimatedEarnings: 0 });
  const [schedule, setSchedule] = useState<MealScheduleItem[]>([]);
  const [recentRedemptions, setRecentRedemptions] = useState<RecentRedemption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: partner } = await supabase
        .from('partners')
        .select('id, name, price_per_meal')
        .eq('user_id', user.id)
        .single();

      if (!partner) return;
      setPartnerName(partner.name);
      setPartnerId(partner.id);

      // Load today's meals
      const { data: meals } = await supabase
        .from('meals')
        .select('id, name, serving_quantity, redemption_count, availability')
        .eq('partner_id', partner.id)
        .eq('is_active', true);

      const todayMeals = meals?.reduce((sum, m) => sum + (m.serving_quantity || 0), 0) || 0;

      // Load today's redemptions
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: redemptions } = await supabase
        .from('redemptions')
        .select(`
          id, status, redeemed_at,
          user_profiles:user_id(full_name),
          meals:meal_id(name, price_myr)
        `)
        .eq('partner_id', partner.id)
        .gte('redeemed_at', todayStart.toISOString())
        .order('redeemed_at', { ascending: false });

      const redeemed = redemptions?.filter((r) => r.status === 'confirmed').length || 0;
      const pending = redemptions?.filter((r) => r.status === 'pending').length || 0;
      const earnings = redemptions
        ?.filter((r) => r.status === 'confirmed')
        .reduce((sum, r) => sum + ((r.meals as any)?.price_myr || (partner.price_per_meal || 15)), 0) || 0;

      setStats({ todayMeals, mealsRedeemed: redeemed, pending, estimatedEarnings: earnings });

      setSchedule(
        (meals || []).slice(0, 4).map((m) => ({
          id: m.id,
          name: m.name,
          servingQuantity: m.serving_quantity || 0,
          redemptions: m.redemption_count || 0,
          availability: m.availability || 'available',
        }))
      );

      setRecentRedemptions(
        (redemptions || []).slice(0, 5).map((r) => ({
          id: r.id,
          studentName: (r.user_profiles as any)?.full_name || 'Student',
          mealName: (r.meals as any)?.name || 'Meal',
          time: new Date(r.redeemed_at).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' }),
          status: r.status,
        }))
      );

      setLoading(false);
    };
    load();
  }, []);

  const statCards = [
    {
      label: "Today\'s Meals",
      value: stats.todayMeals,
      icon: (
        <svg className="w-6 h-6 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      valueClass: 'text-[#111827]',
    },
    {
      label: 'Meals Redeemed',
      value: stats.mealsRedeemed,
      icon: (
        <svg className="w-6 h-6 text-[#3ECBA0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      valueClass: 'text-[#3ECBA0]',
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: (
        <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      valueClass: 'text-amber-600',
    },
    {
      label: 'Estimated Earnings',
      value: `RM ${stats.estimatedEarnings.toFixed(2)}`,
      icon: (
        <svg className="w-6 h-6 text-[#3ECBA0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      valueClass: 'text-[#111827]',
      isLarge: true,
    },
  ];

  return (
    <PartnerLayout>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-2 border-[#3ECBA0] border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Greeting */}
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">
              {getGreeting()}, {partnerName || 'Partner'}
            </h1>
            <p className="text-[#6B7280] text-sm mt-1">Here's what's happening at your outlet today.</p>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card) => (
              <div key={card.label} className="bg-white rounded-2xl border border-[#E5E7EB] p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-sm text-[#6B7280] font-medium">{card.label}</p>
                  {card.icon}
                </div>
                <p className={`font-bold ${card.isLarge ? 'text-xl' : 'text-3xl'} ${card.valueClass}`}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          {/* Main grid: schedule + recent redemptions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Today's Meal Schedule */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-[#111827]">Today's Meal Schedule</h2>
                <a href="/partner-portal/meals" className="text-sm text-[#3ECBA0] font-medium hover:text-[#2db88d]">
                  Manage →
                </a>
              </div>

              {schedule.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-2xl bg-[#F3F4F6] flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="text-[#6B7280] text-sm">No meals scheduled yet.</p>
                  <a href="/partner-portal/meals/add" className="text-[#3ECBA0] text-sm font-medium mt-1 inline-block">Add your first meal →</a>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {schedule.map((meal) => (
                    <div key={meal.id} className="border border-[#E5E7EB] rounded-xl p-4 hover:border-[#3ECBA0]/40 transition-colors">
                      <p className="text-xs text-[#9CA3AF] mb-1">Meal</p>
                      <p className="font-semibold text-[#111827] text-sm mb-3">{meal.name}</p>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#6B7280]">Quantity Prepared</span>
                          <span className="font-semibold text-[#111827]">{meal.servingQuantity}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#6B7280]">Redemptions</span>
                          <span className="font-semibold text-[#111827]">{meal.redemptions}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#6B7280]">Availability</span>
                          <AvailabilityBadge status={meal.availability} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Redemptions */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-[#111827]">Recent Redemptions</h2>
                <a href="/partner-portal/redemptions" className="text-sm text-[#3ECBA0] font-medium hover:text-[#2db88d]">
                  All →
                </a>
              </div>

              {recentRedemptions.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-[#9CA3AF] text-sm">No redemptions today yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentRedemptions.map((r) => (
                    <div key={r.id} className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#3ECBA0]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#3ECBA0] text-xs font-bold">
                          {r.studentName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#111827] truncate">
                          {r.studentName} redeemed
                        </p>
                        <p className="text-xs text-[#6B7280] truncate">{r.mealName}</p>
                        <p className="text-xs text-[#9CA3AF] mt-0.5">at {r.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PartnerLayout>
  );
}

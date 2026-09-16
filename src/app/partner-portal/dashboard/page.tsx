'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
  trend,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  accent: string;
  trend?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}15` }}
        >
          <span style={{ color: accent }}>{icon}</span>
        </div>
        {trend && (
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}
          >
            {trend}
          </span>
        )}
      </div>
      <p className="text-[#9CA3AF] text-xs font-medium mb-1">{label}</p>
      <p className="text-[#111827] text-2xl font-black">{value}</p>
      <p className="text-[#9CA3AF] text-xs mt-1">{sub}</p>
    </div>
  );
}

function AvailabilityBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    available: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500',
      label: 'Available',
    },
    low_stock: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      dot: 'bg-amber-500',
      label: 'Low Stock',
    },
    unavailable: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500', label: 'Unavailable' },
    coming_soon: {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      dot: 'bg-gray-400',
      label: 'Coming Soon',
    },
  };
  const s = map[status] || map.available;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export default function PartnerDashboardPage() {
  const supabase = createClient();
  const [partnerName, setPartnerName] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [pricePerMeal, setPricePerMeal] = useState(15);
  const [stats, setStats] = useState<Stats>({
    todayMeals: 0,
    mealsRedeemed: 0,
    pending: 0,
    estimatedEarnings: 0,
  });
  const [schedule, setSchedule] = useState<MealScheduleItem[]>([]);
  const [recentRedemptions, setRecentRedemptions] = useState<RecentRedemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveIndicator, setLiveIndicator] = useState(false);
  const partnerIdRef = useRef('');
  const pricePerMealRef = useRef(15);

  const fetchRedemptionsData = useCallback(
    async (pid: string, ppm: number) => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: redemptions } = await supabase
        .from('redemptions')
        .select(
          `id, status, redeemed_at, user_profiles:user_id(full_name), meals:meal_id(name, price_myr)`
        )
        .eq('partner_id', pid)
        .gte('redeemed_at', todayStart.toISOString())
        .order('redeemed_at', { ascending: false });
      return redemptions || [];
    },
    [supabase]
  );

  const fetchMealsData = useCallback(
    async (pid: string) => {
      const { data: meals } = await supabase
        .from('meals')
        .select('id, name, serving_quantity, redemption_count, availability')
        .eq('partner_id', pid)
        .eq('is_active', true);
      return meals || [];
    },
    [supabase]
  );

  const refreshDashboard = useCallback(
    async (pid: string, ppm: number) => {
      const [meals, redemptions] = await Promise.all([
        fetchMealsData(pid),
        fetchRedemptionsData(pid, ppm),
      ]);
      const todayMeals = meals.reduce((sum, m) => sum + (m.serving_quantity || 0), 0);
      const redeemed = redemptions.filter((r) => r.status === 'confirmed').length;
      const pending = redemptions.filter((r) => r.status === 'pending').length;
      const earnings = redemptions
        .filter((r) => r.status === 'confirmed')
        .reduce((sum, r) => sum + ((r.meals as any)?.price_myr || ppm), 0);
      setStats({ todayMeals, mealsRedeemed: redeemed, pending, estimatedEarnings: earnings });
      setSchedule(
        meals.slice(0, 4).map((m) => ({
          id: m.id,
          name: m.name,
          servingQuantity: m.serving_quantity || 0,
          redemptions: m.redemption_count || 0,
          availability: m.availability || 'available',
        }))
      );
      setRecentRedemptions(
        redemptions.slice(0, 5).map((r) => ({
          id: r.id,
          studentName: (r.user_profiles as any)?.full_name || 'Student',
          mealName: (r.meals as any)?.name || 'Meal',
          time: new Date(r.redeemed_at).toLocaleTimeString('en-MY', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          status: r.status,
        }))
      );
    },
    [fetchMealsData, fetchRedemptionsData]
  );

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: partner } = await supabase
        .from('partners')
        .select('id, name, price_per_meal')
        .eq('user_id', user.id)
        .single();
      if (!partner) return;
      setPartnerName(partner.name);
      setPartnerId(partner.id);
      setPricePerMeal(partner.price_per_meal || 15);
      partnerIdRef.current = partner.id;
      pricePerMealRef.current = partner.price_per_meal || 15;
      await refreshDashboard(partner.id, partner.price_per_meal || 15);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!partnerId) return;
    const channel = supabase
      .channel(`partner-dashboard-${partnerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'redemptions',
          filter: `partner_id=eq.${partnerId}`,
        },
        async () => {
          setLiveIndicator(true);
          setTimeout(() => setLiveIndicator(false), 1500);
          await refreshDashboard(partnerIdRef.current, pricePerMealRef.current);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'meals', filter: `partner_id=eq.${partnerId}` },
        async () => {
          await refreshDashboard(partnerIdRef.current, pricePerMealRef.current);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [partnerId, supabase, refreshDashboard]);

  const statCards = [
    {
      label: "Today\'s Meals",
      value: stats.todayMeals,
      sub: 'Total serving capacity',
      accent: '#6B7280',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
    },
    {
      label: 'Redeemed',
      value: stats.mealsRedeemed,
      sub: 'Confirmed today',
      accent: '#3ECBA0',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      label: 'Pending',
      value: stats.pending,
      sub: 'Awaiting confirmation',
      accent: '#F59E0B',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      label: 'Est. Earnings',
      value: `RM ${stats.estimatedEarnings.toFixed(2)}`,
      sub: "Today's revenue",
      accent: '#3ECBA0',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <PartnerLayout>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-2 border-[#3ECBA0] border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-6 max-w-6xl">
          {/* Greeting */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#9CA3AF] text-sm mb-0.5">{greeting}</p>
              <h1 className="text-[#111827] font-bold text-2xl">{partnerName}</h1>
            </div>
            <div className="flex items-center gap-2">
              {liveIndicator && (
                <div className="flex items-center gap-1.5 bg-[#EBF9F4] border border-[#C8F0E4] rounded-xl px-3 py-1.5">
                  <span className="w-2 h-2 bg-[#3ECBA0] rounded-full animate-pulse" />
                  <span className="text-[#2DAF87] text-xs font-semibold">Live update</span>
                </div>
              )}
              <div className="hidden sm:flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-1.5">
                <span className="w-2 h-2 bg-[#3ECBA0] rounded-full" />
                <span className="text-[#374151] text-xs font-semibold">Open</span>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card) => (
              <StatCard
                key={card.label}
                label={card.label}
                value={card.value}
                sub={card.sub}
                icon={card.icon}
                accent={card.accent}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Meal schedule */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-[#111827] font-bold text-sm">Today&apos;s Menu</h3>
                  <p className="text-[#9CA3AF] text-xs mt-0.5">Active meals on your menu</p>
                </div>
                <a
                  href="/partner-portal/meals"
                  className="text-[#3ECBA0] text-xs font-semibold hover:text-[#2DAF87] transition-colors"
                >
                  Manage →
                </a>
              </div>
              {schedule.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-6 h-6 text-gray-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <p className="text-[#6B7280] text-sm font-medium">No meals added yet</p>
                  <a
                    href="/partner-portal/meals"
                    className="text-[#3ECBA0] text-xs font-semibold mt-1 inline-block"
                  >
                    Add your first meal →
                  </a>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {schedule.map((meal) => (
                    <div key={meal.id} className="flex items-center gap-4 px-5 py-3.5">
                      <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-4 h-4 text-[#9CA3AF]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.8}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#111827] font-semibold text-sm truncate">{meal.name}</p>
                        <p className="text-[#9CA3AF] text-xs">
                          {meal.redemptions}/{meal.servingQuantity} redeemed
                        </p>
                      </div>
                      <AvailabilityBadge status={meal.availability} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent redemptions */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-[#111827] font-bold text-sm">Recent Redemptions</h3>
                  <p className="text-[#9CA3AF] text-xs mt-0.5">Latest student activity today</p>
                </div>
                <a
                  href="/partner-portal/redemptions"
                  className="text-[#3ECBA0] text-xs font-semibold hover:text-[#2DAF87] transition-colors"
                >
                  View all →
                </a>
              </div>
              {recentRedemptions.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-6 h-6 text-gray-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-[#6B7280] text-sm font-medium">No redemptions today yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {recentRedemptions.map((r) => {
                    const statusMap: Record<string, { bg: string; text: string }> = {
                      confirmed: { bg: '#EBF9F4', text: '#2DAF87' },
                      pending: { bg: '#FFF8E6', text: '#D97706' },
                      cancelled: { bg: '#FEF2F2', text: '#DC2626' },
                    };
                    const st = statusMap[r.status] || statusMap.confirmed;
                    return (
                      <div key={r.id} className="flex items-center gap-4 px-5 py-3.5">
                        <div className="w-9 h-9 bg-gradient-to-br from-[#3ECBA0]/20 to-[#3ECBA0]/5 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-[#3ECBA0] font-bold text-sm">
                            {r.studentName[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[#111827] font-semibold text-sm truncate">
                            {r.studentName}
                          </p>
                          <p className="text-[#9CA3AF] text-xs">
                            {r.mealName} · {r.time}
                          </p>
                        </div>
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: st.bg, color: st.text }}
                        >
                          {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                href: '/partner-portal/verify',
                label: 'Verify Meal',
                icon: '✓',
                color: '#3ECBA0',
                bg: '#EBF9F4',
              },
              {
                href: '/partner-portal/meals',
                label: 'Manage Meals',
                icon: '🍽',
                color: '#4F46E5',
                bg: '#EEF2FF',
              },
              {
                href: '/partner-portal/earnings',
                label: 'View Earnings',
                icon: '₹',
                color: '#D97706',
                bg: '#FFF8E6',
              },
              {
                href: '/partner-portal/settlement',
                label: 'Settlement',
                icon: '⇄',
                color: '#6B7280',
                bg: '#F5F6FA',
              },
            ].map(({ href, label, icon, color, bg }) => (
              <a
                key={href}
                href={href}
                className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col items-center gap-2 hover:shadow-md transition-all text-center group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
                  style={{ background: bg, color }}
                >
                  {icon}
                </div>
                <p className="text-[#374151] text-xs font-semibold group-hover:text-[#111827] transition-colors">
                  {label}
                </p>
              </a>
            ))}
          </div>
        </div>
      )}
    </PartnerLayout>
  );
}

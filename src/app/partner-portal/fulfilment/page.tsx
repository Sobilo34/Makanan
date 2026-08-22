'use client';

import { useState, useEffect } from 'react';
import PartnerLayout from '../components/PartnerLayout';
import { createClient } from '@/lib/supabase/client';

interface FulfilmentMeal {
  id: string;
  name: string;
  category: string;
  serving_quantity: number;
  redemption_count: number;
  schedule_days: string[];
  availability: string;
  image_url: string | null;
}

interface DailyStats {
  date: string;
  label: string;
  total: number;
  completed: number;
  pending: number;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function AvailabilityBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    available: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Available' },
    low_stock: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Low Stock' },
    unavailable: { bg: 'bg-red-50', text: 'text-red-600', label: 'Unavailable' },
    coming_soon: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Coming Soon' },
  };
  const s = map[status] || map.available;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

export default function FulfilmentPage() {
  const supabase = createClient();
  const [meals, setMeals] = useState<FulfilmentMeal[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [partnerId, setPartnerId] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [todayRedemptions, setTodayRedemptions] = useState<any[]>([]);

  const getTodayDayName = () => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' });
  };

  const loadData = async (pid: string) => {
    setLoading(true);
    const today = getTodayDayName();

    // Load meals
    const { data: mealsData } = await supabase
      .from('meals')
      .select('id, name, category, serving_quantity, redemption_count, schedule_days, availability, image_url')
      .eq('partner_id', pid)
      .eq('is_active', true)
      .order('category');

    if (mealsData) setMeals(mealsData);

    // Load today's redemptions
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data: reds } = await supabase
      .from('redemptions')
      .select('id, status, redeemed_at, meals:meal_id(name, category)')
      .eq('partner_id', pid)
      .gte('redeemed_at', todayStart.toISOString())
      .order('redeemed_at', { ascending: false });

    if (reds) setTodayRedemptions(reds);

    // Build weekly stats (last 7 days)
    const stats: DailyStats[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const { data: dayReds } = await supabase
        .from('redemptions')
        .select('id, status')
        .eq('partner_id', pid)
        .gte('redeemed_at', dayStart.toISOString())
        .lte('redeemed_at', dayEnd.toISOString());

      const dayData = dayReds || [];
      stats.push({
        date: d.toISOString(),
        label: i === 0 ? 'Today' : d.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric' }),
        total: dayData.length,
        completed: dayData.filter((r) => r.status === 'confirmed').length,
        pending: dayData.filter((r) => r.status === 'pending').length,
      });
    }
    setDailyStats(stats);
    setSelectedDay(today);
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: partner } = await supabase.from('partners').select('id').eq('user_id', user.id).single();
      if (!partner) return;
      setPartnerId(partner.id);
      await loadData(partner.id);
    };
    init();
  }, []);

  // Real-time subscription for redemptions
  useEffect(() => {
    if (!partnerId) return;
    const channel = supabase
      .channel('fulfilment_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'redemptions', filter: `partner_id=eq.${partnerId}` }, () => {
        loadData(partnerId);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [partnerId]);

  const scheduledMealsForDay = meals.filter((m) =>
    m.schedule_days?.includes(selectedDay) || m.schedule_days?.length === 0
  );

  const totalTarget = scheduledMealsForDay.reduce((sum, m) => sum + (m.serving_quantity || 0), 0);
  const totalCompleted = todayRedemptions.filter((r) => r.status === 'confirmed').length;
  const completionPct = totalTarget > 0 ? Math.min(100, Math.round((totalCompleted / totalTarget) * 100)) : 0;

  return (
    <PartnerLayout>
      <div className="space-y-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Meal Fulfilment Schedule</h1>
          <p className="text-[#6B7280] text-sm mt-0.5">Track daily meal targets and fulfilment completion in real time.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-[#3ECBA0] border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {/* Today's Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 border-l-4 border-l-[#3ECBA0]">
                <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-2">Today's Target</p>
                <p className="text-2xl font-bold text-[#111827]">{totalTarget}</p>
                <p className="text-xs text-[#9CA3AF] mt-1">Meals scheduled</p>
              </div>
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 border-l-4 border-l-emerald-400">
                <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-2">Completed</p>
                <p className="text-2xl font-bold text-emerald-600">{totalCompleted}</p>
                <p className="text-xs text-[#9CA3AF] mt-1">Confirmed redemptions</p>
              </div>
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 border-l-4 border-l-amber-400">
                <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-2">Completion Rate</p>
                <p className="text-2xl font-bold text-[#111827]">{completionPct}%</p>
                <div className="mt-2 h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#3ECBA0] rounded-full transition-all duration-500"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Weekly Chart */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
              <h2 className="text-base font-semibold text-[#111827] mb-4">7-Day Fulfilment Overview</h2>
              <div className="flex items-end gap-3 h-32">
                {dailyStats.map((day, i) => {
                  const maxVal = Math.max(...dailyStats.map((d) => d.total), 1);
                  const heightPct = (day.total / maxVal) * 100;
                  const isToday = i === dailyStats.length - 1;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs font-semibold text-[#374151]">{day.total}</span>
                      <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
                        <div
                          className={`w-full rounded-t-lg transition-all duration-500 ${isToday ? 'bg-[#3ECBA0]' : 'bg-[#E5E7EB]'}`}
                          style={{ height: `${Math.max(heightPct, 4)}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-medium ${isToday ? 'text-[#3ECBA0]' : 'text-[#9CA3AF]'}`}>{day.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Day Selector + Scheduled Meals */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#F3F4F6]">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h2 className="text-base font-semibold text-[#111827]">Scheduled Meals</h2>
                  <div className="flex items-center bg-[#F3F4F6] rounded-xl p-1 gap-1 flex-wrap">
                    {DAYS.map((day, i) => (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          selectedDay === day
                            ? 'bg-[#1a3028] text-white shadow-sm'
                            : 'text-[#6B7280] hover:text-[#374151]'
                        }`}
                      >
                        {SHORT_DAYS[i]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {scheduledMealsForDay.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#F3F4F6] flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <p className="text-[#374151] font-semibold text-sm">No meals scheduled for {selectedDay}</p>
                  <p className="text-[#9CA3AF] text-xs mt-1">Add schedule days to your meals in the Meals section.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#F3F4F6]">
                  {scheduledMealsForDay.map((meal) => {
                    const mealReds = todayRedemptions.filter((r) => (r.meals as any)?.name === meal.name);
                    const completed = mealReds.filter((r) => r.status === 'confirmed').length;
                    const target = meal.serving_quantity || 0;
                    const pct = target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : 0;
                    return (
                      <div key={meal.id} className="px-6 py-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {meal.image_url ? (
                            <img src={meal.image_url} alt={meal.name} className="w-full h-full object-cover" />
                          ) : (
                            <svg className="w-5 h-5 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-[#111827] truncate">{meal.name}</p>
                            <AvailabilityBadge status={meal.availability || 'available'} />
                          </div>
                          <p className="text-xs text-[#9CA3AF] capitalize mb-2">{meal.category}</p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-emerald-400' : pct >= 50 ? 'bg-[#3ECBA0]' : 'bg-amber-400'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-[#374151] whitespace-nowrap">{completed}/{target}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-lg font-bold ${pct >= 100 ? 'text-emerald-500' : 'text-[#111827]'}`}>{pct}%</p>
                          <p className="text-xs text-[#9CA3AF]">fulfilled</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Today's Redemptions Live Feed */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#F3F4F6] flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-[#111827]">Today's Redemptions</h2>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">Live feed — updates in real time</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#3ECBA0] animate-pulse" />
                  <span className="text-xs text-[#3ECBA0] font-medium">Live</span>
                </div>
              </div>
              {todayRedemptions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center px-6">
                  <p className="text-[#374151] font-semibold text-sm">No redemptions today yet</p>
                  <p className="text-[#9CA3AF] text-xs mt-1">Redemptions will appear here in real time.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#F3F4F6] max-h-64 overflow-y-auto">
                  {todayRedemptions.map((r) => (
                    <div key={r.id} className="px-6 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[#111827]">{(r.meals as any)?.name || 'Unknown Meal'}</p>
                        <p className="text-xs text-[#9CA3AF]">{new Date(r.redeemed_at).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${r.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {r.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </PartnerLayout>
  );
}

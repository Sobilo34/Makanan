'use client';

import { useState, useEffect } from 'react';
import PartnerLayout from '../components/PartnerLayout';
import { createClient } from '@/lib/supabase/client';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

type PeriodFilter = 'week' | 'month' | 'quarter';

interface KPIs {
  currentPeriodEarnings: number;
  totalMealsServed: number;
  totalEarnings: number;
  pendingSettlement: number;
}

interface ChartPoint {
  label: string;
  meals: number;
  earnings: number;
}

interface Transaction {
  id: string;
  date: string;
  meal: string;
  mealsServed: number;
  amount: number;
  status: string;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    confirmed: { bg: 'bg-[#E8F7EF]', text: 'text-[#2DAF87]', label: 'Settled' },
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pending' },
    rejected: { bg: 'bg-red-50', text: 'text-[#E57373]', label: 'Rejected' },
    cancelled: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Cancelled' },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

const CustomTooltipMeals = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-lg px-4 py-3">
        <p className="text-xs text-[#6B7280] mb-1">{label}</p>
        <p className="text-sm font-bold text-[#3ECBA0]">{payload[0].value} meals</p>
      </div>
    );
  }
  return null;
};

const CustomTooltipEarnings = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-lg px-4 py-3">
        <p className="text-xs text-[#6B7280] mb-1">{label}</p>
        <p className="text-sm font-bold text-[#3ECBA0]">RM {payload[0].value.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

export default function EarningsPage() {
  const supabase = createClient();
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [kpis, setKpis] = useState<KPIs>({ currentPeriodEarnings: 0, totalMealsServed: 0, totalEarnings: 0, pendingSettlement: 0 });
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [partnerId, setPartnerId] = useState('');
  const [pricePerMeal, setPricePerMeal] = useState(15);

  const getPeriodStart = (p: PeriodFilter) => {
    const d = new Date();
    if (p === 'week') d.setDate(d.getDate() - 7);
    else if (p === 'month') { d.setDate(1); d.setHours(0, 0, 0, 0); }
    else { d.setMonth(d.getMonth() - 3); d.setHours(0, 0, 0, 0); }
    return d.toISOString();
  };

  const buildChartData = (redemptions: any[], p: PeriodFilter, ppm: number): ChartPoint[] => {
    const confirmed = redemptions.filter((r) => r.status === 'confirmed');
    const buckets: Record<string, { meals: number; earnings: number }> = {};

    confirmed.forEach((r) => {
      const d = new Date(r.redeemed_at);
      let key = '';
      if (p === 'week') {
        key = d.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric' });
      } else if (p === 'month') {
        key = d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' });
      } else {
        key = d.toLocaleDateString('en-MY', { month: 'short', year: '2-digit' });
      }
      if (!buckets[key]) buckets[key] = { meals: 0, earnings: 0 };
      buckets[key].meals += 1;
      buckets[key].earnings += (r.meals as any)?.price_myr || ppm;
    });

    return Object.entries(buckets).map(([label, v]) => ({ label, meals: v.meals, earnings: v.earnings }));
  };

  const loadData = async (pid: string, ppm: number, p: PeriodFilter) => {
    setLoading(true);
    const since = getPeriodStart(p);

    const periodReds = await supabase
      .from('redemptions')
      .select('id, status, redeemed_at, meals:meal_id(name, price_myr)')
      .eq('partner_id', pid)
      .gte('redeemed_at', since)
      .order('redeemed_at', { ascending: false });
    const allReds = await supabase
      .from('redemptions')
      .select('id, status, redeemed_at, meals:meal_id(name, price_myr)')
      .eq('partner_id', pid)
      .order('redeemed_at', { ascending: false });

    const pr = periodReds.data || [];
    const ar = allReds.data || [];

    const currentPeriodEarnings = pr
      .filter((r) => r.status === 'confirmed')
      .reduce((s, r) => s + ((r.meals as any)?.price_myr || ppm), 0);

    const totalMealsServed = ar.filter((r) => r.status === 'confirmed').length;

    const totalEarnings = ar
      .filter((r) => r.status === 'confirmed')
      .reduce((s, r) => s + ((r.meals as any)?.price_myr || ppm), 0);

    const pendingSettlement = ar
      .filter((r) => r.status === 'pending')
      .reduce((s, r) => s + ((r.meals as any)?.price_myr || ppm), 0);

    setKpis({ currentPeriodEarnings, totalMealsServed, totalEarnings, pendingSettlement });
    setChartData(buildChartData(pr, p, ppm));

    const txns: Transaction[] = pr.slice(0, 50).map((r) => ({
      id: r.id,
      date: new Date(r.redeemed_at).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' }),
      meal: (r.meals as any)?.name || 'Unknown Meal',
      mealsServed: 1,
      amount: (r.meals as any)?.price_myr || ppm,
      status: r.status,
    }));
    setTransactions(txns);
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: partner } = await supabase.from('partners').select('id, price_per_meal').eq('user_id', user.id).single();
      if (!partner) return;
      setPartnerId(partner.id);
      setPricePerMeal(partner.price_per_meal || 15);
      await loadData(partner.id, partner.price_per_meal || 15, period);
    };
    init();
  }, []);

  useEffect(() => {
    if (partnerId) loadData(partnerId, pricePerMeal, period);
  }, [period]);

  const periodTabs: { key: PeriodFilter; label: string }[] = [
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'quarter', label: 'This Quarter' },
  ];

  const kpiCards = [
    {
      label: 'Current Period',
      value: `RM ${kpis.currentPeriodEarnings.toFixed(2)}`,
      icon: (
        <svg className="w-5 h-5 text-[#3ECBA0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      sub: 'Earnings this period',
      accent: 'border-l-[#3ECBA0]',
    },
    {
      label: 'Total Meals Served',
      value: kpis.totalMealsServed.toLocaleString(),
      icon: (
        <svg className="w-5 h-5 text-[#3ECBA0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      sub: 'All-time confirmed meals',
      accent: 'border-l-[#3ECBA0]',
    },
    {
      label: 'Total Earnings',
      value: `RM ${kpis.totalEarnings.toFixed(2)}`,
      icon: (
        <svg className="w-5 h-5 text-[#3ECBA0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      sub: 'Lifetime earnings',
      accent: 'border-l-[#3ECBA0]',
    },
    {
      label: 'Pending Settlement',
      value: `RM ${kpis.pendingSettlement.toFixed(2)}`,
      icon: (
        <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      sub: 'Awaiting confirmation',
      accent: 'border-l-amber-400',
    },
  ];

  return (
    <PartnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]" style={{ fontFamily: "'Poppins', sans-serif" }}>Earnings</h1>
            <p className="text-[#6B7280] text-sm mt-0.5">Track your revenue and meal redemption performance.</p>
          </div>
          {/* Period filter */}
          <div className="flex items-center bg-[#F3F4F6] rounded-xl p-1 gap-1">
            {periodTabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setPeriod(t.key)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  period === t.key
                    ? 'bg-[#1a3028] text-white shadow-sm'
                    : 'text-[#6B7280] hover:text-[#374151]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          /* Skeleton */
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1,2,3,4].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-[#E5E7EB] p-5 h-28 animate-pulse">
                  <div className="h-3 bg-[#E8F7EF] rounded w-2/3 mb-3" />
                  <div className="h-7 bg-[#CDEFD9] rounded w-1/2" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1,2].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-[#E5E7EB] p-6 h-64 animate-pulse">
                  <div className="h-4 bg-[#E8F7EF] rounded w-1/3 mb-4" />
                  <div className="h-40 bg-[#E8F7EF] rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {kpiCards.map((card) => (
                <div
                  key={card.label}
                  className={`bg-white rounded-2xl border border-[#E5E7EB] p-5 border-l-4 ${card.accent} shadow-sm`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">{card.label}</p>
                    <div className="w-8 h-8 rounded-xl bg-[#F2FBF7] flex items-center justify-center">
                      {card.icon}
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-[#111827]" style={{ fontFamily: "'Poppins', sans-serif" }}>{card.value}</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Meals Redeemed Over Time */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                <div className="mb-5">
                  <h3 className="text-sm font-bold text-[#111827]" style={{ fontFamily: "'Poppins', sans-serif" }}>Meals Redeemed Over Time</h3>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">Confirmed redemptions per day</p>
                </div>
                {chartData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[#F2FBF7] flex items-center justify-center mb-3">
                      <svg className="w-6 h-6 text-[#3ECBA0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-[#374151]">No data yet</p>
                    <p className="text-xs text-[#9CA3AF] mt-1">Redemptions will appear here once confirmed.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="mealsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3ECBA0" stopOpacity={0.18} />
                          <stop offset="95%" stopColor="#3ECBA0" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#9CA3AF', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltipMeals />} />
                      <Area type="monotone" dataKey="meals" stroke="#3ECBA0" strokeWidth={2.5} fill="url(#mealsGrad)" dot={{ fill: '#3ECBA0', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#3ECBA0' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Earnings Over Time */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                <div className="mb-5">
                  <h3 className="text-sm font-bold text-[#111827]" style={{ fontFamily: "'Poppins', sans-serif" }}>Earnings Over Time</h3>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">Revenue from confirmed redemptions (RM)</p>
                </div>
                {chartData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[#F2FBF7] flex items-center justify-center mb-3">
                      <svg className="w-6 h-6 text-[#3ECBA0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-[#374151]">No earnings yet</p>
                    <p className="text-xs text-[#9CA3AF] mt-1">Earnings will appear once meals are confirmed.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3ECBA0" stopOpacity={0.18} />
                          <stop offset="95%" stopColor="#3ECBA0" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#9CA3AF', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltipEarnings />} />
                      <Area type="monotone" dataKey="earnings" stroke="#3ECBA0" strokeWidth={2.5} fill="url(#earningsGrad)" dot={{ fill: '#3ECBA0', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#3ECBA0' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Transaction Table */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#F3F4F6] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#111827]" style={{ fontFamily: "'Poppins', sans-serif" }}>Transactions</h3>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">{transactions.length} records for selected period</p>
                </div>
              </div>

              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#F2FBF7] flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-[#3ECBA0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <p className="text-[#374151] font-semibold mb-1">No transactions</p>
                  <p className="text-[#9CA3AF] text-sm">No payment records found for this period.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#F9FAFB]">
                        {['Date', 'Meal', 'Meals Served', 'Amount', 'Status'].map((h) => (
                          <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3F4F6]">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-[#F9FAFB] transition-colors">
                          <td className="px-6 py-4 text-sm text-[#374151] whitespace-nowrap">{tx.date}</td>
                          <td className="px-6 py-4 text-sm font-medium text-[#111827]">{tx.meal}</td>
                          <td className="px-6 py-4 text-sm text-[#374151]">{tx.mealsServed}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-[#111827]">RM {tx.amount.toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <StatusBadge status={tx.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </PartnerLayout>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Stats {
  activeStudents: number;
  activePlans: number;
  partnerCafeterias: number;
  mealsRedeemedToday: number;
}

interface RedemptionPoint { date: string; count: number; }
interface PartnerPerf { name: string; location: string; redemptions: number; status: string; rating: number; }
interface ActivityItem { id: string; type: string; description: string; time: string; icon: string; }

const DONUT_COLORS = ['#3ECBA0', '#6366F1', '#F59E0B'];

const mockRedemptionData: RedemptionPoint[] = [
  { date: '01 Aug', count: 320 }, { date: '02 Aug', count: 410 }, { date: '03 Aug', count: 380 },
  { date: '04 Aug', count: 520 }, { date: '05 Aug', count: 490 }, { date: '06 Aug', count: 610 },
  { date: '07 Aug', count: 580 }, { date: '08 Aug', count: 650 }, { date: '09 Aug', count: 420 },
  { date: '10 Aug', count: 390 }, { date: '11 Aug', count: 480 }, { date: '12 Aug', count: 560 },
];

const mockActivity: ActivityItem[] = [
  { id: '1', type: 'renewal', description: 'Plan Renewed — Ali Bin Abu, RM300 / 60 Meals', time: '10 min ago', icon: '🔄' },
  { id: '2', type: 'partner', description: 'New Partner Onboarded — Mamak Corner, Alor Setar', time: '1 hr ago', icon: '🏪' },
  { id: '3', type: 'issue', description: 'Payment Issue — Sarah Lee, RM400 Plan', time: '2 hrs ago', icon: '⚠️' },
  { id: '4', type: 'redemption', description: 'Meal Redeemed — Siti Aisyah at Grand Central', time: '3 hrs ago', icon: '🍽️' },
  { id: '5', type: 'signup', description: 'New Student Signup — Jason Tan, Standard Plan', time: '4 hrs ago', icon: '👤' },
];

function StatCard({ title, value, sub, icon, accent, trend }: {
  title: string; value: string | number; sub: string; icon: React.ReactNode; accent: string; trend?: string;
}) {
  return (
    <div className="rounded-2xl p-5 border transition-all duration-200 hover:shadow-lg" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accent}20` }}>
          <span style={{ color: accent }}>{icon}</span>
        </div>
        {trend && (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: trend.startsWith('+') ? 'rgba(62,203,160,0.15)' : 'rgba(239,68,68,0.15)', color: trend.startsWith('+') ? '#3ECBA0' : '#EF4444' }}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{title}</p>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{sub}</p>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 mt-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? 'text-amber-400' : 'text-white/10'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs ml-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{rating.toFixed(1)}</span>
    </div>
  );
}

export default function AdminDashboardPage() {
  const supabase = createClient();
  const [stats, setStats] = useState<Stats>({ activeStudents: 0, activePlans: 0, partnerCafeterias: 0, mealsRedeemedToday: 0 });
  const [partners, setPartners] = useState<PartnerPerf[]>([]);
  const [subscriptionOverview, setSubscriptionOverview] = useState([
    { name: 'Active', value: 85 }, { name: 'Paused', value: 10 }, { name: 'Expired', value: 5 },
  ]);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [studentsRes, plansRes, partnersRes, redemptionsRes] = await Promise.all([
        supabase.from('user_profiles').select('id', { count: 'exact' }).eq('is_active', true).eq('role', 'student'),
        supabase.from('subscriptions').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('partners').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('redemptions').select('id', { count: 'exact' }).gte('redeemed_at', new Date().toISOString().split('T')[0]),
      ]);
      setStats({ activeStudents: studentsRes.count || 0, activePlans: plansRes.count || 0, partnerCafeterias: partnersRes.count || 0, mealsRedeemedToday: redemptionsRes.count || 0 });

      const { data: partnerData } = await supabase.from('partners').select('id, name, location, status, rating').limit(5);
      if (partnerData) {
        const perfs: PartnerPerf[] = await Promise.all(partnerData.map(async (p) => {
          const { count } = await supabase.from('redemptions').select('id', { count: 'exact' }).eq('partner_id', p.id);
          return { name: p.name, location: p.location || 'N/A', redemptions: count || 0, status: p.status || 'active', rating: p.rating || 4.5 };
        }));
        setPartners(perfs);
      }

      const { data: subData } = await supabase.from('subscriptions').select('status');
      if (subData && subData.length > 0) {
        const total = subData.length;
        const active = subData.filter((s) => s.status === 'active').length;
        const expired = subData.filter((s) => s.status === 'expired').length;
        const paused = total - active - expired;
        setSubscriptionOverview([
          { name: 'Active', value: Math.round((active / total) * 100) },
          { name: 'Paused', value: Math.round((paused / total) * 100) },
          { name: 'Expired', value: Math.round((expired / total) * 100) },
        ]);
      }

      const { data: recentRed } = await supabase.from('redemptions').select(`id, status, redeemed_at, user_profiles:user_id(full_name), meals:meal_id(name), partners:partner_id(name)`).order('redeemed_at', { ascending: false }).limit(5);
      if (recentRed && recentRed.length > 0) {
        setRecentActivity(recentRed.map((r: any) => ({ id: r.id, type: 'redemption', description: `Meal Redeemed — ${r.user_profiles?.full_name || 'Student'} at ${r.partners?.name || 'Partner'}`, time: new Date(r.redeemed_at).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' }) + ' today', icon: '🍽️' })));
      } else {
        setRecentActivity(mockActivity);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const channel = supabase.channel('admin-dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'redemptions' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions' }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, loadData]);

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      active: { bg: 'rgba(62,203,160,0.15)', text: '#3ECBA0', label: 'Active' },
      pending: { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B', label: 'Pending' },
      suspended: { bg: 'rgba(239,68,68,0.15)', text: '#EF4444', label: 'Suspended' },
    };
    const s = map[status] || map['active'];
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.text }}>{s.label}</span>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Overview</h1>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Platform health at a glance</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(62,203,160,0.1)', border: '1px solid rgba(62,203,160,0.2)' }}>
            <span className="w-2 h-2 bg-[#3ECBA0] rounded-full animate-pulse" />
            <span className="text-[#3ECBA0] text-xs font-semibold">Live</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Active Students" value={loading ? '—' : stats.activeStudents.toLocaleString()} sub="+5% from last month" trend="+5%" accent="#3ECBA0"
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          />
          <StatCard title="Active Plans" value={loading ? '—' : stats.activePlans.toLocaleString()} sub="+8% from last month" trend="+8%" accent="#6366F1"
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
          />
          <StatCard title="Partner Cafeterias" value={loading ? '—' : stats.partnerCafeterias} sub="3 new this week" accent="#F59E0B"
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
          />
          <StatCard title="Meals Today" value={loading ? '—' : stats.mealsRedeemedToday} sub="Redeemed today" accent="#EF4444"
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 rounded-2xl p-5 border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-white">Meal Redemptions</h2>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Daily redemptions over the past month</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(62,203,160,0.15)', color: '#3ECBA0' }}>This Month</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={mockRedemptionData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1e2530', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12, color: '#fff' }} labelStyle={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }} />
                <Line type="monotone" dataKey="count" stroke="#3ECBA0" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#3ECBA0' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl p-5 border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="mb-4">
              <h2 className="text-base font-bold text-white">Subscriptions</h2>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Current status breakdown</p>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={subscriptionOverview} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value">
                  {subscriptionOverview.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} contentStyle={{ background: '#1e2530', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12, color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-3">
              {subscriptionOverview.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: DONUT_COLORS[i] }} />
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{item.name}</span>
                  </div>
                  <span className="text-xs font-bold text-white">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Recent Activity */}
          <div className="rounded-2xl p-5 border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">Recent Activity</h2>
              <button className="text-xs font-semibold" style={{ color: '#3ECBA0' }}>View all</button>
            </div>
            <div className="space-y-2">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl transition-colors" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug" style={{ color: 'rgba(255,255,255,0.8)' }}>{item.description}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Partner Performance */}
          <div className="rounded-2xl p-5 border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">Partner Performance</h2>
              <a href="/admin-portal/partners" className="text-xs font-semibold" style={{ color: '#3ECBA0' }}>View all</a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <th className="text-left text-xs font-semibold pb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Partner</th>
                    <th className="text-left text-xs font-semibold pb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Redemptions</th>
                    <th className="text-left text-xs font-semibold pb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(partners.length > 0 ? partners : [
                    { name: 'Grand Central Cafeteria', redemptions: 450, status: 'active', rating: 4.9, location: '' },
                    { name: 'Mamak Stall A', redemptions: 380, status: 'active', rating: 4.5, location: '' },
                    { name: 'U-Cafe Kiosk', redemptions: 210, status: 'pending', rating: 3.2, location: '' },
                  ]).map((p, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td className="py-3 pr-3">
                        <p className="text-sm font-medium text-white">{p.name}</p>
                        <StarRating rating={p.rating} />
                      </td>
                      <td className="py-3 pr-3">
                        <span className="text-sm font-bold text-white">{p.redemptions}</span>
                      </td>
                      <td className="py-3">{statusBadge(p.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

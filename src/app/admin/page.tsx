'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Stats {
  totalStudents: number;
  activeSubscriptions: number;
  totalRedemptions: number;
  totalRevenue: number;
}

interface Redemption {
  id: string;
  redeemed_at: string;
  status: string;
  qr_code: string;
  subscription_id: string;
  user_profiles: { id: string; full_name: string; student_id: string; email: string };
  meals: { name: string; category: string };
  partners: { name: string };
}

interface Subscription {
  id: string;
  status: string;
  credits_total: number;
  credits_used: number;
  created_at: string;
  expires_at: string;
  user_profiles: { full_name: string; email: string };
  meal_plans: { name: string; tier: string; price_myr: number };
}

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  created_at: string;
  user_profiles: { full_name: string; email: string };
}

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  confirmed: { label: 'Confirmed', bg: '#E8F9F2', text: '#2DAF87' },
  pending: { label: 'Pending', bg: '#FFF8E6', text: '#D97706' },
  cancelled: { label: 'Cancelled', bg: '#FEF2F2', text: '#DC2626' },
  refunded: { label: 'Refunded', bg: '#F7F8FA', text: '#6B7280' },
  active: { label: 'Active', bg: '#E8F9F2', text: '#2DAF87' },
  expired: { label: 'Expired', bg: '#FEF2F2', text: '#DC2626' },
  open: { label: 'Open', bg: '#FFF8E6', text: '#D97706' },
  in_progress: { label: 'In Progress', bg: '#EFF6FF', text: '#2563EB' },
  resolved: { label: 'Resolved', bg: '#E8F9F2', text: '#2DAF87' },
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'redemptions' | 'subscriptions' | 'tickets'>('overview');
  const [stats, setStats] = useState<Stats>({ totalStudents: 0, activeSubscriptions: 0, totalRedemptions: 0, totalRevenue: 0 });
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    const checkAdmin = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (data?.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
      setIsAdmin(true);
      setCheckingRole(false);
    };
    checkAdmin();
  }, [user, router]);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchData = async () => {
      const supabase = createClient();
      try {
        const [studentsRes, subsRes, redemptionsRes, ticketsRes] = await Promise.all([
          supabase.from('user_profiles').select('id', { count: 'exact' }).eq('role', 'student'),
          supabase.from('subscriptions').select('*, user_profiles(full_name, email), meal_plans(name, tier, price_myr)').order('created_at', { ascending: false }).limit(50),
          supabase.from('redemptions').select('*, user_profiles(full_name, student_id, email), meals(name, category), partners(name)').order('redeemed_at', { ascending: false }).limit(100),
          supabase.from('support_tickets').select('*, user_profiles(full_name, email)').order('created_at', { ascending: false }).limit(50),
        ]);

        const activeSubs = (subsRes.data || []).filter((s) => s.status === 'active');
        const totalRevenue = activeSubs.reduce((sum, s) => sum + (s.meal_plans?.price_myr || 0), 0);

        setStats({
          totalStudents: studentsRes.count || 0,
          activeSubscriptions: activeSubs.length,
          totalRedemptions: (redemptionsRes.data || []).length,
          totalRevenue,
        });
        setSubscriptions(subsRes.data || []);
        setRedemptions(redemptionsRes.data || []);
        setTickets(ticketsRes.data || []);
      } catch (err) {
        console.log('Admin fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  const handleRefund = async (redemptionId: string, userId: string, subscriptionId: string) => {
    const supabase = createClient();
    try {
      await supabase.from('redemptions').update({ status: 'refunded' }).eq('id', redemptionId);

      // Get current subscription credits
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('credits_used, credits_total')
        .eq('id', subscriptionId)
        .single();

      if (sub) {
        const newUsed = Math.max(0, sub.credits_used - 1);
        await supabase.from('subscriptions').update({ credits_used: newUsed }).eq('id', subscriptionId);
        await supabase.from('wallet_transactions').insert({
          user_id: userId,
          subscription_id: subscriptionId,
          redemption_id: redemptionId,
          description: 'Refund: Admin credit adjustment',
          credits_delta: 1,
          balance_after: sub.credits_total - newUsed,
        });
      }

      setRedemptions((prev) =>
        prev.map((r) => (r.id === redemptionId ? { ...r, status: 'refunded' } : r))
      );
    } catch (err) {
      console.log('Refund error:', err);
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    const supabase = createClient();
    await supabase.from('support_tickets').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', ticketId);
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: 'resolved' } : t)));
  };

  if (checkingRole) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#3ECBA0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* Admin Header */}
      <div className="bg-white border-b border-[#EBEBEB] px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#3ECBA0] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <div>
            <h1 className="text-[#1A1A1A] font-bold text-base leading-tight">Admin Dashboard</h1>
            <p className="text-[#9CA3AF] text-xs">Assurance Operations</p>
          </div>
        </div>
        <Link href="/dashboard" className="text-[#9CA3AF] text-sm hover:text-[#1A1A1A] transition-colors flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Student View
        </Link>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-[#EBEBEB] px-6">
        <div className="flex gap-1 max-w-5xl overflow-x-auto">
          {(['overview', 'redemptions', 'subscriptions', 'tickets'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                tab === activeTab
                  ? 'border-[#3ECBA0] text-[#3ECBA0]'
                  : 'border-transparent text-[#9CA3AF] hover:text-[#1A1A1A]'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'tickets' && tickets.filter((t) => t.status === 'open').length > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {tickets.filter((t) => t.status === 'open').length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-6 max-w-5xl">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-[#F0F0F0] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Students', value: stats.totalStudents, icon: '👥', color: '#6B7280' },
                    { label: 'Active Subs', value: stats.activeSubscriptions, icon: '✅', color: '#3ECBA0' },
                    { label: 'Redemptions', value: stats.totalRedemptions, icon: '🍽️', color: '#F59E0B' },
                    { label: 'Revenue (RM)', value: `${stats.totalRevenue.toFixed(0)}`, icon: '💰', color: '#2563EB' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-2xl p-5 border border-[#EBEBEB]">
                      <div className="text-2xl mb-2">{stat.icon}</div>
                      <div className="font-bold text-2xl" style={{ color: stat.color }}>{stat.value}</div>
                      <div className="text-[#9CA3AF] text-xs mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Recent redemptions preview */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-[#1A1A1A] font-bold text-base">Recent Redemptions</h2>
                    <button onClick={() => setActiveTab('redemptions')} className="text-[#3ECBA0] text-sm font-medium">View all</button>
                  </div>
                  <div className="bg-white rounded-2xl border border-[#EBEBEB] overflow-hidden">
                    {redemptions.slice(0, 5).map((r, idx) => {
                      const st = statusConfig[r.status] || statusConfig.confirmed;
                      return (
                        <div key={r.id} className={`px-5 py-3.5 flex items-center gap-4 ${idx !== 0 ? 'border-t border-[#F7F8FA]' : ''}`}>
                          <div className="flex-1 min-w-0">
                            <p className="text-[#1A1A1A] font-semibold text-sm truncate">{r.user_profiles?.full_name}</p>
                            <p className="text-[#9CA3AF] text-xs">{r.meals?.name} · {r.partners?.name}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.text }}>{st.label}</span>
                            <p className="text-[#9CA3AF] text-xs mt-0.5">{new Date(r.redeemed_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                      );
                    })}
                    {redemptions.length === 0 && (
                      <div className="p-8 text-center text-[#9CA3AF] text-sm">No redemptions yet</div>
                    )}
                  </div>
                </div>

                {/* Open tickets */}
                {tickets.filter((t) => t.status === 'open').length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-[#1A1A1A] font-bold text-base">Open Tickets</h2>
                      <button onClick={() => setActiveTab('tickets')} className="text-[#3ECBA0] text-sm font-medium">View all</button>
                    </div>
                    <div className="bg-white rounded-2xl border border-[#EBEBEB] overflow-hidden">
                      {tickets.filter((t) => t.status === 'open').slice(0, 3).map((ticket, idx) => (
                        <div key={ticket.id} className={`px-5 py-3.5 flex items-center gap-4 ${idx !== 0 ? 'border-t border-[#F7F8FA]' : ''}`}>
                          <div className="flex-1 min-w-0">
                            <p className="text-[#1A1A1A] font-semibold text-sm truncate">{ticket.subject}</p>
                            <p className="text-[#9CA3AF] text-xs">{ticket.user_profiles?.full_name}</p>
                          </div>
                          <button
                            onClick={() => handleResolveTicket(ticket.id)}
                            className="text-xs bg-[#E8F9F2] text-[#2DAF87] font-semibold px-3 py-1.5 rounded-lg hover:bg-[#D0F0E4] transition-colors flex-shrink-0"
                          >
                            Resolve
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'redemptions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-[#1A1A1A] font-bold text-base">{redemptions.length} Total Redemptions</h2>
                </div>
                <div className="bg-white rounded-2xl border border-[#EBEBEB] overflow-hidden">
                  {redemptions.length === 0 ? (
                    <div className="p-12 text-center text-[#9CA3AF] text-sm">No redemptions yet</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#F7F8FA]">
                            <th className="text-left px-5 py-3 text-[#9CA3AF] text-xs font-semibold uppercase tracking-wide">Student</th>
                            <th className="text-left px-5 py-3 text-[#9CA3AF] text-xs font-semibold uppercase tracking-wide">Meal</th>
                            <th className="text-left px-5 py-3 text-[#9CA3AF] text-xs font-semibold uppercase tracking-wide">Partner</th>
                            <th className="text-left px-5 py-3 text-[#9CA3AF] text-xs font-semibold uppercase tracking-wide">Date</th>
                            <th className="text-left px-5 py-3 text-[#9CA3AF] text-xs font-semibold uppercase tracking-wide">Status</th>
                            <th className="text-left px-5 py-3 text-[#9CA3AF] text-xs font-semibold uppercase tracking-wide">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {redemptions.map((r) => {
                            const st = statusConfig[r.status] || statusConfig.confirmed;
                            return (
                              <tr key={r.id} className="border-b border-[#F7F8FA] hover:bg-[#FAFAFA] transition-colors">
                                <td className="px-5 py-3">
                                  <p className="text-[#1A1A1A] font-semibold text-sm">{r.user_profiles?.full_name}</p>
                                  <p className="text-[#9CA3AF] text-xs">{r.user_profiles?.student_id || r.user_profiles?.email}</p>
                                </td>
                                <td className="px-5 py-3 text-[#1A1A1A] text-sm">{r.meals?.name}</td>
                                <td className="px-5 py-3 text-[#6B7280] text-sm">{r.partners?.name}</td>
                                <td className="px-5 py-3 text-[#9CA3AF] text-xs whitespace-nowrap">
                                  {new Date(r.redeemed_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="px-5 py-3">
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.text }}>{st.label}</span>
                                </td>
                                <td className="px-5 py-3">
                                  {r.status === 'confirmed' && (
                                    <button
                                      onClick={() => handleRefund(r.id, (r.user_profiles as any)?.id || '', r.subscription_id || '')}
                                      className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                                    >
                                      Refund
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'subscriptions' && (
              <div className="space-y-4">
                <h2 className="text-[#1A1A1A] font-bold text-base">{subscriptions.length} Subscriptions</h2>
                <div className="bg-white rounded-2xl border border-[#EBEBEB] overflow-hidden">
                  {subscriptions.length === 0 ? (
                    <div className="p-12 text-center text-[#9CA3AF] text-sm">No subscriptions yet</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#F7F8FA]">
                            <th className="text-left px-5 py-3 text-[#9CA3AF] text-xs font-semibold uppercase tracking-wide">Student</th>
                            <th className="text-left px-5 py-3 text-[#9CA3AF] text-xs font-semibold uppercase tracking-wide">Plan</th>
                            <th className="text-left px-5 py-3 text-[#9CA3AF] text-xs font-semibold uppercase tracking-wide">Credits</th>
                            <th className="text-left px-5 py-3 text-[#9CA3AF] text-xs font-semibold uppercase tracking-wide">Expires</th>
                            <th className="text-left px-5 py-3 text-[#9CA3AF] text-xs font-semibold uppercase tracking-wide">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subscriptions.map((s) => {
                            const st = statusConfig[s.status] || statusConfig.active;
                            return (
                              <tr key={s.id} className="border-b border-[#F7F8FA] hover:bg-[#FAFAFA] transition-colors">
                                <td className="px-5 py-3">
                                  <p className="text-[#1A1A1A] font-semibold text-sm">{s.user_profiles?.full_name}</p>
                                  <p className="text-[#9CA3AF] text-xs">{s.user_profiles?.email}</p>
                                </td>
                                <td className="px-5 py-3">
                                  <p className="text-[#1A1A1A] text-sm">{s.meal_plans?.name}</p>
                                  <p className="text-[#9CA3AF] text-xs">RM{s.meal_plans?.price_myr}</p>
                                </td>
                                <td className="px-5 py-3">
                                  <p className="text-[#1A1A1A] font-semibold text-sm">{s.credits_total - s.credits_used} left</p>
                                  <p className="text-[#9CA3AF] text-xs">{s.credits_used}/{s.credits_total} used</p>
                                </td>
                                <td className="px-5 py-3 text-[#9CA3AF] text-xs whitespace-nowrap">
                                  {s.expires_at ? new Date(s.expires_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                </td>
                                <td className="px-5 py-3">
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.text }}>{st.label}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'tickets' && (
              <div className="space-y-4">
                <h2 className="text-[#1A1A1A] font-bold text-base">{tickets.length} Support Tickets</h2>
                <div className="space-y-2">
                  {tickets.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-[#EBEBEB] text-[#9CA3AF] text-sm">No tickets yet</div>
                  ) : (
                    tickets.map((ticket) => {
                      const st = statusConfig[ticket.status] || statusConfig.open;
                      return (
                        <div key={ticket.id} className="bg-white rounded-2xl p-4 border border-[#EBEBEB] flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-[#1A1A1A] font-semibold text-sm truncate">{ticket.subject}</p>
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: st.bg, color: st.text }}>{st.label}</span>
                            </div>
                            <p className="text-[#9CA3AF] text-xs">{ticket.user_profiles?.full_name} · {ticket.category} · {new Date(ticket.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}</p>
                          </div>
                          {ticket.status === 'open' && (
                            <button
                              onClick={() => handleResolveTicket(ticket.id)}
                              className="text-xs bg-[#E8F9F2] text-[#2DAF87] font-semibold px-3 py-1.5 rounded-lg hover:bg-[#D0F0E4] transition-colors flex-shrink-0"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

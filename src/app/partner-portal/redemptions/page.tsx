'use client';

import { useState, useEffect } from 'react';
import PartnerLayout from '../components/PartnerLayout';
import { createClient } from '@/lib/supabase/client';

type FilterTab = 'today' | 'week' | 'month';

interface Redemption {
  id: string;
  time: string;
  studentName: string;
  mealName: string;
  planName: string;
  status: string;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
    confirmed: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Redeemed',
    },
    pending: {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Pending',
    },
    rejected: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Rejected',
    },
    cancelled: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      label: 'Cancelled',
    },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      {s.icon}
      {s.label}
    </span>
  );
}

export default function RedemptionsPage() {
  const supabase = createClient();
  const [tab, setTab] = useState<FilterTab>('today');
  const [search, setSearch] = useState('');
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [filtered, setFiltered] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [partnerId, setPartnerId] = useState('');

  const getDateRange = (filter: FilterTab) => {
    const now = new Date();
    const start = new Date();
    if (filter === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (filter === 'week') {
      start.setDate(now.getDate() - 7);
    } else {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    }
    return start.toISOString();
  };

  const loadRedemptions = async (filter: FilterTab, pid: string) => {
    setLoading(true);
    const since = getDateRange(filter);

    const { data } = await supabase
      .from('redemptions')
      .select(`
        id, status, redeemed_at,
        user_profiles:user_id(full_name),
        meals:meal_id(name),
        subscriptions:subscription_id(
          meal_plans:meal_plan_id(name)
        )
      `)
      .eq('partner_id', pid)
      .gte('redeemed_at', since)
      .order('redeemed_at', { ascending: false });

    const mapped: Redemption[] = (data || []).map((r) => ({
      id: r.id,
      time: new Date(r.redeemed_at).toLocaleString('en-MY', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      studentName: (r.user_profiles as any)?.full_name || 'Unknown',
      mealName: (r.meals as any)?.name || 'Unknown Meal',
      planName: (r.subscriptions as any)?.meal_plans?.name || 'Unknown Plan',
      status: r.status,
    }));

    setRedemptions(mapped);
    setFiltered(mapped);
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: partner } = await supabase.from('partners').select('id').eq('user_id', user.id).single();
      if (!partner) return;
      setPartnerId(partner.id);
      await loadRedemptions(tab, partner.id);
    };
    init();
  }, []);

  useEffect(() => {
    if (partnerId) loadRedemptions(tab, partnerId);
  }, [tab]);

  // Real-time subscription for new/updated redemptions
  useEffect(() => {
    if (!partnerId) return;
    const channel = supabase
      .channel(`partner-redemptions-${partnerId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'redemptions',
        filter: `partner_id=eq.${partnerId}`,
      }, () => {
        loadRedemptions(tab, partnerId);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [partnerId, tab]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      redemptions.filter(
        (r) =>
          r.studentName.toLowerCase().includes(q) ||
          r.mealName.toLowerCase().includes(q) ||
          r.planName.toLowerCase().includes(q)
      )
    );
  }, [search, redemptions]);

  const handleExport = () => {
    const headers = ['Time', 'Student', 'Meal', 'Plan', 'Status'];
    const rows = filtered.map((r) => [r.time, r.studentName, r.mealName, r.planName, r.status]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `redemptions-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
  ];

  return (
    <PartnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Redemptions</h1>
          <p className="text-[#6B7280] text-sm mt-0.5">Track all meal redemptions from your students.</p>
        </div>

        {/* Filters row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Tabs */}
          <div className="flex items-center bg-[#F3F4F6] rounded-xl p-1 gap-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === t.key
                    ? 'bg-[#1a3028] text-white shadow-sm'
                    : 'text-[#6B7280] hover:text-[#374151]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search student or redemption..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/30 focus:border-[#3ECBA0] transition-all"
            />
          </div>

          {/* Export */}
          <button
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 rounded-full border-2 border-[#3ECBA0] border-t-transparent animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-[#F3F4F6] flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-[#374151] font-semibold mb-1">No redemptions found</p>
              <p className="text-[#9CA3AF] text-sm">
                {search ? 'Try a different search term.' : `No redemptions for ${tab === 'today' ? 'today' : tab === 'week' ? 'this week' : 'this month'}.`}
              </p>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="grid grid-cols-[1.5fr_1fr_1fr_1.5fr_1fr] gap-4 px-6 py-3 border-b border-[#F3F4F6] bg-[#FAFAFA]">
                {['Time', 'Student', 'Meal', 'Plan', 'Status'].map((h) => (
                  <span key={h} className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">{h}</span>
                ))}
              </div>

              {/* Rows */}
              <div className="divide-y divide-[#F3F4F6]">
                {filtered.map((r) => (
                  <div key={r.id} className="grid grid-cols-[1.5fr_1fr_1fr_1.5fr_1fr] gap-4 px-6 py-4 items-center hover:bg-[#FAFAFA] transition-colors">
                    <span className="text-sm text-[#374151] font-medium">{r.time}</span>
                    <span className="text-sm text-[#111827] font-semibold truncate">{r.studentName}</span>
                    <span className="text-sm text-[#374151] truncate">{r.mealName}</span>
                    <span className="text-sm text-[#6B7280] truncate">{r.planName}</span>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Summary */}
        {!loading && filtered.length > 0 && (
          <p className="text-sm text-[#9CA3AF] text-right">
            Showing {filtered.length} redemption{filtered.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </PartnerLayout>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { api } from '@/lib/api';

interface RedemptionRow {
  id: string;
  time: string;
  student: string;
  meal: string;
  partner: string;
  plan: string;
  status: string;
  redeemed_at: string;
}

const statusStyle = (s: string) => {
  if (s === 'confirmed') return { bg: '#E8F8F1', text: '#4CAF7D', label: 'Success' };
  if (s === 'pending') return { bg: '#FEF9EC', text: '#F2C94C', label: 'Pending' };
  if (s === 'rejected' || s === 'cancelled')
    return { bg: '#FDECEA', text: '#E57373', label: s === 'rejected' ? 'Rejected' : 'Cancelled' };
  return { bg: '#F3F4F6', text: '#9CA3AF', label: s };
};

export default function RedemptionsPage() {
  const [rows, setRows] = useState<RedemptionRow[]>([]);
  const [partnerFilter, setPartnerFilter] = useState('All Partners');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [dateFilter, setDateFilter] = useState('today');
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<string[]>(['All Partners']);
  const [liveCount, setLiveCount] = useState(0);

  const loadRedemptions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getRedemptionHistory(100);
      const mapped: RedemptionRow[] = (data || []).map((r: any) => ({
        id: r.id,
        time: new Date(r.redeemed_at || r.created_at).toLocaleTimeString('en-MY', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        student: r.student_name || r.user?.full_name || 'Student',
        meal: r.meal?.name || r.meal_name || 'Healthy Meal',
        partner: r.partner?.name || r.partner_name || 'Central Kitchen',
        plan: 'Standard',
        status: r.status || 'confirmed',
        redeemed_at: r.redeemed_at || r.created_at,
      }));

      setRows(mapped);

      const uniquePartners = [
        'All Partners',
        ...Array.from(new Set(mapped.map((r) => r.partner).filter(Boolean))),
      ];
      setPartners(uniquePartners);
    } catch (err) {
      console.log('Redemptions load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRedemptions();
    const interval = setInterval(loadRedemptions, 15000);
    return () => clearInterval(interval);
  }, [loadRedemptions]);

  const filtered = rows.filter((r) => {
    if (partnerFilter !== 'All Partners' && r.partner !== partnerFilter) return false;
    if (statusFilter !== 'All Status') {
      if (statusFilter === 'success' && r.status !== 'confirmed') return false;
      if (statusFilter === 'pending' && r.status !== 'pending') return false;
      if (statusFilter === 'rejected' && r.status !== 'rejected' && r.status !== 'cancelled')
        return false;
    }
    return true;
  });

  const total = rows.length;
  const successful = rows.filter((r) => r.status === 'confirmed').length;
  const pending = rows.filter((r) => r.status === 'pending').length;
  const rejected = rows.filter((r) => r.status === 'rejected' || r.status === 'cancelled').length;

  const kpis = [
    {
      label: "Today\'s Redemptions",
      value: total,
      color: '#3ECBA0',
      icon: '🍽️',
      sub: 'All redemptions',
    },
    {
      label: 'Successful',
      value: successful,
      color: '#4CAF7D',
      icon: '✅',
      sub: `${total > 0 ? Math.round((successful / total) * 100) : 0}% success rate`,
    },
    {
      label: 'Pending',
      value: pending,
      color: '#F2C94C',
      icon: '⏳',
      sub: 'Awaiting confirmation',
    },
    { label: 'Rejected', value: rejected, color: '#E57373', icon: '❌', sub: 'Failed or declined' },
  ];

  const statusOptions = ['All Status', 'success', 'pending', 'rejected'];

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">Redemption Monitoring</h1>
            <p className="text-[#6B7280] text-sm mt-0.5">Real-time meal redemption activity</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#3ECBA0] font-medium bg-[#EBF9F4] px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#3ECBA0] animate-pulse" />
            Live
            {liveCount > 0 && (
              <span className="ml-1 bg-[#3ECBA0] text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                {liveCount > 9 ? '9+' : liveCount}
              </span>
            )}
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <div key={k.label} className="bg-white rounded-2xl border border-[#F3F4F6] p-5">
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: `${k.color}18` }}
                >
                  {k.icon}
                </div>
                <div
                  className="w-2 h-2 rounded-full mt-1.5 animate-pulse"
                  style={{ background: k.color }}
                />
              </div>
              <p className="text-xs text-[#9CA3AF] font-medium mb-1">{k.label}</p>
              <p className="text-2xl font-bold text-[#111827]">{loading ? '—' : k.value}</p>
              <p className="text-xs text-[#9CA3AF] mt-1">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-[#F3F4F6] p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center bg-[#F3F4F6] rounded-xl p-1 gap-1">
              {[
                { key: 'today', label: 'Today' },
                { key: 'week', label: 'This Week' },
                { key: 'month', label: 'This Month' },
              ].map((d) => (
                <button
                  key={d.key}
                  onClick={() => setDateFilter(d.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    dateFilter === d.key
                      ? 'bg-white text-[#111827] shadow-sm'
                      : 'text-[#6B7280] hover:text-[#374151]'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <select
              value={partnerFilter}
              onChange={(e) => setPartnerFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/20 focus:border-[#3ECBA0] transition-all cursor-pointer"
            >
              {partners.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/20 focus:border-[#3ECBA0] transition-all cursor-pointer"
            >
              {statusOptions.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#F3F4F6] overflow-hidden">
          <div className="grid grid-cols-[1fr_2fr_2fr_2fr_1.5fr_1fr] gap-3 px-5 py-3 border-b border-[#F3F4F6] bg-[#FAFAFA]">
            {['Time', 'Student', 'Meal', 'Partner', 'Plan', 'Status'].map((h) => (
              <p key={h} className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                {h}
              </p>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 rounded-full border-2 border-[#3ECBA0] border-t-transparent animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-[#9CA3AF] text-sm">
              No redemptions found for the selected filters
            </div>
          ) : (
            <div className="divide-y divide-[#F9FAFB]">
              {filtered.map((row) => {
                const ss = statusStyle(row.status);
                return (
                  <div
                    key={row.id}
                    className="grid grid-cols-[1fr_2fr_2fr_2fr_1.5fr_1fr] gap-3 px-5 py-3.5 hover:bg-[#F9FAFB] transition-colors items-center"
                  >
                    <p className="text-sm text-[#9CA3AF] font-mono">{row.time}</p>
                    <p className="text-sm font-medium text-[#374151] truncate">{row.student}</p>
                    <p className="text-sm text-[#6B7280] truncate">{row.meal}</p>
                    <p className="text-sm text-[#6B7280] truncate">{row.partner}</p>
                    <span className="text-xs px-2 py-1 rounded-full bg-[#F3F4F6] text-[#6B7280] w-fit truncate">
                      {row.plan}
                    </span>
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full w-fit"
                      style={{ background: ss.bg, color: ss.text }}
                    >
                      {ss.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-xs text-[#9CA3AF] text-right">
          Showing {filtered.length} of {rows.length} redemptions
        </p>
      </div>
    </AdminLayout>
  );
}

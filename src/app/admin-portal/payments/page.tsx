'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { api } from '@/lib/api';

interface Transaction {
  id: string;
  date: string;
  student: string;
  plan: string;
  amount: string;
  method: string;
  status: string;
  created_at: string;
}

const statusStyle = (s: string) => {
  if (s === 'completed') return { bg: '#E8F8F1', text: '#4CAF7D', label: 'Completed' };
  if (s === 'pending') return { bg: '#FEF9EC', text: '#F2C94C', label: 'Pending' };
  if (s === 'failed') return { bg: '#FDECEA', text: '#E57373', label: 'Failed' };
  if (s === 'refunded') return { bg: '#F3F4F6', text: '#9CA3AF', label: 'Refunded' };
  return { bg: '#F3F4F6', text: '#9CA3AF', label: s };
};

export default function PaymentsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listAdminPayments();
      const mapped: Transaction[] = (data || []).map((p: any) => ({
        id: p.id,
        date: new Date(p.created_at).toLocaleDateString('en-MY', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        student: p.user?.full_name || p.user_profiles?.full_name || 'Student',
        plan: p.meal_plan?.name || p.meal_plans?.name || 'Meal Plan',
        amount: `RM ${parseFloat(p.amount_myr || 0).toFixed(2)}`,
        method: formatMethod(p.payment_method),
        status: p.status || 'completed',
        created_at: p.created_at,
      }));

      setTransactions(mapped);
    } catch (err) {
      console.log('Payments load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
    const interval = setInterval(loadPayments, 15000);
    return () => clearInterval(interval);
  }, [loadPayments]);

  function formatMethod(m: string) {
    if (m === 'card') return 'Credit Card';
    if (m === 'online_banking') return 'Online Banking';
    if (m === 'other') return 'eWallet';
    return m || 'Online Banking';
  }

  const completed = transactions.filter((t) => t.status === 'completed');
  const pending = transactions.filter((t) => t.status === 'pending');
  const failed = transactions.filter((t) => t.status === 'failed');

  const totalRevenue = completed.reduce((sum, t) => {
    const val = parseFloat(t.amount.replace('RM ', '').replace(',', ''));
    return sum + val;
  }, 0);

  const kpis = [
    {
      label: 'Total Revenue',
      value: `RM ${totalRevenue.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`,
      icon: '💰',
      color: '#3ECBA0',
      sub: 'Completed payments',
    },
    {
      label: 'Successful',
      value: completed.length,
      icon: '✅',
      color: '#4CAF7D',
      sub: `${transactions.length > 0 ? Math.round((completed.length / transactions.length) * 100) : 0}% of total`,
    },
    {
      label: 'Pending',
      value: pending.length,
      icon: '⏳',
      color: '#F2C94C',
      sub: 'Awaiting confirmation',
    },
    {
      label: 'Failed',
      value: failed.length,
      icon: '❌',
      color: '#E57373',
      sub: 'Requires attention',
    },
  ];

  const filtered = transactions.filter((t) => {
    if (statusFilter !== 'All' && t.status !== statusFilter.toLowerCase()) return false;
    if (
      search &&
      !t.student.toLowerCase().includes(search.toLowerCase()) &&
      !t.plan.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">Payments</h1>
            <p className="text-[#6B7280] text-sm mt-0.5">Transaction and payment management</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#3ECBA0] font-medium bg-[#EBF9F4] px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#3ECBA0] animate-pulse" />
            Live
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <div key={k.label} className="bg-white rounded-2xl border border-[#F3F4F6] p-5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3"
                style={{ background: `${k.color}18` }}
              >
                {k.icon}
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
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student or plan..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-sm text-[#374151] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/20 focus:border-[#3ECBA0] transition-all"
              />
            </div>
            <div className="flex items-center bg-[#F3F4F6] rounded-xl p-1 gap-1">
              {['All', 'Completed', 'Pending', 'Failed', 'Refunded'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    statusFilter === s
                      ? 'bg-white text-[#111827] shadow-sm'
                      : 'text-[#6B7280] hover:text-[#374151]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#F3F4F6] overflow-hidden">
          <div className="grid grid-cols-[1.5fr_2fr_2fr_1.5fr_1.5fr_1fr] gap-3 px-5 py-3 border-b border-[#F3F4F6] bg-[#FAFAFA]">
            {['Date', 'Student', 'Plan', 'Amount', 'Payment Method', 'Status'].map((h) => (
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
              {transactions.length === 0
                ? 'No payment records yet. Payments will appear here after students subscribe.'
                : 'No transactions match the current filters.'}
            </div>
          ) : (
            <div className="divide-y divide-[#F9FAFB]">
              {filtered.map((tx) => {
                const ss = statusStyle(tx.status);
                return (
                  <div
                    key={tx.id}
                    className="grid grid-cols-[1.5fr_2fr_2fr_1.5fr_1.5fr_1fr] gap-3 px-5 py-3.5 hover:bg-[#F9FAFB] transition-colors items-center"
                  >
                    <p className="text-sm text-[#9CA3AF]">{tx.date}</p>
                    <p className="text-sm font-medium text-[#374151] truncate">{tx.student}</p>
                    <p className="text-sm text-[#6B7280] truncate">{tx.plan}</p>
                    <p className="text-sm font-semibold text-[#374151]">{tx.amount}</p>
                    <p className="text-sm text-[#6B7280]">{tx.method}</p>
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
          Showing {filtered.length} of {transactions.length} transactions
        </p>
      </div>
    </AdminLayout>
  );
}

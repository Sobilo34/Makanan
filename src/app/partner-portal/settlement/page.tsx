'use client';

import { useState, useEffect } from 'react';
import PartnerLayout from '../components/PartnerLayout';
import { createClient } from '@/lib/supabase/client';
import { api } from '@/lib/api';

interface Settlement {
  id: string;
  period_start: string;
  period_end: string;
  total_redemptions: number;
  total_amount_myr: number;
  settlement_rate_myr: number;
  status: string;
  notes: string | null;
  payout_requested_at: string | null;
  paid_at: string | null;
  payment_reference: string | null;
  created_at: string;
}

interface SummaryKPIs {
  totalPaid: number;
  pendingAmount: number;
  totalRedemptions: number;
  lastPaidDate: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Paid' },
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pending' },
    processing: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Processing' },
    requested: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Requested' },
    cancelled: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Cancelled' },
  };
  const s = map[status] || map.pending;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}
    >
      {s.label}
    </span>
  );
}

export default function SettlementPage() {
  const supabase = createClient();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [kpis, setKpis] = useState<SummaryKPIs>({
    totalPaid: 0,
    pendingAmount: 0,
    totalRedemptions: 0,
    lastPaidDate: null,
  });
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [partnerId, setPartnerId] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async (pid: string) => {
    setLoading(true);

    // 1. Try FastAPI backend first
    try {
      const res = await api.getPartnerSettlements();
      if (res && res.settlements) {
        setSettlements(res.settlements as any);
        setKpis({
          totalPaid: Number(res.kpis?.total_paid || 0),
          pendingAmount: Number(res.kpis?.pending_amount || 0),
          totalRedemptions: Number(res.kpis?.total_redemptions || 0),
          lastPaidDate: res.kpis?.last_paid_date || null,
        });
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('FastAPI getPartnerSettlements fallback to Supabase:', err);
    }

    // 2. Supabase fallback
    const { data, error } = await supabase
      .from('settlements')
      .select('*')
      .eq('partner_id', pid)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSettlements(data);
      const paid = data.filter((s) => s.status === 'paid');
      const pending = data.filter((s) => s.status === 'pending' || s.status === 'requested');
      setKpis({
        totalPaid: paid.reduce((sum, s) => sum + Number(s.total_amount_myr), 0),
        pendingAmount: pending.reduce((sum, s) => sum + Number(s.total_amount_myr), 0),
        totalRedemptions: data.reduce((sum, s) => sum + (s.total_redemptions || 0), 0),
        lastPaidDate: paid[0]?.paid_at || null,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      // 1. Check if authenticated via FastAPI
      try {
        const partnerProfile = await api.getPartnerProfile();
        if (partnerProfile && partnerProfile.id) {
          setPartnerId(partnerProfile.id);
          setPartnerName(partnerProfile.name);
          setPartnerEmail(partnerProfile.email || '');
          await loadData(partnerProfile.id);
          return;
        }
      } catch (err) {
        console.warn('FastAPI getPartnerProfile fallback to Supabase auth:', err);
      }

      // 2. Fallback to Supabase auth
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: partner } = await supabase
        .from('partners')
        .select('id, name, email')
        .eq('user_id', user.id)
        .single();
      if (!partner) return;
      setPartnerId(partner.id);
      setPartnerName(partner.name);
      setPartnerEmail(partner.email || user.email || '');
      await loadData(partner.id);
    };
    init();
  }, []);

  // Real-time subscription
  useEffect(() => {
    if (!partnerId) return;
    const channel = supabase
      .channel('settlements_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'settlements',
          filter: `partner_id=eq.${partnerId}`,
        },
        () => {
          loadData(partnerId);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [partnerId]);

  const handleRequestPayout = async () => {
    if (!partnerId) return;
    setRequesting(true);
    setErrorMsg('');
    setSuccessMsg('');

    // 1. Try FastAPI authoritative payout request
    try {
      const res = await api.requestPartnerPayout();
      if (res && res.success) {
        setSuccessMsg(
          `Payout request for RM${Number(res.total_amount_myr).toFixed(2)} (${res.total_redemptions} meals) submitted successfully! Admin will process it shortly.`
        );
        await loadData(partnerId);
        setRequesting(false);
        return;
      }
    } catch (apiErr: any) {
      console.warn('FastAPI requestPartnerPayout error, checking details:', apiErr);
      if (apiErr?.message && !apiErr.message.includes('Failed to fetch')) {
        setErrorMsg(apiErr.message);
        setRequesting(false);
        return;
      }
    }

    // 2. Fallback to client-side Supabase calculation
    const { data: redemptions } = await supabase
      .from('redemptions')
      .select('id, redeemed_at, meals:meal_id(price_myr)')
      .eq('partner_id', partnerId)
      .eq('status', 'confirmed');

    if (!redemptions || redemptions.length === 0) {
      setErrorMsg('No confirmed redemptions available for settlement.');
      setRequesting(false);
      return;
    }

    const totalAmount = redemptions.reduce(
      (sum, r) => sum + Number((r.meals as any)?.price_myr || 0),
      0
    );
    const now = new Date().toISOString();
    const periodStart = redemptions.reduce(
      (min, r) => (r.redeemed_at < min ? r.redeemed_at : min),
      redemptions[0].redeemed_at
    );

    const { error } = await supabase.from('settlements').insert({
      partner_id: partnerId,
      period_start: periodStart,
      period_end: now,
      total_redemptions: redemptions.length,
      total_amount_myr: totalAmount,
      settlement_rate_myr: totalAmount / redemptions.length,
      status: 'requested',
      payout_requested_at: now,
    });

    if (error) {
      setErrorMsg('Failed to submit payout request. Please try again.');
    } else {
      setSuccessMsg('Payout request submitted successfully! Admin will process it shortly.');
      await loadData(partnerId);
    }
    setRequesting(false);
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const kpiCards = [
    {
      label: 'Total Paid Out',
      value: `RM ${kpis.totalPaid.toFixed(2)}`,
      icon: (
        <svg
          className="w-5 h-5 text-emerald-500"
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
      sub: 'Lifetime settled',
      accent: 'border-l-emerald-400',
    },
    {
      label: 'Pending Amount',
      value: `RM ${kpis.pendingAmount.toFixed(2)}`,
      icon: (
        <svg
          className="w-5 h-5 text-amber-500"
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
      sub: 'Awaiting payout',
      accent: 'border-l-amber-400',
    },
    {
      label: 'Total Redemptions',
      value: kpis.totalRedemptions.toLocaleString(),
      icon: (
        <svg
          className="w-5 h-5 text-[#3ECBA0]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
      sub: 'All-time settled',
      accent: 'border-l-[#3ECBA0]',
    },
    {
      label: 'Last Paid',
      value: kpis.lastPaidDate ? formatDate(kpis.lastPaidDate) : 'Never',
      icon: (
        <svg
          className="w-5 h-5 text-[#6B7280]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      sub: 'Most recent payout',
      accent: 'border-l-gray-300',
    },
  ];

  return (
    <PartnerLayout>
      <div className="space-y-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">Settlement</h1>
            <p className="text-[#6B7280] text-sm mt-0.5">
              Track your payout history and request settlements.
            </p>
          </div>
          <button
            onClick={handleRequestPayout}
            disabled={requesting}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1a3028] text-white text-sm font-semibold rounded-xl hover:bg-[#0d2b22] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {requesting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            Request Payout
          </button>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {errorMsg}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card) => (
            <div
              key={card.label}
              className={`bg-white rounded-2xl border border-[#E5E7EB] p-5 border-l-4 ${card.accent}`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                  {card.label}
                </p>
                <div className="w-8 h-8 rounded-lg bg-[#F9FAFB] flex items-center justify-center">
                  {card.icon}
                </div>
              </div>
              <p className="text-xl font-bold text-[#111827]">{card.value}</p>
              <p className="text-xs text-[#9CA3AF] mt-1">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Settlement History */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F3F4F6]">
            <h2 className="text-base font-semibold text-[#111827]">Settlement History</h2>
            <p className="text-xs text-[#9CA3AF] mt-0.5">All payout periods and their statuses</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 rounded-full border-2 border-[#3ECBA0] border-t-transparent animate-spin" />
            </div>
          ) : settlements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-[#F3F4F6] flex items-center justify-center mb-4">
                <svg
                  className="w-7 h-7 text-[#9CA3AF]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-[#374151] font-semibold text-sm">No settlements yet</p>
              <p className="text-[#9CA3AF] text-xs mt-1">
                Request your first payout once you have confirmed redemptions.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F9FAFB]">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                      Period
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                      Redemptions
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                      Amount
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                      Rate/Meal
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                      Paid Date
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                      Reference
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {settlements.map((s) => (
                    <tr key={s.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-[#111827]">
                          {formatDate(s.period_start)}
                        </p>
                        <p className="text-xs text-[#9CA3AF]">to {formatDate(s.period_end)}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#374151] font-medium">
                        {s.total_redemptions}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-[#3ECBA0]">
                          RM {Number(s.total_amount_myr).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#374151]">
                        RM {Number(s.settlement_rate_myr).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-[#374151]">{formatDate(s.paid_at)}</td>
                      <td className="px-6 py-4 text-sm text-[#9CA3AF]">
                        {s.payment_reference || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PartnerLayout>
  );
}

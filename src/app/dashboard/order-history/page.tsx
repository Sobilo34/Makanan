'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

interface Redemption {
  id: string;
  redeemed_at: string;
  status: string;
  qr_code: string;
  meals: { name: string; category: string; image_url: string };
  partners: { name: string };
}

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  confirmed: { label: 'Redeemed', bg: '#EBF9F4', text: '#2DAF87', dot: '#3ECBA0' },
  pending: { label: 'Pending', bg: '#FFF8E6', text: '#D97706', dot: '#F59E0B' },
  cancelled: { label: 'Cancelled', bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' },
  refunded: { label: 'Refunded', bg: '#F5F6FA', text: '#6B7280', dot: '#9CA3AF' },
};

const categoryColors: Record<string, { bg: string; text: string }> = {
  breakfast: { bg: '#FFF8E6', text: '#D97706' },
  lunch: { bg: '#EBF9F4', text: '#2DAF87' },
  dinner: { bg: '#EEF2FF', text: '#4F46E5' },
  supper: { bg: '#FDF2F8', text: '#9333EA' },
};

function groupByDate(items: Redemption[]) {
  const groups: Record<string, Redemption[]> = {};
  items.forEach((item) => {
    const d = new Date(item.redeemed_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let label: string;
    if (d.toDateString() === today.toDateString()) label = 'Today';
    else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday';
    else label = d.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    if (!groups[label]) groups[label] = [];
    groups[label].push(item);
  });
  return groups;
}

export default function OrderHistoryPage() {
  const { user } = useAuth();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      const supabase = createClient();
      try {
        const { data } = await supabase
          .from('redemptions')
          .select('*, meals(name, category, image_url), partners(name)')
          .eq('user_id', user.id)
          .order('redeemed_at', { ascending: false });
        setRedemptions(data || []);
      } catch (err) {
        console.log('Order history fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  const filtered = redemptions.filter((r) => {
    const matchFilter = filter === 'all' || r.status === filter;
    const matchSearch = !search.trim() || r.meals?.name?.toLowerCase().includes(search.toLowerCase()) || r.partners?.name?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const grouped = groupByDate(filtered);
  const groupKeys = Object.keys(grouped);

  const stats = {
    total: redemptions.length,
    confirmed: redemptions.filter((r) => r.status === 'confirmed').length,
    pending: redemptions.filter((r) => r.status === 'pending').length,
  };

  return (
    <div className="min-h-full bg-[#F0F2F5]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 lg:px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[#111827] font-bold text-2xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>Order History</h1>
            <p className="text-[#9CA3AF] text-sm mt-0.5">All your meal redemptions in one place</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-[#9CA3AF]">
            <span className="font-semibold text-[#111827]">{stats.total}</span> total orders
          </div>
        </div>
      </div>

      <div className="px-6 lg:px-8 py-6 max-w-4xl">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Orders', value: stats.total, color: '#3ECBA0', bg: '#EBF9F4' },
            { label: 'Redeemed', value: stats.confirmed, color: '#2DAF87', bg: '#D1FAE5' },
            { label: 'Pending', value: stats.pending, color: '#D97706', bg: '#FFF8E6' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
              <p className="text-2xl font-black" style={{ color }}>{value}</p>
              <p className="text-[#9CA3AF] text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex-1 focus-within:border-[#3ECBA0] transition-colors">
            <svg className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by meal or restaurant..."
              className="flex-1 bg-transparent text-sm text-[#111827] placeholder-[#9CA3AF] outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {(['all', 'confirmed', 'pending', 'cancelled'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border ${
                  filter === f
                    ? 'bg-[#3ECBA0] text-white border-[#3ECBA0]'
                    : 'bg-white text-[#6B7280] border-gray-200 hover:border-[#3ECBA0]/40'
                }`}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Orders list */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 h-20 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-[#111827] font-bold text-base mb-1">No orders found</p>
            <p className="text-[#9CA3AF] text-sm">
              {search ? 'Try a different search term' : 'Your meal redemptions will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupKeys.map((dateLabel) => (
              <div key={dateLabel}>
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-[#111827] font-bold text-sm">{dateLabel}</p>
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-[#9CA3AF] text-xs">{grouped[dateLabel].length} order{grouped[dateLabel].length !== 1 ? 's' : ''}</span>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                  {grouped[dateLabel].map((r) => {
                    const st = statusConfig[r.status] || statusConfig.confirmed;
                    const cat = categoryColors[r.meals?.category] || { bg: '#F5F6FA', text: '#6B7280' };
                    const time = new Date(r.redeemed_at).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: true });
                    return (
                      <div key={r.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                        {/* Meal image */}
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                          {r.meals?.image_url ? (
                            <img src={r.meals.image_url} alt={r.meals?.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[#111827] font-semibold text-sm truncate">{r.meals?.name || 'Meal'}</p>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: cat.bg, color: cat.text }}>
                              {r.meals?.category?.toUpperCase() || 'MEAL'}
                            </span>
                          </div>
                          <p className="text-[#9CA3AF] text-xs mt-0.5">{r.partners?.name} · {time}</p>
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: st.dot }} />
                          <span className="text-xs font-semibold" style={{ color: st.text }}>{st.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

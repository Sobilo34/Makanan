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

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  confirmed: { label: 'Redeemed', bg: '#EBF9F4', text: '#2DAF87' },
  pending: { label: 'Pending', bg: '#FFF8E6', text: '#D97706' },
  cancelled: { label: 'Cancelled', bg: '#FEF2F2', text: '#DC2626' },
  refunded: { label: 'Refunded', bg: '#F5F6FA', text: '#6B7280' },
};

const categoryLabel: Record<string, string> = {
  breakfast: 'BREAKFAST',
  lunch: 'LUNCH',
  dinner: 'DINNER',
  supper: 'SUPPER',
};

const categoryColor: Record<string, { bg: string; text: string }> = {
  breakfast: { bg: '#FFF8E6', text: '#D97706' },
  lunch: { bg: '#EBF9F4', text: '#2DAF87' },
  dinner: { bg: '#EEF2FF', text: '#4F46E5' },
  supper: { bg: '#FDF2F8', text: '#9333EA' },
};

// Simple QR-like visual using CSS grid
function QRDisplay({ code }: { code: string }) {
  return (
    <div className="w-20 h-20 bg-white rounded-lg p-1.5 border border-gray-200 flex-shrink-0">
      <div className="w-full h-full grid grid-cols-7 gap-px">
        {Array.from({ length: 49 }).map((_, i) => {
          const hash = (code.charCodeAt(i % code.length) + i * 7) % 3;
          return (
            <div
              key={i}
              className={`rounded-sm ${hash === 0 ? 'bg-[#1A1A1A]' : 'bg-transparent'}`}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

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
        console.log('Orders fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();

    // Real-time: update when redemption status changes (e.g., partner confirms)
    const supabase = createClient();
    const channel = supabase
      .channel(`student-orders-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'redemptions',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setRedemptions((prev) => [payload.new as any, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setRedemptions((prev) =>
            prev.map((r) => r.id === (payload.new as any).id ? { ...r, status: (payload.new as any).status } : r)
          );
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  };

  const formatOrderDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-MY', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
  };

  const todayRedemptions = redemptions.filter((r) => isToday(r.redeemed_at));
  const historyRedemptions = redemptions.filter((r) => !isToday(r.redeemed_at));

  return (
    <div className="min-h-full bg-[#F5F7F5] pb-8">
      {/* ── Mobile header ── */}
      <div className="lg:hidden flex items-center gap-3 px-5 pt-6 pb-4">
        <span className="text-2xl">👋</span>
        <h1 className="text-[#1A1A1A] font-bold text-2xl flex-1">Orders</h1>
      </div>

      {/* ── Desktop header ── */}
      <div className="hidden lg:flex items-center justify-between px-8 pt-8 pb-6">
        <div>
          <h1 className="text-[#1A1A1A] font-bold text-2xl">Orders</h1>
          <p className="text-[#9CA3AF] text-sm mt-0.5">Your meal redemption history</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
          <span>{redemptions.length} total orders</span>
        </div>
      </div>

      <div className="px-5 lg:px-8">
        {/* ── Tabs ── */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-5 w-full max-w-xs">
          {(['active', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${
                activeTab === tab
                  ? 'bg-[#3ECBA0] text-white shadow-sm'
                  : 'text-[#6B7280] hover:text-[#374151]'
              }`}
            >
              {tab === 'active' ? 'Active' : 'History'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Main content ── */}
          <div className="lg:col-span-2 space-y-5">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 h-24 animate-pulse" />
                ))}
              </div>
            ) : activeTab === 'active' ? (
              <>
                {/* Today's Redemption */}
                <div>
                  <h2 className="text-[#1A1A1A] font-bold text-lg mb-3">Today&apos;s Redemption</h2>
                  {todayRedemptions.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                      <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-7 h-7 text-[#D0D0D0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <p className="text-[#1A1A1A] font-semibold mb-1">No redemption today</p>
                      <p className="text-[#9CA3AF] text-sm">Redeem a meal from the Meals page</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {todayRedemptions.map((r) => {
                        const st = statusConfig[r.status] || statusConfig.confirmed;
                        const cat = categoryColor[r.meals?.category] || { bg: '#F5F6FA', text: '#6B7280' };
                        return (
                          <div key={r.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50">
                                {r.meals?.image_url ? (
                                  <img src={r.meals.image_url} alt={r.meals?.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[#1A1A1A] font-bold text-base">{r.meals?.name}</p>
                                <p className="text-[#6B7280] text-sm">{r.partners?.name}</p>
                                <span
                                  className="inline-block mt-1.5 text-xs font-bold px-3 py-1 rounded-full"
                                  style={{ background: st.bg, color: st.text }}
                                >
                                  {st.label}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-start gap-3 pt-3 border-t border-gray-100">
                              <div className="flex-1">
                                <p className="text-[#6B7280] text-xs mb-1">Show this redemption confirmation at the cafeteria.</p>
                                <p className="text-[#1A1A1A] font-mono font-bold text-xs">{r.qr_code}</p>
                                <p className="text-[#9CA3AF] text-xs mt-0.5">Valid for this meal.</p>
                              </div>
                              {r.qr_code && <QRDisplay code={r.qr_code} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Order History */}
                <div>
                  <div className="mb-3">
                    <h2 className="text-[#1A1A1A] font-bold text-lg">Order History</h2>
                    <p className="text-[#9CA3AF] text-sm">Section heading 18-20px</p>
                  </div>

                  {historyRedemptions.length === 0 ? (
                    <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-8 h-8 text-[#D0D0D0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <p className="text-[#1A1A1A] font-semibold mb-1">No meal history yet.</p>
                      <p className="text-[#9CA3AF] text-sm">Secondary body 12-14px</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                      {historyRedemptions.map((r, idx) => {
                        const st = statusConfig[r.status] || statusConfig.confirmed;
                        const cat = categoryColor[r.meals?.category] || { bg: '#F5F6FA', text: '#6B7280' };
                        const catLabel = categoryLabel[r.meals?.category] || r.meals?.category?.toUpperCase() || 'MEAL';
                        return (
                          <div
                            key={r.id}
                            className={`px-4 py-3.5 ${idx !== historyRedemptions.length - 1 ? 'border-b border-gray-100' : ''}`}
                          >
                            <p className="text-[#1A1A1A] font-semibold text-sm mb-0.5">
                              {formatOrderDate(r.redeemed_at)} | {r.meals?.name}
                            </p>
                            <p className="text-[#6B7280] text-xs mb-2">{r.partners?.name}</p>
                            <div className="flex items-center gap-2">
                              <span
                                className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                                style={{ background: cat.bg, color: cat.text }}
                              >
                                {catLabel}
                              </span>
                              <span className="text-[#9CA3AF] text-xs">|</span>
                              <span
                                className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                                style={{ background: st.bg, color: st.text }}
                              >
                                {st.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ── Right panel — desktop only ── */}
          <div className="hidden lg:flex flex-col gap-5">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="text-[#1A1A1A] font-bold text-sm mb-4">Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280] text-sm">Total Orders</span>
                  <span className="text-[#1A1A1A] font-bold">{redemptions.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280] text-sm">Redeemed</span>
                  <span className="text-[#2DAF87] font-bold">{redemptions.filter((r) => r.status === 'confirmed').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280] text-sm">Pending</span>
                  <span className="text-[#D97706] font-bold">{redemptions.filter((r) => r.status === 'pending').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280] text-sm">Cancelled</span>
                  <span className="text-[#DC2626] font-bold">{redemptions.filter((r) => r.status === 'cancelled').length}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#EBF9F4] rounded-2xl p-5 border border-[#C8F0E4]">
              <p className="text-[#2DAF87] font-bold text-sm mb-1">💡 Tip</p>
              <p className="text-[#2DAF87]/80 text-xs leading-relaxed">
                Show your QR code at the cafeteria counter to redeem your meal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

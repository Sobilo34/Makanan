'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';

interface Partner {
  id: string;
  name: string;
  location: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  rating: number;
  meals_available: number;
  meals_redeemed: number;
  is_active: boolean;
  created_at: string;
  redemptionCount?: number;
}

type TabType = 'active' | 'pending' | 'suspended';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'text-amber-400' : 'text-[#E5E7EB]'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      {rating > 0 ? (
        <span className="text-xs text-[#6B7280] ml-1">{rating.toFixed(1)}</span>
      ) : (
        <span className="text-xs text-[#9CA3AF] ml-1">N/A</span>
      )}
    </div>
  );
}

function PartnerInitials({ name }: { name: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div className="w-10 h-10 rounded-xl bg-[#3ECBA0]/10 flex items-center justify-center flex-shrink-0">
      <span className="text-sm font-bold text-[#3ECBA0]">{initials}</span>
    </div>
  );
}

export default function PartnersPage() {
  const supabase = createClient();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('active');

  useEffect(() => {
    const loadPartners = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('partners')
          .select('*')
          .order('created_at', { ascending: false });

        if (data) {
          const enriched = await Promise.all(
            data.map(async (p) => {
              const { count } = await supabase
                .from('redemptions')
                .select('id', { count: 'exact' })
                .eq('partner_id', p.id);
              return { ...p, redemptionCount: count || 0 };
            })
          );
          setPartners(enriched);
        }
      } catch (err) {
        console.error('Partners load error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPartners();
  }, []);

  const demoPartners: Partner[] = [
    { id: 'd1', name: 'Central Kitchen', location: 'Alor Setar, Kedah', email: 'central@kitchen.com', phone: '+60 12-111 2222', status: 'active', rating: 4.9, meals_available: 300, meals_redeemed: 215, is_active: true, created_at: new Date().toISOString(), redemptionCount: 215 },
    { id: 'd2', name: 'Campus Hub Cafe', location: 'Campus B, Campus Hub', email: 'hub@campus.com', phone: '+60 12-333 4444', status: 'active', rating: 4.5, meals_available: 150, meals_redeemed: 95, is_active: true, created_at: new Date().toISOString(), redemptionCount: 95 },
    { id: 'd3', name: 'Mamak Stall A', location: 'Alor Setar', email: 'mamak@stall.com', phone: '+60 12-555 6666', status: 'active', rating: 4.3, meals_available: 200, meals_redeemed: 170, is_active: true, created_at: new Date().toISOString(), redemptionCount: 170 },
    { id: 'd4', name: 'Kiosk 7', location: 'Student Center', email: 'kiosk7@campus.com', phone: '+60 12-777 8888', status: 'pending', rating: 0, meals_available: 50, meals_redeemed: 12, is_active: false, created_at: new Date().toISOString(), redemptionCount: 12 },
    { id: 'd5', name: 'Downtown Grocer', location: 'Alor Setar', email: 'downtown@grocer.com', phone: '+60 12-999 0000', status: 'suspended', rating: 0, meals_available: 0, meals_redeemed: 0, is_active: false, created_at: new Date().toISOString(), redemptionCount: 0 },
  ];

  const getTabPartners = (tab: TabType, list: Partner[]) => {
    return list.filter((p) => {
      if (tab === 'active') return p.status === 'active' || (p.is_active && p.status !== 'pending' && p.status !== 'suspended');
      if (tab === 'pending') return p.status === 'pending';
      if (tab === 'suspended') return p.status === 'suspended' || (!p.is_active && p.status !== 'pending');
      return true;
    });
  };

  const sourcePartners = partners.length === 0 && !loading ? demoPartners : partners;
  const tabPartners = getTabPartners(activeTab, sourcePartners);
  const filtered = tabPartners.filter(
    (p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.location || '').toLowerCase().includes(search.toLowerCase())
  );

  const tabCounts = {
    active: getTabPartners('active', sourcePartners).length,
    pending: getTabPartners('pending', sourcePartners).length,
    suspended: getTabPartners('suspended', sourcePartners).length,
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string }> = {
      active: { bg: '#dcfce7', text: '#16a34a' },
      pending: { bg: '#fef3c7', text: '#d97706' },
      suspended: { bg: '#fee2e2', text: '#dc2626' },
    };
    const s = map[status] || map['active'];
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize" style={{ background: s.bg, color: s.text }}>
        {status}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">Partner Management</h1>
            <p className="text-[#6B7280] text-sm mt-0.5">{sourcePartners.length} total partners</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #3ECBA0, #2db88d)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Partner
          </button>
        </div>

        {/* Search + Tabs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search partners..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#374151] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/20 focus:border-[#3ECBA0] transition-all"
            />
          </div>
          <div className="flex items-center bg-[#F3F4F6] rounded-xl p-1 gap-1">
            {(['active', 'pending', 'suspended'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize flex items-center gap-1.5 ${
                  activeTab === tab
                    ? tab === 'active' ? 'bg-[#3ECBA0] text-white shadow-sm' : tab === 'pending' ? 'bg-amber-500 text-white shadow-sm' : 'bg-red-500 text-white shadow-sm'
                    : 'text-[#6B7280] hover:text-[#374151]'
                }`}
              >
                {tab}
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    activeTab === tab ? 'bg-white/20 text-white' : 'bg-[#E5E7EB] text-[#6B7280]'
                  }`}
                >
                  {tabCounts[tab]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#F3F4F6] overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[2.5fr_1.5fr_1fr_1fr_1fr_1.5fr] gap-4 px-5 py-3 border-b border-[#F3F4F6] bg-[#FAFAFA]">
            {['Partner Name', 'Location', 'Meals Available', 'Meals Redeemed', 'Status', 'Performance'].map((h) => (
              <p key={h} className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">{h}</p>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 rounded-full border-2 border-[#3ECBA0] border-t-transparent animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-[#9CA3AF]">No partners found in this category</div>
          ) : (
            <div className="divide-y divide-[#F9FAFB]">
              {filtered.map((partner) => (
                <div key={partner.id} className="grid grid-cols-[2.5fr_1.5fr_1fr_1fr_1fr_1.5fr] gap-4 px-5 py-4 hover:bg-[#F9FAFB] transition-colors items-center group cursor-pointer">
                  {/* Partner name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <PartnerInitials name={partner.name} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#374151] truncate">{partner.name}</p>
                      <p className="text-xs text-[#9CA3AF] truncate">{partner.email || 'No email'}</p>
                    </div>
                  </div>

                  {/* Location */}
                  <p className="text-sm text-[#6B7280]">{partner.location || '—'}</p>

                  {/* Meals available */}
                  <div>
                    <p className="text-sm font-semibold text-[#374151]">{partner.meals_available}</p>
                    <p className="text-xs text-[#9CA3AF]">Meals</p>
                  </div>

                  {/* Meals redeemed */}
                  <div>
                    <p className="text-sm font-semibold text-[#374151]">{partner.redemptionCount || partner.meals_redeemed}</p>
                    <p className="text-xs text-[#9CA3AF]">Red.</p>
                  </div>

                  {/* Status */}
                  {statusBadge(partner.status || (partner.is_active ? 'active' : 'suspended'))}

                  {/* Performance / Rating */}
                  <StarRating rating={partner.rating || 0} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

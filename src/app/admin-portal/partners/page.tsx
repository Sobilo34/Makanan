'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { api } from '@/lib/api';

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
type DetailTab = 'meals' | 'redemptions' | 'performance' | 'settlement';

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
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className="w-10 h-10 rounded-xl bg-[#3ECBA0]/10 flex items-center justify-center flex-shrink-0">
      <span className="text-sm font-bold text-[#3ECBA0]">{initials}</span>
    </div>
  );
}

function PartnerDetailView({
  partner,
  onBack,
  onRefresh,
}: {
  partner: Partner;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const [detailTab, setDetailTab] = useState<DetailTab>('meals');
  const [partnerMeals, setPartnerMeals] = useState<any[]>([]);
  const [partnerRedemptions, setPartnerRedemptions] = useState<any[]>([]);
  const [partnerSettlements, setPartnerSettlements] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoadingDetails(true);
      try {
        const [mealsData, redemptionsData, settlementsData] = await Promise.all([
          api.getMeals({ partner_id: partner.id }).catch(() => []),
          api.listAdminRedemptions().catch(() => []),
          api.listAdminSettlements().catch(() => []),
        ]);

        if (Array.isArray(mealsData)) {
          setPartnerMeals(mealsData);
        }
        if (Array.isArray(redemptionsData)) {
          setPartnerRedemptions(
            redemptionsData.filter(
              (r: any) =>
                r.partner_id === partner.id ||
                r.partner_name?.toLowerCase() === partner.name?.toLowerCase()
            )
          );
        }
        if (Array.isArray(settlementsData)) {
          setPartnerSettlements(
            settlementsData.filter(
              (s: any) =>
                s.partner_id === partner.id ||
                s.partner_name?.toLowerCase() === partner.name?.toLowerCase()
            )
          );
        }
      } catch (err) {
        console.error('Failed to load partner details:', err);
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchDetails();
  }, [partner.id, partner.name]);

  const togglePartnerStatus = async () => {
    setUpdating(true);
    try {
      const newStatus = partner.is_active ? 'suspended' : 'active';
      await api.updateAdminPartner(partner.id, {
        is_active: !partner.is_active,
        status: newStatus,
      });
      partner.is_active = !partner.is_active;
      partner.status = newStatus;
      onRefresh();
    } catch (err) {
      console.error('Failed to update partner:', err);
    } finally {
      setUpdating(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === 'active') return { bg: '#dcfce7', text: '#16a34a' };
    if (s === 'pending') return { bg: '#fef3c7', text: '#d97706' };
    return { bg: '#fee2e2', text: '#dc2626' };
  };

  const sc = statusColor(partner.status || (partner.is_active ? 'active' : 'suspended'));

  const kpis = [
    {
      label: 'Meals Served',
      value: partnerRedemptions.length,
      icon: '🍽️',
      color: '#3ECBA0',
    },
    { label: 'Active Meals', value: partnerMeals.length, icon: '📋', color: '#6366F1' },
    {
      label: 'Total Redemptions',
      value: partnerRedemptions.length,
      icon: '✅',
      color: '#F59E0B',
    },
    {
      label: 'Settlements',
      value: partnerSettlements.length,
      icon: '💰',
      color: '#EC4899',
    },
  ];

  const redemptionStatusStyle = (s: string) => {
    if (s === 'success' || s === 'completed') return { bg: '#E8F8F1', text: '#4CAF7D' };
    if (s === 'pending') return { bg: '#FEF9EC', text: '#F2C94C' };
    return { bg: '#FDECEA', text: '#E57373' };
  };

  return (
    <div className="space-y-5">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#374151] transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Partners
      </button>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-[#F3F4F6] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-[#3ECBA0]"
              style={{ background: 'linear-gradient(135deg, #E8F8F1, #C6F0E0)' }}
            >
              {partner.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#111827]">{partner.name}</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
                  style={{ background: sc.bg, color: sc.text }}
                >
                  {partner.status || (partner.is_active ? 'Active' : 'Suspended')}
                </span>
                {partner.location && (
                  <span className="flex items-center gap-1 text-sm text-[#6B7280]">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {partner.location}
                  </span>
                )}
                {partner.email && <span className="text-sm text-[#9CA3AF]">{partner.email}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={togglePartnerStatus}
              disabled={updating}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                partner.is_active
                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
              }`}
            >
              {updating ? 'Updating...' : partner.is_active ? 'Suspend Partner' : 'Activate Partner'}
            </button>
          </div>
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
            <p className="text-2xl font-bold text-[#111827]">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-[#F3F4F6] overflow-hidden">
        <div className="flex border-b border-[#F3F4F6] px-5 pt-4 gap-1">
          {(['meals', 'redemptions', 'settlement'] as DetailTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setDetailTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg capitalize transition-all ${
                detailTab === tab
                  ? 'text-[#3ECBA0] border-b-2 border-[#3ECBA0] bg-[#3ECBA0]/5'
                  : 'text-[#6B7280] hover:text-[#374151]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-5">
          {loadingDetails ? (
            <div className="py-12 text-center text-sm text-[#9CA3AF]">Loading partner records...</div>
          ) : detailTab === 'meals' ? (
            <div className="space-y-3">
              {partnerMeals.length === 0 ? (
                <p className="text-sm text-[#9CA3AF] text-center py-6">No meals registered for this cafeteria yet.</p>
              ) : (
                <>
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-3 py-2 bg-[#FAFAFA] rounded-xl">
                    {['Meal Name', 'Category', 'Price', 'Status'].map((h) => (
                      <p key={h} className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                        {h}
                      </p>
                    ))}
                  </div>
                  {partnerMeals.map((meal) => (
                    <div
                      key={meal.id}
                      className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-3 py-3 rounded-xl hover:bg-[#F9FAFB] transition-colors items-center"
                    >
                      <p className="text-sm font-semibold text-[#374151]">{meal.name}</p>
                      <span className="text-xs px-2 py-1 rounded-full bg-[#F3F4F6] text-[#6B7280] w-fit">
                        {meal.category || 'Mains'}
                      </span>
                      <p className="text-sm text-[#374151]">RM {Number(meal.price_myr || 0).toFixed(2)}</p>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full w-fit ${
                          meal.is_available
                            ? 'bg-[#E8F8F1] text-[#4CAF7D]'
                            : 'bg-[#FDECEA] text-[#E57373]'
                        }`}
                      >
                        {meal.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : detailTab === 'redemptions' ? (
            <div className="space-y-3">
              {partnerRedemptions.length === 0 ? (
                <p className="text-sm text-[#9CA3AF] text-center py-6">No redemptions recorded for this cafeteria yet.</p>
              ) : (
                <>
                  <div className="grid grid-cols-[1fr_2fr_2fr_1fr_1fr] gap-4 px-3 py-2 bg-[#FAFAFA] rounded-xl">
                    {['Time', 'Student', 'Meal', 'Plan', 'Status'].map((h) => (
                      <p key={h} className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                        {h}
                      </p>
                    ))}
                  </div>
                  {partnerRedemptions.map((r) => {
                    const rs = redemptionStatusStyle(r.status);
                    return (
                      <div
                        key={r.id}
                        className="grid grid-cols-[1fr_2fr_2fr_1fr_1fr] gap-4 px-3 py-3 rounded-xl hover:bg-[#F9FAFB] transition-colors items-center"
                      >
                        <p className="text-sm text-[#6B7280]">
                          {new Date(r.redeemed_at || r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-sm font-medium text-[#374151]">{r.student_name}</p>
                        <p className="text-sm text-[#6B7280]">{r.meal_name}</p>
                        <span className="text-xs px-2 py-1 rounded-full bg-[#F3F4F6] text-[#6B7280] w-fit">
                          {r.plan_name || 'Standard'}
                        </span>
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize w-fit"
                          style={{ background: rs.bg, color: rs.text }}
                        >
                          {r.status}
                        </span>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {partnerSettlements.length === 0 ? (
                <p className="text-sm text-[#9CA3AF] text-center py-6">No settlements filed for this partner yet.</p>
              ) : (
                <>
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-3 py-2 bg-[#FAFAFA] rounded-xl">
                    {['Period', 'Meals', 'Amount', 'Status'].map((h) => (
                      <p key={h} className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                        {h}
                      </p>
                    ))}
                  </div>
                  {partnerSettlements.map((s) => (
                    <div
                      key={s.id}
                      className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-3 py-3 rounded-xl hover:bg-[#F9FAFB] transition-colors items-center"
                    >
                      <p className="text-sm font-medium text-[#374151]">
                        {new Date(s.period_start).toLocaleDateString()} – {new Date(s.period_end).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-[#6B7280]">{s.meals_count}</p>
                      <p className="text-sm font-semibold text-[#374151]">RM {Number(s.amount_myr || 0).toFixed(2)}</p>
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${
                          s.status === 'paid'
                            ? 'bg-[#E8F8F1] text-[#4CAF7D]'
                            : 'bg-[#FEF9EC] text-[#F2C94C]'
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const loadPartners = async () => {
    setLoading(true);
    try {
      const data = await api.listAdminPartners();
      if (data && Array.isArray(data)) {
        setPartners(
          data.map((p: any) => ({
            id: p.id,
            name: p.name,
            location: p.location || 'Campus Cafeteria',
            email: p.email || null,
            phone: p.phone || null,
            status: p.status || (p.is_active ? 'active' : 'suspended'),
            rating: p.rating || 5.0,
            meals_available: p.meals_count || 0,
            meals_redeemed: p.redemptions_count || 0,
            is_active: p.is_active !== undefined ? p.is_active : p.status !== 'suspended',
            created_at: p.created_at || new Date().toISOString(),
            redemptionCount: p.redemptions_count || 0,
          }))
        );
      }
    } catch (err) {
      console.error('Partners load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();
  }, []);

  const getTabPartners = (tab: TabType, list: Partner[]) => {
    return list.filter((p) => {
      if (tab === 'active')
        return (
          p.status === 'active' ||
          (p.is_active && p.status !== 'pending' && p.status !== 'suspended')
        );
      if (tab === 'pending') return p.status === 'pending';
      if (tab === 'suspended')
        return p.status === 'suspended' || (!p.is_active && p.status !== 'pending');
      return true;
    });
  };

  const tabPartners = getTabPartners(activeTab, partners);
  const filtered = tabPartners.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.location || '').toLowerCase().includes(search.toLowerCase())
  );

  const tabCounts = {
    active: getTabPartners('active', partners).length,
    pending: getTabPartners('pending', partners).length,
    suspended: getTabPartners('suspended', partners).length,
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string }> = {
      active: { bg: '#dcfce7', text: '#16a34a' },
      pending: { bg: '#fef3c7', text: '#d97706' },
      suspended: { bg: '#fee2e2', text: '#dc2626' },
    };
    const s = map[status] || map['active'];
    return (
      <span
        className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
        style={{ background: s.bg, color: s.text }}
      >
        {status}
      </span>
    );
  };

  if (selectedPartner) {
    return (
      <AdminLayout>
        <PartnerDetailView
          partner={selectedPartner}
          onBack={() => setSelectedPartner(null)}
          onRefresh={loadPartners}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">Partner Management</h1>
            <p className="text-[#6B7280] text-sm mt-0.5">{partners.length} total partners</p>
          </div>
        </div>

        {/* Search + Tabs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
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
                    ? tab === 'active'
                      ? 'bg-[#3ECBA0] text-white shadow-sm'
                      : tab === 'pending'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'bg-red-500 text-white shadow-sm'
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
          <div className="grid grid-cols-[2.5fr_1.5fr_1fr_1fr_1fr_1.5fr] gap-4 px-5 py-3 border-b border-[#F3F4F6] bg-[#FAFAFA]">
            {[
              'Partner Name',
              'Location',
              'Meals Available',
              'Meals Redeemed',
              'Status',
              'Performance',
            ].map((h) => (
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
            <div className="text-center py-16 text-[#9CA3AF]">
              No partners found in this category
            </div>
          ) : (
            <div className="divide-y divide-[#F9FAFB]">
              {filtered.map((partner) => (
                <div
                  key={partner.id}
                  onClick={() => setSelectedPartner(partner)}
                  className="grid grid-cols-[2.5fr_1.5fr_1fr_1fr_1fr_1.5fr] gap-4 px-5 py-4 hover:bg-[#F9FAFB] transition-colors items-center cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <PartnerInitials name={partner.name} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#374151] truncate group-hover:text-[#3ECBA0] transition-colors">
                        {partner.name}
                      </p>
                      <p className="text-xs text-[#9CA3AF] truncate">
                        {partner.email || 'No email'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-[#6B7280]">{partner.location || '—'}</p>
                  <div>
                    <p className="text-sm font-semibold text-[#374151]">
                      {partner.meals_available}
                    </p>
                    <p className="text-xs text-[#9CA3AF]">Meals</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#374151]">
                      {partner.redemptionCount || partner.meals_redeemed}
                    </p>
                    <p className="text-xs text-[#9CA3AF]">Red.</p>
                  </div>
                  {statusBadge(partner.status || (partner.is_active ? 'active' : 'suspended'))}
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

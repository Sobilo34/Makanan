'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';

interface MealPlan {
  id: string;
  name: string;
  tier: string;
  price_myr: number;
  credits: number;
  is_active: boolean;
  created_at: string;
  activeStudents?: number;
}

export default function MealPlansPage() {
  const supabase = createClient();
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [toggling, setToggling] = useState<string | null>(null);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('meal_plans')
        .select('*')
        .order('price_myr', { ascending: true });

      if (data) {
        const enriched = await Promise.all(
          data.map(async (plan) => {
            const { count } = await supabase
              .from('subscriptions')
              .select('id', { count: 'exact' })
              .eq('meal_plan_id', plan.id)
              .eq('status', 'active');
            return { ...plan, activeStudents: count || 0 };
          })
        );
        setPlans(enriched);
      }
    } catch (err) {
      console.error('Meal plans load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const togglePlan = async (planId: string, currentStatus: boolean) => {
    setToggling(planId);
    try {
      await supabase.from('meal_plans').update({ is_active: !currentStatus }).eq('id', planId);
      setPlans((prev) =>
        prev.map((p) => (p.id === planId ? { ...p, is_active: !currentStatus } : p))
      );
    } catch (err) {
      console.error('Toggle error:', err);
    } finally {
      setToggling(null);
    }
  };

  const filtered = plans.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === 'all' || (statusFilter === 'active' ? p.is_active : !p.is_active);
    return matchSearch && matchStatus;
  });

  // Demo data fallback
  const demoPlans: MealPlan[] = [
    {
      id: 'd1',
      name: 'Standard RM250 Plan',
      tier: 'standard',
      price_myr: 250,
      credits: 60,
      is_active: true,
      created_at: new Date().toISOString(),
      activeStudents: 85,
    },
    {
      id: 'd2',
      name: 'Eco RM250 Plan',
      tier: 'value',
      price_myr: 250,
      credits: 40,
      is_active: true,
      created_at: new Date().toISOString(),
      activeStudents: 120,
    },
    {
      id: 'd3',
      name: 'Value RM300 Plan',
      tier: 'value',
      price_myr: 300,
      credits: 60,
      is_active: false,
      created_at: new Date().toISOString(),
      activeStudents: 15,
    },
    {
      id: 'd4',
      name: 'Mini RM300 Plan',
      tier: 'standard',
      price_myr: 300,
      credits: 40,
      is_active: true,
      created_at: new Date().toISOString(),
      activeStudents: 90,
    },
    {
      id: 'd5',
      name: 'Premium RM400 Plan',
      tier: 'premium',
      price_myr: 400,
      credits: 60,
      is_active: true,
      created_at: new Date().toISOString(),
      activeStudents: 50,
    },
    {
      id: 'd6',
      name: 'Select RM400 Plan',
      tier: 'premium',
      price_myr: 400,
      credits: 40,
      is_active: true,
      created_at: new Date().toISOString(),
      activeStudents: 30,
    },
  ];

  const displayPlans =
    plans.length === 0 && !loading
      ? demoPlans.filter((p) => {
          const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
          const matchStatus =
            statusFilter === 'all' || (statusFilter === 'active' ? p.is_active : !p.is_active);
          return matchSearch && matchStatus;
        })
      : filtered;

  const tierColor = (tier: string) => {
    const map: Record<string, string> = {
      value: '#3ECBA0',
      standard: '#6366F1',
      premium: '#F59E0B',
    };
    return map[tier] || '#9CA3AF';
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">Meal Plan Management</h1>
            <p className="text-[#6B7280] text-sm mt-0.5">{displayPlans.length} plans configured</p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #3ECBA0, #2db88d)' }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Plan
          </button>
        </div>

        {/* Filters */}
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
              placeholder="Search plans..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#374151] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/20 focus:border-[#3ECBA0] transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/20 focus:border-[#3ECBA0] transition-all"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#F3F4F6] overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[2.5fr_1fr_1fr_1.5fr_1fr_1fr] gap-4 px-5 py-3 border-b border-[#F3F4F6] bg-[#FAFAFA]">
            {['Plan', 'Price', 'Meals', 'Active Students', 'Status', 'Actions'].map((h) => (
              <p key={h} className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                {h}
              </p>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 rounded-full border-2 border-[#3ECBA0] border-t-transparent animate-spin" />
            </div>
          ) : displayPlans.length === 0 ? (
            <div className="text-center py-16 text-[#9CA3AF]">No meal plans found</div>
          ) : (
            <div className="divide-y divide-[#F9FAFB]">
              {displayPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="grid grid-cols-[2.5fr_1fr_1fr_1.5fr_1fr_1fr] gap-4 px-5 py-4 hover:bg-[#F9FAFB] transition-colors items-center"
                >
                  {/* Plan name */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${tierColor(plan.tier)}15` }}
                    >
                      <svg
                        className="w-5 h-5"
                        style={{ color: tierColor(plan.tier) }}
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
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#374151]">{plan.name}</p>
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize"
                        style={{
                          background: `${tierColor(plan.tier)}15`,
                          color: tierColor(plan.tier),
                        }}
                      >
                        {plan.tier}
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <p className="text-base font-bold" style={{ color: tierColor(plan.tier) }}>
                    RM{plan.price_myr}
                  </p>

                  {/* Meals */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">🍴</span>
                    <div>
                      <p className="text-sm font-semibold text-[#374151]">{plan.credits}</p>
                      <p className="text-xs text-[#9CA3AF]">{plan.credits} Meals</p>
                    </div>
                  </div>

                  {/* Active students */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#3ECBA0]/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-[#3ECBA0]">
                        {plan.activeStudents}
                      </span>
                    </div>
                    <p className="text-xs text-[#9CA3AF]">students</p>
                  </div>

                  {/* Status */}
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full w-fit"
                    style={{
                      background: plan.is_active ? '#dcfce7' : '#F3F4F6',
                      color: plan.is_active ? '#16a34a' : '#6B7280',
                    }}
                  >
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] transition-all">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.8}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                    <button className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] transition-all">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.8}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    {/* Toggle */}
                    <button
                      onClick={() => togglePlan(plan.id, plan.is_active)}
                      disabled={toggling === plan.id || plan.id.startsWith('d')}
                      className={`relative w-10 h-5 rounded-full transition-all ${plan.is_active ? 'bg-[#3ECBA0]' : 'bg-[#D1D5DB]'} disabled:opacity-50`}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${plan.is_active ? 'left-5' : 'left-0.5'}`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

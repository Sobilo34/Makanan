'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';

interface Student {
  id: string;
  full_name: string;
  email: string;
  student_id: string | null;
  is_active: boolean;
  created_at: string;
  subscription?: {
    id: string;
    status: string;
    credits_total: number;
    credits_used: number;
    meal_plan?: { name: string; price_myr: number };
    partner?: { name: string };
  } | null;
  last_activity?: string;
}

function InitialsAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const colors = ['#3ECBA0', '#6366F1', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  const color = colors[name.charCodeAt(0) % colors.length];
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{ background: color }}
    >
      {initials}
    </div>
  );
}

function MealsProgress({ used, total }: { used: number; total: number }) {
  const remaining = total - used;
  const pct = total > 0 ? (remaining / total) * 100 : 0;
  const color = pct > 50 ? '#3ECBA0' : pct > 20 ? '#F59E0B' : '#EF4444';
  return (
    <div className="min-w-[120px]">
      <p className="text-sm font-semibold text-[#374151] mb-1">
        {remaining} / {total}
      </p>
      <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export default function StudentsPage() {
  const supabase = createClient();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive'>('active');

  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true);
      try {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, full_name, email, student_id, is_active, created_at')
          .eq('role', 'student')
          .order('created_at', { ascending: false });

        if (!profiles) {
          setLoading(false);
          return;
        }

        const enriched: Student[] = await Promise.all(
          profiles.map(async (p) => {
            const { data: sub } = await supabase
              .from('subscriptions')
              .select('id, status, credits_total, credits_used, meal_plan_id')
              .eq('user_id', p.id)
              .eq('status', 'active')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            let subscription: Student['subscription'] = null;
            if (sub) {
              const { data: plan } = await supabase
                .from('meal_plans')
                .select('name, price_myr')
                .eq('id', sub.meal_plan_id)
                .maybeSingle();
              subscription = { ...sub, meal_plan: plan || undefined };
            }

            const { data: lastRed } = await supabase
              .from('redemptions')
              .select('redeemed_at')
              .eq('user_id', p.id)
              .order('redeemed_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            return {
              ...p,
              subscription,
              last_activity: lastRed?.redeemed_at || p.created_at,
            };
          })
        );

        setStudents(enriched);
      } catch (err) {
        console.error('Students load error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadStudents();
  }, []);

  const filtered = students.filter((s) => {
    const matchStatus = statusFilter === 'active' ? s.is_active : !s.is_active;
    const matchSearch =
      !search ||
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.student_id || '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Demo data fallback
  const demoStudents: Student[] = [
    {
      id: 'demo-1',
      full_name: 'Siti Aisyah',
      email: 'siti@student.aiu.edu',
      student_id: 'SA-2024-00123',
      is_active: true,
      created_at: new Date().toISOString(),
      subscription: {
        id: 's1',
        status: 'active',
        credits_total: 60,
        credits_used: 28,
        meal_plan: { name: 'Standard Plan', price_myr: 300 },
      },
      last_activity: new Date().toISOString(),
    },
    {
      id: 'demo-2',
      full_name: 'Ali Bin Abu',
      email: 'ali@student.aiu.edu',
      student_id: 'AB-2024-00456',
      is_active: false,
      created_at: new Date().toISOString(),
      subscription: {
        id: 's2',
        status: 'expired',
        credits_total: 60,
        credits_used: 60,
        meal_plan: { name: 'Classic Plan', price_myr: 250 },
      },
      last_activity: new Date(Date.now() - 86400000 * 8).toISOString(),
    },
    {
      id: 'demo-3',
      full_name: 'Sarah Lee',
      email: 'sarah@student.aiu.edu',
      student_id: 'SL-2024-00999',
      is_active: true,
      created_at: new Date().toISOString(),
      subscription: {
        id: 's3',
        status: 'active',
        credits_total: 40,
        credits_used: 25,
        meal_plan: { name: 'Premium Plan', price_myr: 400 },
      },
      last_activity: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'demo-4',
      full_name: 'Jason Tan',
      email: 'jason@student.aiu.edu',
      student_id: 'JT-2024-00321',
      is_active: true,
      created_at: new Date().toISOString(),
      subscription: {
        id: 's4',
        status: 'active',
        credits_total: 60,
        credits_used: 28,
        meal_plan: { name: 'Classic Plan', price_myr: 250 },
      },
      last_activity: new Date().toISOString(),
    },
    {
      id: 'demo-5',
      full_name: 'Maryam Khalid',
      email: 'maryam@student.aiu.edu',
      student_id: 'MK-2024-00654',
      is_active: true,
      created_at: new Date().toISOString(),
      subscription: {
        id: 's5',
        status: 'active',
        credits_total: 40,
        credits_used: 25,
        meal_plan: { name: 'Premium Plan', price_myr: 400 },
      },
      last_activity: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  const displayStudents =
    students.length === 0 && !loading
      ? demoStudents.filter((s) => (statusFilter === 'active' ? s.is_active : !s.is_active))
      : filtered;

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Student Management</h1>
          <p className="text-[#6B7280] text-sm mt-0.5">{displayStudents.length} students found</p>
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
              placeholder="Search student..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#374151] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/20 focus:border-[#3ECBA0] transition-all"
            />
          </div>
          <div className="flex items-center bg-[#F3F4F6] rounded-xl p-1 gap-1">
            {(['active', 'inactive'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                  statusFilter === s
                    ? 'bg-[#3ECBA0] text-white shadow-sm'
                    : 'text-[#6B7280] hover:text-[#374151]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#F3F4F6] overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-[2fr_1.5fr_2fr_1.5fr_1fr_2fr_32px] gap-4 px-5 py-3 border-b border-[#F3F4F6] bg-[#FAFAFA]">
            {[
              'Student',
              'Student ID',
              'Current Plan',
              'Meals Remaining',
              'Status',
              'Last Activity',
              '',
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
          ) : displayStudents.length === 0 ? (
            <div className="text-center py-16 text-[#9CA3AF]">No students found</div>
          ) : (
            <div className="divide-y divide-[#F9FAFB]">
              {displayStudents.map((student) => (
                <Link
                  key={student.id}
                  href={`/admin-portal/students/${student.id}`}
                  className="grid grid-cols-[2fr_1.5fr_2fr_1.5fr_1fr_2fr_32px] gap-4 px-5 py-4 hover:bg-[#F9FAFB] transition-colors items-center group"
                >
                  {/* Student */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <InitialsAvatar name={student.full_name} />
                      <div
                        className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white"
                        style={{ background: student.is_active ? '#3ECBA0' : '#9CA3AF' }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#111827] truncate">
                        {student.full_name}
                      </p>
                      <p className="text-xs text-[#9CA3AF] truncate">{student.email}</p>
                    </div>
                  </div>

                  {/* Student ID */}
                  <p className="text-sm text-[#6B7280] font-mono">{student.student_id || '—'}</p>

                  {/* Plan */}
                  <div>
                    {student.subscription?.meal_plan ? (
                      <>
                        <p className="text-sm font-medium text-[#374151]">
                          {student.subscription.meal_plan.name}
                        </p>
                        <p className="text-xs text-[#9CA3AF]">
                          RM{student.subscription.meal_plan.price_myr} /{' '}
                          {student.subscription.credits_total} Meals
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-[#9CA3AF]">No active plan</p>
                    )}
                  </div>

                  {/* Meals remaining */}
                  {student.subscription ? (
                    <MealsProgress
                      used={student.subscription.credits_used}
                      total={student.subscription.credits_total}
                    />
                  ) : (
                    <p className="text-sm text-[#9CA3AF]">—</p>
                  )}

                  {/* Status */}
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full w-fit"
                    style={{
                      background: student.is_active ? '#dcfce7' : '#F3F4F6',
                      color: student.is_active ? '#16a34a' : '#6B7280',
                    }}
                  >
                    {student.is_active ? 'Active' : 'Inactive'}
                  </span>

                  {/* Last activity */}
                  <div>
                    <p className="text-xs text-[#374151]">
                      {formatDate(student.last_activity || student.created_at)}
                    </p>
                    <p className="text-xs text-[#9CA3AF]">Meal Redeemed</p>
                  </div>

                  {/* Arrow */}
                  <svg
                    className="w-4 h-4 text-[#D1D5DB] group-hover:text-[#3ECBA0] transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

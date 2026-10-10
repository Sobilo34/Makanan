'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout';
import { api } from '@/lib/api';

interface StudentDetail {
  id: string;
  full_name: string;
  email: string;
  student_id: string | null;
  is_active: boolean;
  phone: string | null;
  created_at: string;
}

interface Subscription {
  id: string;
  status: string;
  credits_total: number;
  credits_used: number;
  starts_at: string;
  expires_at: string | null;
  meal_plan?: { name: string; price_myr: number };
}

interface Redemption {
  id: string;
  redeemed_at: string;
  meal?: { name: string };
  partner?: { name: string };
}

type TabType = 'subscription' | 'redemption' | 'payment';

function InitialsAvatar({ name, size = 'lg' }: { name: string; size?: 'lg' | 'md' }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const colors = ['#3ECBA0', '#6366F1', '#F59E0B', '#EF4444', '#8B5CF6'];
  const color = colors[name.charCodeAt(0) % colors.length];
  const sz = size === 'lg' ? 'w-14 h-14 text-xl' : 'w-9 h-9 text-sm';
  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{ background: color }}
    >
      {initials}
    </div>
  );
}

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = (params?.id as string) || '';

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('subscription');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!studentId) return;
      try {
        const data = await api.getAdminStudent(studentId);
        if (!data || !data.student) {
          router.push('/admin-portal/students');
          return;
        }
        setStudent({
          id: data.student.id,
          full_name: data.student.full_name,
          email: data.student.email,
          student_id: data.student.student_id || null,
          is_active: data.student.is_active !== undefined ? data.student.is_active : true,
          phone: data.student.phone || null,
          created_at: data.student.created_at || new Date().toISOString(),
        });

        if (data.subscriptions && Array.isArray(data.subscriptions)) {
          setSubscriptions(
            data.subscriptions.map((s: any) => ({
              id: s.id,
              status: s.status,
              credits_total: s.credits_total,
              credits_used: s.credits_used,
              starts_at: s.starts_at,
              expires_at: s.expires_at,
              meal_plan: s.meal_plan
                ? {
                    name: s.meal_plan.name,
                    price_myr: s.meal_plan.price_myr,
                  }
                : undefined,
            }))
          );
        }

        if (data.redemptions && Array.isArray(data.redemptions)) {
          setRedemptions(
            data.redemptions.map((r: any) => ({
              id: r.id,
              redeemed_at: r.redeemed_at || r.created_at,
              meal: r.meal ? { name: r.meal.name } : undefined,
              partner: r.partner ? { name: r.partner.name } : undefined,
            }))
          );
        }
      } catch (err) {
        console.error('Student detail error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentId]);

  const activeSubscription = subscriptions.find((s) => s.status === 'active');
  const mealsRemaining = activeSubscription
    ? activeSubscription.credits_total - activeSubscription.credits_used
    : 0;
  const mealsUsed = activeSubscription?.credits_used || 0;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string }> = {
      active: { bg: '#dcfce7', text: '#16a34a' },
      expired: { bg: '#fee2e2', text: '#dc2626' },
      cancelled: { bg: '#F3F4F6', text: '#6B7280' },
      completed: { bg: '#dbeafe', text: '#2563eb' },
    };
    const s = map[status] || map['cancelled'];
    return (
      <span
        className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
        style={{ background: s.bg, color: s.text }}
      >
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-[#3ECBA0] border-t-transparent animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!student) return null;

  return (
    <AdminLayout>
      <div className="space-y-5 max-w-4xl">
        {/* Back */}
        <Link
          href="/admin-portal/students"
          className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#374151] transition-colors"
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
          Back to Students
        </Link>

        {/* Student header */}
        <div className="bg-white rounded-2xl p-6 border border-[#F3F4F6]">
          <div className="flex items-start gap-4">
            <InitialsAvatar name={student.full_name} />
            <div>
              <h1 className="text-xl font-bold text-[#111827]">{student.full_name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-[#6B7280] font-mono">
                  {student.student_id || 'No ID'}
                </span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: student.is_active ? '#dcfce7' : '#F3F4F6',
                    color: student.is_active ? '#16a34a' : '#6B7280',
                  }}
                >
                  {student.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-[#9CA3AF] mt-0.5">{student.email}</p>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-[#F3F4F6]">
            <p className="text-xs text-[#9CA3AF] font-medium mb-1">Current Plan</p>
            <p className="text-sm font-bold text-[#111827]">
              {activeSubscription?.meal_plan?.name || 'No Plan'}
            </p>
            {activeSubscription && (
              <p className="text-xs text-[#6B7280] mt-0.5">
                RM{activeSubscription.meal_plan?.price_myr} / {activeSubscription.credits_total}{' '}
                Meals
              </p>
            )}
            {activeSubscription && (
              <div className="mt-2">
                <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#3ECBA0]"
                    style={{
                      width: `${activeSubscription.credits_total > 0 ? ((activeSubscription.credits_total - activeSubscription.credits_used) / activeSubscription.credits_total) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-[#9CA3AF] mt-1">
                  {activeSubscription.credits_total - activeSubscription.credits_used} /{' '}
                  {activeSubscription.credits_total} Meals Remaining
                </p>
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl p-4 border border-[#F3F4F6] text-center">
            <p className="text-xs text-[#9CA3AF] font-medium mb-1">Meals Remaining</p>
            <p className="text-3xl font-bold text-[#111827]">{mealsRemaining}</p>
            <p className="text-xs text-[#9CA3AF]">Meals Remaining</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-[#F3F4F6] text-center">
            <p className="text-xs text-[#9CA3AF] font-medium mb-1">Meals Used</p>
            <p className="text-3xl font-bold text-[#111827]">{mealsUsed}</p>
            <p className="text-xs text-[#9CA3AF]">Meals Used</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-[#F3F4F6]">
            <p className="text-xs text-[#9CA3AF] font-medium mb-1">Last Redemption</p>
            {redemptions[0] ? (
              <>
                <p className="text-xs font-semibold text-[#374151]">
                  {formatDate(redemptions[0].redeemed_at)}
                </p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">
                  {redemptions[0].partner?.name || 'Unknown'}
                </p>
              </>
            ) : (
              <p className="text-sm text-[#9CA3AF]">No redemptions</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-[#F3F4F6] overflow-hidden">
          <div className="flex border-b border-[#F3F4F6]">
            {(
              [
                { key: 'subscription', label: 'Subscription History' },
                { key: 'redemption', label: 'Redemption History' },
                { key: 'payment', label: 'Payment History' },
              ] as { key: TabType; label: string }[]
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-3.5 text-sm font-medium transition-all border-b-2 ${
                  activeTab === tab.key
                    ? 'border-[#3ECBA0] text-[#1a3028] bg-[#3ECBA0]/5'
                    : 'border-transparent text-[#6B7280] hover:text-[#374151]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {activeTab === 'subscription' && (
              <div className="space-y-3">
                {subscriptions.length === 0 ? (
                  <p className="text-[#9CA3AF] text-sm text-center py-8">No subscription history</p>
                ) : (
                  subscriptions.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-[#F3F4F6] hover:bg-[#F9FAFB] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#3ECBA0]/10 flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-[#3ECBA0]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#374151]">
                            {sub.meal_plan?.name || 'Unknown Plan'}
                          </p>
                          <p className="text-xs text-[#9CA3AF]">
                            (RM{sub.meal_plan?.price_myr} / {sub.credits_total} Meals)
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[#6B7280] mb-1">
                          {sub.status === 'active'
                            ? `Renewed: ${formatDate(sub.starts_at)}`
                            : `Expired: ${sub.expires_at ? formatDate(sub.expires_at) : 'N/A'}`}
                        </p>
                        {statusBadge(sub.status)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'redemption' && (
              <div className="space-y-3">
                {redemptions.length === 0 ? (
                  <p className="text-[#9CA3AF] text-sm text-center py-8">No redemption history</p>
                ) : (
                  redemptions.map((red) => (
                    <div
                      key={red.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-[#F3F4F6] hover:bg-[#F9FAFB] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center text-base">
                          🍽️
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#374151]">
                            {red.meal?.name || 'Unknown Meal'}
                          </p>
                          <p className="text-xs text-[#9CA3AF]">
                            {red.partner?.name || 'Unknown Partner'}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-[#6B7280]">{formatDate(red.redeemed_at)}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'payment' && (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-2xl bg-[#F3F4F6] flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-6 h-6 text-[#9CA3AF]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </div>
                <p className="text-[#9CA3AF] text-sm">Payment history coming soon</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

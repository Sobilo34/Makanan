'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Profile {
  full_name: string;
  email: string;
  student_id: string;
  phone: string;
  university: string;
}

type Tab = 'profile' | 'security' | 'notifications' | 'billing';

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'profile',
    label: 'Profile',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: 'security',
    label: 'Security',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-[#3ECBA0]' : 'bg-gray-200'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [subscription, setSubscription] = useState<{ meal_plans: { name: string }; credits_total: number; credits_used: number; status: string } | null>(null);

  // Notification prefs
  const [notifPrefs, setNotifPrefs] = useState({
    emailRedemptions: true,
    emailPayments: true,
    emailPromotions: false,
    pushRedemptions: true,
    pushLowCredits: true,
  });

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const supabase = createClient();
      try {
        const [profileRes, subRes] = await Promise.all([
          supabase.from('user_profiles').select('*').eq('id', user.id).maybeSingle(),
          supabase.from('subscriptions').select('*, meal_plans(name)').eq('user_id', user.id).eq('status', 'active').limit(1).maybeSingle(),
        ]);
        const p = profileRes.data || {
          full_name: user.user_metadata?.full_name || '',
          email: user.email || '',
          student_id: user.user_metadata?.student_id || '',
          phone: '',
          university: 'Albukhary International University',
        };
        setProfile(p as Profile);
        setForm(p);
        setSubscription(subRes.data || null);
      } catch (err) {
        console.log('Settings fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const supabase = createClient();
      await supabase.from('user_profiles').update({
        full_name: form.full_name,
        student_id: form.student_id,
        phone: form.phone,
        university: form.university,
      }).eq('id', user.id);
      setProfile({ ...profile!, ...form });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.log('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-8 bg-gray-100 rounded-xl w-40 animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F0F2F5]">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100 px-6 lg:px-8 py-5">
        <h1 className="text-[#111827] font-bold text-2xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>Account Settings</h1>
        <p className="text-[#9CA3AF] text-sm mt-0.5">Manage your profile, security, and preferences</p>
      </div>

      <div className="px-6 lg:px-8 py-6 max-w-5xl">
        {saved && (
          <div className="mb-5 flex items-center gap-3 bg-[#EBF9F4] border border-[#C8F0E4] rounded-2xl px-4 py-3 text-[#2DAF87] text-sm font-semibold">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            Changes saved successfully
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Tab nav */}
          <div className="lg:w-52 flex-shrink-0">
            {/* Avatar card */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md" style={{ background: 'linear-gradient(135deg, #3ECBA0 0%, #1a9e7a 100%)' }}>
                <span className="text-white font-bold text-xl">{initials}</span>
              </div>
              <p className="text-[#111827] font-bold text-sm truncate">{profile?.full_name || 'Student'}</p>
              <p className="text-[#9CA3AF] text-xs truncate mt-0.5">{user?.email}</p>
              {profile?.student_id && (
                <span className="inline-block mt-2 bg-[#EBF9F4] text-[#2DAF87] text-xs font-bold px-2.5 py-1 rounded-full">
                  {profile.student_id}
                </span>
              )}
            </div>

            {/* Tab list */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-all border-b border-gray-50 last:border-0 ${
                    activeTab === tab.id
                      ? 'bg-[#EBF9F4] text-[#3ECBA0]'
                      : 'text-[#6B7280] hover:bg-gray-50 hover:text-[#374151]'
                  }`}
                >
                  <span className={activeTab === tab.id ? 'text-[#3ECBA0]' : 'text-[#9CA3AF]'}>{tab.icon}</span>
                  {tab.label}
                  {activeTab === tab.id && (
                    <svg className="w-4 h-4 ml-auto text-[#3ECBA0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {/* Danger zone */}
            <button
              onClick={async () => { await signOut(); router.push('/login'); }}
              className="w-full mt-4 flex items-center gap-3 px-4 py-3.5 bg-white rounded-2xl border border-gray-100 text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>

          {/* Right: Tab content */}
          <div className="flex-1 min-w-0">
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-[#111827] font-bold text-sm">Personal Information</h3>
                      <p className="text-[#9CA3AF] text-xs mt-0.5">Update your name, student ID, and contact details</p>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[#6B7280] text-xs font-semibold uppercase tracking-wide mb-1.5 block">Full Name</label>
                        <input
                          type="text"
                          value={form.full_name || ''}
                          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                          className="w-full bg-[#F8F9FB] border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#111827] focus:outline-none focus:border-[#3ECBA0] focus:ring-2 focus:ring-[#3ECBA0]/10 transition-all"
                          placeholder="Your full name"
                        />
                      </div>
                      <div>
                        <label className="text-[#6B7280] text-xs font-semibold uppercase tracking-wide mb-1.5 block">Student ID</label>
                        <input
                          type="text"
                          value={form.student_id || ''}
                          onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                          className="w-full bg-[#F8F9FB] border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#111827] focus:outline-none focus:border-[#3ECBA0] focus:ring-2 focus:ring-[#3ECBA0]/10 transition-all"
                          placeholder="e.g. AIU2024001"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[#6B7280] text-xs font-semibold uppercase tracking-wide mb-1.5 block">Email Address</label>
                      <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                        <span className="text-sm text-[#6B7280] flex-1">{user?.email}</span>
                        <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-medium">Locked</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[#6B7280] text-xs font-semibold uppercase tracking-wide mb-1.5 block">Phone Number</label>
                        <input
                          type="tel"
                          value={form.phone || ''}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="w-full bg-[#F8F9FB] border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#111827] focus:outline-none focus:border-[#3ECBA0] focus:ring-2 focus:ring-[#3ECBA0]/10 transition-all"
                          placeholder="+60 12-345 6789"
                        />
                      </div>
                      <div>
                        <label className="text-[#6B7280] text-xs font-semibold uppercase tracking-wide mb-1.5 block">University</label>
                        <input
                          type="text"
                          value={form.university || ''}
                          onChange={(e) => setForm({ ...form, university: e.target.value })}
                          className="w-full bg-[#F8F9FB] border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#111827] focus:outline-none focus:border-[#3ECBA0] focus:ring-2 focus:ring-[#3ECBA0]/10 transition-all"
                          placeholder="University name"
                        />
                      </div>
                    </div>
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="bg-[#3ECBA0] text-white font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-[#2DAF87] transition-colors disabled:opacity-60 flex items-center gap-2"
                      >
                        {saving ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                            Saving...
                          </>
                        ) : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-[#111827] font-bold text-sm">Password & Authentication</h3>
                    <p className="text-[#9CA3AF] text-xs mt-0.5">Keep your account secure</p>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-[#F8F9FB] rounded-xl border border-gray-100">
                      <div className="w-10 h-10 bg-[#EBF9F4] rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-[#3ECBA0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-[#111827] font-semibold text-sm">Password</p>
                        <p className="text-[#9CA3AF] text-xs">Last changed: Never</p>
                      </div>
                      <button className="text-[#3ECBA0] text-sm font-semibold hover:text-[#2DAF87] transition-colors">Change</button>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-[#F8F9FB] rounded-xl border border-gray-100">
                      <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-[#111827] font-semibold text-sm">Two-Factor Authentication</p>
                        <p className="text-[#9CA3AF] text-xs">Add an extra layer of security</p>
                      </div>
                      <span className="text-xs bg-amber-50 text-amber-600 font-semibold px-2.5 py-1 rounded-full">Not set up</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-[#111827] font-bold text-sm">Active Sessions</h3>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-4 p-4 bg-[#EBF9F4] rounded-xl border border-[#C8F0E4]">
                      <div className="w-10 h-10 bg-[#3ECBA0]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-[#3ECBA0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-[#111827] font-semibold text-sm">Current Session</p>
                        <p className="text-[#9CA3AF] text-xs">This device · Active now</p>
                      </div>
                      <span className="w-2 h-2 bg-[#3ECBA0] rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-[#111827] font-bold text-sm">Email Notifications</h3>
                    <p className="text-[#9CA3AF] text-xs mt-0.5">Choose what emails you receive</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {[
                      { key: 'emailRedemptions', label: 'Meal Redemptions', desc: 'Confirmation when you redeem a meal' },
                      { key: 'emailPayments', label: 'Payment Receipts', desc: 'Receipts for plan purchases' },
                      { key: 'emailPromotions', label: 'Promotions & Offers', desc: 'Special deals and new plan announcements' },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between px-6 py-4">
                        <div>
                          <p className="text-[#111827] font-medium text-sm">{label}</p>
                          <p className="text-[#9CA3AF] text-xs mt-0.5">{desc}</p>
                        </div>
                        <Toggle
                          checked={(notifPrefs as any)[key]}
                          onChange={(v) => setNotifPrefs({ ...notifPrefs, [key]: v })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-[#111827] font-bold text-sm">Push Notifications</h3>
                    <p className="text-[#9CA3AF] text-xs mt-0.5">In-app alerts and reminders</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {[
                      { key: 'pushRedemptions', label: 'Redemption Updates', desc: 'Status updates on your meal redemptions' },
                      { key: 'pushLowCredits', label: 'Low Credit Alerts', desc: 'Alert when you have 5 or fewer meals left' },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between px-6 py-4">
                        <div>
                          <p className="text-[#111827] font-medium text-sm">{label}</p>
                          <p className="text-[#9CA3AF] text-xs mt-0.5">{desc}</p>
                        </div>
                        <Toggle
                          checked={(notifPrefs as any)[key]}
                          onChange={(v) => setNotifPrefs({ ...notifPrefs, [key]: v })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* BILLING TAB */}
            {activeTab === 'billing' && (
              <div className="space-y-5">
                {/* Current plan */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-[#111827] font-bold text-sm">Current Subscription</h3>
                  </div>
                  <div className="p-6">
                    {subscription ? (
                      <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'linear-gradient(135deg, #1a3028 0%, #0d2b22 100%)' }}>
                        <div className="flex-1">
                          <p className="text-[#3ECBA0] text-xs font-bold uppercase tracking-widest mb-1">Active Plan</p>
                          <p className="text-white font-bold text-lg">{subscription.meal_plans?.name}</p>
                          <p className="text-white/50 text-sm">{subscription.credits_total - subscription.credits_used} of {subscription.credits_total} meals remaining</p>
                        </div>
                        <div className="w-12 h-12 bg-[#3ECBA0]/20 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-[#3ECBA0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                        <p className="text-[#111827] font-semibold text-sm mb-1">No active plan</p>
                        <p className="text-[#9CA3AF] text-xs mb-4">Subscribe to start redeeming meals</p>
                        <a href="/dashboard/plans" className="inline-flex items-center gap-2 bg-[#3ECBA0] text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-[#2DAF87] transition-colors">
                          Browse Plans
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment history link */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-[#111827] font-bold text-sm">Payment History</h3>
                  </div>
                  <div className="p-6">
                    <a
                      href="/dashboard/orders"
                      className="flex items-center gap-3 p-4 bg-[#F8F9FB] rounded-xl border border-gray-100 hover:border-[#3ECBA0]/30 transition-all group"
                    >
                      <div className="w-10 h-10 bg-[#EBF9F4] rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-[#3ECBA0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-[#111827] font-semibold text-sm">View Order History</p>
                        <p className="text-[#9CA3AF] text-xs">All your past meal redemptions</p>
                      </div>
                      <svg className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#3ECBA0] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Profile {
  full_name: string;
  email: string;
  student_id: string;
  phone: string;
  university: string;
  avatar_url: string;
  role: string;
}

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const supabase = createClient();
      try {
        const { data } = await supabase.from('user_profiles').select('*').eq('id', user.id).maybeSingle();
        if (data) {
          setProfile(data);
          setForm(data);
        } else {
          const fallback = {
            full_name: user.user_metadata?.full_name || '',
            email: user.email || '',
            student_id: user.user_metadata?.student_id || '',
            phone: '',
            university: 'Albukhary International University',
            avatar_url: '',
          };
          setProfile(fallback as Profile);
          setForm(fallback);
        }
      } catch (err) {
        console.log('Profile fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const supabase = createClient();
      await supabase
        .from('user_profiles')
        .update({ full_name: form.full_name, student_id: form.student_id, phone: form.phone, university: form.university })
        .eq('id', user.id);
      setProfile({ ...profile!, ...form });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.log('Profile save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-8 bg-gray-100 rounded-xl w-32 animate-pulse" />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 h-64 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F5F6FA] p-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[#1A1A1A] font-bold text-2xl">Profile</h1>
          <p className="text-[#9CA3AF] text-sm mt-1">Manage your account information</p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 text-[#3ECBA0] font-semibold text-sm bg-[#EBF9F4] px-4 py-2.5 rounded-xl hover:bg-[#D0F0E4] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => { setEditing(false); setForm(profile || {}); }}
              className="text-[#6B7280] text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#3ECBA0] text-white text-sm font-semibold px-5 py-2.5 rounded-xl disabled:opacity-60 hover:bg-[#2DAF87] transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {saved && (
        <div className="mb-6 bg-[#EBF9F4] border border-[#C8F0E4] rounded-2xl px-4 py-3 text-[#2DAF87] text-sm font-semibold flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          Profile updated successfully
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main profile info */}
        <div className="xl:col-span-2 space-y-5">
          {/* Avatar + name card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg" style={{ background: 'linear-gradient(135deg, #3ECBA0 0%, #2DAF87 100%)' }}>
                <span className="text-white font-bold text-2xl">{initials}</span>
              </div>
              <div className="min-w-0">
                <h2 className="text-[#1A1A1A] font-bold text-xl truncate">{profile?.full_name || 'Student'}</h2>
                <p className="text-[#9CA3AF] text-sm truncate">{profile?.email}</p>
                {profile?.student_id && (
                  <span className="inline-block bg-[#EBF9F4] text-[#2DAF87] text-xs font-bold px-2.5 py-1 rounded-full mt-1.5">
                    ID: {profile.student_id}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Personal info */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-[#1A1A1A] font-bold text-sm">Personal Information</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { label: 'Full Name', key: 'full_name', type: 'text', editable: true },
                { label: 'Email Address', key: 'email', type: 'email', editable: false },
                { label: 'Student ID', key: 'student_id', type: 'text', editable: true },
                { label: 'Phone Number', key: 'phone', type: 'tel', editable: true },
                { label: 'University', key: 'university', type: 'text', editable: true },
              ].map(({ label, key, type, editable }) => (
                <div key={key} className="px-6 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[#9CA3AF] text-xs mb-1">{label}</p>
                    {editing && editable ? (
                      <input
                        type={type}
                        value={(form as any)[key] || ''}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#3ECBA0] transition-colors"
                      />
                    ) : (
                      <p className="text-[#1A1A1A] font-semibold text-sm truncate">
                        {(profile as any)?.[key] || '—'}
                      </p>
                    )}
                  </div>
                  {!editable && (
                    <svg className="w-4 h-4 text-[#D0D0D0] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Account actions */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-[#1A1A1A] font-bold text-sm">Account</h3>
            </div>
            <div className="divide-y divide-gray-50">
              <button className="w-full px-5 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left">
                <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                  <svg className="w-4 h-4 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-[#374151] flex-1">Change Password</span>
                <svg className="w-4 h-4 text-[#D0D0D0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
              <button className="w-full px-5 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left">
                <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                  <svg className="w-4 h-4 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-[#374151] flex-1">Notifications</span>
                <svg className="w-4 h-4 text-[#D0D0D0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
              <button
                onClick={handleSignOut}
                className="w-full px-5 py-4 flex items-center gap-3 hover:bg-red-50 transition-colors text-left"
              >
                <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center border border-red-100">
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-red-500 flex-1">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Staff access */}
          {(profile?.role === 'admin' || profile?.role === 'partner_staff') && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-[#1A1A1A] font-bold text-sm">Staff Access</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {profile?.role === 'admin' && (
                  <Link href="/admin" className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
                    <span className="text-base">🛡️</span>
                    <span className="text-sm font-medium text-[#374151] flex-1">Admin Dashboard</span>
                    <svg className="w-4 h-4 text-[#D0D0D0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </Link>
                )}
                <Link href="/partner" className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
                  <span className="text-base">🏪</span>
                  <span className="text-sm font-medium text-[#374151] flex-1">Partner Verification</span>
                  <svg className="w-4 h-4 text-[#D0D0D0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

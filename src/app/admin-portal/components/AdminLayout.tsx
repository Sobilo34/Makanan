'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

interface AdminUser {
  email: string;
  full_name: string;
}

const navItems = [
  {
    href: '/admin-portal/dashboard',
    label: 'Dashboard',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-[#3ECBA0]' : 'text-[#9CA3AF]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/admin-portal/students',
    label: 'Students',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-[#3ECBA0]' : 'text-[#9CA3AF]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: '/admin-portal/meal-plans',
    label: 'Meal Plans',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-[#3ECBA0]' : 'text-[#9CA3AF]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    href: '/admin-portal/partners',
    label: 'Partners',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-[#3ECBA0]' : 'text-[#9CA3AF]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    href: '/admin-portal/meals',
    label: 'Meals',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-[#3ECBA0]' : 'text-[#9CA3AF]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    href: '/admin-portal/redemptions',
    label: 'Redemptions',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-[#3ECBA0]' : 'text-[#9CA3AF]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  {
    href: '/admin-portal/payments',
    label: 'Payments',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-[#3ECBA0]' : 'text-[#9CA3AF]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    href: '/admin-portal/reports',
    label: 'Reports',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-[#3ECBA0]' : 'text-[#9CA3AF]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    href: '/admin-portal/settings',
    label: 'Settings',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-[#3ECBA0]' : 'text-[#9CA3AF]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/admin-portal/login');
        return;
      }
      const isAdmin =
        user.user_metadata?.role === 'admin' ||
        user.app_metadata?.role === 'admin';
      if (!isAdmin) {
        await supabase.auth.signOut();
        router.push('/admin-portal/login');
        return;
      }
      setAdmin({
        email: user.email || '',
        full_name: user.user_metadata?.full_name || 'Admin',
      });
      setLoading(false);
    };
    loadAdmin();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/admin-portal/login');
  };

  const isActive = (href: string) => {
    if (href === '/admin-portal/dashboard') return pathname === '/admin-portal/dashboard';
    return pathname.startsWith(href);
  };

  const initials = admin?.full_name
    ? admin.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'A';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#3ECBA0] border-t-transparent animate-spin" />
          <p className="text-[#6B7280] text-sm">Loading admin portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-[220px] bg-white border-r border-[#E5E7EB] flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-[#F3F4F6]">
          <Link href="/admin-portal/dashboard" className="flex items-center gap-2.5">
            <Image
              src="/assets/images/makanan-logo-black-removebg-preview-1787356756845.png"
              alt="Makanan"
              width={100}
              height={28}
              className="object-contain"
            />
          </Link>
          <div className="mt-1.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1a3028] text-[#3ECBA0] tracking-wider uppercase">
              Admin Portal
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-[#3ECBA0]/10 text-[#1a3028]'
                    : 'text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#374151]'
                }`}
              >
                {item.icon(active)}
                {item.label}
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#3ECBA0]" />}
              </Link>
            );
          })}
        </nav>

        {/* Admin info + sign out */}
        <div className="px-3 py-4 border-t border-[#F3F4F6] space-y-2">
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1a3028, #0d2b22)' }}>
              <span className="text-[#3ECBA0] text-xs font-bold">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#111827] truncate">{admin?.full_name}</p>
              <p className="text-[10px] text-[#9CA3AF] truncate">{admin?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#6B7280] hover:bg-red-50 hover:text-red-500 transition-all w-full"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-[220px] flex flex-col min-h-screen">
        {/* Top header */}
        <header className="sticky top-0 z-20 bg-white border-b border-[#E5E7EB] px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-[#6B7280] hover:bg-[#F3F4F6]"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students, partners..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-sm text-[#374151] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/20 focus:border-[#3ECBA0] transition-all"
              />
            </div>
          </div>

          {/* Right: notification + admin badge */}
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-xl text-[#6B7280] hover:bg-[#F3F4F6] transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a3028, #0d2b22)' }}>
                <span className="text-[#3ECBA0] text-xs font-bold">{initials}</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-[#111827] leading-none">{admin?.full_name}</p>
                <p className="text-[10px] text-[#9CA3AF] leading-none mt-0.5">Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

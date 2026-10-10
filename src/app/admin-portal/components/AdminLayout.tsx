'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';
import NotificationCenter from '@/components/NotificationCenter';

interface AdminUser {
  email: string;
  full_name: string;
}

const navGroups = [
  {
    label: 'Overview',
    items: [
      {
        href: '/admin-portal/dashboard',
        label: 'Dashboard',
        icon: (active: boolean) => (
          <svg
            className={`w-[18px] h-[18px] ${active ? 'text-[#3ECBA0]' : 'text-[#6B7280]'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        ),
      },
      {
        href: '/admin-portal/reports',
        label: 'Reports',
        icon: (active: boolean) => (
          <svg
            className={`w-[18px] h-[18px] ${active ? 'text-[#3ECBA0]' : 'text-[#6B7280]'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Management',
    items: [
      {
        href: '/admin-portal/students',
        label: 'Students',
        icon: (active: boolean) => (
          <svg
            className={`w-[18px] h-[18px] ${active ? 'text-[#3ECBA0]' : 'text-[#6B7280]'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        ),
      },
      {
        href: '/admin-portal/partners',
        label: 'Partners',
        icon: (active: boolean) => (
          <svg
            className={`w-[18px] h-[18px] ${active ? 'text-[#3ECBA0]' : 'text-[#6B7280]'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        ),
      },
      {
        href: '/admin-portal/meals',
        label: 'Meals',
        icon: (active: boolean) => (
          <svg
            className={`w-[18px] h-[18px] ${active ? 'text-[#3ECBA0]' : 'text-[#6B7280]'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        ),
      },
      {
        href: '/admin-portal/meal-plans',
        label: 'Meal Plans',
        icon: (active: boolean) => (
          <svg
            className={`w-[18px] h-[18px] ${active ? 'text-[#3ECBA0]' : 'text-[#6B7280]'}`}
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
        ),
      },
    ],
  },
  {
    label: 'Transactions',
    items: [
      {
        href: '/admin-portal/redemptions',
        label: 'Redemptions',
        icon: (active: boolean) => (
          <svg
            className={`w-[18px] h-[18px] ${active ? 'text-[#3ECBA0]' : 'text-[#6B7280]'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
        ),
      },
      {
        href: '/admin-portal/payments',
        label: 'Payments',
        icon: (active: boolean) => (
          <svg
            className={`w-[18px] h-[18px] ${active ? 'text-[#3ECBA0]' : 'text-[#6B7280]'}`}
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
        ),
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        href: '/admin-portal/settings',
        label: 'Settings',
        icon: (active: boolean) => (
          <svg
            className={`w-[18px] h-[18px] ${active ? 'text-[#3ECBA0]' : 'text-[#6B7280]'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        ),
      },
    ],
  },
];

const allNavItems = navGroups.flatMap((g) => g.items);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminUserId, setAdminUserId] = useState('');

  useEffect(() => {
    const loadAdmin = async () => {
      try {
        const user = await api.getMe();
        if (!user || user.role !== 'admin') {
          api.clearToken();
          router.push('/admin-portal/login');
          return;
        }
        setAdmin({ email: user.email || '', full_name: user.full_name || 'Admin' });
        setAdminUserId(user.id);
        setLoading(false);
      } catch (err) {
        api.clearToken();
        router.push('/admin-portal/login');
      }
    };
    loadAdmin();
  }, []);

  const handleSignOut = () => {
    api.logout();
    router.push('/admin-portal/login');
  };

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/admin-portal/dashboard') return pathname === '/admin-portal/dashboard';
    return pathname.startsWith(href);
  };

  const initials = admin?.full_name
    ? admin.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'A';

  const currentPage = allNavItems.find((item) => isActive(item.href))?.label || 'Admin Portal';

  if (loading) {
    return (
      <div
        className="min-h-screen flex"
        style={{ fontFamily: "'DM Sans', sans-serif", background: '#0F1117' }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#3ECBA0] border-t-transparent animate-spin" />
          <p className="text-white/40 text-sm">Loading admin portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ fontFamily: "'DM Sans', sans-serif", background: '#0F1117' }}
    >
      {/* Dark sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        style={{ background: '#161B22', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/admin-portal/dashboard">
            <Image
              src="/assets/images/makanan-icon-light-removebg-preview-1787356770029.png"
              alt="Makanan"
              width={36}
              height={36}
              className="object-contain"
            />
          </Link>
          <div className="mt-2">
            <span
              className="text-[10px] font-bold tracking-widest uppercase"
              style={{ color: '#3ECBA0' }}
            >
              Admin Portal
            </span>
          </div>
        </div>

        {/* Admin info */}
        <div
          className="px-4 py-3"
          style={{
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #3ECBA0, #1a9e7a)' }}
            >
              <span className="text-white text-sm font-bold">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{admin?.full_name}</p>
              <p className="text-white/40 text-xs truncate">{admin?.email}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p
                className="text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5"
                style={{ color: 'rgba(255,255,255,0.2)' }}
              >
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative ${
                        active ? 'text-[#3ECBA0]' : 'hover:text-white'
                      }`}
                      style={
                        active
                          ? { background: 'rgba(62,203,160,0.12)' }
                          : { color: 'rgba(255,255,255,0.5)' }
                      }
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#3ECBA0] rounded-r-full" />
                      )}
                      {item.icon(active)}
                      <span className={active ? 'font-semibold' : ''}>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full hover:bg-red-500/10 hover:text-red-400"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            <svg
              className="w-[18px] h-[18px]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Top header */}
        <header
          className="sticky top-0 z-20 px-5 lg:px-6 py-3.5 flex items-center justify-between"
          style={{ background: '#161B22', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl transition-colors"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <p className="text-white/40 text-xs hidden lg:block">Admin Portal</p>
              <p className="text-white font-semibold text-sm">{currentPage}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationCenter userId={adminUserId} recipientType="admin" />
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3ECBA0, #1a9e7a)' }}
            >
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 lg:p-6" style={{ background: '#0F1117' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

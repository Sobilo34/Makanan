'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import NotificationCenter from '@/components/NotificationCenter';

const navItems = [
  {
    href: '/dashboard',
    label: 'Home',
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
    href: '/dashboard/meals',
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
    href: '/dashboard/orders',
    label: 'Orders',
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
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
        />
      </svg>
    ),
  },
  {
    href: '/dashboard/wallet',
    label: 'Wallet',
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
  {
    href: '/dashboard/plans',
    label: 'Plans',
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
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 4h6m-6 4h6"
        />
      </svg>
    ),
  },
  {
    href: '/dashboard/profile',
    label: 'Profile',
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
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
];

const mobileNavItems = navItems.slice(0, 5);

const bottomNavItems = [
  {
    href: '/dashboard/settings',
    label: 'Settings',
    icon: (
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
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: '/dashboard/support',
    label: 'Help & Support',
    icon: (
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
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── Sidebar — desktop ── */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-gray-100/80 fixed inset-y-0 left-0 z-30 shadow-sm">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <Image
            src="/assets/images/makanan-logo-black-removebg-preview-1787356756845.png"
            alt="Makanan Logo"
            width={130}
            height={36}
            className="object-contain"
            style={{ maxHeight: 36 }}
          />
          <div className="mt-2">
            <span className="text-[10px] font-bold tracking-widest uppercase text-[#9CA3AF]">
              Student Portal
            </span>
          </div>
        </div>

        {/* Main Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#C4C9D4] px-3 mb-2">
            Main Menu
          </p>
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative ${
                  active
                    ? 'bg-gradient-to-r from-[#3ECBA0]/15 to-[#3ECBA0]/5 text-[#3ECBA0]'
                    : 'text-[#6B7280] hover:bg-gray-50 hover:text-[#374151]'
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#3ECBA0] rounded-r-full" />
                )}
                {item.icon(active)}
                <span
                  className={`text-sm font-medium ${active ? 'text-[#3ECBA0] font-semibold' : 'text-[#6B7280] group-hover:text-[#374151]'}`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom nav */}
        <div className="px-3 pb-4 border-t border-gray-100 pt-3 space-y-0.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#C4C9D4] px-3 mb-2">
            Account
          </p>
          {bottomNavItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
                  active
                    ? 'bg-gradient-to-r from-[#3ECBA0]/15 to-[#3ECBA0]/5 text-[#3ECBA0]'
                    : 'text-[#9CA3AF] hover:bg-gray-50 hover:text-[#374151]'
                }`}
              >
                <span
                  className={
                    active ? 'text-[#3ECBA0]' : 'text-[#9CA3AF] group-hover:text-[#6B7280]'
                  }
                >
                  {item.icon}
                </span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[#9CA3AF] hover:bg-red-50 hover:text-red-500 transition-all duration-150 group"
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
            <span className="text-sm font-medium">Log Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 lg:ml-60 pb-20 lg:pb-0 min-h-screen flex flex-col">
        {/* Top bar — desktop only */}
        <div className="hidden lg:flex items-center justify-between px-8 py-3.5 bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-2">
            {/* Breadcrumb */}
            <span className="text-[#9CA3AF] text-sm">
              {navItems.find((n) => isActive(n.href))?.label ||
                bottomNavItems.find((n) => pathname.startsWith(n.href))?.label ||
                'Dashboard'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationCenter userId={user?.id} recipientType="student" />
            <div className="flex items-center gap-2.5 pl-3 border-l border-gray-100 cursor-pointer group">
              <div className="w-8 h-8 bg-gradient-to-br from-[#3ECBA0] to-[#1a9e7a] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-white font-bold text-xs">{initials}</span>
              </div>
              <div>
                <div className="text-[#1A1A1A] font-semibold text-sm leading-tight">
                  {displayName}
                </div>
                <div className="text-[#9CA3AF] text-xs">{user?.email}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1">{children}</div>
      </main>

      {/* ── Bottom nav — mobile ── */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-30 shadow-lg"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around px-1 py-1.5">
          {mobileNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all min-w-0"
              >
                {item.icon(active)}
                <span
                  className={`text-[10px] font-semibold transition-colors ${active ? 'text-[#3ECBA0]' : 'text-[#9CA3AF]'}`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';
import NotificationCenter from '@/components/NotificationCenter';

interface Partner {
  id: string;
  name: string;
  image_url?: string;
}

const navGroups = [
  {
    label: 'Overview',
    items: [
      {
        href: '/partner-portal/dashboard',
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
    ],
  },
  {
    label: 'Operations',
    items: [
      {
        href: '/partner-portal/meals',
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
        href: '/partner-portal/redemptions',
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        ),
      },
      {
        href: '/partner-portal/fulfilment',
        label: 'Fulfilment',
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 4h6m-6 4h4"
            />
          </svg>
        ),
      },
      {
        href: '/partner-portal/verify',
        label: 'Verify Meal',
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
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Finance',
    items: [
      {
        href: '/partner-portal/earnings',
        label: 'Earnings',
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
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
      },
      {
        href: '/partner-portal/settlement',
        label: 'Settlement',
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
    label: 'Account',
    items: [
      {
        href: '/partner-portal/profile',
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

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [partnerId, setPartnerId] = useState('');

  useEffect(() => {
    const loadPartner = async () => {
      try {
        const user = await api.getMe();
        if (!user) {
          router.push('/partner-portal/login');
          return;
        }
        const p = await api.getPartnerProfile();
        if (!p) {
          router.push('/partner-portal/login');
          return;
        }
        setPartner(p);
        setPartnerId(p.id);
      } catch {
        router.push('/partner-portal/login');
      } finally {
        setLoading(false);
      }
    };
    loadPartner();
  }, []);

  const handleSignOut = async () => {
    api.logout();
    router.push('/partner-portal/login');
  };

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/partner-portal/dashboard') return pathname === '/partner-portal/dashboard';
    return pathname.startsWith(href);
  };

  const initials = partner?.name
    ? partner.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'P';

  const currentPage = allNavItems.find((item) => isActive(item.href))?.label || 'Partner Portal';

  if (loading) {
    return (
      <div
        className="min-h-screen bg-[#F0F2F5] flex items-center justify-center"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#3ECBA0] border-t-transparent animate-spin" />
          <p className="text-[#6B7280] text-sm">Loading partner portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 shadow-sm ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Logo + portal badge */}
        <div className="px-5 py-5 border-b border-gray-100">
          <Link href="/partner-portal/dashboard">
            <Image
              src="/assets/images/makanan-logo-black-removebg-preview-1787356756845.png"
              alt="Makanan"
              width={120}
              height={32}
              className="object-contain"
            />
          </Link>
          <div className="mt-2">
            <span className="text-[10px] font-bold tracking-widest uppercase text-[#9CA3AF]">
              Partner Portal
            </span>
          </div>
        </div>

        {/* Partner info */}
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3ECBA0] to-[#1a9e7a] flex items-center justify-center overflow-hidden flex-shrink-0">
              {partner?.image_url ? (
                <Image
                  src={partner.image_url}
                  alt={partner.name || ''}
                  width={36}
                  height={36}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-white text-sm font-bold">{initials}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[#111827] text-sm font-semibold truncate">
                {partner?.name || 'Partner'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 bg-[#3ECBA0] rounded-full" />
                <span className="text-[#3ECBA0] text-xs font-medium">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#C4C9D4] px-3 mb-1.5">
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
                        active
                          ? 'bg-gradient-to-r from-[#3ECBA0]/15 to-[#3ECBA0]/5 text-[#3ECBA0]'
                          : 'text-[#6B7280] hover:bg-gray-50 hover:text-[#374151]'
                      }`}
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
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#9CA3AF] hover:bg-red-50 hover:text-red-500 transition-all w-full"
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
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-5 lg:px-6 py-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#6B7280] hover:bg-gray-100 transition-colors"
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
              <p className="text-[#9CA3AF] text-xs hidden lg:block">Partner Portal</p>
              <p className="text-[#111827] font-semibold text-sm">{currentPage}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationCenter partnerId={partnerId} recipientType="partner" />
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3ECBA0] to-[#1a9e7a] flex items-center justify-center shadow-sm">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

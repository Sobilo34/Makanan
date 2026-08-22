'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import NotificationCenter from '@/components/NotificationCenter';

interface Partner {
  id: string;
  name: string;
  image_url?: string;
}

const navItems = [
  {
    href: '/partner-portal/dashboard',
    label: 'Dashboard',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-[#3ECBA0]' : 'text-[#9CA3AF]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/partner-portal/meals',
    label: 'Meals',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-[#3ECBA0]' : 'text-[#9CA3AF]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    href: '/partner-portal/redemptions',
    label: 'Redemptions',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-[#3ECBA0]' : 'text-[#9CA3AF]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    href: '/partner-portal/fulfilment',
    label: 'Fulfilment',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-[#3ECBA0]' : 'text-[#9CA3AF]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 4h6m-6 4h4" />
      </svg>
    ),
  },
  {
    href: '/partner-portal/earnings',
    label: 'Earnings',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-[#3ECBA0]' : 'text-[#9CA3AF]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: '/partner-portal/settlement',
    label: 'Settlement',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-[#3ECBA0]' : 'text-[#9CA3AF]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    href: '/partner-portal/verify',
    label: 'Verify Meal',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-[#3ECBA0]' : 'text-[#9CA3AF]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8H3m2 8H3m18-8h-2M5 4H3m2 16H3m18-4h-2M5 12H3" />
      </svg>
    ),
  },
  {
    href: '/partner-portal/profile',
    label: 'Settings',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-[#3ECBA0]' : 'text-[#9CA3AF]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [partnerId, setPartnerId] = useState('');

  useEffect(() => {
    const loadPartner = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/partner-portal/login');
        return;
      }
      const { data } = await supabase
        .from('partners')
        .select('id, name, image_url')
        .eq('user_id', user.id)
        .single();
      if (!data) {
        router.push('/partner-portal/login');
        return;
      }
      setPartner(data);
      setPartnerId(data.id);
      setLoading(false);
    };
    loadPartner();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/partner-portal/login');
  };

  const isActive = (href: string) => {
    if (href === '/partner-portal/dashboard') return pathname === '/partner-portal/dashboard';
    return pathname.startsWith(href);
  };

  const initials = partner?.name
    ? partner.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'P';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#3ECBA0] border-t-transparent animate-spin" />
          <p className="text-[#6B7280] text-sm">Loading partner portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-[220px] bg-white border-r border-[#E5E7EB] flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-[#F3F4F6]">
          <Link href="/partner-portal/dashboard" className="flex items-center gap-2.5">
            <Image
              src="/assets/images/makanan-logo-black-removebg-preview-1787356756845.png"
              alt="Makanan"
              width={110}
              height={32}
              className="object-contain"
            />
          </Link>
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
              </Link>
            );
          })}
        </nav>

        {/* Bottom: sign out */}
        <div className="px-3 py-4 border-t border-[#F3F4F6]">
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
        <header className="sticky top-0 z-20 bg-white border-b border-[#E5E7EB] px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-[#6B7280] hover:bg-[#F3F4F6]"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Partner info */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#3ECBA0]/15 flex items-center justify-center overflow-hidden">
                {partner?.image_url ? (
                  <Image src={partner.image_url} alt={partner.name || ''} width={36} height={36} className="object-cover w-full h-full" />
                ) : (
                  <span className="text-[#3ECBA0] text-sm font-bold">{initials}</span>
                )}
              </div>
              <div>
                <p className="text-xs text-[#9CA3AF] leading-none mb-0.5">Partner</p>
                <p className="text-sm font-semibold text-[#111827] leading-none">{partner?.name || 'Partner'}</p>
              </div>
            </div>
          </div>

          {/* Right: notification + avatar */}
          <div className="flex items-center gap-3">
            <NotificationCenter partnerId={partnerId} recipientType="partner" />
            <div className="w-8 h-8 rounded-full bg-[#1a3028] flex items-center justify-center">
              <span className="text-white text-xs font-bold">{initials}</span>
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

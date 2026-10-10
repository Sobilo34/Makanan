'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import PartnerLayout from '../components/PartnerLayout';
import { api } from '@/lib/api';

interface Meal {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  price_myr: number;
  availability: string;
  redemption_count: number;
  is_active: boolean;
  serving_quantity: number;
}

function AvailabilityBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    available: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500',
      label: 'Available',
    },
    low_stock: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      dot: 'bg-amber-500',
      label: 'Low Stock',
    },
    unavailable: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500', label: 'Unavailable' },
    coming_soon: {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      dot: 'bg-gray-400',
      label: 'Coming Soon',
    },
  };
  const s = map[status] || map.available;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
      Inactive
    </span>
  );
}

export default function ManageMealsPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [filtered, setFiltered] = useState<Meal[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [partnerId, setPartnerId] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const partner = await api.getPartnerProfile();
        if (partner?.id) setPartnerId(partner.id);

        const data = await api.getPartnerMeals();
        setMeals(data || []);
        setFiltered(data || []);
      } catch (err) {
        console.warn('Partner meals load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(meals.filter((m) => m.name.toLowerCase().includes(q)));
  }, [search, meals]);

  return (
    <PartnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">Manage Meals</h1>
            <p className="text-[#6B7280] text-sm mt-0.5">
              {meals.length} meal{meals.length !== 1 ? 's' : ''} in your menu
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
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
                placeholder="Search meals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/30 focus:border-[#3ECBA0] w-52 transition-all"
              />
            </div>
            <Link
              href="/partner-portal/meals/add"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #3ECBA0 0%, #2db88d 100%)' }}
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
              Add Meal
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 rounded-full border-2 border-[#3ECBA0] border-t-transparent animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-[#F3F4F6] flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-7 h-7 text-[#9CA3AF]"
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
              </div>
              <p className="text-[#374151] font-semibold mb-1">No meals found</p>
              <p className="text-[#9CA3AF] text-sm mb-4">
                {search ? 'Try a different search term.' : 'Add your first meal to get started.'}
              </p>
              {!search && (
                <Link
                  href="/partner-portal/meals/add"
                  className="text-[#3ECBA0] text-sm font-semibold hover:text-[#2db88d]"
                >
                  + Add Meal
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-4 px-6 py-3 border-b border-[#F3F4F6] bg-[#FAFAFA]">
                {['Meal', 'Price/Plan', 'Availability', 'Redeemed', 'Status', ''].map((h) => (
                  <span
                    key={h}
                    className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide"
                  >
                    {h}
                  </span>
                ))}
              </div>

              {/* Rows */}
              <div className="divide-y divide-[#F3F4F6]">
                {filtered.map((meal) => (
                  <div
                    key={meal.id}
                    className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-4 px-6 py-4 items-center hover:bg-[#FAFAFA] transition-colors"
                  >
                    {/* Meal */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] overflow-hidden flex-shrink-0">
                        {meal.image_url ? (
                          <Image
                            src={meal.image_url}
                            alt={meal.name}
                            width={40}
                            height={40}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg">
                            🍽️
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#111827] text-sm truncate">{meal.name}</p>
                        {meal.description && (
                          <p className="text-xs text-[#9CA3AF] truncate">{meal.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div>
                      <p className="text-sm font-medium text-[#374151]">
                        {meal.price_myr ? `RM ${Number(meal.price_myr).toFixed(2)}` : 'TBD'}
                      </p>
                    </div>

                    {/* Availability */}
                    <div>
                      <AvailabilityBadge status={meal.availability || 'available'} />
                    </div>

                    {/* Redeemed */}
                    <div>
                      <span className="text-sm font-semibold text-[#374151]">
                        {meal.redemption_count || 0}
                      </span>
                    </div>

                    {/* Status */}
                    <div>
                      <StatusBadge isActive={meal.is_active} />
                    </div>

                    {/* Action */}
                    <div>
                      <Link
                        href={`/partner-portal/meals/${meal.id}`}
                        className="w-8 h-8 rounded-lg bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center transition-colors"
                      >
                        <svg
                          className="w-4 h-4 text-[#6B7280]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </PartnerLayout>
  );
}

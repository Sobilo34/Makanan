'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import AdminLayout from '../components/AdminLayout';
import { api } from '@/lib/api';

interface Meal {
  id: string;
  name: string;
  thumbnail: string;
  thumbnailAlt: string;
  partner: string;
  category: string;
  availability: string;
  redemptions: number;
  status: string;
  price: string;
}

const availabilities = ['All Availability', 'Available', 'Limited', 'Unavailable'];
const statuses = ['All Status', 'Active', 'Disabled'];

export default function MealsPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [partnerFilter, setPartnerFilter] = useState('All Partners');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [availabilityFilter, setAvailabilityFilter] = useState('All Availability');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchMeals = async () => {
      setLoading(true);
      try {
        const data = await api.getMeals();
        if (Array.isArray(data)) {
          setMeals(
            data.map((m: any) => ({
              id: m.id,
              name: m.name,
              thumbnail:
                m.image_url ||
                'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=80&h=80&fit=crop',
              thumbnailAlt: m.name,
              partner: m.partner?.name || m.partners?.name || 'Partner',
              category: m.category || 'Mains',
              availability: m.is_available ? 'Available' : 'Unavailable',
              redemptions: 0,
              status: m.is_active !== false ? 'Active' : 'Disabled',
              price: `RM ${Number(m.price_myr || 0).toFixed(2)}`,
            }))
          );
        }
      } catch (err) {
        console.error('Failed to load meals:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMeals();
  }, []);

  const partnerOptions = [
    'All Partners',
    ...Array.from(new Set(meals.map((m) => m.partner).filter(Boolean))),
  ];
  const categoryOptions = [
    'All Categories',
    ...Array.from(new Set(meals.map((m) => m.category).filter(Boolean))),
  ];

  const filtered = meals.filter((m) => {
    if (partnerFilter !== 'All Partners' && m.partner !== partnerFilter) return false;
    if (categoryFilter !== 'All Categories' && m.category !== categoryFilter) return false;
    if (availabilityFilter !== 'All Availability' && m.availability !== availabilityFilter)
      return false;
    if (statusFilter !== 'All Status' && m.status !== statusFilter) return false;
    if (
      search &&
      !m.name.toLowerCase().includes(search.toLowerCase()) &&
      !m.partner.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const availabilityStyle = (a: string) => {
    if (a === 'Available') return { bg: '#E8F8F1', text: '#4CAF7D' };
    if (a === 'Limited') return { bg: '#FEF9EC', text: '#F2C94C' };
    return { bg: '#FDECEA', text: '#E57373' };
  };

  const statusStyle = (s: string) => {
    if (s === 'Active') return { bg: '#E8F8F1', text: '#4CAF7D' };
    return { bg: '#F3F4F6', text: '#9CA3AF' };
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">Meal Management</h1>
            <p className="text-[#6B7280] text-sm mt-0.5">
              {meals.length} meals across all partners
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-[#F3F4F6] p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
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
                placeholder="Search meals..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#3ECBA0]"
              />
            </div>

            <select
              value={partnerFilter}
              onChange={(e) => setPartnerFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] text-sm text-[#374151] focus:outline-none focus:border-[#3ECBA0]"
            >
              {partnerOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] text-sm text-[#374151] focus:outline-none focus:border-[#3ECBA0]"
            >
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] text-sm text-[#374151] focus:outline-none focus:border-[#3ECBA0]"
            >
              {availabilities.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] text-sm text-[#374151] focus:outline-none focus:border-[#3ECBA0]"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Meals list */}
        <div className="bg-white rounded-2xl border border-[#F3F4F6] overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-sm text-[#9CA3AF]">Loading live meals...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-[#9CA3AF]">No meals found.</div>
          ) : (
            <div className="divide-y divide-[#F3F4F6]">
              {filtered.map((meal) => {
                const as = availabilityStyle(meal.availability);
                const ss = statusStyle(meal.status);
                return (
                  <div
                    key={meal.id}
                    className="p-4 flex items-center gap-4 hover:bg-[#FAFAFA] transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-[#F3F4F6]">
                      <Image
                        src={meal.thumbnail}
                        alt={meal.thumbnailAlt}
                        fill
                        className="object-cover"
                        sizes="56px"
                        unoptimized
                      />
                    </div>

                    {/* Meal info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#111827] truncate">{meal.name}</p>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: ss.bg, color: ss.text }}
                        >
                          {meal.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B7280] mt-0.5">
                        {meal.partner} · {meal.category}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#111827]">{meal.price}</p>
                    </div>

                    {/* Availability */}
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                      style={{ background: as.bg, color: as.text }}
                    >
                      {meal.availability}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-xs text-[#9CA3AF] text-right">
          Showing {filtered.length} of {meals.length} meals
        </p>
      </div>
    </AdminLayout>
  );
}

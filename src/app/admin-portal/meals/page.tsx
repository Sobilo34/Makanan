'use client';

import { useState } from 'react';
import Image from 'next/image';
import AdminLayout from '../components/AdminLayout';

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

const demoMeals: Meal[] = [
  {
    id: 'm1',
    name: 'Nasi Lemak Special',
    thumbnail: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=80&h=80&fit=crop',
    thumbnailAlt: 'Nasi lemak with sambal, egg, and anchovies on a banana leaf',
    partner: 'Central Kitchen',
    category: 'Rice',
    availability: 'Available',
    redemptions: 312,
    status: 'Active',
    price: 'RM 8.00',
  },
  {
    id: 'm2',
    name: 'Mee Goreng Mamak',
    thumbnail: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=80&h=80&fit=crop',
    thumbnailAlt: 'Stir-fried yellow noodles with vegetables and egg',
    partner: 'Mamak Stall A',
    category: 'Noodles',
    availability: 'Available',
    redemptions: 245,
    status: 'Active',
    price: 'RM 7.50',
  },
  {
    id: 'm3',
    name: 'Roti Canai Set',
    thumbnail: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=80&h=80&fit=crop',
    thumbnailAlt: 'Flaky roti canai served with dhal curry and sambal',
    partner: 'Mamak Stall A',
    category: 'Breakfast',
    availability: 'Limited',
    redemptions: 410,
    status: 'Active',
    price: 'RM 5.00',
  },
  {
    id: 'm4',
    name: 'Ayam Goreng Berempah',
    thumbnail: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=80&h=80&fit=crop',
    thumbnailAlt: 'Crispy spiced fried chicken on a white plate',
    partner: 'Central Kitchen',
    category: 'Mains',
    availability: 'Unavailable',
    redemptions: 188,
    status: 'Disabled',
    price: 'RM 10.00',
  },
  {
    id: 'm5',
    name: 'Teh Tarik + Toast',
    thumbnail: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=80&h=80&fit=crop',
    thumbnailAlt: 'Frothy pulled milk tea with kaya butter toast',
    partner: 'Campus Hub Cafe',
    category: 'Breakfast',
    availability: 'Available',
    redemptions: 520,
    status: 'Active',
    price: 'RM 4.50',
  },
  {
    id: 'm6',
    name: 'Nasi Campur',
    thumbnail: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=80&h=80&fit=crop',
    thumbnailAlt: 'Mixed rice with assorted lauk including vegetables and meat',
    partner: 'Campus Hub Cafe',
    category: 'Rice',
    availability: 'Available',
    redemptions: 278,
    status: 'Active',
    price: 'RM 9.00',
  },
  {
    id: 'm7',
    name: 'Laksa Asam',
    thumbnail: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=80&h=80&fit=crop',
    thumbnailAlt: 'Tangy asam laksa noodle soup with fish and herbs',
    partner: 'Central Kitchen',
    category: 'Noodles',
    availability: 'Limited',
    redemptions: 134,
    status: 'Active',
    price: 'RM 8.50',
  },
  {
    id: 'm8',
    name: 'Char Kway Teow',
    thumbnail: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=80&h=80&fit=crop',
    thumbnailAlt: 'Wok-fried flat rice noodles with prawns and bean sprouts',
    partner: 'Kiosk 7',
    category: 'Noodles',
    availability: 'Available',
    redemptions: 96,
    status: 'Active',
    price: 'RM 8.00',
  },
];

const partners = ['All Partners', 'Central Kitchen', 'Mamak Stall A', 'Campus Hub Cafe', 'Kiosk 7'];
const categories = ['All Categories', 'Rice', 'Noodles', 'Breakfast', 'Mains'];
const availabilities = ['All Availability', 'Available', 'Limited', 'Unavailable'];
const statuses = ['All Status', 'Active', 'Disabled'];

export default function MealsPage() {
  const [partnerFilter, setPartnerFilter] = useState('All Partners');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [availabilityFilter, setAvailabilityFilter] = useState('All Availability');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [search, setSearch] = useState('');

  const filtered = demoMeals.filter((m) => {
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
              {demoMeals.length} meals across all partners
            </p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg, #3ECBA0, #2db88d)' }}
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
          </button>
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
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-sm text-[#374151] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/20 focus:border-[#3ECBA0] transition-all"
              />
            </div>
            {[
              { value: partnerFilter, setter: setPartnerFilter, options: partners },
              { value: categoryFilter, setter: setCategoryFilter, options: categories },
              { value: availabilityFilter, setter: setAvailabilityFilter, options: availabilities },
              { value: statusFilter, setter: setStatusFilter, options: statuses },
            ].map((f, i) => (
              <select
                key={i}
                value={f.value}
                onChange={(e) => f.setter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/20 focus:border-[#3ECBA0] transition-all cursor-pointer"
              >
                {f.options.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#F3F4F6] overflow-hidden">
          <div className="grid grid-cols-[2.5fr_1.5fr_1fr_1fr_1fr_1fr_1.2fr] gap-3 px-5 py-3 border-b border-[#F3F4F6] bg-[#FAFAFA]">
            {[
              'Meal',
              'Partner',
              'Category',
              'Availability',
              'Redemptions',
              'Status',
              'Actions',
            ].map((h) => (
              <p key={h} className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                {h}
              </p>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-[#9CA3AF] text-sm">
              No meals match the selected filters
            </div>
          ) : (
            <div className="divide-y divide-[#F9FAFB]">
              {filtered.map((meal) => {
                const as = availabilityStyle(meal.availability);
                const ss = statusStyle(meal.status);
                return (
                  <div
                    key={meal.id}
                    className="grid grid-cols-[2.5fr_1.5fr_1fr_1fr_1fr_1fr_1.2fr] gap-3 px-5 py-3.5 hover:bg-[#F9FAFB] transition-colors items-center"
                  >
                    {/* Meal */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-[#F3F4F6]">
                        <Image
                          src={meal.thumbnail}
                          alt={meal.thumbnailAlt}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#374151] truncate">{meal.name}</p>
                        <p className="text-xs text-[#9CA3AF]">{meal.price}</p>
                      </div>
                    </div>
                    {/* Partner */}
                    <p className="text-sm text-[#6B7280] truncate">{meal.partner}</p>
                    {/* Category */}
                    <span className="text-xs px-2 py-1 rounded-full bg-[#F3F4F6] text-[#6B7280] w-fit">
                      {meal.category}
                    </span>
                    {/* Availability */}
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full w-fit"
                      style={{ background: as.bg, color: as.text }}
                    >
                      {meal.availability}
                    </span>
                    {/* Redemptions */}
                    <p className="text-sm font-semibold text-[#374151]">{meal.redemptions}</p>
                    {/* Status */}
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full w-fit"
                      style={{ background: ss.bg, color: ss.text }}
                    >
                      {meal.status}
                    </span>
                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      <button
                        className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#E8F8F1] hover:text-[#3ECBA0] transition-colors"
                        title="View"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                      <button
                        className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#EEF2FF] hover:text-[#6366F1] transition-colors"
                        title="Edit"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#FDECEA] hover:text-[#E57373] transition-colors"
                        title="Disable"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-xs text-[#9CA3AF] text-right">
          Showing {filtered.length} of {demoMeals.length} meals
        </p>
      </div>
    </AdminLayout>
  );
}

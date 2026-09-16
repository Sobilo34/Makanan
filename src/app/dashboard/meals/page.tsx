'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import RedemptionModal from '../components/RedemptionModal';

interface Meal {
  id: string;
  name: string;
  description: string;
  category: string;
  tier: string;
  calories: number;
  prep_time_minutes: number;
  rating: number;
  image_url: string;
  availability: string;
  partners: { name: string };
}

interface Subscription {
  id: string;
  credits_total: number;
  credits_used: number;
  status: string;
}

const FILTERS = ['All', 'Available', 'Low Stock'];

const availabilityConfig: Record<string, { label: string; bg: string; text: string }> = {
  available: { label: 'Available', bg: '#E8F9F2', text: '#2DAF87' },
  low_stock: { label: 'Low Stock', bg: '#FFF8E6', text: '#D97706' },
  unavailable: { label: 'Unavailable', bg: '#FEF2F2', text: '#DC2626' },
};

export default function MealsPage() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [filtered, setFiltered] = useState<Meal[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      try {
        const [mealsRes, subRes] = await Promise.all([
          supabase
            .from('meals')
            .select('*, partners(name)')
            .eq('is_active', true)
            .order('rating', { ascending: false }),
          user
            ? supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .limit(1)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        ]);
        setMeals(mealsRes.data || []);
        setFiltered(mealsRes.data || []);
        if (subRes && 'data' in subRes) setSubscription(subRes.data);
      } catch (err) {
        console.log('Meals fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    let result = meals;
    if (activeFilter === 'Available') result = result.filter((m) => m.availability === 'available');
    if (activeFilter === 'Low Stock') result = result.filter((m) => m.availability === 'low_stock');
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.partners?.name?.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [meals, activeFilter, search]);

  const creditsRemaining = subscription
    ? subscription.credits_total - subscription.credits_used
    : 0;

  const handleRedeemSuccess = () => {
    if (subscription) {
      setSubscription({ ...subscription, credits_used: subscription.credits_used + 1 });
    }
  };

  return (
    <div className="flex h-[calc(100vh-57px)] bg-[#F5F6FA]">
      {/* ── Main content area ── */}
      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${selectedMeal ? 'lg:mr-80' : ''}`}
      >
        {/* Page header */}
        <div className="bg-white px-8 py-6 border-b border-gray-100 flex-shrink-0">
          <h1 className="text-[#1A1A1A] font-bold text-2xl mb-5">Meals</h1>

          {/* Search row */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 w-64 focus-within:border-[#3ECBA0] transition-colors">
              <svg
                className="w-4 h-4 text-[#9CA3AF] flex-shrink-0"
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
                className="flex-1 bg-transparent text-sm text-[#1A1A1A] placeholder-[#9CA3AF] outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="text-[#9CA3AF] hover:text-[#374151]"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Availability filter tabs */}
          <div className="flex gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all border ${
                  activeFilter === f
                    ? 'bg-[#3ECBA0] text-white border-[#3ECBA0]'
                    : 'bg-white text-[#6B7280] border-gray-200 hover:border-[#3ECBA0]/50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Meals grid */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse"
                >
                  <div className="h-40 bg-gray-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-8 bg-gray-100 rounded-xl mt-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 text-3xl">
                🔍
              </div>
              <p className="text-[#1A1A1A] font-bold mb-1">No meals found</p>
              <p className="text-[#9CA3AF] text-sm">Try a different search or filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((meal) => {
                const avail = availabilityConfig[meal.availability] || availabilityConfig.available;
                const isSelected = selectedMeal?.id === meal.id;
                return (
                  <div
                    key={meal.id}
                    onClick={() => setSelectedMeal(isSelected ? null : meal)}
                    className={`bg-white rounded-2xl border-2 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md ${
                      isSelected
                        ? 'border-[#3ECBA0] shadow-md shadow-[#3ECBA0]/10'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    {/* Image */}
                    <div className="relative h-40 bg-gray-50 overflow-hidden">
                      {meal.image_url ? (
                        <img
                          src={meal.image_url}
                          alt={meal.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          🍽️
                        </div>
                      )}
                      {meal.availability === 'low_stock' && (
                        <div className="absolute top-2 right-2">
                          <span className="bg-[#FFF8E6] text-[#D97706] text-xs font-semibold px-2 py-0.5 rounded-full">
                            Low Stock
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <p className="text-[#9CA3AF] text-xs mb-0.5">Meal name</p>
                      <p className="text-[#1A1A1A] font-bold text-sm mb-0.5">{meal.name}</p>
                      <p className="text-[#9CA3AF] text-xs mb-0.5">Partner name</p>
                      <p className="text-[#6B7280] text-xs mb-3">{meal.partners?.name}</p>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMeal(meal);
                          setShowModal(true);
                        }}
                        disabled={!subscription || creditsRemaining === 0}
                        className="w-full bg-[#3ECBA0] text-white font-semibold text-sm py-2.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#2DAF87] transition-colors"
                      >
                        Redeem Meal
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Right detail panel ── */}
      {selectedMeal && (
        <div className="hidden lg:flex flex-col w-80 bg-white border-l border-gray-100 fixed right-0 top-[57px] bottom-0 overflow-y-auto z-10">
          {/* Panel header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <button
              onClick={() => setSelectedMeal(null)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg
                className="w-4 h-4 text-[#6B7280]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="text-[#1A1A1A] font-bold text-base">Meal Details</h3>
          </div>

          {/* Meal image */}
          <div className="relative h-48 bg-gray-50 flex-shrink-0">
            {selectedMeal.image_url ? (
              <img
                src={selectedMeal.image_url}
                alt={selectedMeal.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
            )}
          </div>

          {/* Meal info */}
          <div className="p-5 flex-1">
            <h2 className="text-[#1A1A1A] font-bold text-lg mb-2">{selectedMeal.name}</h2>

            <p className="text-[#3ECBA0] font-semibold text-sm mb-1">
              {selectedMeal.partners?.name}
            </p>
            <p className="text-[#6B7280] text-sm mb-5 leading-relaxed">
              {selectedMeal.description ||
                'A delicious meal prepared fresh daily at the cafeteria.'}
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-4 mb-5">
              {selectedMeal.calories > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🔥</span>
                  <span className="text-[#374151] text-sm font-medium">
                    {selectedMeal.calories} cal
                  </span>
                </div>
              )}
              {selectedMeal.prep_time_minutes > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-base">⏱</span>
                  <span className="text-[#374151] text-sm font-medium">
                    {selectedMeal.prep_time_minutes} min
                  </span>
                </div>
              )}
              {selectedMeal.rating > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-yellow-400 text-sm">★</span>
                  <span className="text-[#374151] text-sm font-medium">{selectedMeal.rating}</span>
                </div>
              )}
            </div>

            {/* Availability */}
            <div className="mb-6">
              <span
                className="text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{
                  background: availabilityConfig[selectedMeal.availability]?.bg || '#E8F9F2',
                  color: availabilityConfig[selectedMeal.availability]?.text || '#2DAF87',
                }}
              >
                {availabilityConfig[selectedMeal.availability]?.label || 'Available'}
              </span>
            </div>

            {/* Redeem button */}
            <button
              onClick={() => setShowModal(true)}
              disabled={
                !subscription ||
                creditsRemaining === 0 ||
                selectedMeal.availability === 'unavailable'
              }
              className="w-full bg-[#3ECBA0] text-white font-bold text-sm py-3.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#2DAF87] transition-colors"
            >
              Redeem Meal
            </button>
            {!subscription && (
              <p className="text-[#9CA3AF] text-xs text-center mt-2">
                Subscribe to a plan to redeem meals
              </p>
            )}
          </div>
        </div>
      )}

      {/* Redemption modal */}
      {showModal && selectedMeal && (
        <RedemptionModal
          meal={selectedMeal as any}
          subscription={subscription as any}
          onClose={() => setShowModal(false)}
          onSuccess={handleRedeemSuccess}
        />
      )}
    </div>
  );
}

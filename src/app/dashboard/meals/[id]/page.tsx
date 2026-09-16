'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import RedemptionModal from '../../components/RedemptionModal';

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
  partners: { name: string; location: string };
}

interface Subscription {
  id: string;
  credits_total: number;
  credits_used: number;
  status: string;
  meal_plans: { name: string; tier: string };
}

const availabilityConfig: Record<string, { label: string; bg: string; text: string }> = {
  available: { label: 'Available', bg: '#E8F9F2', text: '#2DAF87' },
  low_stock: { label: 'Low Stock', bg: '#FFF8E6', text: '#D97706' },
  unavailable: { label: 'Unavailable', bg: '#FEF2F2', text: '#DC2626' },
};

export default function MealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    const fetchData = async () => {
      const supabase = createClient();
      try {
        const { data: mealData } = await supabase
          .from('meals')
          .select('*, partners(name, location)')
          .eq('id', params.id as string)
          .single();

        const subResult = user
          ? await supabase
              .from('subscriptions')
              .select('*, meal_plans(name, tier)')
              .eq('user_id', user.id)
              .eq('status', 'active')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()
          : { data: null };

        setMeal(mealData);
        setSubscription(subResult?.data || null);
      } catch (err) {
        console.log('Meal detail fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params?.id, user]);

  const creditsRemaining = subscription
    ? subscription.credits_total - subscription.credits_used
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA]">
        <div className="h-72 bg-[#E0E0E0] animate-pulse" />
        <div className="p-6 space-y-4">
          <div className="h-8 bg-[#F0F0F0] rounded-xl w-3/4 animate-pulse" />
          <div className="h-4 bg-[#F0F0F0] rounded-xl w-1/2 animate-pulse" />
          <div className="h-20 bg-[#F0F0F0] rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!meal) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">🍽️</div>
          <p className="text-[#1A1A1A] font-semibold mb-2">Meal not found</p>
          <button onClick={() => router.back()} className="text-[#3ECBA0] font-medium text-sm">
            Go back
          </button>
        </div>
      </div>
    );
  }

  const avail = availabilityConfig[meal.availability] || availabilityConfig.available;
  const canRedeem = !!subscription && creditsRemaining > 0 && meal.availability !== 'unavailable';

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* Hero image */}
      <div className="relative h-72 lg:h-80 bg-[#F0F0F0]">
        {meal.image_url ? (
          <img src={meal.image_url} alt={meal.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#E8F9F2] to-[#C8F0E4] flex items-center justify-center text-7xl">
            🍽️
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
        >
          <svg
            className="w-5 h-5 text-[#1A1A1A]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Share button */}
        <button className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors">
          <svg
            className="w-5 h-5 text-[#1A1A1A]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
        </button>

        {/* Category badge on image */}
        <div className="absolute bottom-4 left-4">
          <span className="bg-white/90 backdrop-blur-sm text-[#1A1A1A] text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
            {meal.category}
          </span>
        </div>
      </div>

      {/* Content card */}
      <div className="bg-white rounded-t-3xl -mt-6 relative z-10 max-w-2xl">
        <div className="px-6 pt-6 pb-32">
          {/* Title + partner */}
          <div className="mb-4">
            <h1 className="text-[#1A1A1A] font-bold text-2xl leading-tight mb-1">{meal.name}</h1>
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-[#9CA3AF]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <p className="text-[#6B7280] text-sm font-medium">{meal.partners?.name}</p>
              {meal.partners?.location && (
                <span className="text-[#9CA3AF] text-xs">· {meal.partners.location}</span>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              {
                icon: '🔥',
                value: meal.calories ? `${meal.calories} cal` : '—',
                label: 'Calories',
              },
              {
                icon: '⏱',
                value: meal.prep_time_minutes ? `${meal.prep_time_minutes} min` : '—',
                label: 'Prep time',
              },
              { icon: '⭐', value: meal.rating ? meal.rating.toString() : '—', label: 'Rating' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-[#F7F8FA] rounded-2xl p-3 text-center border border-[#EBEBEB]"
              >
                <div className="text-lg mb-0.5">{stat.icon}</div>
                <div className="text-[#1A1A1A] font-bold text-sm">{stat.value}</div>
                <div className="text-[#9CA3AF] text-xs">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Availability */}
          <div className="flex items-center gap-3 mb-5">
            <span
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full"
              style={{ background: avail.bg, color: avail.text }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: avail.text }} />
              {avail.label}
            </span>
          </div>

          {/* Description */}
          {meal.description && (
            <div className="mb-5">
              <h3 className="text-[#1A1A1A] font-bold text-sm mb-2">About this meal</h3>
              <p className="text-[#6B7280] text-sm leading-relaxed">{meal.description}</p>
            </div>
          )}

          {/* Credits info */}
          {subscription && (
            <div className="bg-[#F7F8FA] rounded-2xl p-4 border border-[#EBEBEB]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#9CA3AF] text-xs mb-0.5">Your plan</p>
                  <p className="text-[#1A1A1A] font-semibold text-sm">
                    {subscription.meal_plans?.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[#9CA3AF] text-xs mb-0.5">Credits left</p>
                  <p className="text-[#3ECBA0] font-bold text-xl">{creditsRemaining}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 inset-x-0 lg:left-64 bg-white border-t border-[#EBEBEB] px-6 py-4 z-20">
        <div className="max-w-2xl flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            disabled={!canRedeem}
            className="flex-1 bg-[#3ECBA0] text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#2DAF87] transition-colors cta-primary disabled:shadow-none"
          >
            {!subscription
              ? 'No active plan'
              : creditsRemaining === 0
                ? 'No credits left'
                : 'Redeem Meal'}
          </button>
          <div className="bg-[#F7F8FA] rounded-xl px-4 py-3.5 text-sm font-semibold text-[#1A1A1A] flex items-center gap-1.5 border border-[#EBEBEB] flex-shrink-0">
            1 meal
            <svg
              className="w-3 h-3 text-[#9CA3AF]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {showModal && subscription && (
        <RedemptionModal
          meal={meal}
          subscription={subscription}
          creditsRemaining={creditsRemaining}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            if (subscription)
              setSubscription({ ...subscription, credits_used: subscription.credits_used + 1 });
          }}
        />
      )}
    </div>
  );
}

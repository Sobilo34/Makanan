'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import PartnerLayout from '../../components/PartnerLayout';
import { createClient } from '@/lib/supabase/client';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const AVAILABILITY_OPTIONS = [
  {
    value: 'available',
    label: 'Available',
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    ring: 'ring-emerald-400',
  },
  {
    value: 'unavailable',
    label: 'Unavailable',
    bg: 'bg-red-100',
    text: 'text-red-600',
    ring: 'ring-red-400',
  },
  {
    value: 'coming_soon',
    label: 'Coming Soon',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    ring: 'ring-gray-400',
  },
];

interface MealForm {
  name: string;
  description: string;
  price_myr: string;
  serving_quantity: number;
  schedule_days: string[];
  availability: string;
  is_active: boolean;
  image_url: string;
}

export default function EditMealPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdd = params?.id === 'add';
  const mealId = isAdd ? null : (params?.id as string);

  const [form, setForm] = useState<MealForm>({
    name: '',
    description: '',
    price_myr: '',
    serving_quantity: 50,
    schedule_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    availability: 'available',
    is_active: true,
    image_url: '',
  });
  const [partnerId, setPartnerId] = useState('');
  const [loading, setLoading] = useState(!isAdd);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: partner } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (!partner) return;
      setPartnerId(partner.id);

      if (mealId) {
        const { data: meal } = await supabase
          .from('meals')
          .select('*')
          .eq('id', mealId)
          .eq('partner_id', partner.id)
          .single();

        if (meal) {
          setForm({
            name: meal.name || '',
            description: meal.description || '',
            price_myr: meal.price_myr ? String(meal.price_myr) : '',
            serving_quantity: meal.serving_quantity || 50,
            schedule_days: meal.schedule_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            availability: meal.availability || 'available',
            is_active: meal.is_active ?? true,
            image_url: meal.image_url || '',
          });
          setImagePreview(meal.image_url || '');
        }
        setLoading(false);
      }
    };
    load();
  }, [mealId]);

  const toggleDay = (day: string) => {
    setForm((prev) => ({
      ...prev,
      schedule_days: prev.schedule_days.includes(day)
        ? prev.schedule_days.filter((d) => d !== day)
        : [...prev.schedule_days, day],
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImagePreview(result);
      setForm((prev) => ({ ...prev, image_url: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Meal name is required.');
      return;
    }
    setSaving(true);
    setError('');

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price_myr: form.price_myr ? parseFloat(form.price_myr) : null,
      serving_quantity: form.serving_quantity,
      schedule_days: form.schedule_days,
      availability: form.availability,
      is_active: form.is_active,
      image_url: form.image_url || null,
      partner_id: partnerId,
      // Keep category field for DB compatibility — use a neutral default
      category: 'lunch' as const,
      tier: 'standard' as const,
    };

    try {
      if (isAdd) {
        const { error: insertError } = await supabase.from('meals').insert(payload);
        if (insertError) throw insertError;
      } else {
        const { error: updateError } = await supabase
          .from('meals')
          .update(payload)
          .eq('id', mealId!);
        if (updateError) throw updateError;
      }
      router.push('/partner-portal/meals');
    } catch (err: any) {
      setError(err.message || 'Failed to save meal.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PartnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">
            {isAdd ? 'Add New Meal' : `Edit Meal: ${form.name || '...'}`}
          </h1>
          <p className="text-[#6B7280] text-sm mt-0.5">
            {isAdd ? 'Add a new meal to your menu.' : 'Update the details for this meal.'}
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 rounded-full border-2 border-[#3ECBA0] border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
            {/* Left: Meal Information */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-5">
              <h2 className="text-base font-bold text-[#111827]">Meal Information</h2>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">Meal Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Chicken Rice Set"
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#111827] text-sm placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/30 focus:border-[#3ECBA0] transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">
                  Meal Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Describe the meal..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#111827] text-sm placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/30 focus:border-[#3ECBA0] transition-all resize-none"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">
                  Price (RM)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#6B7280] font-medium">
                    RM
                  </span>
                  <input
                    type="number"
                    value={form.price_myr}
                    onChange={(e) => setForm((p) => ({ ...p, price_myr: e.target.value }))}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#111827] text-sm placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/30 focus:border-[#3ECBA0] transition-all"
                  />
                </div>
              </div>

              {/* Serving Quantity */}
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">
                  Serving Quantity
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={form.serving_quantity}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, serving_quantity: parseInt(e.target.value) || 0 }))
                    }
                    className="flex-1 px-4 py-3 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/30 focus:border-[#3ECBA0] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        serving_quantity: Math.max(0, p.serving_quantity - 1),
                      }))
                    }
                    className="w-10 h-10 rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center text-[#374151] font-bold transition-colors"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((p) => ({ ...p, serving_quantity: p.serving_quantity + 1 }))
                    }
                    className="w-10 h-10 rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center text-[#374151] font-bold transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Schedule Days */}
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">
                  Meal Schedule
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => {
                    const selected = form.schedule_days.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                          selected
                            ? 'bg-[#3ECBA0] text-white border-[#3ECBA0]'
                            : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#3ECBA0]/50'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Image & Availability */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-5">
              <h2 className="text-base font-bold text-[#111827]">Image & Availability</h2>

              {/* Image preview */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-full h-48 rounded-2xl bg-[#F3F4F6] overflow-hidden flex items-center justify-center border border-[#E5E7EB]">
                  {imagePreview ? (
                    <Image
                      src={imagePreview}
                      alt="Meal preview"
                      width={300}
                      height={192}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-[#9CA3AF]">
                      <svg
                        className="w-10 h-10"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-xs">No image</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 rounded-xl border border-[#E5E7EB] text-sm font-medium text-[#374151] hover:bg-[#F3F4F6] transition-colors"
                >
                  {imagePreview ? 'Change Image' : 'Upload Image'}
                </button>
              </div>

              {/* Availability */}
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">
                  Availability Settings
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABILITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, availability: opt.value }))}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all border-2 ${
                        form.availability === opt.value
                          ? `${opt.bg} ${opt.text} border-current ring-2 ${opt.ring}`
                          : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#D1D5DB]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between py-3 border-t border-[#F3F4F6]">
                <div>
                  <p className="text-sm font-medium text-[#374151]">Meal Active</p>
                  <p className="text-xs text-[#9CA3AF]">Show this meal to students</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, is_active: !p.is_active }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-[#3ECBA0]' : 'bg-[#D1D5DB]'}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.push('/partner-portal/meals')}
                  className="flex-1 py-3 rounded-xl border border-[#E5E7EB] text-sm font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #3ECBA0 0%, #2db88d 100%)' }}
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Saving...
                    </span>
                  ) : isAdd ? (
                    'Add Meal'
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PartnerLayout>
  );
}

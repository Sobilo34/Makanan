'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface Meal {
  id: string;
  name: string;
  category: string;
  tier: string;
  image_url: string;
  partners?: { id?: string; name: string };
}

interface Subscription {
  id: string;
  credits_total: number;
  credits_used: number;
}

interface Props {
  meal: Meal;
  subscription: Subscription;
  creditsRemaining?: number;
  onClose: () => void;
  onSuccess: () => void;
}

function generateQRCells(text: string): boolean[] {
  const seed = text.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return Array.from({ length: 49 }, (_, i) => {
    const x = i % 7;
    const y = Math.floor(i / 7);
    if ((x < 2 && y < 2) || (x > 4 && y < 2) || (x < 2 && y > 4)) return true;
    return ((seed * (i + 1) * 2654435761) >>> 0) % 3 !== 0;
  });
}

export default function RedemptionModal({
  meal,
  subscription,
  creditsRemaining,
  onClose,
  onSuccess,
}: Props) {
  const { user } = useAuth();
  const effectiveCreditsRemaining =
    creditsRemaining !== undefined
      ? creditsRemaining
      : (subscription?.credits_total || 0) - (subscription?.credits_used || 0);
  const [step, setStep] = useState<'confirm' | 'success'>('confirm');
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const partnerId: string | undefined = meal.partners?.id;
      const result = await api.redeemMeal(subscription.id, meal.id, partnerId);
      setQrCode(result.qr_token || result.qr_code);
      onSuccess();
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Redemption failed');
    } finally {
      setLoading(false);
    }
  };

  const qrCells = qrCode ? generateQRCells(qrCode) : [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
        {step === 'confirm' ? (
          <>
            {/* Meal image */}
            <div className="relative h-44 bg-[#F7F8FA]">
              {meal.image_url ? (
                <img src={meal.image_url} alt={meal.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center"
              >
                <svg
                  className="w-4 h-4 text-[#1A1A1A]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <h2 className="text-[#1A1A1A] font-bold text-xl mb-3">Confirm Redemption</h2>

              <div className="bg-[#F7F8FA] rounded-2xl p-4 mb-5 border border-[#EBEBEB]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-[#E8F9F2] text-[#2DAF87] text-xs font-bold px-2.5 py-1 rounded-full capitalize">
                    {meal.category}
                  </span>
                  <span className="text-[#9CA3AF] text-xs">·</span>
                  <span className="text-[#1A1A1A] font-semibold text-sm">{meal.name}</span>
                </div>
                <p className="text-[#9CA3AF] text-xs">{meal.partners?.name}</p>
                <div className="mt-3 pt-3 border-t border-[#EBEBEB] flex items-center justify-between">
                  <span className="text-[#6B7280] text-sm">Meals remaining after</span>
                  <span className="text-[#1A1A1A] font-bold text-lg">{Math.max(0, effectiveCreditsRemaining - 1)}</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-red-600 text-sm mb-4 flex items-center gap-2">
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

              <button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full bg-[#3ECBA0] text-white font-bold py-3.5 rounded-xl text-sm mb-3 disabled:opacity-60"
              >
                {loading ? (
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
                    Processing...
                  </span>
                ) : (
                  'Confirm Redemption'
                )}
              </button>
              <button
                onClick={onClose}
                className="w-full text-[#9CA3AF] font-medium py-2 text-sm hover:text-[#1A1A1A] transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={onClose}
                className="text-[#9CA3AF] hover:text-[#1A1A1A] transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-[#1A1A1A] font-bold text-lg flex-1">Redemption Requested!</h2>
            </div>

            <div
              className="rounded-2xl overflow-hidden mb-5"
              style={{ background: 'linear-gradient(135deg, #0d2b22 0%, #1a3a2e 100%)' }}
            >
              <div className="p-5 text-center">
                <div className="w-12 h-12 bg-[#3ECBA0] rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#3ECBA0]/30">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-white font-bold text-lg mb-1">QR Code Generated!</h3>
                <p className="text-white/50 text-xs mb-4">
                  Show this to the partner to confirm your meal
                </p>

                <div className="bg-white rounded-2xl p-4 inline-block mb-3">
                  <div className="grid grid-cols-7 gap-0.5 w-28 h-28">
                    {qrCells.map((filled, i) => (
                      <div
                        key={i}
                        className={`aspect-square rounded-sm ${filled ? 'bg-[#1A1A1A]' : 'bg-transparent'}`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-[#3ECBA0] font-mono text-xs font-bold mb-1">{qrCode}</p>
                <p className="text-white/40 text-xs">
                  Valid for: <span className="text-white/70 font-medium">{meal.name}</span>
                </p>
                <div className="mt-3 flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <p className="text-amber-300 text-xs">Awaiting partner confirmation</p>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-[#3ECBA0] text-white font-bold py-3.5 rounded-xl text-sm"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

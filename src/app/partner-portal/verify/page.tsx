'use client';

import { useState, useEffect, useRef } from 'react';
import PartnerLayout from '../components/PartnerLayout';
import { createClient } from '@/lib/supabase/client';
import { api } from '@/lib/api';

interface VerificationResult {
  valid: boolean;
  alreadyConfirmed?: boolean;
  studentName: string;
  mealName: string;
  planName: string;
  redemptionId?: string;
  subscriptionId?: string;
  userId?: string;
  mealId?: string;
  partnerId?: string;
}

export default function VerifyMealPage() {
  const supabase = createClient();
  const [manualCode, setManualCode] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [scanning, setScanning] = useState(false);
  const scanLineRef = useRef<HTMLDivElement>(null);

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
      if (partner) setPartnerId(partner.id);
    };
    load();
  }, []);

  // Scan line animation
  useEffect(() => {
    if (!scanning) return;
    let pos = 0;
    let dir = 1;
    const interval = setInterval(() => {
      pos += dir * 2;
      if (pos >= 100) dir = -1;
      if (pos <= 0) dir = 1;
      if (scanLineRef.current) {
        scanLineRef.current.style.top = `${pos}%`;
      }
    }, 20);
    return () => clearInterval(interval);
  }, [scanning]);

  const verifyCode = async (qrCode: string) => {
    if (!qrCode.trim()) return;
    setVerifying(true);
    setError('');
    setResult(null);
    setConfirmed(false);

    try {
      // 1. Try FastAPI backend first
      try {
        const backendRes = await api.verifyQr(qrCode.trim());
        if (backendRes && (backendRes.valid || backendRes.already_confirmed)) {
          setResult({
            valid: backendRes.valid,
            alreadyConfirmed: backendRes.already_confirmed,
            studentName: backendRes.student_name,
            mealName: backendRes.meal_name,
            planName: backendRes.plan_name,
            redemptionId: backendRes.redemption_id,
            subscriptionId: backendRes.subscription_id,
            partnerId: backendRes.partner_id,
          });
          if (backendRes.already_confirmed) setConfirmed(true);
          return;
        }
      } catch (backendErr: any) {
        console.warn('FastAPI verifyQr failed, falling back to Supabase:', backendErr);
      }

      // 2. Fallback to Supabase
      const { data: redemption, error: rErr } = await supabase
        .from('redemptions')
        .select(
          `
          id, status, subscription_id, meal_id, partner_id, user_id,
          user_profiles:user_id(full_name),
          meals:meal_id(name),
          subscriptions:subscription_id(
            meal_plans:meal_plan_id(name)
          )
        `
        )
        .eq('qr_code', qrCode.trim())
        .maybeSingle();

      if (rErr || !redemption) {
        setResult({ valid: false, studentName: '', mealName: '', planName: '' });
        return;
      }

      const isAlreadyConfirmed = redemption.status === 'confirmed';
      const isValid = redemption.status === 'pending';

      setResult({
        valid: isValid,
        alreadyConfirmed: isAlreadyConfirmed,
        studentName: (redemption.user_profiles as any)?.full_name || 'Unknown Student',
        mealName: (redemption.meals as any)?.name || 'Unknown Meal',
        planName: (redemption.subscriptions as any)?.meal_plans?.name || 'Unknown Plan',
        redemptionId: redemption.id,
        subscriptionId: redemption.subscription_id,
        userId: redemption.user_id,
        mealId: redemption.meal_id,
        partnerId: redemption.partner_id,
      });

      if (isAlreadyConfirmed) {
        setConfirmed(true);
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSimulateScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setShowManual(true);
    }, 1500);
  };

  const handleManualVerify = () => {
    verifyCode(manualCode);
  };

  const handleConfirm = async () => {
    if (!result?.redemptionId) return;
    setConfirming(true);
    setError('');

    try {
      // 1. Try FastAPI backend first
      try {
        await api.confirmRedemption(result.redemptionId);
        setConfirmed(true);
        return;
      } catch (backendErr: any) {
        console.warn('FastAPI confirmRedemption failed, falling back to Supabase:', backendErr);
      }

      // 2. Fallback to Supabase RPC
      if (!partnerId) return;
      const { data: rpcResult, error: rpcErr } = await supabase.rpc('confirm_redemption', {
        redemption_id_param: result.redemptionId,
        partner_id_param: partnerId,
      });

      if (rpcErr) throw rpcErr;
      if (!rpcResult?.success) throw new Error(rpcResult?.error || 'Confirmation failed');

      setConfirmed(true);
    } catch (err: any) {
      setError(err.message || 'Failed to confirm redemption.');
    } finally {
      setConfirming(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setManualCode('');
    setConfirmed(false);
    setError('');
    setShowManual(false);
  };

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Verify Meal</h1>
          <p className="text-[#6B7280] text-sm mt-0.5">
            Scan or enter a student&apos;s redemption code to confirm their meal.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: QR Scanner */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
            <h2 className="text-base font-bold text-[#111827] mb-4">Scan QR Code</h2>

            <div
              className="relative w-full aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden bg-[#1a1a2e] flex items-center justify-center cursor-pointer"
              onClick={!scanning && !verifying ? handleSimulateScan : undefined}
            >
              {[
                'top-3 left-3 border-t-4 border-l-4',
                'top-3 right-3 border-t-4 border-r-4',
                'bottom-3 left-3 border-b-4 border-l-4',
                'bottom-3 right-3 border-b-4 border-r-4',
              ].map((cls, i) => (
                <div key={i} className={`absolute w-8 h-8 border-white/70 rounded-sm ${cls}`} />
              ))}

              {scanning && (
                <div
                  ref={scanLineRef}
                  className="absolute left-4 right-4 h-0.5 bg-[#3ECBA0] shadow-[0_0_8px_#3ECBA0] transition-none"
                  style={{ top: '50%' }}
                />
              )}

              <div className="flex flex-col items-center gap-3 text-white/60">
                {scanning ? (
                  <>
                    <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-white/40"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8H3m2 8H3m18-8h-2M5 4H3m2 16H3m18-4h-2M5 12H3"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-white/60">Scanning...</p>
                  </>
                ) : verifying ? (
                  <>
                    <div className="w-10 h-10 rounded-full border-2 border-[#3ECBA0] border-t-transparent animate-spin" />
                    <p className="text-sm">Verifying...</p>
                  </>
                ) : confirmed ? (
                  <>
                    <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-[#3ECBA0]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-[#3ECBA0]">Meal Confirmed</p>
                  </>
                ) : result?.valid ? (
                  <>
                    <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-amber-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-amber-400">Awaiting Confirmation</p>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-12 h-12 text-white/20"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8H3m2 8H3m18-8h-2M5 4H3m2 16H3m18-4h-2M5 12H3"
                      />
                    </svg>
                    <p className="text-sm text-white/40">Tap to open scanner</p>
                    <p className="text-xs text-white/25">or enter code manually below</p>
                  </>
                )}
              </div>
            </div>

            {/* Manual code entry */}
            <div className="mt-4">
              <button
                onClick={() => setShowManual(!showManual)}
                className="text-sm text-[#3ECBA0] font-medium underline underline-offset-2 hover:text-[#2db88d] transition-colors"
              >
                Enter Redemption Code manually
              </button>

              {showManual && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="e.g. MKN-ABC123-XY789012"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/30 focus:border-[#3ECBA0]"
                    onKeyDown={(e) => e.key === 'Enter' && handleManualVerify()}
                  />
                  <button
                    onClick={handleManualVerify}
                    disabled={verifying || !manualCode.trim()}
                    className="px-4 py-2.5 rounded-xl bg-[#3ECBA0] text-white text-sm font-semibold disabled:opacity-50 transition-all hover:bg-[#2db88d]"
                  >
                    {verifying ? '...' : 'Verify'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Verification Result */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
            <h2 className="text-base font-bold text-[#111827] mb-4">Verification Result</h2>

            {!result && !verifying && (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#F3F4F6] flex items-center justify-center mb-3">
                  <svg
                    className="w-7 h-7 text-[#9CA3AF]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <p className="text-[#374151] font-semibold text-sm">No code scanned yet</p>
                <p className="text-[#9CA3AF] text-xs mt-1">
                  Scan or enter a redemption code to verify
                </p>
              </div>
            )}

            {verifying && (
              <div className="flex flex-col items-center justify-center h-48">
                <div className="w-10 h-10 rounded-full border-2 border-[#3ECBA0] border-t-transparent animate-spin mb-3" />
                <p className="text-[#6B7280] text-sm">Verifying code...</p>
              </div>
            )}

            {result && !verifying && (
              <div className="space-y-4">
                {/* Status banner */}
                {confirmed ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-emerald-700 font-bold text-sm">Meal Confirmed!</p>
                      <p className="text-emerald-600 text-xs">Student can collect their meal</p>
                    </div>
                  </div>
                ) : result.alreadyConfirmed ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-blue-700 font-bold text-sm">Already Confirmed</p>
                      <p className="text-blue-600 text-xs">This meal was already redeemed</p>
                    </div>
                  </div>
                ) : result.valid ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
                    <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-amber-700 font-bold text-sm">
                        Valid — Awaiting Confirmation
                      </p>
                      <p className="text-amber-600 text-xs">
                        Tap Confirm to complete the redemption
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-red-700 font-bold text-sm">Invalid Code</p>
                      <p className="text-red-600 text-xs">This code was not found or is expired</p>
                    </div>
                  </div>
                )}

                {/* Student details */}
                {(result.valid || result.alreadyConfirmed) && (
                  <div className="bg-[#F9FAFB] rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#9CA3AF] font-medium">Student</span>
                      <span className="text-sm font-semibold text-[#111827]">
                        {result.studentName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#9CA3AF] font-medium">Meal</span>
                      <span className="text-sm font-semibold text-[#111827]">
                        {result.mealName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#9CA3AF] font-medium">Plan</span>
                      <span className="text-sm font-semibold text-[#111827]">
                        {result.planName}
                      </span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-red-600 text-sm flex items-center gap-2">
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

                {/* Action buttons */}
                <div className="flex gap-3">
                  {result.valid && !confirmed && (
                    <button
                      onClick={handleConfirm}
                      disabled={confirming}
                      className="flex-1 bg-[#3ECBA0] text-white font-bold py-3 rounded-xl text-sm disabled:opacity-60 hover:bg-[#2db88d] transition-colors"
                    >
                      {confirming ? (
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
                          Confirming...
                        </span>
                      ) : (
                        'Confirm Meal'
                      )}
                    </button>
                  )}
                  <button
                    onClick={handleReset}
                    className="flex-1 border border-[#E5E7EB] text-[#374151] font-semibold py-3 rounded-xl text-sm hover:bg-[#F3F4F6] transition-colors"
                  >
                    {confirmed ? 'Scan Next' : 'Clear'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent confirmations with real-time */}
        <RecentConfirmations partnerId={partnerId} />
      </div>
    </PartnerLayout>
  );
}

function RecentConfirmations({ partnerId }: { partnerId: string }) {
  const supabase = createClient();
  const [recent, setRecent] = useState<any[]>([]);

  const loadRecent = async () => {
    if (!partnerId) return;
    const { data } = await supabase
      .from('redemptions')
      .select(
        `
        id, status, redeemed_at,
        user_profiles:user_id(full_name),
        meals:meal_id(name)
      `
      )
      .eq('partner_id', partnerId)
      .order('redeemed_at', { ascending: false })
      .limit(5);
    setRecent(data || []);
  };

  useEffect(() => {
    if (!partnerId) return;
    loadRecent();

    const channel = supabase
      .channel(`verify-recent-${partnerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'redemptions',
          filter: `partner_id=eq.${partnerId}`,
        },
        () => {
          loadRecent();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partnerId]);

  if (recent.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-[#111827]">Recent Confirmations</h2>
        <span className="inline-flex items-center gap-1.5 text-xs text-[#3ECBA0] font-medium">
          <span className="w-2 h-2 rounded-full bg-[#3ECBA0] animate-pulse" />
          Live
        </span>
      </div>
      <div className="space-y-2">
        {recent.map((r) => {
          const statusMap: Record<string, { bg: string; text: string; label: string }> = {
            confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Confirmed' },
            pending: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pending' },
            rejected: { bg: 'bg-red-50', text: 'text-red-600', label: 'Rejected' },
          };
          const s = statusMap[r.status] || statusMap.pending;
          return (
            <div
              key={r.id}
              className="flex items-center justify-between py-2.5 border-b border-[#F3F4F6] last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-[#374151]">
                  {(r.user_profiles as any)?.full_name || 'Student'}
                </p>
                <p className="text-xs text-[#9CA3AF]">{(r.meals as any)?.name || 'Meal'}</p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}
                >
                  {s.label}
                </span>
                <p className="text-xs text-[#9CA3AF] mt-1">
                  {new Date(r.redeemed_at).toLocaleTimeString('en-MY', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

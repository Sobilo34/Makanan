'use client';

import { useState, useEffect, useRef } from 'react';
import PartnerLayout from '../components/PartnerLayout';
import { createClient } from '@/lib/supabase/client';

interface VerificationResult {
  valid: boolean;
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
  const [code, setCode] = useState('');
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: partner } = await supabase.from('partners').select('id').eq('user_id', user.id).single();
      if (partner) setPartnerId(partner.id);
    };
    load();
  }, []);

  // Simulate QR scan animation
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
      const { data: redemption, error: rErr } = await supabase
        .from('redemptions')
        .select(`
          id, status, subscription_id, meal_id, partner_id, user_id,
          user_profiles:user_id(full_name),
          meals:meal_id(name),
          subscriptions:subscription_id(
            meal_plans:meal_plan_id(name)
          )
        `)
        .eq('qr_code', qrCode.trim())
        .single();

      if (rErr || !redemption) {
        setResult({ valid: false, studentName: '', mealName: '', planName: '' });
        return;
      }

      const isValid = redemption.status === 'pending';
      setResult({
        valid: isValid,
        studentName: (redemption.user_profiles as any)?.full_name || 'Unknown Student',
        mealName: (redemption.meals as any)?.name || 'Unknown Meal',
        planName: (redemption.subscriptions as any)?.meal_plans?.name || 'Unknown Plan',
        redemptionId: redemption.id,
        subscriptionId: redemption.subscription_id,
        userId: redemption.user_id,
        mealId: redemption.meal_id,
        partnerId: redemption.partner_id,
      });
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
      // Simulate a QR code scan with a demo code
      const demoCode = 'DEMO-QR-' + Date.now();
      setCode(demoCode);
      verifyCode(demoCode);
    }, 2000);
  };

  const handleManualVerify = () => {
    verifyCode(manualCode);
  };

  const handleConfirm = async () => {
    if (!result?.redemptionId) return;
    setConfirming(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('redemptions')
        .update({ status: 'confirmed', partner_id: partnerId })
        .eq('id', result.redemptionId);

      if (updateError) throw updateError;

      // Increment redemption count on meal
      if (result.mealId) {
        await supabase.rpc('increment_redemption_count', { meal_id_param: result.mealId }).catch(() => {});
      }

      setConfirmed(true);
    } catch (err: any) {
      setError(err.message || 'Failed to confirm redemption.');
    } finally {
      setConfirming(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setCode('');
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
          <p className="text-[#6B7280] text-sm mt-0.5">Scan a student's QR code or enter a redemption code to verify.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: QR Scanner */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
            <h2 className="text-base font-bold text-[#111827] mb-4">Scan QR Code</h2>

            {/* Scanner area */}
            <div
              className="relative w-full aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden bg-[#1a1a2e] flex items-center justify-center cursor-pointer"
              onClick={!scanning && !verifying ? handleSimulateScan : undefined}
            >
              {/* Corner markers */}
              {[
                'top-3 left-3 border-t-4 border-l-4',
                'top-3 right-3 border-t-4 border-r-4',
                'bottom-3 left-3 border-b-4 border-l-4',
                'bottom-3 right-3 border-b-4 border-r-4',
              ].map((cls, i) => (
                <div key={i} className={`absolute w-8 h-8 border-white/70 rounded-sm ${cls}`} />
              ))}

              {/* Scan line */}
              {scanning && (
                <div
                  ref={scanLineRef}
                  className="absolute left-4 right-4 h-0.5 bg-[#3ECBA0] shadow-[0_0_8px_#3ECBA0] transition-none"
                  style={{ top: '50%' }}
                />
              )}

              {/* Center content */}
              <div className="flex flex-col items-center gap-3 text-white/60">
                {scanning ? (
                  <>
                    <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8H3m2 8H3m18-8h-2M5 4H3m2 16H3m18-4h-2M5 12H3" />
                      </svg>
                    </div>
                    <p className="text-sm text-white/60">Scanning...</p>
                  </>
                ) : verifying ? (
                  <>
                    <div className="w-10 h-10 rounded-full border-2 border-[#3ECBA0] border-t-transparent animate-spin" />
                    <p className="text-sm">Verifying...</p>
                  </>
                ) : result?.valid ? (
                  <>
                    <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center">
                      <svg className="w-8 h-8 text-[#3ECBA0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-[#3ECBA0]">QR Verified</p>
                  </>
                ) : (
                  <>
                    <svg className="w-12 h-12 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8H3m2 8H3m18-8h-2M5 4H3m2 16H3m18-4h-2M5 12H3" />
                    </svg>
                    <p className="text-sm text-white/40">Tap to simulate scan</p>
                    <p className="text-xs text-white/25">(Camera integration coming soon)</p>
                  </>
                )}
              </div>
            </div>

            {/* Manual code fallback */}
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
                    placeholder="Enter code..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/30 focus:border-[#3ECBA0]"
                    onKeyDown={(e) => e.key === 'Enter' && handleManualVerify()}
                  />
                  <button
                    onClick={handleManualVerify}
                    disabled={verifying || !manualCode.trim()}
                    className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-all"
                    style={{ background: 'linear-gradient(135deg, #3ECBA0 0%, #2db88d 100%)' }}
                  >
                    Verify
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Verification Result */}
          <div className="space-y-4">
            {/* Status banner */}
            {result && (
              <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                confirmed
                  ? 'bg-emerald-50 border-emerald-200'
                  : result.valid
                  ? 'bg-emerald-50 border-emerald-200' :'bg-red-50 border-red-200'
              }`}>
                {confirmed ? (
                  <>
                    <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-emerald-700 font-semibold text-sm">Redemption Confirmed Successfully</span>
                  </>
                ) : result.valid ? (
                  <>
                    <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-emerald-700 font-semibold text-sm">Meal Successfully Verified</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-red-600 font-semibold text-sm">Invalid or Already Redeemed</span>
                  </>
                )}
              </div>
            )}

            {/* Details card */}
            {result && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4">
                <h2 className="text-base font-bold text-[#111827]">Redemption Details</h2>

                <div className="space-y-3">
                  {[
                    { label: 'Student', value: result.studentName },
                    { label: 'Meal', value: result.mealName },
                    { label: 'Plan', value: result.planName },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-[#F3F4F6] last:border-0">
                      <span className="text-sm text-[#6B7280]">{item.label}:</span>
                      <span className="text-sm font-semibold text-[#111827]">{item.value || '—'}</span>
                    </div>
                  ))}

                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-[#6B7280]">Status:</span>
                    <div className="flex items-center gap-3">
                      {result.valid && !confirmed ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-emerald-100 text-emerald-700">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          VALID
                        </span>
                      ) : confirmed ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-emerald-100 text-emerald-700">
                          ✓ CONFIRMED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-600">
                          ✗ INVALID
                        </span>
                      )}

                      {result.valid && !confirmed && (
                        <button
                          onClick={handleConfirm}
                          disabled={confirming}
                          className="px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-60"
                          style={{ background: 'linear-gradient(135deg, #3ECBA0 0%, #2db88d 100%)' }}
                        >
                          {confirming ? 'Confirming...' : 'Confirm Redemption'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {error && (
                  <p className="text-red-500 text-sm">{error}</p>
                )}

                {(confirmed || !result.valid) && (
                  <button
                    onClick={handleReset}
                    className="w-full py-2.5 rounded-xl border border-[#E5E7EB] text-sm font-medium text-[#374151] hover:bg-[#F3F4F6] transition-colors mt-2"
                  >
                    Scan Another Code
                  </button>
                )}
              </div>
            )}

            {/* Idle state */}
            {!result && !verifying && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#F3F4F6] flex items-center justify-center">
                  <svg className="w-7 h-7 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <p className="text-[#374151] font-semibold">Ready to Verify</p>
                <p className="text-[#9CA3AF] text-sm">Scan a QR code or enter a redemption code to verify a student's meal.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PartnerLayout>
  );
}

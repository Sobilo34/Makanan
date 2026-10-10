'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface VerificationResult {
  valid: boolean;
  studentName?: string;
  mealName?: string;
  partnerName?: string;
  creditsRemaining?: number;
  redeemedAt?: string;
  status?: string;
  message?: string;
}

export default function PartnerVerificationPage() {
  const [qrInput, setQrInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const handleVerify = async () => {
    if (!qrInput.trim()) return;
    setVerifying(true);
    setResult(null);

    try {
      const res = await api.verifyQr(qrInput.trim());
      if (!res.valid) {
        setResult({
          valid: false,
          message: res.error || (res.already_confirmed ? 'QR code has already been confirmed.' : 'Invalid or expired QR code.'),
        });
        return;
      }

      setResult({
        valid: true,
        studentName: res.student_name || 'Student',
        mealName: res.meal_name || 'Meal',
        partnerName: 'Cafeteria',
        creditsRemaining: res.credits_remaining ?? 0,
        status: res.already_confirmed ? 'already_confirmed' : 'valid',
        message: res.already_confirmed ? 'Already verified and served' : 'Valid meal redemption',
      });
    } catch (err: any) {
      setResult({ valid: false, message: err.message || 'Verification failed. Please try again.' });
    } finally {
      setVerifying(false);
    }
  };

  const handleClear = () => {
    setQrInput('');
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-[#EBEBEB] px-6 py-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-[#3ECBA0] rounded-xl flex items-center justify-center shadow-md shadow-[#3ECBA0]/30">
          <span className="text-white font-bold text-base">M</span>
        </div>
        <div>
          <h1 className="text-[#1A1A1A] font-bold text-base leading-tight">Partner Verification</h1>
          <p className="text-[#9CA3AF] text-xs">Assurance Meal Network</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start px-6 py-10 max-w-md mx-auto w-full">
        {/* Instruction */}
        <div className="w-full mb-6 text-center">
          <div className="w-16 h-16 bg-[#E8F9F2] rounded-2xl flex items-center justify-center mx-auto mb-3 text-3xl">
            📱
          </div>
          <h2 className="text-[#1A1A1A] font-bold text-xl mb-1">Verify Meal Code</h2>
          <p className="text-[#9CA3AF] text-sm">
            Enter the QR code shown on the student&apos;s screen to verify their meal entitlement
          </p>
        </div>

        {/* Input */}
        <div className="w-full bg-white rounded-2xl border border-[#EBEBEB] p-5 mb-4">
          <label className="text-[#6B7280] text-xs font-semibold uppercase tracking-wide mb-2 block">
            Meal Code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              placeholder="e.g. MKN-NASI-LEMAK-29-2026-08-18"
              className="flex-1 bg-[#F7F8FA] border border-[#EBEBEB] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#3ECBA0] transition-colors font-mono"
            />
            {qrInput && (
              <button
                onClick={handleClear}
                className="w-10 h-10 bg-[#F7F8FA] rounded-xl flex items-center justify-center border border-[#EBEBEB] hover:bg-[#F0F0F0] transition-colors flex-shrink-0"
              >
                <svg
                  className="w-4 h-4 text-[#9CA3AF]"
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

          <button
            onClick={handleVerify}
            disabled={!qrInput.trim() || verifying}
            className="w-full mt-4 bg-[#3ECBA0] text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-40 hover:bg-[#2DAF87] transition-colors shadow-md shadow-[#3ECBA0]/25"
          >
            {verifying ? (
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
                Verifying...
              </span>
            ) : (
              'Verify Code'
            )}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div
            className={`w-full rounded-2xl overflow-hidden border-2 ${result.valid ? 'border-[#3ECBA0]' : 'border-red-200'}`}
          >
            {result.valid ? (
              <>
                <div
                  className="p-5"
                  style={{ background: 'linear-gradient(135deg, #0d2b22 0%, #1a3a2e 100%)' }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-[#3ECBA0] rounded-full flex items-center justify-center shadow-lg shadow-[#3ECBA0]/30">
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
                    <div>
                      <p className="text-[#3ECBA0] font-bold text-lg leading-tight">
                        Valid Redemption
                      </p>
                      <p className="text-white/50 text-xs">Entitlement confirmed</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/50 text-sm">Student</span>
                      <span className="text-white font-semibold text-sm">{result.studentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50 text-sm">Meal</span>
                      <span className="text-white font-semibold text-sm">{result.mealName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50 text-sm">Partner</span>
                      <span className="text-white font-semibold text-sm">{result.partnerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50 text-sm">Redeemed at</span>
                      <span className="text-white font-semibold text-sm">
                        {result.redeemedAt
                          ? new Date(result.redeemedAt).toLocaleTimeString('en-MY', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-white px-5 py-3 flex items-center justify-between">
                  <span className="text-[#9CA3AF] text-sm">Credits remaining after</span>
                  <span className="text-[#3ECBA0] font-bold text-xl">
                    {result.creditsRemaining}
                  </span>
                </div>
              </>
            ) : (
              <div className="bg-white p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-red-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-red-600 font-bold text-lg leading-tight">Invalid Code</p>
                    <p className="text-[#9CA3AF] text-xs">Do not serve this meal</p>
                  </div>
                </div>
                <p className="text-[#6B7280] text-sm bg-red-50 rounded-xl px-4 py-3">
                  {result.message}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="w-full mt-6 bg-white rounded-2xl p-4 border border-[#EBEBEB]">
          <p className="text-[#1A1A1A] font-semibold text-sm mb-2">Instructions</p>
          <div className="space-y-1.5">
            {[
              'Ask the student to show their QR code screen',
              'Type or scan the code shown below the QR pattern',
              'Green result = valid, serve the meal',
              'Red result = invalid, do not serve',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-5 h-5 bg-[#E8F9F2] rounded-full text-[#3ECBA0] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-[#6B7280] text-xs">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

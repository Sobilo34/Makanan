'use client';

import { useState, useEffect } from 'react';
import PartnerLayout from '../components/PartnerLayout';
import { api } from '@/lib/api';

interface PartnerData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  description: string | null;
  price_per_meal: number;
  image_url: string | null;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

type ActiveTab = 'business' | 'hours' | 'payment' | 'password' | 'preferences';

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
      <div className="px-6 py-5 border-b border-[#F3F4F6]">
        <h2 className="text-base font-semibold text-[#111827]">{title}</h2>
        <p className="text-sm text-[#6B7280] mt-0.5">{description}</p>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  hint,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
  prefix?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#374151] mb-1.5">{label}</label>
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3.5 text-sm text-[#6B7280] font-medium select-none">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full ${prefix ? 'pl-10' : 'pl-3.5'} pr-3.5 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/30 focus:border-[#3ECBA0] transition-all`}
        />
      </div>
      {hint && <p className="text-xs text-[#9CA3AF] mt-1">{hint}</p>}
    </div>
  );
}

function SaveButton({
  loading,
  onClick,
  label = 'Save Changes',
}: {
  loading: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
      style={{ background: 'linear-gradient(135deg, #3ECBA0 0%, #2db88d 100%)' }}
    >
      {loading ? (
        <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
      ) : (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
      {label}
    </button>
  );
}

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
        type === 'success' ? 'bg-[#1a3028] text-white' : 'bg-red-600 text-white'
      }`}
    >
      {type === 'success' ? (
        <svg
          className="w-4 h-4 text-[#3ECBA0]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      {message}
    </div>
  );
}

export default function PartnerSettingsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('business');
  const [partner, setPartner] = useState<PartnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Business info
  const [bizName, setBizName] = useState('');
  const [bizEmail, setBizEmail] = useState('');
  const [bizPhone, setBizPhone] = useState('');
  const [bizLocation, setBizLocation] = useState('');
  const [bizDescription, setBizDescription] = useState('');
  const [bizSaving, setBizSaving] = useState(false);

  // Operating hours
  const [openTime, setOpenTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('20:00');
  const [operatingDays, setOperatingDays] = useState<string[]>([
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ]);
  const [hoursSaving, setHoursSaving] = useState(false);

  // Payment
  const [pricePerMeal, setPricePerMeal] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [paymentSaving, setPaymentSaving] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [redemptionAlerts, setRedemptionAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [prefSaving, setPrefSaving] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getPartnerProfile();
        if (!data) return;
        setPartner(data);
        setBizName(data.name || '');
        setBizEmail(data.email || '');
        setBizPhone(data.phone || '');
        setBizLocation(data.location || '');
        setBizDescription(data.description || '');
        setPricePerMeal(data.price_per_meal ? String(data.price_per_meal) : '');
      } catch (err) {
        console.error('Failed to load partner profile:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSaveBusiness = async () => {
    if (!partner) return;
    setBizSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    setBizSaving(false);
    showToast('Business info updated successfully.', 'success');
  };

  const handleSaveHours = async () => {
    if (!partner) return;
    setHoursSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setHoursSaving(false);
    showToast('Operating hours saved.', 'success');
  };

  const handleSavePayment = async () => {
    if (!partner) return;
    setPaymentSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    setPaymentSaving(false);
    showToast('Payment details updated.', 'success');
  };

  const handleSavePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }
    setPasswordSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    setPasswordSaving(false);
    showToast('Password updated successfully.', 'success');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSavePreferences = async () => {
    setPrefSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setPrefSaving(false);
    showToast('Preferences saved.', 'success');
  };

  const toggleDay = (day: string) => {
    setOperatingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'business',
      label: 'Business Info',
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
    },
    {
      id: 'hours',
      label: 'Operating Hours',
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: 'payment',
      label: 'Payment Details',
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
    },
    {
      id: 'password',
      label: 'Password',
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
    },
    {
      id: 'preferences',
      label: 'Preferences',
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  if (loading) {
    return (
      <PartnerLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-2 border-[#3ECBA0] border-t-transparent animate-spin" />
        </div>
      </PartnerLayout>
    );
  }

  const initials = partner?.name
    ? partner.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'P';

  return (
    <PartnerLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Settings</h1>
          <p className="text-[#6B7280] text-sm mt-0.5">
            Manage your business profile, hours, and account preferences
          </p>
        </div>

        {/* Profile summary card */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] px-6 py-5 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-[#3ECBA0]/15 flex items-center justify-center flex-shrink-0">
            <span className="text-[#3ECBA0] text-xl font-bold">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-[#111827] truncate">
              {partner?.name || 'Partner'}
            </p>
            <p className="text-sm text-[#6B7280] truncate">{partner?.email || '—'}</p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              {partner?.location || 'No location set'}
            </p>
          </div>
          <div className="ml-auto flex-shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Active Partner
            </span>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 bg-[#F3F4F6] p-1 rounded-2xl overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-white text-[#111827] shadow-sm'
                  : 'text-[#6B7280] hover:text-[#374151]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'business' && (
          <SectionCard
            title="Business Information"
            description="Update your restaurant or stall's public-facing details"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Business Name"
                value={bizName}
                onChange={setBizName}
                placeholder="e.g. Warung Mak Cik"
              />
              <InputField
                label="Email Address"
                value={bizEmail}
                onChange={setBizEmail}
                type="email"
                placeholder="business@email.com"
              />
              <InputField
                label="Phone Number"
                value={bizPhone}
                onChange={setBizPhone}
                placeholder="+60 12-345 6789"
              />
              <InputField
                label="Location / Stall Number"
                value={bizLocation}
                onChange={setBizLocation}
                placeholder="e.g. Block A, Cafeteria 1"
              />
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-[#374151] mb-1.5">
                  Business Description
                </label>
                <textarea
                  value={bizDescription}
                  onChange={(e) => setBizDescription(e.target.value)}
                  placeholder="Describe your food offerings, specialties, or any relevant info for students..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/30 focus:border-[#3ECBA0] transition-all resize-none"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <SaveButton loading={bizSaving} onClick={handleSaveBusiness} />
            </div>
          </SectionCard>
        )}

        {activeTab === 'hours' && (
          <SectionCard
            title="Operating Hours"
            description="Set the days and times your stall is open for meal redemptions"
          >
            <div className="space-y-5">
              {/* Days */}
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">
                  Operating Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => {
                    const active = operatingDays.includes(day);
                    return (
                      <button
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all border ${
                          active
                            ? 'bg-[#3ECBA0]/10 border-[#3ECBA0] text-[#1a3028]'
                            : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:border-[#3ECBA0]/50'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">
                    Opening Time
                  </label>
                  <input
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/30 focus:border-[#3ECBA0] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">
                    Closing Time
                  </label>
                  <input
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/30 focus:border-[#3ECBA0] transition-all"
                  />
                </div>
              </div>

              {/* Summary */}
              {operatingDays.length > 0 && (
                <div className="bg-[#F9FAFB] rounded-xl px-4 py-3 flex items-center gap-3">
                  <svg
                    className="w-4 h-4 text-[#3ECBA0] flex-shrink-0"
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
                  <p className="text-sm text-[#374151]">
                    Open{' '}
                    <span className="font-semibold">
                      {openTime} – {closeTime}
                    </span>{' '}
                    on <span className="font-semibold">{operatingDays.join(', ')}</span>
                  </p>
                </div>
              )}
            </div>
            <div className="mt-5 flex justify-end">
              <SaveButton loading={hoursSaving} onClick={handleSaveHours} />
            </div>
          </SectionCard>
        )}

        {activeTab === 'payment' && (
          <SectionCard
            title="Payment Details"
            description="Configure your meal pricing and bank account for settlements"
          >
            <div className="space-y-5">
              {/* Pricing */}
              <div>
                <h3 className="text-sm font-semibold text-[#374151] mb-3">Meal Pricing</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Price per Meal (MYR)"
                    value={pricePerMeal}
                    onChange={setPricePerMeal}
                    type="number"
                    placeholder="0.00"
                    prefix="RM"
                    hint="This is the rate used to calculate your estimated earnings"
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-[#F3F4F6]" />

              {/* Bank details */}
              <div>
                <h3 className="text-sm font-semibold text-[#374151] mb-3">
                  Bank Account for Settlements
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Bank Name"
                    value={bankName}
                    onChange={setBankName}
                    placeholder="e.g. Maybank, CIMB, RHB"
                  />
                  <InputField
                    label="Account Number"
                    value={accountNumber}
                    onChange={setAccountNumber}
                    placeholder="e.g. 1234567890"
                  />
                  <div className="sm:col-span-2">
                    <InputField
                      label="Account Holder Name"
                      value={accountHolder}
                      onChange={setAccountHolder}
                      placeholder="Full name as per bank records"
                    />
                  </div>
                </div>
              </div>

              {/* Info note */}
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex gap-3">
                <svg
                  className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="text-xs text-amber-700">
                  Bank details are used by the Makanan admin team for monthly settlements. Ensure
                  accuracy before saving.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <SaveButton loading={paymentSaving} onClick={handleSavePayment} />
            </div>
          </SectionCard>
        )}

        {activeTab === 'password' && (
          <SectionCard
            title="Change Password"
            description="Update your account password to keep your portal secure"
          >
            <div className="max-w-sm space-y-4">
              <InputField
                label="New Password"
                value={newPassword}
                onChange={setNewPassword}
                type="password"
                placeholder="Min. 6 characters"
              />
              <InputField
                label="Confirm New Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                type="password"
                placeholder="Re-enter new password"
              />
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500 flex items-center gap-1.5">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Passwords do not match
                </p>
              )}
              {newPassword &&
                confirmPassword &&
                newPassword === confirmPassword &&
                newPassword.length >= 6 && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1.5">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Passwords match
                  </p>
                )}
            </div>
            <div className="mt-5 flex justify-end">
              <SaveButton
                loading={passwordSaving}
                onClick={handleSavePassword}
                label="Update Password"
              />
            </div>
          </SectionCard>
        )}

        {activeTab === 'preferences' && (
          <SectionCard
            title="Account Preferences"
            description="Control notifications and account-level settings"
          >
            <div className="space-y-4">
              {[
                {
                  label: 'Email Notifications',
                  description: 'Receive email updates about your account activity',
                  value: emailNotifications,
                  onChange: setEmailNotifications,
                },
                {
                  label: 'Redemption Alerts',
                  description: 'Get notified when a student redeems a meal at your stall',
                  value: redemptionAlerts,
                  onChange: setRedemptionAlerts,
                },
                {
                  label: 'Weekly Summary Report',
                  description: 'Receive a weekly email with your redemption and earnings summary',
                  value: weeklyReport,
                  onChange: setWeeklyReport,
                },
              ].map((pref) => (
                <div
                  key={pref.label}
                  className="flex items-center justify-between py-3 border-b border-[#F3F4F6] last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-[#111827]">{pref.label}</p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">{pref.description}</p>
                  </div>
                  <button
                    onClick={() => pref.onChange(!pref.value)}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                      pref.value ? 'bg-[#3ECBA0]' : 'bg-[#D1D5DB]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                        pref.value ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}

              {/* Danger zone */}
              <div className="mt-4 pt-4 border-t border-[#F3F4F6]">
                <h3 className="text-sm font-semibold text-[#374151] mb-3">Account Status</h3>
                <div className="bg-[#F9FAFB] rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#111827]">Portal Access</p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">
                      Your account is active and accepting redemptions
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <SaveButton
                loading={prefSaving}
                onClick={handleSavePreferences}
                label="Save Preferences"
              />
            </div>
          </SectionCard>
        )}
      </div>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </PartnerLayout>
  );
}

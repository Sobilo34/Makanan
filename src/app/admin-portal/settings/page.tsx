'use client';

import { useState } from 'react';
import AdminLayout from '../components/AdminLayout';

type SettingsTab = 'account' | 'notifications' | 'security';

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${enabled ? 'bg-[#3ECBA0]' : 'bg-[#E5E7EB]'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-[#F3F4F6] overflow-hidden">
      <div className="px-6 py-4 border-b border-[#F3F4F6]">
        <h2 className="text-sm font-semibold text-[#374151]">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function InputField({ label, type = 'text', defaultValue, placeholder }: { label: string; type?: string; defaultValue?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#6B7280] mb-1.5">{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-sm text-[#374151] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3ECBA0]/20 focus:border-[#3ECBA0] transition-all"
      />
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [saved, setSaved] = useState(false);

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    redemptionAlerts: true,
    paymentAlerts: true,
    partnerAlerts: false,
  });

  const [sessions] = useState([
    { id: 's1', device: 'Chrome on macOS', location: 'Alor Setar, MY', time: 'Active now', current: true },
    { id: 's2', device: 'Safari on iPhone', location: 'Alor Setar, MY', time: '2 hours ago', current: false },
  ]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const tabs: { key: SettingsTab; label: string }[] = [
    { key: 'account', label: 'Account' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'security', label: 'Security' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-5 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Settings</h1>
          <p className="text-[#6B7280] text-sm mt-0.5">Manage your admin account and preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-white border border-[#E5E7EB] rounded-xl p-1 gap-1 w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === t.key ? 'bg-[#3ECBA0] text-white shadow-sm' : 'text-[#6B7280] hover:text-[#374151]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Account */}
        {activeTab === 'account' && (
          <div className="space-y-4">
            <SectionCard title="Account Information">
              <div className="space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-[#F3F4F6]">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-[#3ECBA0]" style={{ background: 'linear-gradient(135deg, #E8F8F1, #C6F0E0)' }}>
                    A
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#374151]">Admin User</p>
                    <p className="text-xs text-[#9CA3AF]">admin@makanan.app</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1a3028] text-[#3ECBA0] tracking-wider uppercase mt-1 inline-block">
                      Admin
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <InputField label="Full Name" defaultValue="Admin User" />
                  <InputField label="Email Address" type="email" defaultValue="admin@makanan.app" />
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSave}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all"
                    style={{ background: 'linear-gradient(135deg, #3ECBA0, #2db88d)' }}
                  >
                    {saved ? '✓ Saved' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <SectionCard title="Notification Preferences">
            <div className="space-y-5">
              {[
                { key: 'emailNotifications' as const, label: 'Email Notifications', desc: 'Receive general updates and announcements via email' },
                { key: 'redemptionAlerts' as const, label: 'Redemption Alerts', desc: 'Get notified when redemption anomalies are detected' },
                { key: 'paymentAlerts' as const, label: 'Payment Alerts', desc: 'Receive alerts for failed or pending payments' },
                { key: 'partnerAlerts' as const, label: 'Partner Alerts', desc: 'Notifications for new partner applications and status changes' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[#374151]">{item.label}</p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">{item.desc}</p>
                  </div>
                  <Toggle
                    enabled={notifications[item.key]}
                    onChange={(v) => setNotifications((prev) => ({ ...prev, [item.key]: v }))}
                  />
                </div>
              ))}
              <div className="flex justify-end pt-2 border-t border-[#F3F4F6]">
                <button
                  onClick={handleSave}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all"
                  style={{ background: 'linear-gradient(135deg, #3ECBA0, #2db88d)' }}
                >
                  {saved ? '✓ Saved' : 'Save Preferences'}
                </button>
              </div>
            </div>
          </SectionCard>
        )}

        {/* Security */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            <SectionCard title="Change Password">
              <div className="space-y-4">
                <InputField label="Current Password" type="password" placeholder="Enter current password" />
                <InputField label="New Password" type="password" placeholder="Enter new password" />
                <InputField label="Confirm New Password" type="password" placeholder="Confirm new password" />
                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleSave}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all"
                    style={{ background: 'linear-gradient(135deg, #3ECBA0, #2db88d)' }}
                  >
                    {saved ? '✓ Updated' : 'Update Password'}
                  </button>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Session Management">
              <div className="space-y-3">
                {sessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-[#FAFAFA] border border-[#F3F4F6]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#3ECBA0]/10 flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#3ECBA0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#374151]">{s.device}</p>
                        <p className="text-xs text-[#9CA3AF]">{s.location} · {s.time}</p>
                      </div>
                    </div>
                    {s.current ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E8F8F1] text-[#4CAF7D]">Current</span>
                    ) : (
                      <button className="text-xs font-semibold text-[#E57373] hover:underline">Revoke</button>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

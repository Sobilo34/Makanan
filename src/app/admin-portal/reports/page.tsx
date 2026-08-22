'use client';

import { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,  } from 'recharts';

const studentGrowthData = [
  { month: 'Mar', students: 180 },
  { month: 'Apr', students: 240 },
  { month: 'May', students: 310 },
  { month: 'Jun', students: 390 },
  { month: 'Jul', students: 480 },
  { month: 'Aug', students: 562 },
];

const redemptionTrendData = [
  { week: 'W1 Jul', redemptions: 820 },
  { week: 'W2 Jul', redemptions: 940 },
  { week: 'W3 Jul', redemptions: 1050 },
  { week: 'W4 Jul', redemptions: 980 },
  { week: 'W1 Aug', redemptions: 1120 },
  { week: 'W2 Aug', redemptions: 1240 },
  { week: 'W3 Aug', redemptions: 1180 },
];

const subscriptionData = [
  { name: 'Standard', value: 58 },
  { name: 'Premium', value: 32 },
  { name: 'Trial', value: 10 },
];

const partnerPerformanceData = [
  { partner: 'Central Kitchen', redemptions: 312 },
  { partner: 'Mamak Stall A', redemptions: 245 },
  { partner: 'Campus Hub', redemptions: 198 },
  { partner: 'Kiosk 7', redemptions: 96 },
];

const revenueData = [
  { month: 'Mar', revenue: 18000 },
  { month: 'Apr', revenue: 24000 },
  { month: 'May', revenue: 31000 },
  { month: 'Jun', revenue: 39000 },
  { month: 'Jul', revenue: 48000 },
  { month: 'Aug', revenue: 56200 },
];

const DONUT_COLORS = ['#A8E6C1', '#CDEFD9', '#8E8E8E'];

const summaryCards = [
  { label: 'Total Students', value: '562', trend: '+17%', up: true },
  { label: 'Active Subscriptions', value: '489', trend: '+12%', up: true },
  { label: 'Total Redemptions', value: '7,834', trend: '+22%', up: true },
  { label: 'Total Revenue', value: 'RM 216,200', trend: '+18%', up: true },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 shadow-lg">
        <p className="text-xs text-[#9CA3AF] mb-1">{label}</p>
        <p className="text-sm font-semibold text-[#111827]">{payload[0].value?.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('last30');

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header + Date filter */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">Reports & Analytics</h1>
            <p className="text-[#6B7280] text-sm mt-0.5">Platform performance overview</p>
          </div>
          <div className="flex items-center bg-white border border-[#E5E7EB] rounded-xl p-1 gap-1">
            {[
              { key: 'last7', label: '7 Days' },
              { key: 'last30', label: '30 Days' },
              { key: 'last90', label: '90 Days' },
              { key: 'year', label: 'This Year' },
            ].map((d) => (
              <button
                key={d.key}
                onClick={() => setDateRange(d.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  dateRange === d.key ? 'bg-[#3ECBA0] text-white shadow-sm' : 'text-[#6B7280] hover:text-[#374151]'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((c) => (
            <div key={c.label} className="bg-white rounded-2xl border border-[#F3F4F6] p-5">
              <p className="text-xs text-[#9CA3AF] font-medium mb-2">{c.label}</p>
              <p className="text-2xl font-bold text-[#111827]">{c.value}</p>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full mt-2 inline-block" style={{ background: '#E8F8F1', color: '#4CAF7D' }}>
                {c.trend} vs last period
              </span>
            </div>
          ))}
        </div>

        {/* Row 1: Student Growth + Subscription Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Student Growth - line chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#F3F4F6] p-5">
            <h2 className="text-sm font-semibold text-[#374151] mb-4">Student Growth</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={studentGrowthData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="students" stroke="#A8E6C1" strokeWidth={2.5} dot={{ fill: '#A8E6C1', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Subscription Distribution - donut */}
          <div className="bg-white rounded-2xl border border-[#F3F4F6] p-5">
            <h2 className="text-sm font-semibold text-[#374151] mb-4">Subscription Distribution</h2>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={subscriptionData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {subscriptionData.map((_, i) => (
                    <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value}%`, '']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1.5 mt-2">
              {subscriptionData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: DONUT_COLORS[i] }} />
                    <span className="text-xs text-[#6B7280]">{d.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-[#374151]">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Redemption Trends + Partner Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Redemption Trends - bar chart */}
          <div className="bg-white rounded-2xl border border-[#F3F4F6] p-5">
            <h2 className="text-sm font-semibold text-[#374151] mb-4">Meal Redemption Trends</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={redemptionTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="redemptions" fill="#A8E6C1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Partner Performance - bar chart */}
          <div className="bg-white rounded-2xl border border-[#F3F4F6] p-5">
            <h2 className="text-sm font-semibold text-[#374151] mb-4">Partner Performance</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={partnerPerformanceData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="partner" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="redemptions" fill="#CDEFD9" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Overview - line chart */}
        <div className="bg-white rounded-2xl border border-[#F3F4F6] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#374151]">Revenue Overview</h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#E8F8F1', color: '#4CAF7D' }}>+18% vs last period</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => `RM ${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`RM ${v.toLocaleString()}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#3ECBA0" strokeWidth={2.5} dot={{ fill: '#3ECBA0', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AdminLayout>
  );
}

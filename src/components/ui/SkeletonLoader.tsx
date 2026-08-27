'use client';

import React from 'react';

/* ── Base shimmer block ── */
function Bone({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-lg bg-[#E8F7EF] relative overflow-hidden ${className}`}
      style={{
        backgroundImage: 'linear-gradient(90deg, #E8F7EF 25%, #CDEFD9 50%, #E8F7EF 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s linear infinite',
      }}
    />
  );
}

/* ── KPI Card Skeleton ── */
export function KpiCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Bone className="h-3 w-24" />
        <Bone className="h-8 w-8 rounded-xl" />
      </div>
      <Bone className="h-7 w-32" />
      <Bone className="h-3 w-20" />
    </div>
  );
}

/* ── Meal Card Skeleton ── */
export function MealCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
      <Bone className="h-44 w-full rounded-none" />
      <div className="p-4 space-y-2.5">
        <Bone className="h-4 w-3/4" />
        <Bone className="h-3 w-1/2" />
        <div className="flex items-center justify-between pt-1">
          <Bone className="h-5 w-16" />
          <Bone className="h-8 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/* ── Table Row Skeleton ── */
export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Bone className={`h-4 ${i === 0 ? 'w-24' : i === cols - 1 ? 'w-16' : 'w-32'}`} />
        </td>
      ))}
    </tr>
  );
}

/* ── Table Skeleton ── */
export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
      <div className="px-6 py-4 border-b border-[#F3F4F6] flex items-center gap-4">
        <Bone className="h-4 w-32" />
        <Bone className="h-4 w-20 ml-auto" />
      </div>
      <table className="w-full">
        <thead>
          <tr className="bg-[#F9FAFB]">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-6 py-3">
                <Bone className="h-3 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F3F4F6]">
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Chart Skeleton ── */
export function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="space-y-2">
          <Bone className="h-4 w-40" />
          <Bone className="h-3 w-28" />
        </div>
      </div>
      <Bone className={`w-full rounded-xl`} style={{ height }} />
    </div>
  );
}

/* ── Dashboard Page Skeleton ── */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="space-y-2">
        <Bone className="h-6 w-56" />
        <Bone className="h-4 w-40" />
      </div>
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <KpiCardSkeleton key={i} />)}
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );
}

/* ── Meals Page Skeleton ── */
export function MealsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Bone className="h-6 w-32" />
        <Bone className="h-10 w-28 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <MealCardSkeleton key={i} />)}
      </div>
    </div>
  );
}

/* ── Meal Detail Skeleton ── */
export function MealDetailSkeleton() {
  return (
    <div className="space-y-6 max-w-2xl">
      <Bone className="h-64 w-full rounded-2xl" />
      <div className="space-y-3">
        <Bone className="h-7 w-2/3" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-5/6" />
        <Bone className="h-4 w-3/4" />
      </div>
      <div className="flex gap-3">
        <Bone className="h-12 flex-1 rounded-xl" />
        <Bone className="h-12 w-32 rounded-xl" />
      </div>
    </div>
  );
}

/* ── Orders Skeleton ── */
export function OrdersSkeleton() {
  return (
    <div className="space-y-6">
      <Bone className="h-6 w-24" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex items-center gap-4">
            <Bone className="h-12 w-12 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Bone className="h-4 w-40" />
              <Bone className="h-3 w-28" />
            </div>
            <Bone className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Wallet Skeleton ── */
export function WalletSkeleton() {
  return (
    <div className="space-y-6">
      <Bone className="h-32 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-4">
        <KpiCardSkeleton />
        <KpiCardSkeleton />
      </div>
      <TableSkeleton rows={5} cols={4} />
    </div>
  );
}

/* ── Partner Dashboard Skeleton ── */
export function PartnerDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Bone className="h-6 w-48" />
        <Bone className="h-4 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <KpiCardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TableSkeleton rows={4} cols={3} />
        <TableSkeleton rows={4} cols={3} />
      </div>
    </div>
  );
}

/* ── Admin Dashboard Skeleton ── */
export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <KpiCardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartSkeleton height={260} />
        </div>
        <ChartSkeleton height={260} />
      </div>
      <TableSkeleton rows={6} cols={5} />
    </div>
  );
}

/* ── Generic page-level skeleton ── */
export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Bone className="h-7 w-48" />
        <Bone className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <KpiCardSkeleton key={i} />)}
      </div>
      <TableSkeleton rows={8} cols={5} />
    </div>
  );
}

/* ── Default export: named variants ── */
export default function SkeletonLoader({ variant }: {
  variant:
    | 'dashboard' |'meals' |'meal-detail' |'orders' |'wallet' |'partner-dashboard' |'admin-dashboard' |'table' |'chart' |'page';
}) {
  switch (variant) {
    case 'dashboard': return <DashboardSkeleton />;
    case 'meals': return <MealsSkeleton />;
    case 'meal-detail': return <MealDetailSkeleton />;
    case 'orders': return <OrdersSkeleton />;
    case 'wallet': return <WalletSkeleton />;
    case 'partner-dashboard': return <PartnerDashboardSkeleton />;
    case 'admin-dashboard': return <AdminDashboardSkeleton />;
    case 'table': return <TableSkeleton />;
    case 'chart': return <ChartSkeleton />;
    default: return <PageSkeleton />;
  }
}

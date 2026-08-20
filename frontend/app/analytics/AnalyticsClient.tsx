"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { CategoryAnalytics, MonthlyAnalytics } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { CategoryChart } from "@/components/analytics/CategoryChart";
import { MonthlyChart } from "@/components/analytics/MonthlyChart";
import { formatINR, formatINRCompact, formatNumber } from "@/lib/format";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { motion } from "framer-motion";

export default function AnalyticsClient() {
  const router = useRouter();
  const [categoryData, setCategoryData] = useState<CategoryAnalytics | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.analytics.category(), api.analytics.monthly()])
      .then(([cat, monthly]) => {
        if (!cancelled) { setCategoryData(cat); setMonthlyData(monthly); setLoading(false); }
      }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const totalSpend = categoryData?.items.reduce((s, c) => s + parseFloat(c.total_amount), 0) ?? 0;
  const topCategory = categoryData?.items.sort((a, b) => parseFloat(b.total_amount) - parseFloat(a.total_amount))[0];

  const handleCategoryClick = (category: string | null) => {
    if (category) router.push(`/transactions?category=${encodeURIComponent(category)}`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="space-y-8 max-w-[1240px] mx-auto px-6 py-8 md:px-10 pb-10"
    >
      <div>
        <h1 className="text-[2.25rem] font-extrabold text-[#181D27] tracking-tight leading-none font-serif">Analytics</h1>
        <p className="text-[#717680] mt-2 text-[14px] font-medium">Deep insights into your spending behaviour.</p>
      </div>

      {/* Summary stats */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-3">
          <SkeletonCard lines={2} /><SkeletonCard lines={2} /><SkeletonCard lines={2} />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-3">
          <Card hoverEffect padding="lg">
            <div className="flex items-start justify-between mb-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#717680]">Total Spend</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100/50">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
            </div>
            <p className="text-[2.25rem] font-black tracking-tighter text-[#181D27]">
              {formatINRCompact(totalSpend)}
            </p>
            <p className="text-[13px] font-medium text-[#A4A7AE] mt-1 tracking-tight">{formatINR(totalSpend)}</p>
          </Card>
          
          <Card hoverEffect padding="lg">
            <div className="flex items-start justify-between mb-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#717680]">Categories</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100/50">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
              </div>
            </div>
            <p className="text-[2.25rem] font-black tracking-tighter text-[#181D27]">
              {formatNumber(categoryData?.total_categories ?? 0)}
            </p>
            <p className="text-[13px] font-medium text-[#A4A7AE] mt-1">Distinct spending areas</p>
          </Card>
          
          <Card hoverEffect padding="lg">
            <div className="flex items-start justify-between mb-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#717680]">Top Category</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 shadow-sm border border-rose-100/50">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
            </div>
            <p className="text-[2.25rem] font-black tracking-tighter text-[#181D27] truncate pr-2">
              {topCategory?.category ?? "—"}
            </p>
            {topCategory && (
              <p className="text-[13px] font-medium text-[#A4A7AE] mt-1">
                <span className="text-rose-600 font-bold">{formatINRCompact(topCategory.total_amount)}</span> spent
              </p>
            )}
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6">
        <Card padding="none">
          <div className="px-6 pt-6 pb-4">
            <h2 className="text-[18px] font-bold text-[#181D27]">Spending by Category</h2>
            <p className="text-[13px] font-medium text-[#717680] mt-1">Click a bar to view transactions in that category</p>
          </div>
          <div className="px-4 pb-4">
            <CategoryChart
              data={categoryData?.items ?? []}
              loading={loading}
              activeCategory={null}
              onCategoryClick={handleCategoryClick}
            />
          </div>
        </Card>

        <Card padding="none">
          <div className="px-6 pt-6 pb-4">
            <h2 className="text-[18px] font-bold text-[#181D27]">Monthly Spending Trend</h2>
            <p className="text-[13px] font-medium text-[#717680] mt-1">Total spend per month across all categories</p>
          </div>
          <div className="px-4 pb-4">
            <MonthlyChart data={monthlyData?.items ?? []} loading={loading} />
          </div>
        </Card>
      </div>
    </motion.div>
  );
}

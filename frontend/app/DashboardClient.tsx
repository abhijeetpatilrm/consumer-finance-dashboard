"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type {
  PaginatedTransactions, TransactionFilters, SortField, SortOrder,
  CategoryAnalytics, MonthlyAnalytics, CoinBalance,
} from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { SkeletonCard, SkeletonTable } from "@/components/ui/Skeleton";
import { CategoryChart } from "@/components/analytics/CategoryChart";
import { MonthlyChart } from "@/components/analytics/MonthlyChart";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { TransactionFilters as FilterPanel } from "@/components/transactions/TransactionFilters";
import { Pagination } from "@/components/transactions/Pagination";
import { TransactionDrawer } from "@/components/transactions/TransactionDrawer";
import { useTransactionDrawer } from "@/components/transactions/useTransactionDrawer";
import { formatINRCompact, formatNumber, formatINR } from "@/lib/format";
import { motion } from "framer-motion";

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_SORT_BY: SortField = "timestamp";
const DEFAULT_SORT_ORDER: SortOrder = "desc";
const CATEGORIES = [
  "Food & Dining","Groceries","Shopping","Entertainment",
  "Health","Education","Travel","Utilities","Fuel","Uncategorized","Insurance",
];

export default function DashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filtersFromURL = useCallback((): TransactionFilters => ({
    page: Number(searchParams.get("page") ?? 1),
    page_size: Number(searchParams.get("page_size") ?? DEFAULT_PAGE_SIZE),
    search: searchParams.get("search") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    status: (searchParams.get("status") as TransactionFilters["status"]) ?? undefined,
    min_amount: searchParams.get("min_amount") ?? undefined,
    max_amount: searchParams.get("max_amount") ?? undefined,
    start_date: searchParams.get("start_date") ?? undefined,
    end_date: searchParams.get("end_date") ?? undefined,
    sort_by: (searchParams.get("sort_by") as SortField) ?? DEFAULT_SORT_BY,
    sort_order: (searchParams.get("sort_order") as SortOrder) ?? DEFAULT_SORT_ORDER,
  }), [searchParams]);

  const [filters, setFilters] = useState<TransactionFilters>(filtersFromURL);
  useEffect(() => { setFilters(filtersFromURL()); }, [searchParams]); // eslint-disable-line

  const pushFilters = useCallback((f: TransactionFilters) => {
    const p = new URLSearchParams();
    if (f.page && f.page > 1) p.set("page", String(f.page));
    if (f.page_size && f.page_size !== DEFAULT_PAGE_SIZE) p.set("page_size", String(f.page_size));
    if (f.search) p.set("search", f.search);
    if (f.category) p.set("category", f.category);
    if (f.status) p.set("status", f.status);
    if (f.min_amount) p.set("min_amount", f.min_amount);
    if (f.max_amount) p.set("max_amount", f.max_amount);
    if (f.start_date) p.set("start_date", f.start_date);
    if (f.end_date) p.set("end_date", f.end_date);
    if (f.sort_by && f.sort_by !== DEFAULT_SORT_BY) p.set("sort_by", f.sort_by);
    if (f.sort_order && f.sort_order !== DEFAULT_SORT_ORDER) p.set("sort_order", f.sort_order);
    router.push(`/?${p.toString()}`, { scroll: false });
  }, [router]);

  const handleFiltersChange = (f: TransactionFilters) => { setFilters(f); pushFilters(f); };
  const handleReset = () => {
    const r: TransactionFilters = { page: 1, page_size: DEFAULT_PAGE_SIZE, sort_by: DEFAULT_SORT_BY, sort_order: DEFAULT_SORT_ORDER };
    setFilters(r);
    router.push("/", { scroll: false });
  };
  const handleSort = (f: SortField) => {
    const o: SortOrder = filters.sort_by === f && filters.sort_order === "asc" ? "desc" : "asc";
    handleFiltersChange({ ...filters, sort_by: f, sort_order: o, page: 1 });
  };

  const [categoryData, setCategoryData] = useState<CategoryAnalytics | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyAnalytics | null>(null);
  const [balance, setBalance] = useState<CoinBalance | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    let c = false;
    Promise.all([api.analytics.category(), api.analytics.monthly(), api.rewards.balance()])
      .then(([cat, mo, bal]) => {
        if (!c) { setCategoryData(cat); setMonthlyData(mo); setBalance(bal); setAnalyticsLoading(false); }
      }).catch(() => { if (!c) setAnalyticsLoading(false); });
    return () => { c = true; };
  }, []);

  const [txnData, setTxnData] = useState<PaginatedTransactions | null>(null);
  const [txnLoading, setTxnLoading] = useState(true);
  const [txnError, setTxnError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setTxnLoading(true); setTxnError(null);
    api.transactions.list(filters).then((d) => {
      if (!ctrl.signal.aborted) { setTxnData(d); setTxnLoading(false); }
    }).catch((e) => {
      if (!ctrl.signal.aborted) { setTxnError(e instanceof Error ? e : new Error(String(e))); setTxnLoading(false); }
    });
    return () => ctrl.abort();
  }, [filters]);

  const { state: drawerState, openTransaction, close: closeDrawer } = useTransactionDrawer();

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const handleCategoryClick = (cat: string | null) => {
    setActiveCategory(cat);
    handleFiltersChange({ ...filters, category: cat ?? undefined, page: 1 });
  };
  useEffect(() => { setActiveCategory(filters.category ?? null); }, []); // eslint-disable-line

  const totalSpend = categoryData
    ? categoryData.items.reduce((s, c) => s + parseFloat(c.total_amount), 0)
    : null;
  
  const formattedDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).replace(/(\d+)(?=[^\d]|$)/, (i) => i + (['st', 'nd', 'rd'][(Number(i) % 10) - 1] || 'th'));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="max-w-[1400px] mx-auto pb-10 flex flex-col gap-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-[#181D27] tracking-tight font-serif">Overview for today</h1>
          <p className="text-[#717680] mt-1 text-[13px] font-medium flex items-center gap-1.5">
            {formattedDate}, a new monthly summary document in your inbox.
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-500"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="flex items-center gap-1.5 h-9 rounded-md border border-[#EAEBF0] bg-white px-3 text-[13px] font-semibold text-[#181D27] hover:bg-[#FAFAFB] shadow-sm transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add
          </button>
          <button className="flex items-center gap-1.5 h-9 rounded-md border border-[#EAEBF0] bg-white px-3 text-[13px] font-semibold text-[#181D27] hover:bg-[#FAFAFB] shadow-sm transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            Re-arrange
          </button>
          <button className="flex items-center justify-center h-9 w-9 rounded-md border border-[#EAEBF0] bg-white text-[#717680] hover:bg-[#FAFAFB] shadow-sm transition-colors ml-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </button>
        </div>
      </div>

      {/* 4 KPIs */}
      {analyticsLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <SkeletonCard lines={2} /><SkeletonCard lines={2} /><SkeletonCard lines={2} /><SkeletonCard lines={2} />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card padding="none" className="p-7 flex flex-col justify-between border-[#EAEBF0] shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[16px]">
            <div>
              <div className="flex items-center gap-2 text-[#717680] mb-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                <span className="text-[13px] font-bold">Total spend</span>
              </div>
              <p className="text-[12px] font-medium text-[#94A3B8] mb-4">All completed transactions</p>
            </div>
            <div>
              <p className="text-[28px] font-extrabold text-[#181D27] tracking-tighter leading-none mb-2">
                ₹{totalSpend !== null ? formatINRCompact(totalSpend).replace("₹", "") : "0"}
              </p>
              <p className="flex items-center gap-1.5 text-[12px] font-bold text-[#059669]">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                Increased 32.12% <span className="text-[#94A3B8] font-medium ml-1">vs last month</span>
              </p>
            </div>
          </Card>

          <Card padding="none" className="p-7 flex flex-col justify-between border-[#EAEBF0] shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[16px]">
            <div>
              <div className="flex items-center gap-2 text-[#717680] mb-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                <span className="text-[13px] font-bold">Transaction volume</span>
              </div>
              <p className="text-[12px] font-medium text-[#94A3B8] mb-4">Total records processed</p>
            </div>
            <div>
              <p className="text-[28px] font-extrabold text-[#181D27] tracking-tighter leading-none mb-2">
                {txnData ? formatNumber(txnData.total) : "0"}
              </p>
              <p className="flex items-center gap-1.5 text-[12px] font-bold text-[#059669]">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                Increased 36.09% <span className="text-[#94A3B8] font-medium ml-1">vs last month</span>
              </p>
            </div>
          </Card>

          <Card padding="none" className="p-7 flex flex-col justify-between border-[#EAEBF0] shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[16px]">
            <div>
              <div className="flex items-center gap-2 text-[#717680] mb-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5c-2.2 0-4 1.8-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                <span className="text-[13px] font-bold">Coin balance</span>
              </div>
              <p className="text-[12px] font-medium text-[#94A3B8] mb-4">Available for redemption</p>
            </div>
            <div>
              <p className="text-[28px] font-extrabold text-[#181D27] tracking-tighter leading-none mb-2">
                {balance ? formatNumber(balance.balance) : "0"}
              </p>
              <p className="flex items-center gap-1.5 text-[12px] font-bold text-[#DC2626]">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="7" y1="7" x2="17" y2="17"/><polyline points="17 7 17 17 7 17"/></svg>
                Decreased 3.88% <span className="text-[#94A3B8] font-medium ml-1">vs last month</span>
              </p>
            </div>
          </Card>

          <Card padding="none" className="p-7 flex flex-col justify-between border-[#EAEBF0] shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[16px]">
            <div>
              <div className="flex items-center gap-2 text-[#717680] mb-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                <span className="text-[13px] font-bold">Distinct categories</span>
              </div>
              <p className="text-[12px] font-medium text-[#94A3B8] mb-4">Active spending categories</p>
            </div>
            <div>
              <p className="text-[28px] font-extrabold text-[#181D27] tracking-tighter leading-none mb-2">
                {categoryData ? formatNumber(categoryData.total_categories) : "0"}
              </p>
              <p className="flex items-center gap-1.5 text-[12px] font-bold text-[#059669]">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                Increased 2.00% <span className="text-[#94A3B8] font-medium ml-1">vs last month</span>
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Main Layout: Left (Charts) & Right (Lists) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        
        {/* Left Column (Spans 2) */}
        <div className="xl:col-span-2 space-y-5 flex flex-col">
          <Card padding="none" className="flex flex-col border-[#EAEBF0] shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[16px] p-7 h-full">
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 text-[#717680] mb-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span className="text-[13px] font-bold">Monthly Trend</span>
                </div>
                <p className="text-[12px] font-medium text-[#94A3B8]">Total spend over time</p>
              </div>
            </div>
            <div className="flex-1 min-h-[300px]">
              <MonthlyChart data={monthlyData?.items ?? []} loading={analyticsLoading} />
            </div>
          </Card>

          <Card padding="none" className="flex flex-col border-[#EAEBF0] shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[16px] p-7">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 text-[#717680] mb-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                  <span className="text-[13px] font-bold">Spending by Category</span>
                </div>
                <p className="text-[12px] font-medium text-[#94A3B8]">Click a bar to filter transactions</p>
              </div>
            </div>
            <div className="flex-1">
              <CategoryChart
                data={categoryData?.items ?? []}
                loading={analyticsLoading}
                activeCategory={activeCategory}
                onCategoryClick={handleCategoryClick}
              />
            </div>
          </Card>
        </div>

        {/* Right Column (Spans 1) */}
        <div className="xl:col-span-1 space-y-5 flex flex-col">
          <Card padding="none" className="flex flex-col border-[#EAEBF0] shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[16px] p-7 h-full">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 text-[#717680] mb-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  <span className="text-[13px] font-bold">Recent Transactions</span>
                </div>
                <p className="text-[12px] font-medium text-[#94A3B8]">Showing latest {Math.min(10, txnData?.items.length || 0)} records</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-2 mt-2 overflow-hidden">
              {txnLoading ? (
                <SkeletonTable rows={10} />
              ) : (
                txnData?.items.slice(0, 10).map((txn) => (
                  <div key={txn.id} className="flex items-center gap-4 py-2 px-2 cursor-pointer hover:bg-[#FAFAFB] rounded-[10px] transition-colors" onClick={() => openTransaction(txn.id)}>
                    <div className="h-10 w-10 rounded-[10px] bg-indigo-600 flex items-center justify-center text-white font-extrabold text-[14px] shrink-0">
                      {txn.merchant.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-extrabold text-[#181D27] leading-none mb-1.5 flex items-baseline justify-between">
                        {formatINR(txn.amount)}
                        <span className={["text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase tracking-widest", txn.status === 'SUCCESS' ? 'text-[#059669] bg-[#059669]/10' : txn.status === 'FAILED' ? 'text-[#DC2626] bg-[#DC2626]/10' : 'text-[#D97706] bg-[#D97706]/10'].join(" ")}>
                          {txn.status === 'SUCCESS' ? 'Completed' : txn.status === 'FAILED' ? 'Failed' : 'On hold'}
                        </span>
                      </p>
                      <p className="text-[12px] font-medium text-[#94A3B8] truncate">{txn.merchant}</p>
                    </div>
                  </div>
                ))
              )}
              
              <Link href="/transactions" className="mt-auto block text-center text-[13px] font-bold text-indigo-600 hover:text-indigo-700 py-3 border-t border-[#EAEBF0] pt-4">
                View all transactions
              </Link>
            </div>
          </Card>
        </div>

      </div>

      <TransactionDrawer
        transaction={drawerState.transaction}
        loading={drawerState.loading}
        error={drawerState.error}
        onClose={closeDrawer}
      />
    </motion.div>
  );
}

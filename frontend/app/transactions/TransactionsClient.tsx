"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import type { PaginatedTransactions, TransactionFilters, SortField, SortOrder } from "@/lib/api";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { TransactionFilters as FilterPanel } from "@/components/transactions/TransactionFilters";
import { Pagination } from "@/components/transactions/Pagination";
import { TransactionDrawer } from "@/components/transactions/TransactionDrawer";
import { useTransactionDrawer } from "@/components/transactions/useTransactionDrawer";
import { motion } from "framer-motion";

const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_SORT_BY: SortField = "timestamp";
const DEFAULT_SORT_ORDER: SortOrder = "desc";

const CATEGORIES = [
  "Food & Dining","Groceries","Shopping","Entertainment",
  "Health","Education","Travel","Utilities","Fuel","Uncategorized","Insurance",
];

export default function TransactionsClient() {
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
    router.push(`/transactions?${p.toString()}`, { scroll: false });
  }, [router]);

  const handleFiltersChange = (f: TransactionFilters) => { setFilters(f); pushFilters(f); };
  const handleReset = () => {
    const r: TransactionFilters = { page: 1, page_size: filters.page_size, sort_by: DEFAULT_SORT_BY, sort_order: DEFAULT_SORT_ORDER };
    setFilters(r);
    router.push("/transactions", { scroll: false });
  };
  const handleSort = (field: SortField) => {
    const order: SortOrder = filters.sort_by === field && filters.sort_order === "asc" ? "desc" : "asc";
    handleFiltersChange({ ...filters, sort_by: field, sort_order: order, page: 1 });
  };

  const [txnData, setTxnData] = useState<PaginatedTransactions | null>(null);
  const [txnLoading, setTxnLoading] = useState(true);
  const [txnError, setTxnError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setTxnLoading(true); setTxnError(null);
    api.transactions.list(filters).then((data) => {
      if (!ctrl.signal.aborted) { setTxnData(data); setTxnLoading(false); }
    }).catch((err) => {
      if (!ctrl.signal.aborted) { setTxnError(err instanceof Error ? err : new Error(String(err))); setTxnLoading(false); }
    });
    return () => ctrl.abort();
  }, [filters]);

  const { state: drawerState, openTransaction, close: closeDrawer } = useTransactionDrawer();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="space-y-6 max-w-[1240px] mx-auto px-6 py-8 md:px-10"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[2.25rem] font-extrabold text-[#181D27] tracking-tight leading-none font-serif">Transactions</h1>
          <p className="text-slate-500 mt-2 text-sm">
            {txnData && !txnLoading
              ? `${txnData.total.toLocaleString("en-IN")} total records found`
              : "View and filter your transactions"}
          </p>
        </div>
      </div>

      <FilterPanel filters={filters} categories={CATEGORIES} onFiltersChange={handleFiltersChange} onReset={handleReset} />

      <TransactionTable
        transactions={txnData?.items ?? []}
        loading={txnLoading}
        error={txnError}
        sortBy={filters.sort_by ?? DEFAULT_SORT_BY}
        sortOrder={filters.sort_order ?? DEFAULT_SORT_ORDER}
        onSort={handleSort}
        onRowClick={openTransaction}
      />

      {txnData && !txnError && (
        <Pagination
          page={filters.page ?? 1}
          totalPages={txnData.total_pages}
          total={txnData.total}
          pageSize={filters.page_size ?? DEFAULT_PAGE_SIZE}
          loading={txnLoading}
          onPageChange={(p) => handleFiltersChange({ ...filters, page: p })}
          onPageSizeChange={(s) => handleFiltersChange({ ...filters, page_size: s, page: 1 })}
        />
      )}

      <TransactionDrawer transaction={drawerState.transaction} loading={drawerState.loading} error={drawerState.error} onClose={closeDrawer} />
    </motion.div>
  );
}

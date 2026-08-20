"use client";

import { useEffect, useRef, useState } from "react";
import type { TransactionFilters, TransactionStatus } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

interface FilterPanelProps {
  filters: TransactionFilters;
  categories: string[];
  onFiltersChange: (filters: TransactionFilters) => void;
  onReset: () => void;
}

const STATUSES: TransactionStatus[] = ["SUCCESS", "FAILED", "PENDING"];
const STATUS_LABELS: Record<TransactionStatus, string> = {
  SUCCESS: "Success",
  FAILED: "Failed",
  PENDING: "Pending",
};

const inputCls = [
  "w-full h-9 rounded-md border border-[#EAEBF0] bg-white px-3",
  "text-[13px] font-medium text-[#181D27] placeholder:text-[#A4A7AE] placeholder:font-normal",
  "focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500",
  "transition-all shadow-sm",
].join(" ");

const selectCls = [
  "w-full h-9 rounded-md border border-[#EAEBF0] bg-white px-3 pr-8",
  "text-[13px] font-medium text-[#181D27] appearance-none cursor-pointer",
  "focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500",
  "transition-all shadow-sm bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23A4A7AE' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")] bg-no-repeat bg-[position:right_8px_center]",
].join(" ");

function FilterLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-bold uppercase tracking-wider text-[#717680] mb-1.5">{children}</p>;
}

export function TransactionFilters({ filters, categories, onFiltersChange, onReset }: FilterPanelProps) {
  const [search, setSearch] = useState(filters.search ?? "");
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Debounced search
  useEffect(() => {
    const id = setTimeout(() => {
      onFiltersChange({ ...filters, search: search || undefined, page: 1 });
    }, 400);
    return () => clearTimeout(id);
  }, [search]); // eslint-disable-line

  // Sync if reset externally
  useEffect(() => {
    if (!filters.search && search) setSearch("");
  }, [filters.search]); // eslint-disable-line

  // Close popover on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); btnRef.current?.focus(); } };
    const onOut = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node) && e.target !== btnRef.current && !btnRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onOut);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onOut); };
  }, [open]);

  const activeCount = [filters.category, filters.status, filters.min_amount, filters.max_amount, filters.start_date, filters.end_date].filter(Boolean).length;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
      <div className="flex flex-wrap items-center gap-2">
        {/* Filters popover trigger */}
        <div className="relative shrink-0">
          <button
            ref={btnRef}
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-haspopup="dialog"
            className={[
              "flex items-center justify-center gap-2 h-9 rounded-md border px-3 text-[13px] font-semibold transition-all focus:outline-none focus:ring-1 focus:ring-indigo-500",
              open || activeCount > 0
                ? "border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm"
                : "border-[#EAEBF0] bg-white text-[#181D27] hover:bg-[#FAFAFB] shadow-sm",
            ].join(" ")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
            Filters
            {activeCount > 0 && (
              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-sm bg-indigo-600 text-white text-[10px] font-bold px-1 shadow-sm">
                {activeCount}
              </span>
            )}
          </button>

          {/* Popover */}
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                ref={popoverRef}
                role="dialog"
                aria-label="Filter options"
                className={[
                  "absolute top-full right-0 sm:left-0 sm:right-auto z-40 mt-2 w-[320px]",
                  "rounded-[12px] border border-[#EAEBF0] bg-white shadow-[0_12px_32px_-8px_rgba(15,23,42,0.15)]",
                  "p-4 space-y-4",
                ].join(" ")}
              >
                {/* Category */}
                <div>
                  <FilterLabel>Category</FilterLabel>
                  <label htmlFor="filter-category" className="sr-only">Category</label>
                  <select id="filter-category" value={filters.category ?? ""}
                    onChange={(e) => onFiltersChange({ ...filters, category: e.target.value || undefined, page: 1 })}
                    className={selectCls}>
                    <option value="">All categories</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <FilterLabel>Status</FilterLabel>
                  <label htmlFor="filter-status" className="sr-only">Status</label>
                  <select id="filter-status" value={filters.status ?? ""}
                    onChange={(e) => onFiltersChange({ ...filters, status: (e.target.value as TransactionStatus) || undefined, page: 1 })}
                    className={selectCls}>
                    <option value="">All statuses</option>
                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>

                {/* Amount range */}
                <div>
                  <FilterLabel>Amount Range (₹)</FilterLabel>
                  <div className="flex gap-2">
                    <input id="filter-min" type="number" placeholder="Min" value={filters.min_amount ?? ""}
                      onChange={(e) => onFiltersChange({ ...filters, min_amount: e.target.value || undefined, page: 1 })}
                      className={inputCls} />
                    <input id="filter-max" type="number" placeholder="Max" value={filters.max_amount ?? ""}
                      onChange={(e) => onFiltersChange({ ...filters, max_amount: e.target.value || undefined, page: 1 })}
                      className={inputCls} />
                  </div>
                </div>

                {/* Date range */}
                <div>
                  <FilterLabel>Date Range</FilterLabel>
                  <div className="flex gap-2">
                    <input id="filter-start" type="date" value={filters.start_date ? filters.start_date.slice(0, 10) : ""}
                      onChange={(e) => onFiltersChange({ ...filters, start_date: e.target.value ? `${e.target.value}T00:00:00Z` : undefined, page: 1 })}
                      className={inputCls} />
                    <input id="filter-end" type="date" value={filters.end_date ? filters.end_date.slice(0, 10) : ""}
                      onChange={(e) => onFiltersChange({ ...filters, end_date: e.target.value ? `${e.target.value}T23:59:59Z` : undefined, page: 1 })}
                      className={inputCls} />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-[#EAEBF0]">
                  <button onClick={() => { setSearch(""); onReset(); setOpen(false); }}
                    className="text-[13px] font-semibold text-[#717680] hover:text-[#181D27] transition-colors px-2 py-1 rounded-md hover:bg-[#FAFAFB]">
                    Clear all
                  </button>
                  <button onClick={() => setOpen(false)}
                    className="h-8 rounded-md bg-indigo-600 px-4 text-[13px] font-bold text-white shadow-sm hover:bg-indigo-700 hover:shadow transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1">
                    Apply
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Active filter chips */}
        {filters.category && (
          <FilterChip label={filters.category} onRemove={() => onFiltersChange({ ...filters, category: undefined, page: 1 })} />
        )}
        {filters.status && (
          <FilterChip label={STATUS_LABELS[filters.status]} onRemove={() => onFiltersChange({ ...filters, status: undefined, page: 1 })} />
        )}
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-64">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A4A7AE] pointer-events-none" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          id="txn-search"
          type="text"
          placeholder="Search anything..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-9 border border-[#EAEBF0] bg-white pr-3 text-[13px] font-medium text-[#181D27] placeholder:text-[#A4A7AE] placeholder:font-normal focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm appearance-none"
          style={{ paddingLeft: '36px', borderRadius: '6px' }}
        />
      </div>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <motion.span 
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 pl-2 pr-1.5 py-1 text-[12px] font-bold text-indigo-700 shadow-sm"
    >
      {label}
      <button onClick={onRemove} className="flex h-4 w-4 items-center justify-center rounded hover:bg-indigo-200/50 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500" aria-label={`Remove ${label} filter`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </motion.span>
  );
}

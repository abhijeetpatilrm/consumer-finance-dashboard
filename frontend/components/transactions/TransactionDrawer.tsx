"use client";

import { useEffect, useRef } from "react";
import { formatINR, formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Transaction } from "@/lib/api";

interface TransactionDrawerProps {
  transaction: Transaction | null;
  loading: boolean;
  error: Error | null;
  onClose: () => void;
}

export function TransactionDrawer({ transaction, loading, error, onClose }: TransactionDrawerProps) {
  const isOpen = loading || error !== null || transaction !== null;
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKeyDown);
    setTimeout(() => closeRef.current?.focus(), 50);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) { document.body.style.overflow = "hidden"; }
    else { document.body.style.overflow = ""; }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" aria-hidden="true" onClick={onClose} />

      <div role="dialog" aria-modal="true" aria-label="Transaction details"
        className="fixed inset-y-0 right-0 z-50 flex w-full flex-col sm:w-[460px] border-l border-[#e5e7eb] bg-white shadow-2xl">

        {/* Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#e5e7eb] px-5">
          <h2 className="text-sm font-semibold text-[#0f172a]">Transaction Details</h2>
          <button ref={closeRef} onClick={onClose} aria-label="Close details panel"
            className="flex h-8 w-8 items-center justify-center rounded-md text-[#6b7280] hover:bg-[#f0f2f5] hover:text-[#0f172a] transition-colors focus-visible:outline-2 focus-visible:outline-indigo-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-6">
          {loading && (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-40" />
                </div>
              ))}
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-400" aria-hidden="true">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-sm font-semibold text-[#0f172a]">Could not load transaction</p>
              <p className="text-xs text-[#9ca3af]">{error.message}</p>
            </div>
          )}

          {transaction && !loading && (
            <dl className="space-y-0">
              {/* Amount hero */}
              <div className="rounded-xl border border-[#e5e7eb] bg-[#f7f8fa] px-5 py-4 mb-5">
                <dt className="text-label mb-1">Amount</dt>
                <dd className={["text-3xl font-bold tracking-tight leading-none", parseFloat(transaction.amount) < 0 ? "text-emerald-700" : "text-[#0f172a]"].join(" ")}>
                  {formatINR(transaction.amount)}
                </dd>
                <dd className="mt-3"><StatusBadge status={transaction.status} /></dd>
              </div>

              {/* Fields */}
              <DrawerField label="Transaction ID" value={transaction.source_id} mono />
              <DrawerField label="Merchant" value={transaction.merchant} />
              <DrawerField label="Category" value={transaction.category} />
              <DrawerField label="Date & Time" value={formatDateTime(transaction.transacted_at)} />
              <DrawerField label="Currency" value={transaction.currency} />
              {transaction.payment_method && <DrawerField label="Payment Method" value={transaction.payment_method} />}
              <DrawerField label="Internal ID" value={`#${transaction.id}`} mono />
            </dl>
          )}
        </div>
      </div>
    </>
  );
}

function DrawerField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#f0f2f5] py-3.5">
      <dt className="text-label shrink-0 mt-0.5">{label}</dt>
      <dd className={["text-sm text-right break-all", mono ? "font-mono text-xs text-[#6b7280]" : "font-medium text-[#0f172a]"].join(" ")}>{value}</dd>
    </div>
  );
}

"use client";

import { formatINR, formatDate, formatTime } from "@/lib/format";
import { SkeletonTable } from "@/components/ui/Skeleton";
import type { Transaction, SortField, SortOrder } from "@/lib/api";
import { motion } from "framer-motion";

interface TransactionTableProps {
  transactions: Transaction[];
  loading: boolean;
  error: Error | null;
  sortBy: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  onRowClick: (id: number) => void;
}

const COLUMNS: { field: SortField; label: string; headerClasses?: string; cellClasses?: string }[] = [
  { field: "timestamp", label: "Date", headerClasses: "pl-8 pr-4", cellClasses: "pl-8 pr-4 whitespace-nowrap" },
  { field: "merchant", label: "Merchant", headerClasses: "px-4", cellClasses: "px-4" },
  { field: "category", label: "Category", headerClasses: "px-4", cellClasses: "px-4" },
  { field: "amount", label: "Amount", headerClasses: "text-right px-8", cellClasses: "text-right px-8" },
  { field: "status", label: "Status", headerClasses: "pl-6 pr-4", cellClasses: "pl-6 pr-4" },
];

function getMerchantColor(name: string) {
  const colors = [
    "bg-[#181D27] text-white", 
    "bg-indigo-600 text-white",
    "bg-emerald-600 text-white", 
    "bg-[#3b82f6] text-white",
  ];
  const char = name.charCodeAt(0) || 0;
  return colors[char % colors.length];
}

function SortIcon({ field, activeField, order }: { field: SortField; activeField: SortField; order: SortOrder }) {
  const active = field === activeField;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"
      className={["transition-colors", active ? "text-indigo-600" : "text-[#A4A7AE] opacity-0 group-hover:opacity-100"].join(" ")}>
      {active && order === "asc"
        ? <path d="M12 5v14M5 12l7-7 7 7" />
        : active && order === "desc"
        ? <path d="M12 19V5M5 12l7 7 7-7" />
        : <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />}
    </svg>
  );
}

function AmountCell({ amount }: { amount: string }) {
  const num = parseFloat(amount);
  return (
    <span className="font-extrabold text-[#181D27] text-[13px] tracking-tight">
      {formatINR(Math.abs(num).toString())}
    </span>
  );
}

export function TransactionTable({ transactions, loading, error, sortBy, sortOrder, onSort, onRowClick }: TransactionTableProps) {
  if (loading) return <SkeletonTable rows={8} />;

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[12px] border border-red-100 bg-red-50 py-16 text-center shadow-sm">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-500" aria-hidden="true">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="text-[13px] font-semibold text-red-700">Failed to load transactions</p>
        <p className="text-[12px] text-red-500">{error.message}</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[12px] border border-[#EAEBF0] bg-white py-16 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#A4A7AE]" aria-hidden="true">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        <p className="text-[13px] font-semibold text-[#535862]">No transactions found</p>
        <p className="text-[12px] text-[#A4A7AE]">Try adjusting your filters or date range.</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-[12px] border border-[#EAEBF0] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)] md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#EAEBF0]">
                {COLUMNS.map(({ field, label, headerClasses }) => (
                  <th key={field} scope="col"
                    className={["py-4 text-[11px] font-bold uppercase tracking-wider text-[#A4A7AE] select-none whitespace-nowrap", headerClasses].join(" ")}>
                    <button onClick={() => onSort(field)}
                      className={["group inline-flex items-center gap-1.5 hover:text-[#181D27] transition-colors", sortBy === field ? "text-[#181D27]" : "", headerClasses?.includes("text-right") ? "flex-row-reverse w-full justify-start" : ""].join(" ")}>
                      {label}
                      <SortIcon field={field} activeField={sortBy} order={sortOrder} />
                    </button>
                  </th>
                ))}
                <th scope="col" className="px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-[#A4A7AE] whitespace-nowrap">Payment</th>
                <th scope="col" className="pl-4 pr-8 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-[#A4A7AE] whitespace-nowrap">TXN ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEBF0]/60">
              {transactions.map((txn, idx) => (
                <motion.tr 
                  key={txn.id} 
                  initial={{ opacity: 0, y: 5 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: idx * 0.03, duration: 0.2 }}
                  onClick={() => onRowClick(txn.id)} tabIndex={0} role="button"
                  className="group cursor-pointer transition-colors hover:bg-[#FAFAFB] focus-visible:outline-none focus-visible:bg-indigo-50/60"
                >
                  <td className="py-5 pl-8 pr-4 whitespace-nowrap">
                    <div className="text-[13px] font-bold text-[#181D27]">{formatDate(txn.transacted_at)}</div>
                    <div className="text-[11px] font-medium text-[#717680] mt-0.5">{formatTime(txn.transacted_at)}</div>
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-[8px] text-[12px] font-extrabold shrink-0 ${getMerchantColor(txn.merchant)}`}>
                        {txn.merchant.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-[13px] font-bold text-[#181D27]">{txn.merchant}</div>
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <span className="text-[13px] font-medium text-[#535862] whitespace-nowrap">
                      {txn.category}
                    </span>
                  </td>
                  <td className="py-5 px-8 text-right">
                    <AmountCell amount={txn.amount} />
                  </td>
                  <td className="py-5 pl-6 pr-4">
                    <span className={["text-[10px] px-2 py-0.5 rounded font-extrabold uppercase tracking-widest whitespace-nowrap", txn.status === 'SUCCESS' ? 'text-[#059669] bg-[#059669]/10' : txn.status === 'FAILED' ? 'text-[#DC2626] bg-[#DC2626]/10' : 'text-[#D97706] bg-[#D97706]/10'].join(" ")}>
                      {txn.status === 'SUCCESS' ? 'Completed' : txn.status === 'FAILED' ? 'Failed' : 'On hold'}
                    </span>
                  </td>
                  <td className="px-4 py-5 text-[13px] font-medium text-[#717680] whitespace-nowrap">
                    {txn.payment_method ?? "—"}
                  </td>
                  <td className="pl-4 pr-8 py-5 text-right text-[11px] font-medium text-[#A4A7AE] whitespace-nowrap">
                    {txn.source_id.slice(-8)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {transactions.map((txn, idx) => (
          <motion.button 
            key={txn.id} 
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}
            onClick={() => onRowClick(txn.id)}
            className="w-full rounded-[12px] border border-[#EAEBF0] bg-white p-4 text-left shadow-sm hover:border-indigo-200 transition-all focus-visible:outline-2 focus-visible:outline-indigo-500 active:scale-[0.98]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`flex h-10 w-10 items-center justify-center rounded-[8px] text-[13px] font-extrabold shrink-0 ${getMerchantColor(txn.merchant)}`}>
                  {txn.merchant.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold text-[#181D27] text-[14px]">{txn.merchant}</p>
                  <p className="text-[12px] font-medium text-[#717680] mt-0.5">{formatDate(txn.transacted_at)}</p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <AmountCell amount={txn.amount} />
                <div className="mt-1.5">
                  <span className={["text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase tracking-widest", txn.status === 'SUCCESS' ? 'text-[#059669] bg-[#059669]/10' : txn.status === 'FAILED' ? 'text-[#DC2626] bg-[#DC2626]/10' : 'text-[#D97706] bg-[#D97706]/10'].join(" ")}>
                    {txn.status === 'SUCCESS' ? 'Completed' : txn.status === 'FAILED' ? 'Failed' : 'On hold'}
                  </span>
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </>
  );
}

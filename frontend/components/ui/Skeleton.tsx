"use client";

import { motion } from "framer-motion";

interface SkeletonProps { className?: string; }

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      className={`rounded bg-slate-100 ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 border-b border-[#f1f5f9] px-4 py-4">
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="h-3.5 w-36 flex-1" />
      <Skeleton className="h-3.5 w-20" />
      <Skeleton className="h-3.5 w-20" />
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  );
}

export function SkeletonCard({ lines = 2 }: { lines?: number }) {
  return (
    <div className="rounded-[16px] border border-[#f1f5f9] bg-white p-6 shadow-[0_8px_24px_-4px_rgba(15,23,42,0.04)]">
      <Skeleton className="mb-4 h-3 w-20" />
      <Skeleton className="mb-3 h-8 w-32" />
      {lines > 1 && <Skeleton className="h-3 w-24" />}
    </div>
  );
}

export function SkeletonTable({ rows = 8 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-[16px] border border-[#f1f5f9] bg-white shadow-[0_8px_24px_-4px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-4 border-b border-[#f1f5f9] bg-[#fafafa] px-4 py-3.5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 flex-1" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-14" />
      </div>
      {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} />)}
    </div>
  );
}

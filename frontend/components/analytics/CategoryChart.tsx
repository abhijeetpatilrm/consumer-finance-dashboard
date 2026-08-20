"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList, CartesianGrid,
} from "recharts";
import { formatINR, formatINRCompact } from "@/lib/format";
import type { CategorySpend } from "@/lib/api";
import { motion } from "framer-motion";

interface CategoryChartProps {
  data: CategorySpend[];
  loading: boolean;
  activeCategory: string | null;
  onCategoryClick: (category: string | null) => void;
}

const PALETTE = [
  "#4f46e5","#6366f1","#818cf8","#a5b4fc","#c7d2fe",
  "#e0e7ff","#4338ca","#3730a3","#312e81","#1e1b4b","#111827",
];

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: CategorySpend & { pct: number } }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[12px] border border-[#f1f5f9] bg-white/90 backdrop-blur-md px-4 py-3 shadow-[0_8px_24px_-4px_rgba(15,23,42,0.08)]"
    >
      <p className="font-semibold text-slate-700 text-sm">{d.category}</p>
      <p className="text-slate-900 font-bold text-lg mt-0.5 tracking-tight">{formatINR(d.total_amount)}</p>
      <div className="flex items-center justify-between gap-6 mt-2 pt-2 border-t border-slate-100">
        <span className="text-slate-500 text-xs">{d.transaction_count.toLocaleString("en-IN")} txns</span>
        <span className="text-indigo-600 text-xs font-bold bg-indigo-50 px-1.5 py-0.5 rounded">{d.pct.toFixed(1)}%</span>
      </div>
    </motion.div>
  );
}

function ChartSkeleton() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex h-[220px] items-end gap-3 px-2 pb-6 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
      {[70, 45, 30, 60, 20, 38, 55, 25, 42, 15].map((h, i) => (
        <div key={i} className="flex-1 rounded-t-md bg-slate-100" style={{ height: `${h}%` }} />
      ))}
    </motion.div>
  );
}

export function CategoryChart({ data, loading, activeCategory, onCategoryClick }: CategoryChartProps) {
  if (loading) return <ChartSkeleton />;
  if (!data.length) {
    return (
      <div className="flex h-[220px] flex-col items-center justify-center rounded-[16px] border border-dashed border-slate-200 bg-slate-50 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-300 mb-2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
        <p className="text-sm font-medium text-slate-400">No category data</p>
      </div>
    );
  }

  const total = data.reduce((s, c) => s + parseFloat(c.total_amount), 0);
  const enriched = data.map((d) => ({
    ...d,
    pct: total > 0 ? (parseFloat(d.total_amount) / total) * 100 : 0,
  }));

  const handleClick = (entry: unknown) => {
    const cat = (entry as { category: string }).category;
    onCategoryClick(activeCategory === cat ? null : cat);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {activeCategory && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="mb-4 flex items-center gap-2 px-1"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 6h16M4 12h10M4 18h6"/></svg>
            {activeCategory}
          </span>
          <button 
            onClick={() => onCategoryClick(null)} 
            className="text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors bg-white px-2 py-1 rounded-full border border-slate-200 shadow-sm hover:shadow"
          >
            Clear filter
          </button>
        </motion.div>
      )}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={enriched} margin={{ top: 20, right: 0, bottom: 20, left: 0 }} barSize={32}>
          <defs>
            <linearGradient id="indigoGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity={1}/>
              <stop offset="100%" stopColor="#4338ca" stopOpacity={0.8}/>
            </linearGradient>
            <linearGradient id="inactiveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e2e8f0" stopOpacity={1}/>
              <stop offset="100%" stopColor="#f1f5f9" stopOpacity={0.8}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="category"
            tickFormatter={(val: string) => val.length > 8 ? val.substring(0, 8) + '…' : val}
            tick={{ fill: "#A4A7AE", fontSize: 11, fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
            interval={0}
            dy={8}
          />
          <YAxis
            tickFormatter={(v: number) => (v === 0 ? "0" : formatINRCompact(v).replace("₹", ""))} 
            tick={{ fill: "#A4A7AE", fontSize: 11, fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
            width={65}
            dx={-10}
            tickCount={5}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
          <Bar 
            dataKey="total_amount" 
            radius={[6, 6, 6, 6]} 
            onClick={handleClick} 
            style={{ cursor: "pointer" }}
            animationDuration={1200}
            animationEasing="ease-out"
          >
            <LabelList
              dataKey="pct"
              position="top"
              formatter={(v: any) => typeof v === "number" && v >= 5 ? `${v.toFixed(0)}%` : ""}
              style={{ fill: "#A4A7AE", fontSize: 10, fontWeight: 700 }}
            />
            {enriched.map((entry) => (
              <Cell
                key={entry.category}
                fill={
                  activeCategory === null || activeCategory === entry.category
                    ? "url(#indigoGradient)"
                    : "url(#inactiveGradient)"
                }
                className="transition-all duration-300 hover:opacity-80"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

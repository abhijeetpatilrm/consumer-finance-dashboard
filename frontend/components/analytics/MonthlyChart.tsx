"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { formatINRCompact, formatINR } from "@/lib/format";
import type { MonthlySpend } from "@/lib/api";
import { motion } from "framer-motion";

interface MonthlyChartProps {
  data: MonthlySpend[];
  loading: boolean;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  
  return (
    <div className="rounded-[8px] bg-white px-4 py-3 shadow-[0_4px_16px_rgba(0,0,0,0.1)] border border-[#EAEBF0]">
      <p className="font-bold text-[#181D27] text-[12px] mb-2">{d.month_label} 2026</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600"></span>
            <span className="text-[12px] font-semibold text-[#717680]">Total Spend</span>
          </div>
          <span className="text-[12px] font-bold text-[#181D27]">{formatINR(d.total_amount)}</span>
        </div>
      </div>
    </div>
  );
}

export function MonthlyChart({ data, loading }: MonthlyChartProps) {
  if (loading) return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
      className="h-[300px] rounded-[16px] bg-[#FAFAFB] relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
    </motion.div>
  );

  if (!data.length) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center rounded-[16px] border border-dashed border-[#EAEBF0] bg-[#FAFAFB] text-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#A4A7AE] mb-2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        <p className="text-[13px] font-semibold text-[#A4A7AE]">No monthly data</p>
      </div>
    );
  }

  const enrichedData = data.map(d => ({
    ...d,
    val: parseFloat(d.total_amount),
    short_month: d.month_label.substring(0, 3)
  }));

  // Identify the month with the max spend to highlight it
  const maxSpend = Math.max(...enrichedData.map(d => d.val));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="h-full w-full"
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={enrichedData} margin={{ top: 10, right: 0, bottom: 20, left: 0 }} barSize={36}>
          <defs>
            <linearGradient id="monthlyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity={1}/>
              <stop offset="100%" stopColor="#4338ca" stopOpacity={0.8}/>
            </linearGradient>
            <linearGradient id="monthlyInactive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e2e8f0" stopOpacity={1}/>
              <stop offset="100%" stopColor="#f1f5f9" stopOpacity={0.8}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="short_month" 
            tick={{ fill: "#A4A7AE", fontSize: 12, fontWeight: 600 }} 
            tickLine={false} 
            axisLine={false} 
            dy={10}
          />
          <YAxis 
            tickFormatter={(v: number) => (v === 0 ? "0" : formatINRCompact(v).replace("₹", ""))} 
            tick={{ fill: "#A4A7AE", fontSize: 12, fontWeight: 600 }} 
            tickLine={false} 
            axisLine={false} 
            width={65} 
            dx={-10}
            tickCount={5}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
          <Bar 
            dataKey="val" 
            radius={[6, 6, 6, 6]}
            animationDuration={1200}
            animationEasing="ease-out"
          >
            {enrichedData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.val === maxSpend ? "url(#monthlyGradient)" : "url(#monthlyInactive)"} 
                className="transition-all duration-300 hover:opacity-80"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

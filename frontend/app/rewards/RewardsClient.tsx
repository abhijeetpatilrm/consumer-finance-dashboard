"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { CoinBalance, RewardItem, RewardCatalogue } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { motion } from "framer-motion";

export default function RewardsClient() {
  const [balance, setBalance] = useState<CoinBalance | null>(null);
  const [catalogue, setCatalogue] = useState<RewardCatalogue | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true); setError(null);
      const [bal, cat] = await Promise.all([api.rewards.balance(), api.rewards.catalogue()]);
      setBalance(bal); setCatalogue(cat);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rewards");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRedeem = async (reward: RewardItem) => {
    if (!balance) return;
    if (balance.balance < reward.cost_coins) {
      setError(`Insufficient balance. You need ${formatNumber(reward.cost_coins)} coins but only have ${formatNumber(balance.balance)}.`);
      setSuccessMsg(null);
      return;
    }
    try {
      setRedeemingId(reward.id); setError(null); setSuccessMsg(null);
      await api.rewards.redeem({ user_id: 1, reward_id: reward.id });
      setSuccessMsg(`Successfully redeemed "${reward.name}"!`);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Redemption failed. Please try again.");
    } finally {
      setRedeemingId(null);
    }
  };

  const currentBalance = balance?.balance ?? 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="max-w-[1400px] mx-auto pb-10 flex flex-col gap-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-[#181D27] tracking-tight font-serif">Rewards Marketplace</h1>
          <p className="text-[#717680] mt-1 text-[13px] font-medium flex items-center gap-1.5">
            Redeem your hard-earned coins for exclusive benefits.
          </p>
        </div>
        
        {/* Minimalist Balance Pill */}
        <div className="flex items-center gap-3 shrink-0 bg-white border border-[#EAEBF0] rounded-[12px] px-4 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-50 text-indigo-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#717680] uppercase tracking-wider leading-none mb-1">Available Coins</p>
            <p className="text-[18px] font-extrabold text-[#181D27] leading-none tracking-tight">
              {loading ? "—" : formatNumber(currentBalance)}
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="rounded-[12px] border border-red-100 bg-red-50 p-4 flex items-start gap-3 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mt-0.5 shrink-0 text-red-500"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p className="text-[13px] font-semibold text-red-700">{error}</p>
        </motion.div>
      )}
      {successMsg && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="rounded-[12px] border border-emerald-100 bg-emerald-50 p-4 flex items-start gap-3 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mt-0.5 shrink-0 text-emerald-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <p className="text-[13px] font-semibold text-emerald-700">{successMsg}</p>
        </motion.div>
      )}

      {/* Catalogue */}
      {loading && !catalogue ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[200px] rounded-[12px] border border-[#EAEBF0] bg-white animate-pulse" />
          ))}
        </div>
      ) : !catalogue?.items.filter((r) => r.is_active).length ? (
        <div className="flex flex-col items-center justify-center rounded-[12px] border border-dashed border-[#EAEBF0] bg-[#FAFAFB] py-32 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#A4A7AE] mb-4"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <p className="text-[14px] font-bold text-[#535862]">No rewards available</p>
          <p className="text-[13px] font-medium text-[#A4A7AE] mt-1">Check back later for exciting offers</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {catalogue?.items.map((reward, idx) => {
            if (!reward.is_active) return null;
            const canAfford = currentBalance >= reward.cost_coins;
            const isRedeeming = redeemingId === reward.id;

            return (
              <motion.div 
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05, duration: 0.3 }}
                key={reward.id}
                className={["flex flex-col rounded-[12px] bg-white border p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-300",
                  canAfford ? "border-[#EAEBF0] hover:border-indigo-200" : "border-[#EAEBF0] opacity-60 grayscale-[0.2]"
                ].join(" ")}
              >
                {/* Minimalist Icon */}
                <div className="flex items-center justify-center h-12 w-12 rounded-[8px] bg-[#FAFAFB] border border-[#EAEBF0] mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={canAfford ? 'text-indigo-600' : 'text-[#A4A7AE]'}>
                    <rect x="3" y="8" width="18" height="12" rx="2"/><path d="M12 8v12"/><path d="M19 12H5"/><path d="M16 8c0-2.2-1.8-4-4-4S8 5.8 8 8"/>
                  </svg>
                </div>

                <div className="flex flex-col flex-1">
                  <h3 className="font-bold text-[#181D27] text-[15px] leading-tight mb-1">{reward.name}</h3>
                  {reward.description && (
                    <p className="text-[13px] font-medium text-[#717680] line-clamp-2 mb-4">{reward.description}</p>
                  )}
                  
                  <div className="mt-auto pt-4 border-t border-[#EAEBF0]">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#717680]">Cost</span>
                      <div className="flex items-center gap-1">
                        <span className={`text-[16px] font-extrabold tracking-tight ${canAfford ? 'text-[#181D27]' : 'text-[#717680]'}`}>
                          {formatNumber(reward.cost_coins)}
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={canAfford ? 'text-indigo-500' : 'text-[#A4A7AE]'}>
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </div>
                    </div>

                    <button onClick={() => handleRedeem(reward)} disabled={!canAfford || redeemingId !== null || loading}
                      className={["w-full rounded-[6px] h-9 text-[13px] font-bold transition-all flex items-center justify-center gap-2",
                        isRedeeming ? "bg-indigo-500/80 text-white cursor-wait" :
                        canAfford
                          ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                          : "bg-[#FAFAFB] text-[#717680] border border-[#EAEBF0] cursor-not-allowed",
                        redeemingId !== null && !isRedeeming ? "opacity-60 cursor-not-allowed" : ""].join(" ")}>
                      {isRedeeming ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          Redeeming...
                        </>
                      ) : canAfford ? "Redeem" : `Need ${formatNumber(reward.cost_coins - currentBalance)} more`}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

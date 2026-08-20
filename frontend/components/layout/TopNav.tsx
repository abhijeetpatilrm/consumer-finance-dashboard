"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/transactions": "Transactions",
  "/analytics": "Analytics",
  "/rewards": "Rewards",
};

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Transactions", href: "/transactions" },
  { label: "Analytics", href: "/analytics" },
  { label: "Rewards", href: "/rewards" },
];

export function TopNav() {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "Overview";
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <>
      <header className="flex h-20 shrink-0 items-center justify-between border-b border-[#EAEBF0] bg-white px-6 sm:px-8 z-30">
        <div className="flex items-center gap-3">
          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-[#717680] hover:bg-[#F5F5F7] hover:text-[#181D27] transition-colors lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 -ml-2"
            aria-label="Open navigation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          
          <div className="flex items-center gap-2 text-[14px] font-semibold text-[#181D27]">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#A4A7AE] hidden sm:block">
              <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
            </svg>
            <span className="hidden sm:inline-block text-[#A4A7AE] mx-1">/</span>
            {title}
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          {/* Search bar mock */}
          <div className="hidden sm:flex items-center gap-2 h-9 w-64 rounded-md border border-[#EAEBF0] bg-[#FAFAFB] px-3 text-[#A4A7AE]">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <span className="text-[13px] font-medium flex-1">Search anything...</span>
            <span className="flex h-5 items-center justify-center rounded border border-[#EAEBF0] bg-white px-1.5 text-[10px] font-bold text-[#A4A7AE]">⌘K</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button className="flex h-9 w-9 items-center justify-center rounded-md text-[#717680] hover:bg-[#F5F5F7] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-md text-[#717680] hover:bg-[#F5F5F7] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-[#181D27]/40 backdrop-blur-sm lg:hidden" 
              onClick={() => setMobileOpen(false)} 
            />
            <motion.nav 
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-72 flex flex-col border-r border-[#EAEBF0] bg-white shadow-2xl lg:hidden"
            >
              <div className="flex h-20 items-center justify-between border-b border-[#EAEBF0] px-6 bg-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#181D27] text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  </div>
                  <span className="text-[17px] font-bold text-[#181D27]">Firma.</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="rounded-md p-2 text-[#A4A7AE] hover:bg-[#F5F5F7] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
              
              <div className="flex flex-col gap-1 px-4 py-6 flex-1 overflow-y-auto">
                <p className="px-3 pb-3 text-[11px] font-bold uppercase tracking-widest text-[#A4A7AE]">Overview</p>
                {navItems.map((item) => {
                  const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                      className={["flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-colors",
                        isActive ? "bg-[#F5F5F7] text-[#181D27]" : "text-[#535862] hover:bg-[#FAFAFB]"].join(" ")}>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

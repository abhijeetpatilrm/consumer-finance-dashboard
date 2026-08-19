"use client";

import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/transactions": "Transactions",
  "/analytics": "Analytics",
  "/rewards": "Rewards",
};

export function TopNav() {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "FinLens";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6 backdrop-blur-sm">
      {/* Page title (mobile shows here; desktop uses sidebar) */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger — placeholder for Phase 2 mobile nav */}
        <button
          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100 lg:hidden"
          aria-label="Open navigation"
          id="mobile-nav-toggle"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="text-sm font-medium text-slate-300">{title}</span>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        {/* API Status indicator */}
        <div
          className="flex items-center gap-1.5 rounded-full border border-emerald-900 bg-emerald-950 px-2.5 py-1"
          title="Backend API status"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
          <span className="text-[11px] font-medium text-emerald-400">API</span>
        </div>

        {/* Avatar placeholder */}
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white"
          aria-label="User account"
          role="img"
        >
          U
        </div>
      </div>
    </header>
  );
}

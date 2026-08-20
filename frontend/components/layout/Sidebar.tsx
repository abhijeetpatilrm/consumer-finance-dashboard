"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const navItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    label: "Transactions",
    href: "/transactions",
    badge: "41",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/>
      </svg>
    ),
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
      </svg>
    ),
  },
  {
    label: "Rewards",
    href: "/rewards",
    badge: "New",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
      </svg>
    ),
  },
];

const secondaryNav = [
  {
    label: "Settings",
    href: "#",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>
      </svg>
    ),
  },
  {
    label: "Appearance",
    href: "#",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      className="hidden shrink-0 flex-col bg-[#F9FAFB] border-r border-[#EAEBF0] lg:flex relative z-10"
      aria-label="Main navigation"
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-8 flex h-6 w-6 items-center justify-center rounded-full border border-[#EAEBF0] bg-white text-[#717680] hover:text-[#181D27] shadow-sm z-20"
      >
        <motion.svg animate={{ rotate: collapsed ? 180 : 0 }} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </motion.svg>
      </button>

      {/* Brand */}
      <div className="flex h-20 items-center px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#181D27] shrink-0 text-white shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} className="text-lg font-bold text-[#181D27] whitespace-nowrap overflow-hidden">
                Firma.
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {!collapsed && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="px-6 pb-4 overflow-hidden">
            <button className="flex w-full items-center justify-between rounded-[10px] border border-[#EAEBF0] bg-white px-3 py-2 shadow-sm transition-colors hover:bg-gray-50 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
              <div className="flex items-center gap-2.5">
                <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500" />
                <span className="text-[13px] font-bold text-[#181D27]">AMS LLC</span>
                <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-indigo-600">PRO</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#A4A7AE]"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav */}
      <div className="flex-1 px-6 py-6 overflow-y-auto flex flex-col">
        <nav className="flex flex-col gap-5" aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "group relative flex items-center justify-between rounded-[8px] px-3 py-2.5 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 overflow-hidden",
                  isActive
                    ? "bg-[#EAEBF0]/60"
                    : "hover:bg-[#EAEBF0]/40",
                ].join(" ")}
                title={collapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-4">
                  <span className={["shrink-0 transition-colors duration-200", isActive ? "text-[#181D27]" : "text-[#717680] group-hover:text-[#535862]"].join(" ")}>
                    {item.icon}
                  </span>
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} className={["whitespace-nowrap flex-1 text-[14px] leading-none mt-0.5", isActive ? "font-bold text-[#181D27]" : "font-semibold text-[#535862]"].join(" ")}>
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                {!collapsed && item.badge && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={["text-[10px] font-extrabold px-1.5 py-0.5 rounded-full", isActive ? "bg-white text-[#181D27] shadow-sm" : "bg-[#EAEBF0] text-[#717680]"].join(" ")}>
                    {item.badge}
                  </motion.span>
                )}
              </Link>
            );
          })}

        </nav>
      </div>

      {/* Secondary Nav (Pinned to bottom) */}
      <div className="px-6 pt-4 pb-2 border-t border-[#EAEBF0]/50">
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-3">
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#A4A7AE]">Applications</p>
            </motion.div>
          )}
        </AnimatePresence>
        <nav className="flex flex-col gap-3" aria-label="Secondary Navigation">
          {secondaryNav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group relative flex items-center gap-4 rounded-[8px] px-3 py-2.5 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 hover:bg-[#EAEBF0]/40"
              title={collapsed ? item.label : undefined}
            >
              <span className="shrink-0 text-[#717680] group-hover:text-[#535862] transition-colors duration-200">
                {item.icon}
              </span>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} className="whitespace-nowrap flex-1 text-[14px] leading-none mt-0.5 font-semibold text-[#535862]">
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          ))}
        </nav>
      </div>

      {/* Profile area */}
      <div className="p-6">
        <button className="flex w-full items-center gap-3 rounded-[10px] p-2 transition-colors hover:bg-[#EAEBF0]/60 text-left outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 overflow-hidden">
          <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Avatar" className="h-8 w-8 rounded-full object-cover shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.08)]" />
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} className="min-w-0 flex-1 whitespace-nowrap">
                <p className="text-[13px] font-bold text-[#181D27] truncate">John H Lee</p>
                <p className="text-[12px] font-medium text-[#717680] truncate">john@firma.com</p>
              </motion.div>
            )}
          </AnimatePresence>
          {!collapsed && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#A4A7AE] shrink-0"><path d="m6 9 6 6 6-6"/></svg>}
        </button>
      </div>
    </motion.aside>
  );
}

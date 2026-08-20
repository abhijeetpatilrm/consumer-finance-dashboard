"use client";

const PAGE_SIZES = [10, 25, 50, 100];

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  loading?: boolean;
}

export function Pagination({ page, totalPages, total, pageSize, onPageChange, onPageSizeChange, loading = false }: PaginationProps) {
  const start = Math.min((page - 1) * pageSize + 1, total);
  const end = Math.min(page * pageSize, total);

  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  const btnBase = "flex h-8 min-w-[2rem] items-center justify-center rounded-md border text-xs font-medium transition-colors px-2";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-[#6b7280] text-sm">
        {loading ? (
          <span className="animate-pulse text-[#9ca3af]">Loading…</span>
        ) : (
          <>
            <span className="font-semibold text-[#0f172a]">{start.toLocaleString("en-IN")}–{end.toLocaleString("en-IN")}</span>
            {" "}of{" "}
            <span className="font-semibold text-[#0f172a]">{total.toLocaleString("en-IN")}</span>
          </>
        )}
      </p>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-[#6b7280] text-xs">
          Rows
          <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-lg border border-[#e5e7eb] bg-white px-2 py-1.5 text-sm text-[#0f172a] focus:border-indigo-500 focus:outline-none cursor-pointer">
            {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>

        <nav aria-label="Pagination" className="flex items-center gap-1">
          <button onClick={() => onPageChange(page - 1)} disabled={page <= 1 || loading}
            aria-label="Previous page"
            className={[btnBase, "border-[#e5e7eb] bg-white text-[#6b7280] hover:enabled:bg-[#f0f2f5] hover:enabled:text-[#0f172a] disabled:opacity-40 disabled:cursor-not-allowed"].join(" ")}>
            ‹
          </button>

          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`e-${i}`} className="px-1 text-[#9ca3af] text-xs">…</span>
            ) : (
              <button key={p} onClick={() => onPageChange(p as number)} disabled={loading}
                aria-label={`Page ${p}`} aria-current={p === page ? "page" : undefined}
                className={[btnBase, p === page
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-[#e5e7eb] bg-white text-[#6b7280] hover:bg-[#f0f2f5] hover:text-[#0f172a] disabled:cursor-not-allowed"].join(" ")}>
                {p}
              </button>
            )
          )}

          <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages || loading}
            aria-label="Next page"
            className={[btnBase, "border-[#e5e7eb] bg-white text-[#6b7280] hover:enabled:bg-[#f0f2f5] hover:enabled:text-[#0f172a] disabled:opacity-40 disabled:cursor-not-allowed"].join(" ")}>
            ›
          </button>
        </nav>
      </div>
    </div>
  );
}

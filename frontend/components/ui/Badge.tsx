import { HTMLAttributes } from "react";

type BadgeVariant =
  | "success"
  | "error"
  | "warning"
  | "pending"
  | "info"
  | "neutral";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  showDot?: boolean;
}

const variantStyles: Record<BadgeVariant, { bg: string, dot: string }> = {
  success: { bg: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
  error:   { bg: "bg-red-50 text-red-700 border-red-100", dot: "bg-red-500" },
  warning: { bg: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-500" },
  pending: { bg: "bg-slate-50 text-slate-600 border-slate-200", dot: "bg-slate-400" },
  info:    { bg: "bg-indigo-50 text-indigo-700 border-indigo-100", dot: "bg-indigo-500" },
  neutral: { bg: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-500" },
};

export function Badge({
  variant = "neutral",
  showDot = true,
  className = "",
  children,
  ...props
}: BadgeProps) {
  const styles = variantStyles[variant];
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5",
        "text-[11px] font-semibold uppercase tracking-wider",
        styles.bg,
        className,
      ].join(" ")}
      {...props}
    >
      {showDot && (
        <span className="relative flex h-1.5 w-1.5">
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${styles.dot}`}></span>
          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${styles.dot}`}></span>
        </span>
      )}
      {children}
    </span>
  );
}

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
}

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-emerald-950 text-emerald-400 border-emerald-900",
  error:   "bg-red-950 text-red-400 border-red-900",
  warning: "bg-amber-950 text-amber-400 border-amber-900",
  pending: "bg-slate-800 text-slate-400 border-slate-700",
  info:    "bg-indigo-950 text-indigo-400 border-indigo-900",
  neutral: "bg-slate-800 text-slate-300 border-slate-700",
};

export function Badge({
  variant = "neutral",
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-0.5",
        "text-xs font-medium",
        variantStyles[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}

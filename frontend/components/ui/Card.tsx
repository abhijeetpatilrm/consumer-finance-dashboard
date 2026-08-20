"use client";

import { HTMLAttributes } from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface CardProps extends HTMLMotionProps<"div"> {
  padding?: "sm" | "md" | "lg" | "none";
  border?: boolean;
  hoverEffect?: boolean;
}

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({
  padding = "md",
  border = true,
  hoverEffect = false,
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className={[
        "rounded-[16px] bg-white",
        border ? "border border-[#f1f5f9]" : "",
        "shadow-[0_8px_24px_-4px_rgba(15,23,42,0.04),0_4px_10px_-2px_rgba(15,23,42,0.02)]",
        hoverEffect ? "hover:shadow-[0_20px_40px_-8px_rgba(15,23,42,0.08)] hover:-translate-y-1 transition-all duration-300" : "",
        paddingStyles[padding],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </motion.div>
  );
}

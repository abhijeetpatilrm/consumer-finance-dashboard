import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg";
  as?: "div" | "article" | "section";
}

const paddingStyles = {
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function Card({
  padding = "md",
  as: Tag = "div",
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <Tag
      className={[
        "rounded-xl border border-slate-800 bg-slate-900",
        "shadow-[0_1px_3px_0_rgb(0_0_0/0.4)]",
        paddingStyles[padding],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </Tag>
  );
}

import type { HTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

type BadgeVariant = "neutral" | "success" | "warning" | "info";

const variantClass: Record<BadgeVariant, string> = {
  neutral: "border border-slate-200 bg-slate-100 text-slate-700",
  success: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border border-amber-200 bg-amber-50 text-amber-700",
  info: "border border-sky-200 bg-sky-50 text-sky-700",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        variantClass[variant],
        className,
      )}
    />
  );
}

import type { HTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

type SectionContainerVariant = "neutral" | "brand" | "warm" | "success";

const variantClass: Record<SectionContainerVariant, string> = {
  neutral: "border-slate-200 bg-white",
  brand: "border-teal-200 bg-teal-50/55",
  warm: "border-amber-200 bg-amber-50/55",
  success: "border-emerald-200 bg-emerald-50/55",
};

interface SectionContainerProps extends HTMLAttributes<HTMLElement> {
  variant?: SectionContainerVariant;
}

export function SectionContainer({
  variant = "neutral",
  className,
  ...props
}: SectionContainerProps) {
  return (
    <section
      {...props}
      className={cn(
        "rounded-[var(--radius-lg)] border p-5 shadow-[var(--shadow-xs)]",
        variantClass[variant],
        className,
      )}
    />
  );
}

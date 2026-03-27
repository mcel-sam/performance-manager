import type { HTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

type SectionContainerVariant = "neutral" | "brand" | "warm" | "success";

const variantClass: Record<SectionContainerVariant, string> = {
  neutral: "border-[var(--color-shell-border)] bg-[var(--color-surface-default)]",
  brand:
    "border-[color-mix(in_srgb,var(--brand-primary)_18%,white)] bg-[color-mix(in_srgb,var(--brand-primary)_7%,white)]",
  warm:
    "border-[var(--color-status-warning-border)] bg-[var(--color-status-warning-surface)]",
  success:
    "border-[var(--color-status-success-border)] bg-[var(--color-status-success-surface)]",
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

import type { HTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

type BadgeVariant = "neutral" | "success" | "warning" | "info";

const variantClass: Record<BadgeVariant, string> = {
  neutral:
    "border border-[var(--color-badge-neutral-border)] bg-[var(--color-badge-neutral-bg)] text-[var(--color-badge-neutral-text)]",
  success:
    "border border-[var(--color-status-success-border)] bg-[var(--color-status-success-surface)] text-[var(--color-status-success)]",
  warning:
    "border border-[var(--color-status-warning-border)] bg-[var(--color-status-warning-surface)] text-[var(--color-status-warning)]",
  info:
    "border border-[var(--color-status-info-border)] bg-[var(--color-status-info-surface)] text-[var(--color-status-info)]",
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

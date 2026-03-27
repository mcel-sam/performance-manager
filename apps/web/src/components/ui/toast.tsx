import type { HTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

type ToastVariant = "info" | "success" | "warning" | "error";

const variantClass: Record<ToastVariant, string> = {
  info:
    "border-[var(--color-status-info-border)] bg-[var(--color-status-info-surface)] text-[var(--color-status-info)]",
  success:
    "border-[var(--color-status-success-border)] bg-[var(--color-status-success-surface)] text-[var(--color-status-success)]",
  warning:
    "border-[var(--color-status-warning-border)] bg-[var(--color-status-warning-surface)] text-[var(--color-status-warning)]",
  error:
    "border-[var(--color-status-danger-border)] bg-[var(--color-status-danger-surface)] text-[var(--color-status-danger)]",
};

interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  variant?: ToastVariant;
}

export function Toast({ className, variant = "info", ...props }: ToastProps) {
  return (
    <div
      role="status"
      {...props}
      className={cn(
        "rounded-[var(--radius-md)] border px-3 py-2 text-sm",
        variantClass[variant],
        className,
      )}
    />
  );
}

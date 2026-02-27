import type { HTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

type ToastVariant = "info" | "success" | "warning" | "error";

const variantClass: Record<ToastVariant, string> = {
  info: "border-sky-200 bg-sky-50 text-sky-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-rose-200 bg-rose-50 text-rose-900",
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

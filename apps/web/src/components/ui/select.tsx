import type { SelectHTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-default)] px-3 py-2 text-sm text-[var(--color-text-primary)] shadow-[var(--shadow-xs)] outline-none transition focus:border-[var(--color-focus-border)] focus:ring-2 focus:ring-[var(--color-focus-ring)]",
        className,
      )}
    />
  );
}

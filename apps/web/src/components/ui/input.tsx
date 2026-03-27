import type { InputHTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-default)] px-3.5 py-2.5 text-[15px] leading-6 text-[var(--color-text-primary)] shadow-[var(--shadow-xs)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-focus-border)] focus:ring-2 focus:ring-[var(--color-focus-ring)]",
        className,
      )}
    />
  );
}

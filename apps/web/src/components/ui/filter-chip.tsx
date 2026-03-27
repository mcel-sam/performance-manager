import Link from "next/link";
import type { HTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

interface FilterChipProps extends HTMLAttributes<HTMLSpanElement> {
  clearHref?: string;
  clearLabel?: string;
  clearTestId?: string;
}

export function FilterChip({
  children,
  clearHref,
  clearLabel = "Clear filter",
  clearTestId,
  className,
  ...props
}: FilterChipProps) {
  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--brand-primary)_14%,white)] bg-[var(--color-shell-soft-accent)] px-3 py-1 text-xs font-medium text-[var(--color-text-primary)] shadow-[var(--shadow-xs)]",
        className,
      )}
    >
      <span>{children}</span>
      {clearHref ? (
        <Link
          href={clearHref}
          data-testid={clearTestId}
          aria-label={clearLabel}
          className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-surface-default)] text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-default)] hover:text-[var(--brand-primary)]"
        >
          <span aria-hidden="true">×</span>
        </Link>
      ) : null}
    </span>
  );
}

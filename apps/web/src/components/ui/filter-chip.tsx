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
        "inline-flex items-center gap-2 rounded-full border border-teal-200 bg-gradient-to-r from-teal-50 via-sky-50 to-indigo-50 px-3 py-1 text-xs font-medium text-slate-700 shadow-[var(--shadow-xs)]",
        className,
      )}
    >
      <span>{children}</span>
      {clearHref ? (
        <Link
          href={clearHref}
          data-testid={clearTestId}
          aria-label={clearLabel}
          className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/85 text-slate-500 transition hover:bg-white hover:text-slate-900"
        >
          <span aria-hidden="true">×</span>
        </Link>
      ) : null}
    </span>
  );
}

import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/components/ui/cn";

interface PageHeaderProps extends HTMLAttributes<HTMLElement> {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
  metadata?: ReactNode;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  action,
  metadata,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <header
      {...props}
      className={cn(
        "flex flex-wrap items-start justify-between gap-6 rounded-[var(--radius-lg)] border border-teal-200/90 bg-gradient-to-r from-white via-teal-50/55 to-amber-50/35 p-6 shadow-[var(--shadow-sm)] transition-[box-shadow,border-color] duration-200 ease-[var(--ease-standard)] sm:p-7",
        className,
      )}
    >
      <div className="space-y-2">
        {eyebrow ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-700">{eyebrow}</p>
        ) : null}
        <h1 className="text-[1.9rem] font-semibold tracking-tight text-slate-900 md:text-[2.2rem]">{title}</h1>
        {description ? (
          <p className="max-w-3xl text-[0.95rem] leading-7 text-slate-600">{description}</p>
        ) : null}
        {metadata ? <div className="pt-1 text-xs leading-6 text-slate-500">{metadata}</div> : null}
      </div>
      {action ? <div className="pt-1.5">{action}</div> : null}
    </header>
  );
}

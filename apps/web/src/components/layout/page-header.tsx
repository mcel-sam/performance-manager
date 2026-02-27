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
        "flex flex-wrap items-start justify-between gap-4 rounded-[var(--radius-lg)] border border-slate-200 bg-white p-6 shadow-[var(--shadow-sm)]",
        className,
      )}
    >
      <div className="space-y-1">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{eyebrow}</p>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description ? <p className="text-sm text-slate-600">{description}</p> : null}
        {metadata ? <div className="pt-1 text-xs text-slate-500">{metadata}</div> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </header>
  );
}

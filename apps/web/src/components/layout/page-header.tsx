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
        "flex flex-wrap items-start justify-between gap-x-6 gap-y-4 pb-2",
        className,
      )}
    >
      <div className="min-w-0 space-y-2">
        {eyebrow ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-700">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-[1.95rem] font-semibold tracking-[-0.025em] text-slate-900 md:text-[2.35rem]">
          {title}
        </h1>
        {description ? (
          <p className="max-w-3xl text-[0.98rem] leading-7 text-slate-600">{description}</p>
        ) : null}
        {metadata ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-xs leading-6 text-slate-500">
            {metadata}
          </div>
        ) : null}
      </div>
      {action ? <div className="shrink-0 pt-1">{action}</div> : null}
    </header>
  );
}

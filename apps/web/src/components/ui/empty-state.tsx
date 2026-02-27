import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/components/ui/cn";

interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({
  title,
  description,
  action,
  className,
  children,
  ...props
}: EmptyStateProps) {
  return (
    <section
      {...props}
      className={cn(
        "rounded-[var(--radius-lg)] border border-dashed border-slate-300 bg-white p-8 shadow-[var(--shadow-xs)]",
        className,
      )}
    >
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}

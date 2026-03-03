import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/components/ui/cn";

interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
  nextSteps?: string[];
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  nextSteps,
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
      {icon ? (
        <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700">
          {icon}
        </div>
      ) : null}
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      {nextSteps && nextSteps.length > 0 ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-slate-600">
          {nextSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}

import type { FormHTMLAttributes, ReactNode } from "react";

import { cn } from "@/components/ui/cn";

interface FilterBarProps extends FormHTMLAttributes<HTMLFormElement> {
  description?: ReactNode;
  chips?: ReactNode;
}

export function FilterBar({ children, description, chips, className, ...props }: FilterBarProps) {
  return (
    <section className="space-y-3 rounded-[var(--radius-lg)] border border-teal-100 bg-gradient-to-r from-white via-sky-50/30 to-indigo-50/35 p-4 shadow-[var(--shadow-xs)]">
      {description ? <p className="text-sm text-slate-600">{description}</p> : null}
      <form {...props} className={cn("grid gap-4 md:grid-cols-2 xl:grid-cols-7", className)}>
        {children}
      </form>
      {chips ? (
        <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-slate-200 bg-white/70 p-2">
          {chips}
        </div>
      ) : null}
    </section>
  );
}

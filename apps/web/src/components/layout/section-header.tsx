import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/components/ui/cn";

interface SectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function SectionHeader({ title, description, action, className, ...props }: SectionHeaderProps) {
  return (
    <div {...props} className={cn("flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">{title}</h2>
        <div className="mt-1 h-0.5 w-16 rounded-full bg-gradient-to-r from-teal-400 to-amber-300" />
        {description ? <p className="max-w-3xl text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}

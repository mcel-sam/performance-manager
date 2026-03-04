import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/components/ui/cn";

interface SectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function SectionHeader({ title, description, action, className, ...props }: SectionHeaderProps) {
  return (
    <div {...props} className={cn("flex flex-wrap items-start justify-between gap-5", className)}>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h2>
        <div className="mt-1 h-0.5 w-20 rounded-full bg-gradient-to-r from-teal-400 to-amber-300" />
        {description ? <p className="max-w-3xl text-sm leading-7 text-slate-600">{description}</p> : null}
      </div>
      {action ? <div className="pt-1.5">{action}</div> : null}
    </div>
  );
}

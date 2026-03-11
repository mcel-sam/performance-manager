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
        <h2 className="text-[1.35rem] font-semibold tracking-tight text-slate-900">{title}</h2>
        {description ? <p className="max-w-3xl text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {action ? <div className="pt-0.5">{action}</div> : null}
    </div>
  );
}

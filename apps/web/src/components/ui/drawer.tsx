import type { HTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

interface DrawerProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  description?: string;
}

export function Drawer({ title, description, className, children, ...props }: DrawerProps) {
  return (
    <aside
      {...props}
      className={cn(
        "rounded-[var(--radius-lg)] border border-slate-200 bg-white p-4 shadow-[var(--shadow-sm)] transition-[box-shadow,transform,border-color] duration-200 sm:p-5",
        className,
      )}
    >
      {title ? <h2 className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">{title}</h2> : null}
      {description ? <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p> : null}
      <div className={cn(title || description ? "mt-4" : undefined)}>{children}</div>
    </aside>
  );
}

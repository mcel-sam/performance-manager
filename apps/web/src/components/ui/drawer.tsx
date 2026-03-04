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
        "rounded-[var(--radius-lg)] border border-slate-200 bg-white p-5 shadow-[var(--shadow-sm)] transition-[box-shadow,transform,border-color] duration-[var(--transition-slow)] ease-[var(--ease-emphasized)] motion-reduce:transition-none sm:p-6",
        className,
      )}
    >
      {title ? <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2> : null}
      {description ? <p className="mt-1.5 text-sm leading-7 text-slate-600">{description}</p> : null}
      <div className={cn(title || description ? "mt-4" : undefined)}>{children}</div>
    </aside>
  );
}

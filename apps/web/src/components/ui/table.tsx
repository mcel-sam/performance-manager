import type { HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

export function TableWrapper({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("overflow-x-auto", className)} />;
}

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table
      {...props}
      className={cn("min-w-full divide-y divide-[var(--color-table-row-border)] text-sm text-[var(--color-text-muted)] leading-6", className)}
    />
  );
}

export function TableHead({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...props}
      className={cn("px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-neutral-500)]", className)}
    />
  );
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td {...props} className={cn("px-4 py-3.5 align-top text-sm leading-6 text-[var(--color-text-muted)]", className)} />;
}

export function TableHeader({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead {...props} className={cn("bg-[var(--color-table-header-bg)]", className)} />;
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} className={cn("divide-y divide-[var(--color-table-row-border)] bg-[var(--color-surface-default)]", className)} />;
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr {...props} className={cn("transition-colors duration-150 ease-out hover:bg-[var(--color-table-row-hover)]", className)} />;
}

import type { HTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

export interface TabItem {
  value: string;
  label: string;
  disabled?: boolean;
}

interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  tabs: TabItem[];
  value: string;
  onChange: (nextValue: string) => void;
  ariaLabel?: string;
}

export function Tabs({
  tabs,
  value,
  onChange,
  ariaLabel = "Tab list",
  className,
  ...props
}: TabsProps) {
  return (
    <div
      {...props}
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-1",
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === value;

        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => onChange(tab.value)}
            className={cn(
              "rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium transition",
              isActive ? "bg-white text-slate-900 shadow-[var(--shadow-xs)]" : "text-slate-600",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

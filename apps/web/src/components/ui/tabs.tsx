import type { HTMLAttributes, KeyboardEvent } from "react";

import { cn } from "@/components/ui/cn";

export interface TabItem {
  value: string;
  label: string;
  disabled?: boolean;
}

interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  tabs: TabItem[];
  value: string;
  onValueChange: (nextValue: string) => void;
  ariaLabel?: string;
}

export function Tabs({
  tabs,
  value,
  onValueChange,
  ariaLabel = "Tab list",
  className,
  ...props
}: TabsProps) {
  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) {
    if (tabs.length === 0) {
      return;
    }

    let nextIndex = currentIndex;

    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = tabs.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const nextTab = tabs[nextIndex];
    if (nextTab && !nextTab.disabled) {
      onValueChange(nextTab.value);
    }
  }

  return (
    <div
      {...props}
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex max-w-full overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-shell-border)] bg-[var(--surface-muted)] p-1",
        className,
      )}
    >
      {tabs.map((tab, index) => {
        const isActive = tab.value === value;

        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => onValueChange(tab.value)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
            className={cn(
              "shrink-0 rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium leading-6 transition-[background-color,color,box-shadow] duration-[var(--transition-base)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] motion-reduce:transition-none",
              isActive
                ? "bg-[var(--color-surface-default)] text-[var(--color-text-primary)] shadow-[var(--shadow-xs)]"
                : "text-[var(--color-text-muted)]",
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

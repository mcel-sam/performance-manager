"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { useId, useState } from "react";

import { cn } from "@/components/ui/cn";

interface HelpHintProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  children?: ReactNode;
  buttonLabel?: string;
  defaultOpen?: boolean;
}

export function HelpHint({
  label,
  children,
  buttonLabel,
  defaultOpen = false,
  className,
  ...props
}: HelpHintProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const id = useId();
  const labelId = `${id}-label`;
  const panelId = `${id}-panel`;

  return (
    <div
      {...props}
      className={cn(
        "rounded-[var(--radius-md)] border border-slate-200 bg-white/90 shadow-[var(--shadow-xs)]",
        className,
      )}
    >
      <button
        type="button"
        aria-label={buttonLabel ?? `Toggle help for ${label}`}
        aria-describedby={labelId}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((previous) => !previous)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition duration-150 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-inset"
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600"
          >
            i
          </span>
          <span id={labelId} className="truncate text-sm font-medium text-slate-900">
            {label}
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          {isOpen ? "Hide" : "Tips"}
          <svg
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
            className={cn("h-3.5 w-3.5 transition-transform duration-150", isOpen && "rotate-180")}
          >
            <path d="M6.5 8.5L10 12L13.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      <div
        id={panelId}
        role="note"
        aria-hidden={!isOpen}
        className={cn(
          "overflow-hidden transition-[max-height,opacity] duration-200",
          isOpen
            ? "max-h-56 opacity-100"
            : "max-h-0 opacity-0",
        )}
      >
        <div className="mx-3 border-t border-slate-200 px-0 py-3 text-sm leading-6 text-slate-600">
          {children}
        </div>
      </div>
    </div>
  );
}

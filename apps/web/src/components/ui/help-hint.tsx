"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { useId, useState } from "react";

import { cn } from "@/components/ui/cn";

interface HelpHintProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  children: ReactNode;
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
        "rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-3",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p id={labelId} className="text-sm font-medium text-slate-900">
          {label}
        </p>
        <button
          type="button"
          aria-label={buttonLabel ?? `Toggle help for ${label}`}
          aria-describedby={labelId}
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => setIsOpen((previous) => !previous)}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
        >
          <span aria-hidden="true">?</span>
        </button>
      </div>
      <div
        id={panelId}
        role="note"
        hidden={!isOpen}
        className="mt-2 border-t border-slate-200 pt-2 text-xs text-slate-600"
      >
        {children}
      </div>
    </div>
  );
}

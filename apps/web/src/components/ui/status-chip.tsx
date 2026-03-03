import type { HTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

type StatusTone = "neutral" | "success" | "warning" | "info" | "error";

const toneClass: Record<StatusTone, string> = {
  neutral: "border-slate-200 bg-slate-100 text-slate-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
};

interface StatusChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: StatusTone;
}

export function StatusChip({ tone = "neutral", className, ...props }: StatusChipProps) {
  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        toneClass[tone],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full bg-current"
      />
      <span>{props.children}</span>
    </span>
  );
}

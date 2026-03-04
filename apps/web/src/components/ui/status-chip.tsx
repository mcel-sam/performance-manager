import type { CSSProperties, HTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

type StatusTone = "neutral" | "success" | "warning" | "info" | "error";

const toneStyle: Record<StatusTone, CSSProperties> = {
  neutral: {
    color: "var(--status-neutral)",
    borderColor: "color-mix(in srgb, var(--status-neutral) 30%, white)",
    backgroundColor: "color-mix(in srgb, var(--status-neutral) 10%, white)",
  },
  success: {
    color: "var(--status-success)",
    borderColor: "color-mix(in srgb, var(--status-success) 30%, white)",
    backgroundColor: "color-mix(in srgb, var(--status-success) 10%, white)",
  },
  warning: {
    color: "var(--status-warning)",
    borderColor: "color-mix(in srgb, var(--status-warning) 30%, white)",
    backgroundColor: "color-mix(in srgb, var(--status-warning) 10%, white)",
  },
  info: {
    color: "var(--status-info)",
    borderColor: "color-mix(in srgb, var(--status-info) 30%, white)",
    backgroundColor: "color-mix(in srgb, var(--status-info) 10%, white)",
  },
  error: {
    color: "var(--status-error)",
    borderColor: "color-mix(in srgb, var(--status-error) 30%, white)",
    backgroundColor: "color-mix(in srgb, var(--status-error) 10%, white)",
  },
};

interface StatusChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: StatusTone;
}

export function StatusChip({ tone = "neutral", className, style, ...props }: StatusChipProps) {
  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] leading-4 transition-colors duration-150",
        className,
      )}
      style={{ ...toneStyle[tone], ...style }}
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full bg-current"
      />
      <span>{props.children}</span>
    </span>
  );
}

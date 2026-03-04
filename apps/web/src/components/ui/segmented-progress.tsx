import type { CSSProperties, HTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

interface SegmentedProgressSegment {
  key: string;
  label: string;
  value: number;
  color: string;
}

interface SegmentedProgressProps extends HTMLAttributes<HTMLDivElement> {
  segments: SegmentedProgressSegment[];
}

export function SegmentedProgress({ segments, className, ...props }: SegmentedProgressProps) {
  const total = segments.reduce((sum, segment) => sum + Math.max(0, segment.value), 0);

  return (
    <div {...props} className={cn("space-y-3", className)}>
      <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100" role="presentation">
        <div className="flex h-full w-full">
          {segments.map((segment) => {
            const percent = total > 0 ? (Math.max(0, segment.value) / total) * 100 : 0;

            return (
              <div
                key={segment.key}
                style={{ width: `${percent}%`, backgroundColor: segment.color } as CSSProperties}
                title={`${segment.label}: ${segment.value}`}
              />
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700">
        {segments.map((segment) => (
          <span key={`${segment.key}-legend`} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <span>{segment.label}</span>
            <span className="text-slate-500">{segment.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

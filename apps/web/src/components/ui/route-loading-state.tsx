import type { HTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";
import { Skeleton } from "@/components/ui/skeleton";

interface RouteLoadingStateProps extends HTMLAttributes<HTMLDivElement> {
  skeletonHeights?: string[];
  maxWidthClassName?: string;
}

const defaultSkeletonHeights = ["h-24", "h-[420px]"];

export function RouteLoadingState({
  skeletonHeights = defaultSkeletonHeights,
  maxWidthClassName = "max-w-6xl",
  className,
  ...props
}: RouteLoadingStateProps) {
  return (
    <div
      {...props}
      aria-busy="true"
      className={cn("mx-auto flex w-full flex-col gap-4", maxWidthClassName, className)}
    >
      {skeletonHeights.map((heightClass, index) => (
        <Skeleton
          key={`route-loading-skeleton-${index}`}
          className={cn(
            heightClass,
            "rounded-[var(--radius-lg)] border border-slate-200 bg-white",
          )}
        />
      ))}
    </div>
  );
}


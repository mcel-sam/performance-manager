import type { HTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      aria-hidden="true"
      className={cn("pm-skeleton-shimmer rounded-md", className)}
    />
  );
}

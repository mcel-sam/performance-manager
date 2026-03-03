import type { HTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

type IconBadgeTone = "brand" | "warm" | "success" | "info";

const toneClass: Record<IconBadgeTone, string> = {
  brand: "bg-teal-100 text-teal-800",
  warm: "bg-amber-100 text-amber-800",
  success: "bg-emerald-100 text-emerald-800",
  info: "bg-sky-100 text-sky-800",
};

interface IconBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: IconBadgeTone;
}

export function IconBadge({ tone = "brand", className, ...props }: IconBadgeProps) {
  return (
    <span
      {...props}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
        toneClass[tone],
        className,
      )}
    />
  );
}

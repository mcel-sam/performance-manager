import type { HTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

interface AvatarItem {
  id: string;
  label: string;
}

interface AvatarsStackProps extends HTMLAttributes<HTMLDivElement> {
  items: AvatarItem[];
  maxVisible?: number;
}

export function AvatarsStack({ items, maxVisible = 4, className, ...props }: AvatarsStackProps) {
  const visibleItems = items.slice(0, maxVisible);
  const remainingCount = Math.max(0, items.length - visibleItems.length);

  return (
    <div {...props} className={cn("inline-flex items-center", className)}>
      {visibleItems.map((item, index) => (
        <span
          key={item.id}
          title={item.label}
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[10px] font-semibold uppercase text-slate-700",
            index > 0 && "-ml-2",
          )}
          aria-label={item.label}
        >
          {toInitials(item.label)}
        </span>
      ))}
      {remainingCount > 0 ? (
        <span className="-ml-2 inline-flex h-7 min-w-7 items-center justify-center rounded-full border-2 border-white bg-slate-900 px-1 text-[10px] font-semibold text-white">
          +{remainingCount}
        </span>
      ) : null}
    </div>
  );
}

function toInitials(label: string): string {
  const parts = label
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

import type { HTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";
import { ProfileAvatar } from "@/components/ui/profile-avatar";

interface AvatarItem {
  id: string;
  label: string;
  avatarUrl?: string | null;
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
        <ProfileAvatar
          key={item.id}
          name={item.label}
          imageUrl={item.avatarUrl}
          title={item.label}
          size="sm"
          className={cn(
            "border-2 border-white text-[10px]",
            index > 0 && "-ml-2",
          )}
        />
      ))}
      {remainingCount > 0 ? (
        <span className="-ml-2 inline-flex h-7 min-w-7 items-center justify-center rounded-full border-2 border-white bg-slate-900 px-1 text-[10px] font-semibold text-white">
          +{remainingCount}
        </span>
      ) : null}
    </div>
  );
}

import Image from "next/image";
import type { CSSProperties, HTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

type ProfileAvatarSize = "sm" | "md" | "lg" | "xl";

const sizeClasses: Record<ProfileAvatarSize, string> = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-xs",
  lg: "h-12 w-12 text-sm",
  xl: "h-14 w-14 text-base",
};

const avatarPalettes = [
  {
    background: "linear-gradient(135deg, #fde68a 0%, #fca5a5 100%)",
    color: "#7c2d12",
  },
  {
    background: "linear-gradient(135deg, #bfdbfe 0%, #a7f3d0 100%)",
    color: "#134e4a",
  },
  {
    background: "linear-gradient(135deg, #ddd6fe 0%, #fbcfe8 100%)",
    color: "#6b21a8",
  },
  {
    background: "linear-gradient(135deg, #99f6e4 0%, #bfdbfe 100%)",
    color: "#155e75",
  },
  {
    background: "linear-gradient(135deg, #fecdd3 0%, #fde68a 100%)",
    color: "#9f1239",
  },
  {
    background: "linear-gradient(135deg, #c7d2fe 0%, #bae6fd 100%)",
    color: "#3730a3",
  },
];

interface ProfileAvatarProps extends HTMLAttributes<HTMLSpanElement> {
  name: string;
  imageUrl?: string | null;
  size?: ProfileAvatarSize;
}

export function ProfileAvatar({
  name,
  imageUrl,
  size = "md",
  className,
  style,
  ...props
}: ProfileAvatarProps) {
  const palette = getAvatarPalette(name);

  return (
    <span
      {...props}
      aria-label={name}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/80 font-semibold uppercase tracking-[0.08em] shadow-[var(--shadow-xs)]",
        sizeClasses[size],
        className,
      )}
      style={
        {
          background: palette.background,
          color: palette.color,
          ...style,
        } satisfies CSSProperties
      }
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes={getAvatarSizes(size)}
          className="object-cover"
          loading="lazy"
          draggable={false}
        />
      ) : (
        toInitials(name)
      )}
    </span>
  );
}

function getAvatarPalette(name: string) {
  let hash = 0;

  for (const character of name) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return avatarPalettes[hash % avatarPalettes.length] ?? avatarPalettes[0];
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

function getAvatarSizes(size: ProfileAvatarSize) {
  switch (size) {
    case "sm":
      return "32px";
    case "md":
      return "40px";
    case "lg":
      return "48px";
    case "xl":
      return "56px";
    default:
      return "40px";
  }
}

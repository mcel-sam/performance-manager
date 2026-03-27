import type { HTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

type WorkspacePageWidth = "narrow" | "standard" | "wide" | "full";

const widthClassName: Record<WorkspacePageWidth, string> = {
  narrow: "max-w-[960px]",
  standard: "max-w-[1280px]",
  wide: "max-w-[1440px]",
  full: "max-w-[1600px]",
};

interface WorkspacePageProps extends HTMLAttributes<HTMLDivElement> {
  width?: WorkspacePageWidth;
}

export function WorkspacePage({
  width = "standard",
  className,
  ...props
}: WorkspacePageProps) {
  return (
    <div
      {...props}
      className={cn("mx-auto w-full space-y-6", widthClassName[width], className)}
    />
  );
}

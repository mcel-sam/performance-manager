import type { HTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-shell-border)] bg-[var(--surface)] shadow-[var(--shadow-sm)] transition-[box-shadow,border-color] duration-[var(--transition-base)] ease-[var(--ease-standard)]",
        className,
      )}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn("border-b border-[var(--color-shell-divider)] bg-[var(--color-card-header)] p-5 sm:p-6", className)}
    />
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 {...props} className={cn("text-base font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-lg", className)} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} className={cn("text-sm leading-6 text-[var(--color-text-muted)]", className)} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("p-5 sm:p-6", className)} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn("border-t border-[var(--color-shell-divider)] bg-[var(--color-card-footer)] p-5 sm:p-6", className)}
    />
  );
}

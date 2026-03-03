import type { HTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-[var(--radius-lg)] border border-slate-200 bg-[var(--surface)] shadow-[var(--shadow-sm)] transition-shadow duration-200",
        className,
      )}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn("border-b border-slate-100 bg-slate-50/55 p-4 sm:p-5", className)}
    />
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 {...props} className={cn("text-base font-semibold tracking-tight text-slate-900 sm:text-lg", className)} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} className={cn("text-sm leading-6 text-slate-600", className)} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("p-4 sm:p-5", className)} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn("border-t border-slate-100 bg-slate-50/40 p-4 sm:p-5", className)}
    />
  );
}

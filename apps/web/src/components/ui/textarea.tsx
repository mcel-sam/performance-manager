import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        {...props}
        ref={ref}
        className={cn(
          "w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-default)] px-4 py-3 text-[15px] leading-7 text-[var(--color-text-primary)] shadow-[var(--shadow-xs)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-focus-border)] focus:ring-2 focus:ring-[var(--color-focus-ring)] disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
      />
    );
  },
);

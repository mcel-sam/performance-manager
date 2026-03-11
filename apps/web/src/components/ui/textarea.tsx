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
          "w-full rounded-[var(--radius-md)] border border-slate-300 bg-white px-4 py-3 text-[15px] leading-7 text-slate-900 shadow-[var(--shadow-xs)] outline-none transition placeholder:text-slate-500 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
      />
    );
  },
);

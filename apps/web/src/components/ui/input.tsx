import type { InputHTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-[var(--radius-md)] border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] leading-6 text-slate-900 shadow-[var(--shadow-xs)] outline-none transition placeholder:text-slate-500 focus:border-slate-400 focus:ring-2 focus:ring-slate-200",
        className,
      )}
    />
  );
}

import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger";
type ButtonSize = "sm" | "md";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-strong)] active:translate-y-px",
  secondary: "bg-teal-700 text-white hover:bg-teal-600 active:translate-y-px",
  outline:
    "border border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50 active:translate-y-px",
  danger: "bg-rose-700 text-white hover:bg-rose-600 active:translate-y-px",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm leading-5",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={cn(
        "rounded-[var(--radius-md)] font-medium shadow-[var(--shadow-xs)] transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    />
  );
}

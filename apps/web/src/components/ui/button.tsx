import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger";
type ButtonSize = "sm" | "md";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-strong)] hover:shadow-[var(--shadow-sm)] active:translate-y-px",
  secondary:
    "bg-[var(--brand-secondary)] text-white hover:opacity-92 hover:shadow-[var(--shadow-sm)] active:translate-y-px",
  outline:
    "border border-[var(--color-border-default)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] hover:border-[var(--color-focus-border)] hover:bg-[var(--surface-muted)] hover:shadow-[var(--shadow-sm)] active:translate-y-px",
  danger:
    "bg-[var(--color-status-danger)] text-white hover:opacity-92 hover:shadow-[var(--shadow-sm)] active:translate-y-px",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs leading-5",
  md: "px-4 py-2 text-sm leading-6",
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
        "rounded-[var(--radius-md)] font-medium shadow-[var(--shadow-xs)] transition-[background-color,border-color,color,box-shadow,transform] duration-[var(--transition-base)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    />
  );
}

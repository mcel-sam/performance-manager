import type { HTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  title?: string;
  description?: string;
  onClose?: () => void;
}

export function Modal({
  open,
  title,
  description,
  onClose,
  className,
  children,
  ...props
}: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay-scrim)] p-4">
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "w-full max-w-lg rounded-[var(--radius-lg)] border border-[var(--color-shell-border)] bg-[var(--color-surface-default)] p-5 shadow-[var(--shadow-lg)]",
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            {title ? <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p> : null}
          </div>
          {onClose ? (
            <button
              type="button"
              aria-label="Close dialog"
              onClick={onClose}
              className="rounded-[var(--radius-sm)] px-2 py-1 text-xs font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-shell-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
            >
              Close
            </button>
          ) : null}
        </div>
        <div className={cn(title || description ? "mt-4" : undefined)}>{children}</div>
      </div>
    </div>
  );
}

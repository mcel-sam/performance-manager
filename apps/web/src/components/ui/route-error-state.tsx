"use client";

import type { HTMLAttributes } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";

interface RouteErrorStateProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  error: Error;
  onRetry: () => void;
  retryLabel?: string;
  maxWidthClassName?: string;
}

export function RouteErrorState({
  title,
  description,
  error,
  onRetry,
  retryLabel = "Try again",
  maxWidthClassName = "max-w-3xl",
  className,
  ...props
}: RouteErrorStateProps) {
  const errorMessage = error.message?.trim() || "Unexpected error";

  return (
    <div {...props} className={cn("mx-auto w-full", maxWidthClassName, className)}>
      <Card className="border-[var(--color-status-danger-border)] bg-[var(--color-status-danger-surface)]">
        <CardHeader>
          <CardTitle className="text-[var(--color-status-danger)]">{title}</CardTitle>
          {description ? <CardDescription className="text-[var(--color-status-danger)]">{description}</CardDescription> : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-6 text-[var(--color-status-danger)]">{errorMessage}</p>
          <Button type="button" variant="danger" onClick={onRetry}>
            {retryLabel}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

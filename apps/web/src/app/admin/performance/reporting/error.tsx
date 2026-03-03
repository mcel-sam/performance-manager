"use client";

import { RouteErrorState } from "@/components/ui/route-error-state";

export default function AdminReportingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorState
      title="Unable to load reporting"
      description="We could not load reporting metrics for this cycle. Retry to refresh filters and chart data."
      error={error}
      onRetry={reset}
      retryLabel="Retry"
      maxWidthClassName="max-w-3xl"
      data-testid="admin-reporting-error"
    />
  );
}

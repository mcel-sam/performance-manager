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
      description="We could not load the operational reporting view for this cycle. Retry to refresh the current filters and queue data."
      error={error}
      onRetry={reset}
      retryLabel="Retry"
      maxWidthClassName="max-w-3xl"
      data-testid="admin-reporting-error"
    />
  );
}

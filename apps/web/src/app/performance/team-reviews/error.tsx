"use client";

import { RouteErrorState } from "@/components/ui/route-error-state";

interface TeamReviewsErrorProps {
  error: Error;
  reset: () => void;
}

export default function TeamReviewsError({ error, reset }: TeamReviewsErrorProps) {
  return (
    <RouteErrorState
      title="Unable to load My Team"
      description="Team review data could not be loaded. Retry to refresh direct report statuses."
      error={error}
      onRetry={reset}
      maxWidthClassName="max-w-4xl"
      data-testid="team-reviews-error"
    />
  );
}

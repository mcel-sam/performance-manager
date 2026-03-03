"use client";

import { RouteErrorState } from "@/components/ui/route-error-state";

interface ReviewsErrorProps {
  error: Error;
  reset: () => void;
}

export default function ReviewsError({ error, reset }: ReviewsErrorProps) {
  return (
    <RouteErrorState
      title="Unable to load reviews"
      description="We could not load your assigned review tasks. Retry to refresh cycle and submission data."
      error={error}
      onRetry={reset}
      maxWidthClassName="max-w-3xl"
      data-testid="reviews-error"
    />
  );
}

"use client";

import { RouteErrorState } from "@/components/ui/route-error-state";

interface WriteReviewErrorProps {
  error: Error;
  reset: () => void;
}

export default function WriteReviewError({ error, reset }: WriteReviewErrorProps) {
  return (
    <RouteErrorState
      title="Unable to load review"
      description="This review draft could not be loaded. Retry to restore your writing workspace."
      error={error}
      onRetry={reset}
      maxWidthClassName="max-w-2xl"
      data-testid="write-review-error"
    />
  );
}

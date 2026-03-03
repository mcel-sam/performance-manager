"use client";

import { RouteErrorState } from "@/components/ui/route-error-state";

interface ReviewPacketErrorProps {
  error: Error;
  reset: () => void;
}

export default function ReviewPacketError({ error, reset }: ReviewPacketErrorProps) {
  return (
    <RouteErrorState
      title="Unable to load review packet"
      description="Packet data is unavailable right now. Retry to refresh submissions, answers, and evidence summaries."
      error={error}
      onRetry={reset}
      maxWidthClassName="max-w-4xl"
      data-testid="review-packet-error"
    />
  );
}

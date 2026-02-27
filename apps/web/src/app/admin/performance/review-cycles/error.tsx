"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminReviewCyclesErrorProps {
  error: Error;
  reset: () => void;
}

export default function AdminReviewCyclesError({ error, reset }: AdminReviewCyclesErrorProps) {
  return (
    <Card className="mx-auto w-full max-w-3xl border-rose-200">
      <CardHeader>
        <CardTitle className="text-rose-900">Unable to load review cycles</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-rose-700">{error.message}</p>
        <Button variant="danger" onClick={reset}>
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminReportingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card className="mx-auto w-full max-w-3xl" data-testid="admin-reporting-error">
      <CardHeader>
        <CardTitle>Unable to load reporting</CardTitle>
        <CardDescription>
          We could not load reporting metrics for this cycle. Try again in a moment.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">{error.message || "Unexpected reporting error"}</p>
        <Button onClick={() => reset()}>Retry</Button>
      </CardContent>
    </Card>
  );
}

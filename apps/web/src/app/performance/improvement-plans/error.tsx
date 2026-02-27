"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ImprovementPlansListErrorProps {
  error: Error;
  reset: () => void;
}

export default function ImprovementPlansListError({
  error,
  reset,
}: ImprovementPlansListErrorProps) {
  return (
    <Card className="border-rose-200">
      <CardHeader>
        <CardTitle className="text-rose-900">Unable to load improvement plans</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-rose-700">{error.message}</p>
        <Button type="button" variant="danger" onClick={reset}>
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}

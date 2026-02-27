"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CalibrationSessionErrorProps {
  error: Error;
  reset: () => void;
}

export default function CalibrationSessionError({
  error,
  reset,
}: CalibrationSessionErrorProps) {
  return (
    <Card className="max-w-2xl border-rose-200">
      <CardHeader>
        <CardTitle className="text-rose-900">Unable to load calibration session</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-rose-700">{error.message}</p>
        <Button onClick={reset} variant="danger">
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}

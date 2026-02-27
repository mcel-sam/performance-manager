"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NewCalibrationSessionErrorProps {
  error: Error;
  reset: () => void;
}

export default function NewCalibrationSessionError({
  error,
  reset,
}: NewCalibrationSessionErrorProps) {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle>Unable to load calibration session form</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-700">{error.message}</p>
          <Button variant="outline" onClick={reset}>
            Retry
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

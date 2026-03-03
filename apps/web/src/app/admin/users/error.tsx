"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminUsersErrorProps {
  error: Error;
  reset: () => void;
}

export default function AdminUsersError({ error, reset }: AdminUsersErrorProps) {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle>Unable to load users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-700">{error.message}</p>
          <Button type="button" variant="outline" onClick={reset}>
            Retry
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

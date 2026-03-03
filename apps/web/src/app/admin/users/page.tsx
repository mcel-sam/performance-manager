import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default function AdminUsersPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader
        title="User Management"
        description="Manage roles and reporting structure so review assignments and reporting stay accurate."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">People admin workspace</CardTitle>
          <CardDescription>
            Full create and edit controls ship in Milestone 7 Phase 3. Use the current admin
            tools below to continue setup.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="User CRUD is coming next"
            description="For now, configure cycles and calibration while the dedicated people management controls are being finalized."
            icon={<span aria-hidden="true">🧭</span>}
            action={
              <div className="flex flex-wrap gap-2">
                <Link href="/admin/performance/review-cycles">
                  <Button size="sm" variant="outline">
                    Open review cycles
                  </Button>
                </Link>
                <Link href="/admin/performance/calibration">
                  <Button size="sm" variant="outline">
                    Open calibration admin
                  </Button>
                </Link>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

import Link from "next/link";

import { UserRole } from "@prisma/client";

import ReviewCyclesTable from "@/components/admin/review-cycles-table";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getDevRequestContext } from "@/server/auth/request-context";
import { listReviewCycles } from "@/server/reviews/admin-cycle-service";

export const dynamic = "force-dynamic";

export default async function AdminReviewCyclesPage() {
  const context = await getDevRequestContext();

  if (context.role !== UserRole.HR_ADMIN) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin access required</CardTitle>
          <CardDescription>
            Review cycle management is restricted to HR admins.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-700">
            Set <code>DEV_USER_ID=user_hr_admin_1</code> in <code>apps/web/.env.local</code> and
            restart the dev server.
          </p>
        </CardContent>
      </Card>
    );
  }

  const cycles = await listReviewCycles(context);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <PageHeader
        title="Review Cycles"
        description="Create cycles, generate submissions, and progress cycle states."
        action={
          <Link href="/admin/performance/review-cycles/new">
            <Button>Create Cycle</Button>
          </Link>
        }
      />

      {cycles.length === 0 ? (
        <EmptyState
          title="No review cycles yet"
          description="Start by creating your first cycle for this organization."
          action={
            <Link href="/admin/performance/review-cycles/new">
              <Button>Create first cycle</Button>
            </Link>
          }
        />
      ) : (
        <ReviewCyclesTable cycles={cycles} auth={{ userId: context.userId, orgId: context.orgId }} />
      )}
    </div>
  );
}

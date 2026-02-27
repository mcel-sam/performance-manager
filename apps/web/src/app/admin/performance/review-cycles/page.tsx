import Link from "next/link";

import { UserRole } from "@prisma/client";

import ReviewCyclesTable from "@/components/admin/review-cycles-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Review Cycles</h2>
          <p className="text-sm text-slate-600">
            Create cycles, generate submissions, and progress cycle states.
          </p>
        </div>
        <Link href="/admin/performance/review-cycles/new">
          <Button>Create Cycle</Button>
        </Link>
      </header>

      {cycles.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No review cycles yet</CardTitle>
            <CardDescription>
              Start by creating your first cycle for this organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/performance/review-cycles/new">
              <Button>Create first cycle</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <ReviewCyclesTable cycles={cycles} auth={{ userId: context.userId, orgId: context.orgId }} />
      )}
    </div>
  );
}

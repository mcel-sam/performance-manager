import Link from "next/link";

import { UserRole } from "@prisma/client";

import ReviewCycleCreateForm from "@/components/admin/review-cycle-create-form";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDevRequestContext } from "@/server/auth/request-context";

export const dynamic = "force-dynamic";

export default async function NewAdminReviewCyclePage() {
  const context = await getDevRequestContext();

  if (context.role !== UserRole.HR_ADMIN) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin access required</CardTitle>
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

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <PageHeader
        title="New Review Cycle"
        description="Define timeline and participant review mix."
        action={
          <Link href="/admin/performance/review-cycles">
            <Button variant="outline">Back to cycles</Button>
          </Link>
        }
      />

      <ReviewCycleCreateForm auth={{ userId: context.userId, orgId: context.orgId }} />
    </div>
  );
}

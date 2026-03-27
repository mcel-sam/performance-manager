import Link from "next/link";

import { redirect } from "next/navigation";

import ReviewCycleCreateForm from "@/components/admin/review-cycle-create-form";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { hasHrAdminAccess } from "@/lib/users/role-capabilities";
import { getDevRequestContext } from "@/server/auth/request-context";

export const dynamic = "force-dynamic";

export default async function NewAdminReviewCyclePage() {
  const context = await getDevRequestContext();

  if (!hasHrAdminAccess(context.role)) {
    redirect("/");
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <PageHeader
        title="New Review Cycle"
        description="Define the timeline, visibility, and self/manager review workflow."
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

import Link from "next/link";

import { redirect } from "next/navigation";

import ReviewCyclesTable from "@/components/admin/review-cycles-table";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionContainer } from "@/components/ui/section-container";
import { hasHrAdminAccess } from "@/lib/users/role-capabilities";
import { getDevRequestContext } from "@/server/auth/request-context";
import { listReviewCycles } from "@/server/reviews/admin-cycle-service";

export const dynamic = "force-dynamic";

export default async function AdminReviewCyclesPage() {
  const context = await getDevRequestContext();

  if (!hasHrAdminAccess(context.role)) {
    redirect("/");
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
          icon={<span aria-hidden="true">📆</span>}
          nextSteps={[
            "Define the cycle window and self/manager review timing.",
            "Generate submissions after setup to create participant tasks.",
          ]}
          action={
            <Link href="/admin/performance/review-cycles/new">
              <Button>Create first cycle</Button>
            </Link>
          }
        />
      ) : (
        <SectionContainer variant="warm" className="p-3">
          <ReviewCyclesTable cycles={cycles} auth={{ userId: context.userId, orgId: context.orgId }} />
        </SectionContainer>
      )}
    </div>
  );
}

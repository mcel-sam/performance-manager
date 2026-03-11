import Link from "next/link";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import GrowAssignmentsManager from "@/components/admin/grow-assignments-manager";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getDevRequestContext } from "@/server/auth/request-context";
import { getGrowAdminCatalog, listTrackAssignmentsForAdmin } from "@/server/grow/grow-service";

export const dynamic = "force-dynamic";

export default async function AdminGrowAssignmentsPage() {
  const context = await getDevRequestContext();
  if (context.role !== UserRole.HR_ADMIN) {
    redirect("/");
  }

  const [catalog, assignments] = await Promise.all([
    getGrowAdminCatalog(context),
    listTrackAssignmentsForAdmin(context),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        eyebrow="Grow Admin"
        title="Track assignments"
        description="Assign employees to a track and level now so the later goals and reviews flows inherit the right baseline automatically."
        action={
          <Link href="/admin/grow/tracks">
            <Button variant="outline">Back to tracks</Button>
          </Link>
        }
      />

      {catalog.tracks.length === 0 ? (
        <EmptyState
          title="Create a track before assigning employees"
          description="Assignments depend on at least one track with a level ladder."
          action={
            <Link href="/admin/grow/tracks/new">
              <Button>Create track</Button>
            </Link>
          }
        />
      ) : (
        <GrowAssignmentsManager
          auth={{ userId: context.userId, orgId: context.orgId }}
          employees={catalog.employees}
          tracks={catalog.tracks}
          assignments={assignments}
        />
      )}
    </div>
  );
}

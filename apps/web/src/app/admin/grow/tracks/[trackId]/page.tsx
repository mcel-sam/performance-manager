import Link from "next/link";
import { redirect } from "next/navigation";

import GrowTrackForm from "@/components/admin/grow-track-form";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { hasHrAdminAccess } from "@/lib/users/role-capabilities";
import { getDevRequestContext } from "@/server/auth/request-context";
import { getGrowAdminCatalog, getTrack } from "@/server/grow/grow-service";

export const dynamic = "force-dynamic";

export default async function AdminGrowTrackDetailPage({
  params,
}: {
  params: Promise<{ trackId: string }>;
}) {
  const context = await getDevRequestContext();
  if (!hasHrAdminAccess(context.role)) {
    redirect("/");
  }

  const { trackId } = await params;
  const [catalog, track] = await Promise.all([
    getGrowAdminCatalog(context),
    getTrack(trackId, context),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        eyebrow="Grow Admin"
        title={track.name}
        description="Refine level expectations, publishing status, and group placement before connecting this ladder to employee assignments."
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/grow/assignments">
              <Button variant="outline">Assignments</Button>
            </Link>
            <Link href="/admin/grow/tracks">
              <Button variant="outline">Back to tracks</Button>
            </Link>
          </div>
        }
      />

      <GrowTrackForm
        auth={{ userId: context.userId, orgId: context.orgId }}
        mode="edit"
        trackId={track.id}
        trackGroups={catalog.trackGroups}
        competencies={catalog.competencies}
        initialValues={track}
      />
    </div>
  );
}

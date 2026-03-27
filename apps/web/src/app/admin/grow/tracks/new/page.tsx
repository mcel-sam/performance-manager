import Link from "next/link";
import { redirect } from "next/navigation";

import GrowTrackForm from "@/components/admin/grow-track-form";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasHrAdminAccess } from "@/lib/users/role-capabilities";
import { getDevRequestContext } from "@/server/auth/request-context";
import { getGrowAdminCatalog } from "@/server/grow/grow-service";

export const dynamic = "force-dynamic";

export default async function AdminGrowTrackNewPage() {
  const context = await getDevRequestContext();
  if (!hasHrAdminAccess(context.role)) {
    redirect("/");
  }

  const catalog = await getGrowAdminCatalog(context);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        eyebrow="Grow Admin"
        title="Create track"
        description="Build the track ladder first, then publish it once the competency expectations are ready for employees."
        action={
          <Link href="/admin/grow/tracks">
            <Button variant="outline">Back to tracks</Button>
          </Link>
        }
      />

      {catalog.competencies.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Competencies required</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Seed or create competencies before defining track expectations.
          </CardContent>
        </Card>
      ) : null}

      <GrowTrackForm
        auth={{ userId: context.userId, orgId: context.orgId }}
        mode="create"
        trackGroups={catalog.trackGroups}
        competencies={catalog.competencies}
      />
    </div>
  );
}

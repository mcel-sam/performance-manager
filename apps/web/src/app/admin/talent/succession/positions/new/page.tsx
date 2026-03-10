import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import SuccessionPositionForm from "@/components/succession/succession-position-form";
import { PageHeader } from "@/components/layout/page-header";
import { getDevRequestContext } from "@/server/auth/request-context";
import { getSuccessionFormOptions } from "@/server/succession/succession-service";

export const dynamic = "force-dynamic";

export default async function AdminSuccessionPositionNewPage() {
  const context = await getDevRequestContext();
  if (context.role !== UserRole.HR_ADMIN) {
    redirect("/");
  }

  const options = await getSuccessionFormOptions(context);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Create succession position"
        description="Start a new continuity plan with ownership, scope, and collaborator rules already attached."
      />
      <SuccessionPositionForm
        auth={{ userId: context.userId, orgId: context.orgId }}
        mode="create"
        employees={options.owners}
        managers={options.managers}
      />
    </div>
  );
}

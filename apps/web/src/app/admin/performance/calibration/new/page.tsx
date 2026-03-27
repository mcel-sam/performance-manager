import Link from "next/link";

import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import CalibrationSessionCreateForm from "@/components/admin/calibration-session-create-form";
import { PageHeader } from "@/components/layout/page-header";
import { SectionHeader } from "@/components/layout/section-header";
import { Button } from "@/components/ui/button";
import { getDevRequestContext } from "@/server/auth/request-context";
import { getCalibrationSessionCreateOptions } from "@/server/calibration/calibration-admin-options-service";

export const dynamic = "force-dynamic";

const allowedRoles = new Set<UserRole>([UserRole.HR_ADMIN, UserRole.SUPER_ADMIN]);

export default async function NewAdminCalibrationSessionPage() {
  const context = await getDevRequestContext();

  if (!allowedRoles.has(context.role)) {
    redirect("/");
  }

  const options = await getCalibrationSessionCreateOptions(context);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <PageHeader
        title="New Calibration Session"
        description="Configure cycle, cohort members, axes, and session participants."
        action={
          <Link href="/admin/performance/calibration">
            <Button variant="outline">Back to sessions</Button>
          </Link>
        }
      />

      <SectionHeader
        title="Session configuration"
        description="Set participants, role group, and axis definitions before creating the session."
      />

      <CalibrationSessionCreateForm
        options={options}
        auth={{ userId: context.userId, orgId: context.orgId, role: context.role }}
      />
    </div>
  );
}

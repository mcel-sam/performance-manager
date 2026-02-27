import Link from "next/link";

import { UserRole } from "@prisma/client";

import CalibrationSessionCreateForm from "@/components/admin/calibration-session-create-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDevRequestContext } from "@/server/auth/request-context";
import { getCalibrationSessionCreateOptions } from "@/server/calibration/calibration-admin-options-service";

export const dynamic = "force-dynamic";

const allowedRoles = new Set<UserRole>([UserRole.HR_ADMIN, UserRole.CALIBRATOR]);

export default async function NewAdminCalibrationSessionPage() {
  const context = await getDevRequestContext();

  if (!allowedRoles.has(context.role)) {
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

  const options = await getCalibrationSessionCreateOptions(context);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            New Calibration Session
          </h2>
          <p className="text-sm text-slate-600">
            Configure cycle, cohort members, axes, and session participants.
          </p>
        </div>
        <Link href="/admin/performance/calibration">
          <Button variant="outline">Back to sessions</Button>
        </Link>
      </header>

      <CalibrationSessionCreateForm
        options={options}
        auth={{ userId: context.userId, orgId: context.orgId }}
      />
    </div>
  );
}

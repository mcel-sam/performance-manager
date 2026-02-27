import Link from "next/link";

import { UserRole } from "@prisma/client";

import CalibrationSessionsTable from "@/components/admin/calibration-sessions-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDevRequestContext } from "@/server/auth/request-context";
import { listCalibrationSessions } from "@/server/calibration/calibration-admin-service";

export const dynamic = "force-dynamic";

const allowedRoles = new Set<UserRole>([UserRole.HR_ADMIN, UserRole.CALIBRATOR]);

export default async function AdminCalibrationSessionsPage() {
  const context = await getDevRequestContext();

  if (!allowedRoles.has(context.role)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin access required</CardTitle>
          <CardDescription>
            Calibration session management is restricted to HR admins and calibrators.
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

  const sessions = await listCalibrationSessions(context);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Calibration Sessions
          </h2>
          <p className="text-sm text-slate-600">
            Create and manage calibration sessions by cycle and cohort.
          </p>
        </div>
        <Link href="/admin/performance/calibration/new">
          <Button>Create Session</Button>
        </Link>
      </header>

      {sessions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No calibration sessions yet</CardTitle>
            <CardDescription>
              Start by creating a session tied to a review cycle and cohort.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/performance/calibration/new">
              <Button>Create first session</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <CalibrationSessionsTable sessions={sessions} />
      )}
    </div>
  );
}

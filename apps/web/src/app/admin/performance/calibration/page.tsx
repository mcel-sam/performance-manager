import Link from "next/link";

import { UserRole } from "@prisma/client";

import CalibrationSessionsTable from "@/components/admin/calibration-sessions-table";
import { PageHeader } from "@/components/layout/page-header";
import { SectionHeader } from "@/components/layout/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
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
      <PageHeader
        title="Calibration Sessions"
        description="Create and manage calibration sessions by cycle and cohort."
        action={
          <Link href="/admin/performance/calibration/new">
            <Button>Create Session</Button>
          </Link>
        }
      />

      {sessions.length === 0 ? (
        <EmptyState
          title="No calibration sessions yet"
          description="Start by creating a session tied to a review cycle and cohort."
          action={
            <Link href="/admin/performance/calibration/new">
              <Button>Create first session</Button>
            </Link>
          }
        />
      ) : (
        <section className="space-y-3">
          <SectionHeader
            title="Session list"
            description="Open an existing session to review placements or continue facilitation."
          />
          <CalibrationSessionsTable sessions={sessions} />
        </section>
      )}
    </div>
  );
}

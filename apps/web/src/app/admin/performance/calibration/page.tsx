import Link from "next/link";

import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import CalibrationSessionsTable from "@/components/admin/calibration-sessions-table";
import { PageHeader } from "@/components/layout/page-header";
import { WorkspacePage } from "@/components/layout/workspace-page";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getDevRequestContext } from "@/server/auth/request-context";
import { listCalibrationSessions } from "@/server/calibration/calibration-admin-service";

export const dynamic = "force-dynamic";

const allowedRoles = new Set<UserRole>([UserRole.HR_ADMIN, UserRole.SUPER_ADMIN]);

export default async function AdminCalibrationSessionsPage() {
  const context = await getDevRequestContext();

  if (!allowedRoles.has(context.role)) {
    redirect("/");
  }

  const sessions = await listCalibrationSessions(context);

  return (
    <WorkspacePage width="wide" className="space-y-4">
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
        <CalibrationSessionsTable sessions={sessions} />
      )}
    </WorkspacePage>
  );
}

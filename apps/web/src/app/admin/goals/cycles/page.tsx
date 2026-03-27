import { redirect } from "next/navigation";

import GoalCyclesManager from "@/components/admin/goal-cycles-manager";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasHrAdminAccess } from "@/lib/users/role-capabilities";
import { getDevRequestContext } from "@/server/auth/request-context";
import { listGoalCycles } from "@/server/goals/goal-service";

export const dynamic = "force-dynamic";

export default async function AdminGoalCyclesPage() {
  const context = await getDevRequestContext();
  if (!hasHrAdminAccess(context.role)) {
    redirect("/");
  }

  const cycles = await listGoalCycles(context);
  const activeCount = cycles.filter((cycle) => cycle.status === "ACTIVE").length;
  const draftCount = cycles.filter((cycle) => cycle.status === "DRAFT").length;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Goal cycles"
        description="Open and close goal windows independently from review cycles so OKRs can run on their own cadence."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total cycles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-slate-900">{cycles.length}</p>
            <p className="text-sm text-slate-500">Configured planning windows.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active now</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-slate-900">{activeCount}</p>
            <p className="text-sm text-slate-500">Cycles ready for live goal work.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Drafting</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-slate-900">{draftCount}</p>
            <p className="text-sm text-slate-500">Cycles still being staged.</p>
          </CardContent>
        </Card>
      </section>

      <GoalCyclesManager
        auth={{ userId: context.userId, orgId: context.orgId }}
        cycles={cycles}
      />
    </div>
  );
}

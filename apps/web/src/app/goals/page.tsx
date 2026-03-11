import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { GoalCycleSelector } from "@/components/goals/goal-cycle-selector";
import { getDevRequestContext } from "@/server/auth/request-context";
import { listGoalCycles } from "@/server/goals/goal-service";

type QueryValue = string | string[] | undefined;

export const dynamic = "force-dynamic";

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, QueryValue>>;
}) {
  const context = await getDevRequestContext();
  const cycles = await listGoalCycles(context);

  if (cycles.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <PageHeader
          eyebrow="Goals"
          title="Goals workspace"
          description="Cycle context is ready, but the full goals list arrives in the next phase."
        />
        <EmptyState
          title="No goal cycles available yet"
          description="Ask HR to create a goal cycle first so teams can work in the right planning window."
        />
      </div>
    );
  }

  const query = await searchParams;
  const selectedCycleId = getSingleValue(query.cycleId) ?? cycles[0].id;
  const selectedCycle = cycles.find((cycle) => cycle.id === selectedCycleId) ?? cycles[0];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader
        eyebrow="Goals"
        title="Goals workspace"
        description="Phase 4 will bring the full goals list, create flow, and cascade view. The cycle selector is wired now so the workspace already knows which planning window you are in."
        action={
          <GoalCycleSelector
            cycles={cycles.map((cycle) => ({ id: cycle.id, name: cycle.name }))}
            selectedCycleId={selectedCycle.id}
          />
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{selectedCycle.name}</CardTitle>
          <CardDescription>
            {selectedCycle.cadence.toLowerCase()} cycle · {selectedCycle.status.toLowerCase()} ·{" "}
            {new Date(selectedCycle.startDate).toLocaleDateString()} to{" "}
            {new Date(selectedCycle.endDate).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>
            This placeholder keeps cycle context stable before the full goals UI lands.
          </p>
          <p>
            In the next phase, this route becomes the objective list with filters, KR builder,
            cascade alignment, and the context drawer.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function getSingleValue(value: QueryValue) {
  return Array.isArray(value) ? value[0] : value;
}

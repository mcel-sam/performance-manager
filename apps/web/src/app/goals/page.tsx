import { EmptyState } from "@/components/ui/empty-state";
import { WorkspacePage } from "@/components/layout/workspace-page";
import { GoalsWorkspace } from "@/components/goals/goals-workspace";
import { getDevRequestContext } from "@/server/auth/request-context";
import { getGoalFormCatalog, listGoalCycles, listGoals } from "@/server/goals/goal-service";
import { GoalStatus, GoalVisibility } from "@prisma/client";

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
      <WorkspacePage width="wide" className="flex flex-col gap-6">
        <EmptyState
          title="No goal cycles available yet"
          description="Ask HR to create a goal cycle first so teams can work in the right planning window."
        />
      </WorkspacePage>
    );
  }

  const query = await searchParams;
  const selectedCycleId = getSingleValue(query.cycleId) ?? cycles[0].id;
  const selectedStatus = parseGoalStatus(getSingleValue(query.status));
  const selectedVisibility = parseGoalVisibility(getSingleValue(query.visibility));
  const selectedOwnerId = getSingleValue(query.ownerId);

  const [allCycleGoals, filteredGoals, catalog] = await Promise.all([
    listGoals({ cycleId: selectedCycleId }, context),
    listGoals(
      {
        cycleId: selectedCycleId,
        ownerId: selectedOwnerId,
        status: selectedStatus,
        visibility: selectedVisibility,
      },
      context,
    ),
    getGoalFormCatalog(selectedCycleId, context),
  ]);

  const summary = {
    onTrack: 0,
    progressing: 0,
    offTrack: 0,
    noUpdate: 0,
    complete: 0,
  };

  for (const goal of allCycleGoals) {
    if (goal.status === GoalStatus.ON_TRACK) {
      summary.onTrack += 1;
    }

    if (
      goal.progressPercent > 0 &&
      goal.progressPercent < 100 &&
      goal.status !== GoalStatus.OFF_TRACK &&
      goal.status !== GoalStatus.CANCELED
    ) {
      summary.progressing += 1;
    }

    if (goal.status === GoalStatus.OFF_TRACK) {
      summary.offTrack += 1;
    }

    if (goal.updateCount === 0) {
      summary.noUpdate += 1;
    }

    if (goal.status === GoalStatus.COMPLETE) {
      summary.complete += 1;
    }
  }

  return (
    <GoalsWorkspace
      auth={{ userId: context.userId, orgId: context.orgId, role: context.role }}
      cycles={cycles}
      selectedCycleId={selectedCycleId}
      filters={{
        ownerId: selectedOwnerId,
        status: selectedStatus,
        visibility: selectedVisibility,
      }}
      summary={summary}
      goals={filteredGoals}
      catalog={catalog}
    />
  );
}

function getSingleValue(value: QueryValue) {
  return Array.isArray(value) ? value[0] : value;
}

function parseGoalStatus(value: string | undefined) {
  if (
    value === GoalStatus.NOT_STARTED ||
    value === GoalStatus.ON_TRACK ||
    value === GoalStatus.AT_RISK ||
    value === GoalStatus.OFF_TRACK ||
    value === GoalStatus.COMPLETE ||
    value === GoalStatus.CANCELED
  ) {
    return value;
  }

  return undefined;
}

function parseGoalVisibility(value: string | undefined) {
  if (value === GoalVisibility.PRIVATE || value === GoalVisibility.TEAM || value === GoalVisibility.ORG) {
    return value;
  }

  return undefined;
}

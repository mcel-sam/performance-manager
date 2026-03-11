import {
  GoalCycleCadence,
  GoalCycleStatus,
  GoalStatus,
  GoalVisibility,
  KeyResultType,
  Prisma,
  UserRole,
} from "@prisma/client";
import { z } from "zod";

import type { RequestContext } from "@/server/auth/request-context";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/http/errors";
import {
  calculateGoalProgressFromKeyResults,
  type GoalProgressKeyResultInput,
} from "@/server/goals/goal-progress";

type GoalDb = typeof prisma;

const goalCycleCreateSchema = z.object({
  name: z.string().trim().min(2).max(160),
  cadence: z.nativeEnum(GoalCycleCadence),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z.nativeEnum(GoalCycleStatus).default(GoalCycleStatus.DRAFT),
});

const goalCycleUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(160).optional(),
    cadence: z.nativeEnum(GoalCycleCadence).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    status: z.nativeEnum(GoalCycleStatus).optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required",
  });

const goalFiltersSchema = z.object({
  cycleId: z.string().trim().min(1).optional(),
  ownerId: z.string().trim().min(1).optional(),
  status: z.nativeEnum(GoalStatus).optional(),
  visibility: z.nativeEnum(GoalVisibility).optional(),
});

const keyResultInputSchema = z.object({
  title: z.string().trim().min(1).max(240),
  type: z.nativeEnum(KeyResultType),
  startValue: z.coerce.number().nullable().optional(),
  targetValue: z.coerce.number().nullable().optional(),
  currentValue: z.coerce.number().nullable().optional(),
  weight: z.coerce.number().positive().nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

const createGoalSchema = z.object({
  ownerEmployeeId: z.string().trim().min(1).optional(),
  cycleId: z.string().trim().min(1),
  title: z.string().trim().min(2).max(240),
  description: z.string().trim().max(6000).nullable().optional(),
  status: z.nativeEnum(GoalStatus).default(GoalStatus.NOT_STARTED),
  visibility: z.nativeEnum(GoalVisibility).default(GoalVisibility.TEAM),
  parentGoalId: z.string().trim().min(1).nullable().optional(),
  competencyIds: z.array(z.string().trim().min(1)).max(24).optional().default([]),
  watcherUserIds: z.array(z.string().trim().min(1)).max(24).optional().default([]),
  keyResults: z.array(keyResultInputSchema).max(24).optional().default([]),
});

const updateGoalSchema = z
  .object({
    title: z.string().trim().min(2).max(240).optional(),
    description: z.string().trim().max(6000).nullable().optional(),
    status: z.nativeEnum(GoalStatus).optional(),
    visibility: z.nativeEnum(GoalVisibility).optional(),
    competencyIds: z.array(z.string().trim().min(1)).max(24).optional(),
    watcherUserIds: z.array(z.string().trim().min(1)).max(24).optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required",
  });

const alignGoalSchema = z.object({
  parentGoalId: z.string().trim().min(1),
});

const goalUpdateCreateSchema = z.object({
  note: z.string().trim().min(1).max(4000),
  progressDelta: z.coerce.number().min(-100).max(100).nullable().optional(),
  keyResults: z
    .array(
      z.object({
        keyResultId: z.string().trim().min(1),
        currentValue: z.coerce.number(),
      }),
    )
    .max(24)
    .optional()
    .default([]),
});

const goalAccessSelect = {
  id: true,
  orgId: true,
  cycleId: true,
  ownerEmployeeId: true,
  title: true,
  description: true,
  status: true,
  progressPercent: true,
  visibility: true,
  parentGoalId: true,
  createdAt: true,
  updatedAt: true,
  ownerEmployee: {
    select: {
      id: true,
      userId: true,
      managerId: true,
      firstName: true,
      lastName: true,
    },
  },
  _count: {
    select: {
      updates: true,
    },
  },
} satisfies Prisma.GoalSelect;

const goalDetailSelect = {
  ...goalAccessSelect,
  cycle: {
    select: {
      id: true,
      name: true,
      status: true,
      cadence: true,
      startDate: true,
      endDate: true,
    },
  },
  parentGoal: {
    select: {
      id: true,
      title: true,
      visibility: true,
      ownerEmployeeId: true,
    },
  },
  childGoals: {
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      status: true,
      progressPercent: true,
      visibility: true,
      ownerEmployeeId: true,
    },
  },
  keyResults: {
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      type: true,
      startValue: true,
      targetValue: true,
      currentValue: true,
      weight: true,
      sortOrder: true,
    },
  },
  competencyLinks: {
    select: {
      competency: {
        select: {
          id: true,
          name: true,
          slug: true,
          dimensionKey: true,
        },
      },
    },
  },
  watchers: {
    select: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  },
} satisfies Prisma.GoalSelect;

type GoalAccessRecord = Prisma.GoalGetPayload<{ select: typeof goalAccessSelect }>;
type GoalDetailRecord = Prisma.GoalGetPayload<{ select: typeof goalDetailSelect }>;

interface ViewerScope {
  viewerEmployeeId: string;
  viewerManagerId: string | null;
  directReportIds: Set<string>;
}

export function parseGoalFilters(searchParams: URLSearchParams): z.infer<typeof goalFiltersSchema> {
  return goalFiltersSchema.parse(Object.fromEntries(searchParams.entries()));
}

export async function listGoalCycles(
  context: RequestContext,
  db: GoalDb = prisma,
) {
  const cycles = await db.goalCycle.findMany({
    where: {
      orgId: context.orgId,
    },
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      cadence: true,
      status: true,
      startDate: true,
      endDate: true,
      createdAt: true,
      _count: {
        select: {
          goals: true,
        },
      },
    },
  });

  return cycles.map((cycle) => ({
    id: cycle.id,
    name: cycle.name,
    cadence: cycle.cadence,
    status: cycle.status,
    startDate: cycle.startDate.toISOString(),
    endDate: cycle.endDate.toISOString(),
    createdAt: cycle.createdAt.toISOString(),
    goalCount: cycle._count.goals,
  }));
}

export async function createGoalCycle(
  payload: unknown,
  context: RequestContext,
  db: GoalDb = prisma,
) {
  requireHrAdmin(context);
  const parsed = goalCycleCreateSchema.parse(payload);
  assertCycleDates(parsed.startDate, parsed.endDate);

  const cycle = await db.goalCycle.create({
    data: {
      orgId: context.orgId,
      name: parsed.name,
      cadence: parsed.cadence,
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      status: parsed.status,
    },
    select: {
      id: true,
      name: true,
      cadence: true,
      status: true,
      startDate: true,
      endDate: true,
    },
  });

  await writeAuditEvent(db, context, "GOAL_CYCLE_CREATED", "GoalCycle", cycle.id, {
    cadence: cycle.cadence,
    status: cycle.status,
  });

  return mapGoalCycle(cycle);
}

export async function updateGoalCycle(
  cycleId: string,
  payload: unknown,
  context: RequestContext,
  db: GoalDb = prisma,
) {
  requireHrAdmin(context);
  const parsed = goalCycleUpdateSchema.parse(payload);
  const cycle = await getGoalCycleOrThrow(cycleId, context, db);
  assertCycleDates(parsed.startDate ?? cycle.startDate, parsed.endDate ?? cycle.endDate);

  const updated = await db.goalCycle.update({
    where: { id: cycleId },
    data: {
      ...(parsed.name !== undefined ? { name: parsed.name } : {}),
      ...(parsed.cadence !== undefined ? { cadence: parsed.cadence } : {}),
      ...(parsed.startDate !== undefined ? { startDate: parsed.startDate } : {}),
      ...(parsed.endDate !== undefined ? { endDate: parsed.endDate } : {}),
      ...(parsed.status !== undefined ? { status: parsed.status } : {}),
    },
    select: {
      id: true,
      name: true,
      cadence: true,
      status: true,
      startDate: true,
      endDate: true,
    },
  });

  await writeAuditEvent(db, context, "GOAL_CYCLE_UPDATED", "GoalCycle", updated.id, {
    fields: Object.keys(parsed),
  });

  return mapGoalCycle(updated);
}

export async function listGoals(
  filters: z.infer<typeof goalFiltersSchema>,
  context: RequestContext,
  db: GoalDb = prisma,
) {
  const scope = await getViewerScope(context, db);
  const goals = await db.goal.findMany({
    where: {
      orgId: context.orgId,
      ...(filters.cycleId ? { cycleId: filters.cycleId } : {}),
      ...(filters.ownerId ? { ownerEmployeeId: filters.ownerId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.visibility ? { visibility: filters.visibility } : {}),
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: goalAccessSelect,
  });

  const visibleGoals: GoalAccessRecord[] = [];
  for (const goal of goals) {
    if (await canViewGoal(goal, context, scope, db)) {
      visibleGoals.push(goal);
    }
  }

  return visibleGoals.map(mapGoalSummary);
}

export async function createGoal(
  payload: unknown,
  context: RequestContext,
  db: GoalDb = prisma,
) {
  const parsed = createGoalSchema.parse(payload);
  const scope = await getViewerScope(context, db);
  const ownerEmployeeId = parsed.ownerEmployeeId ?? scope.viewerEmployeeId;
  assertCanManageOwner(ownerEmployeeId, context, scope);

  await getGoalCycleOrThrow(parsed.cycleId, context, db);

  let parentGoal: GoalAccessRecord | null = null;
  if (parsed.parentGoalId) {
    parentGoal = await getGoalAccessOrThrow(parsed.parentGoalId, context, db);
    if (parentGoal.cycleId !== parsed.cycleId) {
      throw new AppError("VALIDATION_ERROR", "Parent goal must belong to the same cycle", 400);
    }

    if (!(await canViewGoal(parentGoal, context, scope, db))) {
      throw new AppError("FORBIDDEN", "Insufficient permissions to align to the parent goal", 403);
    }

    assertVisibilityCompatible(parsed.visibility, parentGoal.visibility);
  }

  const progressPercent = calculateGoalProgressFromKeyResults(
    parsed.keyResults.map((keyResult) => ({
      type: keyResult.type,
      startValue: normalizeNullableNumber(keyResult.startValue),
      targetValue: normalizeNullableNumber(keyResult.targetValue),
      currentValue: normalizeNullableNumber(keyResult.currentValue),
      weight: normalizeNullableNumber(keyResult.weight),
    })),
  );

  const created = await db.goal.create({
    data: {
      orgId: context.orgId,
      ownerEmployeeId,
      cycleId: parsed.cycleId,
      title: parsed.title,
      description: normalizeNullableString(parsed.description),
      status: parsed.status,
      progressPercent,
      visibility: parsed.visibility,
      parentGoalId: parsed.parentGoalId ?? null,
      keyResults: parsed.keyResults.length
        ? {
            create: parsed.keyResults.map((keyResult) => ({
              orgId: context.orgId,
              title: keyResult.title,
              type: keyResult.type,
              startValue: normalizeNullableNumber(keyResult.startValue),
              targetValue: normalizeNullableNumber(keyResult.targetValue),
              currentValue: normalizeNullableNumber(keyResult.currentValue),
              weight: normalizeNullableNumber(keyResult.weight),
              sortOrder: keyResult.sortOrder,
            })),
          }
        : undefined,
      competencyLinks: parsed.competencyIds.length
        ? {
            create: parsed.competencyIds.map((competencyId) => ({
              orgId: context.orgId,
              competencyId,
            })),
          }
        : undefined,
      watchers: parsed.watcherUserIds.length
        ? {
            create: parsed.watcherUserIds.map((userId) => ({
              orgId: context.orgId,
              userId,
            })),
          }
        : undefined,
    },
    select: goalDetailSelect,
  });

  await writeAuditEvent(db, context, "GOAL_CREATED", "Goal", created.id, {
    ownerEmployeeId,
    cycleId: parsed.cycleId,
    parentGoalId: parsed.parentGoalId ?? null,
    keyResultCount: parsed.keyResults.length,
  });

  return mapGoalDetail(created);
}

export async function getGoal(
  goalId: string,
  context: RequestContext,
  db: GoalDb = prisma,
) {
  const scope = await getViewerScope(context, db);
  const goal = await getGoalDetailOrThrow(goalId, context, db);
  await assertCanViewGoal(goal, context, scope, db);
  return mapGoalDetail(goal);
}

export async function getGoalFormCatalog(
  cycleId: string,
  context: RequestContext,
  db: GoalDb = prisma,
) {
  const scope = await getViewerScope(context, db);
  await getGoalCycleOrThrow(cycleId, context, db);

  const manageableOwnerIds =
    context.role === UserRole.HR_ADMIN
      ? undefined
      : context.role === UserRole.MANAGER
        ? [scope.viewerEmployeeId, ...scope.directReportIds]
        : [scope.viewerEmployeeId];

  const [owners, competencies, goalsInCycle] = await Promise.all([
    db.employee.findMany({
      where: {
        orgId: context.orgId,
        ...(manageableOwnerIds
          ? {
              id: {
                in: manageableOwnerIds,
              },
            }
          : {}),
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        department: true,
        title: true,
      },
    }),
    db.competency.findMany({
      where: {
        orgId: context.orgId,
      },
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        dimensionKey: true,
      },
    }),
    db.goal.findMany({
      where: {
        orgId: context.orgId,
        cycleId,
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      select: goalAccessSelect,
    }),
  ]);

  const visibleParentGoals: GoalAccessRecord[] = [];
  for (const goal of goalsInCycle) {
    if (await canViewGoal(goal, context, scope, db)) {
      visibleParentGoals.push(goal);
    }
  }

  return {
    owners: owners.map((owner) => ({
      id: owner.id,
      name: formatPersonName(owner.firstName, owner.lastName),
      department: owner.department,
      title: owner.title,
    })),
    competencies,
    parentGoals: visibleParentGoals.map(mapGoalSummary),
    defaultOwnerEmployeeId: scope.viewerEmployeeId,
  };
}

export async function listGoalAuditEvents(
  goalId: string,
  context: RequestContext,
  db: GoalDb = prisma,
) {
  const scope = await getViewerScope(context, db);
  const goal = await getGoalAccessOrThrow(goalId, context, db);
  await assertCanViewGoal(goal, context, scope, db);

  const events = await db.auditEvent.findMany({
    where: {
      orgId: context.orgId,
      entityType: "Goal",
      entityId: goalId,
    },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      metadata: true,
      createdAt: true,
      actorUser: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  return events.map((event) => ({
    id: event.id,
    action: event.action,
    entityType: event.entityType,
    entityId: event.entityId,
    metadata: event.metadata,
    createdAt: event.createdAt.toISOString(),
    actor: {
      userId: event.actorUser.id,
      email: event.actorUser.email,
    },
  }));
}

export async function updateGoal(
  goalId: string,
  payload: unknown,
  context: RequestContext,
  db: GoalDb = prisma,
) {
  const parsed = updateGoalSchema.parse(payload);
  const scope = await getViewerScope(context, db);
  const goal = await getGoalAccessOrThrow(goalId, context, db);
  await assertCanManageGoal(goal, context, scope);

  if (parsed.visibility !== undefined && goal.parentGoalId) {
    const parent = await getGoalAccessOrThrow(goal.parentGoalId, context, db);
    assertVisibilityCompatible(parsed.visibility, parent.visibility);
  }

  await db.goal.update({
    where: { id: goalId },
    data: {
      ...(parsed.title !== undefined ? { title: parsed.title } : {}),
      ...(parsed.description !== undefined
        ? { description: normalizeNullableString(parsed.description) }
        : {}),
      ...(parsed.status !== undefined ? { status: parsed.status } : {}),
      ...(parsed.visibility !== undefined ? { visibility: parsed.visibility } : {}),
    },
    select: goalDetailSelect,
  });

  if (parsed.competencyIds !== undefined) {
    await db.goalCompetencyLink.deleteMany({
      where: {
        goalId,
      },
    });
    if (parsed.competencyIds.length > 0) {
      await db.goalCompetencyLink.createMany({
        data: parsed.competencyIds.map((competencyId) => ({
          orgId: context.orgId,
          goalId,
          competencyId,
        })),
        skipDuplicates: true,
      });
    }
  }

  if (parsed.watcherUserIds !== undefined) {
    await db.goalWatcher.deleteMany({
      where: {
        goalId,
      },
    });
    if (parsed.watcherUserIds.length > 0) {
      await db.goalWatcher.createMany({
        data: parsed.watcherUserIds.map((userId) => ({
          orgId: context.orgId,
          goalId,
          userId,
        })),
        skipDuplicates: true,
      });
    }
  }

  await writeAuditEvent(db, context, "GOAL_UPDATED", "Goal", goalId, {
    fields: Object.keys(parsed),
  });

  return getGoal(goalId, context, db);
}

export async function archiveGoal(
  goalId: string,
  context: RequestContext,
  db: GoalDb = prisma,
) {
  const scope = await getViewerScope(context, db);
  const goal = await getGoalAccessOrThrow(goalId, context, db);
  await assertCanManageGoal(goal, context, scope);

  const archived = await db.goal.update({
    where: { id: goalId },
    data: {
      status: GoalStatus.CANCELED,
    },
    select: goalDetailSelect,
  });

  await writeAuditEvent(db, context, "GOAL_ARCHIVED", "Goal", goalId, {
    previousStatus: goal.status,
    nextStatus: GoalStatus.CANCELED,
  });

  return mapGoalDetail(archived);
}

export async function alignGoal(
  goalId: string,
  payload: unknown,
  context: RequestContext,
  db: GoalDb = prisma,
) {
  const parsed = alignGoalSchema.parse(payload);
  const scope = await getViewerScope(context, db);
  const goal = await getGoalAccessOrThrow(goalId, context, db);
  await assertCanManageGoal(goal, context, scope);

  if (goalId === parsed.parentGoalId) {
    throw new AppError("VALIDATION_ERROR", "A goal cannot be aligned to itself", 400);
  }

  const parentGoal = await getGoalAccessOrThrow(parsed.parentGoalId, context, db);
  await assertCanViewGoal(parentGoal, context, scope, db);

  if (goal.cycleId !== parentGoal.cycleId) {
    throw new AppError("VALIDATION_ERROR", "Aligned goals must belong to the same cycle", 400);
  }

  assertVisibilityCompatible(goal.visibility, parentGoal.visibility);
  await assertNoGoalLoop(goalId, parentGoal.parentGoalId, context, db, new Set([parentGoal.id]));

  const updated = await db.goal.update({
    where: { id: goalId },
    data: {
      parentGoalId: parentGoal.id,
    },
    select: goalDetailSelect,
  });

  await writeAuditEvent(db, context, "GOAL_ALIGNED", "Goal", goalId, {
    parentGoalId: parentGoal.id,
  });

  return mapGoalDetail(updated);
}

export async function unlinkGoal(
  goalId: string,
  context: RequestContext,
  db: GoalDb = prisma,
) {
  const scope = await getViewerScope(context, db);
  const goal = await getGoalAccessOrThrow(goalId, context, db);
  await assertCanManageGoal(goal, context, scope);

  const updated = await db.goal.update({
    where: { id: goalId },
    data: {
      parentGoalId: null,
    },
    select: goalDetailSelect,
  });

  await writeAuditEvent(db, context, "GOAL_UNLINKED", "Goal", goalId, {
    previousParentGoalId: goal.parentGoalId,
  });

  return mapGoalDetail(updated);
}

export async function getGoalTree(
  goalId: string,
  context: RequestContext,
  db: GoalDb = prisma,
) {
  const scope = await getViewerScope(context, db);
  const goal = await getGoalDetailOrThrow(goalId, context, db);
  await assertCanViewGoal(goal, context, scope, db);

  const ancestors = await listGoalAncestors(goal.parentGoalId, context, db);
  const visibleAncestors = [];
  for (const ancestor of ancestors) {
    if (await canViewGoal(ancestor, context, scope, db)) {
      visibleAncestors.push(mapGoalSummary(ancestor));
    }
  }

  return {
    ancestors: visibleAncestors,
    goal: mapGoalDetail(goal),
    children: goal.childGoals.map((child) =>
      mapGoalSummary({
        ...child,
        ownerEmployee: {
          id: child.ownerEmployeeId,
          userId: "",
          managerId: null,
          firstName: "",
          lastName: "",
        },
      } as GoalAccessRecord),
    ),
  };
}

export async function createKeyResult(
  goalId: string,
  payload: unknown,
  context: RequestContext,
  db: GoalDb = prisma,
) {
  const parsed = keyResultInputSchema.parse(payload);
  const scope = await getViewerScope(context, db);
  const goal = await getGoalAccessOrThrow(goalId, context, db);
  await assertCanManageGoal(goal, context, scope);

  const keyResult = await db.keyResult.create({
    data: {
      orgId: context.orgId,
      goalId,
      title: parsed.title,
      type: parsed.type,
      startValue: normalizeNullableNumber(parsed.startValue),
      targetValue: normalizeNullableNumber(parsed.targetValue),
      currentValue: normalizeNullableNumber(parsed.currentValue),
      weight: normalizeNullableNumber(parsed.weight),
      sortOrder: parsed.sortOrder,
    },
    select: {
      id: true,
      title: true,
      type: true,
      startValue: true,
      targetValue: true,
      currentValue: true,
      weight: true,
      sortOrder: true,
    },
  });

  const progressPercent = await recalculateGoalProgress(goalId, context, db);
  await writeAuditEvent(db, context, "KEY_RESULT_CREATED", "KeyResult", keyResult.id, {
    goalId,
    progressPercent,
  });

  return {
    ...mapKeyResult(keyResult),
    goalProgressPercent: progressPercent,
  };
}

export async function updateKeyResult(
  goalId: string,
  keyResultId: string,
  payload: unknown,
  context: RequestContext,
  db: GoalDb = prisma,
) {
  const parsed = keyResultInputSchema.partial().refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  }).parse(payload);
  const scope = await getViewerScope(context, db);
  const goal = await getGoalAccessOrThrow(goalId, context, db);
  await assertCanManageGoal(goal, context, scope);
  await assertKeyResultBelongsToGoal(goalId, keyResultId, context, db);

  const updated = await db.keyResult.update({
    where: { id: keyResultId },
    data: {
      ...(parsed.title !== undefined ? { title: parsed.title } : {}),
      ...(parsed.type !== undefined ? { type: parsed.type } : {}),
      ...(parsed.startValue !== undefined ? { startValue: normalizeNullableNumber(parsed.startValue) } : {}),
      ...(parsed.targetValue !== undefined ? { targetValue: normalizeNullableNumber(parsed.targetValue) } : {}),
      ...(parsed.currentValue !== undefined ? { currentValue: normalizeNullableNumber(parsed.currentValue) } : {}),
      ...(parsed.weight !== undefined ? { weight: normalizeNullableNumber(parsed.weight) } : {}),
      ...(parsed.sortOrder !== undefined ? { sortOrder: parsed.sortOrder } : {}),
    },
    select: {
      id: true,
      title: true,
      type: true,
      startValue: true,
      targetValue: true,
      currentValue: true,
      weight: true,
      sortOrder: true,
    },
  });

  const progressPercent = await recalculateGoalProgress(goalId, context, db);
  await writeAuditEvent(db, context, "KEY_RESULT_UPDATED", "KeyResult", keyResultId, {
    goalId,
    fields: Object.keys(parsed),
    progressPercent,
  });

  return {
    ...mapKeyResult(updated),
    goalProgressPercent: progressPercent,
  };
}

export async function deleteKeyResult(
  goalId: string,
  keyResultId: string,
  context: RequestContext,
  db: GoalDb = prisma,
) {
  const scope = await getViewerScope(context, db);
  const goal = await getGoalAccessOrThrow(goalId, context, db);
  await assertCanManageGoal(goal, context, scope);
  await assertKeyResultBelongsToGoal(goalId, keyResultId, context, db);

  await db.keyResult.delete({
    where: { id: keyResultId },
  });

  const progressPercent = await recalculateGoalProgress(goalId, context, db);
  await writeAuditEvent(db, context, "KEY_RESULT_DELETED", "KeyResult", keyResultId, {
    goalId,
    progressPercent,
  });

  return {
    ok: true,
    goalProgressPercent: progressPercent,
  };
}

export async function listGoalUpdates(
  goalId: string,
  context: RequestContext,
  db: GoalDb = prisma,
) {
  const scope = await getViewerScope(context, db);
  const goal = await getGoalAccessOrThrow(goalId, context, db);
  await assertCanViewGoal(goal, context, scope, db);

  const updates = await db.goalUpdate.findMany({
    where: {
      goalId,
      orgId: context.orgId,
    },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      note: true,
      progressDelta: true,
      snapshotProgressPercent: true,
      snapshotCurrentValues: true,
      createdAt: true,
      authorEmployee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return updates.map((update) => ({
    id: update.id,
    note: update.note,
    progressDelta: update.progressDelta,
    snapshotProgressPercent: update.snapshotProgressPercent,
    snapshotCurrentValues: update.snapshotCurrentValues,
    createdAt: update.createdAt.toISOString(),
    author: formatPersonName(update.authorEmployee.firstName, update.authorEmployee.lastName),
    authorEmployeeId: update.authorEmployee.id,
  }));
}

export async function createGoalUpdate(
  goalId: string,
  payload: unknown,
  context: RequestContext,
  db: GoalDb = prisma,
) {
  const parsed = goalUpdateCreateSchema.parse(payload);
  const scope = await getViewerScope(context, db);
  const goal = await getGoalDetailOrThrow(goalId, context, db);
  await assertCanUpdateGoalProgress(goal, context, scope, db);

  if (parsed.keyResults.length > 0) {
    const keyResultIds = new Set(goal.keyResults.map((keyResult) => keyResult.id));
    for (const item of parsed.keyResults) {
      if (!keyResultIds.has(item.keyResultId)) {
        throw new AppError("NOT_FOUND", "Key result does not belong to this goal", 404);
      }
    }

    for (const item of parsed.keyResults) {
      await db.keyResult.update({
        where: { id: item.keyResultId },
        data: {
          currentValue: item.currentValue,
        },
      });
    }
  }

  const refreshedKeyResults = await db.keyResult.findMany({
    where: {
      goalId,
      orgId: context.orgId,
    },
    select: {
      type: true,
      startValue: true,
      targetValue: true,
      currentValue: true,
      weight: true,
    },
  });

  const nextProgressPercent = calculateGoalProgressFromKeyResults(
    refreshedKeyResults as GoalProgressKeyResultInput[],
  );

  await db.goal.update({
    where: { id: goalId },
    data: {
      progressPercent: nextProgressPercent,
    },
  });

  const computedDelta = roundToTwo(nextProgressPercent - goal.progressPercent);
  const update = await db.goalUpdate.create({
    data: {
      orgId: context.orgId,
      goalId,
      authorEmployeeId: scope.viewerEmployeeId,
      note: parsed.note,
      progressDelta: parsed.progressDelta ?? computedDelta,
      snapshotProgressPercent: nextProgressPercent,
      snapshotCurrentValues:
        parsed.keyResults.length > 0
          ? (parsed.keyResults.map((item) => ({
              keyResultId: item.keyResultId,
              currentValue: item.currentValue,
            })) as Prisma.InputJsonArray)
          : undefined,
    },
    select: {
      id: true,
      note: true,
      progressDelta: true,
      snapshotProgressPercent: true,
      snapshotCurrentValues: true,
      createdAt: true,
      authorEmployee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  await writeAuditEvent(db, context, "GOAL_UPDATE_CREATED", "GoalUpdate", update.id, {
    goalId,
    progressPercent: nextProgressPercent,
    keyResultCount: parsed.keyResults.length,
  });

  return {
    id: update.id,
    note: update.note,
    progressDelta: update.progressDelta,
    snapshotProgressPercent: update.snapshotProgressPercent,
    snapshotCurrentValues: update.snapshotCurrentValues,
    createdAt: update.createdAt.toISOString(),
    author: formatPersonName(update.authorEmployee.firstName, update.authorEmployee.lastName),
    authorEmployeeId: update.authorEmployee.id,
  };
}

async function getViewerScope(context: RequestContext, db: GoalDb): Promise<ViewerScope> {
  const viewer = await db.employee.findFirst({
    where: {
      orgId: context.orgId,
      userId: context.userId,
    },
    select: {
      id: true,
      managerId: true,
      directReports: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!viewer) {
    throw new AppError("UNAUTHORIZED", "Viewer is not linked to an employee record", 401);
  }

  return {
    viewerEmployeeId: viewer.id,
    viewerManagerId: viewer.managerId,
    directReportIds: new Set(viewer.directReports.map((employee) => employee.id)),
  };
}

function requireHrAdmin(context: RequestContext): void {
  if (context.role !== UserRole.HR_ADMIN) {
    throw new AppError("FORBIDDEN", "Insufficient permissions", 403);
  }
}

function assertCycleDates(startDate: Date, endDate: Date): void {
  if (startDate > endDate) {
    throw new AppError("VALIDATION_ERROR", "Start date must be on or before end date", 400);
  }
}

async function getGoalCycleOrThrow(cycleId: string, context: RequestContext, db: GoalDb) {
  const cycle = await db.goalCycle.findFirst({
    where: {
      id: cycleId,
      orgId: context.orgId,
    },
    select: {
      id: true,
      name: true,
      cadence: true,
      status: true,
      startDate: true,
      endDate: true,
    },
  });

  if (!cycle) {
    throw new AppError("NOT_FOUND", "Goal cycle not found", 404);
  }

  return cycle;
}

async function getGoalAccessOrThrow(goalId: string, context: RequestContext, db: GoalDb) {
  const goal = await db.goal.findFirst({
    where: {
      id: goalId,
      orgId: context.orgId,
    },
    select: goalAccessSelect,
  });

  if (!goal) {
    throw new AppError("NOT_FOUND", "Goal not found", 404);
  }

  return goal;
}

async function getGoalDetailOrThrow(goalId: string, context: RequestContext, db: GoalDb) {
  const goal = await db.goal.findFirst({
    where: {
      id: goalId,
      orgId: context.orgId,
    },
    select: goalDetailSelect,
  });

  if (!goal) {
    throw new AppError("NOT_FOUND", "Goal not found", 404);
  }

  return goal;
}

function assertCanManageOwner(
  ownerEmployeeId: string,
  context: RequestContext,
  scope: ViewerScope,
): void {
  if (context.role === UserRole.HR_ADMIN) {
    return;
  }

  if (ownerEmployeeId === scope.viewerEmployeeId) {
    return;
  }

  if (context.role === UserRole.MANAGER && scope.directReportIds.has(ownerEmployeeId)) {
    return;
  }

  throw new AppError("FORBIDDEN", "Insufficient permissions for the requested owner", 403);
}

async function assertCanManageGoal(
  goal: GoalAccessRecord,
  context: RequestContext,
  scope: ViewerScope,
): Promise<void> {
  if (context.role === UserRole.HR_ADMIN) {
    return;
  }

  if (goal.ownerEmployeeId === scope.viewerEmployeeId) {
    return;
  }

  if (context.role === UserRole.MANAGER && scope.directReportIds.has(goal.ownerEmployeeId)) {
    return;
  }

  throw new AppError("FORBIDDEN", "Insufficient permissions for this goal", 403);
}

async function assertCanViewGoal(
  goal: GoalAccessRecord | GoalDetailRecord,
  context: RequestContext,
  scope: ViewerScope,
  db: GoalDb,
): Promise<void> {
  if (!(await canViewGoal(goal as GoalAccessRecord, context, scope, db))) {
    throw new AppError("FORBIDDEN", "Insufficient permissions for this goal", 403);
  }
}

async function canViewGoal(
  goal: GoalAccessRecord,
  context: RequestContext,
  scope: ViewerScope,
  db: GoalDb,
): Promise<boolean> {
  if (context.role === UserRole.HR_ADMIN) {
    return true;
  }

  if (goal.ownerEmployeeId === scope.viewerEmployeeId) {
    return true;
  }

  if (context.role === UserRole.MANAGER && scope.directReportIds.has(goal.ownerEmployeeId)) {
    return true;
  }

  if (goal.visibility === GoalVisibility.ORG) {
    return true;
  }

  if (goal.visibility === GoalVisibility.TEAM) {
    if (goal.ownerEmployee.managerId === scope.viewerEmployeeId) {
      return true;
    }

    if (scope.viewerManagerId && goal.ownerEmployee.managerId === scope.viewerManagerId) {
      return true;
    }
  }

  if (context.role !== UserRole.MANAGER || !goal.parentGoalId) {
    return false;
  }

  return hasAccessibleAncestor(goal.parentGoalId, context, scope, db);
}

async function assertCanUpdateGoalProgress(
  goal: GoalDetailRecord,
  context: RequestContext,
  scope: ViewerScope,
  db: GoalDb,
): Promise<void> {
  if (context.role === UserRole.HR_ADMIN) {
    return;
  }

  if (goal.ownerEmployeeId === scope.viewerEmployeeId) {
    return;
  }

  if (context.role === UserRole.MANAGER && scope.directReportIds.has(goal.ownerEmployeeId)) {
    return;
  }

  if (context.role === UserRole.MANAGER && goal.parentGoalId) {
    const hasAncestor = await hasAccessibleAncestor(goal.parentGoalId, context, scope, db);
    if (hasAncestor) {
      return;
    }
  }

  throw new AppError("FORBIDDEN", "Insufficient permissions to update this goal", 403);
}

async function hasAccessibleAncestor(
  parentGoalId: string | null,
  context: RequestContext,
  scope: ViewerScope,
  db: GoalDb,
): Promise<boolean> {
  const visited = new Set<string>();
  let cursor = parentGoalId;

  while (cursor) {
    if (visited.has(cursor)) {
      return false;
    }
    visited.add(cursor);

    const ancestor = await getGoalAccessOrThrow(cursor, context, db);
    if (
      ancestor.ownerEmployeeId === scope.viewerEmployeeId ||
      scope.directReportIds.has(ancestor.ownerEmployeeId)
    ) {
      return true;
    }

    cursor = ancestor.parentGoalId;
  }

  return false;
}

async function assertNoGoalLoop(
  goalId: string,
  parentGoalId: string | null,
  context: RequestContext,
  db: GoalDb,
  visited: Set<string> = new Set(),
): Promise<void> {
  let cursor = parentGoalId;

  while (cursor) {
    if (cursor === goalId) {
      throw new AppError("VALIDATION_ERROR", "Goal alignment would create a loop", 400);
    }

    if (visited.has(cursor)) {
      throw new AppError("VALIDATION_ERROR", "Goal alignment contains a loop", 400);
    }

    visited.add(cursor);
    const goal = await getGoalAccessOrThrow(cursor, context, db);
    cursor = goal.parentGoalId;
  }
}

function assertVisibilityCompatible(
  childVisibility: GoalVisibility,
  parentVisibility: GoalVisibility,
): void {
  const rank = {
    [GoalVisibility.PRIVATE]: 0,
    [GoalVisibility.TEAM]: 1,
    [GoalVisibility.ORG]: 2,
  };

  if (rank[childVisibility] > rank[parentVisibility]) {
    throw new AppError(
      "VALIDATION_ERROR",
      "A child goal cannot be more visible than its parent goal",
      400,
    );
  }
}

async function assertKeyResultBelongsToGoal(
  goalId: string,
  keyResultId: string,
  context: RequestContext,
  db: GoalDb,
): Promise<void> {
  const keyResult = await db.keyResult.findFirst({
    where: {
      id: keyResultId,
      goalId,
      orgId: context.orgId,
    },
    select: {
      id: true,
    },
  });

  if (!keyResult) {
    throw new AppError("NOT_FOUND", "Key result not found", 404);
  }
}

async function recalculateGoalProgress(
  goalId: string,
  context: RequestContext,
  db: GoalDb,
): Promise<number> {
  const keyResults = await db.keyResult.findMany({
    where: {
      goalId,
      orgId: context.orgId,
    },
    select: {
      type: true,
      startValue: true,
      targetValue: true,
      currentValue: true,
      weight: true,
    },
  });

  const progressPercent = calculateGoalProgressFromKeyResults(
    keyResults as GoalProgressKeyResultInput[],
  );

  await db.goal.update({
    where: { id: goalId },
    data: {
      progressPercent,
    },
  });

  return progressPercent;
}

async function listGoalAncestors(
  parentGoalId: string | null,
  context: RequestContext,
  db: GoalDb,
): Promise<GoalAccessRecord[]> {
  const ancestors: GoalAccessRecord[] = [];
  const visited = new Set<string>();
  let cursor = parentGoalId;

  while (cursor) {
    if (visited.has(cursor)) {
      break;
    }
    visited.add(cursor);

    const ancestor = await getGoalAccessOrThrow(cursor, context, db);
    ancestors.unshift(ancestor);
    cursor = ancestor.parentGoalId;
  }

  return ancestors;
}

async function writeAuditEvent(
  db: GoalDb,
  context: RequestContext,
  action: string,
  entityType: string,
  entityId: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await db.auditEvent.create({
    data: {
      orgId: context.orgId,
      actorUserId: context.userId,
      action,
      entityType,
      entityId,
      metadata: metadata as Prisma.InputJsonObject | undefined,
    },
  });
}

function mapGoalCycle(cycle: {
  id: string;
  name: string;
  cadence: GoalCycleCadence;
  status: GoalCycleStatus;
  startDate: Date;
  endDate: Date;
}) {
  return {
    id: cycle.id,
    name: cycle.name,
    cadence: cycle.cadence,
    status: cycle.status,
    startDate: cycle.startDate.toISOString(),
    endDate: cycle.endDate.toISOString(),
  };
}

function mapGoalSummary(goal: GoalAccessRecord) {
  return {
    id: goal.id,
    cycleId: goal.cycleId,
    ownerEmployeeId: goal.ownerEmployeeId,
    ownerName: formatPersonName(goal.ownerEmployee.firstName, goal.ownerEmployee.lastName),
    title: goal.title,
    description: goal.description,
    status: goal.status,
    progressPercent: goal.progressPercent,
    visibility: goal.visibility,
    parentGoalId: goal.parentGoalId,
    updateCount: goal._count.updates,
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString(),
  };
}

function mapGoalDetail(goal: GoalDetailRecord) {
  return {
    ...mapGoalSummary(goal),
    cycle: {
      id: goal.cycle.id,
      name: goal.cycle.name,
      cadence: goal.cycle.cadence,
      status: goal.cycle.status,
      startDate: goal.cycle.startDate.toISOString(),
      endDate: goal.cycle.endDate.toISOString(),
    },
    parentGoal: goal.parentGoal
      ? {
          id: goal.parentGoal.id,
          title: goal.parentGoal.title,
          visibility: goal.parentGoal.visibility,
          ownerEmployeeId: goal.parentGoal.ownerEmployeeId,
        }
      : null,
    children: goal.childGoals.map((child) => ({
      id: child.id,
      title: child.title,
      status: child.status,
      progressPercent: child.progressPercent,
      visibility: child.visibility,
      ownerEmployeeId: child.ownerEmployeeId,
    })),
    keyResults: goal.keyResults.map(mapKeyResult),
    competencies: goal.competencyLinks.map((link) => ({
      id: link.competency.id,
      name: link.competency.name,
      slug: link.competency.slug,
      dimensionKey: link.competency.dimensionKey,
    })),
    watchers: goal.watchers.map((watcher) => ({
      userId: watcher.user.id,
      email: watcher.user.email,
    })),
  };
}

function mapKeyResult(keyResult: {
  id: string;
  title: string;
  type: KeyResultType;
  startValue: number | null;
  targetValue: number | null;
  currentValue: number | null;
  weight: number | null;
  sortOrder: number;
}) {
  return {
    id: keyResult.id,
    title: keyResult.title,
    type: keyResult.type,
    startValue: keyResult.startValue,
    targetValue: keyResult.targetValue,
    currentValue: keyResult.currentValue,
    weight: keyResult.weight,
    sortOrder: keyResult.sortOrder,
  };
}

function formatPersonName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

function normalizeNullableString(value: string | null | undefined): string | null {
  return value == null || value === "" ? null : value;
}

function normalizeNullableNumber(value: number | null | undefined): number | null {
  return value == null ? null : value;
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

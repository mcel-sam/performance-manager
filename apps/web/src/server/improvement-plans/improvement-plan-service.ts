import {
  ImprovementPlanOutcome,
  ImprovementPlanStatus,
  UserRole,
} from "@prisma/client";
import { z } from "zod";

import type { RequestContext } from "@/server/auth/request-context";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/http/errors";

interface EmployeeIdentityRecord {
  id: string;
  userId: string;
  managerId: string | null;
  firstName: string;
  lastName: string;
}

interface ImprovementPlanListRecord {
  id: string;
  subjectEmployeeId: string;
  managerEmployeeId: string;
  hrOwnerEmployeeId: string | null;
  title: string;
  startDate: Date;
  endDate: Date;
  status: ImprovementPlanStatus;
  createdAt: Date;
  updatedAt: Date;
  subjectEmployee: {
    id: string;
    firstName: string;
    lastName: string;
  };
  managerEmployee: {
    id: string;
    firstName: string;
    lastName: string;
  };
  hrOwnerEmployee: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

interface ImprovementPlanCheckInRecord {
  id: string;
  content: string;
  status: ImprovementPlanStatus | null;
  outcome: ImprovementPlanOutcome | null;
  checkInAt: Date;
  createdAt: Date;
  authorUser: {
    id: string;
    email: string;
    employee: {
      firstName: string;
      lastName: string;
    } | null;
  };
}

interface ImprovementPlanDetailRecord extends ImprovementPlanListRecord {
  orgId: string;
  expectations: string;
  outcome: ImprovementPlanOutcome | null;
  goals: {
    id: string;
    title: string;
    description: string | null;
    sortOrder: number;
  }[];
  checkIns: ImprovementPlanCheckInRecord[];
}

interface ImprovementPlanAccessRecord {
  id: string;
  orgId: string;
  subjectEmployeeId: string;
  managerEmployeeId: string;
  hrOwnerEmployeeId: string | null;
  status: ImprovementPlanStatus;
  outcome: ImprovementPlanOutcome | null;
}

interface ImprovementPlanEditRecord extends ImprovementPlanAccessRecord {
  startDate: Date;
  endDate: Date;
  goals: {
    id: string;
    sortOrder: number;
  }[];
}

interface ImprovementPlanAuditRecord {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  actorUser: {
    id: string;
    email: string;
    employee: {
      firstName: string;
      lastName: string;
    } | null;
  };
}

interface CreatedImprovementPlanRecord {
  id: string;
  title: string;
  status: ImprovementPlanStatus;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface UpdatedImprovementPlanRecord {
  id: string;
  status: ImprovementPlanStatus;
  outcome: ImprovementPlanOutcome | null;
  updatedAt: Date;
}

interface UpdatedImprovementPlanContentRecord {
  id: string;
  startDate: Date;
  endDate: Date;
  updatedAt: Date;
  goals: {
    id: string;
    title: string;
    description: string | null;
    sortOrder: number;
  }[];
}

interface ImprovementPlanDb {
  employee: {
    findFirst: (args: {
      where: Record<string, unknown>;
      select: {
        id: true;
        userId: true;
        managerId: true;
        firstName: true;
        lastName: true;
      };
    }) => Promise<EmployeeIdentityRecord | null>;
  };
  improvementPlan: {
    create: (args: {
      data: {
        orgId: string;
        subjectEmployeeId: string;
        managerEmployeeId: string;
        hrOwnerEmployeeId: string | null;
        createdByUserId: string;
        title: string;
        expectations: string;
        startDate: Date;
        endDate: Date;
        goals: {
          create: {
            orgId: string;
            title: string;
            description: string | null;
            sortOrder: number;
          }[];
        };
      };
      select: {
        id: true;
        title: true;
        status: true;
        startDate: true;
        endDate: true;
        createdAt: true;
        updatedAt: true;
      };
    }) => Promise<CreatedImprovementPlanRecord>;
    findMany: (args: {
      where: Record<string, unknown>;
      select: Record<string, unknown>;
      orderBy: {
        updatedAt: "desc";
      };
    }) => Promise<ImprovementPlanListRecord[]>;
    findFirst: (args: {
      where: Record<string, unknown>;
      select: Record<string, unknown>;
    }) => Promise<ImprovementPlanDetailRecord | ImprovementPlanAccessRecord | null>;
    update: (args: {
      where: {
        id: string;
      };
      data: Record<string, unknown>;
      select: Record<string, unknown>;
    }) => Promise<UpdatedImprovementPlanRecord | UpdatedImprovementPlanContentRecord>;
  };
  improvementPlanCheckIn: {
    create: (args: {
      data: {
        orgId: string;
        planId: string;
        authorUserId: string;
        content: string;
        status: ImprovementPlanStatus | null;
        outcome: ImprovementPlanOutcome | null;
        checkInAt: Date;
      };
      select: Record<string, unknown>;
    }) => Promise<ImprovementPlanCheckInRecord>;
  };
  auditEvent: {
    create: (args: {
      data: {
        orgId: string;
        actorUserId: string;
        action: string;
        entityType: string;
        entityId: string;
        metadata?: Record<string, unknown>;
      };
    }) => Promise<unknown>;
    findMany: (args: {
      where: Record<string, unknown>;
      orderBy: {
        createdAt: "desc";
      };
      take: number;
      select: Record<string, unknown>;
    }) => Promise<ImprovementPlanAuditRecord[]>;
  };
}

const planGoalSchema = z.object({
  title: z.string().trim().min(1).max(240),
  description: z.string().trim().max(2000).optional().nullable(),
});

const createImprovementPlanSchema = z
  .object({
    subjectEmployeeId: z.string().trim().min(1),
    managerEmployeeId: z.string().trim().min(1).optional(),
    hrOwnerEmployeeId: z.string().trim().min(1).optional().nullable(),
    title: z.string().trim().min(3).max(160),
    expectations: z.string().trim().min(1).max(12000),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    goals: z.array(planGoalSchema).min(1).max(20),
  })
  .superRefine((value, ctx) => {
    const startDate = new Date(value.startDate);
    const endDate = new Date(value.endDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return;
    }

    if (endDate <= startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "endDate must be later than startDate",
      });
    }
  });

const planIdSchema = z.object({
  planId: z.string().trim().min(1),
});

const createImprovementPlanCheckInSchema = z.object({
  note: z.string().trim().min(1).max(12000),
  checkInAt: z.string().datetime().optional(),
});

const transitionImprovementPlanStatusSchema = z.object({
  targetStatus: z.nativeEnum(ImprovementPlanStatus),
  outcome: z.nativeEnum(ImprovementPlanOutcome).optional().nullable(),
  note: z.string().trim().max(4000).optional(),
});

const updateImprovementPlanSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  goals: z.array(planGoalSchema).min(1).max(20).optional(),
});

const allowedStatusTransitions: Record<ImprovementPlanStatus, ImprovementPlanStatus[]> = {
  [ImprovementPlanStatus.DRAFT]: [ImprovementPlanStatus.ACTIVE],
  [ImprovementPlanStatus.ACTIVE]: [ImprovementPlanStatus.COMPLETED],
  [ImprovementPlanStatus.COMPLETED]: [
    ImprovementPlanStatus.EXTENDED,
    ImprovementPlanStatus.CANCELED,
  ],
  [ImprovementPlanStatus.EXTENDED]: [
    ImprovementPlanStatus.COMPLETED,
    ImprovementPlanStatus.CANCELED,
  ],
  [ImprovementPlanStatus.CANCELED]: [],
};

export interface ImprovementPlanListItem {
  id: string;
  subjectEmployeeId: string;
  managerEmployeeId: string;
  hrOwnerEmployeeId: string | null;
  title: string;
  startDate: string;
  endDate: string;
  status: ImprovementPlanStatus;
  createdAt: string;
  updatedAt: string;
  subjectName: string;
  managerName: string;
  hrOwnerName: string | null;
}

export interface ImprovementPlanTimelineEntry {
  id: string;
  authorName: string;
  authorUserId: string;
  note: string;
  timestamp: string;
  status: ImprovementPlanStatus | null;
  outcome: ImprovementPlanOutcome | null;
}

export interface ImprovementPlanAuditEvent {
  id: string;
  timestamp: string;
  actorName: string;
  actorUserId: string;
  action: string;
  description: string;
}

export interface ImprovementPlanDetail {
  id: string;
  subjectEmployeeId: string;
  managerEmployeeId: string;
  hrOwnerEmployeeId: string | null;
  title: string;
  expectations: string;
  startDate: string;
  endDate: string;
  status: ImprovementPlanStatus;
  outcome: ImprovementPlanOutcome | null;
  createdAt: string;
  updatedAt: string;
  subjectName: string;
  managerName: string;
  hrOwnerName: string | null;
  goals: {
    id: string;
    title: string;
    description: string | null;
    sortOrder: number;
  }[];
  checkInCount: number;
  timeline: ImprovementPlanTimelineEntry[];
}

export interface CreatedImprovementPlan {
  id: string;
  title: string;
  status: ImprovementPlanStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImprovementPlanStatusTransitionResult {
  id: string;
  status: ImprovementPlanStatus;
  outcome: ImprovementPlanOutcome | null;
  updatedAt: string;
  timelineEntry: ImprovementPlanTimelineEntry;
}

export interface ImprovementPlanUpdateResult {
  id: string;
  startDate: string;
  endDate: string;
  updatedAt: string;
  goals: {
    id: string;
    title: string;
    description: string | null;
    sortOrder: number;
  }[];
}

export interface ImprovementPlanExportPlaceholder {
  planId: string;
  requestedAt: string;
  message: string;
}

export async function createImprovementPlan(
  input: unknown,
  context: RequestContext,
  db: ImprovementPlanDb = prisma as unknown as ImprovementPlanDb,
): Promise<CreatedImprovementPlan> {
  if (context.role !== UserRole.HR_ADMIN && context.role !== UserRole.MANAGER) {
    throw new AppError("FORBIDDEN", "Only HR admins and managers can create plans", 403);
  }

  const parsed = createImprovementPlanSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Invalid improvement plan payload",
      400,
      parsed.error.flatten(),
    );
  }

  const subjectEmployee = await db.employee.findFirst({
    where: {
      orgId: context.orgId,
      id: parsed.data.subjectEmployeeId,
    },
    select: {
      id: true,
      userId: true,
      managerId: true,
      firstName: true,
      lastName: true,
    },
  });

  if (!subjectEmployee) {
    throw new AppError("NOT_FOUND", "Subject employee not found", 404);
  }

  const viewerEmployee = await db.employee.findFirst({
    where: {
      orgId: context.orgId,
      userId: context.userId,
    },
    select: {
      id: true,
      userId: true,
      managerId: true,
      firstName: true,
      lastName: true,
    },
  });

  if (!viewerEmployee) {
    throw new AppError("FORBIDDEN", "User is not mapped to an employee profile", 403);
  }

  let managerEmployeeId = parsed.data.managerEmployeeId ?? subjectEmployee.managerId;
  if (context.role === UserRole.MANAGER) {
    if (subjectEmployee.managerId !== viewerEmployee.id) {
      throw new AppError("FORBIDDEN", "Managers can create plans only for direct reports", 403);
    }

    managerEmployeeId = viewerEmployee.id;
  }

  if (!managerEmployeeId) {
    throw new AppError(
      "VALIDATION_ERROR",
      "managerEmployeeId is required when the subject has no manager",
      400,
    );
  }

  const managerEmployee = await db.employee.findFirst({
    where: {
      orgId: context.orgId,
      id: managerEmployeeId,
    },
    select: {
      id: true,
      userId: true,
      managerId: true,
      firstName: true,
      lastName: true,
    },
  });

  if (!managerEmployee) {
    throw new AppError("NOT_FOUND", "Manager employee not found", 404);
  }

  if (context.role === UserRole.MANAGER && managerEmployee.id !== viewerEmployee.id) {
    throw new AppError("FORBIDDEN", "Managers cannot assign a different manager owner", 403);
  }

  let hrOwnerEmployeeId = parsed.data.hrOwnerEmployeeId ?? null;
  if (context.role === UserRole.HR_ADMIN && !hrOwnerEmployeeId) {
    hrOwnerEmployeeId = viewerEmployee.id;
  }

  if (hrOwnerEmployeeId) {
    const hrOwner = await db.employee.findFirst({
      where: {
        orgId: context.orgId,
        id: hrOwnerEmployeeId,
      },
      select: {
        id: true,
        userId: true,
        managerId: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!hrOwner) {
      throw new AppError("NOT_FOUND", "HR owner employee not found", 404);
    }
  }

  const createdPlan = await db.improvementPlan.create({
    data: {
      orgId: context.orgId,
      subjectEmployeeId: subjectEmployee.id,
      managerEmployeeId: managerEmployee.id,
      hrOwnerEmployeeId,
      createdByUserId: context.userId,
      title: parsed.data.title,
      expectations: parsed.data.expectations,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      goals: {
        create: parsed.data.goals.map((goal, index) => ({
          orgId: context.orgId,
          title: goal.title,
          description: goal.description ?? null,
          sortOrder: index + 1,
        })),
      },
    },
    select: {
      id: true,
      title: true,
      status: true,
      startDate: true,
      endDate: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await db.auditEvent.create({
    data: {
      orgId: context.orgId,
      actorUserId: context.userId,
      action: "IMPROVEMENT_PLAN_CREATED",
      entityType: "ImprovementPlan",
      entityId: createdPlan.id,
      metadata: {
        subjectEmployeeId: subjectEmployee.id,
        managerEmployeeId: managerEmployee.id,
        goalCount: parsed.data.goals.length,
        status: createdPlan.status,
      },
    },
  });

  return {
    id: createdPlan.id,
    title: createdPlan.title,
    status: createdPlan.status,
    startDate: createdPlan.startDate.toISOString(),
    endDate: createdPlan.endDate.toISOString(),
    createdAt: createdPlan.createdAt.toISOString(),
    updatedAt: createdPlan.updatedAt.toISOString(),
  };
}

export async function listImprovementPlans(
  context: RequestContext,
  db: ImprovementPlanDb = prisma as unknown as ImprovementPlanDb,
): Promise<ImprovementPlanListItem[]> {
  const viewerEmployeeId = await resolveViewerEmployeeId(context, db);

  const plans = await db.improvementPlan.findMany({
    where: buildPlanScopeWhere(context, viewerEmployeeId),
    select: {
      id: true,
      subjectEmployeeId: true,
      managerEmployeeId: true,
      hrOwnerEmployeeId: true,
      title: true,
      startDate: true,
      endDate: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      subjectEmployee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      managerEmployee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      hrOwnerEmployee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return plans.map((plan) => ({
    id: plan.id,
    subjectEmployeeId: plan.subjectEmployeeId,
    managerEmployeeId: plan.managerEmployeeId,
    hrOwnerEmployeeId: plan.hrOwnerEmployeeId,
    title: plan.title,
    startDate: plan.startDate.toISOString(),
    endDate: plan.endDate.toISOString(),
    status: plan.status,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
    subjectName: `${plan.subjectEmployee.firstName} ${plan.subjectEmployee.lastName}`,
    managerName: `${plan.managerEmployee.firstName} ${plan.managerEmployee.lastName}`,
    hrOwnerName: plan.hrOwnerEmployee
      ? `${plan.hrOwnerEmployee.firstName} ${plan.hrOwnerEmployee.lastName}`
      : null,
  }));
}

export async function getImprovementPlanDetail(
  planId: string,
  context: RequestContext,
  db: ImprovementPlanDb = prisma as unknown as ImprovementPlanDb,
): Promise<ImprovementPlanDetail> {
  const parsed = planIdSchema.safeParse({ planId });
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Invalid improvement plan identifier",
      400,
      parsed.error.flatten(),
    );
  }

  const planRecord = await db.improvementPlan.findFirst({
    where: {
      id: parsed.data.planId,
      orgId: context.orgId,
    },
    select: {
      id: true,
      orgId: true,
      subjectEmployeeId: true,
      managerEmployeeId: true,
      hrOwnerEmployeeId: true,
      title: true,
      expectations: true,
      startDate: true,
      endDate: true,
      status: true,
      outcome: true,
      createdAt: true,
      updatedAt: true,
      subjectEmployee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      managerEmployee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      hrOwnerEmployee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      goals: {
        select: {
          id: true,
          title: true,
          description: true,
          sortOrder: true,
        },
        orderBy: {
          sortOrder: "asc",
        },
      },
      checkIns: {
        orderBy: {
          checkInAt: "desc",
        },
        select: checkInSelection,
      },
    },
  });

  const plan = planRecord as ImprovementPlanDetailRecord | null;
  if (!plan) {
    throw new AppError("NOT_FOUND", "Improvement plan not found", 404);
  }

  const viewerEmployeeId = await resolveViewerEmployeeId(context, db);
  if (!canAccessPlan(plan, context, viewerEmployeeId)) {
    throw new AppError("FORBIDDEN", "You are not allowed to access this improvement plan", 403);
  }

  return {
    id: plan.id,
    subjectEmployeeId: plan.subjectEmployeeId,
    managerEmployeeId: plan.managerEmployeeId,
    hrOwnerEmployeeId: plan.hrOwnerEmployeeId,
    title: plan.title,
    expectations: plan.expectations,
    startDate: plan.startDate.toISOString(),
    endDate: plan.endDate.toISOString(),
    status: plan.status,
    outcome: plan.outcome,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
    subjectName: `${plan.subjectEmployee.firstName} ${plan.subjectEmployee.lastName}`,
    managerName: `${plan.managerEmployee.firstName} ${plan.managerEmployee.lastName}`,
    hrOwnerName: plan.hrOwnerEmployee
      ? `${plan.hrOwnerEmployee.firstName} ${plan.hrOwnerEmployee.lastName}`
      : null,
    goals: plan.goals.map((goal) => ({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      sortOrder: goal.sortOrder,
    })),
    checkInCount: plan.checkIns.length,
    timeline: plan.checkIns.map(mapCheckInRecord),
  };
}

export async function createImprovementPlanCheckIn(
  planId: string,
  input: unknown,
  context: RequestContext,
  db: ImprovementPlanDb = prisma as unknown as ImprovementPlanDb,
): Promise<ImprovementPlanTimelineEntry> {
  const parsedPlanId = parsePlanId(planId);

  const parsed = createImprovementPlanCheckInSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Invalid improvement plan check-in payload",
      400,
      parsed.error.flatten(),
    );
  }

  const plan = await loadPlanAccessRecord(parsedPlanId, context.orgId, db);
  const viewerEmployeeId = await resolveViewerEmployeeId(context, db);

  if (!canAccessPlan(plan, context, viewerEmployeeId)) {
    throw new AppError("FORBIDDEN", "You are not allowed to create a check-in for this plan", 403);
  }

  const checkInAt = parsed.data.checkInAt ? new Date(parsed.data.checkInAt) : new Date();

  const createdCheckIn = await db.improvementPlanCheckIn.create({
    data: {
      orgId: context.orgId,
      planId: plan.id,
      authorUserId: context.userId,
      content: parsed.data.note,
      status: plan.status,
      outcome: plan.outcome,
      checkInAt,
    },
    select: checkInSelection,
  });

  await db.auditEvent.create({
    data: {
      orgId: context.orgId,
      actorUserId: context.userId,
      action: "IMPROVEMENT_PLAN_CHECKIN_CREATED",
      entityType: "ImprovementPlan",
      entityId: plan.id,
      metadata: {
        checkInId: createdCheckIn.id,
        status: createdCheckIn.status,
        outcome: createdCheckIn.outcome,
        noteLength: parsed.data.note.length,
        checkInAt: createdCheckIn.checkInAt.toISOString(),
      },
    },
  });

  return mapCheckInRecord(createdCheckIn);
}

export async function transitionImprovementPlanStatus(
  planId: string,
  input: unknown,
  context: RequestContext,
  db: ImprovementPlanDb = prisma as unknown as ImprovementPlanDb,
): Promise<ImprovementPlanStatusTransitionResult> {
  const parsedPlanId = parsePlanId(planId);

  const parsed = transitionImprovementPlanStatusSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Invalid improvement plan status transition payload",
      400,
      parsed.error.flatten(),
    );
  }

  const plan = await loadPlanAccessRecord(parsedPlanId, context.orgId, db);
  const viewerEmployeeId = await resolveViewerEmployeeId(context, db);

  if (!canAccessPlan(plan, context, viewerEmployeeId)) {
    throw new AppError("FORBIDDEN", "You are not allowed to change this plan status", 403);
  }

  if (context.role !== UserRole.HR_ADMIN && context.role !== UserRole.MANAGER) {
    throw new AppError("FORBIDDEN", "Only managers and HR admins can change plan status", 403);
  }

  if (context.role === UserRole.MANAGER && viewerEmployeeId !== plan.managerEmployeeId) {
    throw new AppError("FORBIDDEN", "Only the plan manager can change plan status", 403);
  }

  const nextStatus = parsed.data.targetStatus;
  const nextOutcome = normalizeTransitionOutcome(plan, nextStatus, parsed.data.outcome ?? null);

  const updatedPlanRecord = await db.improvementPlan.update({
    where: {
      id: plan.id,
    },
    data: {
      status: nextStatus,
      outcome: nextOutcome,
    },
    select: {
      id: true,
      status: true,
      outcome: true,
      updatedAt: true,
    },
  });
  const updatedPlan = updatedPlanRecord as UpdatedImprovementPlanRecord;

  const transitionNote =
    parsed.data.note && parsed.data.note.length > 0
      ? parsed.data.note
      : buildTransitionNote(plan.status, nextStatus, nextOutcome);

  const timelineEntryRecord = await db.improvementPlanCheckIn.create({
    data: {
      orgId: context.orgId,
      planId: plan.id,
      authorUserId: context.userId,
      content: transitionNote,
      status: updatedPlan.status,
      outcome: updatedPlan.outcome,
      checkInAt: new Date(),
    },
    select: checkInSelection,
  });

  await db.auditEvent.create({
    data: {
      orgId: context.orgId,
      actorUserId: context.userId,
      action: "IMPROVEMENT_PLAN_STATUS_CHANGED",
      entityType: "ImprovementPlan",
      entityId: plan.id,
      metadata: {
        previousStatus: plan.status,
        nextStatus: updatedPlan.status,
        previousOutcome: plan.outcome,
        nextOutcome: updatedPlan.outcome,
        noteLength: transitionNote.length,
      },
    },
  });

  return {
    id: updatedPlan.id,
    status: updatedPlan.status,
    outcome: updatedPlan.outcome,
    updatedAt: updatedPlan.updatedAt.toISOString(),
    timelineEntry: mapCheckInRecord(timelineEntryRecord),
  };
}

export async function updateImprovementPlanGoalsAndDates(
  planId: string,
  input: unknown,
  context: RequestContext,
  db: ImprovementPlanDb = prisma as unknown as ImprovementPlanDb,
): Promise<ImprovementPlanUpdateResult> {
  const parsedPlanId = parsePlanId(planId);
  const parsed = updateImprovementPlanSchema.safeParse(input);

  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Invalid improvement plan update payload",
      400,
      parsed.error.flatten(),
    );
  }

  if (!parsed.data.startDate && !parsed.data.endDate && !parsed.data.goals) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Provide at least one field to update (startDate, endDate, goals)",
      400,
    );
  }

  const plan = await loadPlanEditRecord(parsedPlanId, context.orgId, db);
  const viewerEmployeeId = await resolveViewerEmployeeId(context, db);

  if (!canAccessPlan(plan, context, viewerEmployeeId)) {
    throw new AppError("FORBIDDEN", "You are not allowed to edit this improvement plan", 403);
  }

  if (context.role !== UserRole.HR_ADMIN && context.role !== UserRole.MANAGER) {
    throw new AppError("FORBIDDEN", "Only managers and HR admins can edit plans", 403);
  }

  if (context.role === UserRole.MANAGER && viewerEmployeeId !== plan.managerEmployeeId) {
    throw new AppError("FORBIDDEN", "Only the plan manager can edit this plan", 403);
  }

  if (
    plan.status === ImprovementPlanStatus.COMPLETED ||
    plan.status === ImprovementPlanStatus.CANCELED
  ) {
    throw new AppError("FORBIDDEN", "Completed or canceled plans are read-only", 403);
  }

  const nextStartDate = parsed.data.startDate ? new Date(parsed.data.startDate) : plan.startDate;
  const nextEndDate = parsed.data.endDate ? new Date(parsed.data.endDate) : plan.endDate;

  if (nextEndDate <= nextStartDate) {
    throw new AppError("VALIDATION_ERROR", "endDate must be later than startDate", 400, {
      startDate: nextStartDate.toISOString(),
      endDate: nextEndDate.toISOString(),
    });
  }

  const datesUpdated =
    nextStartDate.getTime() !== plan.startDate.getTime() ||
    nextEndDate.getTime() !== plan.endDate.getTime();
  const goalsUpdated = Array.isArray(parsed.data.goals);

  if (!datesUpdated && !goalsUpdated) {
    throw new AppError("VALIDATION_ERROR", "No plan changes detected", 400);
  }

  const updateData: Record<string, unknown> = {};
  if (datesUpdated) {
    updateData.startDate = nextStartDate;
    updateData.endDate = nextEndDate;
  }

  if (goalsUpdated) {
    updateData.goals = {
      deleteMany: {},
      create: parsed.data.goals!.map((goal, index) => ({
        orgId: context.orgId,
        title: goal.title,
        description: goal.description ?? null,
        sortOrder: index + 1,
      })),
    };
  }

  const updatedPlanRecord = await db.improvementPlan.update({
    where: {
      id: plan.id,
    },
    data: updateData,
    select: {
      id: true,
      startDate: true,
      endDate: true,
      updatedAt: true,
      goals: {
        select: {
          id: true,
          title: true,
          description: true,
          sortOrder: true,
        },
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });
  const updatedPlan = updatedPlanRecord as UpdatedImprovementPlanContentRecord;

  if (datesUpdated) {
    await db.auditEvent.create({
      data: {
        orgId: context.orgId,
        actorUserId: context.userId,
        action: "IMPROVEMENT_PLAN_DATES_UPDATED",
        entityType: "ImprovementPlan",
        entityId: plan.id,
        metadata: {
          previousStartDate: plan.startDate.toISOString(),
          nextStartDate: updatedPlan.startDate.toISOString(),
          previousEndDate: plan.endDate.toISOString(),
          nextEndDate: updatedPlan.endDate.toISOString(),
        },
      },
    });
  }

  if (goalsUpdated) {
    await db.auditEvent.create({
      data: {
        orgId: context.orgId,
        actorUserId: context.userId,
        action: "IMPROVEMENT_PLAN_GOALS_UPDATED",
        entityType: "ImprovementPlan",
        entityId: plan.id,
        metadata: {
          previousGoalCount: plan.goals.length,
          nextGoalCount: updatedPlan.goals.length,
        },
      },
    });
  }

  return {
    id: updatedPlan.id,
    startDate: updatedPlan.startDate.toISOString(),
    endDate: updatedPlan.endDate.toISOString(),
    updatedAt: updatedPlan.updatedAt.toISOString(),
    goals: updatedPlan.goals.map((goal) => ({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      sortOrder: goal.sortOrder,
    })),
  };
}

export async function listImprovementPlanAuditEvents(
  planId: string,
  context: RequestContext,
  db: ImprovementPlanDb = prisma as unknown as ImprovementPlanDb,
): Promise<ImprovementPlanAuditEvent[]> {
  const parsedPlanId = parsePlanId(planId);

  const plan = await loadPlanAccessRecord(parsedPlanId, context.orgId, db);
  const viewerEmployeeId = await resolveViewerEmployeeId(context, db);

  if (!canAccessPlan(plan, context, viewerEmployeeId)) {
    throw new AppError("FORBIDDEN", "You are not allowed to access this plan audit log", 403);
  }

  const events = await db.auditEvent.findMany({
    where: {
      orgId: context.orgId,
      entityType: "ImprovementPlan",
      entityId: plan.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 200,
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
          employee: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  return events.map(mapAuditRecord);
}

export async function requestImprovementPlanExport(
  planId: string,
  context: RequestContext,
  db: ImprovementPlanDb = prisma as unknown as ImprovementPlanDb,
): Promise<ImprovementPlanExportPlaceholder> {
  const parsedPlanId = parsePlanId(planId);

  const plan = await loadPlanAccessRecord(parsedPlanId, context.orgId, db);
  const viewerEmployeeId = await resolveViewerEmployeeId(context, db);

  if (!canAccessPlan(plan, context, viewerEmployeeId)) {
    throw new AppError("FORBIDDEN", "You are not allowed to export this improvement plan", 403);
  }

  await db.auditEvent.create({
    data: {
      orgId: context.orgId,
      actorUserId: context.userId,
      action: "IMPROVEMENT_PLAN_EXPORT_REQUESTED",
      entityType: "ImprovementPlan",
      entityId: plan.id,
      metadata: {
        status: plan.status,
        outcome: plan.outcome,
      },
    },
  });

  return {
    planId: plan.id,
    requestedAt: new Date().toISOString(),
    message:
      "Improvement plan export is not available yet. Use the timeline and audit log views for now.",
  };
}

async function resolveViewerEmployeeId(
  context: RequestContext,
  db: ImprovementPlanDb,
): Promise<string | null> {
  if (context.role === UserRole.HR_ADMIN) {
    return null;
  }

  const viewer = await db.employee.findFirst({
    where: {
      orgId: context.orgId,
      userId: context.userId,
    },
    select: {
      id: true,
      userId: true,
      managerId: true,
      firstName: true,
      lastName: true,
    },
  });

  if (!viewer) {
    throw new AppError("FORBIDDEN", "User is not mapped to an employee profile", 403);
  }

  return viewer.id;
}

function buildPlanScopeWhere(
  context: RequestContext,
  viewerEmployeeId: string | null,
): Record<string, unknown> {
  if (context.role === UserRole.HR_ADMIN) {
    return {
      orgId: context.orgId,
    };
  }

  if (!viewerEmployeeId) {
    throw new AppError("FORBIDDEN", "User is not allowed to access improvement plans", 403);
  }

  return {
    orgId: context.orgId,
    OR: [
      {
        subjectEmployeeId: viewerEmployeeId,
      },
      {
        managerEmployeeId: viewerEmployeeId,
      },
      {
        hrOwnerEmployeeId: viewerEmployeeId,
      },
    ],
  };
}

function canAccessPlan(
  plan: {
    subjectEmployeeId: string;
    managerEmployeeId: string;
    hrOwnerEmployeeId: string | null;
  },
  context: RequestContext,
  viewerEmployeeId: string | null,
): boolean {
  if (context.role === UserRole.HR_ADMIN) {
    return true;
  }

  if (!viewerEmployeeId) {
    return false;
  }

  return (
    plan.subjectEmployeeId === viewerEmployeeId ||
    plan.managerEmployeeId === viewerEmployeeId ||
    plan.hrOwnerEmployeeId === viewerEmployeeId
  );
}

function parsePlanId(planId: string): string {
  const parsed = planIdSchema.safeParse({ planId });
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Invalid improvement plan identifier",
      400,
      parsed.error.flatten(),
    );
  }

  return parsed.data.planId;
}

async function loadPlanAccessRecord(
  planId: string,
  orgId: string,
  db: ImprovementPlanDb,
): Promise<ImprovementPlanAccessRecord> {
  const planRecord = await db.improvementPlan.findFirst({
    where: {
      id: planId,
      orgId,
    },
    select: {
      id: true,
      orgId: true,
      subjectEmployeeId: true,
      managerEmployeeId: true,
      hrOwnerEmployeeId: true,
      status: true,
      outcome: true,
    },
  });

  const plan = planRecord as ImprovementPlanAccessRecord | null;
  if (!plan) {
    throw new AppError("NOT_FOUND", "Improvement plan not found", 404);
  }

  return plan;
}

async function loadPlanEditRecord(
  planId: string,
  orgId: string,
  db: ImprovementPlanDb,
): Promise<ImprovementPlanEditRecord> {
  const planRecord = await db.improvementPlan.findFirst({
    where: {
      id: planId,
      orgId,
    },
    select: {
      id: true,
      orgId: true,
      subjectEmployeeId: true,
      managerEmployeeId: true,
      hrOwnerEmployeeId: true,
      status: true,
      outcome: true,
      startDate: true,
      endDate: true,
      goals: {
        select: {
          id: true,
          sortOrder: true,
        },
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  const plan = planRecord as ImprovementPlanEditRecord | null;
  if (!plan) {
    throw new AppError("NOT_FOUND", "Improvement plan not found", 404);
  }

  return plan;
}

function normalizeTransitionOutcome(
  plan: ImprovementPlanAccessRecord,
  targetStatus: ImprovementPlanStatus,
  requestedOutcome: ImprovementPlanOutcome | null,
): ImprovementPlanOutcome | null {
  const allowedTargets = allowedStatusTransitions[plan.status];
  if (!allowedTargets.includes(targetStatus)) {
    throw new AppError(
      "INVALID_STATUS_TRANSITION",
      `Invalid status transition from ${plan.status} to ${targetStatus}`,
      400,
    );
  }

  if (targetStatus === ImprovementPlanStatus.COMPLETED) {
    if (!requestedOutcome) {
      throw new AppError(
        "VALIDATION_ERROR",
        "outcome is required when transitioning to COMPLETED",
        400,
      );
    }

    return requestedOutcome;
  }

  if (requestedOutcome) {
    throw new AppError(
      "VALIDATION_ERROR",
      "outcome can only be set when targetStatus is COMPLETED",
      400,
    );
  }

  return null;
}

function buildTransitionNote(
  previousStatus: ImprovementPlanStatus,
  nextStatus: ImprovementPlanStatus,
  nextOutcome: ImprovementPlanOutcome | null,
): string {
  if (nextStatus === ImprovementPlanStatus.COMPLETED && nextOutcome) {
    return `Status changed from ${previousStatus} to ${nextStatus} (${nextOutcome}).`;
  }

  return `Status changed from ${previousStatus} to ${nextStatus}.`;
}

function mapCheckInRecord(record: ImprovementPlanCheckInRecord): ImprovementPlanTimelineEntry {
  return {
    id: record.id,
    authorName: record.authorUser.employee
      ? `${record.authorUser.employee.firstName} ${record.authorUser.employee.lastName}`
      : record.authorUser.email,
    authorUserId: record.authorUser.id,
    note: record.content,
    timestamp: record.checkInAt.toISOString(),
    status: record.status,
    outcome: record.outcome,
  };
}

function mapAuditRecord(record: ImprovementPlanAuditRecord): ImprovementPlanAuditEvent {
  const actorName = record.actorUser.employee
    ? `${record.actorUser.employee.firstName} ${record.actorUser.employee.lastName}`
    : record.actorUser.email;

  return {
    id: record.id,
    timestamp: record.createdAt.toISOString(),
    actorName,
    actorUserId: record.actorUser.id,
    action: record.action,
    description: buildAuditDescription(record.action, record.metadata),
  };
}

function buildAuditDescription(
  action: string,
  metadata: Record<string, unknown> | null,
): string {
  if (action === "IMPROVEMENT_PLAN_CREATED") {
    return "Created the improvement plan.";
  }

  if (action === "IMPROVEMENT_PLAN_CHECKIN_CREATED") {
    return "Added a timeline check-in update.";
  }

  if (action === "IMPROVEMENT_PLAN_STATUS_CHANGED") {
    const nextStatus =
      typeof metadata?.nextStatus === "string" ? metadata.nextStatus : "updated";
    const nextOutcome =
      typeof metadata?.nextOutcome === "string" ? ` (${metadata.nextOutcome})` : "";
    return `Changed plan status to ${nextStatus}${nextOutcome}.`;
  }

  if (action === "IMPROVEMENT_PLAN_DATES_UPDATED") {
    return "Updated plan date range.";
  }

  if (action === "IMPROVEMENT_PLAN_GOALS_UPDATED") {
    return "Updated plan goals.";
  }

  if (action === "IMPROVEMENT_PLAN_EXPORT_REQUESTED") {
    return "Requested a plan export.";
  }

  return "Recorded plan activity.";
}

const checkInSelection = {
  id: true,
  content: true,
  status: true,
  outcome: true,
  checkInAt: true,
  createdAt: true,
  authorUser: {
    select: {
      id: true,
      email: true,
      employee: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  },
};

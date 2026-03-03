import {
  CycleStatus,
  CycleVisibilityPolicy,
  PeerAssignmentMode,
  ReviewRelationship,
  ReviewSubmissionStatus,
  UserRole,
} from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/http/errors";
import {
  resolveScorecardMetricConfig,
  scorecardMetricListSchema,
} from "@/server/scorecard/scorecard-config";

interface ReviewCycleRecord {
  id: string;
  orgId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: CycleStatus;
  visibilityPolicy: CycleVisibilityPolicy;
  selfReviewRequired: boolean;
  managerReviewRequired: boolean;
  peerReviewCount: number;
  peerAssignmentMode: PeerAssignmentMode;
  upwardReviewCount: number;
  upwardReviewsForManagersOnly: boolean;
  selfReviewDueAt: Date | null;
  managerReviewDueAt: Date | null;
  peerReviewDueAt: Date | null;
  upwardReviewDueAt: Date | null;
}

interface ReviewCycleListRecord {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: CycleStatus;
  visibilityPolicy: CycleVisibilityPolicy;
  selfReviewRequired: boolean;
  managerReviewRequired: boolean;
  peerReviewCount: number;
  peerAssignmentMode: PeerAssignmentMode;
  upwardReviewCount: number;
  upwardReviewsForManagersOnly: boolean;
  selfReviewDueAt: Date | null;
  managerReviewDueAt: Date | null;
  peerReviewDueAt: Date | null;
  upwardReviewDueAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface EmployeeSummary {
  id: string;
  firstName: string;
  lastName: string;
  department: string | null;
  title: string | null;
  managerId: string | null;
}

interface PacketRecord {
  id: string;
  subjectEmployeeId: string;
}

interface CreateManyResult {
  count: number;
}

interface SubmissionStatusCountRecord {
  cycleId: string;
  status: ReviewSubmissionStatus;
  _count: {
    _all: number;
  };
}

interface SubmissionRelationshipCountRecord {
  cycleId: string;
  relationship: ReviewRelationship;
  _count: {
    _all: number;
  };
}

interface AdminCycleDb {
  reviewCycle: {
    create: (args: {
      data: Record<string, unknown>;
    }) => Promise<ReviewCycleRecord>;
    findFirst: (args: {
      where: { id: string; orgId: string };
      select: {
        id: true;
        orgId: true;
        status: true;
        selfReviewRequired: true;
        managerReviewRequired: true;
        peerReviewCount: true;
        peerAssignmentMode: true;
        upwardReviewCount: true;
        upwardReviewsForManagersOnly: true;
        selfReviewDueAt: true;
        managerReviewDueAt: true;
        peerReviewDueAt: true;
        upwardReviewDueAt: true;
      };
    }) => Promise<
      | {
          id: string;
          orgId: string;
          status: CycleStatus;
          selfReviewRequired: boolean;
          managerReviewRequired: boolean;
          peerReviewCount: number;
          peerAssignmentMode: PeerAssignmentMode;
          upwardReviewCount: number;
          upwardReviewsForManagersOnly: boolean;
          selfReviewDueAt: Date | null;
          managerReviewDueAt: Date | null;
          peerReviewDueAt: Date | null;
          upwardReviewDueAt: Date | null;
        }
      | null
    >;
    findMany: (args: {
      where: { orgId: string };
      select: {
        id: true;
        name: true;
        startDate: true;
        endDate: true;
        status: true;
        visibilityPolicy: true;
        selfReviewRequired: true;
        managerReviewRequired: true;
        peerReviewCount: true;
        peerAssignmentMode: true;
        upwardReviewCount: true;
        upwardReviewsForManagersOnly: true;
        selfReviewDueAt: true;
        managerReviewDueAt: true;
        peerReviewDueAt: true;
        upwardReviewDueAt: true;
        createdAt: true;
        updatedAt: true;
      };
      orderBy: {
        startDate: "desc";
      };
    }) => Promise<ReviewCycleListRecord[]>;
    update: (args: {
      where: { id: string };
      data: {
        status: CycleStatus;
      };
      select: {
        id: true;
        status: true;
      };
    }) => Promise<{ id: string; status: CycleStatus }>;
  };
  employee: {
    findMany: (args: {
      where: { orgId: string };
      select: {
        id: true;
        firstName: true;
        lastName: true;
        department: true;
        title: true;
        managerId: true;
      };
      orderBy: { id: "asc" };
    }) => Promise<EmployeeSummary[]>;
  };
  reviewPacket: {
    createMany: (args: {
      data: {
        orgId: string;
        cycleId: string;
        subjectEmployeeId: string;
        snapshotDepartment?: string | null;
        snapshotTitle?: string | null;
        snapshotManagerEmployeeId?: string | null;
        snapshotManagerName?: string | null;
      }[];
      skipDuplicates: boolean;
    }) => Promise<CreateManyResult>;
    findMany: (args: {
      where: { orgId: string; cycleId: string };
      select: { id: true; subjectEmployeeId: true };
    }) => Promise<PacketRecord[]>;
  };
  reviewSubmission: {
    createMany: (args: {
      data: {
        orgId: string;
        cycleId: string;
        packetId: string;
        subjectEmployeeId: string;
        reviewerEmployeeId: string;
        relationship: ReviewRelationship;
        status: ReviewSubmissionStatus;
        dueAt?: Date | null;
      }[];
      skipDuplicates: boolean;
    }) => Promise<CreateManyResult>;
    groupBy: (args: {
      by: ["cycleId", "status"] | ["cycleId", "relationship"];
      where: {
        orgId: string;
      };
      _count: {
        _all: true;
      };
    }) => Promise<SubmissionStatusCountRecord[] | SubmissionRelationshipCountRecord[]>;
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
  };
}

export interface AdminContext {
  userId: string;
  orgId: string;
  role: UserRole;
}

const createReviewCycleSchema = z
  .object({
    name: z.string().trim().min(3).max(120),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    visibilityPolicy: z
      .nativeEnum(CycleVisibilityPolicy)
      .default(CycleVisibilityPolicy.EMPLOYEE_AFTER_RELEASE),
    selfReviewRequired: z.boolean().default(true),
    managerReviewRequired: z.boolean().default(true),
    peerReviewCount: z.number().int().min(0).max(20).default(0),
    peerAssignmentMode: z.nativeEnum(PeerAssignmentMode).default(PeerAssignmentMode.HR_ASSIGNED),
    upwardReviewCount: z.number().int().min(0).max(20).default(0),
    upwardReviewsForManagersOnly: z.boolean().default(true),
    selfReviewDueAt: z.string().datetime().optional(),
    managerReviewDueAt: z.string().datetime().optional(),
    peerReviewDueAt: z.string().datetime().optional(),
    upwardReviewDueAt: z.string().datetime().optional(),
    scorecardMetrics: scorecardMetricListSchema.optional(),
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

    const dueDateFields = [
      ["selfReviewDueAt", value.selfReviewDueAt],
      ["managerReviewDueAt", value.managerReviewDueAt],
      ["peerReviewDueAt", value.peerReviewDueAt],
      ["upwardReviewDueAt", value.upwardReviewDueAt],
    ] as const;

    for (const [path, dueDateValue] of dueDateFields) {
      if (!dueDateValue) {
        continue;
      }

      const dueDate = new Date(dueDateValue);
      if (Number.isNaN(dueDate.getTime())) {
        continue;
      }

      if (dueDate < startDate || dueDate > endDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [path],
          message: `${path} must be inside the cycle window`,
        });
      }
    }
  });

const transitionCycleStatusSchema = z.object({
  targetStatus: z.nativeEnum(CycleStatus),
});

const nextCycleStatusMap: Record<CycleStatus, CycleStatus | null> = {
  [CycleStatus.DRAFT]: CycleStatus.ACTIVE,
  [CycleStatus.ACTIVE]: CycleStatus.LOCKED,
  [CycleStatus.LOCKED]: CycleStatus.RELEASED,
  [CycleStatus.RELEASED]: null,
};

function requireHrAdmin(context: AdminContext): void {
  if (context.role !== UserRole.HR_ADMIN) {
    throw new AppError("FORBIDDEN", "Only HR admins can perform this action", 403);
  }
}

export interface ReviewCycleListItem {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: CycleStatus;
  visibilityPolicy: CycleVisibilityPolicy;
  selfReviewRequired: boolean;
  managerReviewRequired: boolean;
  peerReviewCount: number;
  peerAssignmentMode: PeerAssignmentMode;
  upwardReviewCount: number;
  upwardReviewsForManagersOnly: boolean;
  selfReviewDueAt: string | null;
  managerReviewDueAt: string | null;
  peerReviewDueAt: string | null;
  upwardReviewDueAt: string | null;
  submissionStatusCounts: {
    NOT_STARTED: number;
    IN_PROGRESS: number;
    SUBMITTED: number;
    RETURNED: number;
  };
  submissionRelationshipCounts: {
    SELF: number;
    MANAGER: number;
    PEER: number;
    UPWARD: number;
  };
  createdAt: string;
  updatedAt: string;
}

export async function listReviewCycles(
  context: AdminContext,
  db: AdminCycleDb = prisma as unknown as AdminCycleDb,
): Promise<ReviewCycleListItem[]> {
  requireHrAdmin(context);

  const [cycles, statusCountsRaw, relationshipCountsRaw] = await Promise.all([
    db.reviewCycle.findMany({
      where: { orgId: context.orgId },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        status: true,
        visibilityPolicy: true,
        selfReviewRequired: true,
        managerReviewRequired: true,
        peerReviewCount: true,
        peerAssignmentMode: true,
        upwardReviewCount: true,
        upwardReviewsForManagersOnly: true,
        selfReviewDueAt: true,
        managerReviewDueAt: true,
        peerReviewDueAt: true,
        upwardReviewDueAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        startDate: "desc",
      },
    }),
    db.reviewSubmission.groupBy({
      by: ["cycleId", "status"],
      where: { orgId: context.orgId },
      _count: { _all: true },
    }) as Promise<SubmissionStatusCountRecord[]>,
    db.reviewSubmission.groupBy({
      by: ["cycleId", "relationship"],
      where: { orgId: context.orgId },
      _count: { _all: true },
    }) as Promise<SubmissionRelationshipCountRecord[]>,
  ]);

  const statusCountsByCycle = new Map<
    string,
    {
      NOT_STARTED: number;
      IN_PROGRESS: number;
      SUBMITTED: number;
      RETURNED: number;
    }
  >();

  for (const count of statusCountsRaw) {
    const current = statusCountsByCycle.get(count.cycleId) ?? {
      NOT_STARTED: 0,
      IN_PROGRESS: 0,
      SUBMITTED: 0,
      RETURNED: 0,
    };
    current[count.status] = count._count._all;
    statusCountsByCycle.set(count.cycleId, current);
  }

  const relationshipCountsByCycle = new Map<
    string,
    {
      SELF: number;
      MANAGER: number;
      PEER: number;
      UPWARD: number;
    }
  >();

  for (const count of relationshipCountsRaw) {
    const current = relationshipCountsByCycle.get(count.cycleId) ?? {
      SELF: 0,
      MANAGER: 0,
      PEER: 0,
      UPWARD: 0,
    };
    current[count.relationship] = count._count._all;
    relationshipCountsByCycle.set(count.cycleId, current);
  }

  return cycles.map((cycle) => ({
    id: cycle.id,
    name: cycle.name,
    startDate: cycle.startDate.toISOString(),
    endDate: cycle.endDate.toISOString(),
    status: cycle.status,
    visibilityPolicy: cycle.visibilityPolicy,
    selfReviewRequired: cycle.selfReviewRequired,
    managerReviewRequired: cycle.managerReviewRequired,
    peerReviewCount: cycle.peerReviewCount,
    peerAssignmentMode: cycle.peerAssignmentMode,
    upwardReviewCount: cycle.upwardReviewCount,
    upwardReviewsForManagersOnly: cycle.upwardReviewsForManagersOnly,
    selfReviewDueAt: cycle.selfReviewDueAt?.toISOString() ?? null,
    managerReviewDueAt: cycle.managerReviewDueAt?.toISOString() ?? null,
    peerReviewDueAt: cycle.peerReviewDueAt?.toISOString() ?? null,
    upwardReviewDueAt: cycle.upwardReviewDueAt?.toISOString() ?? null,
    submissionStatusCounts: statusCountsByCycle.get(cycle.id) ?? {
      NOT_STARTED: 0,
      IN_PROGRESS: 0,
      SUBMITTED: 0,
      RETURNED: 0,
    },
    submissionRelationshipCounts: relationshipCountsByCycle.get(cycle.id) ?? {
      SELF: 0,
      MANAGER: 0,
      PEER: 0,
      UPWARD: 0,
    },
    createdAt: cycle.createdAt.toISOString(),
    updatedAt: cycle.updatedAt.toISOString(),
  }));
}

export async function createReviewCycle(
  input: unknown,
  context: AdminContext,
  db: AdminCycleDb = prisma as unknown as AdminCycleDb,
): Promise<ReviewCycleRecord> {
  requireHrAdmin(context);
  const parsed = createReviewCycleSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError("VALIDATION_ERROR", "Invalid cycle payload", 400, parsed.error.flatten());
  }

  const scorecardMetrics = resolveScorecardMetricConfig(parsed.data.scorecardMetrics);
  const endDate = new Date(parsed.data.endDate);
  const cycle = await db.reviewCycle.create({
    data: {
      orgId: context.orgId,
      name: parsed.data.name,
      startDate: new Date(parsed.data.startDate),
      endDate,
      status: CycleStatus.DRAFT,
      visibilityPolicy: parsed.data.visibilityPolicy,
      selfReviewRequired: parsed.data.selfReviewRequired,
      managerReviewRequired: parsed.data.managerReviewRequired,
      peerReviewCount: parsed.data.peerReviewCount,
      peerAssignmentMode: parsed.data.peerAssignmentMode,
      upwardReviewCount: parsed.data.upwardReviewCount,
      upwardReviewsForManagersOnly: parsed.data.upwardReviewsForManagersOnly,
      selfReviewDueAt: parsed.data.selfReviewDueAt ? new Date(parsed.data.selfReviewDueAt) : endDate,
      managerReviewDueAt: parsed.data.managerReviewDueAt
        ? new Date(parsed.data.managerReviewDueAt)
        : endDate,
      peerReviewDueAt: parsed.data.peerReviewDueAt ? new Date(parsed.data.peerReviewDueAt) : endDate,
      upwardReviewDueAt: parsed.data.upwardReviewDueAt
        ? new Date(parsed.data.upwardReviewDueAt)
        : endDate,
      scorecardMetrics: {
        create: scorecardMetrics.map((metric) => ({
          orgId: context.orgId,
          metricKey: metric.metricKey,
          weightPercent: metric.weightPercent,
        })),
      },
    },
  });

  await db.auditEvent.create({
    data: {
      orgId: context.orgId,
      actorUserId: context.userId,
      action: "REVIEW_CYCLE_CREATED",
      entityType: "ReviewCycle",
      entityId: cycle.id,
      metadata: {
        name: cycle.name,
        status: cycle.status,
        scorecardMetricCount: scorecardMetrics.length,
        peerAssignmentMode: cycle.peerAssignmentMode,
      },
    },
  });

  return cycle;
}

export interface GenerateCycleArtifactsResult {
  packetCount: number;
  submissionCount: number;
}

export async function generateCycleArtifacts(
  cycleId: string,
  context: AdminContext,
  db: AdminCycleDb = prisma as unknown as AdminCycleDb,
): Promise<GenerateCycleArtifactsResult> {
  requireHrAdmin(context);
  if (!cycleId) {
    throw new AppError("VALIDATION_ERROR", "cycleId is required", 400);
  }

  const cycle = await db.reviewCycle.findFirst({
    where: {
      id: cycleId,
      orgId: context.orgId,
    },
    select: {
      id: true,
      orgId: true,
      status: true,
      selfReviewRequired: true,
      managerReviewRequired: true,
      peerReviewCount: true,
      peerAssignmentMode: true,
      upwardReviewCount: true,
      upwardReviewsForManagersOnly: true,
      selfReviewDueAt: true,
      managerReviewDueAt: true,
      peerReviewDueAt: true,
      upwardReviewDueAt: true,
    },
  });

  if (!cycle) {
    throw new AppError("NOT_FOUND", "Review cycle not found", 404);
  }

  if (cycle.status !== CycleStatus.DRAFT) {
    throw new AppError(
      "INVALID_CYCLE_STATE",
      "Cycle generation is only allowed in DRAFT status",
      409,
      { status: cycle.status },
    );
  }

  const employees = await db.employee.findMany({
    where: { orgId: context.orgId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      department: true,
      title: true,
      managerId: true,
    },
    orderBy: { id: "asc" },
  });

  if (employees.length === 0) {
    throw new AppError("NO_EMPLOYEES", "No employees found for cycle generation", 400);
  }

  const managerNameByEmployeeId = new Map<string, string>(
    employees.map((employee) => [employee.id, `${employee.firstName} ${employee.lastName}`]),
  );

  const packetInsertResult = await db.reviewPacket.createMany({
    data: employees.map((employee) => ({
      orgId: context.orgId,
      cycleId,
      subjectEmployeeId: employee.id,
      snapshotDepartment: employee.department,
      snapshotTitle: employee.title,
      snapshotManagerEmployeeId: employee.managerId,
      snapshotManagerName: employee.managerId
        ? (managerNameByEmployeeId.get(employee.managerId) ?? null)
        : null,
    })),
    skipDuplicates: true,
  });

  const packets = await db.reviewPacket.findMany({
    where: { orgId: context.orgId, cycleId },
    select: { id: true, subjectEmployeeId: true },
  });

  const packetBySubject = new Map(packets.map((packet) => [packet.subjectEmployeeId, packet.id]));
  const directReportsByManager = buildDirectReportsMap(employees);

  const submissions: {
    orgId: string;
    cycleId: string;
    packetId: string;
    subjectEmployeeId: string;
    reviewerEmployeeId: string;
    relationship: ReviewRelationship;
    status: ReviewSubmissionStatus;
    dueAt: Date | null;
  }[] = [];

  for (const subject of employees) {
    const packetId = packetBySubject.get(subject.id);
    if (!packetId) {
      continue;
    }

    const dedupe = new Set<string>();
    const dueAtByRelationship: Record<ReviewRelationship, Date | null> = {
      [ReviewRelationship.SELF]: cycle.selfReviewDueAt,
      [ReviewRelationship.MANAGER]: cycle.managerReviewDueAt,
      [ReviewRelationship.PEER]: cycle.peerReviewDueAt,
      [ReviewRelationship.UPWARD]: cycle.upwardReviewDueAt,
    };

    const addSubmission = (reviewerEmployeeId: string, relationship: ReviewRelationship) => {
      const key = `${subject.id}:${reviewerEmployeeId}:${relationship}`;
      if (dedupe.has(key)) {
        return;
      }

      dedupe.add(key);
      submissions.push({
        orgId: context.orgId,
        cycleId,
        packetId,
        subjectEmployeeId: subject.id,
        reviewerEmployeeId,
        relationship,
        status: ReviewSubmissionStatus.NOT_STARTED,
        dueAt: dueAtByRelationship[relationship],
      });
    };

    if (cycle.selfReviewRequired) {
      addSubmission(subject.id, ReviewRelationship.SELF);
    }

    if (cycle.managerReviewRequired && subject.managerId) {
      addSubmission(subject.managerId, ReviewRelationship.MANAGER);
    }

    if (cycle.peerReviewCount > 0 && cycle.peerAssignmentMode === PeerAssignmentMode.HR_ASSIGNED) {
      const peers = employees
        .filter((candidate) => candidate.id !== subject.id && candidate.id !== subject.managerId)
        .slice(0, cycle.peerReviewCount);

      for (const peer of peers) {
        addSubmission(peer.id, ReviewRelationship.PEER);
      }
    }

    if (cycle.upwardReviewCount > 0) {
      const directReports = directReportsByManager.get(subject.id) ?? [];
      for (const directReport of directReports.slice(0, cycle.upwardReviewCount)) {
        addSubmission(directReport.id, ReviewRelationship.UPWARD);
      }
    }
  }

  const submissionInsertResult = await db.reviewSubmission.createMany({
    data: submissions,
    skipDuplicates: true,
  });

  await db.auditEvent.create({
    data: {
      orgId: context.orgId,
      actorUserId: context.userId,
      action: "REVIEW_CYCLE_GENERATED",
      entityType: "ReviewCycle",
      entityId: cycle.id,
      metadata: {
        packetCount: packetInsertResult.count,
        submissionCount: submissionInsertResult.count,
      },
    },
  });

  return {
    packetCount: packetInsertResult.count,
    submissionCount: submissionInsertResult.count,
  };
}

export interface TransitionCycleStatusResult {
  cycleId: string;
  previousStatus: CycleStatus;
  status: CycleStatus;
}

export async function transitionReviewCycleStatus(
  cycleId: string,
  input: unknown,
  context: AdminContext,
  db: AdminCycleDb = prisma as unknown as AdminCycleDb,
): Promise<TransitionCycleStatusResult> {
  requireHrAdmin(context);
  if (!cycleId) {
    throw new AppError("VALIDATION_ERROR", "cycleId is required", 400);
  }

  const parsed = transitionCycleStatusSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Invalid cycle status transition payload",
      400,
      parsed.error.flatten(),
    );
  }

  const cycle = await db.reviewCycle.findFirst({
    where: {
      id: cycleId,
      orgId: context.orgId,
    },
    select: {
      id: true,
      orgId: true,
      status: true,
      selfReviewRequired: true,
      managerReviewRequired: true,
      peerReviewCount: true,
      peerAssignmentMode: true,
      upwardReviewCount: true,
      upwardReviewsForManagersOnly: true,
      selfReviewDueAt: true,
      managerReviewDueAt: true,
      peerReviewDueAt: true,
      upwardReviewDueAt: true,
    },
  });

  if (!cycle) {
    throw new AppError("NOT_FOUND", "Review cycle not found", 404);
  }

  const nextAllowedStatus = nextCycleStatusMap[cycle.status];
  if (!nextAllowedStatus || parsed.data.targetStatus !== nextAllowedStatus) {
    throw new AppError(
      "INVALID_CYCLE_TRANSITION",
      "Invalid review cycle status transition",
      409,
      {
        currentStatus: cycle.status,
        targetStatus: parsed.data.targetStatus,
        nextAllowedStatus,
      },
    );
  }

  const updatedCycle = await db.reviewCycle.update({
    where: {
      id: cycle.id,
    },
    data: {
      status: parsed.data.targetStatus,
    },
    select: {
      id: true,
      status: true,
    },
  });

  await db.auditEvent.create({
    data: {
      orgId: context.orgId,
      actorUserId: context.userId,
      action: "REVIEW_CYCLE_STATUS_CHANGED",
      entityType: "ReviewCycle",
      entityId: cycle.id,
      metadata: {
        previousStatus: cycle.status,
        status: updatedCycle.status,
      },
    },
  });

  return {
    cycleId: cycle.id,
    previousStatus: cycle.status,
    status: updatedCycle.status,
  };
}

function buildDirectReportsMap(employees: EmployeeSummary[]): Map<string, EmployeeSummary[]> {
  const map = new Map<string, EmployeeSummary[]>();

  for (const employee of employees) {
    if (!employee.managerId) {
      continue;
    }

    const reports = map.get(employee.managerId) ?? [];
    reports.push(employee);
    map.set(employee.managerId, reports);
  }

  return map;
}

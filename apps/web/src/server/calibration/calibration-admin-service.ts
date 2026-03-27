import { CalibrationBucket, CycleStatus, UserRole } from "@prisma/client";
import { z } from "zod";

import type { RequestContext } from "@/server/auth/request-context";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/http/errors";

const calibrationAdminRoles = new Set<UserRole>([UserRole.HR_ADMIN, UserRole.SUPER_ADMIN]);
const allowedParticipantRoles = new Set<UserRole>([
  UserRole.HR_ADMIN,
  UserRole.MANAGER,
  UserRole.SUPER_ADMIN,
]);

const axisDefinitionSchema = z.object({
  bucket: z.nativeEnum(CalibrationBucket),
  label: z.string().trim().min(1).max(64),
  description: z.string().trim().min(1).max(240),
});

const axisConfigSchema = z.array(axisDefinitionSchema).length(3).superRefine((definitions, context) => {
  const uniqueBuckets = new Set(definitions.map((definition) => definition.bucket));
  if (uniqueBuckets.size !== 3) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Axis configuration must contain LOW, MEDIUM, and HIGH buckets exactly once",
    });
  }
});

const createCalibrationSessionSchema = z.object({
  cycleId: z.string().trim().min(1),
  name: z.string().trim().min(3).max(160),
  roleGroup: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional().nullable(),
  isRestricted: z.boolean().optional(),
  cohortEmployeeIds: z.array(z.string().trim().min(1)).min(1).max(400),
  participantUserIds: z.array(z.string().trim().min(1)).min(1).max(200),
  performanceAxis: axisConfigSchema.optional(),
  potentialAxis: axisConfigSchema.optional(),
});

const defaultPerformanceAxis: CalibrationAxisDefinition[] = [
  {
    bucket: CalibrationBucket.LOW,
    label: "Needs support",
    description: "Consistently below this cycle's expectations.",
  },
  {
    bucket: CalibrationBucket.MEDIUM,
    label: "Meets expectations",
    description: "Delivers solid results at the expected level.",
  },
  {
    bucket: CalibrationBucket.HIGH,
    label: "Exceeds expectations",
    description: "Delivers standout results beyond expected scope.",
  },
];

const defaultPotentialAxis: CalibrationAxisDefinition[] = [
  {
    bucket: CalibrationBucket.LOW,
    label: "Current scope",
    description: "Effective in the current scope with limited near-term expansion.",
  },
  {
    bucket: CalibrationBucket.MEDIUM,
    label: "Growth ready",
    description: "Can take broader scope with coaching and support.",
  },
  {
    bucket: CalibrationBucket.HIGH,
    label: "Accelerated growth",
    description: "Shows strong readiness for larger and more complex scope.",
  },
];

interface CalibrationSessionCreateRecord {
  id: string;
  name: string;
  roleGroup: string | null;
  isRestricted: boolean;
  isFinalized: boolean;
  createdAt: Date;
  cycle: {
    id: string;
    name: string;
    status: CycleStatus;
  };
  placements: { id: string }[];
  participants: { id: string }[];
}

interface CalibrationSessionListRecord {
  id: string;
  name: string;
  roleGroup: string | null;
  isRestricted: boolean;
  isFinalized: boolean;
  finalizedAt: Date | null;
  createdAt: Date;
  cycle: {
    id: string;
    name: string;
    status: CycleStatus;
  };
  placements: { id: string }[];
  participants: { id: string }[];
}

interface CalibrationAdminDb {
  reviewCycle: {
    findFirst: (args: {
      where: { id: string; orgId: string };
      select: { id: true; name: true; status: true };
    }) => Promise<{ id: string; name: string; status: CycleStatus } | null>;
  };
  employee: {
    findMany: (args: {
      where: { orgId: string; id: { in: string[] } };
      select: { id: true };
    }) => Promise<{ id: string }[]>;
  };
  user: {
    findMany: (args: {
      where: { orgId: string; id: { in: string[] } };
      select: { id: true; role: true };
    }) => Promise<{ id: string; role: UserRole }[]>;
  };
  calibrationSession: {
    create: (args: {
      data: {
        orgId: string;
        cycleId: string;
        name: string;
        roleGroup: string;
        description: string | null;
        isRestricted: boolean;
        performanceAxisConfig: CalibrationAxisDefinition[];
        potentialAxisConfig: CalibrationAxisDefinition[];
        placements: {
          create: {
            orgId: string;
            employeeId: string;
            performanceBucket: CalibrationBucket;
            potentialBucket: CalibrationBucket;
          }[];
        };
        participants: {
          create: {
            orgId: string;
            userId: string;
          }[];
        };
      };
      select: {
        id: true;
        name: true;
        roleGroup: true;
        isRestricted: true;
        isFinalized: true;
        createdAt: true;
        cycle: {
          select: {
            id: true;
            name: true;
            status: true;
          };
        };
        placements: {
          select: {
            id: true;
          };
        };
        participants: {
          select: {
            id: true;
          };
        };
      };
    }) => Promise<CalibrationSessionCreateRecord>;
    findMany: (args: {
      where: { orgId: string; isRestricted?: boolean };
      orderBy: { createdAt: "desc" };
      select: {
        id: true;
        name: true;
        roleGroup: true;
        isRestricted: true;
        isFinalized: true;
        finalizedAt: true;
        createdAt: true;
        cycle: {
          select: {
            id: true;
            name: true;
            status: true;
          };
        };
        placements: {
          select: {
            id: true;
          };
        };
        participants: {
          select: {
            id: true;
          };
        };
      };
    }) => Promise<CalibrationSessionListRecord[]>;
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

export interface CalibrationAxisDefinition {
  bucket: CalibrationBucket;
  label: string;
  description: string;
}

export interface CreatedCalibrationSession {
  id: string;
  cycleId: string;
  cycleName: string;
  cycleStatus: CycleStatus;
  name: string;
  roleGroup: string | null;
  isRestricted: boolean;
  isFinalized: boolean;
  cohortCount: number;
  participantCount: number;
  createdAt: string;
}

export interface CalibrationSessionListItem {
  id: string;
  cycleId: string;
  cycleName: string;
  cycleStatus: CycleStatus;
  name: string;
  roleGroup: string | null;
  isRestricted: boolean;
  isFinalized: boolean;
  finalizedAt: string | null;
  cohortCount: number;
  participantCount: number;
  createdAt: string;
}

export async function createCalibrationSession(
  input: unknown,
  context: RequestContext,
  db: CalibrationAdminDb = prisma as unknown as CalibrationAdminDb,
): Promise<CreatedCalibrationSession> {
  requireCalibrationAdminRole(context);

  const parsed = createCalibrationSessionSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Invalid calibration session payload",
      400,
      parsed.error.flatten(),
    );
  }

  const cohortEmployeeIds = uniqueIds(parsed.data.cohortEmployeeIds);
  const participantUserIds = uniqueIds([...parsed.data.participantUserIds, context.userId]);
  const performanceAxis = parsed.data.performanceAxis ?? defaultPerformanceAxis;
  const potentialAxis = parsed.data.potentialAxis ?? defaultPotentialAxis;
  const isRestricted = parsed.data.isRestricted ?? false;

  if (isRestricted && context.role !== UserRole.SUPER_ADMIN) {
    throw new AppError(
      "FORBIDDEN",
      "Only super admins can create restricted calibration sessions",
      403,
    );
  }

  const cycle = await db.reviewCycle.findFirst({
    where: {
      id: parsed.data.cycleId,
      orgId: context.orgId,
    },
    select: {
      id: true,
      name: true,
      status: true,
    },
  });
  if (!cycle) {
    throw new AppError("NOT_FOUND", "Review cycle not found", 404);
  }

  if (cycle.status !== CycleStatus.LOCKED && cycle.status !== CycleStatus.RELEASED) {
    throw new AppError(
      "INVALID_CYCLE_STATE",
      "Calibration sessions can only be created after the review cycle is locked",
      409,
      { cycleStatus: cycle.status },
    );
  }

  const cohortEmployees = await db.employee.findMany({
    where: {
      orgId: context.orgId,
      id: {
        in: cohortEmployeeIds,
      },
    },
    select: {
      id: true,
    },
  });
  if (cohortEmployees.length !== cohortEmployeeIds.length) {
    const foundIds = new Set(cohortEmployees.map((employee) => employee.id));
    const missingEmployeeIds = cohortEmployeeIds.filter((employeeId) => !foundIds.has(employeeId));
    throw new AppError("VALIDATION_ERROR", "Some cohort employees were not found", 400, {
      missingEmployeeIds,
    });
  }

  const participants = await db.user.findMany({
    where: {
      orgId: context.orgId,
      id: {
        in: participantUserIds,
      },
    },
    select: {
      id: true,
      role: true,
    },
  });
  if (participants.length !== participantUserIds.length) {
    const foundIds = new Set(participants.map((participant) => participant.id));
    const missingParticipantUserIds = participantUserIds.filter((userId) => !foundIds.has(userId));
    throw new AppError("VALIDATION_ERROR", "Some participants were not found", 400, {
      missingParticipantUserIds,
    });
  }

  const invalidParticipantIds = participants
    .filter((participant) => !allowedParticipantRoles.has(participant.role))
    .map((participant) => participant.id);
  if (invalidParticipantIds.length > 0) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Participants must be HR admins, managers, or super admins",
      400,
      { invalidParticipantUserIds: invalidParticipantIds },
    );
  }

  const createdSession = await db.calibrationSession.create({
    data: {
      orgId: context.orgId,
      cycleId: cycle.id,
      name: parsed.data.name,
      roleGroup: parsed.data.roleGroup,
      description: parsed.data.description ?? null,
      isRestricted,
      performanceAxisConfig: performanceAxis,
      potentialAxisConfig: potentialAxis,
      placements: {
        create: cohortEmployeeIds.map((employeeId) => ({
          orgId: context.orgId,
          employeeId,
          performanceBucket: CalibrationBucket.MEDIUM,
          potentialBucket: CalibrationBucket.MEDIUM,
        })),
      },
      participants: {
        create: participantUserIds.map((userId) => ({
          orgId: context.orgId,
          userId,
        })),
      },
    },
    select: {
      id: true,
      name: true,
      roleGroup: true,
      isRestricted: true,
      isFinalized: true,
      createdAt: true,
      cycle: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
      placements: {
        select: {
          id: true,
        },
      },
      participants: {
        select: {
          id: true,
        },
      },
    },
  });

  await db.auditEvent.create({
    data: {
      orgId: context.orgId,
      actorUserId: context.userId,
      action: "CALIBRATION_SESSION_CREATED",
      entityType: "CalibrationSession",
      entityId: createdSession.id,
      metadata: {
        cycleId: createdSession.cycle.id,
        roleGroup: createdSession.roleGroup,
        isRestricted: createdSession.isRestricted,
        cohortCount: createdSession.placements.length,
        participantCount: createdSession.participants.length,
      },
    },
  });

  return {
    id: createdSession.id,
    cycleId: createdSession.cycle.id,
    cycleName: createdSession.cycle.name,
    cycleStatus: createdSession.cycle.status,
    name: createdSession.name,
    roleGroup: createdSession.roleGroup,
    isRestricted: createdSession.isRestricted,
    isFinalized: createdSession.isFinalized,
    cohortCount: createdSession.placements.length,
    participantCount: createdSession.participants.length,
    createdAt: createdSession.createdAt.toISOString(),
  };
}

export async function listCalibrationSessions(
  context: RequestContext,
  db: CalibrationAdminDb = prisma as unknown as CalibrationAdminDb,
): Promise<CalibrationSessionListItem[]> {
  requireCalibrationAdminRole(context);

  const sessions = await db.calibrationSession.findMany({
    where: {
      orgId: context.orgId,
      ...(context.role === UserRole.HR_ADMIN ? { isRestricted: false } : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      roleGroup: true,
      isRestricted: true,
      isFinalized: true,
      finalizedAt: true,
      createdAt: true,
      cycle: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
      placements: {
        select: {
          id: true,
        },
      },
      participants: {
        select: {
          id: true,
        },
      },
    },
  });

  return sessions.map((session) => ({
    id: session.id,
    cycleId: session.cycle.id,
    cycleName: session.cycle.name,
    cycleStatus: session.cycle.status,
    name: session.name,
    roleGroup: session.roleGroup,
    isRestricted: session.isRestricted,
    isFinalized: session.isFinalized,
    finalizedAt: session.finalizedAt?.toISOString() ?? null,
    cohortCount: session.placements.length,
    participantCount: session.participants.length,
    createdAt: session.createdAt.toISOString(),
  }));
}

function requireCalibrationAdminRole(context: RequestContext): void {
  if (!calibrationAdminRoles.has(context.role)) {
    throw new AppError(
      "FORBIDDEN",
      "Only HR admins and super admins can manage calibration sessions",
      403,
    );
  }
}

function uniqueIds(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

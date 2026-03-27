import {
  CalibrationBucket,
  CycleStatus,
  FinalRatingSource,
  ReviewSubmissionStatus,
  UserRole,
} from "@prisma/client";
import { z } from "zod";

import type { RequestContext } from "@/server/auth/request-context";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/http/errors";

interface CalibrationSessionPlacementRecord {
  id: string;
  employeeId: string;
  performanceBucket: CalibrationBucket;
  potentialBucket: CalibrationBucket;
  justificationNote: string | null;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    managerId: string | null;
    manager: {
      id: string;
      firstName: string;
      lastName: string;
    } | null;
  };
}

interface CalibrationSessionRecord {
  id: string;
  orgId: string;
  cycleId: string;
  name: string;
  roleGroup: string | null;
  isRestricted: boolean;
  performanceAxisConfig: unknown;
  potentialAxisConfig: unknown;
  isFinalized: boolean;
  finalizedAt: Date | null;
  cycle: {
    id: string;
    name: string;
    status: CycleStatus;
  };
  participants: {
    id: string;
  }[];
  placements: CalibrationSessionPlacementRecord[];
}

interface CalibrationPlacementAccessRecord {
  id: string;
  employeeId: string;
  performanceBucket: CalibrationBucket;
  potentialBucket: CalibrationBucket;
  justificationNote: string | null;
  employee: {
    id: string;
    managerId: string | null;
  };
  session: {
    id: string;
    cycleId: string;
    isRestricted: boolean;
    isFinalized: boolean;
  };
}

interface ViewerEmployeeRecord {
  id: string;
}

interface ReviewPacketSummaryRecord {
  subjectEmployeeId: string;
  submissions: {
    status: ReviewSubmissionStatus;
  }[];
}

interface CalibrationSessionDb {
  calibrationSession: {
    findFirst: (args: {
      where: {
        id: string;
        orgId: string;
      };
      select: Record<string, unknown>;
    }) => Promise<CalibrationSessionRecord | null>;
    update: (args: {
      where: {
        id: string;
      };
      data: {
        isFinalized: boolean;
        finalizedAt: Date;
      };
      select: {
        id: true;
        isRestricted: true;
        isFinalized: true;
        finalizedAt: true;
      };
    }) => Promise<{ id: string; isRestricted: boolean; isFinalized: boolean; finalizedAt: Date | null }>;
  };
  calibrationSnapshot: {
    create: (args: {
      data: {
        orgId: string;
        sessionId: string;
        snapshot: Record<string, unknown>;
      };
      select: {
        id: true;
        createdAt: true;
      };
    }) => Promise<{ id: string; createdAt: Date }>;
    findFirst: (args: {
      where: {
        orgId: string;
        sessionId: string;
      };
      select: {
        id: true;
        createdAt: true;
      };
    }) => Promise<{ id: string; createdAt: Date } | null>;
  };
  calibrationPlacement: {
    findFirst: (args: {
      where: {
        orgId: string;
        sessionId: string;
        employeeId: string;
      };
      select: Record<string, unknown>;
    }) => Promise<CalibrationPlacementAccessRecord | null>;
    update: (args: {
      where: {
        id: string;
      };
      data: {
        performanceBucket: CalibrationBucket;
        potentialBucket: CalibrationBucket;
        justificationNote: string | null;
      };
      select: {
        id: true;
        employeeId: true;
        performanceBucket: true;
        potentialBucket: true;
        justificationNote: true;
        updatedAt: true;
      };
    }) => Promise<{
      id: string;
      employeeId: string;
      performanceBucket: CalibrationBucket;
      potentialBucket: CalibrationBucket;
      justificationNote: string | null;
      updatedAt: Date;
    }>;
  };
  employee: {
    findFirst: (args: {
      where: {
        orgId: string;
        userId: string;
      };
      select: {
        id: true;
      };
    }) => Promise<ViewerEmployeeRecord | null>;
  };
  calibrationSessionParticipant: {
    findFirst: (args: {
      where: {
        orgId: string;
        sessionId: string;
        userId: string;
      };
      select: {
        id: true;
      };
    }) => Promise<{ id: string } | null>;
  };
  reviewPacket: {
    findMany: (args: {
      where: {
        orgId: string;
        cycleId: string;
        subjectEmployeeId: {
          in: string[];
        };
      };
      select: {
        subjectEmployeeId: true;
        submissions: {
          select: {
            status: true;
          };
        };
      };
    }) => Promise<ReviewPacketSummaryRecord[]>;
    updateMany: (args: {
      where: {
        orgId: string;
        cycleId: string;
        subjectEmployeeId: {
          in: string[];
        };
      };
      data: {
        finalRatingSource: FinalRatingSource;
      };
    }) => Promise<{ count: number }>;
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

const sessionIdSchema = z.object({
  sessionId: z.string().trim().min(1),
});

const movePlacementSchema = z.object({
  sessionId: z.string().trim().min(1),
  employeeId: z.string().trim().min(1),
  performanceBucket: z.nativeEnum(CalibrationBucket),
  potentialBucket: z.nativeEnum(CalibrationBucket),
  justificationNote: z.string().trim().max(2000).optional().nullable(),
});

const performanceDefinitions: CalibrationAxisDefinition[] = [
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

const potentialDefinitions: CalibrationAxisDefinition[] = [
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

interface SessionPermissionState {
  canMoveAny: boolean;
  canMoveEmployeeIds: Set<string>;
  canFinalize: boolean;
  canViewDownstreamOutputs: boolean;
}

interface DownstreamSuccessionOutput {
  employeeId: string;
  employeeName: string;
  emergencyBackup: boolean;
  readyNow: boolean;
  readyFuture: boolean;
  estimatedReadinessTimeframe: string;
  developmentNeeds: string | null;
}

interface DownstreamRiskOutput {
  employeeId: string;
  employeeName: string;
  riskLevel: "MEDIUM" | "HIGH";
  issueSummary: string;
  actionRecommendation: string;
}

export interface CalibrationAxisDefinition {
  bucket: CalibrationBucket;
  label: string;
  description: string;
}

export interface CalibrationSessionPlacement {
  placementId: string;
  employeeId: string;
  employeeName: string;
  managerName: string | null;
  performanceBucket: CalibrationBucket;
  potentialBucket: CalibrationBucket;
  justificationNote: string | null;
  packetSummary: {
    totalSubmissions: number;
    submittedCount: number;
  };
  canMove: boolean;
}

export interface CalibrationSessionData {
  session: {
    id: string;
    name: string;
    roleGroup: string | null;
    isRestricted: boolean;
    cycleId: string;
    cycleName: string;
    cycleStatus: CycleStatus;
    isFinalized: boolean;
    finalizedAt: string | null;
  };
  guidance: {
    summary: string;
    performance: CalibrationAxisDefinition[];
    potential: CalibrationAxisDefinition[];
  };
  viewer: {
    canMoveAny: boolean;
    canFinalize: boolean;
    canViewDownstreamOutputs: boolean;
  };
  downstreamOutputs: {
    available: boolean;
    succession: {
      emergencyBackupCount: number;
      readyNowCount: number;
      readyFutureCount: number;
      candidates: DownstreamSuccessionOutput[];
    } | null;
    risk: {
      organizationalRiskLevel: "LOW" | "MEDIUM" | "HIGH";
      flaggedCount: number;
      items: DownstreamRiskOutput[];
    } | null;
  };
  placements: CalibrationSessionPlacement[];
}

export interface MoveCalibrationPlacementResult {
  placementId: string;
  employeeId: string;
  performanceBucket: CalibrationBucket;
  potentialBucket: CalibrationBucket;
  justificationNote: string | null;
  updatedAt: string;
}

export interface FinalizeCalibrationSessionResult {
  sessionId: string;
  snapshotId: string;
  isFinalized: boolean;
  finalizedAt: string;
  placementCount: number;
  participantCount: number;
  downstreamOutputs: CalibrationSessionData["downstreamOutputs"];
}

export interface CalibrationExportPlaceholder {
  sessionId: string;
  snapshotId: string | null;
  snapshotCreatedAt: string | null;
  message: string;
}

export async function getCalibrationSessionData(
  sessionId: string,
  context: RequestContext,
  db: CalibrationSessionDb = prisma as unknown as CalibrationSessionDb,
): Promise<CalibrationSessionData> {
  const parsed = sessionIdSchema.safeParse({ sessionId });
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Invalid calibration session identifier",
      400,
      parsed.error.flatten(),
    );
  }

  const session = await loadSessionRecord(parsed.data.sessionId, context.orgId, db);
  const permission = await resolveSessionPermission(session, context, db);
  const configuredPerformanceDefinitions = resolveAxisDefinitions(
    session.performanceAxisConfig,
    performanceDefinitions,
  );
  const configuredPotentialDefinitions = resolveAxisDefinitions(
    session.potentialAxisConfig,
    potentialDefinitions,
  );
  const packetSummaryByEmployee = await loadPacketSummaryByEmployee(
    context.orgId,
    session.cycleId,
    session.placements.map((placement) => placement.employeeId),
    db,
  );

  const placements = session.placements
    .map((placement) => {
      const summary = packetSummaryByEmployee.get(placement.employeeId) ?? {
        totalSubmissions: 0,
        submittedCount: 0,
      };

      return {
        placementId: placement.id,
        employeeId: placement.employeeId,
        employeeName: `${placement.employee.firstName} ${placement.employee.lastName}`,
        managerName: placement.employee.manager
          ? `${placement.employee.manager.firstName} ${placement.employee.manager.lastName}`
          : null,
        performanceBucket: placement.performanceBucket,
        potentialBucket: placement.potentialBucket,
        justificationNote: placement.justificationNote,
        packetSummary: summary,
        canMove:
          !session.isFinalized &&
          (permission.canMoveAny || permission.canMoveEmployeeIds.has(placement.employeeId)),
      };
    })
    .filter((placement) => permission.canMoveAny || permission.canMoveEmployeeIds.has(placement.employeeId))
    .sort((left, right) => left.employeeName.localeCompare(right.employeeName));

  const downstreamOutputs = buildDownstreamOutputs(
    session.placements,
    session.isFinalized,
    permission.canViewDownstreamOutputs,
  );

  return {
    session: {
      id: session.id,
      name: session.name,
      roleGroup: session.roleGroup,
      isRestricted: session.isRestricted,
      cycleId: session.cycleId,
      cycleName: session.cycle.name,
      cycleStatus: session.cycle.status,
      isFinalized: session.isFinalized,
      finalizedAt: session.finalizedAt?.toISOString() ?? null,
    },
    guidance: {
      summary:
        session.isRestricted
          ? "This restricted calibration session is reserved for super-admin talent governance work."
          : "Calibration aligns managers on how performance and potential are evaluated across the cohort after review submissions are locked.",
      performance: configuredPerformanceDefinitions,
      potential: configuredPotentialDefinitions,
    },
    viewer: {
      canMoveAny: permission.canMoveAny,
      canFinalize: permission.canFinalize,
      canViewDownstreamOutputs: permission.canViewDownstreamOutputs,
    },
    downstreamOutputs,
    placements,
  };
}

export async function moveCalibrationPlacement(
  input: unknown,
  context: RequestContext,
  db: CalibrationSessionDb = prisma as unknown as CalibrationSessionDb,
): Promise<MoveCalibrationPlacementResult> {
  const parsed = movePlacementSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Invalid move placement payload",
      400,
      parsed.error.flatten(),
    );
  }

  const placement = await db.calibrationPlacement.findFirst({
    where: {
      orgId: context.orgId,
      sessionId: parsed.data.sessionId,
      employeeId: parsed.data.employeeId,
    },
    select: {
      id: true,
      employeeId: true,
      performanceBucket: true,
      potentialBucket: true,
      justificationNote: true,
      employee: {
        select: {
          id: true,
          managerId: true,
        },
      },
      session: {
        select: {
          id: true,
          cycleId: true,
          isRestricted: true,
          isFinalized: true,
        },
      },
    },
  });

  if (!placement) {
    throw new AppError("NOT_FOUND", "Calibration placement not found", 404);
  }

  if (placement.session.isFinalized) {
    throw new AppError("READ_ONLY", "Calibration session is finalized and read-only", 409);
  }

  const canMove = await canMovePlacement(placement, context, db);
  if (!canMove) {
    throw new AppError("FORBIDDEN", "You are not allowed to move this placement", 403);
  }

  const hasChanged =
    placement.performanceBucket !== parsed.data.performanceBucket ||
    placement.potentialBucket !== parsed.data.potentialBucket ||
    placement.justificationNote !== normalizeNote(parsed.data.justificationNote, placement.justificationNote);

  if (!hasChanged) {
    return {
      placementId: placement.id,
      employeeId: placement.employeeId,
      performanceBucket: placement.performanceBucket,
      potentialBucket: placement.potentialBucket,
      justificationNote: placement.justificationNote,
      updatedAt: new Date().toISOString(),
    };
  }

  const nextJustificationNote = normalizeNote(
    parsed.data.justificationNote,
    placement.justificationNote,
  );

  const updatedPlacement = await db.calibrationPlacement.update({
    where: {
      id: placement.id,
    },
    data: {
      performanceBucket: parsed.data.performanceBucket,
      potentialBucket: parsed.data.potentialBucket,
      justificationNote: nextJustificationNote,
    },
    select: {
      id: true,
      employeeId: true,
      performanceBucket: true,
      potentialBucket: true,
      justificationNote: true,
      updatedAt: true,
    },
  });

  await db.auditEvent.create({
    data: {
      orgId: context.orgId,
      actorUserId: context.userId,
      action: "CALIBRATION_PLACEMENT_MOVED",
      entityType: "CalibrationPlacement",
      entityId: updatedPlacement.id,
      metadata: {
        sessionId: placement.session.id,
        cycleId: placement.session.cycleId,
        employeeId: placement.employeeId,
        previousPerformanceBucket: placement.performanceBucket,
        previousPotentialBucket: placement.potentialBucket,
        performanceBucket: updatedPlacement.performanceBucket,
        potentialBucket: updatedPlacement.potentialBucket,
        noteLength: updatedPlacement.justificationNote?.length ?? 0,
      },
    },
  });

  return {
    placementId: updatedPlacement.id,
    employeeId: updatedPlacement.employeeId,
    performanceBucket: updatedPlacement.performanceBucket,
    potentialBucket: updatedPlacement.potentialBucket,
    justificationNote: updatedPlacement.justificationNote,
    updatedAt: updatedPlacement.updatedAt.toISOString(),
  };
}

export async function getCalibrationExportPlaceholder(
  sessionId: string,
  context: RequestContext,
  db: CalibrationSessionDb = prisma as unknown as CalibrationSessionDb,
): Promise<CalibrationExportPlaceholder> {
  const parsed = sessionIdSchema.safeParse({ sessionId });
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Invalid calibration session identifier",
      400,
      parsed.error.flatten(),
    );
  }

  const session = await loadSessionRecord(parsed.data.sessionId, context.orgId, db);
  const permission = await resolveSessionPermission(session, context, db);

  if (!permission.canViewDownstreamOutputs) {
    throw new AppError("FORBIDDEN", "Only super admins can export calibration snapshots", 403);
  }

  const snapshot = await db.calibrationSnapshot.findFirst({
    where: {
      orgId: context.orgId,
      sessionId: session.id,
    },
    select: {
      id: true,
      createdAt: true,
    },
  });

  return {
    sessionId: session.id,
    snapshotId: snapshot?.id ?? null,
    snapshotCreatedAt: snapshot?.createdAt.toISOString() ?? null,
    message: snapshot
      ? "Finalized calibration snapshot is ready for downstream succession and risk follow-up export in a later milestone."
      : "No finalized snapshot exists yet. Finalize the session before capturing downstream succession and risk outputs.",
  };
}

export async function finalizeCalibrationSession(
  sessionId: string,
  context: RequestContext,
  db: CalibrationSessionDb = prisma as unknown as CalibrationSessionDb,
): Promise<FinalizeCalibrationSessionResult> {
  const parsed = sessionIdSchema.safeParse({ sessionId });
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Invalid calibration session identifier",
      400,
      parsed.error.flatten(),
    );
  }

  if (!canFinalizeSession(context)) {
    throw new AppError("FORBIDDEN", "You are not allowed to finalize this calibration session", 403);
  }

  const session = await loadSessionRecord(parsed.data.sessionId, context.orgId, db);
  if (session.cycle.status !== CycleStatus.LOCKED && session.cycle.status !== CycleStatus.RELEASED) {
    throw new AppError(
      "INVALID_CYCLE_STATE",
      "Calibration can only be finalized after the review cycle is locked",
      409,
      { cycleStatus: session.cycle.status },
    );
  }
  if (session.isFinalized) {
    throw new AppError("READ_ONLY", "Calibration session is already finalized", 409);
  }

  const finalizedAt = new Date();
  const snapshotPayload = buildCalibrationSnapshotPayload(
    session,
    finalizedAt,
    resolveAxisDefinitions(session.performanceAxisConfig, performanceDefinitions),
    resolveAxisDefinitions(session.potentialAxisConfig, potentialDefinitions),
  );
  const downstreamOutputs = buildDownstreamOutputs(session.placements, true, true);

  const snapshot = await db.calibrationSnapshot.create({
    data: {
      orgId: context.orgId,
      sessionId: session.id,
      snapshot: snapshotPayload,
    },
    select: {
      id: true,
      createdAt: true,
    },
  });

  const updatedSession = await db.calibrationSession.update({
    where: {
      id: session.id,
    },
    data: {
      isFinalized: true,
      finalizedAt,
    },
    select: {
      id: true,
      isRestricted: true,
      isFinalized: true,
      finalizedAt: true,
    },
  });

  await db.reviewPacket.updateMany({
    where: {
      orgId: context.orgId,
      cycleId: session.cycleId,
      subjectEmployeeId: {
        in: session.placements.map((placement) => placement.employeeId),
      },
    },
    data: {
      finalRatingSource: FinalRatingSource.CALIBRATION,
    },
  });

  await db.auditEvent.create({
    data: {
      orgId: context.orgId,
      actorUserId: context.userId,
      action: "CALIBRATION_FINALIZED",
      entityType: "CalibrationSession",
      entityId: session.id,
      metadata: {
        sessionId: session.id,
        cycleId: session.cycleId,
        placementCount: session.placements.length,
        participantCount: session.participants.length,
      },
    },
  });

  return {
    sessionId: updatedSession.id,
    snapshotId: snapshot.id,
    isFinalized: updatedSession.isFinalized,
    finalizedAt: (updatedSession.finalizedAt ?? snapshot.createdAt).toISOString(),
    placementCount: session.placements.length,
    participantCount: session.participants.length,
    downstreamOutputs,
  };
}

async function loadSessionRecord(
  sessionId: string,
  orgId: string,
  db: CalibrationSessionDb,
): Promise<CalibrationSessionRecord> {
  const session = await db.calibrationSession.findFirst({
    where: {
      id: sessionId,
      orgId,
    },
    select: {
      id: true,
      orgId: true,
      cycleId: true,
      name: true,
      roleGroup: true,
      isRestricted: true,
      performanceAxisConfig: true,
      potentialAxisConfig: true,
      isFinalized: true,
      finalizedAt: true,
      cycle: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
      participants: {
        select: {
          id: true,
        },
      },
      placements: {
        orderBy: {
          employeeId: "asc",
        },
        select: {
          id: true,
          employeeId: true,
          performanceBucket: true,
          potentialBucket: true,
          justificationNote: true,
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              managerId: true,
              manager: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!session) {
    throw new AppError("NOT_FOUND", "Calibration session not found", 404);
  }

  return session;
}

function buildCalibrationSnapshotPayload(
  session: CalibrationSessionRecord,
  finalizedAt: Date,
  configuredPerformanceDefinitions: CalibrationAxisDefinition[],
  configuredPotentialDefinitions: CalibrationAxisDefinition[],
): Record<string, unknown> {
  const placements = session.placements.map((placement) => ({
    employeeId: placement.employeeId,
    employeeName: `${placement.employee.firstName} ${placement.employee.lastName}`,
    managerId: placement.employee.managerId,
    managerName: placement.employee.manager
      ? `${placement.employee.manager.firstName} ${placement.employee.manager.lastName}`
      : null,
    performanceBucket: placement.performanceBucket,
    potentialBucket: placement.potentialBucket,
    justificationNote: placement.justificationNote,
  }));

  const cellCounts = session.placements.reduce((counts, placement) => {
    const key = `${placement.performanceBucket}:${placement.potentialBucket}`;
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  return {
    sessionId: session.id,
    cycleId: session.cycleId,
    cycleName: session.cycle.name,
    isRestricted: session.isRestricted,
    timestamp: finalizedAt.toISOString(),
    axes: {
      performance: configuredPerformanceDefinitions,
      potential: configuredPotentialDefinitions,
    },
    notes: [],
    participants: placements.map((placement) => ({
      employeeId: placement.employeeId,
      employeeName: placement.employeeName,
      managerId: placement.managerId,
      managerName: placement.managerName,
    })),
    placements,
    downstreamOutputs: buildDownstreamOutputs(session.placements, true, true),
    summary: {
      placementCount: placements.length,
      cellCounts,
    },
  };
}

function resolveAxisDefinitions(
  axisConfig: unknown,
  fallback: CalibrationAxisDefinition[],
): CalibrationAxisDefinition[] {
  if (!Array.isArray(axisConfig)) {
    return fallback;
  }

  const parsed = axisConfig
    .filter((item): item is CalibrationAxisDefinition => isCalibrationAxisDefinition(item))
    .sort((left, right) => axisSortOrder[left.bucket] - axisSortOrder[right.bucket]);

  const uniqueBuckets = new Set(parsed.map((definition) => definition.bucket));
  if (parsed.length !== 3 || uniqueBuckets.size !== 3) {
    return fallback;
  }

  return parsed;
}

function isCalibrationAxisDefinition(value: unknown): value is CalibrationAxisDefinition {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    (candidate.bucket === CalibrationBucket.LOW ||
      candidate.bucket === CalibrationBucket.MEDIUM ||
      candidate.bucket === CalibrationBucket.HIGH) &&
    typeof candidate.label === "string" &&
    candidate.label.trim().length > 0 &&
    typeof candidate.description === "string" &&
    candidate.description.trim().length > 0
  );
}

const axisSortOrder: Record<CalibrationBucket, number> = {
  [CalibrationBucket.LOW]: 0,
  [CalibrationBucket.MEDIUM]: 1,
  [CalibrationBucket.HIGH]: 2,
};

async function resolveSessionPermission(
  session: CalibrationSessionRecord,
  context: RequestContext,
  db: CalibrationSessionDb,
): Promise<SessionPermissionState> {
  if (session.isRestricted) {
    if (context.role !== UserRole.SUPER_ADMIN) {
      throw new AppError(
        "FORBIDDEN",
        "Only super admins can access restricted calibration sessions",
        403,
      );
    }

    return {
      canMoveAny: true,
      canMoveEmployeeIds: new Set(session.placements.map((placement) => placement.employeeId)),
      canFinalize: true,
      canViewDownstreamOutputs: true,
    };
  }

  if (context.role === UserRole.HR_ADMIN || context.role === UserRole.SUPER_ADMIN) {
    return {
      canMoveAny: true,
      canMoveEmployeeIds: new Set(session.placements.map((placement) => placement.employeeId)),
      canFinalize: context.role === UserRole.SUPER_ADMIN,
      canViewDownstreamOutputs: context.role === UserRole.SUPER_ADMIN,
    };
  }

  const viewerEmployee = await db.employee.findFirst({
    where: {
      orgId: context.orgId,
      userId: context.userId,
    },
    select: {
      id: true,
    },
  });

  if (!viewerEmployee) {
    throw new AppError("FORBIDDEN", "User is not mapped to an employee profile", 403);
  }

  if (context.role !== UserRole.MANAGER) {
    throw new AppError("FORBIDDEN", "You are not allowed to access this calibration session", 403);
  }

  const sessionParticipant = await db.calibrationSessionParticipant.findFirst({
    where: {
      orgId: context.orgId,
      sessionId: session.id,
      userId: context.userId,
    },
    select: {
      id: true,
    },
  });

  if (!sessionParticipant) {
    throw new AppError("FORBIDDEN", "You are not allowed to access this calibration session", 403);
  }

  const managedEmployeeIds = new Set(
    session.placements
      .filter((placement) => placement.employee.managerId === viewerEmployee.id)
      .map((placement) => placement.employeeId),
  );

  if (managedEmployeeIds.size === 0) {
    throw new AppError("FORBIDDEN", "You are not allowed to access this calibration session", 403);
  }

  return {
    canMoveAny: false,
    canMoveEmployeeIds: managedEmployeeIds,
    canFinalize: false,
    canViewDownstreamOutputs: false,
  };
}

function buildDownstreamOutputs(
  placements: CalibrationSessionPlacementRecord[],
  isFinalized: boolean,
  canViewDownstreamOutputs: boolean,
): CalibrationSessionData["downstreamOutputs"] {
  if (!canViewDownstreamOutputs || !isFinalized) {
    return {
      available: false,
      succession: null,
      risk: null,
    };
  }

  const successionCandidates = placements
    .map((placement) => {
      const readyNow =
        placement.performanceBucket === CalibrationBucket.HIGH &&
        placement.potentialBucket === CalibrationBucket.HIGH;
      const emergencyBackup = readyNow;
      const readyFuture =
        !readyNow &&
        placement.performanceBucket !== CalibrationBucket.LOW &&
        placement.potentialBucket !== CalibrationBucket.LOW;

      if (!emergencyBackup && !readyNow && !readyFuture) {
        return null;
      }

      return {
        employeeId: placement.employeeId,
        employeeName: `${placement.employee.firstName} ${placement.employee.lastName}`,
        emergencyBackup,
        readyNow,
        readyFuture,
        estimatedReadinessTimeframe: readyNow
          ? "Now"
          : placement.potentialBucket === CalibrationBucket.HIGH
            ? "0-12 months"
            : "12-24 months",
        developmentNeeds: placement.justificationNote,
      };
    })
    .filter((candidate): candidate is DownstreamSuccessionOutput => candidate != null);

  const riskItems: DownstreamRiskOutput[] = placements
    .map((placement) => {
      const riskLevel = deriveRiskLevel(placement);
      if (riskLevel === "LOW") {
        return null;
      }

      const employeeName = `${placement.employee.firstName} ${placement.employee.lastName}`;
      return {
        employeeId: placement.employeeId,
        employeeName,
        riskLevel,
        issueSummary:
          riskLevel === "HIGH"
            ? `${employeeName} is in a high-attention calibration box and needs immediate succession or performance-risk follow-up.`
            : `${employeeName} should remain on the restricted talent follow-up list after calibration.`,
        actionRecommendation:
          riskLevel === "HIGH"
            ? "Create an explicit risk mitigation and development follow-up plan after calibration."
            : "Review succession coverage and manager support actions in the post-calibration follow-up.",
      };
    })
    .filter((item): item is DownstreamRiskOutput => item != null);

  return {
    available: true,
    succession: {
      emergencyBackupCount: successionCandidates.filter((candidate) => candidate.emergencyBackup).length,
      readyNowCount: successionCandidates.filter((candidate) => candidate.readyNow).length,
      readyFutureCount: successionCandidates.filter((candidate) => candidate.readyFuture).length,
      candidates: successionCandidates,
    },
    risk: {
      organizationalRiskLevel: deriveOrganizationalRiskLevel(placements),
      flaggedCount: riskItems.length,
      items: riskItems,
    },
  };
}

function deriveRiskLevel(
  placement: CalibrationSessionPlacementRecord,
): "LOW" | "MEDIUM" | "HIGH" {
  if (
    placement.performanceBucket === CalibrationBucket.LOW &&
    placement.potentialBucket === CalibrationBucket.HIGH
  ) {
    return "HIGH";
  }

  if (
    placement.performanceBucket === CalibrationBucket.LOW ||
    placement.potentialBucket === CalibrationBucket.LOW
  ) {
    return "MEDIUM";
  }

  return "LOW";
}

function deriveOrganizationalRiskLevel(
  placements: CalibrationSessionPlacementRecord[],
): "LOW" | "MEDIUM" | "HIGH" {
  if (placements.some((placement) => deriveRiskLevel(placement) === "HIGH")) {
    return "HIGH";
  }

  if (placements.some((placement) => deriveRiskLevel(placement) === "MEDIUM")) {
    return "MEDIUM";
  }

  return "LOW";
}

async function canMovePlacement(
  placement: CalibrationPlacementAccessRecord,
  context: RequestContext,
  db: CalibrationSessionDb,
): Promise<boolean> {
  if (placement.session.isRestricted) {
    return context.role === UserRole.SUPER_ADMIN;
  }

  if (context.role === UserRole.HR_ADMIN || context.role === UserRole.SUPER_ADMIN) {
    return true;
  }

  if (context.role !== UserRole.MANAGER) {
    return false;
  }

  const viewerEmployee = await db.employee.findFirst({
    where: {
      orgId: context.orgId,
      userId: context.userId,
    },
    select: {
      id: true,
    },
  });

  if (!viewerEmployee) {
    return false;
  }

  const sessionParticipant = await db.calibrationSessionParticipant.findFirst({
    where: {
      orgId: context.orgId,
      sessionId: placement.session.id,
      userId: context.userId,
    },
    select: {
      id: true,
    },
  });

  if (!sessionParticipant) {
    return false;
  }

  return placement.employee.managerId === viewerEmployee.id;
}

function canFinalizeSession(context: RequestContext): boolean {
  return context.role === UserRole.SUPER_ADMIN;
}

function normalizeNote(
  nextNote: string | null | undefined,
  currentNote: string | null,
): string | null {
  if (nextNote === undefined) {
    return currentNote;
  }

  return nextNote === null || nextNote.length === 0 ? null : nextNote;
}

async function loadPacketSummaryByEmployee(
  orgId: string,
  cycleId: string,
  employeeIds: string[],
  db: CalibrationSessionDb,
): Promise<Map<string, { totalSubmissions: number; submittedCount: number }>> {
  const summaryByEmployee = new Map<string, { totalSubmissions: number; submittedCount: number }>();
  if (employeeIds.length === 0) {
    return summaryByEmployee;
  }

  const packets = await db.reviewPacket.findMany({
    where: {
      orgId,
      cycleId,
      subjectEmployeeId: {
        in: employeeIds,
      },
    },
    select: {
      subjectEmployeeId: true,
      submissions: {
        select: {
          status: true,
        },
      },
    },
  });

  for (const packet of packets) {
    const totalSubmissions = packet.submissions.length;
    const submittedCount = packet.submissions.filter(
      (submission) => submission.status === ReviewSubmissionStatus.SUBMITTED,
    ).length;

    summaryByEmployee.set(packet.subjectEmployeeId, {
      totalSubmissions,
      submittedCount,
    });
  }

  return summaryByEmployee;
}

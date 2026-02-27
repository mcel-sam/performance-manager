import {
  CalibrationBucket,
  CycleStatus,
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
  isFinalized: boolean;
  finalizedAt: Date | null;
  cycle: {
    id: string;
    name: string;
    status: CycleStatus;
  };
  placements: CalibrationSessionPlacementRecord[];
}

interface CalibrationPlacementAccessRecord {
  id: string;
  employeeId: string;
  performanceBucket: CalibrationBucket;
  potentialBucket: CalibrationBucket;
  employee: {
    id: string;
    managerId: string | null;
  };
  session: {
    id: string;
    cycleId: string;
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
      };
      select: {
        id: true;
        employeeId: true;
        performanceBucket: true;
        potentialBucket: true;
        updatedAt: true;
      };
    }) => Promise<{
      id: string;
      employeeId: string;
      performanceBucket: CalibrationBucket;
      potentialBucket: CalibrationBucket;
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
  viewerEmployeeId: string | null;
  canMoveAny: boolean;
  canMoveEmployeeIds: Set<string>;
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
  };
  placements: CalibrationSessionPlacement[];
}

export interface MoveCalibrationPlacementResult {
  placementId: string;
  employeeId: string;
  performanceBucket: CalibrationBucket;
  potentialBucket: CalibrationBucket;
  updatedAt: string;
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

  const session = await db.calibrationSession.findFirst({
    where: {
      id: parsed.data.sessionId,
      orgId: context.orgId,
    },
    select: {
      id: true,
      orgId: true,
      cycleId: true,
      name: true,
      isFinalized: true,
      finalizedAt: true,
      cycle: {
        select: {
          id: true,
          name: true,
          status: true,
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

  const permission = await resolveSessionPermission(session, context, db);
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
        packetSummary: summary,
        canMove:
          !session.isFinalized &&
          (permission.canMoveAny || permission.canMoveEmployeeIds.has(placement.employeeId)),
      };
    })
    .sort((left, right) => left.employeeName.localeCompare(right.employeeName));

  return {
    session: {
      id: session.id,
      name: session.name,
      cycleId: session.cycleId,
      cycleName: session.cycle.name,
      cycleStatus: session.cycle.status,
      isFinalized: session.isFinalized,
      finalizedAt: session.finalizedAt?.toISOString() ?? null,
    },
    guidance: {
      summary:
        "Calibration aligns managers on how performance and potential are evaluated across the cohort.",
      performance: performanceDefinitions,
      potential: potentialDefinitions,
    },
    viewer: {
      canMoveAny: permission.canMoveAny,
    },
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
    placement.potentialBucket !== parsed.data.potentialBucket;

  if (!hasChanged) {
    return {
      placementId: placement.id,
      employeeId: placement.employeeId,
      performanceBucket: placement.performanceBucket,
      potentialBucket: placement.potentialBucket,
      updatedAt: new Date().toISOString(),
    };
  }

  const updatedPlacement = await db.calibrationPlacement.update({
    where: {
      id: placement.id,
    },
    data: {
      performanceBucket: parsed.data.performanceBucket,
      potentialBucket: parsed.data.potentialBucket,
    },
    select: {
      id: true,
      employeeId: true,
      performanceBucket: true,
      potentialBucket: true,
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
      },
    },
  });

  return {
    placementId: updatedPlacement.id,
    employeeId: updatedPlacement.employeeId,
    performanceBucket: updatedPlacement.performanceBucket,
    potentialBucket: updatedPlacement.potentialBucket,
    updatedAt: updatedPlacement.updatedAt.toISOString(),
  };
}

async function resolveSessionPermission(
  session: CalibrationSessionRecord,
  context: RequestContext,
  db: CalibrationSessionDb,
): Promise<SessionPermissionState> {
  if (context.role === UserRole.HR_ADMIN || context.role === UserRole.CALIBRATOR) {
    return {
      viewerEmployeeId: null,
      canMoveAny: true,
      canMoveEmployeeIds: new Set(session.placements.map((placement) => placement.employeeId)),
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

  const managedEmployeeIds = new Set(
    session.placements
      .filter((placement) => placement.employee.managerId === viewerEmployee.id)
      .map((placement) => placement.employeeId),
  );

  if (managedEmployeeIds.size === 0) {
    throw new AppError("FORBIDDEN", "You are not allowed to access this calibration session", 403);
  }

  return {
    viewerEmployeeId: viewerEmployee.id,
    canMoveAny: false,
    canMoveEmployeeIds: managedEmployeeIds,
  };
}

async function canMovePlacement(
  placement: CalibrationPlacementAccessRecord,
  context: RequestContext,
  db: CalibrationSessionDb,
): Promise<boolean> {
  if (context.role === UserRole.HR_ADMIN || context.role === UserRole.CALIBRATOR) {
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

  return placement.employee.managerId === viewerEmployee.id;
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

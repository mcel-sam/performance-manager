import { CycleStatus, UserRole } from "@prisma/client";

import type { RequestContext } from "@/server/auth/request-context";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/http/errors";

const calibrationAdminRoles = new Set<UserRole>([UserRole.HR_ADMIN, UserRole.CALIBRATOR]);
const calibrationParticipantRoles = [UserRole.HR_ADMIN, UserRole.MANAGER, UserRole.CALIBRATOR] as const;

interface CalibrationAdminOptionsDb {
  reviewCycle: {
    findMany: (args: {
      where: { orgId: string };
      orderBy: { startDate: "desc" };
      select: {
        id: true;
        name: true;
        status: true;
        startDate: true;
        endDate: true;
      };
    }) => Promise<
      {
        id: string;
        name: string;
        status: CycleStatus;
        startDate: Date;
        endDate: Date;
      }[]
    >;
  };
  employee: {
    findMany: (args: {
      where: { orgId: string };
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }];
      select: {
        id: true;
        firstName: true;
        lastName: true;
      };
    }) => Promise<
      {
        id: string;
        firstName: string;
        lastName: string;
      }[]
    >;
  };
  user: {
    findMany: (args: {
      where: { orgId: string; role: { in: readonly UserRole[] } };
      orderBy: { email: "asc" };
      select: {
        id: true;
        email: true;
        role: true;
        employee: {
          select: {
            firstName: true;
            lastName: true;
          };
        };
      };
    }) => Promise<
      {
        id: string;
        email: string;
        role: UserRole;
        employee: {
          firstName: string;
          lastName: string;
        } | null;
      }[]
    >;
  };
}

export interface CalibrationSessionCreateOptionData {
  cycles: {
    id: string;
    name: string;
    status: CycleStatus;
    startDate: string;
    endDate: string;
  }[];
  employees: {
    id: string;
    name: string;
  }[];
  participants: {
    id: string;
    name: string;
    role: UserRole;
  }[];
}

export async function getCalibrationSessionCreateOptions(
  context: RequestContext,
  db: CalibrationAdminOptionsDb = prisma as unknown as CalibrationAdminOptionsDb,
): Promise<CalibrationSessionCreateOptionData> {
  requireCalibrationAdminRole(context);

  const [cycles, employees, participants] = await Promise.all([
    db.reviewCycle.findMany({
      where: {
        orgId: context.orgId,
      },
      orderBy: {
        startDate: "desc",
      },
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
      },
    }),
    db.employee.findMany({
      where: {
        orgId: context.orgId,
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    }),
    db.user.findMany({
      where: {
        orgId: context.orgId,
        role: {
          in: calibrationParticipantRoles,
        },
      },
      orderBy: {
        email: "asc",
      },
      select: {
        id: true,
        email: true,
        role: true,
        employee: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
  ]);

  return {
    cycles: cycles.map((cycle) => ({
      id: cycle.id,
      name: cycle.name,
      status: cycle.status,
      startDate: cycle.startDate.toISOString(),
      endDate: cycle.endDate.toISOString(),
    })),
    employees: employees.map((employee) => ({
      id: employee.id,
      name: `${employee.firstName} ${employee.lastName}`,
    })),
    participants: participants.map((participant) => ({
      id: participant.id,
      name: participant.employee
        ? `${participant.employee.firstName} ${participant.employee.lastName}`
        : participant.email,
      role: participant.role,
    })),
  };
}

function requireCalibrationAdminRole(context: RequestContext): void {
  if (!calibrationAdminRoles.has(context.role)) {
    throw new AppError(
      "FORBIDDEN",
      "Only HR admins and calibrators can manage calibration sessions",
      403,
    );
  }
}

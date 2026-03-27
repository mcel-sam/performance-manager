import { UserRole } from "@prisma/client";

import { canManageImprovementPlans, hasHrAdminAccess, hasManagerAccess } from "@/lib/users/role-capabilities";
import type { RoleNavOptions } from "@/config/navigation";
import type { RequestContext } from "@/server/auth/request-context";
import { prisma } from "@/server/db/prisma";

interface NavVisibilityDb {
  employee: {
    count: (args: {
      where: {
        orgId: string;
        manager?: {
          userId: string;
        };
      };
    }) => Promise<number>;
  };
  calibrationSessionParticipant: {
    count: (args: { where: { orgId: string; userId: string } }) => Promise<number>;
  };
  improvementPlan: {
    count: (args: {
      where: {
        orgId: string;
        subjectEmployee?: {
          userId: string;
        };
      };
    }) => Promise<number>;
  };
}

export async function resolveRoleNavOptions(
  context: RequestContext,
  db: NavVisibilityDb = prisma as unknown as NavVisibilityDb,
): Promise<RoleNavOptions> {
  const canAccessCalibration = await resolveCalibrationAccess(context, db);
  const includeImprovementPlans = await resolveImprovementPlanVisibility(context, db);
  const directReportCount = await resolveDirectReportCount(context, db);

  return {
    canAccessCalibration,
    includeImprovementPlans,
    includeTeamReviews: hasManagerAccess(context.role) || directReportCount > 0,
    includeUserManagement: hasHrAdminAccess(context.role),
    includeSuccession: false,
    includePackets: false,
  };
}

export function canAccessAdminRoutes(context: RequestContext): boolean {
  return hasHrAdminAccess(context.role);
}

async function resolveCalibrationAccess(
  context: RequestContext,
  db: NavVisibilityDb,
): Promise<boolean> {
  if (hasHrAdminAccess(context.role)) {
    return true;
  }

  if (!hasManagerAccess(context.role)) {
    return false;
  }

  const participantCount = await db.calibrationSessionParticipant.count({
    where: {
      orgId: context.orgId,
      userId: context.userId,
    },
  });

  return participantCount > 0;
}

async function resolveImprovementPlanVisibility(
  context: RequestContext,
  db: NavVisibilityDb,
): Promise<boolean> {
  if (canManageImprovementPlans(context.role)) {
    return true;
  }

  if (context.role !== UserRole.EMPLOYEE) {
    return false;
  }

  const visiblePlanCount = await db.improvementPlan.count({
    where: {
      orgId: context.orgId,
      subjectEmployee: {
        userId: context.userId,
      },
    },
  });

  return visiblePlanCount > 0;
}

async function resolveDirectReportCount(
  context: RequestContext,
  db: NavVisibilityDb,
): Promise<number> {
  return db.employee.count({
    where: {
      orgId: context.orgId,
      manager: {
        userId: context.userId,
      },
    },
  });
}

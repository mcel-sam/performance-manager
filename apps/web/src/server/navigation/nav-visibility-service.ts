import { UserRole } from "@prisma/client";

import type { RoleNavOptions } from "@/config/navigation";
import type { RequestContext } from "@/server/auth/request-context";
import { prisma } from "@/server/db/prisma";

interface NavVisibilityDb {
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

  return {
    canAccessCalibration,
    includeImprovementPlans,
    includeTeamReviews: context.role === UserRole.MANAGER,
    includeUserManagement: context.role === UserRole.HR_ADMIN,
    includePackets: context.role === UserRole.MANAGER || context.role === UserRole.CALIBRATOR,
  };
}

export function canAccessAdminRoutes(context: RequestContext): boolean {
  return context.role === UserRole.HR_ADMIN;
}

async function resolveCalibrationAccess(
  context: RequestContext,
  db: NavVisibilityDb,
): Promise<boolean> {
  if (context.role === UserRole.HR_ADMIN || context.role === UserRole.CALIBRATOR) {
    return true;
  }

  if (context.role !== UserRole.MANAGER) {
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
  if (context.role === UserRole.HR_ADMIN || context.role === UserRole.MANAGER) {
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

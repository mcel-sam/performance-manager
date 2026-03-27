import { UserRole } from "@prisma/client";

import type { RequestContext } from "@/server/auth/request-context";
import { prisma } from "@/server/db/prisma";

interface CalibrationNavigationDb {
  calibrationSessionParticipant: {
    findFirst: (args: {
      where: {
        orgId: string;
        userId: string;
      };
      orderBy: {
        createdAt: "desc";
      };
      select: {
        sessionId: true;
      };
    }) => Promise<{ sessionId: string } | null>;
  };
}

export async function resolveCalibrationWorkspaceHref(
  context: RequestContext,
  db: CalibrationNavigationDb = prisma as unknown as CalibrationNavigationDb,
): Promise<string> {
  if (context.role === UserRole.HR_ADMIN || context.role === UserRole.SUPER_ADMIN) {
    return "/admin/performance/calibration";
  }

  if (context.role !== UserRole.MANAGER) {
    return "/";
  }

  const participantSession = await db.calibrationSessionParticipant.findFirst({
    where: {
      orgId: context.orgId,
      userId: context.userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      sessionId: true,
    },
  });

  return participantSession ? `/performance/calibration/${participantSession.sessionId}` : "/";
}

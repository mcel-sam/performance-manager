import { CycleStatus, ReviewRelationship, ReviewSubmissionStatus, UserRole } from "@prisma/client";

import type { RequestContext } from "@/server/auth/request-context";
import { prisma } from "@/server/db/prisma";

interface HomeDashboardDb {
  employee: {
    findFirst: (args: {
      where: { orgId: string; userId: string };
      select: { id: true };
    }) => Promise<{ id: string } | null>;
    count: (args: { where: { orgId: string; managerId: string } }) => Promise<number>;
  };
  reviewSubmission: {
    count: (args: {
      where: {
        orgId: string;
        relationship?: ReviewRelationship;
        reviewerEmployeeId?: string;
        status?: ReviewSubmissionStatus | { in: readonly ReviewSubmissionStatus[] };
        subjectEmployee?: {
          managerId: string;
        };
        cycle?: {
          status?: {
            in: readonly CycleStatus[];
          };
        };
      };
    }) => Promise<number>;
  };
  reviewCycle: {
    count: (args: {
      where: {
        orgId: string;
        status?: CycleStatus | { in: readonly CycleStatus[] };
      };
    }) => Promise<number>;
  };
}

export interface ManagerHomeSnapshot {
  directReportCount: number;
  awaitingManagerReviewCount: number;
  selfReviewNotStartedCount: number;
}

export interface HrHomeSnapshot {
  activeCycleCount: number;
  draftCycleCount: number;
  openSubmissionCount: number;
  submittedSubmissionCount: number;
}

const activeStatuses = [CycleStatus.ACTIVE, CycleStatus.LOCKED] as const;
const awaitingManagerReviewStatuses = [
  ReviewSubmissionStatus.NOT_STARTED,
  ReviewSubmissionStatus.RETURNED,
] as const;
const pendingReviewStatuses = [
  ReviewSubmissionStatus.NOT_STARTED,
  ReviewSubmissionStatus.IN_PROGRESS,
  ReviewSubmissionStatus.RETURNED,
] as const;

export async function getManagerHomeSnapshot(
  context: RequestContext,
  db: HomeDashboardDb = prisma as unknown as HomeDashboardDb,
): Promise<ManagerHomeSnapshot> {
  if (context.role !== UserRole.MANAGER) {
    return {
      directReportCount: 0,
      awaitingManagerReviewCount: 0,
      selfReviewNotStartedCount: 0,
    };
  }

  const managerEmployee = await db.employee.findFirst({
    where: {
      orgId: context.orgId,
      userId: context.userId,
    },
    select: { id: true },
  });

  if (!managerEmployee) {
    return {
      directReportCount: 0,
      awaitingManagerReviewCount: 0,
      selfReviewNotStartedCount: 0,
    };
  }

  const [directReportCount, awaitingManagerReviewCount, selfReviewNotStartedCount] =
    await Promise.all([
      db.employee.count({
        where: { orgId: context.orgId, managerId: managerEmployee.id },
      }),
      db.reviewSubmission.count({
        where: {
          orgId: context.orgId,
          reviewerEmployeeId: managerEmployee.id,
          relationship: ReviewRelationship.MANAGER,
          status: {
            in: awaitingManagerReviewStatuses,
          },
          cycle: {
            status: {
              in: activeStatuses,
            },
          },
        },
      }),
      db.reviewSubmission.count({
        where: {
          orgId: context.orgId,
          relationship: ReviewRelationship.SELF,
          status: ReviewSubmissionStatus.NOT_STARTED,
          subjectEmployee: {
            managerId: managerEmployee.id,
          },
          cycle: {
            status: {
              in: activeStatuses,
            },
          },
        },
      }),
    ]);

  return {
    directReportCount,
    awaitingManagerReviewCount,
    selfReviewNotStartedCount,
  };
}

export async function getHrHomeSnapshot(
  context: RequestContext,
  db: HomeDashboardDb = prisma as unknown as HomeDashboardDb,
): Promise<HrHomeSnapshot> {
  if (context.role !== UserRole.HR_ADMIN) {
    return {
      activeCycleCount: 0,
      draftCycleCount: 0,
      openSubmissionCount: 0,
      submittedSubmissionCount: 0,
    };
  }

  const [activeCycleCount, draftCycleCount, openSubmissionCount, submittedSubmissionCount] =
    await Promise.all([
      db.reviewCycle.count({
        where: {
          orgId: context.orgId,
          status: {
            in: activeStatuses,
          },
        },
      }),
      db.reviewCycle.count({
        where: {
          orgId: context.orgId,
          status: CycleStatus.DRAFT,
        },
      }),
      db.reviewSubmission.count({
        where: {
          orgId: context.orgId,
          status: {
            in: pendingReviewStatuses,
          },
          cycle: {
            status: {
              in: activeStatuses,
            },
          },
        },
      }),
      db.reviewSubmission.count({
        where: {
          orgId: context.orgId,
          status: ReviewSubmissionStatus.SUBMITTED,
          cycle: {
            status: {
              in: activeStatuses,
            },
          },
        },
      }),
    ]);

  return {
    activeCycleCount,
    draftCycleCount,
    openSubmissionCount,
    submittedSubmissionCount,
  };
}

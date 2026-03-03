import { CycleStatus, ReviewRelationship, ReviewSubmissionStatus, UserRole } from "@prisma/client";

import type { RequestContext } from "@/server/auth/request-context";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/http/errors";

interface TeamReviewsDb {
  employee: {
    findFirst: (args: {
      where: { orgId: string; userId: string };
      select: { id: true };
    }) => Promise<{ id: string } | null>;
  };
  reviewSubmission: {
    findMany: (args: {
      where: {
        orgId: string;
        subjectEmployee: {
          managerId: string;
        };
      };
      select: {
        id: true;
        cycleId: true;
        status: true;
        relationship: true;
        subjectEmployeeId: true;
        subjectEmployee: {
          select: {
            id: true;
            firstName: true;
            lastName: true;
          };
        };
        cycle: {
          select: {
            id: true;
            name: true;
            status: true;
            endDate: true;
          };
        };
      };
      orderBy: Array<
        | {
            cycle: {
              endDate: "desc";
            };
          }
        | {
            subjectEmployeeId: "asc";
          }
      >;
    }) => Promise<
      Array<{
        id: string;
        cycleId: string;
        status: ReviewSubmissionStatus;
        relationship: ReviewRelationship;
        subjectEmployeeId: string;
        subjectEmployee: {
          id: string;
          firstName: string;
          lastName: string;
        };
        cycle: {
          id: string;
          name: string;
          status: CycleStatus;
          endDate: Date;
        };
      }>
    >;
  };
}

export interface TeamReviewDashboard {
  cycle: {
    id: string;
    name: string;
    status: CycleStatus;
  } | null;
  kpis: {
    awaitingReview: number;
    inProgress: number;
    completed: number;
  };
  rows: Array<{
    employeeId: string;
    employeeName: string;
    statuses: Partial<Record<ReviewRelationship, ReviewSubmissionStatus>>;
    managerSubmissionId: string | null;
    packetHref: string | null;
    managerReviewHref: string | null;
  }>;
}

const pendingStatuses = new Set<ReviewSubmissionStatus>([
  ReviewSubmissionStatus.NOT_STARTED,
  ReviewSubmissionStatus.RETURNED,
]);
const inProgressStatuses = new Set<ReviewSubmissionStatus>([ReviewSubmissionStatus.IN_PROGRESS]);

export async function getManagerTeamReviewDashboard(
  context: RequestContext,
  db: TeamReviewsDb = prisma as unknown as TeamReviewsDb,
): Promise<TeamReviewDashboard> {
  if (context.role !== UserRole.MANAGER) {
    throw new AppError("FORBIDDEN", "Only managers can access team reviews", 403);
  }

  const managerEmployee = await db.employee.findFirst({
    where: {
      orgId: context.orgId,
      userId: context.userId,
    },
    select: {
      id: true,
    },
  });

  if (!managerEmployee) {
    return {
      cycle: null,
      kpis: {
        awaitingReview: 0,
        inProgress: 0,
        completed: 0,
      },
      rows: [],
    };
  }

  const submissions = await db.reviewSubmission.findMany({
    where: {
      orgId: context.orgId,
      subjectEmployee: {
        managerId: managerEmployee.id,
      },
    },
    select: {
      id: true,
      cycleId: true,
      status: true,
      relationship: true,
      subjectEmployeeId: true,
      subjectEmployee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      cycle: {
        select: {
          id: true,
          name: true,
          status: true,
          endDate: true,
        },
      },
    },
    orderBy: [{ cycle: { endDate: "desc" } }, { subjectEmployeeId: "asc" }],
  });

  if (submissions.length === 0) {
    return {
      cycle: null,
      kpis: {
        awaitingReview: 0,
        inProgress: 0,
        completed: 0,
      },
      rows: [],
    };
  }

  const latestCycleId = submissions[0].cycleId;
  const cycleSubmissions = submissions.filter((submission) => submission.cycleId === latestCycleId);
  const cycle = cycleSubmissions[0].cycle;

  const rowByEmployeeId = new Map<
    string,
    {
      employeeId: string;
      employeeName: string;
      statuses: Partial<Record<ReviewRelationship, ReviewSubmissionStatus>>;
      managerSubmissionId: string | null;
      packetHref: string | null;
      managerReviewHref: string | null;
    }
  >();

  for (const submission of cycleSubmissions) {
    const existing =
      rowByEmployeeId.get(submission.subjectEmployeeId) ??
      {
        employeeId: submission.subjectEmployeeId,
        employeeName: `${submission.subjectEmployee.firstName} ${submission.subjectEmployee.lastName}`,
        statuses: {},
        managerSubmissionId: null,
        packetHref: `/performance/reviews/${submission.cycleId}/packet/${submission.subjectEmployeeId}`,
        managerReviewHref: null,
      };

    existing.statuses[submission.relationship] = submission.status;
    if (submission.relationship === ReviewRelationship.MANAGER) {
      existing.managerSubmissionId = submission.id;
      existing.managerReviewHref = `/performance/reviews/${submission.cycleId}/write/${submission.id}`;
    }

    rowByEmployeeId.set(submission.subjectEmployeeId, existing);
  }

  const rows = Array.from(rowByEmployeeId.values()).sort((a, b) =>
    a.employeeName.localeCompare(b.employeeName),
  );

  let awaitingReview = 0;
  let inProgress = 0;
  let completed = 0;
  for (const row of rows) {
    const managerStatus = row.statuses[ReviewRelationship.MANAGER];
    if (!managerStatus || pendingStatuses.has(managerStatus)) {
      awaitingReview += 1;
      continue;
    }

    if (inProgressStatuses.has(managerStatus)) {
      inProgress += 1;
      continue;
    }

    completed += 1;
  }

  return {
    cycle: {
      id: cycle.id,
      name: cycle.name,
      status: cycle.status,
    },
    kpis: {
      awaitingReview,
      inProgress,
      completed,
    },
    rows,
  };
}

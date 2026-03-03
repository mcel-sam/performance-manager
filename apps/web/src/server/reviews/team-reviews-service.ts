import {
  CycleStatus,
  FinalRatingSource,
  ReviewRelationship,
  ReviewSubmissionStatus,
  UserRole,
} from "@prisma/client";

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
            title: true;
            department: true;
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
        dueAt: true;
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
          title: string | null;
          department: string | null;
        };
        cycle: {
          id: string;
          name: string;
          status: CycleStatus;
          endDate: Date;
        };
        dueAt: Date | null;
      }>
    >;
  };
  reviewPacket: {
    findMany: (args: {
      where: {
        orgId: string;
        cycleId: string;
        subjectEmployee: {
          managerId: string;
        };
      };
      select: {
        scorecardOverallRating: true;
        finalRatingSource: true;
      };
    }) => Promise<
      Array<{
        scorecardOverallRating: number | null;
        finalRatingSource: FinalRatingSource | null;
      }>
    >;
  };
}

export interface TeamReviewDashboard {
  cycles: Array<{
    id: string;
    name: string;
    status: CycleStatus;
  }>;
  cycle: {
    id: string;
    name: string;
    status: CycleStatus;
  } | null;
  kpis: {
    totalDirectReports: number;
    awaitingManagerReview: number;
    inProgressManagerReview: number;
    completedManagerReview: number;
    selfNotStarted: number;
    overdueManagerReview: number;
  };
  rows: Array<{
    employeeId: string;
    employeeName: string;
    title: string | null;
    department: string | null;
    statuses: Partial<Record<ReviewRelationship, ReviewSubmissionStatus>>;
    managerSubmissionId: string | null;
    managerDueAt: Date | null;
    packetHref: string | null;
    managerReviewHref: string | null;
  }>;
  insights: {
    finalDistribution: RatingDistribution;
    scorecardDistribution: RatingDistribution;
    finalRatedCount: number;
    scorecardRatedCount: number;
  };
}

type TeamReviewRow = TeamReviewDashboard["rows"][number];
type RatingDistribution = Record<"1" | "2" | "3" | "4" | "5", number>;

const pendingStatuses = new Set<ReviewSubmissionStatus>([
  ReviewSubmissionStatus.NOT_STARTED,
  ReviewSubmissionStatus.RETURNED,
]);
const inProgressStatuses = new Set<ReviewSubmissionStatus>([ReviewSubmissionStatus.IN_PROGRESS]);

export async function getManagerTeamReviewDashboard(
  context: RequestContext,
  options: { cycleId?: string } = {},
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
      cycles: [],
      cycle: null,
      kpis: {
        totalDirectReports: 0,
        awaitingManagerReview: 0,
        inProgressManagerReview: 0,
        completedManagerReview: 0,
        selfNotStarted: 0,
        overdueManagerReview: 0,
      },
      rows: [],
      insights: {
        finalDistribution: createEmptyRatingDistribution(),
        scorecardDistribution: createEmptyRatingDistribution(),
        finalRatedCount: 0,
        scorecardRatedCount: 0,
      },
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
          title: true,
          department: true,
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
      dueAt: true,
    },
    orderBy: [{ cycle: { endDate: "desc" } }, { subjectEmployeeId: "asc" }],
  });

  if (submissions.length === 0) {
    return {
      cycles: [],
      cycle: null,
      kpis: {
        totalDirectReports: 0,
        awaitingManagerReview: 0,
        inProgressManagerReview: 0,
        completedManagerReview: 0,
        selfNotStarted: 0,
        overdueManagerReview: 0,
      },
      rows: [],
      insights: {
        finalDistribution: createEmptyRatingDistribution(),
        scorecardDistribution: createEmptyRatingDistribution(),
        finalRatedCount: 0,
        scorecardRatedCount: 0,
      },
    };
  }

  const cyclesById = new Map<
    string,
    {
      id: string;
      name: string;
      status: CycleStatus;
      endDate: Date;
    }
  >();
  for (const submission of submissions) {
    if (!cyclesById.has(submission.cycle.id)) {
      cyclesById.set(submission.cycle.id, {
        id: submission.cycle.id,
        name: submission.cycle.name,
        status: submission.cycle.status,
        endDate: submission.cycle.endDate,
      });
    }
  }

  const cycles = Array.from(cyclesById.values())
    .sort((a, b) => b.endDate.getTime() - a.endDate.getTime())
    .map((cycle) => ({
      id: cycle.id,
      name: cycle.name,
      status: cycle.status,
    }));

  const selectedCycleId =
    options.cycleId && cycles.some((cycle) => cycle.id === options.cycleId)
      ? options.cycleId
      : cycles[0]?.id ?? null;

  if (!selectedCycleId) {
    return {
      cycles: [],
      cycle: null,
      kpis: {
        totalDirectReports: 0,
        awaitingManagerReview: 0,
        inProgressManagerReview: 0,
        completedManagerReview: 0,
        selfNotStarted: 0,
        overdueManagerReview: 0,
      },
      rows: [],
      insights: {
        finalDistribution: createEmptyRatingDistribution(),
        scorecardDistribution: createEmptyRatingDistribution(),
        finalRatedCount: 0,
        scorecardRatedCount: 0,
      },
    };
  }

  const cycleSubmissions = submissions.filter((submission) => submission.cycleId === selectedCycleId);
  const cycle = cycleSubmissions[0].cycle;

  const rowByEmployeeId = new Map<
    string,
    TeamReviewRow
  >();

  for (const submission of cycleSubmissions) {
    const existing: TeamReviewRow =
      rowByEmployeeId.get(submission.subjectEmployeeId) ??
      {
        employeeId: submission.subjectEmployeeId,
        employeeName: `${submission.subjectEmployee.firstName} ${submission.subjectEmployee.lastName}`,
        title: submission.subjectEmployee.title,
        department: submission.subjectEmployee.department,
        statuses: {},
        managerSubmissionId: null,
        managerDueAt: null,
        packetHref: `/performance/reviews/${submission.cycleId}/packet/${submission.subjectEmployeeId}`,
        managerReviewHref: null,
      };

    existing.statuses[submission.relationship] = submission.status;
    if (submission.relationship === ReviewRelationship.MANAGER) {
      existing.managerSubmissionId = submission.id;
      existing.managerReviewHref = `/performance/reviews/${submission.cycleId}/write/${submission.id}`;
      existing.managerDueAt = submission.dueAt;
    }

    rowByEmployeeId.set(submission.subjectEmployeeId, existing);
  }

  const rows = Array.from(rowByEmployeeId.values()).sort((a, b) =>
    a.employeeName.localeCompare(b.employeeName),
  );

  let awaitingManagerReview = 0;
  let inProgressManagerReview = 0;
  let completedManagerReview = 0;
  let selfNotStarted = 0;
  let overdueManagerReview = 0;
  const now = new Date();

  for (const row of rows) {
    const managerStatus = row.statuses[ReviewRelationship.MANAGER];
    if (!managerStatus || pendingStatuses.has(managerStatus)) {
      awaitingManagerReview += 1;
    } else if (inProgressStatuses.has(managerStatus)) {
      inProgressManagerReview += 1;
    } else {
      completedManagerReview += 1;
    }

    const selfStatus = row.statuses[ReviewRelationship.SELF];
    if (!selfStatus || selfStatus === ReviewSubmissionStatus.NOT_STARTED) {
      selfNotStarted += 1;
    }

    if (
      row.managerDueAt &&
      row.managerDueAt.getTime() < now.getTime() &&
      managerStatus &&
      managerStatus !== ReviewSubmissionStatus.SUBMITTED
    ) {
      overdueManagerReview += 1;
    }
  }

  const packets = await db.reviewPacket.findMany({
    where: {
      orgId: context.orgId,
      cycleId: selectedCycleId,
      subjectEmployee: {
        managerId: managerEmployee.id,
      },
    },
    select: {
      scorecardOverallRating: true,
      finalRatingSource: true,
    },
  });

  const scorecardDistribution = createEmptyRatingDistribution();
  const finalDistribution = createEmptyRatingDistribution();
  let finalRatedCount = 0;
  let scorecardRatedCount = 0;

  for (const packet of packets) {
    const rating = packet.scorecardOverallRating;
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      continue;
    }

    const key = String(rating) as keyof RatingDistribution;
    scorecardDistribution[key] += 1;
    scorecardRatedCount += 1;

    if (packet.finalRatingSource != null) {
      finalDistribution[key] += 1;
      finalRatedCount += 1;
    }
  }

  return {
    cycles,
    cycle: {
      id: cycle.id,
      name: cycle.name,
      status: cycle.status,
    },
    kpis: {
      totalDirectReports: rows.length,
      awaitingManagerReview,
      inProgressManagerReview,
      completedManagerReview,
      selfNotStarted,
      overdueManagerReview,
    },
    rows,
    insights: {
      finalDistribution,
      scorecardDistribution,
      finalRatedCount,
      scorecardRatedCount,
    },
  };
}

function createEmptyRatingDistribution(): RatingDistribution {
  return {
    "1": 0,
    "2": 0,
    "3": 0,
    "4": 0,
    "5": 0,
  };
}

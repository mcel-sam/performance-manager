import { CycleStatus, ReviewRelationship, ReviewSubmissionStatus, UserRole } from "@prisma/client";

import { hasHrAdminAccess, hasManagerAccess } from "@/lib/users/role-capabilities";
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

interface HomeViewerDb {
  employee: {
    findFirst: (args: {
      where: { orgId: string; userId: string };
      select: {
        id: true;
        firstName: true;
        lastName: true;
        avatarUrl: true;
        title: true;
        department: true;
        managerId: true;
        manager: {
          select: {
            id: true;
            firstName: true;
            lastName: true;
            avatarUrl: true;
            title: true;
          };
        };
      };
    }) => Promise<{
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
      title: string | null;
      department: string | null;
      managerId: string | null;
      manager: {
        id: string;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
        title: string | null;
      } | null;
    } | null>;
    findMany: (args: {
      where: {
        orgId: string;
        managerId: string | { in: string[] };
        id?: {
          not: string;
        };
      };
      take?: number;
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }];
      select: {
        id: true;
        firstName: true;
        lastName: true;
        avatarUrl: true;
        title: true;
        managerId?: true;
      };
    }) => Promise<
      Array<{
        id: string;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
        title: string | null;
        managerId?: string;
      }>
    >;
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

export interface HomeViewerOverview {
  displayName: string;
  firstName: string;
  avatarUrl: string | null;
  title: string | null;
  department: string | null;
  manager: {
    id: string;
    name: string;
    avatarUrl: string | null;
    title: string | null;
  } | null;
  peers: Array<{
    id: string;
    name: string;
    avatarUrl: string | null;
    title: string | null;
  }>;
  directReports: Array<{
    id: string;
    name: string;
    avatarUrl: string | null;
    title: string | null;
    childReports: Array<{
      id: string;
      name: string;
      avatarUrl: string | null;
      title: string | null;
    }>;
  }>;
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
  if (!hasHrAdminAccess(context.role)) {
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

export async function getHomeViewerOverview(
  context: RequestContext,
  db: HomeViewerDb = prisma as unknown as HomeViewerDb,
): Promise<HomeViewerOverview | null> {
  const employee = await db.employee.findFirst({
    where: {
      orgId: context.orgId,
      userId: context.userId,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      title: true,
      department: true,
      managerId: true,
      manager: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          title: true,
        },
      },
    },
  });

  if (!employee) {
    return null;
  }

  const [peers, directReports] = await Promise.all([
    employee.managerId != null
      ? db.employee.findMany({
          where: {
            orgId: context.orgId,
            managerId: employee.managerId,
            id: {
              not: employee.id,
            },
          },
          take: 5,
          orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            title: true,
          },
        })
      : Promise.resolve([]),
    hasManagerAccess(context.role) || hasHrAdminAccess(context.role)
      ? db.employee.findMany({
          where: {
            orgId: context.orgId,
            managerId: employee.id,
          },
          take: 5,
          orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            title: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const childReports =
    directReports.length > 0
      ? await db.employee.findMany({
          where: {
            orgId: context.orgId,
            managerId: {
              in: directReports.map((person) => person.id),
            },
          },
          orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            title: true,
            managerId: true,
          },
        })
      : [];

  const childReportsByManagerId = new Map<
    string,
    Array<{
      id: string;
      name: string;
      avatarUrl: string | null;
      title: string | null;
    }>
  >();

  for (const child of childReports) {
    if (!child.managerId) {
      continue;
    }

    const existing = childReportsByManagerId.get(child.managerId) ?? [];
    existing.push({
      id: child.id,
      name: `${child.firstName} ${child.lastName}`.trim(),
      avatarUrl: child.avatarUrl,
      title: child.title,
    });
    childReportsByManagerId.set(child.managerId, existing);
  }

  return {
    displayName: `${employee.firstName} ${employee.lastName}`.trim(),
    firstName: employee.firstName,
    avatarUrl: employee.avatarUrl,
    title: employee.title,
    department: employee.department,
    manager: employee.manager
      ? {
          id: employee.manager.id,
          name: `${employee.manager.firstName} ${employee.manager.lastName}`.trim(),
          avatarUrl: employee.manager.avatarUrl,
          title: employee.manager.title,
        }
      : null,
    peers: peers.map((person) => ({
      id: person.id,
      name: `${person.firstName} ${person.lastName}`.trim(),
      avatarUrl: person.avatarUrl,
      title: person.title,
    })),
    directReports: directReports.map((person) => ({
      id: person.id,
      name: `${person.firstName} ${person.lastName}`.trim(),
      avatarUrl: person.avatarUrl,
      title: person.title,
      childReports: childReportsByManagerId.get(person.id) ?? [],
    })),
  };
}

import { UserRole } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import type { RequestContext } from "@/server/auth/request-context";
import {
  getHomeViewerOverview,
  getManagerHomeSnapshot,
} from "@/server/home/home-dashboard-service";

describe("getHomeViewerOverview", () => {
  it("shows direct reports for top-of-tree super admins without peers above them", async () => {
    const context: RequestContext = {
      userId: "user_super_admin_1",
      orgId: "org_demo_1",
      role: UserRole.SUPER_ADMIN,
    };

    const db = {
      employee: {
        findFirst: vi.fn().mockResolvedValue({
          id: "employee_super_admin_1",
          firstName: "Lisa",
          lastName: "Letto",
          avatarUrl: null,
          title: "Chief Product Officer",
          department: "Executive",
          managerId: null,
          manager: null,
        }),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "employee_manager_1",
            firstName: "Elliot",
            lastName: "Mah",
            avatarUrl: null,
            title: "Manager",
          },
        ]),
      },
    };

    const result = await getHomeViewerOverview(context, db as never);

    expect(result?.peers).toEqual([]);
    expect(result?.directReports).toEqual([
      {
        id: "employee_manager_1",
        name: "Elliot Mah",
        avatarUrl: null,
        title: "Manager",
        childReports: [],
      },
    ]);
    expect(db.employee.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          orgId: context.orgId,
          managerId: "employee_super_admin_1",
        }),
      }),
    );
  });

  it("shows peers for individual contributors who report into a manager", async () => {
    const context: RequestContext = {
      userId: "user_employee_1",
      orgId: "org_demo_1",
      role: UserRole.EMPLOYEE,
    };

    const db = {
      employee: {
        findFirst: vi.fn().mockResolvedValue({
          id: "employee_1",
          firstName: "Taylor",
          lastName: "Worker",
          avatarUrl: null,
          title: "Coordinator",
          department: "Operations",
          managerId: "employee_manager_1",
          manager: {
            id: "employee_manager_1",
            firstName: "Elliot",
            lastName: "Mah",
            avatarUrl: null,
            title: "Manager",
          },
        }),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "employee_peer_1",
            firstName: "Sam",
            lastName: "Peer",
            avatarUrl: null,
            title: "Operator",
          },
        ]),
      },
    };

    const result = await getHomeViewerOverview(context, db as never);

    expect(result?.manager?.name).toBe("Elliot Mah");
    expect(result?.peers).toEqual([
      {
        id: "employee_peer_1",
        name: "Sam Peer",
        avatarUrl: null,
        title: "Operator",
      },
    ]);
    expect(result?.directReports).toEqual([]);
    expect(db.employee.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          orgId: context.orgId,
          managerId: "employee_manager_1",
          id: {
            not: "employee_1",
          },
        },
      }),
    );
  });

  it("shows both peers and direct reports for managers who sit inside a larger team", async () => {
    const context: RequestContext = {
      userId: "user_manager_1",
      orgId: "org_demo_1",
      role: UserRole.MANAGER,
    };

    const db = {
      employee: {
        findFirst: vi.fn().mockResolvedValue({
          id: "employee_manager_1",
          firstName: "Elliot",
          lastName: "Mah",
          avatarUrl: null,
          title: "Manager",
          department: "Technology",
          managerId: "employee_exec_1",
          manager: {
            id: "employee_exec_1",
            firstName: "Freddie",
            lastName: "Martinez",
            avatarUrl: null,
            title: "Chief Technology Officer",
          },
        }),
        findMany: vi
          .fn()
          .mockResolvedValueOnce([
            {
              id: "employee_super_admin_1",
              firstName: "Sameer",
              lastName: "Pasha",
              avatarUrl: null,
              title: "Super Admin",
            },
          ])
          .mockResolvedValueOnce([
            {
              id: "employee_report_1",
              firstName: "Ted",
              lastName: "Tederoff",
              avatarUrl: null,
              title: "Application Support and Development",
            },
          ])
          .mockResolvedValueOnce([
            {
              id: "employee_report_2",
              firstName: "Dominic",
              lastName: "Banach",
              avatarUrl: null,
              title: "IT Student",
              managerId: "employee_report_1",
            },
          ]),
      },
    };

    const result = await getHomeViewerOverview(context, db as never);

    expect(result?.manager?.name).toBe("Freddie Martinez");
    expect(result?.peers).toEqual([
      {
        id: "employee_super_admin_1",
        name: "Sameer Pasha",
        avatarUrl: null,
        title: "Super Admin",
      },
    ]);
    expect(result?.directReports).toEqual([
      {
        id: "employee_report_1",
        name: "Ted Tederoff",
        avatarUrl: null,
        title: "Application Support and Development",
        childReports: [
          {
            id: "employee_report_2",
            name: "Dominic Banach",
            avatarUrl: null,
            title: "IT Student",
          },
        ],
      },
    ]);
    expect(db.employee.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: {
          orgId: context.orgId,
          managerId: "employee_exec_1",
          id: {
            not: "employee_manager_1",
          },
        },
      }),
    );
    expect(db.employee.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: {
          orgId: context.orgId,
          managerId: "employee_manager_1",
        },
      }),
    );
    expect(db.employee.findMany).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        where: {
          orgId: context.orgId,
          managerId: {
            in: ["employee_report_1"],
          },
        },
      }),
    );
  });
});

describe("getManagerHomeSnapshot", () => {
  it("returns manager metrics for HR admins who manage direct reports", async () => {
    const context: RequestContext = {
      userId: "user_hr_admin_1",
      orgId: "org_demo_1",
      role: UserRole.HR_ADMIN,
    };

    const db = {
      employee: {
        findFirst: vi.fn().mockResolvedValue({
          id: "employee_hr_admin_1",
        }),
        count: vi.fn().mockResolvedValue(2),
      },
      reviewSubmission: {
        count: vi
          .fn()
          .mockResolvedValueOnce(1)
          .mockResolvedValueOnce(1),
      },
      reviewCycle: {
        count: vi.fn(),
      },
    };

    const result = await getManagerHomeSnapshot(context, db as never);

    expect(result).toEqual({
      directReportCount: 2,
      awaitingManagerReviewCount: 1,
      selfReviewNotStartedCount: 1,
    });
  });

  it("returns zeroes when the viewer does not resolve to an employee profile", async () => {
    const context: RequestContext = {
      userId: "user_employee_1",
      orgId: "org_demo_1",
      role: UserRole.EMPLOYEE,
    };

    const db = {
      employee: {
        findFirst: vi.fn().mockResolvedValue(null),
        count: vi.fn(),
      },
      reviewSubmission: {
        count: vi.fn(),
      },
      reviewCycle: {
        count: vi.fn(),
      },
    };

    const result = await getManagerHomeSnapshot(context, db as never);

    expect(result).toEqual({
      directReportCount: 0,
      awaitingManagerReviewCount: 0,
      selfReviewNotStartedCount: 0,
    });
  });
});

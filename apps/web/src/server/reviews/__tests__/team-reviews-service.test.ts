import {
  CycleStatus,
  FinalRatingSource,
  ReviewRelationship,
  ReviewSubmissionStatus,
  UserRole,
} from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { getManagerTeamReviewDashboard } from "@/server/reviews/team-reviews-service";

describe("getManagerTeamReviewDashboard", () => {
  it("rejects non-manager access", async () => {
    await expect(
      getManagerTeamReviewDashboard(
        {
          userId: "user_employee_1",
          orgId: "org_demo_1",
          role: UserRole.EMPLOYEE,
        },
        {},
        {
          employee: {
            findFirst: vi.fn(),
          },
          reviewSubmission: {
            findMany: vi.fn(),
          },
          reviewPacket: {
            findMany: vi.fn(),
          },
        },
      ),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
  });

  it("returns manager KPIs and rows for latest cycle", async () => {
    const db = {
      employee: {
        findFirst: vi.fn().mockResolvedValue({
          id: "employee_manager_1",
          directReports: [
            {
              id: "employee_1",
              firstName: "Ava",
              lastName: "Builder",
              title: "Site Supervisor",
              department: "Operations",
            },
          ],
        }),
      },
      reviewSubmission: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "submission_manager_latest",
            cycleId: "cycle_latest",
            status: ReviewSubmissionStatus.IN_PROGRESS,
            relationship: ReviewRelationship.MANAGER,
            subjectEmployeeId: "employee_1",
            subjectEmployee: {
              id: "employee_1",
              firstName: "Ava",
              lastName: "Builder",
              title: "Site Supervisor",
              department: "Operations",
            },
            cycle: {
              id: "cycle_latest",
              name: "Annual 2026",
              status: CycleStatus.ACTIVE,
              endDate: new Date("2026-12-30T00:00:00.000Z"),
            },
            dueAt: new Date("2026-11-30T00:00:00.000Z"),
          },
          {
            id: "submission_self_latest",
            cycleId: "cycle_latest",
            status: ReviewSubmissionStatus.SUBMITTED,
            relationship: ReviewRelationship.SELF,
            subjectEmployeeId: "employee_1",
            subjectEmployee: {
              id: "employee_1",
              firstName: "Ava",
              lastName: "Builder",
              title: "Site Supervisor",
              department: "Operations",
            },
            cycle: {
              id: "cycle_latest",
              name: "Annual 2026",
              status: CycleStatus.ACTIVE,
              endDate: new Date("2026-12-30T00:00:00.000Z"),
            },
            dueAt: new Date("2026-11-28T00:00:00.000Z"),
          },
          {
            id: "submission_manager_old",
            cycleId: "cycle_old",
            status: ReviewSubmissionStatus.SUBMITTED,
            relationship: ReviewRelationship.MANAGER,
            subjectEmployeeId: "employee_2",
            subjectEmployee: {
              id: "employee_2",
              firstName: "Ben",
              lastName: "Foreman",
              title: "Foreman",
              department: "Projects",
            },
            cycle: {
              id: "cycle_old",
              name: "Annual 2025",
              status: CycleStatus.RELEASED,
              endDate: new Date("2025-12-30T00:00:00.000Z"),
            },
            dueAt: new Date("2025-11-30T00:00:00.000Z"),
          },
        ]),
      },
      reviewPacket: {
        findMany: vi.fn().mockResolvedValue([
          {
            scorecardOverallRating: 4,
            finalRatingSource: FinalRatingSource.SCORECARD,
          },
        ]),
      },
    };

    const dashboard = await getManagerTeamReviewDashboard(
      {
        userId: "user_manager_1",
        orgId: "org_demo_1",
        role: UserRole.MANAGER,
      },
      {},
      db,
    );

    expect(dashboard.cycle?.id).toBe("cycle_latest");
    expect(dashboard.cycles.map((cycle) => cycle.id)).toEqual(["cycle_latest", "cycle_old"]);
    expect(dashboard.rows).toHaveLength(1);
    expect(dashboard.rows[0].employeeName).toBe("Ava Builder");
    expect(dashboard.rows[0].managerReviewHref).toBe(
      "/performance/reviews/cycle_latest/write/submission_manager_latest",
    );
    expect(dashboard.kpis.totalDirectReports).toBe(1);
    expect(dashboard.kpis.awaitingManagerReview).toBe(0);
    expect(dashboard.kpis.inProgressManagerReview).toBe(1);
    expect(dashboard.kpis.completedManagerReview).toBe(0);
    expect(dashboard.insights.scorecardDistribution["4"]).toBe(1);
    expect(dashboard.insights.finalDistribution["4"]).toBe(1);
  });

  it("allows super admins to open the team dashboard when they manage reports", async () => {
    const db = {
      employee: {
        findFirst: vi.fn().mockResolvedValue({
          id: "employee_super_admin_1",
          directReports: [
            {
              id: "employee_1",
              firstName: "Ava",
              lastName: "Builder",
              title: "Site Supervisor",
              department: "Operations",
            },
          ],
        }),
      },
      reviewSubmission: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      reviewPacket: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    const dashboard = await getManagerTeamReviewDashboard(
      {
        userId: "user_super_admin_1",
        orgId: "org_demo_1",
        role: UserRole.SUPER_ADMIN,
      },
      {},
      db,
    );

    expect(dashboard.kpis.totalDirectReports).toBe(1);
    expect(dashboard.rows[0]?.employeeName).toBe("Ava Builder");
  });

  it("allows HR admins to use the team dashboard when they also manage reports", async () => {
    const db = {
      employee: {
        findFirst: vi.fn().mockResolvedValue({
          id: "employee_hr_admin_1",
          directReports: [
            {
              id: "employee_1",
              firstName: "Ava",
              lastName: "Builder",
              title: "Site Supervisor",
              department: "Operations",
            },
          ],
        }),
      },
      reviewSubmission: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      reviewPacket: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    const dashboard = await getManagerTeamReviewDashboard(
      {
        userId: "user_hr_admin_1",
        orgId: "org_demo_1",
        role: UserRole.HR_ADMIN,
      },
      {},
      db,
    );

    expect(dashboard.kpis.totalDirectReports).toBe(1);
    expect(dashboard.rows[0]?.employeeName).toBe("Ava Builder");
  });

  it("hides the manager write action until the self review is submitted", async () => {
    const db = {
      employee: {
        findFirst: vi.fn().mockResolvedValue({
          id: "employee_manager_1",
          directReports: [
            {
              id: "employee_1",
              firstName: "Ava",
              lastName: "Builder",
              title: "Site Supervisor",
              department: "Operations",
            },
          ],
        }),
      },
      reviewSubmission: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "submission_manager_latest",
            cycleId: "cycle_latest",
            status: ReviewSubmissionStatus.NOT_STARTED,
            relationship: ReviewRelationship.MANAGER,
            subjectEmployeeId: "employee_1",
            subjectEmployee: {
              id: "employee_1",
              firstName: "Ava",
              lastName: "Builder",
              title: "Site Supervisor",
              department: "Operations",
            },
            cycle: {
              id: "cycle_latest",
              name: "Annual 2026",
              status: CycleStatus.ACTIVE,
              endDate: new Date("2026-12-30T00:00:00.000Z"),
            },
            dueAt: new Date("2026-11-30T00:00:00.000Z"),
          },
          {
            id: "submission_self_latest",
            cycleId: "cycle_latest",
            status: ReviewSubmissionStatus.IN_PROGRESS,
            relationship: ReviewRelationship.SELF,
            subjectEmployeeId: "employee_1",
            subjectEmployee: {
              id: "employee_1",
              firstName: "Ava",
              lastName: "Builder",
              title: "Site Supervisor",
              department: "Operations",
            },
            cycle: {
              id: "cycle_latest",
              name: "Annual 2026",
              status: CycleStatus.ACTIVE,
              endDate: new Date("2026-12-30T00:00:00.000Z"),
            },
            dueAt: new Date("2026-11-28T00:00:00.000Z"),
          },
        ]),
      },
      reviewPacket: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    const dashboard = await getManagerTeamReviewDashboard(
      {
        userId: "user_manager_1",
        orgId: "org_demo_1",
        role: UserRole.MANAGER,
      },
      {},
      db,
    );

    expect(dashboard.rows[0]?.managerReviewHref).toBeNull();
  });

  it("keeps the real direct-report count even before HR generates submissions", async () => {
    const db = {
      employee: {
        findFirst: vi.fn().mockResolvedValue({
          id: "employee_manager_1",
          directReports: [
            {
              id: "employee_1",
              firstName: "Ava",
              lastName: "Builder",
              title: "Site Supervisor",
              department: "Operations",
            },
          ],
        }),
      },
      reviewSubmission: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      reviewPacket: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    const dashboard = await getManagerTeamReviewDashboard(
      {
        userId: "user_manager_1",
        orgId: "org_demo_1",
        role: UserRole.MANAGER,
      },
      {},
      db,
    );

    expect(dashboard.kpis.totalDirectReports).toBe(1);
    expect(dashboard.rows).toEqual([
      expect.objectContaining({
        employeeId: "employee_1",
        employeeName: "Ava Builder",
        title: "Site Supervisor",
        department: "Operations",
        statuses: {},
        packetHref: null,
        managerReviewHref: null,
      }),
    ]);
  });
});

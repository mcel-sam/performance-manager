import { CycleStatus, ReviewRelationship, ReviewSubmissionStatus, UserRole } from "@prisma/client";
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
        {
          employee: {
            findFirst: vi.fn(),
          },
          reviewSubmission: {
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
        findFirst: vi.fn().mockResolvedValue({ id: "employee_manager_1" }),
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
            },
            cycle: {
              id: "cycle_latest",
              name: "Annual 2026",
              status: CycleStatus.ACTIVE,
              endDate: new Date("2026-12-30T00:00:00.000Z"),
            },
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
            },
            cycle: {
              id: "cycle_latest",
              name: "Annual 2026",
              status: CycleStatus.ACTIVE,
              endDate: new Date("2026-12-30T00:00:00.000Z"),
            },
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
            },
            cycle: {
              id: "cycle_old",
              name: "Annual 2025",
              status: CycleStatus.RELEASED,
              endDate: new Date("2025-12-30T00:00:00.000Z"),
            },
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
      db,
    );

    expect(dashboard.cycle?.id).toBe("cycle_latest");
    expect(dashboard.rows).toHaveLength(1);
    expect(dashboard.rows[0].employeeName).toBe("Ava Builder");
    expect(dashboard.kpis.awaitingReview).toBe(0);
    expect(dashboard.kpis.inProgress).toBe(1);
    expect(dashboard.kpis.completed).toBe(0);
  });
});

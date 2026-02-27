import { ImprovementPlanStatus, UserRole } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import {
  createImprovementPlan,
  getImprovementPlanDetail,
  listImprovementPlans,
} from "@/server/improvement-plans/improvement-plan-service";

function buildDbMock() {
  return {
    employee: {
      findFirst: vi.fn(),
    },
    improvementPlan: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    auditEvent: {
      create: vi.fn(),
    },
  };
}

const hrAdminContext = {
  userId: "user_hr_admin_1",
  orgId: "org_demo_1",
  role: UserRole.HR_ADMIN,
};

const managerContext = {
  userId: "user_manager_1",
  orgId: "org_demo_1",
  role: UserRole.MANAGER,
};

const employeeContext = {
  userId: "user_employee_1",
  orgId: "org_demo_1",
  role: UserRole.EMPLOYEE,
};

describe("createImprovementPlan", () => {
  it("creates a plan and writes an audit event for HR admin", async () => {
    const db = buildDbMock();

    db.employee.findFirst
      .mockResolvedValueOnce({
        id: "emp_employee_1",
        userId: "user_employee_1",
        managerId: "emp_manager_1",
        firstName: "Elliot",
        lastName: "Employee",
      })
      .mockResolvedValueOnce({
        id: "emp_hr_admin_1",
        userId: "user_hr_admin_1",
        managerId: null,
        firstName: "Harper",
        lastName: "Admin",
      })
      .mockResolvedValueOnce({
        id: "emp_manager_1",
        userId: "user_manager_1",
        managerId: "emp_hr_admin_1",
        firstName: "Morgan",
        lastName: "Manager",
      })
      .mockResolvedValueOnce({
        id: "emp_hr_admin_1",
        userId: "user_hr_admin_1",
        managerId: null,
        firstName: "Harper",
        lastName: "Admin",
      });

    db.improvementPlan.create.mockResolvedValue({
      id: "plan_1",
      title: "Q2 Support Plan",
      status: ImprovementPlanStatus.DRAFT,
      startDate: new Date("2026-04-01T00:00:00.000Z"),
      endDate: new Date("2026-06-30T00:00:00.000Z"),
      createdAt: new Date("2026-03-01T00:00:00.000Z"),
      updatedAt: new Date("2026-03-01T00:00:00.000Z"),
    });
    db.auditEvent.create.mockResolvedValue({ id: "audit_plan_created_1" });

    const result = await createImprovementPlan(
      {
        subjectEmployeeId: "emp_employee_1",
        title: "Q2 Support Plan",
        expectations: "Improve delivery predictability.",
        startDate: "2026-04-01T00:00:00.000Z",
        endDate: "2026-06-30T00:00:00.000Z",
        goals: [
          {
            title: "Improve sprint commitment reliability",
            description: "Hold 90 percent commitment accuracy.",
          },
        ],
      },
      hrAdminContext,
      db as never,
    );

    expect(result.id).toBe("plan_1");
    expect(db.improvementPlan.create).toHaveBeenCalledTimes(1);
    expect(db.auditEvent.create).toHaveBeenCalledTimes(1);
  });

  it("rejects manager create attempts for non-direct reports", async () => {
    const db = buildDbMock();

    db.employee.findFirst
      .mockResolvedValueOnce({
        id: "emp_peer_1",
        userId: "user_peer_1",
        managerId: "emp_other_manager",
        firstName: "Parker",
        lastName: "Peer",
      })
      .mockResolvedValueOnce({
        id: "emp_manager_1",
        userId: "user_manager_1",
        managerId: "emp_hr_admin_1",
        firstName: "Morgan",
        lastName: "Manager",
      });

    await expect(
      createImprovementPlan(
        {
          subjectEmployeeId: "emp_peer_1",
          title: "Support Plan",
          expectations: "Improve communication.",
          startDate: "2026-04-01T00:00:00.000Z",
          endDate: "2026-05-01T00:00:00.000Z",
          goals: [
            {
              title: "Goal 1",
            },
          ],
        },
        managerContext,
        db as never,
      ),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });

    expect(db.improvementPlan.create).not.toHaveBeenCalled();
    expect(db.auditEvent.create).not.toHaveBeenCalled();
  });

  it("rejects employees from creating plans", async () => {
    const db = buildDbMock();

    await expect(
      createImprovementPlan(
        {
          subjectEmployeeId: "emp_employee_1",
          title: "Support Plan",
          expectations: "Improve communication.",
          startDate: "2026-04-01T00:00:00.000Z",
          endDate: "2026-05-01T00:00:00.000Z",
          goals: [
            {
              title: "Goal 1",
            },
          ],
        },
        employeeContext,
        db as never,
      ),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });

    expect(db.employee.findFirst).not.toHaveBeenCalled();
    expect(db.improvementPlan.create).not.toHaveBeenCalled();
  });
});

describe("listImprovementPlans", () => {
  it("returns plans scoped to the current viewer", async () => {
    const db = buildDbMock();

    db.employee.findFirst.mockResolvedValue({
      id: "emp_manager_1",
      userId: "user_manager_1",
      managerId: "emp_hr_admin_1",
      firstName: "Morgan",
      lastName: "Manager",
    });

    db.improvementPlan.findMany.mockResolvedValue([
      {
        id: "plan_1",
        subjectEmployeeId: "emp_employee_1",
        managerEmployeeId: "emp_manager_1",
        hrOwnerEmployeeId: "emp_hr_admin_1",
        title: "Q2 Support Plan",
        startDate: new Date("2026-04-01T00:00:00.000Z"),
        endDate: new Date("2026-06-30T00:00:00.000Z"),
        status: ImprovementPlanStatus.DRAFT,
        createdAt: new Date("2026-03-01T00:00:00.000Z"),
        updatedAt: new Date("2026-03-02T00:00:00.000Z"),
        subjectEmployee: {
          id: "emp_employee_1",
          firstName: "Elliot",
          lastName: "Employee",
        },
        managerEmployee: {
          id: "emp_manager_1",
          firstName: "Morgan",
          lastName: "Manager",
        },
        hrOwnerEmployee: {
          id: "emp_hr_admin_1",
          firstName: "Harper",
          lastName: "Admin",
        },
      },
    ]);

    const result = await listImprovementPlans(managerContext, db as never);

    expect(result).toHaveLength(1);
    expect(db.improvementPlan.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ subjectEmployeeId: "emp_manager_1" }),
            expect.objectContaining({ managerEmployeeId: "emp_manager_1" }),
            expect.objectContaining({ hrOwnerEmployeeId: "emp_manager_1" }),
          ]),
        }),
      }),
    );
  });
});

describe("getImprovementPlanDetail", () => {
  it("returns detail for HR admin", async () => {
    const db = buildDbMock();

    db.improvementPlan.findFirst.mockResolvedValue({
      id: "plan_1",
      orgId: "org_demo_1",
      subjectEmployeeId: "emp_subject_1",
      managerEmployeeId: "emp_manager_1",
      hrOwnerEmployeeId: "emp_hr_admin_1",
      title: "Plan",
      expectations: "Improve outcomes.",
      startDate: new Date("2026-04-01T00:00:00.000Z"),
      endDate: new Date("2026-06-30T00:00:00.000Z"),
      status: ImprovementPlanStatus.DRAFT,
      outcome: null,
      createdAt: new Date("2026-03-01T00:00:00.000Z"),
      updatedAt: new Date("2026-03-02T00:00:00.000Z"),
      subjectEmployee: { id: "emp_subject_1", firstName: "Sub", lastName: "Ject" },
      managerEmployee: { id: "emp_manager_1", firstName: "Morgan", lastName: "Manager" },
      hrOwnerEmployee: { id: "emp_hr_admin_1", firstName: "Harper", lastName: "Admin" },
      goals: [
        {
          id: "goal_1",
          title: "Goal",
          description: null,
          sortOrder: 1,
        },
      ],
      checkIns: [{ id: "checkin_1" }],
    });

    const result = await getImprovementPlanDetail("plan_1", hrAdminContext, db as never);

    expect(result.id).toBe("plan_1");
    expect(result.checkInCount).toBe(1);
    expect(db.employee.findFirst).not.toHaveBeenCalled();
  });

  it("denies detail access when viewer is outside plan participants", async () => {
    const db = buildDbMock();

    db.improvementPlan.findFirst.mockResolvedValue({
      id: "plan_1",
      orgId: "org_demo_1",
      subjectEmployeeId: "emp_subject_1",
      managerEmployeeId: "emp_manager_1",
      hrOwnerEmployeeId: "emp_hr_admin_1",
      title: "Plan",
      expectations: "Improve outcomes.",
      startDate: new Date("2026-04-01T00:00:00.000Z"),
      endDate: new Date("2026-06-30T00:00:00.000Z"),
      status: ImprovementPlanStatus.DRAFT,
      outcome: null,
      createdAt: new Date("2026-03-01T00:00:00.000Z"),
      updatedAt: new Date("2026-03-02T00:00:00.000Z"),
      subjectEmployee: { id: "emp_subject_1", firstName: "Sub", lastName: "Ject" },
      managerEmployee: { id: "emp_manager_1", firstName: "Morgan", lastName: "Manager" },
      hrOwnerEmployee: { id: "emp_hr_admin_1", firstName: "Harper", lastName: "Admin" },
      goals: [],
      checkIns: [],
    });

    db.employee.findFirst.mockResolvedValue({
      id: "emp_employee_1",
      userId: "user_employee_1",
      managerId: "emp_manager_1",
      firstName: "Elliot",
      lastName: "Employee",
    });

    await expect(
      getImprovementPlanDetail("plan_1", employeeContext, db as never),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
  });
});

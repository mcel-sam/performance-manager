import {
  GoalCycleCadence,
  GoalCycleStatus,
  GoalStatus,
  GoalVisibility,
  ReviewQuestionType,
  UserRole,
} from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import {
  alignGoal,
  createGoal,
  createGoalUpdate,
} from "@/server/goals/goal-service";

function buildGoalDbMock() {
  return {
    employee: {
      findFirst: vi.fn(),
    },
    goalCycle: {
      findFirst: vi.fn(),
    },
    goal: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    keyResult: {
      findMany: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    goalUpdate: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    goalCompetencyLink: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    goalWatcher: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    evidenceItem: {
      create: vi.fn(),
    },
    auditEvent: {
      create: vi.fn(),
    },
  };
}

const employeeContext = {
  userId: "user_employee_1",
  orgId: "org_demo_1",
  role: UserRole.EMPLOYEE,
};

const managerContext = {
  userId: "user_manager_1",
  orgId: "org_demo_1",
  role: UserRole.MANAGER,
};

describe("createGoal", () => {
  it("prevents an employee from creating a goal for another employee", async () => {
    const db = buildGoalDbMock();
    db.employee.findFirst.mockResolvedValue({
      id: "emp_employee_1",
      managerId: "emp_manager_1",
      directReports: [],
    });

    await expect(
      createGoal(
        {
          ownerEmployeeId: "emp_employee_2",
          cycleId: "goal_cycle_1",
          title: "Improve delivery reliability",
          visibility: GoalVisibility.TEAM,
        },
        employeeContext,
        db as never,
      ),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
  });
});

describe("alignGoal", () => {
  it("rejects self-parent alignment", async () => {
    const db = buildGoalDbMock();
    db.employee.findFirst.mockResolvedValue({
      id: "emp_manager_1",
      managerId: null,
      directReports: [{ id: "emp_employee_1" }],
    });
    db.goal.findFirst.mockResolvedValue({
      id: "goal_1",
      orgId: "org_demo_1",
      cycleId: "goal_cycle_1",
      ownerEmployeeId: "emp_employee_1",
      title: "Delivery",
      description: null,
      status: GoalStatus.ON_TRACK,
      progressPercent: 50,
      visibility: GoalVisibility.TEAM,
      parentGoalId: null,
      createdAt: new Date("2026-03-01T00:00:00.000Z"),
      updatedAt: new Date("2026-03-01T00:00:00.000Z"),
      ownerEmployee: {
        id: "emp_employee_1",
        userId: "user_employee_1",
        managerId: "emp_manager_1",
        firstName: "Elliot",
        lastName: "Barnes",
      },
    });

    await expect(
      alignGoal("goal_1", { parentGoalId: "goal_1" }, managerContext, db as never),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      status: 400,
    });
  });

  it("rejects goal loops", async () => {
    const db = buildGoalDbMock();
    db.employee.findFirst.mockResolvedValue({
      id: "emp_manager_1",
      managerId: null,
      directReports: [{ id: "emp_employee_1" }],
    });
    db.goal.findFirst
      .mockResolvedValueOnce({
        id: "goal_a",
        orgId: "org_demo_1",
        cycleId: "goal_cycle_1",
        ownerEmployeeId: "emp_employee_1",
        title: "Goal A",
        description: null,
        status: GoalStatus.ON_TRACK,
        progressPercent: 40,
        visibility: GoalVisibility.TEAM,
        parentGoalId: null,
        createdAt: new Date("2026-03-01T00:00:00.000Z"),
        updatedAt: new Date("2026-03-01T00:00:00.000Z"),
        ownerEmployee: {
          id: "emp_employee_1",
          userId: "user_employee_1",
          managerId: "emp_manager_1",
          firstName: "Elliot",
          lastName: "Barnes",
        },
      })
      .mockResolvedValueOnce({
        id: "goal_b",
        orgId: "org_demo_1",
        cycleId: "goal_cycle_1",
        ownerEmployeeId: "emp_employee_1",
        title: "Goal B",
        description: null,
        status: GoalStatus.ON_TRACK,
        progressPercent: 60,
        visibility: GoalVisibility.TEAM,
        parentGoalId: "goal_c",
        createdAt: new Date("2026-03-01T00:00:00.000Z"),
        updatedAt: new Date("2026-03-01T00:00:00.000Z"),
        ownerEmployee: {
          id: "emp_employee_1",
          userId: "user_employee_1",
          managerId: "emp_manager_1",
          firstName: "Elliot",
          lastName: "Barnes",
        },
      })
      .mockResolvedValueOnce({
        id: "goal_c",
        orgId: "org_demo_1",
        cycleId: "goal_cycle_1",
        ownerEmployeeId: "emp_employee_1",
        title: "Goal C",
        description: null,
        status: GoalStatus.ON_TRACK,
        progressPercent: 80,
        visibility: GoalVisibility.TEAM,
        parentGoalId: "goal_a",
        createdAt: new Date("2026-03-01T00:00:00.000Z"),
        updatedAt: new Date("2026-03-01T00:00:00.000Z"),
        ownerEmployee: {
          id: "emp_employee_1",
          userId: "user_employee_1",
          managerId: "emp_manager_1",
          firstName: "Elliot",
          lastName: "Barnes",
        },
      });

    await expect(
      alignGoal("goal_a", { parentGoalId: "goal_b" }, managerContext, db as never),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      status: 400,
    });
  });
});

describe("createGoalUpdate", () => {
  it("allows a manager to post an update on a direct report goal and writes an audit event", async () => {
    const db = buildGoalDbMock();
    db.employee.findFirst.mockResolvedValue({
      id: "emp_manager_1",
      managerId: null,
      directReports: [{ id: "emp_employee_1" }],
    });
    db.goal.findFirst.mockResolvedValue({
      id: "goal_1",
      orgId: "org_demo_1",
      cycleId: "goal_cycle_1",
      ownerEmployeeId: "emp_employee_1",
      title: "Delivery",
      description: null,
      status: GoalStatus.ON_TRACK,
      progressPercent: 25,
      visibility: GoalVisibility.PRIVATE,
      parentGoalId: null,
      createdAt: new Date("2026-03-01T00:00:00.000Z"),
      updatedAt: new Date("2026-03-01T00:00:00.000Z"),
      ownerEmployee: {
        id: "emp_employee_1",
        userId: "user_employee_1",
        managerId: "emp_manager_1",
        firstName: "Elliot",
        lastName: "Barnes",
      },
      cycle: {
        id: "goal_cycle_1",
        name: "Q4 2026",
        status: GoalCycleStatus.ACTIVE,
        cadence: GoalCycleCadence.QUARTERLY,
        startDate: new Date("2026-10-01T00:00:00.000Z"),
        endDate: new Date("2026-12-31T00:00:00.000Z"),
      },
      parentGoal: null,
      childGoals: [],
      keyResults: [
        {
          id: "kr_1",
          title: "Ship",
          type: ReviewQuestionType.TEXT as never,
          startValue: 0,
          targetValue: 10,
          currentValue: 2,
          weight: null,
          sortOrder: 0,
        },
      ],
      competencyLinks: [],
      watchers: [],
    });
    db.keyResult.findMany.mockResolvedValue([
      {
        type: "NUMBER",
        startValue: 0,
        targetValue: 10,
        currentValue: 6,
        weight: null,
      },
    ]);
    db.goal.update.mockResolvedValue({ id: "goal_1" });
    db.goalUpdate.create.mockResolvedValue({
      id: "update_1",
      note: "Momentum is improving",
      progressDelta: 35,
      snapshotProgressPercent: 60,
      snapshotCurrentValues: [],
      createdAt: new Date("2026-03-05T00:00:00.000Z"),
      authorEmployee: {
        id: "emp_manager_1",
        firstName: "Morgan",
        lastName: "Patel",
      },
    });
    db.evidenceItem.create.mockResolvedValue({ id: "evidence_goal_update_1" });
    db.auditEvent.create.mockResolvedValue({ id: "audit_1" });

    const result = await createGoalUpdate(
      "goal_1",
      {
        note: "Momentum is improving",
        keyResults: [{ keyResultId: "kr_1", currentValue: 6 }],
      },
      managerContext,
      db as never,
    );

    expect(result.snapshotProgressPercent).toBe(60);
    expect(db.keyResult.update).toHaveBeenCalledTimes(1);
    expect(db.evidenceItem.create).toHaveBeenCalledTimes(1);
    expect(db.evidenceItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "GOAL_UPDATE",
          subjectEmployeeId: "emp_employee_1",
        }),
      }),
    );
    expect(db.auditEvent.create).toHaveBeenCalledTimes(1);
  });
});

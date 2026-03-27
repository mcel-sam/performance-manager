import {
  GoalCycleCadence,
  GoalCycleStatus,
  GoalStatus,
  GoalType,
  GoalVisibility,
  GoalWorkflowStatus,
  KeyResultType,
  UserRole,
} from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import {
  alignGoal,
  createGoal,
  getGoal,
  createGoalUpdate,
  transitionGoalWorkflow,
  updateGoal,
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

const hrAdminContext = {
  userId: "user_hr_admin_1",
  orgId: "org_demo_1",
  role: UserRole.HR_ADMIN,
};

const superAdminContext = {
  userId: "user_super_admin_1",
  orgId: "org_demo_1",
  role: UserRole.SUPER_ADMIN,
};

function mockViewer(db: ReturnType<typeof buildGoalDbMock>, role: UserRole) {
  if (role === UserRole.MANAGER) {
    db.employee.findFirst.mockResolvedValue({
      id: "emp_manager_1",
      managerId: null,
      directReports: [{ id: "emp_employee_1" }],
    });
    return;
  }

  if (role === UserRole.SUPER_ADMIN) {
    db.employee.findFirst.mockResolvedValue({
      id: "emp_super_admin_1",
      managerId: null,
      directReports: [],
    });
    return;
  }

  if (role === UserRole.HR_ADMIN) {
    db.employee.findFirst.mockResolvedValue({
      id: "emp_hr_admin_1",
      managerId: "emp_super_admin_1",
      directReports: [],
    });
    return;
  }

  db.employee.findFirst.mockResolvedValue({
    id: "emp_employee_1",
    managerId: "emp_manager_1",
    directReports: [],
  });
}

function buildCycle(status: GoalCycleStatus = GoalCycleStatus.ACTIVE) {
  return {
    id: "goal_cycle_1",
    name: "FY26 Goals",
    status,
    cadence: GoalCycleCadence.ANNUAL,
    startDate: new Date("2026-01-01T00:00:00.000Z"),
    endDate: new Date("2026-12-31T00:00:00.000Z"),
  };
}

function buildGoalAccessRecord(overrides?: Partial<Record<string, unknown>>) {
  return {
    id: "goal_1",
    orgId: "org_demo_1",
    cycleId: "goal_cycle_1",
    goalType: GoalType.PERFORMANCE,
    ownerEmployeeId: "emp_employee_1",
    title: "Improve delivery reliability",
    description: null,
    status: GoalStatus.NOT_STARTED,
    progressPercent: 25,
    workflowStatus: GoalWorkflowStatus.DRAFT,
    workflowNote: null,
    submittedAt: null,
    approvedAt: null,
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
    _count: {
      updates: 0,
    },
    ...overrides,
  };
}

function buildGoalDetailRecord(overrides?: Partial<Record<string, unknown>>) {
  const base = buildGoalAccessRecord(overrides);

  return {
    ...base,
    cycle: buildCycle(),
    parentGoal: null,
    childGoals: [],
    keyResults: [
      {
        id: "kr_1",
        title: "Reduce defects",
        type: KeyResultType.NUMBER,
        startValue: 0,
        targetValue: 10,
        currentValue: 2,
        weight: null,
        sortOrder: 0,
      },
    ],
    competencyLinks: [],
    watchers: [],
    ...overrides,
  };
}

describe("createGoal", () => {
  it("allows employees to create performance or development goals for themselves", async () => {
    const db = buildGoalDbMock();
    mockViewer(db, UserRole.EMPLOYEE);
    db.goalCycle.findFirst.mockResolvedValue(buildCycle(GoalCycleStatus.ACTIVE));
    db.goal.findMany.mockResolvedValue([{ id: "goal_a" }, { id: "goal_b" }]);
    db.goal.create.mockResolvedValue(
      buildGoalDetailRecord({
        id: "goal_new",
        goalType: GoalType.DEVELOPMENT,
      }),
    );
    db.auditEvent.create.mockResolvedValue({ id: "audit_1" });

    const result = await createGoal(
      {
        cycleId: "goal_cycle_1",
        goalType: GoalType.DEVELOPMENT,
        title: "Build leadership habits",
      },
      employeeContext,
      db as never,
    );

    expect(result.goalType).toBe(GoalType.DEVELOPMENT);
    expect(result.workflowStatus).toBe(GoalWorkflowStatus.DRAFT);
    expect(db.goal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ownerEmployeeId: "emp_employee_1",
          goalType: GoalType.DEVELOPMENT,
          workflowStatus: GoalWorkflowStatus.DRAFT,
        }),
      }),
    );
  });

  it.each([
    {
      label: "manager",
      role: UserRole.MANAGER,
      context: managerContext,
      ownerEmployeeId: "emp_manager_1",
    },
    {
      label: "HR admin",
      role: UserRole.HR_ADMIN,
      context: hrAdminContext,
      ownerEmployeeId: "emp_hr_admin_1",
    },
    {
      label: "super admin",
      role: UserRole.SUPER_ADMIN,
      context: superAdminContext,
      ownerEmployeeId: "emp_super_admin_1",
    },
  ])("allows $label users to create goals for themselves", async ({ role, context, ownerEmployeeId }) => {
    const db = buildGoalDbMock();
    mockViewer(db, role);
    db.goalCycle.findFirst.mockResolvedValue(buildCycle(GoalCycleStatus.ACTIVE));
    db.goal.findMany.mockResolvedValue([]);
    db.goal.create.mockResolvedValue(
      buildGoalDetailRecord({
        id: "goal_new",
        ownerEmployeeId,
        ownerEmployee: {
          id: ownerEmployeeId,
          userId: context.userId,
          managerId: null,
          firstName: "Role",
          lastName: "Owner",
        },
      }),
    );
    db.auditEvent.create.mockResolvedValue({ id: "audit_role_owner" });

    await createGoal(
      {
        cycleId: "goal_cycle_1",
        goalType: GoalType.PERFORMANCE,
        title: "Own the annual operating priorities",
      },
      context,
      db as never,
    );

    expect(db.goal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ownerEmployeeId,
        }),
      }),
    );
  });

  it("rejects create when the employee already has 5 goals in the cycle", async () => {
    const db = buildGoalDbMock();
    mockViewer(db, UserRole.EMPLOYEE);
    db.goalCycle.findFirst.mockResolvedValue(buildCycle(GoalCycleStatus.ACTIVE));
    db.goal.findMany.mockResolvedValue([{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }, { id: "5" }]);

    await expect(
      createGoal(
        {
          cycleId: "goal_cycle_1",
          goalType: GoalType.PERFORMANCE,
          title: "Improve delivery reliability",
        },
        employeeContext,
        db as never,
      ),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      status: 400,
    });

    expect(db.goal.create).not.toHaveBeenCalled();
  });

  it("still blocks create when the viewer is not linked to an employee record", async () => {
    const db = buildGoalDbMock();
    db.employee.findFirst.mockResolvedValue(null);

    await expect(
      createGoal(
        {
          cycleId: "goal_cycle_1",
          goalType: GoalType.PERFORMANCE,
          title: "Improve delivery reliability",
        },
        managerContext,
        db as never,
      ),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      status: 401,
    });
  });
});

describe("goal workflow transitions", () => {
  it("allows the goal owner to submit a draft goal", async () => {
    const db = buildGoalDbMock();
    mockViewer(db, UserRole.EMPLOYEE);
    db.goal.findFirst
      .mockResolvedValueOnce(buildGoalDetailRecord())
      .mockResolvedValueOnce(
        buildGoalDetailRecord({
          workflowStatus: GoalWorkflowStatus.SUBMITTED,
          submittedAt: new Date("2026-03-10T00:00:00.000Z"),
        }),
      );
    db.goal.update.mockResolvedValue({ id: "goal_1" });
    db.auditEvent.create.mockResolvedValue({ id: "audit_1" });

    const result = await transitionGoalWorkflow(
      "goal_1",
      { action: "submit" },
      employeeContext,
      db as never,
    );

    expect(db.goal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          workflowStatus: GoalWorkflowStatus.SUBMITTED,
        }),
      }),
    );
    expect(result.workflowStatus).toBe(GoalWorkflowStatus.SUBMITTED);
  });

  it("treats elevated roles as goal owners for self-submission", async () => {
    const db = buildGoalDbMock();
    mockViewer(db, UserRole.SUPER_ADMIN);
    db.goal.findFirst
      .mockResolvedValueOnce(
        buildGoalDetailRecord({
          ownerEmployeeId: "emp_super_admin_1",
          ownerEmployee: {
            id: "emp_super_admin_1",
            userId: "user_super_admin_1",
            managerId: null,
            firstName: "Freddie",
            lastName: "Martinez",
          },
        }),
      )
      .mockResolvedValueOnce(
        buildGoalDetailRecord({
          ownerEmployeeId: "emp_super_admin_1",
          ownerEmployee: {
            id: "emp_super_admin_1",
            userId: "user_super_admin_1",
            managerId: null,
            firstName: "Freddie",
            lastName: "Martinez",
          },
          workflowStatus: GoalWorkflowStatus.SUBMITTED,
          submittedAt: new Date("2026-03-10T00:00:00.000Z"),
        }),
      );
    db.goal.update.mockResolvedValue({ id: "goal_1" });
    db.auditEvent.create.mockResolvedValue({ id: "audit_super_submit" });

    const result = await transitionGoalWorkflow(
      "goal_1",
      { action: "submit" },
      superAdminContext,
      db as never,
    );

    expect(result.workflowStatus).toBe(GoalWorkflowStatus.SUBMITTED);
  });

  it("allows the direct manager to approve a submitted goal", async () => {
    const db = buildGoalDbMock();
    mockViewer(db, UserRole.MANAGER);
    db.goal.findFirst
      .mockResolvedValueOnce(
        buildGoalDetailRecord({
          workflowStatus: GoalWorkflowStatus.SUBMITTED,
        }),
      )
      .mockResolvedValueOnce(
        buildGoalDetailRecord({
          workflowStatus: GoalWorkflowStatus.APPROVED,
          approvedAt: new Date("2026-03-12T00:00:00.000Z"),
        }),
      );
    db.goal.update.mockResolvedValue({ id: "goal_1" });
    db.auditEvent.create.mockResolvedValue({ id: "audit_2" });

    const result = await transitionGoalWorkflow(
      "goal_1",
      { action: "approve", note: "Looks good." },
      managerContext,
      db as never,
    );

    expect(result.workflowStatus).toBe(GoalWorkflowStatus.APPROVED);
  });

  it("requires a note when the manager requests changes", async () => {
    const db = buildGoalDbMock();
    mockViewer(db, UserRole.MANAGER);
    db.goal.findFirst.mockResolvedValue(
      buildGoalDetailRecord({
        workflowStatus: GoalWorkflowStatus.SUBMITTED,
      }),
    );

    await expect(
      transitionGoalWorkflow(
        "goal_1",
        { action: "request_changes" },
        managerContext,
        db as never,
      ),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      status: 400,
    });
  });

  it("reserves approved-goal overrides to Super Admin", async () => {
    const db = buildGoalDbMock();
    mockViewer(db, UserRole.SUPER_ADMIN);
    db.goal.findFirst
      .mockResolvedValueOnce(
        buildGoalDetailRecord({
          workflowStatus: GoalWorkflowStatus.APPROVED,
        }),
      )
      .mockResolvedValueOnce(
        buildGoalDetailRecord({
          workflowStatus: GoalWorkflowStatus.OVERRIDDEN,
          workflowNote: "Scope changed after approval.",
        }),
      );
    db.goal.update.mockResolvedValue({ id: "goal_1" });
    db.auditEvent.create.mockResolvedValue({ id: "audit_3" });

    const result = await transitionGoalWorkflow(
      "goal_1",
      { action: "override", note: "Scope changed after approval." },
      superAdminContext,
      db as never,
    );

    expect(result.workflowStatus).toBe(GoalWorkflowStatus.OVERRIDDEN);
  });
});

describe("goal definition locks", () => {
  it("blocks normal edits once a goal is approved", async () => {
    const db = buildGoalDbMock();
    mockViewer(db, UserRole.EMPLOYEE);
    db.goal.findFirst.mockResolvedValue(
      buildGoalDetailRecord({
        workflowStatus: GoalWorkflowStatus.APPROVED,
      }),
    );

    await expect(
      updateGoal(
        "goal_1",
        { title: "Updated title" },
        employeeContext,
        db as never,
      ),
    ).rejects.toMatchObject({
      code: "READ_ONLY",
      status: 409,
    });
  });

  it("blocks managers from aligning a direct-report goal during the vanilla review flow", async () => {
    const db = buildGoalDbMock();
    mockViewer(db, UserRole.MANAGER);
    db.goal.findFirst.mockResolvedValue(buildGoalDetailRecord());

    await expect(
      alignGoal("goal_1", { parentGoalId: "goal_2" }, managerContext, db as never),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
  });
});

describe("createGoalUpdate", () => {
  it("allows the owner to post progress updates only during the active cycle window", async () => {
    const db = buildGoalDbMock();
    mockViewer(db, UserRole.EMPLOYEE);
    db.goal.findFirst.mockResolvedValue(
      buildGoalDetailRecord({
        workflowStatus: GoalWorkflowStatus.APPROVED,
        cycle: buildCycle(GoalCycleStatus.ACTIVE),
      }),
    );
    db.keyResult.update.mockResolvedValue({ id: "kr_1" });
    db.keyResult.findMany.mockResolvedValue([
      {
        type: KeyResultType.NUMBER,
        startValue: 0,
        targetValue: 10,
        currentValue: 6,
        weight: null,
      },
    ]);
    db.goal.update.mockResolvedValue({ id: "goal_1" });
    db.goalUpdate.create.mockResolvedValue({
      id: "update_1",
      note: "Shipped this milestone.",
      progressDelta: 35,
      snapshotProgressPercent: 60,
      snapshotCurrentValues: [],
      createdAt: new Date("2026-03-05T00:00:00.000Z"),
      authorEmployee: {
        id: "emp_employee_1",
        firstName: "Elliot",
        lastName: "Barnes",
      },
    });
    db.evidenceItem.create.mockResolvedValue({ id: "evidence_goal_update_1" });
    db.auditEvent.create.mockResolvedValue({ id: "audit_4" });

    const result = await createGoalUpdate(
      "goal_1",
      {
        note: "Shipped this milestone.",
        keyResults: [{ keyResultId: "kr_1", currentValue: 6 }],
      },
      employeeContext,
      db as never,
    );

    expect(result.snapshotProgressPercent).toBe(60);
    expect(db.evidenceItem.create).toHaveBeenCalledTimes(1);
  });

  it("allows managers to post progress updates on their own approved goals", async () => {
    const db = buildGoalDbMock();
    mockViewer(db, UserRole.MANAGER);
    db.goal.findFirst.mockResolvedValue(
      buildGoalDetailRecord({
        ownerEmployeeId: "emp_manager_1",
        ownerEmployee: {
          id: "emp_manager_1",
          userId: "user_manager_1",
          managerId: null,
          firstName: "Elliot",
          lastName: "Mah",
        },
        workflowStatus: GoalWorkflowStatus.APPROVED,
        cycle: buildCycle(GoalCycleStatus.ACTIVE),
      }),
    );
    db.keyResult.update.mockResolvedValue({ id: "kr_1" });
    db.keyResult.findMany.mockResolvedValue([
      {
        type: KeyResultType.NUMBER,
        startValue: 0,
        targetValue: 10,
        currentValue: 5,
        weight: null,
      },
    ]);
    db.goal.update.mockResolvedValue({ id: "goal_1" });
    db.goalUpdate.create.mockResolvedValue({
      id: "update_manager_1",
      note: "Manager closed the milestone.",
      progressDelta: 25,
      snapshotProgressPercent: 50,
      snapshotCurrentValues: [],
      createdAt: new Date("2026-03-05T00:00:00.000Z"),
      authorEmployee: {
        id: "emp_manager_1",
        firstName: "Elliot",
        lastName: "Mah",
      },
    });
    db.evidenceItem.create.mockResolvedValue({ id: "evidence_goal_update_manager_1" });
    db.auditEvent.create.mockResolvedValue({ id: "audit_manager_update" });

    const result = await createGoalUpdate(
      "goal_1",
      {
        note: "Manager closed the milestone.",
        keyResults: [{ keyResultId: "kr_1", currentValue: 5 }],
      },
      managerContext,
      db as never,
    );

    expect(result.author).toBe("Elliot Mah");
    expect(result.snapshotProgressPercent).toBe(50);
  });

  it("blocks manager progress updates on direct-report goals", async () => {
    const db = buildGoalDbMock();
    mockViewer(db, UserRole.MANAGER);
    db.goal.findFirst.mockResolvedValue(
      buildGoalDetailRecord({
        workflowStatus: GoalWorkflowStatus.APPROVED,
        cycle: buildCycle(GoalCycleStatus.ACTIVE),
      }),
    );

    await expect(
      createGoalUpdate(
        "goal_1",
        {
          note: "Manager note",
          keyResults: [],
        },
        managerContext,
        db as never,
      ),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
  });

  it("blocks progress updates when the cycle is not active", async () => {
    const db = buildGoalDbMock();
    mockViewer(db, UserRole.EMPLOYEE);
    db.goal.findFirst.mockResolvedValue(
      buildGoalDetailRecord({
        workflowStatus: GoalWorkflowStatus.APPROVED,
        cycle: buildCycle(GoalCycleStatus.CLOSED),
      }),
    );

    await expect(
      createGoalUpdate(
        "goal_1",
        {
          note: "Late update",
          keyResults: [],
        },
        employeeContext,
        db as never,
      ),
    ).rejects.toMatchObject({
      code: "READ_ONLY",
      status: 409,
    });
  });
});

describe("getGoal", () => {
  it("exposes owner actions for managers on their own goals", async () => {
    const db = buildGoalDbMock();
    mockViewer(db, UserRole.MANAGER);
    db.goal.findFirst.mockResolvedValue(
      buildGoalDetailRecord({
        ownerEmployeeId: "emp_manager_1",
        ownerEmployee: {
          id: "emp_manager_1",
          userId: "user_manager_1",
          managerId: null,
          firstName: "Elliot",
          lastName: "Mah",
        },
      }),
    );

    const result = await getGoal("goal_1", managerContext, db as never);

    expect(result.viewer.canEditDefinition).toBe(true);
    expect(result.viewer.canSubmit).toBe(true);
  });
});

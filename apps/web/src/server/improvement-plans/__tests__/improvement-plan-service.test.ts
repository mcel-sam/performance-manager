import {
  ImprovementPlanCheckInType,
  ImprovementPlanOutcome,
  ImprovementPlanStatus,
  ImprovementPlanTrigger,
  CycleStatus,
  UserRole,
} from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import {
  createImprovementPlan,
  createImprovementPlanCheckIn,
  getImprovementPlanDetail,
  listImprovementPlans,
  listImprovementPlanAuditEvents,
  requestImprovementPlanExport,
  transitionImprovementPlanStatus,
  updateImprovementPlanGoalsAndDates,
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
      update: vi.fn(),
    },
    improvementPlanCheckIn: {
      create: vi.fn(),
    },
    reviewCycle: {
      findFirst: vi.fn(),
    },
    calibrationSession: {
      findFirst: vi.fn(),
    },
    auditEvent: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  };
}

function buildTimelineRecord(overrides?: {
  id?: string;
  content?: string;
  checkInType?: ImprovementPlanCheckInType;
  status?: ImprovementPlanStatus | null;
  outcome?: ImprovementPlanOutcome | null;
}) {
  return {
    id: overrides?.id ?? "checkin_1",
    content: overrides?.content ?? "Weekly check-in update.",
    checkInType: overrides?.checkInType ?? ImprovementPlanCheckInType.NOTE,
    status: overrides?.status ?? ImprovementPlanStatus.ACTIVE,
    outcome: overrides?.outcome ?? null,
    checkInAt: new Date("2026-04-08T16:00:00.000Z"),
    createdAt: new Date("2026-04-08T16:00:00.000Z"),
    authorUser: {
      id: "user_manager_1",
      email: "manager@example.com",
      employee: {
        firstName: "Morgan",
        lastName: "Manager",
      },
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

const peerContext = {
  userId: "user_peer_1",
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

    db.reviewCycle.findFirst.mockResolvedValue({
      id: "cycle_1",
      name: "FY26 Annual Review",
      status: CycleStatus.LOCKED,
    });

    db.improvementPlan.create.mockResolvedValue({
      id: "plan_1",
      title: "Q2 Support Plan",
      triggerSource: ImprovementPlanTrigger.REVIEW,
      reviewCycleId: "cycle_1",
      calibrationSessionId: null,
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
        reviewCycleId: "cycle_1",
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

    db.reviewCycle.findFirst.mockResolvedValue({
      id: "cycle_1",
      name: "FY26 Annual Review",
      status: CycleStatus.LOCKED,
    });

    await expect(
      createImprovementPlan(
        {
          subjectEmployeeId: "emp_peer_1",
          reviewCycleId: "cycle_1",
          hrOwnerEmployeeId: "emp_hr_admin_1",
          title: "Support Plan",
          expectations: "Improve communication.",
          startDate: "2026-04-01T00:00:00.000Z",
          endDate: "2026-06-30T00:00:00.000Z",
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
          reviewCycleId: "cycle_1",
          title: "Support Plan",
          expectations: "Improve communication.",
          startDate: "2026-04-01T00:00:00.000Z",
          endDate: "2026-06-30T00:00:00.000Z",
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

  it("requires review or calibration context when creating a plan", async () => {
    const db = buildDbMock();

    await expect(
      createImprovementPlan(
        {
          subjectEmployeeId: "emp_employee_1",
          hrOwnerEmployeeId: "emp_hr_admin_1",
          title: "Support Plan",
          expectations: "Improve communication.",
          startDate: "2026-04-01T00:00:00.000Z",
          endDate: "2026-06-30T00:00:00.000Z",
          goals: [{ title: "Goal 1" }],
        },
        hrAdminContext,
        db as never,
      ),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      status: 400,
    });
  });

  it("requires managers to assign an HR owner", async () => {
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
        id: "emp_manager_1",
        userId: "user_manager_1",
        managerId: "emp_hr_admin_1",
        firstName: "Morgan",
        lastName: "Manager",
      })
      .mockResolvedValueOnce({
        id: "emp_manager_1",
        userId: "user_manager_1",
        managerId: "emp_hr_admin_1",
        firstName: "Morgan",
        lastName: "Manager",
      });

    db.reviewCycle.findFirst.mockResolvedValue({
      id: "cycle_1",
      name: "FY26 Annual Review",
      status: CycleStatus.LOCKED,
    });

    await expect(
      createImprovementPlan(
        {
          subjectEmployeeId: "emp_employee_1",
          reviewCycleId: "cycle_1",
          title: "Support Plan",
          expectations: "Improve communication.",
          startDate: "2026-04-01T00:00:00.000Z",
          endDate: "2026-06-30T00:00:00.000Z",
          goals: [{ title: "Goal 1" }],
        },
        managerContext,
        db as never,
      ),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      status: 400,
    });
  });

  it("requires finalized calibration sessions when calibration is the trigger", async () => {
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

    db.calibrationSession.findFirst.mockResolvedValue({
      id: "calibration_1",
      name: "Leadership Calibration",
      cycleId: "cycle_1",
      isFinalized: false,
    });

    await expect(
      createImprovementPlan(
        {
          subjectEmployeeId: "emp_employee_1",
          calibrationSessionId: "calibration_1",
          title: "Support Plan",
          expectations: "Improve communication.",
          startDate: "2026-04-01T00:00:00.000Z",
          endDate: "2026-06-30T00:00:00.000Z",
          goals: [{ title: "Goal 1" }],
        },
        hrAdminContext,
        db as never,
      ),
    ).rejects.toMatchObject({
      code: "INVALID_WORKFLOW_STATE",
      status: 409,
    });
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
      checkIns: [buildTimelineRecord()],
    });

    const result = await getImprovementPlanDetail("plan_1", hrAdminContext, db as never);

    expect(result.id).toBe("plan_1");
    expect(result.checkInCount).toBe(1);
    expect(result.timeline[0]?.authorName).toBe("Morgan Manager");
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
      id: "emp_peer_1",
      userId: "user_peer_1",
      managerId: "emp_manager_1",
      firstName: "Parker",
      lastName: "Peer",
    });

    await expect(
      getImprovementPlanDetail("plan_1", peerContext, db as never),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
  });
});

describe("createImprovementPlanCheckIn", () => {
  it("allows authorized users to create check-ins and writes an audit event", async () => {
    const db = buildDbMock();

    db.improvementPlan.findFirst.mockResolvedValue({
      id: "plan_1",
      orgId: "org_demo_1",
      subjectEmployeeId: "emp_employee_1",
      managerEmployeeId: "emp_manager_1",
      hrOwnerEmployeeId: "emp_hr_admin_1",
      status: ImprovementPlanStatus.ACTIVE,
      outcome: null,
    });

    db.employee.findFirst.mockResolvedValue({
      id: "emp_manager_1",
      userId: "user_manager_1",
      managerId: "emp_hr_admin_1",
      firstName: "Morgan",
      lastName: "Manager",
    });

    db.improvementPlanCheckIn.create.mockResolvedValue(
      buildTimelineRecord({
        id: "checkin_42",
        content: "Weekly goals are on track.",
        status: ImprovementPlanStatus.ACTIVE,
        outcome: null,
      }),
    );

    db.auditEvent.create.mockResolvedValue({ id: "audit_checkin_1" });

    const result = await createImprovementPlanCheckIn(
      "plan_1",
      {
        note: "Weekly goals are on track.",
      },
      managerContext,
      db as never,
    );

    expect(result.id).toBe("checkin_42");
    expect(db.improvementPlanCheckIn.create).toHaveBeenCalledTimes(1);
    expect(db.auditEvent.create).toHaveBeenCalledTimes(1);
  });

  it("lets managers record the 30-day checkpoint for active plans", async () => {
    const db = buildDbMock();

    db.improvementPlan.findFirst.mockResolvedValue({
      id: "plan_1",
      orgId: "org_demo_1",
      subjectEmployeeId: "emp_employee_1",
      managerEmployeeId: "emp_manager_1",
      hrOwnerEmployeeId: "emp_hr_admin_1",
      triggerSource: ImprovementPlanTrigger.REVIEW,
      reviewCycleId: "cycle_1",
      calibrationSessionId: null,
      status: ImprovementPlanStatus.ACTIVE,
      outcome: null,
      startDate: new Date("2026-04-01T00:00:00.000Z"),
      endDate: new Date("2026-06-30T00:00:00.000Z"),
      checkIns: [],
    });

    db.employee.findFirst.mockResolvedValue({
      id: "emp_manager_1",
      userId: "user_manager_1",
      managerId: "emp_hr_admin_1",
      firstName: "Morgan",
      lastName: "Manager",
    });

    db.improvementPlanCheckIn.create.mockResolvedValue(
      buildTimelineRecord({
        id: "checkpoint_30_1",
        content: "30-day checkpoint completed.",
        checkInType: ImprovementPlanCheckInType.CHECKPOINT_30,
        status: ImprovementPlanStatus.ACTIVE,
        outcome: null,
      }),
    );

    db.auditEvent.create.mockResolvedValue({ id: "audit_checkpoint_1" });

    const result = await createImprovementPlanCheckIn(
      "plan_1",
      {
        note: "30-day checkpoint completed.",
        checkInType: ImprovementPlanCheckInType.CHECKPOINT_30,
      },
      managerContext,
      db as never,
    );

    expect(result.id).toBe("checkpoint_30_1");
    expect(db.improvementPlanCheckIn.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          checkInType: ImprovementPlanCheckInType.CHECKPOINT_30,
        }),
      }),
    );
  });

  it("denies check-in creation for users outside plan participants", async () => {
    const db = buildDbMock();

    db.improvementPlan.findFirst.mockResolvedValue({
      id: "plan_1",
      orgId: "org_demo_1",
      subjectEmployeeId: "emp_employee_1",
      managerEmployeeId: "emp_manager_1",
      hrOwnerEmployeeId: "emp_hr_admin_1",
      status: ImprovementPlanStatus.ACTIVE,
      outcome: null,
    });

    db.employee.findFirst.mockResolvedValue({
      id: "emp_peer_1",
      userId: "user_peer_1",
      managerId: "emp_manager_1",
      firstName: "Parker",
      lastName: "Peer",
    });

    await expect(
      createImprovementPlanCheckIn(
        "plan_1",
        { note: "I should not be able to post this." },
        peerContext,
        db as never,
      ),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });

    expect(db.improvementPlanCheckIn.create).not.toHaveBeenCalled();
    expect(db.auditEvent.create).not.toHaveBeenCalled();
  });

  it("requires the 30-day checkpoint before the 60-day checkpoint", async () => {
    const db = buildDbMock();

    db.improvementPlan.findFirst.mockResolvedValue({
      id: "plan_1",
      orgId: "org_demo_1",
      subjectEmployeeId: "emp_employee_1",
      managerEmployeeId: "emp_manager_1",
      hrOwnerEmployeeId: "emp_hr_admin_1",
      triggerSource: ImprovementPlanTrigger.REVIEW,
      reviewCycleId: "cycle_1",
      calibrationSessionId: null,
      status: ImprovementPlanStatus.ACTIVE,
      outcome: null,
      startDate: new Date("2026-04-01T00:00:00.000Z"),
      endDate: new Date("2026-06-30T00:00:00.000Z"),
      checkIns: [],
    });

    db.employee.findFirst.mockResolvedValue({
      id: "emp_manager_1",
      userId: "user_manager_1",
      managerId: "emp_hr_admin_1",
      firstName: "Morgan",
      lastName: "Manager",
    });

    await expect(
      createImprovementPlanCheckIn(
        "plan_1",
        {
          note: "Jumping ahead to the 60-day checkpoint.",
          checkInType: ImprovementPlanCheckInType.CHECKPOINT_60,
        },
        managerContext,
        db as never,
      ),
    ).rejects.toMatchObject({
      code: "INVALID_WORKFLOW_STATE",
      status: 409,
    });

    expect(db.improvementPlanCheckIn.create).not.toHaveBeenCalled();
  });
});

describe("transitionImprovementPlanStatus", () => {
  it("applies valid transitions and writes an audit event", async () => {
    const db = buildDbMock();

    db.improvementPlan.findFirst.mockResolvedValue({
      id: "plan_1",
      orgId: "org_demo_1",
      subjectEmployeeId: "emp_employee_1",
      managerEmployeeId: "emp_manager_1",
      hrOwnerEmployeeId: "emp_hr_admin_1",
      status: ImprovementPlanStatus.ACTIVE,
      outcome: null,
    });

    db.employee.findFirst.mockResolvedValue({
      id: "emp_manager_1",
      userId: "user_manager_1",
      managerId: "emp_hr_admin_1",
      firstName: "Morgan",
      lastName: "Manager",
    });

    db.improvementPlan.update.mockResolvedValue({
      id: "plan_1",
      status: ImprovementPlanStatus.COMPLETED,
      outcome: ImprovementPlanOutcome.SUCCESSFUL,
      updatedAt: new Date("2026-06-30T12:00:00.000Z"),
    });

    db.improvementPlanCheckIn.create.mockResolvedValue(
      buildTimelineRecord({
        id: "checkin_status_1",
        content: "Plan completed successfully after consistent progress.",
        status: ImprovementPlanStatus.COMPLETED,
        outcome: ImprovementPlanOutcome.SUCCESSFUL,
      }),
    );

    db.auditEvent.create.mockResolvedValue({ id: "audit_status_1" });

    const result = await transitionImprovementPlanStatus(
      "plan_1",
      {
        targetStatus: ImprovementPlanStatus.COMPLETED,
        outcome: ImprovementPlanOutcome.SUCCESSFUL,
        note: "Plan completed successfully after consistent progress.",
      },
      managerContext,
      db as never,
    );

    expect(result.status).toBe(ImprovementPlanStatus.COMPLETED);
    expect(result.outcome).toBe(ImprovementPlanOutcome.SUCCESSFUL);
    expect(result.timelineEntry.id).toBe("checkin_status_1");
    expect(db.improvementPlan.update).toHaveBeenCalledTimes(1);
    expect(db.auditEvent.create).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid transitions", async () => {
    const db = buildDbMock();

    db.improvementPlan.findFirst.mockResolvedValue({
      id: "plan_1",
      orgId: "org_demo_1",
      subjectEmployeeId: "emp_employee_1",
      managerEmployeeId: "emp_manager_1",
      hrOwnerEmployeeId: "emp_hr_admin_1",
      status: ImprovementPlanStatus.DRAFT,
      outcome: null,
    });

    db.employee.findFirst.mockResolvedValue({
      id: "emp_manager_1",
      userId: "user_manager_1",
      managerId: "emp_hr_admin_1",
      firstName: "Morgan",
      lastName: "Manager",
    });

    await expect(
      transitionImprovementPlanStatus(
        "plan_1",
        {
          targetStatus: ImprovementPlanStatus.COMPLETED,
          outcome: ImprovementPlanOutcome.SUCCESSFUL,
        },
        managerContext,
        db as never,
      ),
    ).rejects.toMatchObject({
      code: "INVALID_STATUS_TRANSITION",
      status: 400,
    });

    expect(db.improvementPlan.update).not.toHaveBeenCalled();
    expect(db.improvementPlanCheckIn.create).not.toHaveBeenCalled();
    expect(db.auditEvent.create).not.toHaveBeenCalled();
  });

  it("denies unauthorized users from changing status", async () => {
    const db = buildDbMock();

    db.improvementPlan.findFirst.mockResolvedValue({
      id: "plan_1",
      orgId: "org_demo_1",
      subjectEmployeeId: "emp_employee_1",
      managerEmployeeId: "emp_manager_1",
      hrOwnerEmployeeId: "emp_hr_admin_1",
      status: ImprovementPlanStatus.DRAFT,
      outcome: null,
    });

    db.employee.findFirst.mockResolvedValue({
      id: "emp_employee_1",
      userId: "user_employee_1",
      managerId: "emp_manager_1",
      firstName: "Elliot",
      lastName: "Employee",
    });

    await expect(
      transitionImprovementPlanStatus(
        "plan_1",
        {
          targetStatus: ImprovementPlanStatus.ACTIVE,
        },
        employeeContext,
        db as never,
      ),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });

    expect(db.improvementPlan.update).not.toHaveBeenCalled();
    expect(db.auditEvent.create).not.toHaveBeenCalled();
  });
});

describe("listImprovementPlanAuditEvents", () => {
  it("returns audit events for authorized users", async () => {
    const db = buildDbMock();

    db.improvementPlan.findFirst.mockResolvedValue({
      id: "plan_1",
      orgId: "org_demo_1",
      subjectEmployeeId: "emp_employee_1",
      managerEmployeeId: "emp_manager_1",
      hrOwnerEmployeeId: "emp_hr_admin_1",
      status: ImprovementPlanStatus.ACTIVE,
      outcome: null,
    });

    db.employee.findFirst.mockResolvedValue({
      id: "emp_manager_1",
      userId: "user_manager_1",
      managerId: "emp_hr_admin_1",
      firstName: "Morgan",
      lastName: "Manager",
    });

    db.auditEvent.findMany.mockResolvedValue([
      {
        id: "audit_1",
        action: "IMPROVEMENT_PLAN_STATUS_CHANGED",
        entityType: "ImprovementPlan",
        entityId: "plan_1",
        metadata: {
          nextStatus: "ACTIVE",
        },
        createdAt: new Date("2026-04-08T16:00:00.000Z"),
        actorUser: {
          id: "user_manager_1",
          email: "manager@example.com",
          employee: {
            firstName: "Morgan",
            lastName: "Manager",
          },
        },
      },
    ]);

    const result = await listImprovementPlanAuditEvents("plan_1", managerContext, db as never);

    expect(result).toHaveLength(1);
    expect(result[0]?.actorName).toBe("Morgan Manager");
    expect(result[0]?.action).toBe("IMPROVEMENT_PLAN_STATUS_CHANGED");
    expect(db.auditEvent.findMany).toHaveBeenCalledTimes(1);
  });

  it("denies audit access for users outside plan participants", async () => {
    const db = buildDbMock();

    db.improvementPlan.findFirst.mockResolvedValue({
      id: "plan_1",
      orgId: "org_demo_1",
      subjectEmployeeId: "emp_employee_1",
      managerEmployeeId: "emp_manager_1",
      hrOwnerEmployeeId: "emp_hr_admin_1",
      status: ImprovementPlanStatus.ACTIVE,
      outcome: null,
    });

    db.employee.findFirst.mockResolvedValue({
      id: "emp_peer_1",
      userId: "user_peer_1",
      managerId: "emp_manager_1",
      firstName: "Parker",
      lastName: "Peer",
    });

    await expect(
      listImprovementPlanAuditEvents("plan_1", peerContext, db as never),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });

    expect(db.auditEvent.findMany).not.toHaveBeenCalled();
  });
});

describe("requestImprovementPlanExport", () => {
  it("returns placeholder response and writes audit event for authorized users", async () => {
    const db = buildDbMock();

    db.improvementPlan.findFirst.mockResolvedValue({
      id: "plan_1",
      orgId: "org_demo_1",
      subjectEmployeeId: "emp_employee_1",
      managerEmployeeId: "emp_manager_1",
      hrOwnerEmployeeId: "emp_hr_admin_1",
      status: ImprovementPlanStatus.ACTIVE,
      outcome: null,
    });

    db.employee.findFirst.mockResolvedValue({
      id: "emp_manager_1",
      userId: "user_manager_1",
      managerId: "emp_hr_admin_1",
      firstName: "Morgan",
      lastName: "Manager",
    });

    db.auditEvent.create.mockResolvedValue({ id: "audit_export_1" });

    const result = await requestImprovementPlanExport("plan_1", managerContext, db as never);

    expect(result.planId).toBe("plan_1");
    expect(result.message).toContain("not available yet");
    expect(db.auditEvent.create).toHaveBeenCalledTimes(1);
  });

  it("denies export requests for unauthorized users", async () => {
    const db = buildDbMock();

    db.improvementPlan.findFirst.mockResolvedValue({
      id: "plan_1",
      orgId: "org_demo_1",
      subjectEmployeeId: "emp_employee_1",
      managerEmployeeId: "emp_manager_1",
      hrOwnerEmployeeId: "emp_hr_admin_1",
      status: ImprovementPlanStatus.ACTIVE,
      outcome: null,
    });

    db.employee.findFirst.mockResolvedValue({
      id: "emp_peer_1",
      userId: "user_peer_1",
      managerId: "emp_manager_1",
      firstName: "Parker",
      lastName: "Peer",
    });

    await expect(
      requestImprovementPlanExport("plan_1", peerContext, db as never),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });

    expect(db.auditEvent.create).not.toHaveBeenCalled();
  });
});

describe("updateImprovementPlanGoalsAndDates", () => {
  it("updates goals and dates for an authorized manager and writes audit events", async () => {
    const db = buildDbMock();

    db.improvementPlan.findFirst.mockResolvedValue({
      id: "plan_1",
      orgId: "org_demo_1",
      subjectEmployeeId: "emp_employee_1",
      managerEmployeeId: "emp_manager_1",
      hrOwnerEmployeeId: "emp_hr_admin_1",
      status: ImprovementPlanStatus.ACTIVE,
      outcome: null,
      startDate: new Date("2026-04-01T00:00:00.000Z"),
      endDate: new Date("2026-06-30T00:00:00.000Z"),
      goals: [
        {
          id: "goal_old_1",
          sortOrder: 1,
        },
      ],
    });

    db.employee.findFirst.mockResolvedValue({
      id: "emp_manager_1",
      userId: "user_manager_1",
      managerId: "emp_hr_admin_1",
      firstName: "Morgan",
      lastName: "Manager",
    });

    db.improvementPlan.update.mockResolvedValue({
      id: "plan_1",
      startDate: new Date("2026-04-05T00:00:00.000Z"),
      endDate: new Date("2026-07-05T00:00:00.000Z"),
      updatedAt: new Date("2026-04-05T10:00:00.000Z"),
      goals: [
        {
          id: "goal_new_1",
          title: "Increase delivery predictability",
          description: "Track weekly commitments and outcomes.",
          sortOrder: 1,
        },
        {
          id: "goal_new_2",
          title: "Improve communication quality",
          description: null,
          sortOrder: 2,
        },
      ],
    });

    db.auditEvent.create.mockResolvedValue({ id: "audit_update_1" });

    const result = await updateImprovementPlanGoalsAndDates(
      "plan_1",
      {
        startDate: "2026-04-05T00:00:00.000Z",
        endDate: "2026-07-05T00:00:00.000Z",
        goals: [
          {
            title: "Increase delivery predictability",
            description: "Track weekly commitments and outcomes.",
          },
          {
            title: "Improve communication quality",
          },
        ],
      },
      managerContext,
      db as never,
    );

    expect(result.id).toBe("plan_1");
    expect(result.goals).toHaveLength(2);
    expect(db.improvementPlan.update).toHaveBeenCalledTimes(1);
    expect(db.auditEvent.create).toHaveBeenCalledTimes(2);
    expect(db.auditEvent.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          action: "IMPROVEMENT_PLAN_DATES_UPDATED",
        }),
      }),
    );
    expect(db.auditEvent.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          action: "IMPROVEMENT_PLAN_GOALS_UPDATED",
        }),
      }),
    );
  });

  it("denies updates for non-manager non-hr participants", async () => {
    const db = buildDbMock();

    db.improvementPlan.findFirst.mockResolvedValue({
      id: "plan_1",
      orgId: "org_demo_1",
      subjectEmployeeId: "emp_employee_1",
      managerEmployeeId: "emp_manager_1",
      hrOwnerEmployeeId: "emp_hr_admin_1",
      status: ImprovementPlanStatus.ACTIVE,
      outcome: null,
      startDate: new Date("2026-04-01T00:00:00.000Z"),
      endDate: new Date("2026-06-30T00:00:00.000Z"),
      goals: [
        {
          id: "goal_old_1",
          sortOrder: 1,
        },
      ],
    });

    db.employee.findFirst.mockResolvedValue({
      id: "emp_employee_1",
      userId: "user_employee_1",
      managerId: "emp_manager_1",
      firstName: "Elliot",
      lastName: "Employee",
    });

    await expect(
      updateImprovementPlanGoalsAndDates(
        "plan_1",
        {
          endDate: "2026-07-10T00:00:00.000Z",
        },
        employeeContext,
        db as never,
      ),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });

    expect(db.improvementPlan.update).not.toHaveBeenCalled();
    expect(db.auditEvent.create).not.toHaveBeenCalled();
  });
});

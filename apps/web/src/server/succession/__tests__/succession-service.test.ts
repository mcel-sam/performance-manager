import {
  PositionStatus,
  SuccessionAssessmentLevel,
  SuccessionNoteVisibility,
  SuccessionReadiness,
  SuccessionVisibilityScope,
  UserRole,
} from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import {
  createSuccessionCandidate,
  createSuccessionPosition,
  getSuccessionPositionDetail,
  listSuccessionOverview,
  parseSuccessionFilters,
  updateSuccessionCandidate,
} from "@/server/succession/succession-service";

function buildDbMock() {
  return {
    employee: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    position: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    successionCandidate: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    successionNote: {
      create: vi.fn(),
    },
    successionCandidateSnapshot: {
      upsert: vi.fn(),
      create: vi.fn(),
    },
    reviewPacket: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    calibrationPlacement: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    auditEvent: {
      create: vi.fn(),
    },
  };
}

const hrContext = {
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

describe("listSuccessionOverview", () => {
  it("rejects employees from succession access", async () => {
    const db = buildDbMock();

    await expect(
      listSuccessionOverview(parseSuccessionFilters(new URLSearchParams()), employeeContext, db as never),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
  });
});

describe("createSuccessionPosition", () => {
  it("creates a position and writes an audit event for HR", async () => {
    const db = buildDbMock();

    db.employee.findFirst.mockResolvedValue({
      id: "emp_hr_admin_1",
      firstName: "Harper",
      lastName: "Quinn",
      department: "Admin/Finance",
      title: "Office Admin",
      directReports: [],
    });
    db.employee.findMany.mockResolvedValue([{ id: "emp_manager_1" }]);
    db.position.create.mockResolvedValue({
      id: "position_1",
      plan: { id: "plan_1" },
    });
    db.auditEvent.create.mockResolvedValue({ id: "audit_1" });

    const result = await createSuccessionPosition(
      {
        title: "Operations Superintendent",
        department: "Operations",
        ownerEmployeeId: "emp_manager_1",
        visibilityScope: SuccessionVisibilityScope.MANAGERS_IN_SCOPE,
      },
      hrContext,
      db as never,
    );

    expect(result.id).toBe("position_1");
    expect(db.position.create).toHaveBeenCalledTimes(1);
    expect(db.auditEvent.create).toHaveBeenCalledTimes(1);
  });
});

describe("getSuccessionPositionDetail", () => {
  it("hides sensitive fields and HR-only notes from managers", async () => {
    const db = buildDbMock();

    db.employee.findFirst.mockResolvedValue({
      id: "emp_manager_1",
      firstName: "Morgan",
      lastName: "Patel",
      department: "Operations",
      title: "Site Supervisor",
      directReports: [{ id: "emp_employee_1" }],
    });

    db.position.findFirst.mockResolvedValue({
      id: "position_1",
      title: "Operations Superintendent",
      department: "Operations",
      location: "Edmonton",
      isCritical: true,
      status: PositionStatus.ACTIVE,
      createdAt: new Date("2026-03-01T00:00:00.000Z"),
      updatedAt: new Date("2026-03-02T00:00:00.000Z"),
      incumbentEmployee: null,
      plan: {
        id: "plan_1",
        visibilityScope: SuccessionVisibilityScope.MANAGERS_IN_SCOPE,
        reviewCadence: "Quarterly",
        notes: "Keep two successors active.",
        createdAt: new Date("2026-03-01T00:00:00.000Z"),
        updatedAt: new Date("2026-03-02T00:00:00.000Z"),
        ownerEmployee: {
          id: "emp_manager_1",
          firstName: "Morgan",
          lastName: "Patel",
          title: "Site Supervisor",
          department: "Operations",
          avatarUrl: null,
        },
        collaborators: [],
        allowedManagers: [],
        candidates: [
          {
            id: "candidate_1",
            readiness: SuccessionReadiness.READY_NOW,
            riskOfLoss: SuccessionAssessmentLevel.HIGH,
            confidence: SuccessionAssessmentLevel.MEDIUM,
            proposedByRole: UserRole.HR_ADMIN,
            sortOrder: 1,
            createdAt: new Date("2026-03-01T00:00:00.000Z"),
            updatedAt: new Date("2026-03-02T00:00:00.000Z"),
            candidateEmployee: {
              id: "emp_employee_1",
              firstName: "Elliot",
              lastName: "Barnes",
              title: "Foreman",
              department: "Operations",
              avatarUrl: null,
              managerId: "emp_manager_1",
            },
            proposedByEmployee: {
              id: "emp_hr_admin_1",
              firstName: "Harper",
              lastName: "Quinn",
              title: "Office Admin",
              department: "Admin/Finance",
              avatarUrl: null,
            },
            notes: [
              {
                id: "note_hr_only",
                visibility: SuccessionNoteVisibility.HR_ONLY,
                body: "Sensitive note",
                authorRole: UserRole.HR_ADMIN,
                createdAt: new Date("2026-03-03T00:00:00.000Z"),
                authorEmployee: {
                  id: "emp_hr_admin_1",
                  firstName: "Harper",
                  lastName: "Quinn",
                  title: "Office Admin",
                  avatarUrl: null,
                },
              },
              {
                id: "note_visible",
                visibility: SuccessionNoteVisibility.PLAN_VIEWERS,
                body: "Visible note",
                authorRole: UserRole.MANAGER,
                createdAt: new Date("2026-03-04T00:00:00.000Z"),
                authorEmployee: {
                  id: "emp_manager_1",
                  firstName: "Morgan",
                  lastName: "Patel",
                  title: "Site Supervisor",
                  avatarUrl: null,
                },
              },
            ],
            snapshots: [
              {
                id: "snapshot_1",
                cycleId: "cycle_1",
                scorecardOverallRating: 4,
                scorecardPercent: 87,
                finalRatingSource: "SCORECARD",
                calibrationPerformanceBucket: "HIGH",
                calibrationPotentialBucket: "MEDIUM",
                snapshotDepartment: "Operations",
                snapshotTitle: "Foreman",
                snapshotManagerName: "Morgan Patel",
                createdAt: new Date("2026-03-04T00:00:00.000Z"),
              },
            ],
          },
        ],
      },
    });

    const detail = await getSuccessionPositionDetail("position_1", managerContext, db as never);

    expect(detail.candidates[0]?.riskOfLoss).toBeNull();
    expect(detail.candidates[0]?.confidence).toBeNull();
    expect(detail.candidates[0]?.notes).toHaveLength(1);
    expect(detail.candidates[0]?.notes[0]?.body).toBe("Visible note");
  });
});

describe("createSuccessionCandidate", () => {
  it("rejects manager proposals for non-direct reports", async () => {
    const db = buildDbMock();

    db.employee.findFirst.mockResolvedValue({
      id: "emp_manager_1",
      firstName: "Morgan",
      lastName: "Patel",
      department: "Operations",
      title: "Site Supervisor",
      directReports: [{ id: "emp_employee_2" }],
    });

    db.position.findFirst.mockResolvedValue({
      id: "position_1",
      title: "Operations Superintendent",
      department: "Operations",
      location: "Edmonton",
      isCritical: true,
      status: PositionStatus.ACTIVE,
      createdAt: new Date("2026-03-01T00:00:00.000Z"),
      updatedAt: new Date("2026-03-02T00:00:00.000Z"),
      incumbentEmployee: null,
      plan: {
        id: "plan_1",
        visibilityScope: SuccessionVisibilityScope.MANAGERS_IN_SCOPE,
        reviewCadence: "Quarterly",
        notes: null,
        createdAt: new Date("2026-03-01T00:00:00.000Z"),
        updatedAt: new Date("2026-03-02T00:00:00.000Z"),
        ownerEmployee: {
          id: "emp_manager_1",
          firstName: "Morgan",
          lastName: "Patel",
          title: "Site Supervisor",
          department: "Operations",
          avatarUrl: null,
        },
        collaborators: [],
        allowedManagers: [],
        candidates: [],
      },
    });

    await expect(
      createSuccessionCandidate(
        "position_1",
        {
          candidateEmployeeId: "emp_employee_9",
          readiness: SuccessionReadiness.ONE_TO_TWO_YEARS,
        },
        managerContext,
        db as never,
      ),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });

    expect(db.successionCandidate.create).not.toHaveBeenCalled();
  });
});

describe("updateSuccessionCandidate", () => {
  it("writes the sensitive-field audit action when HR changes risk or confidence", async () => {
    const db = buildDbMock();

    db.employee.findFirst.mockResolvedValue({
      id: "emp_hr_admin_1",
      firstName: "Harper",
      lastName: "Quinn",
      department: "Admin/Finance",
      title: "Office Admin",
      directReports: [],
    });
    db.successionCandidate.findFirst.mockResolvedValue({
      id: "candidate_1",
      plan: {
        positionId: "position_1",
      },
      readiness: SuccessionReadiness.ONE_TO_TWO_YEARS,
      riskOfLoss: SuccessionAssessmentLevel.LOW,
      confidence: SuccessionAssessmentLevel.LOW,
      sortOrder: 2,
    });
    db.successionCandidate.update.mockResolvedValue({ id: "candidate_1" });
    db.reviewPacket.findFirst.mockResolvedValue({
      cycleId: "cycle_1",
      scorecardOverallRating: 4,
      totalScorecardPercent: 86,
      finalRatingSource: "SCORECARD",
      snapshotDepartment: "Operations",
      snapshotTitle: "Foreman",
      snapshotManagerEmployeeId: "emp_manager_1",
      snapshotManagerName: "Morgan Patel",
    });
    db.calibrationPlacement.findFirst.mockResolvedValue({
      performanceBucket: "HIGH",
      potentialBucket: "MEDIUM",
    });
    db.successionCandidateSnapshot.upsert.mockResolvedValue({ id: "snapshot_1" });
    db.auditEvent.create.mockResolvedValue({ id: "audit_1" });

    await updateSuccessionCandidate(
      "candidate_1",
      {
        riskOfLoss: SuccessionAssessmentLevel.HIGH,
        confidence: SuccessionAssessmentLevel.MEDIUM,
      },
      hrContext,
      db as never,
    );

    expect(db.auditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "SUCCESSION_CANDIDATE_SENSITIVE_FIELDS_UPDATED",
        }),
      }),
    );
  });
});

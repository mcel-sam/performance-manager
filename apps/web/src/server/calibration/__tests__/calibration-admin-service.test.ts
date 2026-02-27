import { CalibrationBucket, CycleStatus, UserRole } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { createCalibrationSession } from "@/server/calibration/calibration-admin-service";

function buildDbMock() {
  return {
    reviewCycle: {
      findFirst: vi.fn(),
    },
    employee: {
      findMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
    calibrationSession: {
      create: vi.fn(),
      findMany: vi.fn(),
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

describe("createCalibrationSession", () => {
  it("creates a session for HR admin and writes an audit event", async () => {
    const db = buildDbMock();

    db.reviewCycle.findFirst.mockResolvedValue({
      id: "cycle_seed_draft_1",
      name: "Seed Draft Cycle",
      status: CycleStatus.DRAFT,
    });

    db.employee.findMany.mockResolvedValue([
      { id: "emp_employee_1" },
      { id: "emp_peer_1" },
    ]);

    db.user.findMany.mockResolvedValue([
      { id: "user_hr_admin_1", role: UserRole.HR_ADMIN },
      { id: "user_manager_1", role: UserRole.MANAGER },
    ]);

    db.calibrationSession.create.mockResolvedValue({
      id: "calibration_session_1",
      name: "Q2 Calibration",
      roleGroup: "Core Engineering",
      isFinalized: false,
      createdAt: new Date("2026-03-11T08:00:00.000Z"),
      cycle: {
        id: "cycle_seed_draft_1",
        name: "Seed Draft Cycle",
        status: CycleStatus.DRAFT,
      },
      placements: [{ id: "placement_1" }, { id: "placement_2" }],
      participants: [{ id: "participant_1" }, { id: "participant_2" }],
    });

    db.auditEvent.create.mockResolvedValue({ id: "audit_1" });

    const result = await createCalibrationSession(
      {
        cycleId: "cycle_seed_draft_1",
        name: "Q2 Calibration",
        roleGroup: "Core Engineering",
        description: "Quarterly calibration for core engineering.",
        cohortEmployeeIds: ["emp_employee_1", "emp_peer_1"],
        participantUserIds: ["user_manager_1"],
        performanceAxis: [
          {
            bucket: CalibrationBucket.LOW,
            label: "Support needed",
            description: "Below expected outcomes.",
          },
          {
            bucket: CalibrationBucket.MEDIUM,
            label: "Meeting outcomes",
            description: "Consistent delivery in role.",
          },
          {
            bucket: CalibrationBucket.HIGH,
            label: "Outstanding outcomes",
            description: "Sustained high impact.",
          },
        ],
        potentialAxis: [
          {
            bucket: CalibrationBucket.LOW,
            label: "Current scope",
            description: "Operating in current scope.",
          },
          {
            bucket: CalibrationBucket.MEDIUM,
            label: "Growth ready",
            description: "Ready for broader scope with support.",
          },
          {
            bucket: CalibrationBucket.HIGH,
            label: "Accelerated growth",
            description: "Ready for significantly broader scope.",
          },
        ],
      },
      hrAdminContext,
      db as never,
    );

    expect(result.id).toBe("calibration_session_1");
    expect(result.cohortCount).toBe(2);
    expect(result.participantCount).toBe(2);
    expect(db.calibrationSession.create).toHaveBeenCalledTimes(1);
    expect(db.auditEvent.create).toHaveBeenCalledTimes(1);
  });

  it("denies create when user is not HR admin or calibrator", async () => {
    const db = buildDbMock();

    await expect(
      createCalibrationSession(
        {
          cycleId: "cycle_seed_draft_1",
          name: "Q2 Calibration",
          roleGroup: "Core Engineering",
          cohortEmployeeIds: ["emp_employee_1"],
          participantUserIds: ["user_manager_1"],
        },
        managerContext,
        db as never,
      ),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });

    expect(db.reviewCycle.findFirst).not.toHaveBeenCalled();
    expect(db.auditEvent.create).not.toHaveBeenCalled();
  });
});

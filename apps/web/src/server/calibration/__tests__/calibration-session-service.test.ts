import {
  CalibrationBucket,
  CycleStatus,
  FinalRatingSource,
  ReviewSubmissionStatus,
  UserRole,
} from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import {
  finalizeCalibrationSession,
  getCalibrationExportPlaceholder,
  getCalibrationSessionData,
  moveCalibrationPlacement,
} from "@/server/calibration/calibration-session-service";

function buildDbMock() {
  return {
    calibrationSession: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    calibrationSnapshot: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    calibrationPlacement: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    employee: {
      findFirst: vi.fn(),
    },
    reviewPacket: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
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

function buildSessionRecord(overrides?: { isFinalized?: boolean }) {
  return {
    id: "calibration_session_seed_1",
    orgId: "org_demo_1",
    cycleId: "cycle_seed_draft_1",
    name: "Core Engineering Calibration",
    isFinalized: overrides?.isFinalized ?? false,
    finalizedAt: null,
    cycle: {
      id: "cycle_seed_draft_1",
      name: "Seed Draft Cycle",
      status: CycleStatus.LOCKED,
    },
    placements: [
      {
        id: "placement_employee_1",
        employeeId: "emp_employee_1",
        performanceBucket: CalibrationBucket.HIGH,
        potentialBucket: CalibrationBucket.MEDIUM,
        justificationNote: null,
        employee: {
          id: "emp_employee_1",
          firstName: "Elliot",
          lastName: "Employee",
          managerId: "emp_manager_1",
          manager: {
            id: "emp_manager_1",
            firstName: "Morgan",
            lastName: "Manager",
          },
        },
      },
    ],
  };
}

describe("moveCalibrationPlacement", () => {
  it("allows authorized user move and writes audit event", async () => {
    const db = buildDbMock();

    db.calibrationPlacement.findFirst.mockResolvedValue({
      id: "placement_employee_1",
      employeeId: "emp_employee_1",
      performanceBucket: CalibrationBucket.MEDIUM,
      potentialBucket: CalibrationBucket.MEDIUM,
      justificationNote: null,
      employee: {
        id: "emp_employee_1",
        managerId: "emp_manager_1",
      },
      session: {
        id: "calibration_session_seed_1",
        cycleId: "cycle_seed_draft_1",
        isFinalized: false,
      },
    });

    db.calibrationPlacement.update.mockResolvedValue({
      id: "placement_employee_1",
      employeeId: "emp_employee_1",
      performanceBucket: CalibrationBucket.HIGH,
      potentialBucket: CalibrationBucket.HIGH,
      justificationNote: "Strong impact across cross-functional initiatives.",
      updatedAt: new Date("2026-03-10T09:00:00.000Z"),
    });
    db.auditEvent.create.mockResolvedValue({ id: "audit_placement_move_1" });

    const result = await moveCalibrationPlacement(
      {
        sessionId: "calibration_session_seed_1",
        employeeId: "emp_employee_1",
        performanceBucket: CalibrationBucket.HIGH,
        potentialBucket: CalibrationBucket.HIGH,
        justificationNote: "Strong impact across cross-functional initiatives.",
      },
      hrAdminContext,
      db as never,
    );

    expect(result.performanceBucket).toBe(CalibrationBucket.HIGH);
    expect(result.potentialBucket).toBe(CalibrationBucket.HIGH);
    expect(result.justificationNote).toBe("Strong impact across cross-functional initiatives.");
    expect(db.calibrationPlacement.update).toHaveBeenCalledTimes(1);
    expect(db.auditEvent.create).toHaveBeenCalledTimes(1);
    expect(db.auditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            noteLength: "Strong impact across cross-functional initiatives.".length,
          }),
        }),
      }),
    );
  });

  it("blocks unauthorized user from moving placement", async () => {
    const db = buildDbMock();

    db.calibrationPlacement.findFirst.mockResolvedValue({
      id: "placement_manager_1",
      employeeId: "emp_manager_1",
      performanceBucket: CalibrationBucket.HIGH,
      potentialBucket: CalibrationBucket.HIGH,
      justificationNote: null,
      employee: {
        id: "emp_manager_1",
        managerId: "emp_hr_admin_1",
      },
      session: {
        id: "calibration_session_seed_1",
        cycleId: "cycle_seed_draft_1",
        isFinalized: false,
      },
    });

    db.employee.findFirst.mockResolvedValue({
      id: "emp_manager_1",
    });

    await expect(
      moveCalibrationPlacement(
        {
          sessionId: "calibration_session_seed_1",
          employeeId: "emp_manager_1",
          performanceBucket: CalibrationBucket.MEDIUM,
          potentialBucket: CalibrationBucket.MEDIUM,
        },
        managerContext,
        db as never,
      ),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });

    expect(db.calibrationPlacement.update).not.toHaveBeenCalled();
    expect(db.auditEvent.create).not.toHaveBeenCalled();
  });

  it("rejects placement move after session is finalized", async () => {
    const db = buildDbMock();

    db.calibrationPlacement.findFirst.mockResolvedValue({
      id: "placement_employee_1",
      employeeId: "emp_employee_1",
      performanceBucket: CalibrationBucket.HIGH,
      potentialBucket: CalibrationBucket.MEDIUM,
      justificationNote: null,
      employee: {
        id: "emp_employee_1",
        managerId: "emp_manager_1",
      },
      session: {
        id: "calibration_session_seed_1",
        cycleId: "cycle_seed_draft_1",
        isFinalized: true,
      },
    });

    await expect(
      moveCalibrationPlacement(
        {
          sessionId: "calibration_session_seed_1",
          employeeId: "emp_employee_1",
          performanceBucket: CalibrationBucket.MEDIUM,
          potentialBucket: CalibrationBucket.MEDIUM,
        },
        hrAdminContext,
        db as never,
      ),
    ).rejects.toMatchObject({
      code: "READ_ONLY",
      status: 409,
    });

    expect(db.calibrationPlacement.update).not.toHaveBeenCalled();
  });
});

describe("getCalibrationSessionData", () => {
  it("returns session data for authorized fetch", async () => {
    const db = buildDbMock();

    db.calibrationSession.findFirst.mockResolvedValue(buildSessionRecord());
    db.reviewPacket.findMany.mockResolvedValue([
      {
        subjectEmployeeId: "emp_employee_1",
        submissions: [
          { status: ReviewSubmissionStatus.SUBMITTED },
          { status: ReviewSubmissionStatus.NOT_STARTED },
        ],
      },
    ]);

    const result = await getCalibrationSessionData(
      "calibration_session_seed_1",
      hrAdminContext,
      db as never,
    );

    expect(result.session.id).toBe("calibration_session_seed_1");
    expect(result.placements).toHaveLength(1);
    expect(result.viewer.canFinalize).toBe(true);
    expect(result.placements[0]?.packetSummary.submittedCount).toBe(1);
  });

  it("denies unauthorized session access", async () => {
    const db = buildDbMock();

    db.calibrationSession.findFirst.mockResolvedValue(buildSessionRecord());
    db.employee.findFirst.mockResolvedValue({ id: "emp_employee_1" });

    await expect(
      getCalibrationSessionData("calibration_session_seed_1", employeeContext, db as never),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });

    expect(db.reviewPacket.findMany).not.toHaveBeenCalled();
  });
});

describe("finalizeCalibrationSession", () => {
  it("creates snapshot, locks session, and writes audit event", async () => {
    const db = buildDbMock();

    db.calibrationSession.findFirst.mockResolvedValue(buildSessionRecord());
    db.calibrationSnapshot.create.mockResolvedValue({
      id: "snapshot_1",
      createdAt: new Date("2026-03-10T12:00:00.000Z"),
    });
    db.calibrationSession.update.mockResolvedValue({
      id: "calibration_session_seed_1",
      isFinalized: true,
      finalizedAt: new Date("2026-03-10T12:00:00.000Z"),
    });
    db.reviewPacket.updateMany.mockResolvedValue({ count: 1 });
    db.auditEvent.create.mockResolvedValue({ id: "audit_finalize_1" });

    const result = await finalizeCalibrationSession(
      "calibration_session_seed_1",
      hrAdminContext,
      db as never,
    );

    expect(result.isFinalized).toBe(true);
    expect(result.snapshotId).toBe("snapshot_1");
    expect(db.calibrationSnapshot.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sessionId: "calibration_session_seed_1",
          snapshot: expect.objectContaining({
            sessionId: "calibration_session_seed_1",
            placements: expect.arrayContaining([
              expect.objectContaining({
                employeeId: "emp_employee_1",
                performanceBucket: CalibrationBucket.HIGH,
                potentialBucket: CalibrationBucket.MEDIUM,
              }),
            ]),
          }),
        }),
      }),
    );
    expect(db.calibrationSession.update).toHaveBeenCalledTimes(1);
    expect(db.reviewPacket.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          finalRatingSource: FinalRatingSource.CALIBRATION,
        }),
      }),
    );
    expect(db.auditEvent.create).toHaveBeenCalledTimes(1);
  });

  it("rejects finalize when user is unauthorized", async () => {
    const db = buildDbMock();

    await expect(
      finalizeCalibrationSession("calibration_session_seed_1", managerContext, db as never),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });

    expect(db.calibrationSession.findFirst).not.toHaveBeenCalled();
  });

  it("finalize lock causes subsequent placement update rejection", async () => {
    const db = buildDbMock();

    db.calibrationSession.findFirst.mockResolvedValue(buildSessionRecord());
    db.calibrationSnapshot.create.mockResolvedValue({
      id: "snapshot_2",
      createdAt: new Date("2026-03-10T12:00:00.000Z"),
    });
    db.calibrationSession.update.mockResolvedValue({
      id: "calibration_session_seed_1",
      isFinalized: true,
      finalizedAt: new Date("2026-03-10T12:00:00.000Z"),
    });
    db.reviewPacket.updateMany.mockResolvedValue({ count: 1 });
    db.auditEvent.create.mockResolvedValue({ id: "audit_finalize_2" });

    await finalizeCalibrationSession("calibration_session_seed_1", hrAdminContext, db as never);

    db.calibrationPlacement.findFirst.mockResolvedValue({
      id: "placement_employee_1",
      employeeId: "emp_employee_1",
      performanceBucket: CalibrationBucket.HIGH,
      potentialBucket: CalibrationBucket.MEDIUM,
      employee: {
        id: "emp_employee_1",
        managerId: "emp_manager_1",
      },
      session: {
        id: "calibration_session_seed_1",
        cycleId: "cycle_seed_draft_1",
        isFinalized: true,
      },
    });

    await expect(
      moveCalibrationPlacement(
        {
          sessionId: "calibration_session_seed_1",
          employeeId: "emp_employee_1",
          performanceBucket: CalibrationBucket.LOW,
          potentialBucket: CalibrationBucket.LOW,
        },
        hrAdminContext,
        db as never,
      ),
    ).rejects.toMatchObject({
      code: "READ_ONLY",
      status: 409,
    });
  });
});

describe("getCalibrationExportPlaceholder", () => {
  it("returns export placeholder metadata for authorized users", async () => {
    const db = buildDbMock();
    db.calibrationSession.findFirst.mockResolvedValue(buildSessionRecord());
    db.calibrationSnapshot.findFirst.mockResolvedValue({
      id: "snapshot_1",
      createdAt: new Date("2026-03-10T12:00:00.000Z"),
    });
    db.reviewPacket.findMany.mockResolvedValue([]);

    const result = await getCalibrationExportPlaceholder(
      "calibration_session_seed_1",
      hrAdminContext,
      db as never,
    );

    expect(result.snapshotId).toBe("snapshot_1");
    expect(result.message).toContain("download");
  });

  it("denies export placeholder access for unauthorized users", async () => {
    const db = buildDbMock();
    db.calibrationSession.findFirst.mockResolvedValue(buildSessionRecord());
    db.employee.findFirst.mockResolvedValue({ id: "emp_employee_1" });

    await expect(
      getCalibrationExportPlaceholder("calibration_session_seed_1", employeeContext, db as never),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
  });
});

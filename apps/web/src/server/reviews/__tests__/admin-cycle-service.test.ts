import { CycleStatus, CycleVisibilityPolicy, ReviewRelationship, UserRole } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import {
  createReviewCycle,
  generateCycleArtifacts,
} from "@/server/reviews/admin-cycle-service";

const adminContext = {
  userId: "user_admin_1",
  orgId: "org_demo_1",
  role: UserRole.HR_ADMIN,
};

function buildDbMock() {
  return {
    reviewCycle: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    employee: {
      findMany: vi.fn(),
    },
    reviewPacket: {
      createMany: vi.fn(),
      findMany: vi.fn(),
    },
    reviewSubmission: {
      createMany: vi.fn(),
    },
    auditEvent: {
      create: vi.fn(),
    },
  };
}

describe("createReviewCycle", () => {
  it("creates a draft cycle and writes an audit event", async () => {
    const db = buildDbMock();
    db.reviewCycle.create.mockResolvedValue({
      id: "cycle_1",
      orgId: adminContext.orgId,
      name: "Q2 Review Cycle",
      startDate: new Date("2026-04-01T00:00:00.000Z"),
      endDate: new Date("2026-04-30T00:00:00.000Z"),
      status: CycleStatus.DRAFT,
      visibilityPolicy: CycleVisibilityPolicy.EMPLOYEE_AFTER_RELEASE,
      selfReviewRequired: true,
      managerReviewRequired: true,
      peerReviewCount: 1,
      upwardReviewCount: 0,
    });
    db.auditEvent.create.mockResolvedValue({ id: "audit_1" });

    const result = await createReviewCycle(
      {
        name: "Q2 Review Cycle",
        startDate: "2026-04-01T00:00:00.000Z",
        endDate: "2026-04-30T00:00:00.000Z",
        peerReviewCount: 1,
      },
      adminContext,
      db as never,
    );

    expect(result.id).toBe("cycle_1");
    expect(db.reviewCycle.create).toHaveBeenCalledTimes(1);
    expect(db.auditEvent.create).toHaveBeenCalledTimes(1);
  });

  it("rejects non-admin users", async () => {
    const db = buildDbMock();

    await expect(
      createReviewCycle(
        {
          name: "Q2 Review Cycle",
          startDate: "2026-04-01T00:00:00.000Z",
          endDate: "2026-04-30T00:00:00.000Z",
        },
        {
          ...adminContext,
          role: UserRole.MANAGER,
        },
        db as never,
      ),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
  });

  it("rejects invalid date ranges", async () => {
    const db = buildDbMock();

    await expect(
      createReviewCycle(
        {
          name: "Invalid cycle",
          startDate: "2026-04-30T00:00:00.000Z",
          endDate: "2026-04-01T00:00:00.000Z",
        },
        adminContext,
        db as never,
      ),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      status: 400,
    });
  });
});

describe("generateCycleArtifacts", () => {
  it("creates packets and submissions for a draft cycle", async () => {
    const db = buildDbMock();
    db.reviewCycle.findFirst.mockResolvedValue({
      id: "cycle_1",
      orgId: adminContext.orgId,
      status: CycleStatus.DRAFT,
      selfReviewRequired: true,
      managerReviewRequired: true,
      peerReviewCount: 0,
      upwardReviewCount: 0,
    });
    db.employee.findMany.mockResolvedValue([
      { id: "emp_a", managerId: null },
      { id: "emp_b", managerId: "emp_a" },
    ]);
    db.reviewPacket.createMany.mockResolvedValue({ count: 2 });
    db.reviewPacket.findMany.mockResolvedValue([
      { id: "packet_a", subjectEmployeeId: "emp_a" },
      { id: "packet_b", subjectEmployeeId: "emp_b" },
    ]);
    db.reviewSubmission.createMany.mockResolvedValue({ count: 3 });
    db.auditEvent.create.mockResolvedValue({ id: "audit_2" });

    const result = await generateCycleArtifacts("cycle_1", adminContext, db as never);

    expect(result).toEqual({ packetCount: 2, submissionCount: 3 });
    expect(db.reviewSubmission.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({
            subjectEmployeeId: "emp_a",
            reviewerEmployeeId: "emp_a",
            relationship: ReviewRelationship.SELF,
          }),
          expect.objectContaining({
            subjectEmployeeId: "emp_b",
            reviewerEmployeeId: "emp_b",
            relationship: ReviewRelationship.SELF,
          }),
          expect.objectContaining({
            subjectEmployeeId: "emp_b",
            reviewerEmployeeId: "emp_a",
            relationship: ReviewRelationship.MANAGER,
          }),
        ]),
      }),
    );
  });

  it("rejects generation when cycle is not in draft status", async () => {
    const db = buildDbMock();
    db.reviewCycle.findFirst.mockResolvedValue({
      id: "cycle_1",
      orgId: adminContext.orgId,
      status: CycleStatus.ACTIVE,
      selfReviewRequired: true,
      managerReviewRequired: true,
      peerReviewCount: 0,
      upwardReviewCount: 0,
    });

    await expect(generateCycleArtifacts("cycle_1", adminContext, db as never)).rejects.toMatchObject(
      {
        code: "INVALID_CYCLE_STATE",
        status: 409,
      },
    );
  });
});

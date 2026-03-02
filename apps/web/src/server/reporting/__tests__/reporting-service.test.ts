import {
  FinalRatingSource,
  ReviewRelationship,
  ReviewSubmissionStatus,
  UserRole,
} from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import {
  getReportingProgress,
  getReportingRatings,
  listReportingCycles,
} from "@/server/reporting/reporting-service";

function createReportingDbMock() {
  return {
    reviewCycle: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    reviewPacket: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    reviewAnswer: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    calibrationPlacement: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    improvementPlan: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  };
}

const hrAdminContext = {
  userId: "user_hr_admin_1",
  orgId: "org_demo_1",
  role: UserRole.HR_ADMIN,
} as const;

const managerContext = {
  userId: "user_manager_1",
  orgId: "org_demo_1",
  role: UserRole.MANAGER,
} as const;

function buildPacketRecord(overrides: {
  id: string;
  subjectEmployeeId: string;
  selfStatus: ReviewSubmissionStatus;
  managerStatus: ReviewSubmissionStatus;
  scorecardOverallRating?: number | null;
  finalRatingSource?: FinalRatingSource | null;
  snapshotDepartment?: string | null;
  snapshotTitle?: string | null;
}) {
  return {
    id: overrides.id,
    subjectEmployeeId: overrides.subjectEmployeeId,
    snapshotDepartment: overrides.snapshotDepartment ?? "Operations",
    snapshotTitle: overrides.snapshotTitle ?? "Foreman",
    scorecardOverallRating: overrides.scorecardOverallRating ?? null,
    finalRatingSource: overrides.finalRatingSource ?? null,
    totalScorecardPercent: 81,
    subjectEmployee: {
      firstName: "Elliot",
      lastName: "Employee",
    },
    submissions: [
      {
        relationship: ReviewRelationship.SELF,
        status: overrides.selfStatus,
      },
      {
        relationship: ReviewRelationship.MANAGER,
        status: overrides.managerStatus,
      },
    ],
  };
}

describe("reporting-service", () => {
  it("aggregates progress totals and self/manager splits", async () => {
    const db = createReportingDbMock();
    db.reviewPacket.findMany.mockResolvedValue([
      buildPacketRecord({
        id: "packet_1",
        subjectEmployeeId: "emp_1",
        selfStatus: ReviewSubmissionStatus.NOT_STARTED,
        managerStatus: ReviewSubmissionStatus.NOT_STARTED,
      }),
      buildPacketRecord({
        id: "packet_2",
        subjectEmployeeId: "emp_2",
        selfStatus: ReviewSubmissionStatus.IN_PROGRESS,
        managerStatus: ReviewSubmissionStatus.NOT_STARTED,
      }),
      buildPacketRecord({
        id: "packet_3",
        subjectEmployeeId: "emp_3",
        selfStatus: ReviewSubmissionStatus.SUBMITTED,
        managerStatus: ReviewSubmissionStatus.SUBMITTED,
      }),
    ]);

    const result = await getReportingProgress(
      {
        cycleId: "cycle_seed_1",
        smallNThreshold: 1,
      },
      hrAdminContext,
      db as never,
    );

    expect(result.suppression.suppressed).toBe(false);
    expect(result.totals).toEqual({ notStarted: 1, inProgress: 1, completed: 1 });
    expect(result.self).toEqual({ notStarted: 1, inProgress: 1, completed: 1 });
    expect(result.manager).toEqual({ notStarted: 2, inProgress: 0, completed: 1 });
  });

  it("aggregates rating distribution and rating source counts", async () => {
    const db = createReportingDbMock();
    db.reviewPacket.findMany.mockResolvedValue([
      buildPacketRecord({
        id: "packet_1",
        subjectEmployeeId: "emp_1",
        selfStatus: ReviewSubmissionStatus.SUBMITTED,
        managerStatus: ReviewSubmissionStatus.SUBMITTED,
        scorecardOverallRating: 5,
        finalRatingSource: FinalRatingSource.SCORECARD,
      }),
      buildPacketRecord({
        id: "packet_2",
        subjectEmployeeId: "emp_2",
        selfStatus: ReviewSubmissionStatus.SUBMITTED,
        managerStatus: ReviewSubmissionStatus.SUBMITTED,
        scorecardOverallRating: 4,
        finalRatingSource: FinalRatingSource.CALIBRATION,
      }),
      buildPacketRecord({
        id: "packet_3",
        subjectEmployeeId: "emp_3",
        selfStatus: ReviewSubmissionStatus.SUBMITTED,
        managerStatus: ReviewSubmissionStatus.SUBMITTED,
        scorecardOverallRating: 4,
        finalRatingSource: null,
      }),
      buildPacketRecord({
        id: "packet_4",
        subjectEmployeeId: "emp_4",
        selfStatus: ReviewSubmissionStatus.SUBMITTED,
        managerStatus: ReviewSubmissionStatus.SUBMITTED,
        scorecardOverallRating: null,
        finalRatingSource: FinalRatingSource.SCORECARD,
      }),
    ]);

    const result = await getReportingRatings(
      {
        cycleId: "cycle_seed_1",
        ratingSource: "FINAL",
        smallNThreshold: 1,
      },
      hrAdminContext,
      db as never,
    );

    expect(result.suppression.suppressed).toBe(false);
    expect(result.ratedCount).toBe(3);
    expect(result.distribution).toEqual({
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 2,
      "5": 1,
    });
    expect(result.sourceSummary).toEqual({
      scorecard: 2,
      calibration: 1,
      unset: 1,
    });
  });

  it("enforces HR-admin-only reporting access", async () => {
    const db = createReportingDbMock();

    await expect(listReportingCycles(managerContext, db as never)).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });

    expect(db.reviewCycle.findMany).not.toHaveBeenCalled();
  });

  it("filters using snapshot department/title fields", async () => {
    const db = createReportingDbMock();

    await getReportingProgress(
      {
        cycleId: "cycle_seed_1",
        department: "Operations",
        title: "Foreman",
        smallNThreshold: 1,
      },
      hrAdminContext,
      db as never,
    );

    expect(db.reviewPacket.findMany).toHaveBeenCalledTimes(1);

    const query = db.reviewPacket.findMany.mock.calls[0]?.[0] as {
      where: Record<string, unknown>;
    };

    expect(query.where).toMatchObject({
      orgId: "org_demo_1",
      cycleId: "cycle_seed_1",
      snapshotDepartment: "Operations",
      snapshotTitle: "Foreman",
    });
    expect(query.where).not.toHaveProperty("subjectEmployee");
  });
});

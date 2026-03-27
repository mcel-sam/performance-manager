import {
  CompetencyDimensionKey,
  FinalRatingSource,
  GoalStatus,
  ReviewRelationship,
  ReviewSubmissionStatus,
  ScorecardMetricKey,
  UserRole,
} from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import {
  getReportingCompetencies,
  getReportingGoals,
  getReportingManagerOverview,
  getReportingPeople,
  getReportingProgress,
  getReportingRatings,
  getReportingScorecard,
  listReportingCycles,
} from "@/server/reporting/reporting-service";

function createReportingDbMock() {
  return {
    reviewCycle: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    goalCycle: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    reviewPacket: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    goal: {
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
  managerDueAt?: Date | null;
  scorecardOverallRating?: number | null;
  finalRatingSource?: FinalRatingSource | null;
  snapshotDepartment?: string | null;
  snapshotTitle?: string | null;
  snapshotManagerEmployeeId?: string | null;
  snapshotManagerName?: string | null;
}) {
  return {
    id: overrides.id,
    subjectEmployeeId: overrides.subjectEmployeeId,
    snapshotDepartment: overrides.snapshotDepartment ?? "Operations",
    snapshotTitle: overrides.snapshotTitle ?? "Foreman",
    snapshotManagerEmployeeId: overrides.snapshotManagerEmployeeId ?? "mgr_1",
    snapshotManagerName: overrides.snapshotManagerName ?? "Morgan Manager",
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
        dueAt: null,
      },
      {
        relationship: ReviewRelationship.MANAGER,
        status: overrides.managerStatus,
        dueAt: overrides.managerDueAt ?? null,
      },
    ],
  };
}

function buildGoalRecord(overrides: {
  id: string;
  title: string;
  ownerEmployeeId: string;
  status?: GoalStatus;
  progressPercent?: number;
  department?: string | null;
  employeeTitle?: string | null;
  trackId?: string;
  trackName?: string;
  levelId?: string;
  levelName?: string;
  competencyNames?: string[];
  updates?: Array<{ id: string; createdAt: Date; note: string }>;
  keyResults?: Array<{
    id: string;
    title: string;
    type: string;
    currentValue: number | null;
    targetValue: number | null;
  }>;
}) {
  return {
    id: overrides.id,
    title: overrides.title,
    status: overrides.status ?? GoalStatus.ON_TRACK,
    progressPercent: overrides.progressPercent ?? 65,
    ownerEmployeeId: overrides.ownerEmployeeId,
    ownerEmployee: {
      firstName: "Elliot",
      lastName: "Employee",
      department: overrides.department ?? "Operations",
      title: overrides.employeeTitle ?? "Software Engineer",
      trackAssignment: {
        track: {
          id: overrides.trackId ?? "track_software",
          name: overrides.trackName ?? "Software",
        },
        trackLevel: {
          id: overrides.levelId ?? "track_level_senior",
          name: overrides.levelName ?? "Senior",
        },
      },
    },
    keyResults: overrides.keyResults ?? [
      {
        id: `${overrides.id}_kr_1`,
        title: "Ship roadmap milestone",
        type: "PERCENT",
        currentValue: 75,
        targetValue: 100,
      },
    ],
    updates: overrides.updates ?? [
      {
        id: `${overrides.id}_update_1`,
        createdAt: new Date("2026-02-14T00:00:00.000Z"),
        note: "Weekly check-in posted.",
      },
    ],
    competencyLinks: (overrides.competencyNames ?? ["Communication"]).map((name) => ({
      competency: {
        id: `${overrides.id}_${name.toLowerCase().replaceAll(" ", "_")}`,
        name,
      },
    })),
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

  it("returns competency insights with department heatmap and self-manager gap", async () => {
    const db = createReportingDbMock();
    db.reviewPacket.findMany.mockResolvedValue([
      buildPacketRecord({
        id: "packet_1",
        subjectEmployeeId: "emp_1",
        selfStatus: ReviewSubmissionStatus.SUBMITTED,
        managerStatus: ReviewSubmissionStatus.SUBMITTED,
        snapshotDepartment: "Operations",
        snapshotTitle: "Project Engineer",
      }),
      buildPacketRecord({
        id: "packet_2",
        subjectEmployeeId: "emp_2",
        selfStatus: ReviewSubmissionStatus.SUBMITTED,
        managerStatus: ReviewSubmissionStatus.SUBMITTED,
        snapshotDepartment: "Field Operations",
        snapshotTitle: "Foreman",
      }),
    ]);
    db.reviewAnswer.findMany.mockResolvedValue([
      {
        scaleRating: 3,
        notObserved: false,
        submission: { packetId: "packet_1", relationship: ReviewRelationship.SELF },
        question: { dimensionKey: CompetencyDimensionKey.COMMUNICATION },
      },
      {
        scaleRating: 4,
        notObserved: false,
        submission: { packetId: "packet_1", relationship: ReviewRelationship.MANAGER },
        question: { dimensionKey: CompetencyDimensionKey.COMMUNICATION },
      },
      {
        scaleRating: 2,
        notObserved: false,
        submission: { packetId: "packet_2", relationship: ReviewRelationship.SELF },
        question: { dimensionKey: CompetencyDimensionKey.COMMUNICATION },
      },
      {
        scaleRating: 2,
        notObserved: false,
        submission: { packetId: "packet_2", relationship: ReviewRelationship.MANAGER },
        question: { dimensionKey: CompetencyDimensionKey.COMMUNICATION },
      },
      {
        scaleRating: 5,
        notObserved: false,
        submission: { packetId: "packet_1", relationship: ReviewRelationship.SELF },
        question: { dimensionKey: CompetencyDimensionKey.QUALITY_OF_WORK },
      },
      {
        scaleRating: null,
        notObserved: true,
        submission: { packetId: "packet_1", relationship: ReviewRelationship.MANAGER },
        question: { dimensionKey: CompetencyDimensionKey.QUALITY_OF_WORK },
      },
      {
        scaleRating: 4,
        notObserved: false,
        submission: { packetId: "packet_2", relationship: ReviewRelationship.SELF },
        question: { dimensionKey: CompetencyDimensionKey.QUALITY_OF_WORK },
      },
      {
        scaleRating: 5,
        notObserved: false,
        submission: { packetId: "packet_2", relationship: ReviewRelationship.MANAGER },
        question: { dimensionKey: CompetencyDimensionKey.QUALITY_OF_WORK },
      },
    ]);

    const result = await getReportingCompetencies(
      {
        cycleId: "cycle_seed_1",
        smallNThreshold: 1,
      },
      hrAdminContext,
      db as never,
    );

    const communication = result.competencies.find(
      (item) => item.dimensionKey === CompetencyDimensionKey.COMMUNICATION,
    );

    expect(communication).toBeDefined();
    expect(communication?.averageRating).toBe(2.75);
    expect(communication?.self.averageRating).toBe(2.5);
    expect(communication?.manager.averageRating).toBe(3);
    expect(communication?.selfManagerGap.averageGap).toBe(0.5);
    expect(communication?.departmentBreakdown).toEqual([
      { department: "Field Operations", observedCount: 2, averageRating: 2 },
      { department: "Operations", observedCount: 2, averageRating: 3.5 },
    ]);
  });

  it("groups manager accountability stats with direct-report drilldown", async () => {
    const db = createReportingDbMock();
    db.reviewPacket.findMany.mockResolvedValue([
      buildPacketRecord({
        id: "packet_1",
        subjectEmployeeId: "emp_1",
        selfStatus: ReviewSubmissionStatus.SUBMITTED,
        managerStatus: ReviewSubmissionStatus.NOT_STARTED,
        snapshotDepartment: "Operations",
        snapshotManagerEmployeeId: "mgr_1",
        snapshotManagerName: "Morgan Manager",
        managerDueAt: new Date("2026-03-01T00:00:00.000Z"),
      }),
      buildPacketRecord({
        id: "packet_2",
        subjectEmployeeId: "emp_2",
        selfStatus: ReviewSubmissionStatus.IN_PROGRESS,
        managerStatus: ReviewSubmissionStatus.IN_PROGRESS,
        snapshotDepartment: "Operations",
        snapshotManagerEmployeeId: "mgr_1",
        snapshotManagerName: "Morgan Manager",
        managerDueAt: new Date("2026-04-15T00:00:00.000Z"),
      }),
      buildPacketRecord({
        id: "packet_3",
        subjectEmployeeId: "emp_3",
        selfStatus: ReviewSubmissionStatus.SUBMITTED,
        managerStatus: ReviewSubmissionStatus.SUBMITTED,
        snapshotDepartment: "Field Operations",
        snapshotManagerEmployeeId: "mgr_2",
        snapshotManagerName: "Avery Lead",
        managerDueAt: new Date("2026-03-05T00:00:00.000Z"),
      }),
    ]);

    const result = await getReportingManagerOverview(
      {
        cycleId: "cycle_seed_1",
        smallNThreshold: 1,
      },
      hrAdminContext,
      db as never,
    );

    expect(result.summary).toEqual({
      totalManagers: 2,
      managersWithPendingReviews: 1,
      totalDirectReports: 3,
      pendingManagerReviews: 2,
      overdueManagerReviews: 1,
    });
    expect(result.rows[0]).toMatchObject({
      managerId: "mgr_1",
      managerName: "Morgan Manager",
      directReportCount: 2,
      pendingManagerReviewCount: 2,
      awaitingManagerReviewCount: 1,
      inProgressManagerReviewCount: 1,
      overdueManagerReviewCount: 1,
      completedManagerReviewCount: 0,
    });
    expect(result.rows[0]?.reports[0]).toMatchObject({
      employeeId: "emp_1",
      managerStatus: ReviewSubmissionStatus.NOT_STARTED,
      links: {
        packet: null,
      },
    });
  });

  it("does not expose direct packet links in HR people reporting rows", async () => {
    const db = createReportingDbMock();
    db.reviewPacket.findMany.mockResolvedValue([
      buildPacketRecord({
        id: "packet_1",
        subjectEmployeeId: "emp_1",
        selfStatus: ReviewSubmissionStatus.SUBMITTED,
        managerStatus: ReviewSubmissionStatus.IN_PROGRESS,
      }),
    ]);
    db.calibrationPlacement.findMany.mockResolvedValue([]);
    db.improvementPlan.findMany.mockResolvedValue([]);

    const result = await getReportingPeople(
      {
        cycleId: "cycle_seed_1",
        ratingSource: "FINAL",
        page: 1,
        pageSize: 20,
        smallNThreshold: 1,
      },
      hrAdminContext,
      db as never,
    );

    expect(result.rows[0]).toMatchObject({
      employeeId: "emp_1",
      links: {
        packet: null,
      },
    });
  });

  it("aggregates goals adoption, linkage, and track coverage", async () => {
    const db = createReportingDbMock();
    db.reviewCycle.findMany.mockResolvedValue([
      {
        id: "cycle_seed_1",
        name: "Annual Review 2026",
        status: "ACTIVE",
        startDate: new Date("2026-01-01T00:00:00.000Z"),
        endDate: new Date("2026-12-31T00:00:00.000Z"),
        createdAt: new Date("2025-12-15T00:00:00.000Z"),
        packets: [{ id: "packet_1" }],
      },
    ]);
    db.goalCycle.findMany.mockResolvedValue([
      {
        id: "goal_cycle_2026",
        name: "FY26 Goals",
        startDate: new Date("2026-01-01T00:00:00.000Z"),
        endDate: new Date("2026-12-31T00:00:00.000Z"),
        goals: [{ id: "goal_1" }, { id: "goal_2" }],
      },
    ]);
    db.goal.findMany.mockResolvedValue([
      buildGoalRecord({
        id: "goal_1",
        title: "Improve platform reliability",
        ownerEmployeeId: "emp_1",
        status: GoalStatus.ON_TRACK,
        progressPercent: 82,
        trackId: "track_software",
        trackName: "Software",
        levelName: "Senior",
        competencyNames: ["Communication", "Accountability"],
      }),
      buildGoalRecord({
        id: "goal_2",
        title: "Tighten data quality checks",
        ownerEmployeeId: "emp_2",
        status: GoalStatus.OFF_TRACK,
        progressPercent: 34,
        department: "Data",
        employeeTitle: "Analytics Engineer",
        trackId: "track_data",
        trackName: "Data",
        levelName: "Associate",
        competencyNames: ["Judgment"],
        updates: [],
      }),
    ]);

    const result = await getReportingGoals(
      {
        cycleId: "cycle_seed_1",
        track: "track_software",
        smallNThreshold: 1,
      },
      hrAdminContext,
      db as never,
    );

    expect(result.summary).toEqual({
      goalCycleName: "FY26 Goals",
      activeGoals: 1,
      offTrackGoals: 0,
      noUpdateGoals: 0,
      completionRate: 0,
    });
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      title: "Improve platform reliability",
      trackName: "Software",
      levelName: "Senior",
      competencyNames: ["Accountability", "Communication"],
    });
    expect(result.linkage).toEqual([
      expect.objectContaining({
        competencyName: "Accountability",
        goalCount: 1,
        onTrackCount: 1,
        offTrackCount: 0,
      }),
      expect.objectContaining({
        competencyName: "Communication",
        goalCount: 1,
        onTrackCount: 1,
        offTrackCount: 0,
      }),
    ]);
    expect(result.trackCoverage).toEqual([
      expect.objectContaining({
        trackId: "track_software",
        trackName: "Software",
        levelName: "Senior",
        employeeCount: 1,
        goalCount: 1,
      }),
    ]);
    expect(result.filters.tracks).toEqual([
      { value: "track_data", label: "Data" },
      { value: "track_software", label: "Software" },
    ]);

    expect(db.goal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          orgId: "org_demo_1",
          cycleId: "goal_cycle_2026",
        }),
      }),
    );
  });

  it("returns scorecard metrics with Not Observed counts and gaps", async () => {
    const db = createReportingDbMock();
    db.reviewPacket.findMany.mockResolvedValue([
      buildPacketRecord({
        id: "packet_1",
        subjectEmployeeId: "emp_1",
        selfStatus: ReviewSubmissionStatus.SUBMITTED,
        managerStatus: ReviewSubmissionStatus.SUBMITTED,
        snapshotDepartment: "Operations",
      }),
      buildPacketRecord({
        id: "packet_2",
        subjectEmployeeId: "emp_2",
        selfStatus: ReviewSubmissionStatus.SUBMITTED,
        managerStatus: ReviewSubmissionStatus.SUBMITTED,
        snapshotDepartment: "Field Operations",
      }),
    ]);
    db.reviewAnswer.findMany.mockResolvedValue([
      {
        scaleRating: 5,
        notObserved: false,
        submission: { packetId: "packet_1", relationship: ReviewRelationship.SELF },
        question: { dimensionKey: CompetencyDimensionKey.QUALITY_OF_WORK },
      },
      {
        scaleRating: null,
        notObserved: true,
        submission: { packetId: "packet_1", relationship: ReviewRelationship.MANAGER },
        question: { dimensionKey: CompetencyDimensionKey.QUALITY_OF_WORK },
      },
      {
        scaleRating: 4,
        notObserved: false,
        submission: { packetId: "packet_2", relationship: ReviewRelationship.SELF },
        question: { dimensionKey: CompetencyDimensionKey.QUALITY_OF_WORK },
      },
      {
        scaleRating: 5,
        notObserved: false,
        submission: { packetId: "packet_2", relationship: ReviewRelationship.MANAGER },
        question: { dimensionKey: CompetencyDimensionKey.QUALITY_OF_WORK },
      },
    ]);

    const result = await getReportingScorecard(
      {
        cycleId: "cycle_seed_1",
        smallNThreshold: 1,
      },
      hrAdminContext,
      db as never,
    );

    const qualityMetric = result.metrics.find(
      (metric) => metric.metricKey === ScorecardMetricKey.QUALITY_OF_WORK,
    );

    expect(qualityMetric).toBeDefined();
    expect(qualityMetric?.observedCount).toBe(3);
    expect(qualityMetric?.notObservedCount).toBe(1);
    expect(qualityMetric?.averageRating).toBe(4.67);
    expect(qualityMetric?.self.averageRating).toBe(4.5);
    expect(qualityMetric?.manager.averageRating).toBe(5);
    expect(qualityMetric?.selfManagerGap.averageGap).toBe(1);
  });

  it("enforces HR-admin-only scorecard access", async () => {
    const db = createReportingDbMock();

    await expect(
      getReportingScorecard(
        {
          cycleId: "cycle_seed_1",
          smallNThreshold: 1,
        },
        managerContext,
        db as never,
      ),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
  });
});
